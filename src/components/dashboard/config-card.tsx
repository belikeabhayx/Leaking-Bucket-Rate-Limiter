"use client";

import React from "react";

interface ConfigCardProps {
  capacity: number;
  leakRatePerSec: number;
  onConfigChange: (capacity: number, leakRate: number) => void;
  isSimulating: boolean;
}

export function ConfigCard({
  capacity,
  leakRatePerSec,
  onConfigChange,
  isSimulating,
}: ConfigCardProps) {
  return (
    <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-6">
      <div className="flex justify-between items-center border-b border-slate-850 pb-4">
        <h2 className="text-lg font-extrabold text-slate-100 tracking-wide">
          Bucket Configuration
        </h2>
        <span className="px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md">
          Live Server
        </span>
      </div>
      
      <div className="space-y-6">
        {/* Capacity Slider Group */}
        <div className="space-y-3">
          <div className="flex justify-between items-baseline">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Capacity</label>
            <span className="text-sm font-black text-indigo-400 bg-indigo-950/20 border border-indigo-900/30 px-2 py-0.5 rounded-lg">
              {capacity} <span className="text-[10px] text-slate-500 font-bold">units</span>
            </span>
          </div>
          <div className="relative flex items-center group">
            <input
              type="range"
              min="1"
              max="100"
              disabled={isSimulating}
              value={capacity}
              onChange={(e) => onConfigChange(Number(e.target.value), leakRatePerSec)}
              className="w-full h-2 bg-slate-950 border border-slate-900 rounded-lg appearance-none cursor-not-allowed opacity-60 accent-indigo-500 transition-all duration-300"
            />
          </div>
        </div>

        {/* Leak Rate Slider Group */}
        <div className="space-y-3">
          <div className="flex justify-between items-baseline">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Leak Rate</label>
            <span className="text-sm font-black text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-2 py-0.5 rounded-lg">
              {leakRatePerSec} <span className="text-[10px] text-slate-500 font-bold">u/s</span>
            </span>
          </div>
          <div className="relative flex items-center group">
            <input
              type="range"
              min="0.1"
              max="20"
              step="0.1"
              disabled={isSimulating}
              value={leakRatePerSec}
              onChange={(e) => onConfigChange(capacity, Number(e.target.value))}
              className="w-full h-2 bg-slate-950 border border-slate-900 rounded-lg appearance-none cursor-not-allowed opacity-60 accent-emerald-500 transition-all duration-300"
            />
          </div>
        </div>
      </div>
      
      {/* Informative info banner at the bottom */}
      <div className="bg-slate-950/40 border border-slate-850/50 rounded-2xl p-4 text-[11px] text-slate-400 leading-relaxed flex gap-3">
        <svg className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>
          Configuration parameters are loaded directly from the rate limiter service's server configuration and represent the active rate limits.
        </p>
      </div>
    </div>
  );
}
