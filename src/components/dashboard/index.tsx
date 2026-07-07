"use client";

import React, { useState, useEffect, useRef } from "react";
import { ConfigCard } from "./config-card";
import { BucketViz } from "./bucket-viz";

interface Telemetry {
  total: number;
  allowed: number;
  blocked: number;
}

export default function Dashboard() {
  const [capacity, setCapacity] = useState<number>(20);
  const [leakRatePerSec, setLeakRatePerSec] = useState<number>(2);
  const [waterLevel, setWaterLevel] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Telemetry metrics
  const [telemetry, setTelemetry] = useState<Telemetry>({
    total: 0,
    allowed: 0,
    blocked: 0,
  });

  const lastTimeRef = useRef<number | null>(null);

  const handleConfigChange = (newCap: number, newLeak: number) => {
    setCapacity(newCap);
    setLeakRatePerSec(newLeak);
    // Reset water if it exceeds new capacity
    setWaterLevel((prev) => Math.min(prev, newCap));
  };

  // Continuous leak calculation via requestAnimationFrame
  useEffect(() => {
    if (!isSimulating) {
      lastTimeRef.current = null;
      return;
    }

    let animationFrameId: number;

    const loop = (timestamp: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
        animationFrameId = requestAnimationFrame(loop);
        return;
      }

      const elapsedMs = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Leak calculation: leakRatePerSec / 1000 = leak rate per millisecond
      const leakAmount = elapsedMs * (leakRatePerSec / 1000);

      setWaterLevel((prev) => Math.max(0, prev - leakAmount));

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isSimulating, leakRatePerSec]);

  // Request dispatch handler
  const handleRequest = (units: number) => {
    setTelemetry((prev) => ({ ...prev, total: prev.total + 1 }));

    // Core leaky bucket logic replica for simulation UI
    if (waterLevel + units > capacity) {
      setTelemetry((prev) => ({ ...prev, blocked: prev.blocked + 1 }));
      return;
    }

    setTelemetry((prev) => ({ ...prev, allowed: prev.allowed + 1 }));
    setWaterLevel((prev) => prev + units);
  };

  const handleResetMetrics = () => {
    setTelemetry({ total: 0, allowed: 0, blocked: 0 });
    setWaterLevel(0);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col space-y-2 border-b border-slate-900 pb-6">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
            Leaky Bucket Rate Limiter
          </h1>
          <p className="text-slate-400 max-w-2xl text-sm md:text-base">
            Visualize the leaky bucket algorithm in real-time. Pour units of water, customize rates, and witness rate limiting in action.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
            <ConfigCard
              capacity={capacity}
              leakRatePerSec={leakRatePerSec}
              onConfigChange={handleConfigChange}
              isSimulating={isSimulating}
            />
            
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-lg font-bold text-slate-200">Simulation Controls</h3>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsSimulating(!isSimulating)}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${
                    isSimulating
                      ? "bg-rose-600 hover:bg-rose-500 text-white"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                  }`}
                >
                  {isSimulating ? "Pause Simulation" : "Start Simulation"}
                </button>
                <button
                  onClick={handleResetMetrics}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-all"
                >
                  Reset
                </button>
              </div>

              <div className="border-t border-slate-800/80 pt-4 space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Trigger Requests</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    disabled={!isSimulating}
                    onClick={() => handleRequest(1)}
                    className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold border border-slate-700/50 transition-all disabled:opacity-40"
                  >
                    +1 Request
                  </button>
                  <button
                    disabled={!isSimulating}
                    onClick={() => handleRequest(10)}
                    className="py-3 px-4 rounded-xl bg-indigo-950/40 hover:bg-indigo-950/70 text-indigo-300 text-sm font-bold border border-indigo-900/40 transition-all disabled:opacity-40"
                  >
                    +10 Burst
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center gap-8 justify-between">
            <BucketViz
              capacity={capacity}
              waterLevel={waterLevel}
              isSimulating={isSimulating}
              leakRatePerSec={leakRatePerSec}
            />

            <div className="flex-1 w-full space-y-6">
              <h3 className="text-xl font-bold text-slate-200 border-b border-slate-800 pb-3">Telemetry Metrics</h3>
              <div className="grid grid-cols-3 md:grid-cols-1 gap-4">
                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/50">
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-widest">Total requests</span>
                  <span className="text-3xl font-extrabold text-slate-100">{telemetry.total}</span>
                </div>
                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/50">
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-widest">Allowed (200)</span>
                  <span className="text-3xl font-extrabold text-emerald-400">{telemetry.allowed}</span>
                </div>
                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/50">
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-widest">Blocked (429)</span>
                  <span className="text-3xl font-extrabold text-rose-500">{telemetry.blocked}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
