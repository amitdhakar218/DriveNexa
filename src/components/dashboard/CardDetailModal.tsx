import React, { useState, useEffect } from 'react';
import { SensorDefinition, TelemetryRecord, SensorStatus } from '../../types';
import { fetchHistoricalTelemetry } from '../../services/firebaseService';
import { TelemetryChart } from './TelemetryChart';
import {
  X,
  Clock,
  Activity,
  AlertTriangle,
  Calendar,
  Radio,
  CheckCircle,
  HelpCircle,
  Cpu,
} from 'lucide-react';

interface CardDetailModalProps {
  sensor: SensorDefinition | null;
  metricTitle: string;
  isOpen: boolean;
  onClose: () => void;
  icon: React.ReactNode;
}

type DateFilter = 'TODAY' | 'YESTERDAY' | '7D' | '30D' | 'CUSTOM';

export const CardDetailModal: React.FC<CardDetailModalProps> = ({
  sensor,
  metricTitle,
  isOpen,
  onClose,
  icon,
}) => {
  const [dateFilter, setDateFilter] = useState<DateFilter>('TODAY');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [history, setHistory] = useState<TelemetryRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!isOpen || !sensor) return;

    const loadHistory = async () => {
      setLoadingHistory(true);
      const now = Date.now();
      let startMs = now - 24 * 60 * 60 * 1000;
      let endMs = now;

      if (dateFilter === 'TODAY') {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        startMs = startOfDay.getTime();
      } else if (dateFilter === 'YESTERDAY') {
        const yStart = new Date();
        yStart.setDate(yStart.getDate() - 1);
        yStart.setHours(0, 0, 0, 0);
        const yEnd = new Date(yStart);
        yEnd.setHours(23, 59, 59, 999);
        startMs = yStart.getTime();
        endMs = yEnd.getTime();
      } else if (dateFilter === '7D') {
        startMs = now - 7 * 24 * 60 * 60 * 1000;
      } else if (dateFilter === '30D') {
        startMs = now - 30 * 24 * 60 * 60 * 1000;
      } else if (dateFilter === 'CUSTOM' && customStart && customEnd) {
        startMs = new Date(customStart).getTime();
        endMs = new Date(customEnd).getTime();
      }

      const records = await fetchHistoricalTelemetry(
        sensor.deviceId,
        sensor.type,
        startMs,
        endMs
      );
      setHistory(records);
      setLoadingHistory(false);
    };

    loadHistory();
  }, [isOpen, sensor, dateFilter, customStart, customEnd]);

  if (!isOpen || !sensor) return null;

  const hasRealValue = sensor.currentValue !== null && sensor.status === 'ACTIVE';

  const getStatusBadge = (status: SensorStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-600/50">
            ACTIVE
          </span>
        );
      case 'NOT CONNECTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-400 border border-amber-600/50">
            NOT CONNECTED
          </span>
        );
      case 'ERROR':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-950 text-red-400 border border-red-600/50">
            ERROR
          </span>
        );
      case 'DISABLED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
            DISABLED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900 text-slate-400 border border-slate-800">
            UNKNOWN
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-cyan-400">
              {icon}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{metricTitle} Detail</h2>
              <p className="text-xs text-slate-400">{sensor.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current State Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-5">
          {/* Current Real Value */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Current Live Value
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              {hasRealValue ? (
                <>
                  <span className="text-3xl font-black text-white">
                    {sensor.currentValue}
                  </span>
                  <span className="text-sm font-semibold text-cyan-400">
                    {sensor.unit}
                  </span>
                </>
              ) : (
                <span className="text-sm font-bold text-amber-400">
                  {sensor.status === 'NOT CONNECTED' ? 'Not Connected' : 'Unavailable'}
                </span>
              )}
            </div>
            <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>
                {sensor.lastUpdate
                  ? `Last reported: ${new Date(sensor.lastUpdate).toLocaleTimeString()}`
                  : 'Awaiting first hardware report'}
              </span>
            </div>
          </div>

          {/* Connection & Sensor Health */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Hardware Status
            </span>
            <div className="mt-2">{getStatusBadge(sensor.status)}</div>
            <div className="mt-3 text-[10px] text-slate-400 flex items-center gap-1">
              <Radio className="w-3 h-3 text-cyan-400" />
              <span>Pin / Interface: {sensor.firmwarePin || 'GPIO Configurable'}</span>
            </div>
          </div>

          {/* Thresholds & Safety Limits */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Safety Thresholds
            </span>
            <div className="mt-1 space-y-1 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Max Safe Limit:</span>
                <span className="font-mono text-cyan-300">
                  {sensor.maxThreshold ? `${sensor.maxThreshold} ${sensor.unit}` : 'Not set'}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Min Safe Limit:</span>
                <span className="font-mono text-cyan-300">
                  {sensor.minThreshold ? `${sensor.minThreshold} ${sensor.unit}` : 'Not set'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Date / Time Filtering */}
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>Historical Telemetry Filter</span>
            </span>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {(['TODAY', 'YESTERDAY', '7D', '30D', 'CUSTOM'] as DateFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setDateFilter(f)}
                  className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition ${
                    dateFilter === f
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {f === '7D' ? '7 Days' : f === '30D' ? '30 Days' : f}
                </button>
              ))}
            </div>
          </div>

          {dateFilter === 'CUSTOM' && (
            <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <input
                type="datetime-local"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg p-2"
              />
              <span className="text-xs text-slate-500">to</span>
              <input
                type="datetime-local"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg p-2"
              />
            </div>
          )}

          {/* Chart Display */}
          {loadingHistory ? (
            <div className="h-44 flex items-center justify-center text-slate-500 text-xs">
              Querying telemetry records...
            </div>
          ) : (
            <TelemetryChart
              data={history}
              unit={sensor.unit}
              metricName={sensor.type}
            />
          )}
        </div>

        {/* Sensor Driver / Firmware Integration Note */}
        <div className="mt-6 p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-slate-300">
          <div className="flex items-center gap-2 font-semibold text-cyan-300 mb-1">
            <Cpu className="w-4 h-4" />
            <span>ESP32 Physical Integration Architecture</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            This metric subscribes to realtime hardware telemetry published from the rover's microcontrollers.
            To connect hardware, use the ESP32 firmware sketch available in the Admin Console to stream readings via Firebase Realtime Database or Firestore.
          </p>
        </div>
      </div>
    </div>
  );
};
