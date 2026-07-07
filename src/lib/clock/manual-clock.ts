import { toTimestamp, type Timestamp } from "@/domain/types/brand";
import type { Clock } from "./clock";

export class ManualClock implements Clock {
    private current: Timestamp;

    constructor(startMs: number = 0) {
        this.current = toTimestamp(startMs);
    }

    now(): Timestamp {
        return this.current;
    }

    advance(ms: number): void {
        this.current = toTimestamp(this.current + ms);
    }

    setTo(ms: number): void {
        this.current = toTimestamp(ms);
    }
}
