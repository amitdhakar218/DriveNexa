import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDevice } from '../../context/DeviceContext';
import { useAuth } from '../../context/AuthContext';
import { RoverCommand, CommandAction } from '../../types';
import { SensitiveActionModal } from '../auth/SensitiveActionModal';
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Octagon,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Gauge,
  Wifi,
  WifiOff,
  AlertTriangle,
  RotateCcw,
  Zap,
  Info,
} from 'lucide-react';

export const RemoteControl: React.FC = () => {
  const { device, sendCommand, emergencyStop, resetEmergency } = useDevice();
  const { user, userProfile } = useAuth();

  const [isArmingUnlocked, setIsArmingUnlocked] = useState(false);
  const [showSensitiveModal, setShowSensitiveModal] = useState(false);
  const [speedPercentage, setSpeedPercentage] = useState<number>(50);
  const [lastSentCommand, setLastSentCommand] = useState<RoverCommand | null>(null);
  const [activeButton, setActiveButton] = useState<CommandAction | null>(null);
  const [commandStatusMsg, setCommandStatusMsg] = useState<string>('Standby - Safety Watchdog Active');
  const [isSending, setIsSending] = useState(false);

  const heartbeatIntervalRef = useRef<any>(null);

  const isOnline = device?.status === 'ONLINE';
  const isEmergencyLocked = !!device?.safetyLock;

  const handleCommand = useCallback(
    async (cmd: CommandAction) => {
      if (!isArmingUnlocked && cmd !== 'STOP' && cmd !== 'EMERGENCY_STOP') {
        setShowSensitiveModal(true);
        return;
      }

      if (isEmergencyLocked && cmd !== 'EMERGENCY_STOP') {
        setCommandStatusMsg('ROVER LOCKED: Emergency Stop is engaged. Reset lock below to resume.');
        return;
      }

      setActiveButton(cmd);
      setIsSending(true);

      try {
        const payload = await sendCommand(cmd, speedPercentage);
        setLastSentCommand(payload);
        setCommandStatusMsg(`Transmitted [${cmd}] at ${new Date(payload.timestamp).toLocaleTimeString()} (Expires in 1500ms)`);
      } catch (err: any) {
        setCommandStatusMsg(`Command failed: ${err.message || 'Network error'}`);
      } finally {
        setIsSending(false);
        // Clear active button highlight shortly after release
        setTimeout(() => setActiveButton(null), 300);
      }
    },
    [isArmingUnlocked, isEmergencyLocked, sendCommand, speedPercentage]
  );

  // Keyboard navigation support (WASD and Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isArmingUnlocked || isEmergencyLocked) return;
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        handleCommand('FORWARD');
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        handleCommand('BACKWARD');
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        handleCommand('LEFT');
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        handleCommand('RIGHT');
      } else if (['Space', 'Escape'].includes(e.code)) {
        e.preventDefault();
        handleCommand('STOP');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isArmingUnlocked, isEmergencyLocked, handleCommand]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Remote Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white uppercase tracking-wider">
              Rover Remote Control
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
              ESP32 4WD H-Bridge
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Realtime motor commands dispatched via low-latency Firebase RTDB with cryptographic timestamps.
          </p>
        </div>

        {/* Security Arming Button */}
        <div className="flex items-center gap-2">
          {!isArmingUnlocked ? (
            <button
              onClick={() => setShowSensitiveModal(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Unlock Driving Mode (Biometric / PIN)</span>
            </button>
          ) : (
            <button
              onClick={() => setIsArmingUnlocked(false)}
              className="px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Unlock className="w-4 h-4 text-emerald-400" />
              <span>Drive Mode Armed (Tap to Lock)</span>
            </button>
          )}
        </div>
      </div>

      {/* Connection Warning Banner if Offline */}
      {!isOnline && (
        <div className="p-4 rounded-xl bg-amber-950/70 border border-amber-800/80 text-amber-200 text-xs flex items-start gap-3">
          <WifiOff className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-bold text-amber-300 block mb-0.5">
              Hardware Rover Currently Offline
            </strong>
            The physical ESP32 has not broadcast a heartbeat within 15 seconds. Dispatched commands will be queued in Firebase with 1500ms safety expiration to protect against stale movement upon reconnection.
          </div>
        </div>
      )}

      {/* Emergency Lock Banner */}
      {isEmergencyLocked && (
        <div className="p-4 rounded-xl bg-red-950/90 border border-red-700 text-red-200 text-xs flex items-center justify-between gap-3 shadow-lg shadow-red-950/50">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <strong className="font-bold text-white block">
                SAFETY EMERGENCY LOCKOUT ENGAGED
              </strong>
              <span>Motor power isolated. Hardware and remote commands are prohibited.</span>
            </div>
          </div>
          <button
            onClick={resetEmergency}
            className="px-3.5 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Safety Lock</span>
          </button>
        </div>
      )}

      {/* Main Controller Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Speed Control & Safety Watchdog Info */}
        <div className="lg:col-span-5 space-y-4">
          {/* Speed Preset & Slider */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-cyan-400" />
                <span>Motor Throttle / PWM Output</span>
              </span>
              <span className="text-sm font-black font-mono text-cyan-400">
                {speedPercentage}%
              </span>
            </div>

            <input
              type="range"
              min="15"
              max="100"
              step="5"
              value={speedPercentage}
              onChange={(e) => setSpeedPercentage(Number(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />

            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[
                { label: 'Crawl', val: 25 },
                { label: 'Normal', val: 50 },
                { label: 'Sport', val: 75 },
                { label: 'Max', val: 100 },
              ].map((p) => (
                <button
                  key={p.val}
                  onClick={() => setSpeedPercentage(p.val)}
                  className={`py-1.5 rounded-lg text-xs font-semibold transition ${
                    speedPercentage === p.val
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Safety Watchdog Architecture Info Card */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Section 10 Safety Architecture</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Every dispatched command carries a strict <code className="text-cyan-300">expiresAt</code> epoch (+1500ms).
              The onboard ESP32 firmware includes a local hardware watchdog that stops motors immediately if communication pauses, preventing uncommanded movement.
            </p>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
              <div>Timeout Window: 1500 ms</div>
              <div>ESP32 Local Stop: Auto Fail-safe</div>
              <div>Authorized User: {userProfile?.displayName || user?.email}</div>
            </div>
          </div>
        </div>

        {/* Right Column: High-Touch Tactile Joystick / D-Pad & Emergency Stop */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-900 border border-slate-800 relative">
          {/* Prominent Emergency Stop (Top-right of controller) */}
          <div className="w-full flex justify-between items-center mb-6">
            <span className="text-xs font-semibold text-slate-400">
              Touch D-Pad or use <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">W</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] ml-1">A</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] ml-1">S</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] ml-1">D</kbd>
            </span>

            <button
              onClick={emergencyStop}
              className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-red-600/30 cursor-pointer transition transform active:scale-95"
            >
              <Octagon className="w-4 h-4" />
              <span>Emergency Stop</span>
            </button>
          </div>

          {/* D-Pad Buttons Cluster */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center my-4">
            {/* Ambient center ring */}
            <div className="absolute inset-4 rounded-full border border-slate-800 bg-slate-950/60 pointer-events-none" />

            {/* FORWARD */}
            <button
              type="button"
              disabled={isEmergencyLocked}
              onMouseDown={() => handleCommand('FORWARD')}
              onTouchStart={(e) => { e.preventDefault(); handleCommand('FORWARD'); }}
              className={`absolute top-0 w-20 h-20 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all select-none cursor-pointer shadow-lg active:scale-95 ${
                activeButton === 'FORWARD'
                  ? 'bg-cyan-500 border-cyan-300 text-slate-950 scale-95 shadow-cyan-500/50'
                  : 'bg-slate-800/90 border-slate-700 text-white hover:border-cyan-500 hover:text-cyan-400'
              } disabled:opacity-30`}
            >
              <ArrowUp className="w-7 h-7 stroke-[2.5]" />
              <span className="text-[10px] font-black tracking-wider uppercase">FWD</span>
            </button>

            {/* BACKWARD */}
            <button
              type="button"
              disabled={isEmergencyLocked}
              onMouseDown={() => handleCommand('BACKWARD')}
              onTouchStart={(e) => { e.preventDefault(); handleCommand('BACKWARD'); }}
              className={`absolute bottom-0 w-20 h-20 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all select-none cursor-pointer shadow-lg active:scale-95 ${
                activeButton === 'BACKWARD'
                  ? 'bg-cyan-500 border-cyan-300 text-slate-950 scale-95 shadow-cyan-500/50'
                  : 'bg-slate-800/90 border-slate-700 text-white hover:border-cyan-500 hover:text-cyan-400'
              } disabled:opacity-30`}
            >
              <ArrowDown className="w-7 h-7 stroke-[2.5]" />
              <span className="text-[10px] font-black tracking-wider uppercase">REV</span>
            </button>

            {/* LEFT */}
            <button
              type="button"
              disabled={isEmergencyLocked}
              onMouseDown={() => handleCommand('LEFT')}
              onTouchStart={(e) => { e.preventDefault(); handleCommand('LEFT'); }}
              className={`absolute left-0 w-20 h-20 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all select-none cursor-pointer shadow-lg active:scale-95 ${
                activeButton === 'LEFT'
                  ? 'bg-cyan-500 border-cyan-300 text-slate-950 scale-95 shadow-cyan-500/50'
                  : 'bg-slate-800/90 border-slate-700 text-white hover:border-cyan-500 hover:text-cyan-400'
              } disabled:opacity-30`}
            >
              <ArrowLeft className="w-7 h-7 stroke-[2.5]" />
              <span className="text-[10px] font-black tracking-wider uppercase">LEFT</span>
            </button>

            {/* RIGHT */}
            <button
              type="button"
              disabled={isEmergencyLocked}
              onMouseDown={() => handleCommand('RIGHT')}
              onTouchStart={(e) => { e.preventDefault(); handleCommand('RIGHT'); }}
              className={`absolute right-0 w-20 h-20 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all select-none cursor-pointer shadow-lg active:scale-95 ${
                activeButton === 'RIGHT'
                  ? 'bg-cyan-500 border-cyan-300 text-slate-950 scale-95 shadow-cyan-500/50'
                  : 'bg-slate-800/90 border-slate-700 text-white hover:border-cyan-500 hover:text-cyan-400'
              } disabled:opacity-30`}
            >
              <ArrowRight className="w-7 h-7 stroke-[2.5]" />
              <span className="text-[10px] font-black tracking-wider uppercase">RIGHT</span>
            </button>

            {/* CENTER PROMINENT STOP BUTTON */}
            <button
              type="button"
              onMouseDown={() => handleCommand('STOP')}
              onTouchStart={(e) => { e.preventDefault(); handleCommand('STOP'); }}
              className={`w-24 h-24 rounded-full border-2 flex flex-col items-center justify-center gap-0.5 select-none cursor-pointer transition-transform shadow-xl active:scale-90 z-10 ${
                activeButton === 'STOP'
                  ? 'bg-red-500 border-white text-white shadow-red-500/80'
                  : 'bg-red-600 border-red-400 text-white hover:bg-red-500'
              }`}
            >
              <Octagon className="w-7 h-7 stroke-[2.5]" />
              <span className="text-xs font-black tracking-widest uppercase">STOP</span>
            </button>
          </div>

          {/* Real Command Status Line */}
          <div className="w-full mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <span className="text-xs font-mono text-cyan-300 block truncate">
              {commandStatusMsg}
            </span>
          </div>
        </div>
      </div>

      {/* Sensitive Action Modal (Biometric / Passkey Verification for driving) */}
      <SensitiveActionModal
        isOpen={showSensitiveModal}
        onClose={() => setShowSensitiveModal(false)}
        onVerified={() => {
          setIsArmingUnlocked(true);
          setShowSensitiveModal(false);
          setCommandStatusMsg('Driving mode unlocked via biometric/passkey verification.');
        }}
        actionTitle="Authorize Rover Teleoperation"
        actionDescription="Physical robot control requires identity clearance. Verify with device passkey or fingerprint before driving."
      />
    </div>
  );
};
