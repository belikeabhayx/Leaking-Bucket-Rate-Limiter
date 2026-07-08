// src/components/dashboard/index.tsx
"use client";

import React, { useState, useEffect } from "react";
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
  const [isSimulating, setIsSimulating] = useState<boolean>(true); // start connected/monitoring by default
  const [apiLogs, setApiLogs] = useState<string[]>([]);

  // Telemetry metrics
  const [telemetry, setTelemetry] = useState<Telemetry>({
    total: 0,
    allowed: 0,
    blocked: 0,
  });

  // Log logger helper
  const logApi = (message: string) => {
    setApiLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] ${message}`,
      ...prev.slice(0, 19),
    ]);
  };

  // Fetch initial config and state from the backend
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/rate-limit?bucketId=dashboard-bucket");
        if (res.ok) {
          const data = await res.json();
          if (data.capacity !== undefined) {
            setCapacity(data.capacity);
          }
          if (data.leakRatePerSec !== undefined) {
            setLeakRatePerSec(data.leakRatePerSec);
          }
          if (data.currentLevel !== undefined) {
            setWaterLevel(data.currentLevel);
          }
        }
      } catch (err) {
        logApi(`Failed to fetch initial server config: ${(err as Error).message}`);
      }
    };
    fetchConfig();
  }, []);

  // Stream Server State via SSE (Live API Mode)
  useEffect(() => {
    if (!isSimulating) return;

    logApi("Connecting to live Server-Sent Events (SSE) stream...");
    const eventSource = new EventSource("/api/rate-limit/stream?bucketId=dashboard-bucket");

    eventSource.addEventListener("update", (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.waterLevel !== undefined) {
          setWaterLevel(data.waterLevel);
        }
        if (data.capacity !== undefined) {
          setCapacity(data.capacity);
        }
        if (data.leakRatePerSec !== undefined) {
          setLeakRatePerSec(data.leakRatePerSec);
        }
      } catch (err) {
        logApi(`SSE Parse error: ${(err as Error).message}`);
      }
    });

    eventSource.onerror = () => {
      logApi("SSE Connection error. Reconnecting...");
    };

    return () => {
      logApi("Disconnecting from SSE stream.");
      eventSource.close();
    };
  }, [isSimulating]);

  // Request dispatch handler
  const handleRequest = async (units: number) => {
    setTelemetry((prev) => ({ ...prev, total: prev.total + 1 }));

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
  };

  const handleResetMetrics = async () => {
    setTelemetry({ total: 0, allowed: 0, blocked: 0 });
    
    // Call server to reset bucket state
    try {
      const res = await fetch("/api/rate-limit?bucketId=dashboard-bucket", {
        method: "DELETE",
      });
      if (res.ok) {
        logApi("Reset signal sent. Bucket cleared on server.");
        setWaterLevel(0);
      } else {
        logApi("Failed to reset bucket state on server.");
      }
    } catch (err) {
      logApi(`Failed to reset: ${(err as Error).message}`);
    }
  };

  // Calculate Allowed vs Blocked Ratio
  const totalProcessed = telemetry.allowed + telemetry.blocked;
  const allowedPercentage = totalProcessed > 0 ? (telemetry.allowed / totalProcessed) * 100 : 100;
  const blockedPercentage = totalProcessed > 0 ? (telemetry.blocked / totalProcessed) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased p-4 md:p-12 relative overflow-hidden">
      {/* Decorative gradient glowing circles */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] aspect-square rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square rounded-full bg-emerald-900/10 blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-900 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
                Leaky Bucket Rate Limiter
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-900/40">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Active Store
              </span>
            </div>
            <p className="text-slate-400 max-w-2xl text-sm md:text-base mt-2">
              Real-time visualization engine connected directly to the Redis-backed distributed rate limiter API.
            </p>
          </div>
          
          {/* Global connection status bar */}
          <div className="flex items-center gap-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl px-5 py-3.5 backdrop-blur-md self-start md:self-auto">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Telemetry Connection</span>
              <span className="text-sm font-semibold text-slate-200 flex items-center gap-2 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${isSimulating ? "bg-emerald-400 animate-ping" : "bg-rose-500"}`} />
                {isSimulating ? "Streaming (100ms)" : "Offline / Paused"}
              </span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <ConfigCard
              capacity={capacity}
              leakRatePerSec={leakRatePerSec}
              onConfigChange={() => {}}
              isSimulating={true}
            />
            
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-extrabold text-slate-200 tracking-wide">Server Monitoring</h3>
                <span className={`w-2.5 h-2.5 rounded-full ${isSimulating ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)] animate-pulse" : "bg-slate-700"}`} />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setIsSimulating(!isSimulating)}
                  className={`flex-1 py-3 px-4 rounded-2xl font-bold text-sm transition-all duration-300 transform active:scale-95 ${
                    isSimulating
                      ? "bg-rose-950/30 hover:bg-rose-950/60 text-rose-400 border border-rose-900/30"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                  }`}
                >
                  {isSimulating ? "Disconnect Stream" : "Connect Stream"}
                </button>
                <button
                  onClick={handleResetMetrics}
                  className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-sm font-bold border border-slate-700/50 transition-all transform active:scale-95"
                >
                  Reset Bucket
                </button>
              </div>

              <div className="border-t border-slate-800/80 pt-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Trigger Requests</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    disabled={!isSimulating}
                    onClick={() => handleRequest(1)}
                    className="py-3.5 px-4 rounded-2xl bg-slate-800/40 hover:bg-slate-800 text-slate-200 text-sm font-bold border border-slate-700/40 transition-all disabled:opacity-40 transform active:scale-95 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    1 Unit
                  </button>
                  <button
                    disabled={!isSimulating}
                    onClick={() => handleRequest(10)}
                    className="py-3.5 px-4 rounded-2xl bg-indigo-950/30 hover:bg-indigo-950/65 text-indigo-300 text-sm font-bold border border-indigo-900/40 transition-all disabled:opacity-40 transform active:scale-95 flex items-center justify-center gap-2 shadow-inner"
                  >
                    <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    10 Burst
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-md flex flex-col md:flex-row items-center gap-8 justify-between">
              <BucketViz
                capacity={capacity}
                waterLevel={waterLevel}
                isSimulating={isSimulating}
                leakRatePerSec={leakRatePerSec}
              />

              <div className="flex-1 w-full space-y-6">
                <h3 className="text-lg font-extrabold text-slate-200 border-b border-slate-800/80 pb-3 tracking-wide flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Telemetry Metrics
                </h3>
                
                <div className="grid grid-cols-3 md:grid-cols-1 gap-4">
                  {/* Total requests card */}
                  <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850 hover:border-slate-800 transition-all duration-300 flex items-center gap-4">
                    <div className="p-3 bg-slate-800/40 border border-slate-700/30 rounded-xl text-slate-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.235" />
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total</span>
                      <span className="text-2xl font-black text-slate-100 mt-0.5">{telemetry.total}</span>
                    </div>
                  </div>

                  {/* Allowed requests card */}
                  <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850 hover:border-slate-800 transition-all duration-300 flex items-center gap-4">
                    <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-xl text-emerald-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Allowed</span>
                      <span className="text-2xl font-black text-emerald-400 mt-0.5">{telemetry.allowed}</span>
                    </div>
                  </div>

                  {/* Blocked requests card */}
                  <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850 hover:border-slate-800 transition-all duration-300 flex items-center gap-4">
                    <div className="p-3 bg-rose-950/20 border border-rose-900/30 rounded-xl text-rose-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Blocked</span>
                      <span className="text-2xl font-black text-rose-500 mt-0.5">{telemetry.blocked}</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar displaying Allowed vs Blocked Ratio */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-400">
                    <span>Allowed vs Blocked Ratio</span>
                    <span>{allowedPercentage.toFixed(0)}% / {blockedPercentage.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden flex border border-slate-900">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-500" 
                      style={{ width: `${allowedPercentage}%` }}
                    />
                    <div 
                      className="bg-gradient-to-r from-rose-500 to-red-500 h-full transition-all duration-500" 
                      style={{ width: `${blockedPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Live API Console Log output */}
            <div className="bg-slate-950/80 border border-slate-900 rounded-3xl p-6 shadow-inner space-y-4 font-mono text-xs relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest font-sans flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  Live HTTP Console Logs
                </h4>
                <span className="text-[10px] text-slate-600 uppercase tracking-widest font-bold font-sans">ASCII Real-time feed</span>
              </div>
              <div className="bg-black/60 border border-slate-900 rounded-2xl p-4 h-44 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent select-text shadow-inner">
                {apiLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-600 space-y-2">
                    <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="italic">No network logs yet. Trigger a request to start monitoring.</p>
                  </div>
                ) : (
                  apiLogs.map((log, idx) => {
                    const isAllowed = log.includes("200 OK");
                    const isBlocked = log.includes("429");
                    let badgeClass = "bg-slate-900 border border-slate-800 text-slate-400";
                    if (isAllowed) badgeClass = "bg-emerald-950/30 border border-emerald-900/30 text-emerald-400";
                    if (isBlocked) badgeClass = "bg-rose-950/30 border border-rose-900/30 text-rose-400";
                    
                    return (
                      <div key={idx} className="flex items-start gap-3 py-1 border-b border-slate-950 last:border-0 hover:bg-slate-900/20 rounded px-1 transition-all">
                        <span className="text-[10px] text-slate-600 select-none whitespace-nowrap pt-0.5">{log.split("]")[0] + "]"}</span>
                        <div className="flex-1">
                          <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mr-2 ${badgeClass} select-none`}>
                            {isAllowed ? "ALLOW" : isBlocked ? "BLOCK" : "SYSTEM"}
                          </span>
                          <span className="text-slate-300">{log.includes("]") ? log.split("]").slice(1).join("]") : log}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
