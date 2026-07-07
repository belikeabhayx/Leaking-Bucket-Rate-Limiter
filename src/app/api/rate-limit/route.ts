// src/app/api/rate-limit/route.ts

import { NextRequest, NextResponse } from "next/server";
import { toBucketId } from "@/domain/types/brand";
import { rateLimiterService } from "@/lib/singleton";
import { isOk } from "@/domain/types/result";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const id = toBucketId(String(body["bucketId"] ?? "default"));
  const units = Math.max(1, Number(body["units"] ?? 1));

  const result = await rateLimiterService.checkLimit(id, units);

  if (!isOk(result)) {
    const error = result.error;

    if (error.kind === "BucketOverflow") {
      const retryAfterSec = Math.ceil(error.retryAfterMs / 1000);
      return NextResponse.json(
        { allowed: false, retryAfterMs: error.retryAfterMs, error: "Rate limit exceeded" },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(error.capacity),
            "X-RateLimit-Remaining": "0",
            "Retry-After": String(retryAfterSec),
          },
        },
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  const data = result.value;
  const remaining = Math.max(0, data.capacity - data.currentLevel);

  return NextResponse.json(
    { allowed: true, currentLevel: data.currentLevel, capacity: data.capacity },
    {
      status: 200,
      headers: {
        "X-RateLimit-Limit": String(data.capacity),
        "X-RateLimit-Remaining": String(remaining),
      },
    },
  );
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const id = toBucketId(req.nextUrl.searchParams.get("bucketId") ?? "default");
  const result = await rateLimiterService.getState(id);

  if (!isOk(result)) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json(result.value ?? { empty: true }, { status: 200 });
}
