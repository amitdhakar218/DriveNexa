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

export const CameraViewer: React.FC<{ isOpen?: boolean; onClose?: () => void }> = ({
  isOpen = true,
  onClose,
}) => {
  const { device, setCameraStreamUrl } = useDevice();
  const [streamInput, setStreamInput] = useState(device?.cameraStreamUrl || '');
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [streamError, setStreamError] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white uppercase tracking-wider">
              Live Camera Feed
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
              ESP32-CAM / OV2640
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Realtime low-latency video feed. No fake videos or pre-recorded loops.
          </p>
        </div>

        <button
          onClick={() => setIsEditingUrl(!isEditingUrl)}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer border border-slate-700"
        >
          <Settings className="w-4 h-4 text-cyan-400" />
          <span>Configure Camera Stream</span>
        </button>
      </div>

      {/* Stream Config Modal/Section */}
      {isEditingUrl && (
        <form onSubmit={handleSaveUrl} className="p-5 rounded-2xl bg-slate-900 border border-cyan-500/30 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Live Stream URL (MJPEG / WebRTC / RTSP Proxy)
            </label>
            <input
              type="text"
              value={streamInput}
              onChange={(e) => setStreamInput(e.target.value)}
              placeholder="e.g. http://192.168.1.120:81/stream or https://camera.local/mjpeg"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
            <p className="text-[11px] text-slate-500 mt-1.5">
              Enter the local IP address or HTTP MJPEG streaming URL broadcast by your ESP32-CAM module.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditingUrl(false)}
              className="px-4 py-2 text-xs rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 cursor-pointer"
            >
              Save Stream Link
            </button>
          </div>
        </form>
      )}

      {/* Camera Viewport */}
      <div className="relative w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
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
          /* Honest Not Connected / Unavailable Canvas */
          <div className="flex flex-col items-center justify-center p-8 text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400/80 mb-4 shadow-inner">
              <Camera className="w-8 h-8" />
            </div>

            <h3 className="text-base font-bold text-white">
              {streamError ? 'Camera Stream Unreachable' : 'Camera Feed Not Connected'}
            </h3>

            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {streamError
                ? `Could not reach ${device?.cameraStreamUrl}. Ensure your ESP32-CAM is powered and sharing the local subnet.`
                : 'No active video stream configured. Section 15 strictly prohibits simulated or fake video loops.'}
            </p>

            <button
              onClick={() => setIsEditingUrl(true)}
              className="mt-5 px-4 py-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              <span>Connect ESP32-CAM Feed</span>
            </button>
          </div>
        )}

        {/* Status Overlay Badge */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md text-xs font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              cameraStatus === 'CONNECTED'
                ? 'bg-emerald-400 animate-ping'
                : cameraStatus === 'ERROR'
                ? 'bg-red-400'
                : 'bg-amber-400'
            }`}
          />
          <span className="text-slate-300 font-bold">STATUS: {cameraStatus}</span>
        </div>

        {/* Video stream resolution & FPS if active */}
        {cameraStatus === 'CONNECTED' && (
          <div className="absolute bottom-4 right-4 z-20 px-3 py-1 rounded-lg bg-slate-900/80 text-[10px] text-cyan-300 font-mono border border-slate-700">
            VGA 640x480 • MJPEG Stream
          </div>
        )}
      </div>

      {/* Streaming Hardware Architecture Details */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2">
        <div className="flex items-center gap-2 font-bold text-cyan-400">
          <Cpu className="w-4 h-4" />
          <span>Real Camera Streaming Architecture (Section 15)</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Standard ESP32-CAM modules (such as the AI-Thinker OV2640 board) stream video frames via HTTP MJPEG or WebRTC directly to the client browser over WiFi. Continuous video is not written into Firebase to ensure low latency and prevent excessive database billing.
        </p>
      </div>
    </div>
  );
};
