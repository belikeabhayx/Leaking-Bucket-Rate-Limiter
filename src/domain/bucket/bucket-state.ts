import { Capacity, LeakRate, Timestamp, WaterLevel } from "../types/brand";

export interface BucketConfig {
    readonly capacity: Capacity;
    readonly leakRatePerMs: LeakRate;
}
export interface BucketState {
    readonly config: BucketConfig;
    readonly waterLevel: WaterLevel;
    readonly lastLeakTimestamp: Timestamp;
}
export interface BucketStateSnapshot {
    readonly state: BucketState;
    readonly computedAt: Timestamp;
    readonly leakedSinceLastUpdate: number;
}

export function createInitialState(config: BucketConfig, now: Timestamp): BucketState {
    return {
        config,
        waterLevel: 0 as WaterLevel,
        lastLeakTimestamp: now,
    }
}

export function isOverflowing(state: BucketState, incomingUnits: number): boolean {
    return state.waterLevel + incomingUnits > state.config.capacity;
}
export function availableCapacity(state: BucketState): number {
    return state.config.capacity - state.waterLevel;
}