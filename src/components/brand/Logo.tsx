import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Original DriveNexa Shield & Rover Telemetry Crest */}
      <div className={`relative flex items-center justify-center ${iconSizes[size]} shrink-0`}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-[0_0_12px_rgba(6,182,212,0.5)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Protective Hexagonal Shield */}
          <polygon
            points="50,4 92,24 92,72 50,96 8,72 8,24"
            className="stroke-cyan-500/80 fill-slate-900/90"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Inner Safety Shield Boundary */}
          <polygon
            points="50,14 82,30 82,66 50,86 18,66 18,30"
            className="stroke-cyan-400/30 fill-cyan-950/40"
            strokeWidth="1.5"
          />

          {/* GPS Orbit Pulse Rings */}
          <circle
            cx="50"
            cy="50"
            r="28"
            className="stroke-cyan-500/20"
            strokeWidth="1"
            strokeDasharray="4 3"
          />

          {/* High-Tech Autonomous Rover Chassis Geometry */}
          <path
            d="M32 40 L68 40 L74 54 L68 64 L32 64 L26 54 Z"
            className="fill-slate-800 stroke-cyan-400"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Rover Wheels (4WD Tread) */}
          <rect x="22" y="36" width="6" height="12" rx="2" className="fill-cyan-400" />
          <rect x="72" y="36" width="6" height="12" rx="2" className="fill-cyan-400" />
          <rect x="22" y="52" width="6" height="12" rx="2" className="fill-cyan-400" />
          <rect x="72" y="52" width="6" height="12" rx="2" className="fill-cyan-400" />

          {/* Central GPS / Telemetry Core */}
          <circle cx="50" cy="52" r="5" className="fill-cyan-300 animate-pulse" />
          <path d="M50 24 L50 34" className="stroke-emerald-400" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M42 27 L50 20 L58 27" className="stroke-emerald-400 fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={`font-black tracking-wider text-white uppercase ${textSizes[size]}`}>
              Drive<span className="text-cyan-400">Nexa</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
              PRO
            </span>
          </div>
          <span className="text-[9px] tracking-widest text-slate-400 font-medium uppercase">
            Smart Vehicle & Rover Safety
          </span>
        </div>
      )}
    </div>
  );
};
