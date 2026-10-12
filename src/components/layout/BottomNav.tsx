import React from 'react';
import { Home, Gamepad2, MapPin, UserCheck, AlertTriangle } from 'lucide-react';

export type TabKey = 'home' | 'remote' | 'map' | 'profile' | 'admin' | 'emergency';

interface BottomNavProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  unacknowledgedAlerts: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  unacknowledgedAlerts,
}) => {
  const tabs = [
    {
      key: 'home' as TabKey,
      label: 'HOME',
      icon: Home,
    },
    {
      key: 'remote' as TabKey,
      label: 'CAR REMOTE',
      icon: Gamepad2,
    },
    {
      key: 'map' as TabKey,
      label: 'MAP',
      icon: MapPin,
    },
    {
      key: 'profile' as TabKey,
      label: 'PROFILE',
      icon: UserCheck,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800/80 backdrop-blur-xl pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-4 h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`flex flex-col items-center justify-center relative transition-all duration-200 select-none cursor-pointer ${
                isActive
                  ? 'text-cyan-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              {/* Active glow indicator */}
              {isActive && (
                <div className="absolute top-0 w-12 h-1 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]" />
              )}
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-150 ${
                    isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'
                  }`}
                />
              </div>
              <span className="text-[10px] tracking-wider mt-1 uppercase">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
