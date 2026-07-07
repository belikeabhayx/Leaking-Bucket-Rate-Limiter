import type { BucketId } from "@/domain/types/brand";
import type { BucketConfig } from "@/domain/bucket/bucket-state";
import type { BucketStore } from "@/lib/storage/bucket-store";
import type { Clock } from "@/lib/clock/clock";
import type { RateLimitError } from "@/domain/errors/rate-limit-error";
import type { Result } from "@/domain/types/result";
import { createInitialState } from "@/domain/bucket/bucket-state";
import { consume } from "@/domain/bucket/leaky-bucket";
import { ok, err, isOk } from "@/domain/types/result";
import { storageError } from "@/domain/errors/rate-limit-error";
import { RedisLuaStore } from "@/lib/storage/redis-lua-store";

export interface CheckLimitResult {
  readonly allowed: boolean;
  readonly currentLevel: number;
  readonly capacity: number;
  readonly retryAfterMs: number | null;
}

export class RateLimiterService {
  constructor(
    private readonly store: BucketStore,
    private readonly clock: Clock,
    private readonly config: BucketConfig,
    private readonly lua?: RedisLuaStore,  // optional fast path
  ) { }

  async checkLimit(
    id: BucketId,
    units: number = 1,
  ): Promise<Result<CheckLimitResult, RateLimitError>> {

    // ── Atomic fast path (Redis + Lua) ──────────────────────────────
    if (this.lua) {
      const now = this.clock.now();
      const result = await this.lua.atomicConsume(id, this.config, units, now);
      if (!isOk(result)) return err(result.error);
      return ok({
        allowed: true,
        currentLevel: result.value.waterLevel,
        capacity: result.value.capacity,
        retryAfterMs: null,
      })

    }

    // ── Standard path (MemoryStore / non-atomic) ─────────────────────
    const now = this.clock.now();

    const getResult = await this.store.get(id);
    if (!isOk(getResult)) {
      return err(storageError("read", getResult.error));
    }

    const state = getResult.value ?? createInitialState(this.config, now);

    const consumeResult = consume(state, units, now);

    if (!isOk(consumeResult)) {
      const overflow = consumeResult.error;
      // Attach the real BucketId before returning to caller
      return err({ ...overflow, bucketId: id });
    }

    const setResult = await this.store.set(id, consumeResult.value.nextState);
    if (!isOk(setResult)) {
      return err(storageError("write", setResult.error));
    }

    return ok({
      allowed: true,
      currentLevel: consumeResult.value.nextState.waterLevel,
      capacity: this.config.capacity,
      retryAfterMs: null,
    });
  }

  async getState(id: BucketId): Promise<Result<CheckLimitResult | null, RateLimitError>> {
    const getResult = await this.store.get(id);
    if (!isOk(getResult)) {
      return err(storageError("read", getResult.error));
    }
    if (getResult.value === null) return ok(null);

    const state = getResult.value;
    return ok({
      allowed: true,
      currentLevel: state.waterLevel,
      capacity: state.config.capacity,
      retryAfterMs: null,
    });
  }
}
