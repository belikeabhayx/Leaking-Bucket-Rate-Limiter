import Redis from "ioredis";
import type { BucketId } from "@/domain/types/brand";
import type { BucketState } from "@/domain/bucket/bucket-state";
import type { BucketStore } from "./bucket-store";
import type { Result } from "@/domain/types/result";
import type { StorageError } from "@/domain/errors/rate-limit-error";
import { ok, err } from "@/domain/types/result";
import { storageError } from "@/domain/errors/rate-limit-error";
import { toCapacity, toLeakRate, toWaterLevel, toTimestamp } from "@/domain/types/brand";

// TTL: auto-expire idle buckets after 1 hour
const BUCKET_TTL_SECONDS = 3600;

const KEY_PREFIX = "rl:bucket:";

function bucketKey(id: BucketId): string {
  return `${KEY_PREFIX}${id}`;
}

function serialize(state: BucketState): string {
  return JSON.stringify({
    capacity: state.config.capacity,
    leakRatePerMs: state.config.leakRatePerMs,
    waterLevel: state.waterLevel,
    lastLeakTimestamp: state.lastLeakTimestamp,
  });
}

function deserialize(raw: string): BucketState {
  const d = JSON.parse(raw) as {
    capacity: number;
    leakRatePerMs: number;
    waterLevel: number;
    lastLeakTimestamp: number;
  };
  return {
    config: {
      capacity: toCapacity(d.capacity),
      leakRatePerMs: toLeakRate(d.leakRatePerMs),
    },
    waterLevel: toWaterLevel(d.waterLevel),
    lastLeakTimestamp: toTimestamp(d.lastLeakTimestamp),
  };
}

export class RedisStore implements BucketStore {
  constructor(private readonly redis: Redis) {}

  async get(id: BucketId): Promise<Result<BucketState | null, StorageError>> {
    try {
      const raw = await this.redis.get(bucketKey(id));
      if (raw === null) return ok(null);
      return ok(deserialize(raw));
    } catch (cause) {
      return err(storageError("read", cause));
    }
  }

  async set(id: BucketId, state: BucketState): Promise<Result<void, StorageError>> {
    try {
      await this.redis.set(bucketKey(id), serialize(state), "EX", BUCKET_TTL_SECONDS);
      return ok(undefined);
    } catch (cause) {
      return err(storageError("write", cause));
    }
  }

  async delete(id: BucketId): Promise<Result<void, StorageError>> {
    try {
      await this.redis.del(bucketKey(id));
      return ok(undefined);
    } catch (cause) {
      return err(storageError("delete", cause));
    }
  }
}

export function createRedisStore(url?: string): RedisStore {
  const redis = new Redis(url ?? process.env["REDIS_URL"] ?? "redis://localhost:6379", {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });
  return new RedisStore(redis);
}
