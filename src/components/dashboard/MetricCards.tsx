import React, { useState } from 'react';
import { useDevice } from '../../context/DeviceContext';
import { SensorDefinition } from '../../types';
import { CardDetailModal } from './CardDetailModal';
import { TabKey } from '../layout/BottomNav';
import { DeviceRegistrationModal } from './DeviceRegistrationModal';
import {
  Gauge,
  Thermometer,
  Battery,
  MapPin,
  Camera,
  Wifi,
  Activity,
  ShieldCheck,
  Cog,
  Cpu,
  ChevronRight,
  AlertTriangle,
  Radio,
  Plus,
} from 'lucide-react';

interface MetricCardsProps {
  onNavigateTab: (tab: TabKey) => void;
  onOpenSensorManager: () => void;
  onOpenLiveCamera: () => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  onNavigateTab,
  onOpenSensorManager,
  onOpenLiveCamera,
}) => {
  const { device, sensors, liveGps, connectionState, activeDeviceId } = useDevice();
  const [selectedSensor, setSelectedSensor] = useState<SensorDefinition | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalIcon, setModalIcon] = useState<React.ReactNode>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const speedSensor = sensors.find((s) => s.type === 'speed');
  const tempSensor = sensors.find((s) => s.type === 'temperature');
  const batterySensor = sensors.find((s) => s.type === 'battery');

  const openDetail = (sensor: SensorDefinition | undefined, title: string, icon: React.ReactNode) => {
    if (sensor) {
      setSelectedSensor(sensor);
      setModalTitle(title);
      setModalIcon(icon);
    }
  };

  const isConnected = connectionState === 'CONNECTED';

  return (
    <div className="space-y-4">
      {/* If no device is currently paired or selected */}
      {!device && (
        <div className="p-5 rounded-2xl bg-blue-50/80 border border-blue-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-600 text-white shadow-xs">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">No Vehicle Device Registered</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Register or pair your hardware rover by entering its unique Device ID.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Pair / Claim Rover ID</span>
          </button>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* 1. Speed Card */}
        <div
          onClick={() => openDetail(speedSensor, 'Vehicle Speed', <Gauge className="w-5 h-5" />)}
          className="group p-4.5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between shadow-xs select-none"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
              <Gauge className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
          </div>
          <div className="mt-4">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Speed
            </span>
            <div className="mt-1">
              {isConnected && speedSensor?.currentValue !== null && speedSensor?.status === 'ACTIVE' ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900">{speedSensor?.currentValue}</span>
                  <span className="text-xs font-bold text-blue-600">{speedSensor?.unit}</span>
                </div>
              ) : (
                <span className="text-xs font-bold text-amber-600">
                  {!isConnected ? 'Not Connected' : speedSensor?.status === 'DISABLED' ? 'Disabled' : 'No Data Available'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 2. Temperature Card */}
        <div
          onClick={() => openDetail(tempSensor, 'Motor & Inverter Temperature', <Thermometer className="w-5 h-5" />)}
          className="group p-4.5 rounded-2xl bg-white border border-slate-200/80 hover:border-rose-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between shadow-xs select-none"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600">
              <Thermometer className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-rose-600 group-hover:translate-x-0.5 transition" />
          </div>
          <div className="mt-4">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Temperature
            </span>
            <div className="mt-1">
              {isConnected && tempSensor?.currentValue !== null && tempSensor?.status === 'ACTIVE' ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900">{tempSensor?.currentValue}</span>
                  <span className="text-xs font-bold text-rose-600">{tempSensor?.unit}</span>
                </div>
              ) : (
                <span className="text-xs font-bold text-amber-600">
                  {!isConnected ? 'Not Connected' : tempSensor?.status === 'DISABLED' ? 'Disabled' : 'No Data Available'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3. Battery Card */}
        <div
          onClick={() => openDetail(batterySensor, 'Li-Ion Battery Health', <Battery className="w-5 h-5" />)}
          className="group p-4.5 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between shadow-xs select-none"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
              <Battery className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition" />
          </div>
          <div className="mt-4">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Battery
            </span>
            <div className="mt-1">
              {isConnected && batterySensor?.currentValue !== null && batterySensor?.status === 'ACTIVE' ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900">{batterySensor?.currentValue}</span>
                  <span className="text-xs font-bold text-emerald-600">{batterySensor?.unit}</span>
                </div>
              ) : (
                <span className="text-xs font-bold text-amber-600">
                  {!isConnected ? 'Not Connected' : batterySensor?.status === 'DISABLED' ? 'Disabled' : 'No Data Available'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 4. GPS Card -> Navigates to Map */}
        <div
          onClick={() => onNavigateTab('map')}
          className="group p-4.5 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between shadow-xs select-none"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <MapPin className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
          </div>
          <div className="mt-4">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              GPS Positioning
            </span>
            <div className="mt-1">
              {isConnected && liveGps && liveGps.latitude !== null && liveGps.longitude !== null && liveGps.status === 'FIX_ACQUIRED' ? (
                <div className="text-xs font-mono font-bold text-indigo-800 truncate">
                  {liveGps.latitude.toFixed(4)}, {liveGps.longitude.toFixed(4)}
                </div>
              ) : (
                <span className="text-xs font-bold text-amber-600">
                  {!isConnected ? 'Rover Offline' : 'No GPS data available'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 5. Camera Card -> Opens Live Camera */}
        <div
          onClick={onOpenLiveCamera}
          className="group p-4.5 rounded-2xl bg-white border border-slate-200/80 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between shadow-xs select-none"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-100 text-purple-600">
              <Camera className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600 group-hover:translate-x-0.5 transition" />
          </div>
          <div className="mt-4">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Live Camera
            </span>
            <div className="mt-1">
              <span className={`text-xs font-bold ${
                isConnected && device?.cameraStatus === 'STREAMING' ? 'text-emerald-700' : 'text-amber-600'
              }`}>
                {!isConnected
                  ? 'Rover Disconnected'
                  : device?.cameraStatus === 'STREAMING'
                  ? 'Feed Streaming'
                  : device?.cameraStreamUrl
                  ? 'Configured (Unverified)'
                  : 'Not Connected'}
              </span>
            </div>
          </div>
        </div>

        {/* 6. Signal / Connection Card */}
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 flex flex-col justify-between shadow-xs select-none">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-100 text-sky-600">
              <Wifi className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-slate-500 font-mono font-semibold">Firebase RTDB</span>
          </div>
          <div className="mt-4">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Hardware Heartbeat
            </span>
            <div className="mt-1">
              <span className={`text-xs font-bold ${
                isConnected ? 'text-emerald-700' : 'text-amber-600'
              }`}>
                {isConnected ? 'Active ESP32 Stream' : 'Disconnected / Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* 7. Sensor Health Card -> Opens Sensor Management */}
        <div
          onClick={onOpenSensorManager}
          className="group p-4.5 rounded-2xl bg-white border border-slate-200/80 hover:border-teal-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between shadow-xs select-none"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-100 text-teal-600">
              <Activity className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600 group-hover:translate-x-0.5 transition" />
          </div>
          <div className="mt-4">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Sensor Health
            </span>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                {sensors.filter((s) => s.status === 'ACTIVE').length} / {sensors.length} Active
              </span>
              <span className="text-[10px] font-semibold text-teal-600">Manage</span>
            </div>
          </div>
        </div>

        {/* 8. Safety Status Card -> Navigates to Emergency */}
        <div
          onClick={() => onNavigateTab('emergency')}
          className="group p-4.5 rounded-2xl bg-white border border-slate-200/80 hover:border-red-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between shadow-xs select-none"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-rose-600 group-hover:translate-x-0.5 transition" />
          </div>
          <div className="mt-4">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Safety Status
            </span>
            <div className="mt-1">
              <span className={`text-xs font-bold ${
                device?.safetyLock ? 'text-rose-700' : 'text-emerald-700'
              }`}>
                {device?.safetyLock ? 'EMERGENCY LOCK' : 'Safety Disarmed'}
              </span>
            </div>
          </div>
        </div>

        {/* 9. Motor Status Card -> Navigates to Car Remote */}
        <div
          onClick={() => onNavigateTab('remote')}
          className="group p-4.5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between shadow-xs select-none"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-600">
              <Cog className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
          </div>
          <div className="mt-4">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Motor Status
            </span>
            <div className="mt-1">
              <span className="text-xs font-bold text-slate-800">
                {isConnected && device?.motorStatus && device.motorStatus !== 'UNKNOWN'
                  ? device.motorStatus
                  : !isConnected
                  ? 'Not Connected'
                  : 'No Data Available'}
              </span>
            </div>
          </div>
        </div>

        {/* 10. Device Model Card */}
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 flex flex-col justify-between shadow-xs select-none">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-slate-500 font-mono font-semibold">
              {device?.firmwareVersion || 'v1.0.4'}
            </span>
          </div>
          <div className="mt-4">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Device Model
            </span>
            <div className="mt-1">
              <span className="text-xs font-bold text-slate-800 truncate block">
                {device?.hardwareModel || (activeDeviceId ? activeDeviceId : 'No Device Selected')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <CardDetailModal
        sensor={selectedSensor}
        metricTitle={modalTitle}
        isOpen={!!selectedSensor}
        onClose={() => setSelectedSensor(null)}
        icon={modalIcon}
      />

      {/* Device Registration Modal */}
      <DeviceRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />
    </div>
  );
};
