import React, { useState, useEffect, useRef } from 'react';
import { useDevice } from '../../context/DeviceContext';
import {
  Camera,
  Wifi,
  WifiOff,
  RefreshCw,
  Maximize2,
  Minimize2,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';

export const CameraViewer: React.FC = () => {
  const { device, connectionState } = useDevice();
  const isOnline = connectionState === 'CONNECTED' && !!device?.ipAddress;
  const ipAddress = isOnline ? device?.ipAddress : null;
  const cameraStatus = device?.cameraStatus || 'NOT_CONFIGURED';

  const defaultStream = ipAddress ? `http://${ipAddress}:81/stream` : '';
  const defaultSnapshot = ipAddress ? `http://${ipAddress}/cam-hi.jpg` : '';

  const [useSnapshot, setUseSnapshot] = useState(false);
  const [snapshotTimestamp, setSnapshotTimestamp] = useState(Date.now());
  const [streamError, setStreamError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Snapshot polling loop if snapshot mode is active
  useEffect(() => {
    if (isOnline && useSnapshot) {
      const timer = setInterval(() => {
        setSnapshotTimestamp(Date.now());
      }, 400);
      return () => clearInterval(timer);
    }
  }, [isOnline, useSnapshot]);

  // Reset stream error when IP or connection changes
  useEffect(() => {
    setStreamError(false);
  }, [ipAddress, isOnline]);

  const handleImgError = () => {
    // If stream fails to render (e.g. browser mixed-content policy blocking HTTP on HTTPS)
    if (!useSnapshot) {
      setUseSnapshot(true);
      setSnapshotTimestamp(Date.now());
    } else {
      setStreamError(true);
    }
  };

  const handleManualRefresh = () => {
    setStreamError(false);
    setUseSnapshot(false);
    setSnapshotTimestamp(Date.now());
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Camera Viewport */}
      <div
        ref={containerRef}
        className="relative w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center select-none"
      >
        {/* Top-Left: Live Connection Status */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-md text-xs font-bold shadow-md ${
              isOnline
                ? 'bg-slate-900/85 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-900/85 border-rose-500/40 text-rose-400'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            {isOnline ? (
              <span className="flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5" />
                <span>ऑनलाइन ({ipAddress})</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <WifiOff className="w-3.5 h-3.5" />
                <span>ऑफलाइन</span>
              </span>
            )}
          </div>
        </div>

        {/* Top-Right: Fullscreen & Refresh */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          {isOnline && (
            <button
              onClick={handleManualRefresh}
              title="कैमरा रिफ्रेश करें"
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer shadow-md"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'सामान्य स्क्रीन' : 'फुल स्क्रीन'}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer shadow-md"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Center Screen: Live Camera or Offline */}
        {isOnline && ipAddress ? (
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            {cameraStatus === 'ERROR' ? (
              /* Hardware Probe Error */
              <div className="flex flex-col items-center justify-center p-6 text-center text-white max-w-md">
                <AlertTriangle className="w-12 h-12 text-amber-400 mb-3" />
                <h4 className="text-sm font-bold text-white">
                  कैमरा सेंसर एरर (Camera Sensor Error)
                </h4>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  ESP32 ऑनलाइन है लेकिन OV2640 कैमरा सेंसर डिटेक्ट नहीं हुआ।
                  कृपया चेक करें कि आपका बोर्ड AI-Thinker है या ESP32-S3 और सही पिन सेटिंग्स वाला कोड अपलोड करें।
                </p>
              </div>
            ) : streamError ? (
              /* Browser Mixed-Content or Stream Error */
              <div className="flex flex-col items-center justify-center p-6 text-center text-white max-w-md">
                <Camera className="w-10 h-10 text-blue-400 mb-3" />
                <h4 className="text-sm font-bold text-white">
                  ESP32 कैमरा लाइव है ({ipAddress})
                </h4>
                <p className="text-xs text-slate-400 mt-1.5 mb-4 leading-relaxed">
                  मोबाइल ब्राउज़र सुरक्षा के कारण यदि स्ट्रीम स्क्रीन पर न दिखे,
                  तो नीचे बटन दबाकर सीधे देखें:
                </p>
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <a
                    href={defaultStream}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>कैमरा स्ट्रीम खोलें ({ipAddress}:81)</span>
                  </a>
                  <button
                    onClick={handleManualRefresh}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700"
                  >
                    पुनः प्रयास
                  </button>
                </div>
              </div>
            ) : (
              /* Clean Live Camera Display — Always Opacity 100% */
              <img
                key={`${ipAddress}-${useSnapshot ? 'snap-' + snapshotTimestamp : 'stream'}`}
                src={
                  useSnapshot
                    ? `${defaultSnapshot}?_t=${snapshotTimestamp}`
                    : defaultStream
                }
                alt="ESP32 Live Rover Camera"
                onError={handleImgError}
                className="w-full h-full object-contain block select-none pointer-events-none"
              />
            )}
          </div>
        ) : (
          /* Offline Center State */
          <div className="flex flex-col items-center justify-center p-8 text-center max-w-sm text-white">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 shadow-inner">
              <Camera className="w-8 h-8 opacity-80" />
            </div>
            <h3 className="text-base font-bold text-white tracking-wide">
              नो कनेक्शन (ESP32 Offline)
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              जैसे ही ESP32 चालू होगा और उसका आईपी एड्रेस वेबसाइट से जुड़ेगा,
              कैमरा अपने आप इसी स्क्रीन पर लाइव चालू हो जाएगा।
            </p>
          </div>
        )}

        {/* Live Indicator on bottom left when connected */}
        {isOnline && !streamError && cameraStatus !== 'ERROR' && (
          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 border border-emerald-500/30 text-[11px] font-mono font-bold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>LIVE OV2640</span>
          </div>
        )}
      </div>
    </div>
  );
};
