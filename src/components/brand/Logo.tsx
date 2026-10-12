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
      {/* DriveNexa Shield & Rover Telemetry Crest - Clean White, Blue & Green */}
      <div className={`relative flex items-center justify-center ${iconSizes[size]} shrink-0 drop-shadow-sm`}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Protective Hexagonal Shield in Royal/Automotive Blue */}
          <polygon
            points="50,4 92,24 92,72 50,96 8,72 8,24"
            className="fill-blue-600 stroke-blue-700"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Inner Safety Shield Boundary */}
          <polygon
            points="50,12 84,28 84,68 50,88 16,68 16,28"
            className="fill-blue-700/80 stroke-blue-500/50"
            strokeWidth="1.5"
          />

          {/* GPS Orbit Pulse Rings */}
          <circle
            cx="50"
            cy="50"
            r="28"
            className="stroke-white/30"
            strokeWidth="1.2"
            strokeDasharray="4 3"
          />

          {/* High-Tech Autonomous Rover Chassis Geometry in Clean White */}
          <path
            d="M32 40 L68 40 L74 54 L68 64 L32 64 L26 54 Z"
            className="fill-white stroke-slate-200"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Rover Wheels (4WD Tread) */}
          <rect x="22" y="36" width="6" height="12" rx="2" className="fill-slate-900" />
          <rect x="72" y="36" width="6" height="12" rx="2" className="fill-slate-900" />
          <rect x="22" y="52" width="6" height="12" rx="2" className="fill-slate-900" />
          <rect x="72" y="52" width="6" height="12" rx="2" className="fill-slate-900" />

          {/* Central GPS / Telemetry Core in Vibrant Emerald Green */}
          <circle cx="50" cy="52" r="5" className="fill-emerald-500" />
          <path d="M50 24 L50 34" className="stroke-emerald-300" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M42 27 L50 20 L58 27" className="stroke-emerald-300 fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={`font-black tracking-tight text-slate-900 ${textSizes[size]}`}>
              Drive<span className="text-blue-600">Nexa</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              PRO
            </span>
          </div>
          <span className="text-[10px] tracking-wider text-slate-500 font-semibold uppercase">
            Vehicle & Rover Safety Platform
          </span>
        </div>
      )}
    </div>
  );
};
