import type { Timestamp } from "@/domain/types/brand";
import type { Clock } from "./clock";

export class SystemClock implements Clock {
  now(): Timestamp {
    return Date.now() as Timestamp;
  }
}

export const systemClock: Clock = new SystemClock();
