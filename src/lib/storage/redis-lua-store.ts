// src/lib/storage/redis-lua-store.ts

import Redis from "ioredis";
import type { BucketId } from "@/domain/types/brand";
import { toMilliseconds } from "@/domain/types/brand";
import type { BucketConfig } from "@/domain/bucket/bucket-state";
import type { Result } from "@/domain/types/result";
import type { RateLimitError } from "@/domain/errors/rate-limit-error";
import { ok, err } from "@/domain/types/result";
import { storageError, bucketOverflow } from "@/domain/errors/rate-limit-error";

const BUCKET_TTL_SECONDS = 3600;
const KEY_PREFIX = "rl:bucket:";

const LUA_SCRIPT = `
local raw = redis.call('GET', KEYS[1])
local waterLevel = 0
local lastLeakTimestamp = tonumber(ARGV[2])
if raw then
  local data = cjson.decode(raw)
  waterLevel = data.waterLevel
  lastLeakTimestamp = data.lastLeakTimestamp
end
local now = tonumber(ARGV[2])
local elapsedMs = now - lastLeakTimestamp
local leakRatePerMs = tonumber(ARGV[4])
local capacity = tonumber(ARGV[3])
local units = tonumber(ARGV[1])
if elapsedMs > 0 then
  local leaked = elapsedMs * leakRatePerMs
  waterLevel = math.max(0, waterLevel - leaked)
end
local newLevel = waterLevel + units
if newLevel > capacity then
  local overflow = newLevel - capacity
  local retryAfterMs = math.ceil(overflow / leakRatePerMs)
  return {0, waterLevel, capacity, retryAfterMs}
end
local payload = cjson.encode({
  waterLevel = newLevel,
  lastLeakTimestamp = now,
  capacity = capacity,
  leakRatePerMs = leakRatePerMs
})
redis.call('SET', KEYS[1], payload, 'EX', tonumber(ARGV[5]))
return {1, newLevel, capacity, 0}
`;

export interface AtomicConsumeResult {
  readonly allowed: boolean;
  readonly waterLevel: number;
  readonly capacity: number;
  readonly retryAfterMs: number;
}

export class RedisLuaStore {
  constructor(private readonly redis: Redis) {}

  async atomicConsume(
    id: BucketId,
    config: BucketConfig,
    units: number,
    nowMs: number,
  ): Promise<Result<AtomicConsumeResult, RateLimitError>> {
    try {
      const raw = await this.redis.eval(
        LUA_SCRIPT,
        1,
        `${KEY_PREFIX}${id}`,
        String(units),
        String(nowMs),
        String(config.capacity),
        String(config.leakRatePerMs),
        String(BUCKET_TTL_SECONDS),
      ) as [number, number, number, number];

      const [allowed, waterLevel, capacity, retryAfterMs] = raw;

      if (allowed === 0) {
        return err(
          bucketOverflow(
            id,
            toMilliseconds(retryAfterMs),
            waterLevel,
            capacity,
          ),
        );
      }

      return ok({ allowed: true, waterLevel, capacity, retryAfterMs: 0 });
    } catch (cause) {
      return err(storageError("write", cause));
    }
  }
}

export function createRedisLuaStore(url?: string): RedisLuaStore {
  const redis = new Redis(url ?? process.env["REDIS_URL"] ?? "redis://localhost:6379", {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });
  return new RedisLuaStore(redis);
}
