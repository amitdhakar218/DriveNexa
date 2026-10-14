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
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            ACTIVE
          </span>
        );
      case 'NOT_CONNECTED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            NOT CONNECTED
          </span>
        );
      case 'ERROR':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            ERROR
          </span>
        );
      case 'DISABLED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            DISABLED
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
            UNKNOWN
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
              {icon}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{metricTitle} Detail</h2>
              <p className="text-xs text-slate-500">{sensor.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg bg-slate-50 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current State Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-5">
          {/* Current Real Value */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Current Live Value
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              {hasRealValue ? (
                <>
                  <span className="text-3xl font-extrabold text-slate-900">
                    {sensor.currentValue}
                  </span>
                  <span className="text-sm font-semibold text-blue-600">
                    {sensor.unit}
                  </span>
                </>
              ) : (
                <span className="text-sm font-bold text-amber-700">
                  {sensor.status === 'NOT_CONNECTED' ? 'Not Connected' : 'Unavailable'}
                </span>
              )}
            </div>
            <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1 font-medium">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>
                {sensor.lastUpdate
                  ? `Last reported: ${new Date(sensor.lastUpdate).toLocaleTimeString()}`
                  : 'Awaiting hardware report'}
              </span>
            </div>
          </div>

          {/* Connection & Sensor Health */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Hardware Status
            </span>
            <div className="mt-2">{getStatusBadge(sensor.status)}</div>
            <div className="mt-3 text-[10px] text-slate-600 font-medium flex items-center gap-1">
              <Radio className="w-3 h-3 text-blue-500" />
              <span>Pin / Interface: {sensor.firmwarePin || 'GPIO Configurable'}</span>
            </div>
          </div>

          {/* Thresholds & Safety Limits */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Safety Thresholds
            </span>
            <div className="mt-1 space-y-1 text-xs">
              <div className="flex justify-between text-slate-700">
                <span>Max Safe Limit:</span>
                <span className="font-mono font-bold text-slate-900">
                  {sensor.maxThreshold ? `${sensor.maxThreshold} ${sensor.unit}` : 'Not set'}
                </span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Min Safe Limit:</span>
                <span className="font-mono font-bold text-slate-900">
                  {sensor.minThreshold ? `${sensor.minThreshold} ${sensor.unit}` : 'Not set'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Date / Time Filtering */}
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Historical Telemetry Filter</span>
            </span>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              {(['TODAY', 'YESTERDAY', '7D', '30D', 'CUSTOM'] as DateFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setDateFilter(f)}
                  className={`px-3 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                    dateFilter === f
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {f === '7D' ? '7 Days' : f === '30D' ? '30 Days' : f}
                </button>
              ))}
            </div>
          </div>

          {dateFilter === 'CUSTOM' && (
            <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <input
                type="datetime-local"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-white border border-slate-300 text-xs text-slate-900 rounded-lg p-2"
              />
              <span className="text-xs text-slate-500 font-medium">to</span>
              <input
                type="datetime-local"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-white border border-slate-300 text-xs text-slate-900 rounded-lg p-2"
              />
            </div>
          )}

          {/* Chart Display */}
          {loadingHistory ? (
            <div className="h-44 flex items-center justify-center text-slate-500 text-xs">
              Querying historical telemetry...
            </div>
          ) : (
            <TelemetryChart
              data={history}
              unit={sensor.unit}
              metricName={sensor.type}
            />
          )}
        </div>
      </div>
    </div>
  );
};
