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
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            ACTIVE
          </span>
        );
      case 'NOT CONNECTED':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            NOT CONNECTED
          </span>
        );
      case 'ERROR':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            ERROR
          </span>
        );
      case 'DISABLED':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <PowerOff className="w-3 h-3" />
            DISABLED
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
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
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              Sensor Management
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Hardware Bus v1.0
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Realtime telemetry status for onboard ESP32 peripherals. The system never fakes active hardware.
          </p>
        </div>

        {/* Action: Add Sensor Plug-in */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-sm shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Sensor Plug-In</span>
        </button>
      </div>

      {/* Filter Tabs & Count */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs text-xs">
          {['ALL', 'ACTIVE', 'DISCONNECTED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`px-3 py-1.5 rounded-lg font-bold transition text-xs cursor-pointer ${
                filterType === f
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {f} ({sensors.filter((s) => (f === 'ALL' ? true : f === 'ACTIVE' ? s.status === 'ACTIVE' : s.status === 'NOT CONNECTED')).length})
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="text-slate-900 font-bold">{filteredSensors.length}</span> configured sensors
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
              className={`p-5 rounded-2xl border transition-all shadow-xs ${
                isEnabled
                  ? 'bg-white border-slate-200/90'
                  : 'bg-slate-50/70 border-slate-200/60 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{sensor.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-mono">
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
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Status & Values */}
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Connection Status
                  </span>
                  <div className="mt-1">{getStatusBadge(sensor.status)}</div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Telemetry Reading
                  </span>
                  <div className="mt-1 text-sm font-black text-slate-900">
                    {hasValue ? (
                      <span>
                        {sensor.currentValue} <span className="text-xs text-blue-600">{sensor.unit}</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-amber-700">
                        {sensor.status === 'NOT CONNECTED' ? 'Not Connected' : 'Unavailable'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Hardware Pin & Protocol info */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-slate-400" />
                  <span>Pin: {sensor.firmwarePin || 'GPIO N/A'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
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

      {/* Plug-in Architecture Details */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm text-xs text-slate-700 space-y-2">
        <div className="flex items-center gap-2 font-bold text-blue-900">
          <Cpu className="w-4 h-4 text-blue-600" />
          <span>Future Sensor Plug-In Architecture (Section 15 & 16)</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Adding a sensor registers its key in Firebase.
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
