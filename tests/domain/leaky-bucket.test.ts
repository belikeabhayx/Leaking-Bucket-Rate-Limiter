// tests/domain/leaky-bucket.test.ts

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ManualClock } from "../../src/lib/clock/manual-clock";
import { toCapacity, toLeakRate, toTimestamp, toWaterLevel } from "../../src/domain/types/brand";
import { createInitialState } from "../../src/domain/bucket/bucket-state";
import { computeLeak, applyLeak, consume, retryAfter } from "../../src/domain/bucket/leaky-bucket";
import { isOk } from "../../src/domain/types/result";

const makeConfig = (capacity: number, leakPerSec: number) => ({
  capacity: toCapacity(capacity),
  leakRatePerMs: toLeakRate(leakPerSec / 1000),
});

describe("computeLeak", () => {
  it("returns 0 when no time has elapsed", () => {
    const clock = new ManualClock(1000);
    const config = makeConfig(10, 1);
    const state = createInitialState(config, clock.now());
    assert.strictEqual(computeLeak(state, clock.now()), 0);
  });

  it("leaks correct units after elapsed time", () => {
    const clock = new ManualClock(0);
    const config = makeConfig(10, 2); // 2 units/sec = 0.002/ms
    const state = {
      config,
      waterLevel: toWaterLevel(4),
      lastLeakTimestamp: toTimestamp(0),
    };
    clock.advance(1000); // 1 second passes
    assert.strictEqual(computeLeak(state, clock.now()), 2);
  });

  it("never leaks more than current water level", () => {
    const clock = new ManualClock(0);
    const config = makeConfig(10, 5);
    const state = {
      config,
      waterLevel: toWaterLevel(1),
      lastLeakTimestamp: toTimestamp(0),
    };
    clock.advance(10_000); // 10 seconds — would leak 50, but only 1 in bucket
    assert.strictEqual(computeLeak(state, clock.now()), 1);
  });

  it("returns 0 on clock skew (now < lastLeakTimestamp)", () => {
    const config = makeConfig(10, 1);
    const state = {
      config,
      waterLevel: toWaterLevel(5),
      lastLeakTimestamp: toTimestamp(5000),
    };
    assert.strictEqual(computeLeak(state, toTimestamp(4000)), 0);
  });
});

describe("applyLeak", () => {
  it("water level never drops below zero after full drain", () => {
    const clock = new ManualClock(0);
    const config = makeConfig(10, 5); // 5/sec
    const state = {
      config,
      waterLevel: toWaterLevel(3),
      lastLeakTimestamp: toTimestamp(0),
    };
    clock.advance(10_000); // 50 units would leak, but only 3 in bucket
    const next = applyLeak(state, clock.now());
    assert.strictEqual(next.waterLevel, 0);
  });

  it("updates lastLeakTimestamp to now", () => {
    const clock = new ManualClock(0);
    const config = makeConfig(10, 1);
    const state = createInitialState(config, clock.now());
    clock.advance(500);
    const next = applyLeak(state, clock.now());
    assert.strictEqual(next.lastLeakTimestamp, 500);
  });
});

describe("consume", () => {
  it("allows request on empty bucket", () => {
    const clock = new ManualClock(0);
    const config = makeConfig(10, 1);
    const state = createInitialState(config, clock.now());
    const result = consume(state, 1, clock.now());
    assert.ok(isOk(result));
    assert.strictEqual(result.value.nextState.waterLevel, 1);
  });

  it("rejects when units would exceed capacity", () => {
    const clock = new ManualClock(0);
    const config = makeConfig(10, 1);
    const state = {
      config,
      waterLevel: toWaterLevel(9),
      lastLeakTimestamp: clock.now(),
    };
    const result = consume(state, 2, clock.now()); // 9 + 2 = 11 > 10
    assert.ok(!isOk(result));
    assert.strictEqual(result.error.kind, "BucketOverflow");
  });

  it("allows request at exact capacity boundary after leak", () => {
    const clock = new ManualClock(0);
    const config = makeConfig(10, 2); // 2/sec
    const state = {
      config,
      waterLevel: toWaterLevel(10),
      lastLeakTimestamp: toTimestamp(0),
    };
    clock.advance(1000); // leaks 2 → level drops to 8
    const result = consume(state, 2, clock.now()); // 8 + 2 = 10 == capacity → allowed
    assert.ok(isOk(result));
  });

  it("computes correct retryAfterMs on overflow", () => {
    const clock = new ManualClock(0);
    const config = makeConfig(10, 1); // 1/sec = 0.001/ms
    const state = {
      config,
      waterLevel: toWaterLevel(10),
      lastLeakTimestamp: clock.now(),
    };
    const result = consume(state, 1, clock.now()); // overflow by 1
    assert.ok(!isOk(result));
    // 1 unit / 0.001 per ms = 1000 ms
    assert.strictEqual(result.error.retryAfterMs, 1000);
  });

  it("two consecutive consumes accumulate level correctly", () => {
    const clock = new ManualClock(0);
    const config = makeConfig(10, 0); // zero leak rate for simplicity
    // We can't use makeConfig with 0 (validation would reject it in prod)
    // So we build state manually
    const state = {
      config: { capacity: toCapacity(10), leakRatePerMs: toLeakRate(0.001) },
      waterLevel: toWaterLevel(0),
      lastLeakTimestamp: clock.now(),
    };
    const r1 = consume(state, 3, clock.now());
    assert.ok(isOk(r1));
    const r2 = consume(r1.value.nextState, 3, clock.now());
    assert.ok(isOk(r2));
    assert.strictEqual(r2.value.nextState.waterLevel, 6);
  });
});

describe("retryAfter", () => {
  it("returns 0 when request fits", () => {
    const clock = new ManualClock(0);
    const config = makeConfig(10, 1);
    const state = createInitialState(config, clock.now());
    assert.strictEqual(retryAfter(state, 1, clock.now()), 0);
  });

  it("returns positive ms when overflow", () => {
    const clock = new ManualClock(0);
    const config = makeConfig(10, 2); // 2/sec = 0.002/ms
    const state = {
      config,
      waterLevel: toWaterLevel(10),
      lastLeakTimestamp: clock.now(),
    };
    assert.strictEqual(retryAfter(state, 2, clock.now()), 1000); // 2 / 0.002 = 1000ms
  });
});
