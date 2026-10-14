import React, { useState, useEffect, useRef } from 'react';
import { useDevice } from '../../context/DeviceContext';
import {
  Camera,
  Wifi,
  WifiOff,
  RefreshCw,
  Maximize2,
  Minimize2,
} from 'lucide-react';

export const CameraViewer: React.FC = () => {
  const { device, connectionState } = useDevice();
  const isOnline = connectionState === 'CONNECTED' && !!device?.ipAddress;
  const ipAddress = device?.ipAddress || null;

  const defaultStream = ipAddress ? `http://${ipAddress}:81/stream` : '';
  const defaultSnapshot = ipAddress ? `http://${ipAddress}/cam-hi.jpg` : '';

  const [useSnapshot, setUseSnapshot] = useState(false);
  const [snapshotTimestamp, setSnapshotTimestamp] = useState(Date.now());
  const [isStreamLive, setIsStreamLive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-switch to live state when device comes online
  useEffect(() => {
    if (!isOnline) {
      setIsStreamLive(false);
      setUseSnapshot(false);
    }
  }, [isOnline]);

  // Snapshot refresh loop for environments where multipart MJPEG stream needs interval polling
  useEffect(() => {
    if (isOnline && useSnapshot) {
      const timer = setInterval(() => {
        setSnapshotTimestamp(Date.now());
      }, 300);
      return () => clearInterval(timer);
    }
  }, [isOnline, useSnapshot]);

  const handleImgLoad = () => {
    setIsStreamLive(true);
  };

  const handleImgError = () => {
    // If MJPEG stream fails, automatically fall back to fast snapshot polling
    if (!useSnapshot) {
      setUseSnapshot(true);
      setSnapshotTimestamp(Date.now());
    } else {
      setIsStreamLive(false);
    }
  };

  const handleManualRefresh = () => {
    setUseSnapshot(false);
    setIsStreamLive(false);
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
      {/* Pure, Clean Camera Screen */}
      <div
        ref={containerRef}
        className="relative w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center select-none"
      >
        {/* Top Header Overlay: Status in Corner */}
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
                isOnline
                  ? isStreamLive
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-emerald-400'
                  : 'bg-rose-500'
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

        {/* Top-Right: Fullscreen & Refresh Controls */}
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

        {/* Camera Center Content */}
        {isOnline && ipAddress ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Live Camera Stream from ESP32 */}
            <img
              key={`${ipAddress}-${useSnapshot ? 'snap-' + snapshotTimestamp : 'stream'}`}
              src={
                useSnapshot
                  ? `${defaultSnapshot}?_t=${snapshotTimestamp}`
                  : defaultStream
              }
              alt="ESP32 Live Rover Camera"
              onLoad={handleImgLoad}
              onError={handleImgError}
              className={`w-full h-full object-cover transition-opacity duration-150 ${
                isStreamLive ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Connecting State */}
            {!isStreamLive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center">
                <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                <h4 className="text-sm font-bold text-slate-200">
                  ESP32 कैमरा स्ट्रीम कनेक्ट हो रहा है...
                </h4>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  http://{ipAddress}:81/stream
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Offline / No Connection Center State */
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

        {/* Live Indicator on bottom left when streaming */}
        {isOnline && isStreamLive && (
          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 border border-emerald-500/30 text-[11px] font-mono font-bold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>LIVE CAM</span>
          </div>
        )}
      </div>
    </div>
  );
};
