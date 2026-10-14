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
  Camera,
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const { unacknowledgedAlertsCount, device, connectionState } = useDevice();
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
        return (
          <div className="space-y-6">
            {/* Rover Quick Summary & Navigation Header */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                    {device?.name || 'NEXA Car Rover (Amit Dhakar)'}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1.5 font-medium">
                  <span>हार्डवेयर: <strong className="text-slate-700 font-mono">{device?.hardwareModel || 'ESP32-S3 Robotic Rover'}</strong></span>
                  <span>•</span>
                  <span>IP एड्रेस: <strong className="text-blue-700 font-mono">{device?.ipAddress ? device.ipAddress : 'कनेक्शन प्रतीक्षारत (Offline)'}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handleNavigate('remote')}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-xs"
                >
                  <Cpu className="w-4 h-4" />
                  <span>रिमोट कंट्रोल (ड्राइव)</span>
                </button>
                <button
                  onClick={() => handleNavigate('camera')}
                  className="px-3.5 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs flex items-center gap-2 transition cursor-pointer border border-purple-200"
                >
                  <Camera className="w-4 h-4" />
                  <span>लाइव कैमरा</span>
                </button>
              </div>
            </div>

            {/* All Sensor & Vehicle Metric Cards (डिब्बे) */}
            <MetricCards
              onNavigateTab={handleNavigate}
              onOpenSensorManager={() => setSubView('SENSORS')}
              onOpenLiveCamera={() => handleNavigate('camera')}
            />
          </div>
        );
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
