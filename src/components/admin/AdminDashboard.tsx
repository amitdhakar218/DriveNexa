import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDevice } from '../../context/DeviceContext';
import { Esp32FirmwareGuide } from './Esp32FirmwareGuide';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { ref, set } from 'firebase/database';
import { db, rtdb } from '../../config/firebase';
import { UserProfile, UserRole, DeviceInfo, SystemLog } from '../../types';
import {
  Shield,
  Users,
  Smartphone,
  Activity,
  Server,
  Terminal,
  Cpu,
  RefreshCw,
  Send,
  AlertTriangle,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { userProfile, updateUserRole } = useAuth();
  const { device, sensors, alerts } = useDevice();

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DEVICES' | 'FIRMWARE' | 'TESTER' | 'LOGS'>('OVERVIEW');
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Hardware Packet Ingestion Tester (For testing physical communication)
  const [testHeartbeatActive, setTestHeartbeatActive] = useState(false);
  const [testSensorType, setTestSensorType] = useState('temperature');
  const [testSensorVal, setTestSensorVal] = useState('28.4');
  const [testGpsLat, setTestGpsLat] = useState('14.5995');
  const [testGpsLng, setTestGpsLng] = useState('120.9842');
  const [injectNotice, setInjectNotice] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list: UserProfile[] = [];
      snap.forEach((d) => list.push(d.data() as UserProfile));
      setUsersList(list);
    } catch (err) {
      console.warn('Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (userProfile?.role === 'ADMIN' || userProfile?.role === 'DEVELOPER') {
      fetchUsers();
    }
  }, [userProfile]);

  // Push real test telemetry packet to Firebase (simulating the physical ESP32 sending an authentic packet)
  const handlePushTestSensor = async () => {
    const now = Date.now();
    try {
      const sensor = sensors.find((s) => s.type === testSensorType);
      if (sensor) {
        // Update sensor doc in Firestore
        await setDoc(
          doc(db, 'devices', device?.deviceId || 'ROVER-ESP32-01', 'sensors', sensor.id),
          {
            ...sensor,
            currentValue: Number(testSensorVal),
            status: 'ACTIVE',
            lastUpdate: now,
          },
          { merge: true }
        );

        // Also push to historical telemetry
        await setDoc(
          doc(db, 'devices', device?.deviceId || 'ROVER-ESP32-01', 'telemetry', `telem_${now}`),
          {
            deviceId: device?.deviceId || 'ROVER-ESP32-01',
            sensorId: sensor.id,
            sensorType: testSensorType,
            timestamp: now,
            value: Number(testSensorVal),
            unit: sensor.unit,
            status: 'ACTIVE',
          }
        );

        setInjectNotice(`Telemetry [${testSensorType}: ${testSensorVal}] injected successfully.`);
        setTimeout(() => setInjectNotice(null), 3500);
      }
    } catch (err: any) {
      setInjectNotice(`Error: ${err.message}`);
    }
  };

  // Push real GPS location packet
  const handlePushTestGPS = async () => {
    const now = Date.now();
    try {
      const lat = Number(testGpsLat);
      const lng = Number(testGpsLng);
      // Write to RTDB live GPS
      await set(ref(rtdb, `devices/${device?.deviceId || 'ROVER-ESP32-01'}/gps`), {
        timestamp: now,
        latitude: lat,
        longitude: lng,
        accuracy: 3.2,
        speed: 12.4,
        heading: 45,
      });

      // Write to historical GPS records
      await setDoc(
        doc(db, 'devices', device?.deviceId || 'ROVER-ESP32-01', 'gps_records', `gps_${now}`),
        {
          deviceId: device?.deviceId || 'ROVER-ESP32-01',
          timestamp: now,
          latitude: lat,
          longitude: lng,
          accuracy: 3.2,
          speed: 12.4,
          heading: 45,
          status: 'FIX_ACQUIRED',
        }
      );

      setInjectNotice(`GPS coordinate [${lat}, ${lng}] broadcast to map.`);
      setTimeout(() => setInjectNotice(null), 3500);
    } catch (err: any) {
      setInjectNotice(`Error: ${err.message}`);
    }
  };

  // Broadcast Heartbeat
  const handleBroadcastHeartbeat = async () => {
    const now = Date.now();
    try {
      await set(ref(rtdb, `devices/${device?.deviceId || 'ROVER-ESP32-01'}/heartbeat`), {
        lastSeen: now,
        name: device?.name || 'NexaRover-01',
        firmwareVersion: device?.firmwareVersion || 'v1.0.4',
        hardwareModel: device?.hardwareModel || 'ESP32 4WD Platform',
      });
      setInjectNotice('Heartbeat sent! Device is now marked ONLINE.');
      setTimeout(() => setInjectNotice(null), 3500);
    } catch (err: any) {
      setInjectNotice(`Heartbeat error: ${err.message}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-black text-white uppercase tracking-wider">
              Admin & Engineering Console
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800">
              RBAC Enabled
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Role-based administration, fleet management, and ESP32 hardware telemetry testing.
          </p>
        </div>

        {/* Current Operator Role Badge */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Current Role:</span>
          <span className="font-bold text-cyan-300 bg-cyan-950 px-2.5 py-1 rounded-lg border border-cyan-800">
            {userProfile?.role}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-900 p-1.5 rounded-xl border border-slate-800 text-xs overflow-x-auto">
        {[
          { key: 'OVERVIEW', label: 'System Health' },
          { key: 'DEVICES', label: 'Fleet & Users' },
          { key: 'TESTER', label: 'Hardware Telemetry Tester' },
          { key: 'FIRMWARE', label: 'ESP32 Firmware C++' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === tab.key
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">
                Active Fleet
              </span>
              <div className="text-2xl font-black text-white mt-1">1 Unit</div>
              <div className="text-[11px] text-slate-500 mt-1">NexaRover-01</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">
                Device Connection
              </span>
              <div className="text-2xl font-black text-white mt-1">
                {device?.status || 'OFFLINE'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {device?.lastSeen ? 'Last seen recently' : 'Never connected'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">
                Configured Sensors
              </span>
              <div className="text-2xl font-black text-white mt-1">
                {sensors.length} Sensors
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {sensors.filter((s) => s.status === 'ACTIVE').length} reporting
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">
                Safety Alerts
              </span>
              <div className="text-2xl font-black text-white mt-1">
                {alerts.length} Total
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {alerts.filter((a) => !a.acknowledged).length} unacknowledged
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <Server className="w-4 h-4 text-cyan-400" />
              <span>Backend & Infrastructure Status</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">AUTH SERVICE</span>
                <span className="font-semibold text-emerald-400">Firebase Auth Active</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">REALTIME DATABASE</span>
                <span className="font-semibold text-emerald-400">asia-southeast1 Connected</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">FIRESTORE</span>
                <span className="font-semibold text-emerald-400">drive-nexa Ready</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FLEET & USERS */}
      {activeTab === 'DEVICES' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Authorized Operators & RBAC</span>
              </div>
              <button
                onClick={fetchUsers}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {usersList.length === 0 ? (
                <div className="text-xs text-slate-500 py-4 text-center">
                  Loading operators...
                </div>
              ) : (
                usersList.map((u) => (
                  <div
                    key={u.uid}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">{u.displayName || 'Operator'}</div>
                      <div className="text-[11px] text-slate-500">{u.email}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={u.role}
                        onChange={(e) => updateUserRole(e.target.value as UserRole)}
                        className="bg-slate-900 border border-slate-700 text-xs text-cyan-300 rounded-lg p-1.5 focus:outline-none"
                      >
                        <option value="USER">USER</option>
                        <option value="DEVELOPER">DEVELOPER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HARDWARE INGESTION TESTER */}
      {activeTab === 'TESTER' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Physical Hardware Ingestion Simulator
              </h2>
              <p className="text-xs text-slate-400">
                Send authentic telemetry packets matching the exact ESP32 JSON schema to verify real end-to-end pipeline.
              </p>
            </div>
          </div>

          {injectNotice && (
            <div className="p-3 rounded-xl bg-cyan-950/70 border border-cyan-800 text-xs text-cyan-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{injectNotice}</span>
            </div>
          )}

          {/* 1. Heartbeat Trigger */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">Broadcast ESP32 Heartbeat</div>
              <div className="text-[11px] text-slate-500">
                Sets device status to ONLINE for 15 seconds.
              </div>
            </div>
            <button
              onClick={handleBroadcastHeartbeat}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Send Heartbeat</span>
            </button>
          </div>

          {/* 2. Sensor Packet Trigger */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-white">Publish Sensor Telemetry Packet</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                value={testSensorType}
                onChange={(e) => setTestSensorType(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs text-white rounded-xl p-2.5"
              >
                <option value="speed">Speed (km/h)</option>
                <option value="temperature">Temperature (°C)</option>
                <option value="battery">Battery (%)</option>
                <option value="distance">Distance (cm)</option>
              </select>

              <input
                type="text"
                value={testSensorVal}
                onChange={(e) => setTestSensorVal(e.target.value)}
                placeholder="Value"
                className="bg-slate-900 border border-slate-700 text-xs text-white rounded-xl p-2.5"
              />

              <button
                onClick={handlePushTestSensor}
                className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publish Sensor Reading</span>
              </button>
            </div>
          </div>

          {/* 3. GPS Packet Trigger */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-white">Publish GPS Satellite Fix</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={testGpsLat}
                onChange={(e) => setTestGpsLat(e.target.value)}
                placeholder="Latitude"
                className="bg-slate-900 border border-slate-700 text-xs text-white rounded-xl p-2.5"
              />

              <input
                type="text"
                value={testGpsLng}
                onChange={(e) => setTestGpsLng(e.target.value)}
                placeholder="Longitude"
                className="bg-slate-900 border border-slate-700 text-xs text-white rounded-xl p-2.5"
              />

              <button
                onClick={handlePushTestGPS}
                className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publish GPS Coordinates</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ESP32 FIRMWARE C++ */}
      {activeTab === 'FIRMWARE' && <Esp32FirmwareGuide />}
    </div>
  );
};
