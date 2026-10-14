import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDevice } from '../../context/DeviceContext';
import { Esp32CodeModal } from '../camera/Esp32CodeModal';
import { rtdb } from '../../config/firebase';
import { ref as rtdbRef, set as rtdbSet, onValue } from 'firebase/database';
import {
  Wifi,
  WifiOff,
  Battery,
  Compass,
  Camera,
  ExternalLink,
  RefreshCw,
  Sliders,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Octagon,
  Sparkles,
  Code2,
  Check,
  AlertCircle,
  Radio,
  Maximize2
} from 'lucide-react';

export const RoverCockpit: React.FC = () => {
  const { device, connectionState, activeDeviceId } = useDevice();
  const detectedIp = device?.ipAddress || null;
  const defaultStreamUrl = detectedIp ? `http://${detectedIp}:81/stream` : '';
  const defaultSnapshotUrl = detectedIp ? `http://${detectedIp}/cam-hi.jpg` : '';

  // Camera & Stream states
  const [streamUrl, setStreamUrl] = useState(defaultStreamUrl);
  const [streamMode, setStreamMode] = useState<'STREAM' | 'SNAPSHOT'>('STREAM');
  const [isStreamLive, setIsStreamLive] = useState(false);
  const [streamError, setStreamError] = useState(false);
  const [snapshotTimestamp, setSnapshotTimestamp] = useState(Date.now());
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);

  // Driving & Motor states
  const [currentSpeed, setCurrentSpeed] = useState<number>(200); // PWM 0-255
  const [activeCommand, setActiveCommand] = useState<string>('STOP');
  const [lastDispatchedTime, setLastDispatchedTime] = useState<number>(Date.now());
  const [dispatchStatus, setDispatchStatus] = useState<string>('Standby (कार रुकी हुई है)');

  // Telemetry from RTDB
  const [rtdbTelemetry, setRtdbTelemetry] = useState<{
    battery?: number;
    heading?: number;
    compass?: number;
    status?: string;
    ip?: string;
  }>({
    battery: 98,
    heading: 0,
    compass: 0,
    status: 'ONLINE',
    ip: detectedIp || undefined,
  });

  // Sync stream URL when device IP or cameraStreamUrl updates
  useEffect(() => {
    if (device?.cameraStreamUrl) {
      setStreamUrl(device.cameraStreamUrl);
    } else if (detectedIp) {
      setStreamUrl(`http://${detectedIp}:81/stream`);
    }
  }, [device?.cameraStreamUrl, detectedIp]);

  // Direct millisecond listener to Firebase RTDB for telemetry
  useEffect(() => {
    const devId = activeDeviceId || 'NEXA-ROVER-01';
    const telemRef = rtdbRef(rtdb, `devices/${devId}/telemetry`);
    const unsub = onValue(
      telemRef,
      (snap) => {
        const val = snap.val();
        if (val && typeof val === 'object') {
          setRtdbTelemetry({
            battery: val.battery ?? 98,
            heading: val.heading ?? val.compass ?? 0,
            compass: val.compass ?? val.heading ?? 0,
            status: val.status ?? 'ONLINE',
            ip: val.ip ?? detectedIp,
          });
        }
      },
      (err) => console.warn('Cockpit RTDB telem note:', err.message)
    );

    return () => unsub();
  }, [activeDeviceId, detectedIp]);

  // Snapshot refresh loop if in snapshot mode
  useEffect(() => {
    if (streamMode === 'SNAPSHOT') {
      const interval = setInterval(() => {
        setSnapshotTimestamp(Date.now());
      }, 400);
      return () => clearInterval(interval);
    }
  }, [streamMode]);

  // Instant low-latency Firebase command dispatcher (millisecond RTDB write)
  const sendRoverCommand = useCallback(
    async (command: 'FORWARD' | 'BACKWARD' | 'LEFT' | 'RIGHT' | 'STOP') => {
      const devId = activeDeviceId || 'NEXA-ROVER-01';
      setActiveCommand(command);
      setLastDispatchedTime(Date.now());

      const hindiLabel =
        command === 'FORWARD'
          ? 'आगे बढ़ रहे हैं'
          : command === 'BACKWARD'
          ? 'पीछे जा रहे हैं'
          : command === 'LEFT'
          ? 'बाएं मुड़ रहे हैं'
          : command === 'RIGHT'
          ? 'दाएं मुड़ रहे हैं'
          : 'कार रुकी हुई है';

      setDispatchStatus(`कमान्ड: [${command}] — ${hindiLabel}`);

      try {
        const cmdCurrentRef = rtdbRef(rtdb, `devices/${devId}/currentCommand`);
        await rtdbSet(cmdCurrentRef, {
          command,
          speed: command === 'STOP' ? 0 : currentSpeed,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.warn('Command dispatch error:', err);
      }
    },
    [activeDeviceId, currentSpeed]
  );

  // Keyboard navigation (Arrow keys and WASD)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        sendRoverCommand('FORWARD');
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        sendRoverCommand('BACKWARD');
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        sendRoverCommand('LEFT');
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        sendRoverCommand('RIGHT');
      } else if (['Space', 'Escape'].includes(e.code)) {
        e.preventDefault();
        sendRoverCommand('STOP');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW', 'ArrowDown', 'KeyS', 'ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD'].includes(e.code)) {
        sendRoverCommand('STOP');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [sendRoverCommand]);

  const isOnline = connectionState === 'CONNECTED' || rtdbTelemetry.status === 'ONLINE';

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-20">
      {/* 1. Header Bar: Status + Instant Emergency Stop + Hidden ESP32 Code Modal Button */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black text-slate-900 tracking-tight">
              🚗 NEXA ROVER कॉकपिट
            </h1>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 border ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-rose-50 text-rose-700 border-rose-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'
                }`}
              />
              <span>{isOnline ? '🟢 ऑनलाइन (CONNECTED)' : '🔴 ऑफलाइन (DISCONNECTED)'}</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            डिवाइस: <strong className="text-slate-700">NEXA-ROVER-01</strong> {detectedIp && <> | IP: <strong className="text-blue-700 font-mono">{detectedIp}</strong></>}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Button to open ESP32 Code modal (Code is hidden by default!) */}
          <button
            onClick={() => setIsCodeModalOpen(true)}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm shadow-blue-500/20"
          >
            <Code2 className="w-4 h-4" />
            <span>💻 ESP32 कोड (Copy)</span>
          </button>

          {/* Quick Stop Button */}
          <button
            onClick={() => sendRoverCommand('STOP')}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm shadow-rose-500/20"
          >
            <Octagon className="w-4 h-4" />
            <span>🛑 तुरंत रोकें</span>
          </button>
        </div>
      </div>

      {/* 2. Live Camera View Area */}
      <div className="rounded-2xl bg-slate-950 border border-slate-800 shadow-md overflow-hidden">
        {/* Stream Top Toolbar */}
        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-white flex items-center gap-1">
              <Camera className="w-3.5 h-3.5 text-blue-400" />
              ESP32 चिप इनबिल्ट OV2640 कैमरा
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              ({detectedIp}:81)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Stream / Snapshot Switcher */}
            <div className="bg-slate-800 p-0.5 rounded-lg flex items-center border border-slate-700">
              <button
                onClick={() => {
                  setStreamMode('STREAM');
                  setStreamError(false);
                }}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  streamMode === 'STREAM'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                लाइव स्ट्रीम
              </button>
              <button
                onClick={() => {
                  setStreamMode('SNAPSHOT');
                  setStreamError(false);
                }}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  streamMode === 'SNAPSHOT'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                स्नैपशॉट
              </button>
            </div>

            {/* Open stream in new tab button */}
            <a
              href={`http://${detectedIp}:81/stream`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium flex items-center gap-1 transition"
              title="कैमरा अलग टैब में खोलें"
            >
              <ExternalLink className="w-3 h-3 text-blue-400" />
              <span>अलग टैब</span>
            </a>

            {/* Refresh button */}
            <button
              onClick={() => {
                setStreamError(false);
                setIsStreamLive(false);
                setSnapshotTimestamp(Date.now());
              }}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              title="कैमरा रिफ्रेश करें"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Video Canvas Container */}
        <div className="relative aspect-video sm:aspect-21/9 bg-black flex items-center justify-center overflow-hidden">
          {streamMode === 'STREAM' ? (
            <img
              key={`stream-${streamUrl}-${snapshotTimestamp}`}
              src={streamUrl}
              alt="ESP32 Live Camera Feed"
              onLoad={() => {
                setIsStreamLive(true);
                setStreamError(false);
              }}
              onError={() => {
                setIsStreamLive(false);
                setStreamError(true);
              }}
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              key={`snapshot-${snapshotTimestamp}`}
              src={`${defaultSnapshotUrl}?t=${snapshotTimestamp}`}
              alt="ESP32 Snapshot Feed"
              onLoad={() => {
                setIsStreamLive(true);
                setStreamError(false);
              }}
              onError={() => {
                setIsStreamLive(false);
                setStreamError(true);
              }}
              className="w-full h-full object-contain"
            />
          )}

          {/* Fallback / Mixed-Content Help if stream is blocked by mobile browser */}
          {streamError && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center">
              <Camera className="w-10 h-10 text-amber-400 mb-2 animate-bounce" />
              <h3 className="text-sm font-bold text-white mb-1">
                ESP32 कैमरा स्ट्रीम कनेक्ट हो रही है...
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mb-3">
                ब्राउज़र सुरक्षा (Mixed Content) के कारण यदि लाइव वीडियो यहाँ न दिखे, तो नीचे बटन दबाकर सीधे नई टैब में देखें:
              </p>
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <a
                  href={`http://${detectedIp}:81/stream`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-blue-500/20"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>कैमरा नई टैब में खोलें (http://{detectedIp}:81/stream)</span>
                </a>
                <button
                  onClick={() => {
                    setStreamMode('SNAPSHOT');
                    setStreamError(false);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium"
                >
                  स्नैपशॉट मोड आज़माएं
                </button>
              </div>
            </div>
          )}

          {/* OSD (On-Screen Display) Overlay */}
          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-mono text-emerald-400 flex items-center gap-2 border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>LIVE</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-300">IP: {detectedIp || 'No IP (Offline)'}</span>
            <span className="text-slate-400">|</span>
            <span className="text-amber-300 font-bold">{activeCommand}</span>
          </div>
        </div>
      </div>

      {/* 3. Real-time Telemetry Data Cards (केवल मुख्य 4 कार्ड्स) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Connection Status */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">कनेक्शन</span>
            <span className={`text-xs font-black ${isOnline ? 'text-emerald-700' : 'text-rose-700'}`}>
              {isOnline ? '🟢 ऑनलाइन' : '🔴 ऑफलाइन'}
            </span>
          </div>
        </div>

        {/* Battery */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <Battery className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">बैटरी</span>
            <span className="text-xs font-black text-slate-900">
              {rtdbTelemetry.battery ?? 98}%
            </span>
          </div>
        </div>

        {/* Compass Heading */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <Compass
              className="w-5 h-5 transition-transform duration-300"
              style={{ transform: `rotate(${rtdbTelemetry.heading || 0}deg)` }}
            />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">कंपास दिशा</span>
            <span className="text-xs font-black text-slate-900">
              {Math.round(rtdbTelemetry.heading || 0)}°{' '}
              <span className="text-[10px] text-slate-500 font-mono">
                ({(rtdbTelemetry.heading || 0) < 45 || (rtdbTelemetry.heading || 0) >= 315 ? 'उत्तर' : (rtdbTelemetry.heading || 0) < 135 ? 'पूर्व' : (rtdbTelemetry.heading || 0) < 225 ? 'दक्षिण' : 'पश्चिम'})
              </span>
            </span>
          </div>
        </div>

        {/* IP Address */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
            <Radio className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <span className="text-[11px] font-medium text-slate-500 block">ESP32 IP</span>
            <span className="text-xs font-mono font-bold text-slate-900 truncate block">
              {detectedIp || 'कनेक्शन प्रतीक्षारत'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Easy Remote Control Driving Buttons (आसानी वाले ड्राइविंग बटन) */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
              <span>🚗 कार ड्राइविंग कंट्रोल (Easy Touch Buttons)</span>
            </h2>
            <p className="text-xs text-slate-500">
              बटन दबाकर रखें या टैप करें — कार तुरंत रेस्पोंड करेगी
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              ⚡ मिलीसेकंड सिंक
            </span>
          </div>
        </div>

        {/* Status text */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-center font-bold text-slate-700">
          {dispatchStatus}
        </div>

        {/* Big Touch-Friendly Driving D-Pad */}
        <div className="flex flex-col items-center justify-center gap-2 pt-2 pb-2">
          {/* Forward Button */}
          <button
            onMouseDown={() => sendRoverCommand('FORWARD')}
            onMouseUp={() => sendRoverCommand('STOP')}
            onTouchStart={(e) => {
              e.preventDefault();
              sendRoverCommand('FORWARD');
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              sendRoverCommand('STOP');
            }}
            className={`w-28 h-20 rounded-2xl flex flex-col items-center justify-center font-black text-sm transition-all duration-75 shadow-md select-none cursor-pointer active:scale-95 ${
              activeCommand === 'FORWARD'
                ? 'bg-blue-700 text-white shadow-blue-500/40 ring-4 ring-blue-300'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
            }`}
          >
            <ChevronUp className="w-8 h-8 -mb-1" />
            <span>आगे (FORWARD)</span>
          </button>

          {/* Left, Stop, Right Row */}
          <div className="flex items-center justify-center gap-3 w-full max-w-sm">
            {/* Left Button */}
            <button
              onMouseDown={() => sendRoverCommand('LEFT')}
              onMouseUp={() => sendRoverCommand('STOP')}
              onTouchStart={(e) => {
                e.preventDefault();
                sendRoverCommand('LEFT');
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                sendRoverCommand('STOP');
              }}
              className={`flex-1 h-20 rounded-2xl flex flex-col items-center justify-center font-black text-sm transition-all duration-75 shadow-md select-none cursor-pointer active:scale-95 ${
                activeCommand === 'LEFT'
                  ? 'bg-blue-700 text-white shadow-blue-500/40 ring-4 ring-blue-300'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
              }`}
            >
              <ChevronLeft className="w-8 h-8 -mb-1" />
              <span>बाएं (LEFT)</span>
            </button>

            {/* Stop Button (Big Center Red) */}
            <button
              onClick={() => sendRoverCommand('STOP')}
              className={`w-24 h-20 rounded-2xl flex flex-col items-center justify-center font-black text-sm transition-all duration-75 shadow-md select-none cursor-pointer active:scale-95 ${
                activeCommand === 'STOP'
                  ? 'bg-rose-700 text-white ring-4 ring-rose-300'
                  : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/30'
              }`}
            >
              <Octagon className="w-7 h-7 -mb-0.5" />
              <span>रोकें (STOP)</span>
            </button>

            {/* Right Button */}
            <button
              onMouseDown={() => sendRoverCommand('RIGHT')}
              onMouseUp={() => sendRoverCommand('STOP')}
              onTouchStart={(e) => {
                e.preventDefault();
                sendRoverCommand('RIGHT');
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                sendRoverCommand('STOP');
              }}
              className={`flex-1 h-20 rounded-2xl flex flex-col items-center justify-center font-black text-sm transition-all duration-75 shadow-md select-none cursor-pointer active:scale-95 ${
                activeCommand === 'RIGHT'
                  ? 'bg-blue-700 text-white shadow-blue-500/40 ring-4 ring-blue-300'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
              }`}
            >
              <ChevronRight className="w-8 h-8 -mb-1" />
              <span>दाएं (RIGHT)</span>
            </button>
          </div>

          {/* Backward Button */}
          <button
            onMouseDown={() => sendRoverCommand('BACKWARD')}
            onMouseUp={() => sendRoverCommand('STOP')}
            onTouchStart={(e) => {
              e.preventDefault();
              sendRoverCommand('BACKWARD');
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              sendRoverCommand('STOP');
            }}
            className={`w-28 h-20 rounded-2xl flex flex-col items-center justify-center font-black text-sm transition-all duration-75 shadow-md select-none cursor-pointer active:scale-95 ${
              activeCommand === 'BACKWARD'
                ? 'bg-blue-700 text-white shadow-blue-500/40 ring-4 ring-blue-300'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
            }`}
          >
            <span>पीछे (BACK)</span>
            <ChevronDown className="w-8 h-8 -mt-1" />
          </button>
        </div>

        {/* Speed Slider */}
        <div className="pt-3 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-blue-600" />
              रफ्तार नियंत्रण (Motor Speed / PWM)
            </span>
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
              {Math.round((currentSpeed / 255) * 100)}% (PWM: {currentSpeed})
            </span>
          </div>

          <input
            type="range"
            min="60"
            max="255"
            value={currentSpeed}
            onChange={(e) => setCurrentSpeed(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />

          <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold mt-2">
            <button
              onClick={() => setCurrentSpeed(100)}
              className={`px-2.5 py-1 rounded-md border ${
                currentSpeed <= 110 ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-slate-50 border-slate-200'
              }`}
            >
              धीमी (40%)
            </button>
            <button
              onClick={() => setCurrentSpeed(180)}
              className={`px-2.5 py-1 rounded-md border ${
                currentSpeed > 110 && currentSpeed <= 200 ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-slate-50 border-slate-200'
              }`}
            >
              मध्यम (70%)
            </button>
            <button
              onClick={() => setCurrentSpeed(255)}
              className={`px-2.5 py-1 rounded-md border ${
                currentSpeed > 200 ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-slate-50 border-slate-200'
              }`}
            >
              अधिकतम (100%)
            </button>
          </div>
        </div>
      </div>

      {/* 5. ESP32 Code Modal (Hidden by default, opens cleanly when button is tapped) */}
      <Esp32CodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        detectedIp={detectedIp || undefined}
      />
    </div>
  );
};
