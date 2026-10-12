import React, { useState } from 'react';
import { SensorDefinition, SensorType } from '../../types';
import { X, Plus, Cpu, ShieldCheck } from 'lucide-react';

interface AddSensorModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string;
  onAdd: (sensor: SensorDefinition) => Promise<void>;
}

export const AddSensorModal: React.FC<AddSensorModalProps> = ({
  isOpen,
  onClose,
  deviceId,
  onAdd,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<SensorType>('distance');
  const [unit, setUnit] = useState('cm');
  const [pin, setPin] = useState('GPIO14');
  const [protocol, setProtocol] = useState<'I2C' | 'SPI' | 'UART' | 'ADC' | 'GPIO'>('GPIO');
  const [minThreshold, setMinThreshold] = useState<string>('');
  const [maxThreshold, setMaxThreshold] = useState<string>('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const id = `sens_${type}_${Date.now().toString(36).substring(4)}`;

    const newSensor: SensorDefinition = {
      id,
      deviceId,
      name,
      type,
      status: 'NOT CONNECTED', // Honest default: NOT connected until firmware reports!
      enabled: true,
      currentValue: null,
      unit,
      lastUpdate: null,
      firmwarePin: pin,
      firmwareProtocol: protocol,
      minThreshold: minThreshold ? Number(minThreshold) : undefined,
      maxThreshold: maxThreshold ? Number(maxThreshold) : undefined,
    };

    try {
      await onAdd(newSensor);
      onClose();
    } catch (err) {
      console.error('Error adding sensor:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Register Sensor Plug-In</h2>
              <p className="text-xs text-slate-400">Future Hardware Integration Definition</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Sensor Label & Model
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sharp GP2Y0A21YK0F IR Rangefinder"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Sensor Category
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as SensorType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="distance">Distance / Proximity</option>
                <option value="speed">Speed / Tachometer</option>
                <option value="temperature">Temperature</option>
                <option value="battery">Battery Voltage</option>
                <option value="accelerometer">Accelerometer / IMU</option>
                <option value="gyroscope">Gyroscope</option>
                <option value="crash">Crash / Impact Switch</option>
                <option value="camera">Camera Stream</option>
                <option value="custom">Custom Sensor</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Measurement Unit
              </label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. cm, °C, V, m/s²"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Microcontroller Pin
              </label>
              <input
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="e.g. GPIO14 or SDA/SCL"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Hardware Protocol
              </label>
              <select
                value={protocol}
                onChange={(e) => setProtocol(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="GPIO">Digital GPIO</option>
                <option value="ADC">Analog (ADC)</option>
                <option value="I2C">I2C Bus</option>
                <option value="SPI">SPI Bus</option>
                <option value="UART">UART Serial</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Min Safety Limit (Optional)
              </label>
              <input
                type="number"
                value={minThreshold}
                onChange={(e) => setMinThreshold(e.target.value)}
                placeholder="Optional lower limit"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Max Safety Limit (Optional)
              </label>
              <input
                type="number"
                value={maxThreshold}
                onChange={(e) => setMaxThreshold(e.target.value)}
                placeholder="Optional upper limit"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
            Registered sensors will display as <strong>NOT CONNECTED</strong> until the physical ESP32 firmware begins reporting matching telemetry readings.
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 text-xs text-slate-400 bg-slate-800 rounded-xl hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 py-2.5 text-xs font-bold text-slate-950 bg-cyan-400 rounded-xl hover:bg-cyan-300 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Save Sensor Definition'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
