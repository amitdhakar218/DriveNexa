import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DeviceProvider, useDevice } from './context/DeviceContext';
import { AuthModal } from './components/auth/AuthModal';
import { Header } from './components/layout/Header';
import { BottomNav, TabKey } from './components/layout/BottomNav';
import { MetricCards } from './components/dashboard/MetricCards';
import { RemoteControl } from './components/remote/RemoteControl';
import { VehicleMap } from './components/map/VehicleMap';
import { ProfileView } from './components/profile/ProfileView';
import { EmergencyCenter } from './components/emergency/EmergencyCenter';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { SensorList } from './components/sensors/SensorList';
import { CameraViewer } from './components/camera/CameraViewer';
import { NotFound } from './components/common/NotFound';
import { Logo } from './components/brand/Logo';
import {
  Smartphone,
  Layers,
  Activity,
  Shield,
  Wifi,
  WifiOff,
  BatteryCharging,
  Cpu,
  SlidersHorizontal,
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const { unacknowledgedAlertsCount } = useDevice();
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [subView, setSubView] = useState<'NONE' | 'SENSORS' | 'CAMERA' | '404'>('NONE');
  const [isAndroidView, setIsAndroidView] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-4">
        <Logo size="xl" className="mb-4 animate-pulse" />
        <span className="text-xs font-mono text-cyan-400">
          Initializing DriveNexa Secure Telemetry Engine...
        </span>
      </div>
    );
  }

  // Mandatory Authentication
  if (!user) {
    return <AuthModal />;
  }

  const handleNavigate = (tab: TabKey) => {
    setActiveTab(tab);
    setSubView('NONE');
  };

  const renderContent = () => {
    if (subView === 'SENSORS') {
      return <SensorList />;
    }
    if (subView === 'CAMERA') {
      return <CameraViewer />;
    }
    if (subView === '404') {
      return <NotFound onGoHome={() => handleNavigate('home')} />;
    }

    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6">
            <MetricCards
              onNavigateTab={handleNavigate}
              onOpenSensorManager={() => setSubView('SENSORS')}
              onOpenLiveCamera={() => setSubView('CAMERA')}
            />
          </div>
        );
      case 'remote':
        return <RemoteControl />;
      case 'map':
        return <VehicleMap />;
      case 'profile':
        return <ProfileView />;
      case 'emergency':
        return <EmergencyCenter />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <NotFound onGoHome={() => handleNavigate('home')} />;
    }
  };

  const appBody = (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Platform Header */}
      <Header
        onTabChange={handleNavigate}
        activeTab={activeTab}
        isAndroidView={isAndroidView}
        setIsAndroidView={setIsAndroidView}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-24">
        {/* Breadcrumb if inside subview */}
        {subView !== 'NONE' && (
          <div className="mb-4 flex items-center gap-2 text-xs text-slate-400">
            <button
              onClick={() => setSubView('NONE')}
              className="hover:text-cyan-400 underline cursor-pointer"
            >
              Dashboard
            </button>
            <span>/</span>
            <span className="text-white font-bold uppercase">{subView}</span>
          </div>
        )}

        {renderContent()}
      </main>

      {/* 4 Bottom Navigation Buttons */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={handleNavigate}
        unacknowledgedAlerts={unacknowledgedAlertsCount}
      />
    </div>
  );

  // If user enabled Android Phone Viewport Simulation Mode
  if (isAndroidView) {
    return (
      <div className="min-h-screen bg-slate-900 py-6 px-2 flex flex-col items-center justify-center">
        <div className="mb-3 flex items-center gap-2 text-xs text-slate-400">
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <span>Android Mobile Application Viewport Simulation</span>
          <button
            onClick={() => setIsAndroidView(false)}
            className="text-cyan-400 hover:underline ml-2"
          >
            Switch to Full Responsive Web
          </button>
        </div>

        <div className="w-full max-w-[412px] h-[860px] bg-slate-950 rounded-[44px] border-8 border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col relative">
          {/* Simulated Android Status Bar */}
          <div className="h-7 bg-slate-950 px-6 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none shrink-0 border-b border-slate-900">
            <span>09:41</span>
            <div className="w-16 h-3 bg-slate-900 rounded-full mx-auto" />
            <div className="flex items-center gap-1.5 text-[10px]">
              <Wifi className="w-3 h-3" />
              <span>5G</span>
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-none flex flex-col">
            {appBody}
          </div>
        </div>
      </div>
    );
  }

  return appBody;
};

export default function App() {
  return (
    <AuthProvider>
      <DeviceProvider>
        <MainAppContent />
      </DeviceProvider>
    </AuthProvider>
  );
}
