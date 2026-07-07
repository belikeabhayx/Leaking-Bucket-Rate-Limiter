import type { Timestamp } from "@/domain/types/brand";

export interface Clock {
    now(): Timestamp;
}