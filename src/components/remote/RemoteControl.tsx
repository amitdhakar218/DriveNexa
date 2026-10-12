import React, { useState, useEffect, useCallback } from 'react';
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
  WifiOff,
  RotateCcw,
} from 'lucide-react';

export const RemoteControl: React.FC = () => {
  const { device, sendCommand, emergencyStop, resetEmergency, connectionState, activeDeviceId } = useDevice();
  const { user, userProfile } = useAuth();

  const [isArmingUnlocked, setIsArmingUnlocked] = useState(false);
  const [showSensitiveModal, setShowSensitiveModal] = useState(false);
  const [speedPercentage, setSpeedPercentage] = useState<number>(50);
  const [lastSentCommand, setLastSentCommand] = useState<RoverCommand | null>(null);
  const [activeButton, setActiveButton] = useState<CommandAction | null>(null);
  const [commandStatusMsg, setCommandStatusMsg] = useState<string>('Standby — Safety Watchdog Active');

  const isConnected = connectionState === 'CONNECTED';
  const isEmergencyLocked = !!device?.safetyLock;
  const isMovementDisabled = !isConnected || isEmergencyLocked || !isArmingUnlocked || !activeDeviceId;

  const handleCommand = useCallback(
    async (cmd: CommandAction) => {
      if (!activeDeviceId) {
        setCommandStatusMsg('DISPATCH BLOCKED: No vehicle device selected or paired.');
        return;
      }

      // Emergency Stop and normal Stop are always allowed to be broadcast
      if (cmd !== 'STOP' && cmd !== 'EMERGENCY_STOP') {
        if (!isArmingUnlocked) {
          setShowSensitiveModal(true);
          return;
        }

        if (!isConnected) {
          setCommandStatusMsg('DISPATCH BLOCKED: Rover is offline. Movement controls disabled for safety.');
          return;
        }

        if (isEmergencyLocked) {
          setCommandStatusMsg('DISPATCH BLOCKED: Rover is emergency stopped. Reset safety lock first.');
          return;
        }
      }

      setActiveButton(cmd);

      try {
        const payload = await sendCommand(cmd, speedPercentage);
        setLastSentCommand(payload);
        setCommandStatusMsg(`Dispatched [${cmd}] at ${new Date(payload.timestamp).toLocaleTimeString()} (Expires in 1500ms)`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Network error';
        setCommandStatusMsg(`Command failed: ${msg}`);
      } finally {
        setTimeout(() => setActiveButton(null), 250);
      }
    },
    [activeDeviceId, isArmingUnlocked, isConnected, isEmergencyLocked, sendCommand, speedPercentage]
  );

  // Keyboard navigation support (WASD and Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isMovementDisabled && !['Space', 'Escape'].includes(e.code)) return;

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
  }, [isMovementDisabled, handleCommand]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              Rover Remote Control
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {activeDeviceId || 'No Device'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Realtime motor commands dispatched via low-latency Firebase with cryptographic timestamps.
          </p>
        </div>

        {/* Security Arming Button */}
        <div className="flex items-center gap-2">
          {!isArmingUnlocked ? (
            <button
              onClick={() => setShowSensitiveModal(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 hover:bg-amber-100 font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-xs"
            >
              <Lock className="w-4 h-4 text-amber-600" />
              <span>Unlock Driving Mode (Passkey / PIN)</span>
            </button>
          ) : (
            <button
              onClick={() => setIsArmingUnlocked(false)}
              className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-xs"
            >
              <Unlock className="w-4 h-4 text-emerald-600" />
              <span>Drive Mode Armed (Tap to Lock)</span>
            </button>
          )}
        </div>
      </div>

      {/* OFFLINE ENFORCEMENT: Controls strictly disabled notice */}
      {!isConnected && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 shadow-xs">
          <WifiOff className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-bold text-amber-900 block mb-0.5">
              MOVEMENT CONTROLS DISABLED: Rover is Offline / Disconnected
            </strong>
            The physical ESP32 has not broadcast a valid heartbeat within 15 seconds. In accordance with Section 12 & 13 remote safety requirements, movement controls are disabled until the physical vehicle establishes an active connection.
          </div>
        </div>
      )}

      {/* Emergency Lock Banner */}
      {isEmergencyLocked && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <strong className="font-bold text-rose-900 block">
                SAFETY EMERGENCY LOCKOUT ENGAGED
              </strong>
              <span>Motor power isolated. Remote driving is disabled until cleared.</span>
            </div>
          </div>
          <button
            onClick={resetEmergency}
            className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 transition cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Safety Lock</span>
          </button>
        </div>
      )}

      {/* Main Controller Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Throttle Slider & Safety Specs */}
        <div className="lg:col-span-5 space-y-4">
          {/* Speed Preset & Slider */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-blue-600" />
                <span>Motor Throttle / PWM Output</span>
              </span>
              <span className="text-sm font-black font-mono text-blue-600">
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
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
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
                  className={`py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    speedPercentage === p.val
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Safety Watchdog Info Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm text-xs text-slate-700 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-blue-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Command Safety & Watchdog Architecture</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Every command carries an expiration epoch of 1500 ms.
              If communication disconnects, the onboard ESP32 firmware stops motors locally to prevent uncommanded runaway.
            </p>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-600 space-y-1">
              <div>Command Expiry: 1500 ms (Enforced)</div>
              <div>ESP32 Local Watchdog: Autonomous Fail-Safe</div>
              <div>Authorized Operator: {userProfile?.displayName || user?.email}</div>
              <div>Active Target: {activeDeviceId || 'None'}</div>
            </div>
          </div>
        </div>

        {/* Right Column: D-Pad & Emergency Killswitch */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm relative">
          {/* Top Bar with Prominent Emergency Stop */}
          <div className="w-full flex justify-between items-center mb-6">
            <span className="text-xs font-semibold text-slate-500">
              Tactile D-Pad or <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] border border-slate-200">W</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] ml-1 border border-slate-200">A</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] ml-1 border border-slate-200">S</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] ml-1 border border-slate-200">D</kbd>
            </span>

            <button
              onClick={emergencyStop}
              className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-rose-600/20 cursor-pointer transition transform active:scale-95"
            >
              <Octagon className="w-4 h-4" />
              <span>Emergency Stop</span>
            </button>
          </div>

          {/* D-Pad Cluster */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center my-4">
            <div className="absolute inset-4 rounded-full border border-slate-200 bg-slate-50 pointer-events-none" />

            {/* FORWARD */}
            <button
              type="button"
              disabled={isMovementDisabled}
              onMouseDown={() => handleCommand('FORWARD')}
              onTouchStart={(e) => { e.preventDefault(); handleCommand('FORWARD'); }}
              className={`absolute top-0 w-20 h-20 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all select-none shadow-sm cursor-pointer ${
                activeButton === 'FORWARD'
                  ? 'bg-blue-600 border-blue-700 text-white scale-95 shadow-md'
                  : 'bg-white border-slate-300 text-slate-800 hover:border-blue-500 hover:text-blue-600'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <ArrowUp className="w-7 h-7 stroke-[2.5]" />
              <span className="text-[10px] font-black tracking-wider uppercase">FWD</span>
            </button>

            {/* BACKWARD */}
            <button
              type="button"
              disabled={isMovementDisabled}
              onMouseDown={() => handleCommand('BACKWARD')}
              onTouchStart={(e) => { e.preventDefault(); handleCommand('BACKWARD'); }}
              className={`absolute bottom-0 w-20 h-20 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all select-none shadow-sm cursor-pointer ${
                activeButton === 'BACKWARD'
                  ? 'bg-blue-600 border-blue-700 text-white scale-95 shadow-md'
                  : 'bg-white border-slate-300 text-slate-800 hover:border-blue-500 hover:text-blue-600'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <ArrowDown className="w-7 h-7 stroke-[2.5]" />
              <span className="text-[10px] font-black tracking-wider uppercase">REV</span>
            </button>

            {/* LEFT */}
            <button
              type="button"
              disabled={isMovementDisabled}
              onMouseDown={() => handleCommand('LEFT')}
              onTouchStart={(e) => { e.preventDefault(); handleCommand('LEFT'); }}
              className={`absolute left-0 w-20 h-20 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all select-none shadow-sm cursor-pointer ${
                activeButton === 'LEFT'
                  ? 'bg-blue-600 border-blue-700 text-white scale-95 shadow-md'
                  : 'bg-white border-slate-300 text-slate-800 hover:border-blue-500 hover:text-blue-600'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <ArrowLeft className="w-7 h-7 stroke-[2.5]" />
              <span className="text-[10px] font-black tracking-wider uppercase">LEFT</span>
            </button>

            {/* RIGHT */}
            <button
              type="button"
              disabled={isMovementDisabled}
              onMouseDown={() => handleCommand('RIGHT')}
              onTouchStart={(e) => { e.preventDefault(); handleCommand('RIGHT'); }}
              className={`absolute right-0 w-20 h-20 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all select-none shadow-sm cursor-pointer ${
                activeButton === 'RIGHT'
                  ? 'bg-blue-600 border-blue-700 text-white scale-95 shadow-md'
                  : 'bg-white border-slate-300 text-slate-800 hover:border-blue-500 hover:text-blue-600'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <ArrowRight className="w-7 h-7 stroke-[2.5]" />
              <span className="text-[10px] font-black tracking-wider uppercase">RIGHT</span>
            </button>

            {/* CENTER LARGE PROMINENT STOP BUTTON */}
            <button
              type="button"
              onMouseDown={() => handleCommand('STOP')}
              onTouchStart={(e) => { e.preventDefault(); handleCommand('STOP'); }}
              className={`w-24 h-24 rounded-full border-2 flex flex-col items-center justify-center gap-0.5 select-none cursor-pointer transition-transform shadow-lg active:scale-90 z-10 ${
                activeButton === 'STOP'
                  ? 'bg-rose-700 border-rose-800 text-white shadow-rose-600/50'
                  : 'bg-rose-600 border-rose-500 text-white hover:bg-rose-700'
              }`}
            >
              <Octagon className="w-7 h-7 stroke-[2.5]" />
              <span className="text-xs font-black tracking-widest uppercase">STOP</span>
            </button>
          </div>

          {/* Real Command Status Line */}
          <div className="w-full mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-xs font-mono font-semibold text-slate-700 block truncate">
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
          setCommandStatusMsg('Driving mode armed via platform biometric/passkey verification.');
        }}
        actionTitle="Authorize Rover Teleoperation"
        actionDescription="Physical robot control requires identity clearance. Verify with device passkey or fingerprint before driving."
      />
    </div>
  );
};
