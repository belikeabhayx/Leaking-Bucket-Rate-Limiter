// src/app/api/rate-limit/stream/route.ts
import { NextRequest } from "next/server";
import { rateLimiterService } from "@/lib/singleton";
import { bucketEvents, BucketUpdatePayload } from "@/lib/events";
import { isOk } from "@/domain/types/result";
import { toBucketId } from "@/domain/types/brand";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<Response> {
  const bucketId = toBucketId(req.nextUrl.searchParams.get("bucketId") ?? "default");

  const responseStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (event: string, data: Record<string, unknown>) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // Controller might already be closed
        }
      };

      // 1. Send initial state immediately
      const initialResult = await rateLimiterService.getState(bucketId);
      const config = rateLimiterService.config;
      const leakRatePerSec = config.leakRatePerMs * 1000;
      if (isOk(initialResult) && initialResult.value) {
        sendEvent("update", {
          waterLevel: initialResult.value.currentLevel,
          capacity: initialResult.value.capacity,
          leakRatePerSec,
        });
      } else {
        sendEvent("update", {
          waterLevel: 0,
          capacity: config.capacity,
          leakRatePerSec,
        });
      }

      // 2. Setup listener for active write updates
      const onUpdate = (payload: BucketUpdatePayload) => {
        if (payload.bucketId === bucketId) {
          sendEvent("update", {
            waterLevel: payload.waterLevel,
            capacity: payload.capacity,
            leakRatePerSec,
          });
        }
      };
      bucketEvents.on("update", onUpdate);

      // 3. Setup polling interval on server to stream passive leaking decay
      const interval = setInterval(async () => {
        const stateResult = await rateLimiterService.getState(bucketId);
        if (isOk(stateResult)) {
          if (stateResult.value === null) {
            sendEvent("update", { waterLevel: 0, capacity: config.capacity, leakRatePerSec });
          } else {
            sendEvent("update", {
              waterLevel: stateResult.value.currentLevel,
              capacity: stateResult.value.capacity,
              leakRatePerSec,
            });
          }
        }
      }, 100); // 100ms interval for smooth visual decay

      // Save references on the controller for teardown
      (controller as any)._cleanup = () => {
        bucketEvents.off("update", onUpdate);
        clearInterval(interval);
      };
    },
    cancel(controller) {
      if ((controller as any)._cleanup) {
        (controller as any)._cleanup();
      }
    },
  });

  return new Response(responseStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
