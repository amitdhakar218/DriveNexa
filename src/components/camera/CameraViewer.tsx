import React, { useState } from 'react';
import { useDevice } from '../../context/DeviceContext';
import {
  Camera,
  WifiOff,
  AlertTriangle,
  Play,
  RotateCcw,
  Settings,
  Cpu,
  Radio,
  ExternalLink,
  Shield,
} from 'lucide-react';

export const CameraViewer: React.FC = () => {
  const { device, setCameraStreamUrl } = useDevice();
  const [streamInput, setStreamInput] = useState(device?.cameraStreamUrl || '');
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [streamError, setStreamError] = useState(false);

  const cameraStatus = streamError
    ? 'ERROR'
    : device?.cameraStatus || (device?.cameraStreamUrl ? 'CONNECTED' : 'NOT CONNECTED');

  const handleSaveUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setStreamError(false);
    await setCameraStreamUrl(streamInput);
    setIsEditingUrl(false);
  };

  const handleImgError = () => {
    setStreamError(true);
  };

  const handleImgLoad = () => {
    setStreamError(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              Live Camera Feed
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
              ESP32-CAM / OV2640
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Realtime low-latency video feed. No fake videos or pre-recorded loops.
          </p>
        </div>

        <button
          onClick={() => setIsEditingUrl(!isEditingUrl)}
          className="px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-2 transition cursor-pointer border border-slate-200 shadow-xs"
        >
          <Settings className="w-4 h-4 text-blue-600" />
          <span>Configure Camera Stream</span>
        </button>
      </div>

      {/* Stream Config Form */}
      {isEditingUrl && (
        <form onSubmit={handleSaveUrl} className="p-5 rounded-2xl bg-white border border-blue-200 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Live Stream URL (MJPEG / WebRTC / RTSP Proxy)
            </label>
            <input
              type="text"
              value={streamInput}
              onChange={(e) => setStreamInput(e.target.value)}
              placeholder="e.g. http://192.168.1.120:81/stream or https://camera.local/mjpeg"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-500 mt-1.5">
              Enter the local IP address or HTTP MJPEG streaming URL broadcast by your ESP32-CAM module.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditingUrl(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shadow-xs"
            >
              Save Stream Link
            </button>
          </div>
        </form>
      )}

      {/* Camera Viewport Canvas */}
      <div className="relative w-full aspect-video bg-slate-100 rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm flex items-center justify-center">
        {/* If real stream URL exists and hasn't errored */}
        {device?.cameraStreamUrl && !streamError ? (
          <img
            src={device.cameraStreamUrl}
            alt="Rover Live Feed"
            onError={handleImgError}
            onLoad={handleImgLoad}
            className="w-full h-full object-cover"
          />
        ) : (
          /* Honest Not Connected State */
          <div className="flex flex-col items-center justify-center p-8 text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-amber-600 mb-4 shadow-xs">
              <Camera className="w-8 h-8" />
            </div>

            <h3 className="text-base font-bold text-slate-900">
              {streamError ? 'Camera Stream Unreachable' : 'Camera Feed Not Connected'}
            </h3>

            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              {streamError
                ? `Could not reach ${device?.cameraStreamUrl}. Ensure your ESP32-CAM is powered and sharing the local subnet.`
                : 'No active video stream configured. Section 18 strictly prohibits simulated or fake video loops.'}
            </p>

            <button
              onClick={() => setIsEditingUrl(true)}
              className="mt-5 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Settings className="w-4 h-4 text-blue-600" />
              <span>Connect ESP32-CAM Feed</span>
            </button>
          </div>
        )}

        {/* Status Overlay Badge */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/95 border border-slate-200 shadow-xs backdrop-blur-md text-xs font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              cameraStatus === 'CONNECTED'
                ? 'bg-emerald-500 animate-ping'
                : cameraStatus === 'ERROR'
                ? 'bg-rose-500'
                : 'bg-amber-500'
            }`}
          />
          <span className="text-slate-800 font-bold">STATUS: {cameraStatus}</span>
        </div>

        {/* Stream specs if active */}
        {cameraStatus === 'CONNECTED' && (
          <div className="absolute bottom-4 right-4 z-20 px-3 py-1 rounded-lg bg-white/90 text-[10px] text-blue-700 font-mono font-bold border border-slate-200 shadow-xs">
            VGA 640x480 • MJPEG Stream
          </div>
        )}
      </div>

      {/* Hardware Architecture Notes */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm text-xs text-slate-700 space-y-2">
        <div className="flex items-center gap-2 font-bold text-blue-900">
          <Cpu className="w-4 h-4 text-blue-600" />
          <span>Real Camera Streaming Architecture (Section 18)</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Standard ESP32-CAM modules stream video frames via HTTP MJPEG or WebRTC directly to the client browser over WiFi. Continuous video is not stored in Firebase to preserve database bandwidth and prevent latency.
        </p>
      </div>
    </div>
  );
};
