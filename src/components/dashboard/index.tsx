// src/components/dashboard/index.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { ConfigCard } from "./config-card";
import { BucketViz } from "./bucket-viz";

interface Telemetry {
  total: number;
  allowed: number;
  blocked: number;
}

type Mode = "local" | "api";

export default function Dashboard() {
  const [capacity, setCapacity] = useState<number>(20);
  const [leakRatePerSec, setLeakRatePerSec] = useState<number>(2);
  const [waterLevel, setWaterLevel] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [mode, setMode] = useState<Mode>("local");
  const [apiLogs, setApiLogs] = useState<string[]>([]);

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
    setWaterLevel((prev) => Math.min(prev, newCap));
  };

  // Log logger helper
  const logApi = (message: string) => {
    setApiLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] ${message}`,
      ...prev.slice(0, 19),
    ]);
  };

  // Mode changer resets states
  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    handleResetMetrics();
    logApi(`Switched to ${newMode === "local" ? "Local Simulation" : "Live Server API"} Mode`);
  };

  // Continuous leak calculation via requestAnimationFrame (Local Mode only)
  useEffect(() => {
    if (!isSimulating || mode !== "local") {
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

      const leakAmount = elapsedMs * (leakRatePerSec / 1000);
      setWaterLevel((prev) => Math.max(0, prev - leakAmount));

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isSimulating, leakRatePerSec, mode]);

  // Polling Server State (Live API Mode only)
  useEffect(() => {
    if (mode !== "api" || !isSimulating) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/rate-limit?bucketId=dashboard-bucket");
        if (!res.ok) throw new Error("Failed to fetch state");
        const data = await res.json();

        if (data.empty) {
          setWaterLevel(0);
        } else {
          setWaterLevel(data.currentLevel);
        }
      } catch (err) {
        logApi(`State poll error: ${(err as Error).message}`);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [mode, isSimulating]);

  // Request dispatch handler
  const handleRequest = async (units: number) => {
    setTelemetry((prev) => ({ ...prev, total: prev.total + 1 }));

    if (mode === "local") {
      // ── Local Simulation Math ──
      if (waterLevel + units > capacity) {
        setTelemetry((prev) => ({ ...prev, blocked: prev.blocked + 1 }));
        return;
      }
      setTelemetry((prev) => ({ ...prev, allowed: prev.allowed + 1 }));
      setWaterLevel((prev) => prev + units);
    } else {
      // ── Live Server API Request ──
      try {
        const start = performance.now();
        const res = await fetch("/api/rate-limit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bucketId: "dashboard-bucket", units }),
        });

        const latency = Math.round(performance.now() - start);
        const data = await res.json();

        if (res.status === 200) {
          setTelemetry((prev) => ({ ...prev, allowed: prev.allowed + 1 }));
          setWaterLevel(data.currentLevel);
          logApi(`POST 200 OK — Allowed — Latency: ${latency}ms`);
        } else if (res.status === 429) {
          setTelemetry((prev) => ({ ...prev, blocked: prev.blocked + 1 }));
          const retryAfter = res.headers.get("Retry-After");
          logApi(
            `POST 429 Too Many Requests — Retry After: ${retryAfter}s — Latency: ${latency}ms`
          );
        } else {
          logApi(`POST ${res.status} Error: ${data.error || "Unknown"}`);
        }
      } catch (err) {
        logApi(`Request failed: ${(err as Error).message}`);
      }
    }
  };

  const handleResetMetrics = () => {
    setTelemetry({ total: 0, allowed: 0, blocked: 0 });
    setWaterLevel(0);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col space-y-2 border-b border-slate-900 pb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
                Leaky Bucket Rate Limiter
              </h1>
              <p className="text-slate-400 max-w-2xl text-sm md:text-base mt-2">
                Visualize the leaky bucket algorithm in real-time. Switch between local simulation and live server integrations.
              </p>
            </div>
            
            {/* Mode Select Toggle */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-1 flex">
              <button
                onClick={() => handleModeChange("local")}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                  mode === "local"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Local Sim
              </button>
              <button
                onClick={() => handleModeChange("api")}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                  mode === "api"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Live API
              </button>
            </div>
          </div>
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
          
          <div className="md:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center gap-8 justify-between">
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

            {/* Live API Console Log output */}
            {mode === "api" && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-inner space-y-3 font-mono text-xs">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">Live HTTP Console Logs</h4>
                <div className="bg-black/40 border border-slate-900 rounded-lg p-4 h-36 overflow-y-auto space-y-1.5 select-text">
                  {apiLogs.length === 0 ? (
                    <p className="text-slate-600 italic">No network logs yet. Trigger a request to start monitoring.</p>
                  ) : (
                    apiLogs.map((log, idx) => (
                      <p key={idx} className={log.includes("429") ? "text-rose-400" : log.includes("200") ? "text-emerald-400" : "text-slate-400"}>
                        {log}
                      </p>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
