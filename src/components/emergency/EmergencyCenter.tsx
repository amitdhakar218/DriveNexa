import React, { useState } from 'react';
import { useDevice } from '../../context/DeviceContext';
import { useAuth } from '../../context/AuthContext';
import { AlertSeverity, SystemAlert } from '../../types';
import {
  ShieldAlert,
  Octagon,
  RotateCcw,
  AlertTriangle,
  Flame,
  BatteryWarning,
  WifiOff,
  Bell,
  CheckCircle,
  Clock,
  Radio,
} from 'lucide-react';

export const EmergencyCenter: React.FC = () => {
  const { device, alerts, emergencyStop, resetEmergency, acknowledgeAlert } = useDevice();
  const { user } = useAuth();
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  const isEmergencyLocked = !!device?.safetyLock;

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'EMERGENCY':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-300">
            EMERGENCY
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300">
            CRITICAL
          </span>
        );
      case 'WARNING':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-800 border border-blue-300">
            WARNING
          </span>
        );
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity === 'ALL') return true;
    return a.severity === filterSeverity;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner / Emergency Killswitch */}
      <div className={`p-6 rounded-2xl border transition-all ${
        isEmergencyLocked
          ? 'bg-rose-50 border-rose-300 shadow-md'
          : 'bg-white border-slate-200/90 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl border ${
              isEmergencyLocked
                ? 'bg-rose-600 text-white border-rose-700 animate-bounce'
                : 'bg-rose-50 text-rose-600 border-rose-200'
            }`}>
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                Emergency Response Center
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                {isEmergencyLocked
                  ? 'ROVER IS CURRENTLY EMERGENCY STOPPED. Physical motors isolated.'
                  : 'System armed and monitoring hardware crash switches, temperatures & battery status.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isEmergencyLocked ? (
              <button
                onClick={resetEmergency}
                className="px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs uppercase flex items-center gap-2 transition cursor-pointer border border-slate-300 shadow-xs"
              >
                <RotateCcw className="w-4 h-4 text-blue-600" />
                <span>Reset Emergency Lock</span>
              </button>
            ) : (
              <button
                onClick={emergencyStop}
                className="px-6 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 transition cursor-pointer shadow-md shadow-rose-600/20"
              >
                <Octagon className="w-5 h-5" />
                <span>Trigger Emergency Stop</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Real Alert Feed */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs text-xs">
          {['ALL', 'EMERGENCY', 'CRITICAL', 'WARNING'].map((f) => (
            <button
              key={f}
              onClick={() => setFilterSeverity(f)}
              className={`px-3 py-1.5 rounded-lg font-bold transition text-xs cursor-pointer ${
                filterSeverity === f
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Real Stored Alerts: <strong className="text-slate-900">{filteredAlerts.length}</strong>
        </span>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-dashed border-slate-200 shadow-xs">
            <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900">No Active Alerts In Range</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No crash triggers, thermal runaway warnings, or hardware connection faults have been recorded.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border transition flex items-start justify-between gap-4 shadow-xs ${
                alert.acknowledged
                  ? 'bg-slate-50 border-slate-200 opacity-60'
                  : alert.severity === 'EMERGENCY'
                  ? 'bg-rose-50 border-rose-200'
                  : alert.severity === 'CRITICAL'
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {alert.severity === 'EMERGENCY' ? (
                    <Octagon className="w-5 h-5 text-rose-600" />
                  ) : alert.severity === 'CRITICAL' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  ) : (
                    <Bell className="w-5 h-5 text-blue-600" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900">{alert.title}</h4>
                    {getSeverityBadge(alert.severity)}
                  </div>
                  <p className="text-xs text-slate-700 mt-1">{alert.message}</p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{new Date(alert.timestamp).toLocaleString()}</span>
                    <span>•</span>
                    <span>Device: {alert.deviceId}</span>
                  </div>
                </div>
              </div>

              {!alert.acknowledged && (
                <button
                  onClick={() => acknowledgeAlert(alert.id)}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition shrink-0 cursor-pointer border border-slate-200"
                >
                  Acknowledge
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
