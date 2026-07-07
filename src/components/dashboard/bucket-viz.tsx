"use client";

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

  // Determine water color based on fullness
  let waterGradient = "url(#water-normal)";
  if (fillPercentage >= 90) {
    waterGradient = "url(#water-critical)";
  } else if (fillPercentage >= 75) {
    waterGradient = "url(#water-warning)";
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto space-y-6">
      <div className="relative w-full aspect-[4/5] max-h-[400px]">
        <svg
          viewBox="0 0 200 250"
          className="w-full h-full drop-shadow-[0_10px_20px_rgba(30,41,59,0.5)]"
        >
          <defs>
            {/* Gradient definitions for water colors */}
            <linearGradient id="water-normal" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="water-warning" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#b45309" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="water-critical" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#b91c1c" stopOpacity="0.95" />
            </linearGradient>

            {/* Clipping path for trapezoidal bucket shape */}
            <clipPath id="bucket-clip">
              <polygon points="30,40 170,40 150,210 50,210" />
            </clipPath>
          </defs>

          {/* Background overlay for empty bucket inner */}
          <polygon
            points="30,40 170,40 150,210 50,210"
            className="fill-slate-900/40 stroke-slate-800"
            strokeWidth="2"
          />

          {/* Water level fill (clipped by bucket-clip) */}
          <g clipPath="url(#bucket-clip)">
            <rect
              x="0"
              y={210 - (fillPercentage / 100) * 170}
              width="200"
              height="250"
              fill={waterGradient}
              className="transition-all duration-300 ease-out"
            />
          </g>

          {/* Outermost bucket outline structure */}
          <polygon
            points="30,40 170,40 150,210 50,210"
            className="fill-none stroke-slate-700/60"
            strokeWidth="6"
            strokeLinejoin="round"
          />

          {/* Cap/Lip of the bucket */}
          <ellipse
            cx="100"
            cy="40"
            rx="70"
            ry="8"
            className="fill-slate-950/20 stroke-slate-700/80"
            strokeWidth="3"
          />

          {/* Leaking water drip output */}
          {isSimulating && waterLevel > 0 && (
            <g>
              <line
                x1="100"
                y1="210"
                x2="100"
                y2="245"
                stroke="#38bdf8"
                strokeWidth="3"
                strokeDasharray="4 8"
                className="animate-[dash_1s_linear_infinite]"
                style={{
                  strokeDashoffset: 12,
                  animationDuration: `${Math.max(0.2, 2 / leakRatePerSec)}s`,
                }}
              />
              <circle
                cx="100"
                cy="245"
                r="3"
                fill="#38bdf8"
                className="animate-ping"
              />
            </g>
          )}
        </svg>

        {/* Floating status label inside bucket */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-extrabold text-white tracking-wide">
            {waterLevel.toFixed(1)}
          </span>
          <span className="text-xs uppercase tracking-widest text-slate-400 font-bold mt-1">
            Current Level
          </span>
        </div>
      </div>

      {/* Grid details */}
      <div className="grid grid-cols-2 gap-4 w-full text-center">
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3">
          <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Fill State</div>
          <div className="text-lg font-bold text-slate-200">{fillPercentage.toFixed(0)}%</div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3">
          <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Remaining</div>
          <div className="text-lg font-bold text-slate-200">
            {Math.max(0, capacity - waterLevel).toFixed(1)} u
          </div>
        </div>
      </div>
    </div>
  );
}
