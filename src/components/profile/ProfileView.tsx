import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDevice } from '../../context/DeviceContext';
import {
  User,
  Mail,
  Shield,
  Fingerprint,
  Cpu,
  Smartphone,
  Bell,
  LogOut,
  HelpCircle,
  MessageSquare,
  Key,
  CheckCircle2,
  Lock,
  Layers,
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user, userProfile, logout, enablePasskeyBiometric, biometricSupported } = useAuth();
  const { device } = useDevice();
  const [enrollingPasskey, setEnrollingPasskey] = useState(false);
  const [passkeyNotice, setPasskeyNotice] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleEnrollPasskey = async () => {
    setEnrollingPasskey(true);
    setPasskeyNotice(null);
    try {
      const res = await enablePasskeyBiometric();
      if (res) {
        setPasskeyNotice('Passkey registered successfully for biometric authorization.');
      } else {
        setPasskeyNotice('Passkey registration was not completed.');
      }
    } catch (err: any) {
      setPasskeyNotice(err.message || 'Passkey enrollment error');
    } finally {
      setEnrollingPasskey(false);
    }
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setFeedbackSent(true);
    setFeedbackText('');
    setTimeout(() => setFeedbackSent(false), 4000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-cyan-600/20 shrink-0">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-2xl object-cover" />
          ) : (
            userProfile?.displayName?.slice(0, 2).toUpperCase() || 'OP'
          )}
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-xl font-bold text-white">
              {userProfile?.displayName || user?.displayName || 'Vehicle Operator'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-cyan-950 text-cyan-400 border border-cyan-800">
              Role: {userProfile?.role || 'USER'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center justify-center sm:justify-start gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-500" />
            <span>{user?.email}</span>
          </p>
          <div className="mt-2 text-[11px] text-slate-500">
            Account created: {new Date(userProfile?.createdAt || Date.now()).toLocaleDateString()}
          </div>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-red-950/60 hover:text-red-400 hover:border-red-800 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Security & Biometric / Passkey Settings */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Security & Biometric Verification
          </h2>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          High-assurance FIDO2 WebAuthn & biometric authorization for remote robot control.
          In accordance with strict security standards, raw biometric data is never transmitted or stored in Firebase.
        </p>

        {passkeyNotice && (
          <div className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-800 text-xs text-cyan-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{passkeyNotice}</span>
          </div>
        )}

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Platform Passkey / Fingerprint</div>
              <div className="text-[11px] text-slate-400">
                {userProfile?.biometricEnabled
                  ? 'Active & enrolled on this device'
                  : 'Requires setup for biometric rover arming'}
              </div>
            </div>
          </div>

          <button
            onClick={handleEnrollPasskey}
            disabled={enrollingPasskey}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <Key className="w-3.5 h-3.5" />
            <span>{userProfile?.biometricEnabled ? 'Re-enroll Passkey' : 'Enroll Passkey'}</span>
          </button>
        </div>
      </div>

      {/* Connected Vehicles / Devices */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2.5">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Authorized Hardware Devices
          </h2>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-900 text-cyan-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">{device?.name || 'NexaRover-01'}</div>
              <div className="text-[11px] text-slate-500 font-mono">
                ID: {device?.deviceId} • FW: {device?.firmwareVersion}
              </div>
            </div>
          </div>
          <span className="text-[11px] font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
            Primary Testbed
          </span>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Emergency Push Notifications
            </h2>
          </div>
          <input
            type="checkbox"
            checked={notificationsEnabled}
            onChange={(e) => setNotificationsEnabled(e.target.checked)}
            className="w-4 h-4 accent-cyan-400 cursor-pointer"
          />
        </div>
        <p className="text-xs text-slate-400">
          Receive realtime alerts for emergency stops, crash triggers, and battery depletion.
        </p>
      </div>

      {/* Feedback & Diagnostics */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Operator Feedback & Telemetry Bug Report
          </h2>
        </div>

        {feedbackSent ? (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300">
            Feedback and device log submitted. Thank you!
          </div>
        ) : (
          <form onSubmit={handleSendFeedback} className="space-y-3">
            <textarea
              rows={3}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Report telemetry discrepancies, hardware motor issues, or firmware suggestions..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
            >
              Submit Report
            </button>
          </form>
        )}
      </div>

      {/* App Metadata & Legal */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-500 space-y-2">
        <div className="flex justify-between">
          <span>Application Version:</span>
          <span className="font-mono text-slate-300">v1.2.0-prod</span>
        </div>
        <div className="flex justify-between">
          <span>Firebase Target:</span>
          <span className="font-mono text-cyan-400">drive-nexa (asia-southeast1)</span>
        </div>
        <div className="flex justify-between">
          <span>Architecture:</span>
          <span className="text-slate-300">Cross-Platform Android & Responsive Web</span>
        </div>
      </div>
    </div>
  );
};
