import { MemoryStore } from "@/lib/storage/memory-store";
import { systemClock } from "@/lib/clock/system-clock";
import { parseEnvConfig } from "@/lib/config/config-parser";
import { RateLimiterService } from "@/services/rate-limiter-service";
import { createRedisLuaStore } from "@/lib/storage/redis-lua-store";
import { isOk } from "@/domain/types/result";
import { toCapacity, toLeakRate } from "@/domain/types/brand";

const DEFAULT_CONFIG = {
  capacity: toCapacity(10),
  leakRatePerMs: toLeakRate(0.01),
};

function buildService(): RateLimiterService {
  const configResult = parseEnvConfig();
  const config = isOk(configResult) ? configResult.value : DEFAULT_CONFIG;

  if (process.env["REDIS_URL"]) {
    console.log("[singleton] Redis detected — using RedisLuaStore (atomic)");
    const lua = createRedisLuaStore(process.env["REDIS_URL"]);
    return new RateLimiterService(new MemoryStore(), systemClock, config, lua);
  }

  console.log("[singleton] No REDIS_URL — using MemoryStore (dev mode)");
  return new RateLimiterService(new MemoryStore(), systemClock, config);
}

export const rateLimiterService = buildService();
