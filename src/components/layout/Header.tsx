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
  ShieldCheck,
  Wrench,
  Activity,
  Layers,
  Radio,
} from 'lucide-react';

interface HeaderProps {
  onTabChange: (tab: TabKey) => void;
  activeTab: TabKey;
}

export const Header: React.FC<HeaderProps> = ({
  onTabChange,
  activeTab,
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

  const renderStatusBadge = () => {
    switch (status) {
      case 'ONLINE':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="w-2 h-2 rounded-full bg-emerald-500 -ml-3.5" />
            <Wifi className="w-3.5 h-3.5 ml-1 text-emerald-600" />
            <span>ONLINE</span>
          </div>
        );
      case 'ERROR':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold shadow-xs">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
            <span>ERROR</span>
          </div>
        );
      case 'OFFLINE':
      default:
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold shadow-xs">
            <WifiOff className="w-3.5 h-3.5 text-amber-600" />
            <span>OFFLINE</span>
          </div>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 border-b border-slate-200/80 shadow-xs backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Platform Title */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => onTabChange('home')}
          >
            <Logo size="sm" showText={true} />
          </div>

          {/* Desktop Navigation Links (Responsive) */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onTabChange('home')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-blue-50 text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              HOME
            </button>
            <button
              onClick={() => onTabChange('remote')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'remote'
                  ? 'bg-blue-50 text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              CAR REMOTE
            </button>
            <button
              onClick={() => onTabChange('map')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'map'
                  ? 'bg-blue-50 text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              MAP
            </button>
            <button
              onClick={() => onTabChange('profile')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-blue-50 text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              PROFILE
            </button>
          </nav>

          {/* Active Rover Status Bar */}
          <div className="hidden lg:flex items-center gap-3 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              <span>{device?.name || 'NexaRover-01'}</span>
            </div>

            <div className="h-3 w-px bg-slate-200" />

            {renderStatusBadge()}

            <div className="h-3 w-px bg-slate-200" />

            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatLastSeen(device?.lastSeen)}</span>
            </div>
          </div>

          {/* Right Action Tools: Emergency, Admin */}
          <div className="flex items-center gap-2">
            {/* Emergency Center Button */}
            <button
              onClick={() => onTabChange('emergency')}
              className={`relative px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'emergency'
                  ? 'bg-rose-50 border-rose-300 text-rose-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-rose-50/50 hover:text-rose-700 hover:border-rose-200'
              }`}
              title="Emergency Safety Center"
            >
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span className="hidden sm:inline">Emergency</span>
              {unacknowledgedAlertsCount > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-600 text-white text-[10px] font-black rounded-full shadow-xs">
                  {unacknowledgedAlertsCount}
                </span>
              )}
            </button>

            {/* Admin Dashboard (Visible to Admin/Developer role) */}
            {(userProfile?.role === 'ADMIN' || userProfile?.role === 'DEVELOPER') && (
              <button
                onClick={() => onTabChange('admin')}
                className={`px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-blue-50/50 hover:text-blue-700 hover:border-blue-200'
                }`}
                title="Admin & Fleet Console"
              >
                <Wrench className="w-4 h-4 text-blue-600" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Subheader Status Line */}
        <div className="flex lg:hidden items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-xs">
          <div className="font-bold text-slate-800 truncate text-xs">
            {device?.name || 'NexaRover-01'}
          </div>
          <div className="flex items-center gap-2">
            {renderStatusBadge()}
            <span className="text-[11px] text-slate-500 font-medium">
              {formatLastSeen(device?.lastSeen)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
