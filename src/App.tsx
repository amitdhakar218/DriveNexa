import React, { useState, useEffect } from 'react';
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
import { RoverCockpit } from './components/dashboard/RoverCockpit';
import { NotFound } from './components/common/NotFound';
import { Logo } from './components/brand/Logo';
import {
  Activity,
  Shield,
  Wifi,
  WifiOff,
  Cpu,
  Layers,
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const { unacknowledgedAlertsCount } = useDevice();
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [subView, setSubView] = useState<'NONE' | 'SENSORS' | 'CAMERA' | '404'>('NONE');

  // Dynamic SEO Page Titles (Section 25)
  useEffect(() => {
    let title = 'DriveNexa – Home';
    if (subView === 'SENSORS') {
      title = 'DriveNexa – Sensors & Telemetry';
    } else if (subView === 'CAMERA') {
      title = 'DriveNexa – Live Camera';
    } else if (subView === '404') {
      title = 'DriveNexa – Page Not Found';
    } else {
      switch (activeTab) {
        case 'home':
          title = 'DriveNexa – Vehicle Monitoring';
          break;
        case 'remote':
          title = 'DriveNexa – Remote Control';
          break;
        case 'camera':
          title = 'DriveNexa – Live Hardware Camera';
          break;
        case 'map':
          title = 'DriveNexa – Live Map';
          break;
        case 'profile':
          title = 'DriveNexa – Profile';
          break;
        case 'emergency':
          title = 'DriveNexa – Emergency Center';
          break;
        case 'admin':
          title = 'DriveNexa – Admin Dashboard';
          break;
        default:
          title = 'DriveNexa – Vehicle Monitoring';
      }
    }
    document.title = title;
  }, [activeTab, subView]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center p-4">
        <Logo size="xl" className="mb-4" />
        <div className="flex items-center gap-2 text-xs font-bold text-blue-700 bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200 mt-2">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
          <span>Initializing DriveNexa Secure Platform...</span>
        </div>
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
      case 'remote':
        return <RoverCockpit />;
      case 'camera':
        return <CameraViewer />;
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-600/15 selection:text-blue-900 font-sans">
      {/* Platform Header */}
      <Header
        onTabChange={handleNavigate}
        activeTab={activeTab}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-24 md:pb-12">
        {/* Breadcrumb if inside a subview */}
        {subView !== 'NONE' && (
          <div className="mb-4 flex items-center gap-2 text-xs text-slate-500 font-medium">
            <button
              onClick={() => setSubView('NONE')}
              className="hover:text-blue-600 underline cursor-pointer"
            >
              Dashboard
            </button>
            <span>/</span>
            <span className="text-slate-900 font-bold uppercase">{subView}</span>
          </div>
        )}

        {renderContent()}
      </main>

      {/* Mobile Bottom Navigation (Responsive: hidden on md and up) */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={handleNavigate}
        unacknowledgedAlerts={unacknowledgedAlertsCount}
      />
    </div>
  );
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
