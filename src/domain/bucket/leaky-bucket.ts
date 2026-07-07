import { toWaterLevel, toTimestamp, toMilliseconds } from "@/domain/types/brand";
import type { Timestamp } from "@/domain/types/brand";
import type { BucketState } from "./bucket-state";
import { bucketOverflow } from "@/domain/errors/rate-limit-error";
import type { BucketOverflowError } from "@/domain/errors/rate-limit-error";
import { ok, err } from "@/domain/types/result";
import type { Result } from "@/domain/types/result";

export interface ConsumeResult {
  readonly nextState: BucketState;
  readonly waitedMs: number;
}

// Calculates how many units have drained since lastLeakTimestamp.
export function computeLeak(state: BucketState, now: Timestamp): number {
  const elapsedMs = now - state.lastLeakTimestamp;
  if (elapsedMs <= 0) return 0;
  return Math.min(state.waterLevel, elapsedMs * state.config.leakRatePerMs);
}

// applyLeak — pure state transition Takes old state, returns new state. Never mutates. 
export function applyLeak(state: BucketState, now: Timestamp): BucketState {
  const leaked = computeLeak(state, now);
  return {
    ...state,
    waterLevel: toWaterLevel(state.waterLevel - leaked),
    lastLeakTimestamp: toTimestamp(now),
  };
}

export function consume(
  state: BucketState,
  units: number,
  now: Timestamp,
): Result<ConsumeResult, BucketOverflowError> {
  const afterLeak = applyLeak(state, now);
  const newLevel = afterLeak.waterLevel + units;

  if (newLevel > afterLeak.config.capacity) {
    const overflow = newLevel - afterLeak.config.capacity;
    const retryAfterMs = Math.ceil(overflow / afterLeak.config.leakRatePerMs);
    return err(
      bucketOverflow(
        // BucketId is caller's concern — storage layer attaches it
        "" as ReturnType<typeof bucketOverflow>["bucketId"],
        toMilliseconds(retryAfterMs),
        afterLeak.waterLevel,
        afterLeak.config.capacity,
      ),
    );
  }

  return ok({
    nextState: {
      ...afterLeak,
      waterLevel: toWaterLevel(newLevel),
    },
    waitedMs: 0,
  });
}

export function retryAfter(state: BucketState, units: number, now: Timestamp): number {
  const afterLeak = applyLeak(state, now);
  const overflow = afterLeak.waterLevel + units - afterLeak.config.capacity;
  if (overflow <= 0) return 0;
  return Math.ceil(overflow / afterLeak.config.leakRatePerMs);
}
