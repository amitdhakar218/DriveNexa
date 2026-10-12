import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDevice } from '../../context/DeviceContext';
import { submitUserFeedback } from '../../services/firebaseService';
import { FeedbackCategory } from '../../types';
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
  Send,
  AlertCircle,
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user, userProfile, logout, enablePasskeyBiometric, biometricSupported } = useAuth();
  const { device } = useDevice();
  const [enrollingPasskey, setEnrollingPasskey] = useState(false);
  const [passkeyNotice, setPasskeyNotice] = useState<string | null>(null);

  // Feedback State
  const [feedbackCategory, setFeedbackCategory] = useState<FeedbackCategory>('BUG');
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

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

  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackTitle.trim() || !feedbackText.trim()) return;

    setSubmittingFeedback(true);
    setFeedbackError(null);

    const now = Date.now();
    const feedbackId = `fb_${now}_${Math.random().toString(36).substring(2, 6)}`;

    try {
      await submitUserFeedback({
        id: feedbackId,
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || null,
        category: feedbackCategory,
        title: feedbackTitle.trim(),
        description: feedbackText.trim(),
        deviceId: device?.deviceId || 'UNASSIGNED',
        appVersion: 'v1.2.0-prod',
        timestamp: now,
        status: 'NEW',
      });

      setFeedbackSuccess(true);
      setFeedbackTitle('');
      setFeedbackText('');
      setTimeout(() => setFeedbackSuccess(false), 5000);
    } catch (err: any) {
      setFeedbackError(err.message || 'Error submitting feedback. Please verify connection.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-md shadow-blue-600/20 shrink-0">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-2xl object-cover" />
          ) : (
            userProfile?.displayName?.slice(0, 2).toUpperCase() || 'OP'
          )}
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              {userProfile?.displayName || user?.displayName || 'Vehicle Operator'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
              Role: {userProfile?.role || 'USER'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center justify-center sm:justify-start gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>{user?.email}</span>
          </p>
          <div className="mt-2 text-[11px] text-slate-500 font-medium">
            Account created: {new Date(userProfile?.createdAt || Date.now()).toLocaleDateString()}
          </div>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-xs"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Security & Biometric / Passkey Settings */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Security & Biometric Clearance
          </h2>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Platform-supported FIDO2 WebAuthn & biometric authorization for remote robot control.
          In accordance with strict security standards, raw biometric data is never transmitted or stored in Firebase.
        </p>

        {passkeyNotice && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{passkeyNotice}</span>
          </div>
        )}

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-blue-600 shadow-xs">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Platform Passkey / Fingerprint</div>
              <div className="text-[11px] text-slate-500">
                {userProfile?.biometricEnabled
                  ? 'Active & enrolled on this device'
                  : 'Enroll to enable biometric arming before driving'}
              </div>
            </div>
          </div>

          <button
            onClick={handleEnrollPasskey}
            disabled={enrollingPasskey}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <Key className="w-3.5 h-3.5" />
            <span>{userProfile?.biometricEnabled ? 'Re-enroll Passkey' : 'Enroll Passkey'}</span>
          </button>
        </div>
      </div>

      {/* Authorized Devices */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <Cpu className="w-5 h-5 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Authorized Hardware Devices
          </h2>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white text-blue-600 border border-slate-200">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">{device?.name || 'NexaRover-01'}</div>
              <div className="text-[11px] text-slate-500 font-mono">
                ID: {device?.deviceId} • FW: {device?.firmwareVersion}
              </div>
            </div>
          </div>
          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            Primary Testbed
          </span>
        </div>
      </div>

      {/* Emergency Push Notifications */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Emergency Notifications
            </h2>
          </div>
          <input
            type="checkbox"
            checked={notificationsEnabled}
            onChange={(e) => setNotificationsEnabled(e.target.checked)}
            className="w-4 h-4 accent-blue-600 cursor-pointer"
          />
        </div>
        <p className="text-xs text-slate-500">
          Receive realtime alerts for emergency stops, crash triggers, and battery depletion.
        </p>
      </div>

      {/* Feedback & Support (Section 24) */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Operator Feedback & Telemetry Bug Report
            </h2>
            <p className="text-xs text-slate-500">
              Submit feedback with automatic device metadata attached.
            </p>
          </div>
        </div>

        {feedbackSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Thank you! Your feedback has been stored and logged for engineering review.</span>
          </div>
        )}

        {feedbackError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{feedbackError}</span>
          </div>
        )}

        <form onSubmit={handleSendFeedback} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={feedbackCategory}
                onChange={(e) => setFeedbackCategory(e.target.value as FeedbackCategory)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              >
                <option value="BUG">Bug Report</option>
                <option value="PROBLEM">Hardware Problem</option>
                <option value="SUGGESTION">Suggestion / Improvement</option>
                <option value="FEATURE_REQUEST">Feature Request</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                required
                value={feedbackTitle}
                onChange={(e) => setFeedbackTitle(e.target.value)}
                placeholder="Brief summary..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              required
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Describe telemetry discrepancies, motor controller faults, or firmware questions..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-500 font-mono">
              Metadata: {device?.deviceId} • v1.2.0-prod
            </span>
            <button
              type="submit"
              disabled={submittingFeedback}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submittingFeedback ? 'Submitting...' : 'Submit Report'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* App Metadata & Legal */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm text-xs text-slate-600 space-y-2">
        <div className="flex justify-between">
          <span>Application Version:</span>
          <span className="font-mono font-bold text-slate-900">v1.2.0-prod</span>
        </div>
        <div className="flex justify-between">
          <span>Firebase Target:</span>
          <span className="font-mono text-blue-600 font-semibold">drive-nexa (asia-southeast1)</span>
        </div>
        <div className="flex justify-between">
          <span>Architecture:</span>
          <span className="text-slate-800 font-medium">Cross-Platform Responsive Web & Android Native Support</span>
        </div>
      </div>
    </div>
  );
};
