import React from 'react';
import { Logo } from '../brand/Logo';
import { Home, Compass } from 'lucide-react';

interface NotFoundProps {
  onGoHome: () => void;
}

export const NotFound: React.FC<NotFoundProps> = ({ onGoHome }) => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 mb-5 shadow-inner">
        <Compass className="w-8 h-8 stroke-[1.8]" />
      </div>

      <h1 className="text-3xl font-black text-white tracking-tight">
        Page Not Found
      </h1>

      <p className="text-xs text-slate-400 max-w-sm mt-2 leading-relaxed">
        The requested telemetry view or endpoint does not exist. Please return to the mission control dashboard.
      </p>

      <button
        onClick={onGoHome}
        className="mt-6 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-lg shadow-cyan-500/25"
      >
        <Home className="w-4 h-4" />
        <span>Go Home</span>
      </button>
    </div>
  );
};
