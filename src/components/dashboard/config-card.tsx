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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
      <h2 className="text-xl font-bold text-slate-100 mb-4 tracking-wide">
        Bucket Configuration
      </h2>
      <div className="space-y-6">
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium text-slate-400">Capacity (Units)</label>
            <span className="text-sm font-bold text-indigo-400">{capacity} units</span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            disabled={isSimulating}
            value={capacity}
            onChange={(e) => onConfigChange(Number(e.target.value), leakRatePerSec)}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-50"
          />
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium text-slate-400">Leak Rate (Units/sec)</label>
            <span className="text-sm font-bold text-emerald-400">{leakRatePerSec} u/s</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="20"
            step="0.1"
            disabled={isSimulating}
            value={leakRatePerSec}
            onChange={(e) => onConfigChange(capacity, Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  );
}
