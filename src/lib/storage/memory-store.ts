import type { BucketId } from "@/domain/types/brand";
import type { BucketState } from "@/domain/bucket/bucket-state";
import type { BucketStore } from "./bucket-store";
import { ok } from "@/domain/types/result";
import type { Result } from "@/domain/types/result";
import type { StorageError } from "@/domain/errors/rate-limit-error";

export class MemoryStore implements BucketStore {
    private readonly store = new Map<BucketId, BucketState>();

    async get(id: BucketId): Promise<Result<BucketState | null, StorageError>> {
        return ok(this.store.get(id) ?? null);
    }

    async set(id: BucketId, state: BucketState): Promise<Result<void, StorageError>> {
        this.store.set(id, state);
        return ok(undefined);
    }

    async delete(id: BucketId): Promise<Result<void, StorageError>> {
        this.store.delete(id);
        return ok(undefined);
    }

    get size(): number {
        return this.store.size;
    }

    clear(): void {
        this.store.clear();
    }
}
