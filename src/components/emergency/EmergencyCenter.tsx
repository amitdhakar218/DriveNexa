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
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-950 text-red-400 border border-red-600 animate-pulse">
            EMERGENCY
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-950 text-amber-400 border border-amber-600">
            CRITICAL
          </span>
        );
      case 'WARNING':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-950 text-blue-400 border border-blue-600">
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
          ? 'bg-red-950/80 border-red-600 shadow-2xl shadow-red-950/50'
          : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl border ${
              isEmergencyLocked
                ? 'bg-red-600 text-white border-red-400 animate-bounce'
                : 'bg-slate-800 text-red-400 border-slate-700'
            }`}>
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white uppercase tracking-wider">
                Emergency Response Center
              </h1>
              <p className="text-xs text-slate-300 mt-1">
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
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase flex items-center gap-2 transition cursor-pointer border border-slate-600"
              >
                <RotateCcw className="w-4 h-4 text-cyan-400" />
                <span>Reset Emergency Lock</span>
              </button>
            ) : (
              <button
                onClick={emergencyStop}
                className="px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 transition cursor-pointer shadow-xl shadow-red-600/40"
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
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          {['ALL', 'EMERGENCY', 'CRITICAL', 'WARNING'].map((f) => (
            <button
              key={f}
              onClick={() => setFilterSeverity(f)}
              className={`px-3 py-1.5 rounded-lg font-medium transition text-xs ${
                filterSeverity === f
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400">
          Real Stored Alerts: <strong className="text-white">{filteredAlerts.length}</strong>
        </span>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-dashed border-slate-800">
            <CheckCircle className="w-10 h-10 text-emerald-400/80 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white">No Active Alerts In Range</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No crash triggers, thermal thresholds, or connection faults have been recorded.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border transition flex items-start justify-between gap-4 ${
                alert.acknowledged
                  ? 'bg-slate-950/70 border-slate-800/80 opacity-70'
                  : alert.severity === 'EMERGENCY'
                  ? 'bg-red-950/40 border-red-800/80'
                  : alert.severity === 'CRITICAL'
                  ? 'bg-amber-950/40 border-amber-800/80'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {alert.severity === 'EMERGENCY' ? (
                    <Octagon className="w-5 h-5 text-red-400" />
                  ) : alert.severity === 'CRITICAL' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  ) : (
                    <Bell className="w-5 h-5 text-cyan-400" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white">{alert.title}</h4>
                    {getSeverityBadge(alert.severity)}
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{alert.message}</p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(alert.timestamp).toLocaleString()}</span>
                    <span>•</span>
                    <span>Device: {alert.deviceId}</span>
                  </div>
                </div>
              </div>

              {!alert.acknowledged && (
                <button
                  onClick={() => acknowledgeAlert(alert.id)}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition shrink-0 cursor-pointer"
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
