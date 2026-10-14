import React, { useState } from 'react';
import { useDevice } from '../../context/DeviceContext';
import { useAuth } from '../../context/AuthContext';
import { X, Plus, Cpu, Smartphone, ShieldCheck, AlertCircle } from 'lucide-react';

interface DeviceRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeviceRegistrationModal: React.FC<DeviceRegistrationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { claimDevice, userDevices, setActiveDeviceId, activeDeviceId } = useDevice();
  const { user } = useAuth();
  const [deviceIdInput, setDeviceIdInput] = useState('');
  const [deviceNameInput, setDeviceNameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceIdInput.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      const dev = await claimDevice(deviceIdInput.trim(), deviceNameInput.trim() || deviceIdInput.trim());
      setActiveDeviceId(dev.deviceId);
      setDeviceIdInput('');
      setDeviceNameInput('');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error registering vehicle.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm cursor-pointer"
    >
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative cursor-default">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Manage Rover Vehicles</h3>
            <p className="text-xs text-slate-500">Ownership & Authorized Fleet</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Existing Authorized Devices List */}
        {userDevices.length > 0 && (
          <div className="mb-5 space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Your Authorized Vehicles
            </label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {userDevices.map((dev) => (
                <div
                  key={dev.deviceId}
                  onClick={() => {
                    setActiveDeviceId(dev.deviceId);
                    onClose();
                  }}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    activeDeviceId === dev.deviceId
                      ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs">{dev.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">ID: {dev.deviceId}</div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      dev.status === 'CONNECTED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {dev.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Register / Claim New Device Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Register / Claim Hardware Device
          </label>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Vehicle Device ID / Hardware Serial
            </label>
            <input
              type="text"
              required
              value={deviceIdInput}
              onChange={(e) => setDeviceIdInput(e.target.value)}
              placeholder="e.g. ROVER-ALPHA-01 or ESP32-BOT-4WD"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Custom Callsign / Friendly Name
            </label>
            <input
              type="text"
              value={deviceNameInput}
              onChange={(e) => setDeviceNameInput(e.target.value)}
              placeholder="e.g. Primary Alpha Rover"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
            Claiming a device ties ownership to your authenticated account (<code className="text-blue-600">{user?.email}</code>).
            Unauthenticated operators cannot access vehicle commands or telemetry.
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 text-xs text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 py-2.5 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 cursor-pointer disabled:opacity-50 shadow-xs flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{loading ? 'Registering...' : 'Register Device'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
