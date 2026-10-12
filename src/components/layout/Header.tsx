import React from 'react';
import { Logo } from '../brand/Logo';
import { ConnectionStatus } from '../../types';
import { useDevice } from '../../context/DeviceContext';
import { useAuth } from '../../context/AuthContext';
import { TabKey } from './BottomNav';
import {
  Wifi,
  WifiOff,
  AlertOctagon,
  Clock,
  ShieldAlert,
  Smartphone,
  Monitor,
  Wrench,
  Activity,
} from 'lucide-react';

interface HeaderProps {
  onTabChange: (tab: TabKey) => void;
  activeTab: TabKey;
  isAndroidView: boolean;
  setIsAndroidView: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onTabChange,
  activeTab,
  isAndroidView,
  setIsAndroidView,
}) => {
  const { device, unacknowledgedAlertsCount } = useDevice();
  const { userProfile } = useAuth();

  const status: ConnectionStatus = device?.status || 'OFFLINE';

  const formatLastSeen = (timestamp: number | null | undefined) => {
    if (!timestamp) return 'No communications yet';
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 10) return 'Just now (Realtime)';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    return `${diffHours}h ago`;
  };

  const statusBadge = () => {
    switch (status) {
      case 'ONLINE':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-xs font-semibold shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 -ml-3.5" />
            <Wifi className="w-3.5 h-3.5 ml-1" />
            <span>ONLINE</span>
          </div>
        );
      case 'ERROR':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/80 border border-red-500/50 text-red-400 text-xs font-semibold shadow-[0_0_10px_rgba(239,68,68,0.2)]">
            <AlertOctagon className="w-3.5 h-3.5 animate-pulse" />
            <span>ERROR</span>
          </div>
        );
      case 'OFFLINE':
      default:
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-400 text-xs font-semibold">
            <WifiOff className="w-3.5 h-3.5" />
            <span>OFFLINE</span>
          </div>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 py-2.5">
        <div className="flex items-center justify-between gap-3">
          {/* Logo & Platform Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange('home')}>
            <Logo size="sm" showText={true} />
          </div>

          {/* Active Rover Status Bar */}
          <div className="hidden sm:flex items-center gap-3 bg-slate-900/90 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>{device?.name || 'NexaRover-01'}</span>
            </div>

            <div className="h-3 w-px bg-slate-700" />

            {statusBadge()}

            <div className="h-3 w-px bg-slate-700" />

            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>{formatLastSeen(device?.lastSeen)}</span>
            </div>
          </div>

          {/* Right Action Tools: Emergency, Admin, View Switcher */}
          <div className="flex items-center gap-2">
            {/* Viewport Simulation Mode: Android vs Responsive Web */}
            <button
              onClick={() => setIsAndroidView(!isAndroidView)}
              title={isAndroidView ? 'Switch to Full Responsive Web' : 'Switch to Android Native Mobile View'}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 transition cursor-pointer flex items-center gap-1.5 text-xs"
            >
              {isAndroidView ? (
                <>
                  <Monitor className="w-4 h-4 text-cyan-400" />
                  <span className="hidden md:inline font-medium">Web View</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span className="hidden md:inline font-medium">Android App</span>
                </>
              )}
            </button>

            {/* Emergency Center Button */}
            <button
              onClick={() => onTabChange('emergency')}
              className={`relative p-2 rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'emergency'
                  ? 'bg-red-950 border-red-500 text-red-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-red-400 hover:border-red-800/80'
              }`}
              title="Emergency Safety Center"
            >
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span className="hidden lg:inline text-xs font-semibold">Emergency</span>
              {unacknowledgedAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-red-600 text-white text-[10px] font-black rounded-full shadow-lg">
                  {unacknowledgedAlertsCount}
                </span>
              )}
            </button>

            {/* Admin Dashboard (Visible to Admin/Developer role) */}
            {(userProfile?.role === 'ADMIN' || userProfile?.role === 'DEVELOPER') && (
              <button
                onClick={() => onTabChange('admin')}
                className={`p-2 rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-cyan-400'
                }`}
                title="Admin & Hardware Console"
              >
                <Wrench className="w-4 h-4 text-cyan-400" />
                <span className="hidden lg:inline text-xs font-semibold">Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile subheader status display */}
        <div className="flex sm:hidden items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-xs">
          <div className="font-semibold text-slate-200 truncate">
            {device?.name || 'NexaRover-01'}
          </div>
          <div className="flex items-center gap-2">
            {statusBadge()}
            <span className="text-[10px] text-slate-500">
              {formatLastSeen(device?.lastSeen)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
