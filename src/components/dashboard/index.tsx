"use client";

import React, { useState } from "react";
import { ConfigCard } from "./config-card";

export default function Dashboard() {
  const [capacity, setCapacity] = useState<number>(20);
  const [leakRatePerSec, setLeakRatePerSec] = useState<number>(2);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const handleConfigChange = (newCap: number, newLeak: number) => {
    setCapacity(newCap);
    setLeakRatePerSec(newLeak);
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
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-slate-200 mb-3">Simulation Mode</h3>
              <div className="flex gap-4">
                <button
                  onClick={() => setIsSimulating(!isSimulating)}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                    isSimulating
                      ? "bg-rose-600 hover:bg-rose-500 text-white"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                  }`}
                >
                  {isSimulating ? "Pause Simulation" : "Start Simulation"}
                </button>
              </div>
            </div>
          </div>
          
          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex items-center justify-center min-h-[300px]">
            <p className="text-slate-500 italic">Bucket Visualization Placeholder</p>
          </div>
        </div>
      </div>
    </div>
  );
}
