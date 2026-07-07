// src/lib/events.ts
import { EventEmitter } from "node:events";

class BucketEvents extends EventEmitter {}

export const bucketEvents = new BucketEvents();

export interface BucketUpdatePayload {
  bucketId: string;
  waterLevel: number;
  capacity: number;
  timestamp: number;
}
