import React from 'react';
import { Home, Compass } from 'lucide-react';

interface NotFoundProps {
  onGoHome: () => void;
}

export const NotFound: React.FC<NotFoundProps> = ({ onGoHome }) => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border border-slate-200/90 shadow-sm max-w-lg mx-auto my-12">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-5 shadow-xs">
        <Compass className="w-8 h-8 stroke-[1.8]" />
      </div>

      <h1 className="text-2xl font-black text-slate-900 tracking-tight">
        Page Not Found
      </h1>

      <p className="text-xs text-slate-500 max-w-xs mt-2 leading-relaxed">
        The requested telemetry view or endpoint does not exist. Please return to the mission control dashboard.
      </p>

      <button
        onClick={onGoHome}
        className="mt-6 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-sm shadow-blue-600/20"
      >
        <Home className="w-4 h-4" />
        <span>Return Home</span>
      </button>
    </div>
  );
};
