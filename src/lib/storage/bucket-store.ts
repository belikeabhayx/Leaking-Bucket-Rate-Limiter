// src/lib/storage/bucket-store.ts

import type { BucketState } from "@/domain/bucket/bucket-state";
import type { StorageError } from "@/domain/errors/rate-limit-error";
import type { BucketId } from "@/domain/types/brand";
import type { Result } from "@/domain/types/result";

export interface BucketStore {
  get(id: BucketId): Promise<Result<BucketState | null, StorageError>>;
  set(id: BucketId, state: BucketState): Promise<Result<void, StorageError>>;
  delete(id: BucketId): Promise<Result<void, StorageError>>;
}