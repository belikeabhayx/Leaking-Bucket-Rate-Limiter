// singleton.ts solves the "how do I create one service instance shared across all requests in dev + production" problem cleanly.

import { MemoryStore } from "@/lib/storage/memory-store";
import { systemClock } from "@/lib/clock/system-clock";
import { parseEnvConfig } from "@/lib/config/config-parser";
import { RateLimiterService } from "@/services/rate-limiter-service";
import { isOk } from "@/domain/types/result";
import { toCapacity, toLeakRate } from "@/domain/types/brand";

function buildService(): RateLimiterService {
  const configResult = parseEnvConfig();
  const config = isOk(configResult)
    ? configResult.value
    : { capacity: toCapacity(10), leakRatePerMs: toLeakRate(0.01) };

  return new RateLimiterService(new MemoryStore(), systemClock, config);
}

// Module-level singleton — safe in Next.js Node runtime
export const rateLimiterService = buildService();
