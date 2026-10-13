import React from 'react';
import { Home, Gamepad2, Camera, MapPin, UserCheck } from 'lucide-react';

export type TabKey = 'home' | 'remote' | 'camera' | 'map' | 'profile' | 'admin' | 'emergency';

interface BottomNavProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  unacknowledgedAlerts: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs = [
    {
      key: 'home' as TabKey,
      label: 'HOME',
      icon: Home,
    },
    {
      key: 'remote' as TabKey,
      label: 'REMOTE',
      icon: Gamepad2,
    },
    {
      key: 'camera' as TabKey,
      label: 'CAMERA',
      icon: Camera,
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-slate-200 shadow-lg backdrop-blur-md pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-5 h-16 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`flex flex-col items-center justify-center relative transition-all duration-150 select-none cursor-pointer ${
                isActive
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              {/* Active top line indicator */}
              {isActive && (
                <div className="absolute top-0 w-10 h-0.5 bg-blue-600 rounded-full" />
              )}
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-150 ${
                    isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'
                  }`}
                />
              </div>
              <span className="text-[10px] tracking-wider mt-1 uppercase font-semibold">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
