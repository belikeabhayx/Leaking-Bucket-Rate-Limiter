"use client";

import React from "react";

interface BucketVizProps {
  capacity: number;
  waterLevel: number;
  isSimulating: boolean;
  leakRatePerSec: number;
}

export function BucketViz({
  capacity,
  waterLevel,
  isSimulating,
  leakRatePerSec,
}: BucketVizProps) {
  // Calculate percentage of water level in relation to capacity
  const fillPercentage = Math.min(100, Math.max(0, (waterLevel / capacity) * 100));

  // Determine water color and glow based on fullness
  let waterGradient = "url(#water-normal)";
  let glowColor = "rgba(56, 189, 248, 0.4)";
  let ringBorderColor = "border-sky-500/20";
  let ringBgColor = "bg-sky-500/10";
  let ringTextColor = "text-sky-400";
  
  if (fillPercentage >= 90) {
    waterGradient = "url(#water-critical)";
    glowColor = "rgba(239, 68, 68, 0.4)";
    ringBorderColor = "border-rose-500/20";
    ringBgColor = "bg-rose-500/10";
    ringTextColor = "text-rose-400";
  } else if (fillPercentage >= 75) {
    waterGradient = "url(#water-warning)";
    glowColor = "rgba(245, 158, 11, 0.4)";
    ringBorderColor = "border-amber-500/20";
    ringBgColor = "bg-amber-500/10";
    ringTextColor = "text-amber-400";
  }

  // Adjust animation speed based on leak rate
  const dripDuration = Math.max(0.15, Math.min(1.5, 2 / (leakRatePerSec || 1)));

  return (
    <div className="flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto space-y-6">
      <style jsx>{`
        @keyframes waveMove {
          0% { transform: translateX(0); }
          100% { transform: translateX(-200px); }
        }
        @keyframes dripFall {
          0% { transform: translateY(0) scale(0.8); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(50px) scale(0.4); opacity: 0; }
        }
        @keyframes rippleExpand {
          0% { transform: scale(0.2); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .animate-wave-1 {
          animation: waveMove 4s linear infinite;
        }
        .animate-wave-2 {
          animation: waveMove 2.5s linear infinite;
        }
        .animate-drip {
          animation: dripFall ${dripDuration}s cubic-bezier(0.4, 0, 0.8, 0.4) infinite;
        }
        .animate-ripple {
          animation: rippleExpand ${dripDuration}s ease-out infinite;
        }
      `}</style>

      <div className="relative w-full aspect-[4/5] max-h-[400px]">
        {/* Glow behind the bucket */}
        <div 
          className="absolute inset-x-8 inset-y-12 rounded-full blur-3xl opacity-20 transition-all duration-700 pointer-events-none"
          style={{ backgroundColor: glowColor }}
        />

        <svg
          viewBox="0 0 200 280"
          className="w-full h-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.7)]"
        >
          <defs>
            {/* Gradient definitions for water colors */}
            <linearGradient id="water-normal" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="water-warning" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="water-critical" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f87171" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#dc2626" stopOpacity="0.95" />
            </linearGradient>

            {/* Clipping path for trapezoidal bucket shape */}
            <clipPath id="bucket-clip">
              <polygon points="30,40 170,40 148,220 52,220" />
            </clipPath>
            
            {/* Glass shine gradient */}
            <linearGradient id="glass-shine" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
              <stop offset="25%" stopColor="#ffffff" stopOpacity="0.03" />
              <stop offset="85%" stopColor="#ffffff" stopOpacity="0.0" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Background of the bucket (inside) */}
          <polygon
            points="30,40 170,40 148,220 52,220"
            className="fill-slate-950/60 stroke-slate-900"
            strokeWidth="2"
          />

          {/* Dynamic Water Level Fill with wave animations */}
          {waterLevel > 0 && (
            <g clipPath="url(#bucket-clip)">
              {/* Translate group vertically based on fill percentage */}
              <g transform={`translate(0, ${220 - (fillPercentage / 100) * 180})`}>
                {/* Back wave layer */}
                <path
                  d="M-200,0 Q-100,-8 0,0 Q100,-8 200,0 Q300,-8 400,0 L400,280 L-200,280 Z"
                  fill={waterGradient}
                  opacity="0.4"
                  className="animate-wave-1"
                />
                {/* Front wave layer */}
                <path
                  d="M-200,-4 Q-100,6 0,-4 Q100,6 200,-4 Q300,6 400,-4 L400,280 L-200,280 Z"
                  fill={waterGradient}
                  opacity="0.9"
                  className="animate-wave-2"
                />
              </g>
            </g>
          )}

          {/* Glass reflection shine overlay */}
          <polygon
            points="30,40 170,40 148,220 52,220"
            fill="url(#glass-shine)"
            className="pointer-events-none"
          />

          {/* Inner bucket shadow lines for 3D depth */}
          <polygon
            points="33,43 167,43 146,217 54,217"
            className="fill-none stroke-white/5"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Outermost bucket outline structure */}
          <polygon
            points="30,40 170,40 148,220 52,220"
            className="fill-none stroke-slate-800/80"
            strokeWidth="4"
            strokeLinejoin="round"
          />

          {/* Cap/Lip of the bucket */}
          <ellipse
            cx="100"
            cy="40"
            rx="70"
            ry="8"
            className="fill-slate-900/30 stroke-slate-800/60"
            strokeWidth="2"
          />

          {/* Glass glare effect (vertical highlight on the left) */}
          <path
            d="M 45 48 L 60 212"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.1"
            className="pointer-events-none"
          />

          {/* Leaking water drip animation */}
          {isSimulating && waterLevel > 0 && (
            <g>
              {/* Dripping droplet */}
              <g className="animate-drip">
                <path
                  d="M100,222 C97,222 96,226 96,228 C96,230 98,232 100,232 C102,232 104,230 104,228 C104,226 103,222 100,222 Z"
                  fill="#38bdf8"
                  opacity="0.95"
                />
              </g>

              {/* Landing Ripple 1 */}
              <ellipse
                cx="100"
                cy="272"
                rx="15"
                ry="4"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.5"
                className="animate-ripple"
                style={{ animationDelay: `${dripDuration * 0.8}s` }}
              />

              {/* Landing Ripple 2 */}
              <ellipse
                cx="100"
                cy="272"
                rx="8"
                ry="2"
                fill="none"
                stroke="#60a5fa"
                strokeWidth="1"
                className="animate-ripple"
              />
            </g>
          )}

          {/* Spigot / nozzle at the bottom of the bucket */}
          <rect
            x="96"
            y="218"
            width="8"
            height="8"
            rx="1.5"
            className="fill-slate-800 stroke-slate-700/60"
            strokeWidth="1"
          />
          <path
            d="M 98 226 L 102 226 L 101 229 L 99 229 Z"
            className="fill-slate-700"
          />
        </svg>

        {/* Floating status label inside bucket */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
          <span className="text-4xl font-extrabold text-white tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
            {waterLevel.toFixed(1)}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            Current Level
          </span>
        </div>
      </div>

      {/* Grid details */}
      <div className="grid grid-cols-2 gap-4 w-full">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-md transition-all duration-300 hover:border-slate-700/50">
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Fill State</div>
          <div className="text-xl font-black text-slate-200 mt-1 flex items-baseline gap-1.5">
            {fillPercentage.toFixed(0)}%
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${ringBgColor} ${ringBorderColor} ${ringTextColor} border`}>
              {fillPercentage >= 90 ? "Critical" : fillPercentage >= 75 ? "Warning" : "Normal"}
            </span>
          </div>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-md transition-all duration-300 hover:border-slate-700/50">
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Remaining</div>
          <div className="text-xl font-black text-slate-200 mt-1">
            {Math.max(0, capacity - waterLevel).toFixed(1)} <span className="text-xs text-slate-500 font-medium">units</span>
          </div>
        </div>
      </div>
    </div>
  );
}
