import React, { useState } from 'react';
import { Logo } from '../brand/Logo';
import { DeviceConnectionState } from '../../types';
import { useDevice } from '../../context/DeviceContext';
import { useAuth } from '../../context/AuthContext';
import { TabKey } from './BottomNav';
import { DeviceRegistrationModal } from '../dashboard/DeviceRegistrationModal';
import {
  Wifi,
  WifiOff,
  AlertOctagon,
  Clock,
  ShieldAlert,
  Wrench,
  Activity,
  Plus,
  ChevronDown,
} from 'lucide-react';

interface HeaderProps {
  onTabChange: (tab: TabKey) => void;
  activeTab: TabKey;
}

export const Header: React.FC<HeaderProps> = ({
  onTabChange,
  activeTab,
}) => {
  const {
    device,
    unacknowledgedAlertsCount,
    connectionState,
    activeDeviceId,
    lastHeartbeat,
    lastDataUpdate,
    lastKnownError,
  } = useDevice();
  const { userProfile } = useAuth();
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);

  const formatTimestamp = (timestamp: number | null | undefined, emptyLabel: string = 'No data') => {
    if (!timestamp) return emptyLabel;
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 5) return 'Just now (live)';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    return `${diffHours}h ago`;
  };

  const renderStatusBadge = () => {
    switch (connectionState) {
      case 'CONNECTED':
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
      case 'DISCONNECTED':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold shadow-xs">
            <WifiOff className="w-3.5 h-3.5 text-amber-600" />
            <span>OFFLINE</span>
          </div>
        );
      case 'UNKNOWN':
      default:
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>WAITING FOR DEVICE</span>
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

          {/* Desktop Navigation Links */}
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

          {/* Active Rover Status Bar (Responsive for both Mobile and Desktop) */}
          <div className="flex items-center gap-2 sm:gap-3 bg-slate-50 px-2.5 sm:px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setIsDeviceModalOpen(true)}
              className="flex items-center gap-1 sm:gap-1.5 font-bold text-slate-800 hover:text-blue-600 cursor-pointer transition text-xs truncate max-w-[110px] sm:max-w-[160px]"
              title="Click to manage or switch vehicle"
            >
              <Activity className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">{activeDeviceId || 'NEXA-ROVER-01'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            <div className="h-3 w-px bg-slate-200" />

            {/* LIVE ONLINE / OFFLINE BADGE */}
            {renderStatusBadge()}

            {/* Heartbeat & Data Update (visible on md+) */}
            <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-500 font-medium">
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1" title="Last hardware heartbeat timestamp">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>HB: {formatTimestamp(lastHeartbeat, 'Awaiting...')}</span>
              </div>
              <span className="text-slate-300">•</span>
              <div title="Last sensor data telemetry timestamp">
                <span>Data: {formatTimestamp(lastDataUpdate, 'Awaiting...')}</span>
              </div>
            </div>

            {/* Last Known Error Badge if present */}
            {lastKnownError && (
              <div className="hidden sm:block text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200" title={lastKnownError}>
                Err: {lastKnownError.slice(0, 14)}...
              </div>
            )}
          </div>

          {/* Right Action Tools: Emergency & Admin */}
          <div className="flex items-center gap-2">
            {/* Emergency Center Button */}
            <button
              onClick={() => onTabChange('emergency')}
              className={`relative px-2.5 sm:px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
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

            {/* Admin Dashboard */}
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
          <div className="font-bold text-slate-800 truncate text-xs flex items-center gap-1">
            <span>{device?.name || (activeDeviceId ? activeDeviceId : 'No vehicle selected')}</span>
            {activeDeviceId && <span className="text-[10px] font-mono text-slate-400">({activeDeviceId})</span>}
          </div>
          <div className="flex items-center gap-2">
            {renderStatusBadge()}
            <span className="text-[11px] text-slate-500 font-medium">
              HB: {formatTimestamp(lastHeartbeat, 'None')}
            </span>
          </div>
        </div>
      </div>

      {/* Device Registration & Selection Modal */}
      <DeviceRegistrationModal
        isOpen={isDeviceModalOpen}
        onClose={() => setIsDeviceModalOpen(false)}
      />
    </header>
  );
};
