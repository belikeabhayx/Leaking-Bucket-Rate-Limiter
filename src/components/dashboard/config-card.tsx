"use client";

import React from "react";

interface ConfigCardProps {
  capacity: number;
  leakRatePerSec: number;
}

export function ConfigCard({
  capacity,
  leakRatePerSec,
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
      
      <div className="grid grid-cols-1 gap-4">
        {/* Capacity Parameter Card */}
        <div className="bg-slate-950/40 border border-slate-900/60 rounded-2xl p-4 flex justify-between items-center transition-all duration-300 hover:border-slate-800/50">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Bucket Capacity</span>
            <span className="text-xl font-black text-indigo-400 mt-1 block">
              {capacity} <span className="text-xs text-slate-500 font-medium">units</span>
            </span>
          </div>
          <div className="px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md">
            Limit
          </div>
        </div>

        {/* Leak Rate Parameter Card */}
        <div className="bg-slate-950/40 border border-slate-900/60 rounded-2xl p-4 flex justify-between items-center transition-all duration-300 hover:border-slate-800/50">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Leak Rate</span>
            <span className="text-xl font-black text-emerald-400 mt-1 block">
              {leakRatePerSec} <span className="text-xs text-slate-500 font-medium">u/s</span>
            </span>
          </div>
          <div className="px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
            Decay
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
