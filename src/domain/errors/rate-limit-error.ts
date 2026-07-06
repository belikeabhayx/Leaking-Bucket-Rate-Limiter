// src/domain/errors/rate-limit-error.ts

import type { BucketId, Milliseconds } from "@/domain/types/brand";

export type RateLimitError =
  | BucketOverflowError
  | InvalidConfigError
  | StorageError
  | ClockError;

export interface BucketOverflowError {
  readonly kind: "BucketOverflow";
  readonly bucketId: BucketId;
  readonly retryAfterMs: Milliseconds;
  readonly currentLevel: number;
  readonly capacity: number;
}

export interface InvalidConfigError {
  readonly kind: "InvalidConfig";
  readonly field: string;
  readonly reason: string;
}

export interface StorageError {
  readonly kind: "StorageError";
  readonly operation: "read" | "write" | "delete";
  readonly cause: unknown;
}

export interface ClockError {
  readonly kind: "ClockError";
  readonly reason: string;
}

export function bucketOverflow(
  bucketId: BucketId,
  retryAfterMs: Milliseconds,
  currentLevel: number,
  capacity: number,
): BucketOverflowError {
  return { kind: "BucketOverflow", bucketId, retryAfterMs, currentLevel, capacity };
}

export function invalidConfig(field: string, reason: string): InvalidConfigError {
  return { kind: "InvalidConfig", field, reason };
}

export function storageError(
  operation: StorageError["operation"],
  cause: unknown,
): StorageError {
  return { kind: "StorageError", operation, cause };
}

export function clockError(reason: string): ClockError {
  return { kind: "ClockError", reason };
}
