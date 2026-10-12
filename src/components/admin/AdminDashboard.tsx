import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDevice } from '../../context/DeviceContext';
import { Esp32FirmwareGuide } from './Esp32FirmwareGuide';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { fetchAllFeedback } from '../../services/firebaseService';
import { UserProfile, UserRole, DeviceInfo, FeedbackSubmission } from '../../types';
import {
  Shield,
  Users,
  Smartphone,
  Server,
  RefreshCw,
  MessageSquare,
  Cpu,
  Database,
  Radio,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { userProfile, updateUserRole } = useAuth();
  const { device, sensors, alerts, connectionState, activeDeviceId } = useDevice();

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DEVICES' | 'FEEDBACK' | 'FIRMWARE' | 'SCHEMA'>('OVERVIEW');
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [allFleetDevices, setAllFleetDevices] = useState<DeviceInfo[]>([]);
  const [feedbackList, setFeedbackList] = useState<FeedbackSubmission[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const fetchAdminData = async () => {
    setLoadingData(true);
    try {
      // 1. Fetch Users
      const snapUsers = await getDocs(collection(db, 'users'));
      const uList: UserProfile[] = [];
      snapUsers.forEach((d) => uList.push(d.data() as UserProfile));
      setUsersList(uList);

      // 2. Fetch Fleet Devices
      const snapDevs = await getDocs(collection(db, 'devices'));
      const dList: DeviceInfo[] = [];
      snapDevs.forEach((d) => dList.push(d.data() as DeviceInfo));
      setAllFleetDevices(dList);

      // 3. Fetch Feedback
      const fList = await fetchAllFeedback();
      setFeedbackList(fList);
    } catch (err) {
      console.warn('Error fetching admin data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (userProfile?.role === 'ADMIN' || userProfile?.role === 'DEVELOPER') {
      fetchAdminData();
    }
  }, [userProfile]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              Admin & Engineering Console
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
              RBAC Enabled
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Fleet monitoring, role-based operator permissions, and hardware firmware documentation.
          </p>
        </div>

        {/* Current Operator Role Badge */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Your Role:</span>
          <span className="font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
            {userProfile?.role}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs text-xs overflow-x-auto">
        {[
          { key: 'OVERVIEW', label: 'System Health' },
          { key: 'DEVICES', label: `Fleet (${allFleetDevices.length}) & Users (${usersList.length})` },
          { key: 'FEEDBACK', label: `Feedback (${feedbackList.length})` },
          { key: 'FIRMWARE', label: 'ESP32 Firmware C++' },
          { key: 'SCHEMA', label: 'Database Schema' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
            <div className="p-4.5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                Registered Fleet
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {allFleetDevices.length} {allFleetDevices.length === 1 ? 'Unit' : 'Units'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Active: {activeDeviceId || 'None'}
              </div>
            </div>

            <div className="p-4.5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                Active Vehicle Connection
              </span>
              <div className={`text-2xl font-black mt-1 ${
                connectionState === 'CONNECTED' ? 'text-emerald-700' : 'text-amber-600'
              }`}>
                {connectionState}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {device?.lastSeen ? 'Reported heartbeat' : 'No heartbeat received'}
              </div>
            </div>

            <div className="p-4.5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                Configured Sensors
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {sensors.length} Sensors
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {sensors.filter((s) => s.status === 'ACTIVE').length} physically reporting
              </div>
            </div>

            <div className="p-4.5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                Safety Alerts
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {alerts.length} Total
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {alerts.filter((a) => !a.acknowledged).length} unacknowledged
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Server className="w-4 h-4 text-blue-600" />
              <span>Backend & Cloud Infrastructure Status</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] font-bold">AUTH SERVICE</span>
                <span className="font-bold text-emerald-700">Firebase Auth Active</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] font-bold">REALTIME DATABASE</span>
                <span className="font-bold text-emerald-700">asia-southeast1 Connected</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] font-bold">FIRESTORE</span>
                <span className="font-bold text-emerald-700">drive-nexa Ready</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FLEET & USERS */}
      {activeTab === 'DEVICES' && (
        <div className="space-y-6">
          {/* Registered Devices in Fleet */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span>Registered Fleet Devices</span>
              </div>
              <button
                onClick={fetchAdminData}
                className="p-1.5 rounded-lg bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {allFleetDevices.length === 0 ? (
                <div className="text-xs text-slate-500 py-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No devices registered in fleet yet.
                </div>
              ) : (
                allFleetDevices.map((d) => (
                  <div
                    key={d.deviceId}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{d.name}</div>
                      <div className="text-slate-500 text-[11px] font-mono mt-0.5">
                        ID: {d.deviceId} • Model: {d.hardwareModel} • FW: {d.firmwareVersion}
                      </div>
                      <div className="text-slate-400 text-[10px] mt-1">
                        Owner: {d.ownerId} • Last Seen: {d.lastSeen ? new Date(d.lastSeen).toLocaleString() : 'Never'}
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${
                        d.status === 'CONNECTED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {d.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* User Accounts & Roles */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Authorized Operators & RBAC</span>
              </div>
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
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{u.displayName || 'Operator'}</div>
                      <div className="text-[11px] text-slate-500">{u.email}</div>
                      <div className="text-[10px] text-slate-400">
                        Devices: {u.authorizedDevices?.length > 0 ? u.authorizedDevices.join(', ') : 'None assigned'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={u.role}
                        onChange={(e) => updateUserRole(e.target.value as UserRole)}
                        className="bg-white border border-slate-300 text-xs text-blue-700 font-bold rounded-lg p-1.5 focus:outline-none"
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

      {/* TAB 3: FEEDBACK REVIEWS */}
      {activeTab === 'FEEDBACK' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>Operator Feedback Submissions (Section 11)</span>
              </div>
              <button
                onClick={fetchAdminData}
                className="p-1.5 rounded-lg bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {feedbackList.length === 0 ? (
                <div className="text-xs text-slate-500 py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No feedback submissions recorded yet.
                </div>
              ) : (
                feedbackList.map((fb) => (
                  <div
                    key={fb.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{fb.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                          {fb.category}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {new Date(fb.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-700 text-xs">{fb.description}</p>
                    <div className="text-[10px] text-slate-500 font-mono pt-1">
                      From: {fb.userEmail || 'Anonymous'} • Device: {fb.deviceId} • App: {fb.appVersion}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ESP32 FIRMWARE C++ */}
      {activeTab === 'FIRMWARE' && <Esp32FirmwareGuide />}

      {/* TAB 5: DATABASE SCHEMA */}
      {activeTab === 'SCHEMA' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 text-xs text-slate-700">
          <div className="flex items-center gap-2 font-bold text-blue-900 text-sm">
            <Database className="w-4 h-4 text-blue-600" />
            <span>Real-time Data Architecture & Schema Mapping</span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            The DriveNexa platform interfaces with Firebase using the following real-time data hierarchy:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-blue-700 block mb-1">RTDB Realtime Endpoints</span>
              <div>/devices/&#123;deviceId&#125;/commands/&#123;commandId&#125;</div>
              <div>/devices/&#123;deviceId&#125;/currentCommand</div>
              <div>/devices/&#123;deviceId&#125;/heartbeat/lastSeen</div>
              <div>/devices/&#123;deviceId&#125;/gps</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-emerald-700 block mb-1">Firestore Collections</span>
              <div>/devices/&#123;deviceId&#125;/sensors</div>
              <div>/devices/&#123;deviceId&#125;/telemetry</div>
              <div>/devices/&#123;deviceId&#125;/alerts</div>
              <div>/commands/&#123;deviceId&#125;/history</div>
              <div>/feedback</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
