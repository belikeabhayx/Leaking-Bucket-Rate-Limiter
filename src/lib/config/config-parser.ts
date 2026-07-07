import { toCapacity, toLeakRate } from "@/domain/types/brand";
import { invalidConfig } from "@/domain/errors/rate-limit-error";
import type { InvalidConfigError } from "@/domain/errors/rate-limit-error";
import type { BucketConfig } from "@/domain/bucket/bucket-state";
import { ok, err } from "@/domain/types/result";
import type { Result } from "@/domain/types/result";

export interface RawBucketConfig {
  readonly capacity: unknown;
  readonly leakRatePerSec: unknown;
}

export function parseConfig(
  raw: RawBucketConfig,
): Result<BucketConfig, InvalidConfigError> {
  const capacity = Number(raw.capacity);
  if (!Number.isFinite(capacity) || capacity <= 0) {
    return err(invalidConfig("capacity", "must be a finite positive number"));
  }

  const leakRatePerSec = Number(raw.leakRatePerSec);
  if (!Number.isFinite(leakRatePerSec) || leakRatePerSec <= 0) {
    return err(invalidConfig("leakRatePerSec", "must be a finite positive number"));
  }

  return ok({
    capacity: toCapacity(capacity),
    leakRatePerMs: toLeakRate(leakRatePerSec / 1000),
  });
}

export function parseEnvConfig(): Result<BucketConfig, InvalidConfigError> {
  return parseConfig({
    capacity:       process.env["BUCKET_CAPACITY"],
    leakRatePerSec: process.env["LEAK_RATE_PER_SEC"],
  });
}
