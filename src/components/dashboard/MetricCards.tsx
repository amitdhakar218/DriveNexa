import React, { useState } from 'react';
import { useDevice } from '../../context/DeviceContext';
import { SensorDefinition } from '../../types';
import { CardDetailModal } from './CardDetailModal';
import { TabKey } from '../layout/BottomNav';
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
  const { device, sensors, liveGps } = useDevice();
  const [selectedSensor, setSelectedSensor] = useState<SensorDefinition | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalIcon, setModalIcon] = useState<React.ReactNode>(null);

  const speedSensor = sensors.find((s) => s.type === 'speed');
  const tempSensor = sensors.find((s) => s.type === 'temperature');
  const batterySensor = sensors.find((s) => s.type === 'battery');
  const distanceSensor = sensors.find((s) => s.type === 'distance');
  const imuSensor = sensors.find((s) => s.type === 'accelerometer');

  const openDetail = (sensor: SensorDefinition | undefined, title: string, icon: React.ReactNode) => {
    if (sensor) {
      setSelectedSensor(sensor);
      setModalTitle(title);
      setModalIcon(icon);
    }
  };

  const isOnline = device?.status === 'ONLINE';

  return (
    <div className="space-y-4">
      {/* Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* 1. Speed Card */}
        <div
          onClick={() => openDetail(speedSensor, 'Vehicle Speed', <Gauge className="w-5 h-5" />)}
          className="group p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/80 transition cursor-pointer flex flex-col justify-between relative overflow-hidden shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-800/50 text-cyan-400">
              <Gauge className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition" />
          </div>
          <div className="mt-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Speed
            </span>
            <div className="mt-1">
              {speedSensor?.currentValue !== null && speedSensor?.status === 'ACTIVE' ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white">{speedSensor?.currentValue}</span>
                  <span className="text-xs font-semibold text-cyan-400">{speedSensor?.unit}</span>
                </div>
              ) : (
                <span className="text-xs font-bold text-amber-400/90">
                  {speedSensor?.status === 'NOT CONNECTED' ? 'Not Connected' : 'Unavailable'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 2. Temperature Card */}
        <div
          onClick={() => openDetail(tempSensor, 'Motor & Inverter Temperature', <Thermometer className="w-5 h-5" />)}
          className="group p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/80 transition cursor-pointer flex flex-col justify-between relative overflow-hidden shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-800/50 text-rose-400">
              <Thermometer className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-rose-400 group-hover:translate-x-0.5 transition" />
          </div>
          <div className="mt-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Temperature
            </span>
            <div className="mt-1">
              {tempSensor?.currentValue !== null && tempSensor?.status === 'ACTIVE' ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white">{tempSensor?.currentValue}</span>
                  <span className="text-xs font-semibold text-rose-400">{tempSensor?.unit}</span>
                </div>
              ) : (
                <span className="text-xs font-bold text-amber-400/90">
                  {tempSensor?.status === 'NOT CONNECTED' ? 'Not Connected' : 'Unavailable'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3. Battery Card */}
        <div
          onClick={() => openDetail(batterySensor, 'Li-Ion Battery Health', <Battery className="w-5 h-5" />)}
          className="group p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/80 transition cursor-pointer flex flex-col justify-between relative overflow-hidden shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-emerald-400">
              <Battery className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition" />
          </div>
          <div className="mt-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Battery
            </span>
            <div className="mt-1">
              {batterySensor?.currentValue !== null && batterySensor?.status === 'ACTIVE' ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white">{batterySensor?.currentValue}</span>
                  <span className="text-xs font-semibold text-emerald-400">{batterySensor?.unit}</span>
                </div>
              ) : (
                <span className="text-xs font-bold text-amber-400/90">
                  {batterySensor?.status === 'NOT CONNECTED' ? 'Not Connected' : 'Unavailable'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 4. GPS Card -> Navigates to Map */}
        <div
          onClick={() => onNavigateTab('map')}
          className="group p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/80 transition cursor-pointer flex flex-col justify-between relative overflow-hidden shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-indigo-950/60 border border-indigo-800/50 text-indigo-400">
              <MapPin className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition" />
          </div>
          <div className="mt-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              GPS Positioning
            </span>
            <div className="mt-1">
              {liveGps && liveGps.latitude !== null && liveGps.longitude !== null ? (
                <div className="text-xs font-mono font-bold text-indigo-300 truncate">
                  {liveGps.latitude.toFixed(4)}, {liveGps.longitude.toFixed(4)}
                </div>
              ) : (
                <span className="text-xs font-bold text-amber-400/90">
                  GPS Not Connected
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 5. Camera Card -> Opens Live Camera */}
        <div
          onClick={onOpenLiveCamera}
          className="group p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/80 transition cursor-pointer flex flex-col justify-between relative overflow-hidden shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-800/50 text-purple-400">
              <Camera className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 group-hover:translate-x-0.5 transition" />
          </div>
          <div className="mt-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Live Camera
            </span>
            <div className="mt-1">
              <span className={`text-xs font-bold ${
                device?.cameraStatus === 'CONNECTED' ? 'text-emerald-400' : 'text-amber-400/90'
              }`}>
                {device?.cameraStatus === 'CONNECTED' ? 'Feed Connected' : 'Camera Not Connected'}
              </span>
            </div>
          </div>
        </div>

        {/* 6. Signal / Connection Card */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-blue-950/60 border border-blue-800/50 text-blue-400">
              <Wifi className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Firebase RTDB</span>
          </div>
          <div className="mt-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Signal & Gateway
            </span>
            <div className="mt-1">
              <span className={`text-xs font-bold ${
                isOnline ? 'text-emerald-400' : 'text-amber-400/90'
              }`}>
                {isOnline ? 'Active ESP32 Gateway' : 'No Connection'}
              </span>
            </div>
          </div>
        </div>

        {/* 7. Sensor Health Card -> Opens Sensor Management */}
        <div
          onClick={onOpenSensorManager}
          className="group p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/80 transition cursor-pointer flex flex-col justify-between relative overflow-hidden shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-teal-950/60 border border-teal-800/50 text-teal-400">
              <Activity className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-teal-400 group-hover:translate-x-0.5 transition" />
          </div>
          <div className="mt-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Sensor Health
            </span>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs font-bold text-white">
                {sensors.filter((s) => s.status === 'ACTIVE').length} / {sensors.length} Active
              </span>
              <span className="text-[10px] text-slate-500">Manage</span>
            </div>
          </div>
        </div>

        {/* 8. Safety Status Card -> Navigates to Emergency */}
        <div
          onClick={() => onNavigateTab('emergency')}
          className="group p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-red-500/50 hover:bg-slate-800/80 transition cursor-pointer flex flex-col justify-between relative overflow-hidden shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-red-950/60 border border-red-800/50 text-red-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-red-400 group-hover:translate-x-0.5 transition" />
          </div>
          <div className="mt-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Safety Status
            </span>
            <div className="mt-1">
              <span className={`text-xs font-bold ${
                device?.safetyLock ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {device?.safetyLock ? 'EMERGENCY LOCK' : 'Safety Disarmed'}
              </span>
            </div>
          </div>
        </div>

        {/* 9. Motor Status Card -> Navigates to Car Remote */}
        <div
          onClick={() => onNavigateTab('remote')}
          className="group p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/80 transition cursor-pointer flex flex-col justify-between relative overflow-hidden shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-800/50 text-amber-400">
              <Cog className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition" />
          </div>
          <div className="mt-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Motor Status
            </span>
            <div className="mt-1">
              <span className="text-xs font-bold text-slate-300">
                {device?.motorStatus || 'STANDBY'}
              </span>
            </div>
          </div>
        </div>

        {/* 10. Device Status Card */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              {device?.firmwareVersion || 'v1.0.4'}
            </span>
          </div>
          <div className="mt-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Device Model
            </span>
            <div className="mt-1">
              <span className="text-xs font-semibold text-slate-300 truncate block">
                {device?.hardwareModel || 'ESP32 Rover'}
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
    </div>
  );
};
