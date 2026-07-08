// src/lib/events.ts
import { EventEmitter } from "node:events";

class BucketEvents extends EventEmitter {}

const globalForEvents = globalThis as unknown as {
  bucketEvents?: BucketEvents;
};

export const bucketEvents = globalForEvents.bucketEvents ?? new BucketEvents();

if (process.env["NODE_ENV"] !== "production") {
  globalForEvents.bucketEvents = bucketEvents;
}

export interface BucketUpdatePayload {
  bucketId: string;
  waterLevel: number;
  capacity: number;
  timestamp: number;
}
