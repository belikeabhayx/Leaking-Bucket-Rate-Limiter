declare const __brand: unique symbol;

type Brand<TBase, TBrand> = TBase & { readonly [__brand]: TBrand };

export type BucketId = Brand<string, "BucketId">;
export type Capacity = Brand<number, "Capacity">;
export type LeakRate = Brand<number, "LeakRate">;
export type WaterLevel = Brand<number, "WaterLevel">;
export type Timestamp = Brand<number, "Timestamp">;
export type Milliseconds = Brand<number, "Milliseconds">;

export function toBucketId(v: string): BucketId { return v as BucketId; }
export function toCapacity(v: number): Capacity { return v as Capacity; }
export function toLeakRate(v: number): LeakRate { return v as LeakRate; }
export function toWaterLevel(v: number): WaterLevel { return v as WaterLevel; }
export function toTimestamp(v: number): Timestamp { return v as Timestamp; }
export function toMilliseconds(v: number): Milliseconds { return v as Milliseconds; }