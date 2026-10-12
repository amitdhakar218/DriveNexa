import React, { useState } from 'react';
import { useDevice } from '../../context/DeviceContext';
import { SensorDefinition, SensorStatus } from '../../types';
import { AddSensorModal } from './AddSensorModal';
import {
  Activity,
  Plus,
  Power,
  PowerOff,
  Cpu,
  Radio,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  XCircle,
  Clock,
  Layers,
} from 'lucide-react';

export const SensorList: React.FC = () => {
  const { sensors, device, toggleSensor, addNewSensor } = useDevice();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('ALL');

  const getStatusBadge = (status: SensorStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-600/40">
            <CheckCircle2 className="w-3 h-3" />
            ACTIVE
          </span>
        );
      case 'NOT CONNECTED':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950 text-amber-400 border border-amber-600/40">
            <AlertCircle className="w-3 h-3" />
            NOT CONNECTED
          </span>
        );
      case 'ERROR':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-950 text-red-400 border border-red-600/40">
            <XCircle className="w-3 h-3" />
            ERROR
          </span>
        );
      case 'DISABLED':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
            <PowerOff className="w-3 h-3" />
            DISABLED
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-900 text-slate-400 border border-slate-800">
            <HelpCircle className="w-3 h-3" />
            UNKNOWN
          </span>
        );
    }
  };

  const filteredSensors = sensors.filter((s) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'ACTIVE') return s.status === 'ACTIVE';
    if (filterType === 'DISCONNECTED') return s.status === 'NOT CONNECTED';
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white uppercase tracking-wider">
              Sensor Management
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
              Hardware Bus v1.0
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Realtime telemetry status for onboard ESP32 peripherals. The system never fakes active hardware.
          </p>
        </div>

        {/* Action: Add Sensor Plug-in */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-slate-950 font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-lg shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Sensor Plug-In</span>
        </button>
      </div>

      {/* Filter Tabs & Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          {['ALL', 'ACTIVE', 'DISCONNECTED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`px-3 py-1.5 rounded-lg font-medium transition text-xs ${
                filterType === f
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {f} ({sensors.filter((s) => (f === 'ALL' ? true : f === 'ACTIVE' ? s.status === 'ACTIVE' : s.status === 'NOT CONNECTED')).length})
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-400">
          Showing <span className="text-white font-bold">{filteredSensors.length}</span> configured sensors
        </div>
      </div>

      {/* Sensor Table / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSensors.map((sensor) => {
          const isEnabled = sensor.enabled;
          const hasValue = sensor.currentValue !== null && sensor.status === 'ACTIVE';

          return (
            <div
              key={sensor.id}
              className={`p-5 rounded-2xl border transition ${
                isEnabled
                  ? 'bg-slate-900/90 border-slate-800'
                  : 'bg-slate-950/60 border-slate-800/60 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{sensor.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-mono">
                      <span>ID: {sensor.id}</span>
                      <span>•</span>
                      <span>Type: {sensor.type}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSensor(sensor.id, !isEnabled)}
                    title={isEnabled ? 'Disable Sensor' : 'Enable Sensor'}
                    className={`p-1.5 rounded-lg border transition cursor-pointer ${
                      isEnabled
                        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400 hover:bg-emerald-900/80'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Status & Values */}
              <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                    Connection Status
                  </span>
                  <div className="mt-1">{getStatusBadge(sensor.status)}</div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                    Telemetry Reading
                  </span>
                  <div className="mt-1 text-sm font-bold text-white">
                    {hasValue ? (
                      <span>
                        {sensor.currentValue} <span className="text-xs text-cyan-400">{sensor.unit}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-amber-400/90">
                        {sensor.status === 'NOT CONNECTED' ? 'Not Connected' : 'Unavailable'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Hardware Pin & Protocol info */}
              <div className="mt-3 pt-3 border-t border-slate-800/50 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-slate-500" />
                  <span>Pin: {sensor.firmwarePin || 'GPIO N/A'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    {sensor.lastUpdate
                      ? new Date(sensor.lastUpdate).toLocaleTimeString()
                      : 'No report'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Plug-in Architecture Note */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2">
        <div className="flex items-center gap-2 font-bold text-cyan-400">
          <Cpu className="w-4 h-4" />
          <span>Future Sensor Plug-In Architecture (Section 14)</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Adding a new sensor definition registers its key in Firebase.
          Physical hardware requires corresponding wiring on the ESP32 (I2C, SPI, UART, or ADC), firmware driver support, and JSON telemetry push.
          When the firmware reports the sensor ID, DriveNexa automatically displays live readings without code changes.
        </p>
      </div>

      {/* Add Sensor Modal */}
      <AddSensorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        deviceId={device?.deviceId || 'ROVER-ESP32-01'}
        onAdd={addNewSensor}
      />
    </div>
  );
};
