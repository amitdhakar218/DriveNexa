import React, { useState, useEffect } from 'react';
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
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';

export const CameraViewer: React.FC = () => {
  const { device, setCameraStreamUrl, connectionState } = useDevice();
  const [streamInput, setStreamInput] = useState(device?.cameraStreamUrl || '');
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [isStreamLive, setIsStreamLive] = useState(false);
  const [streamError, setStreamError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (device?.cameraStreamUrl) {
      setStreamInput(device.cameraStreamUrl);
      setIsVerifying(true);
      setStreamError(false);
      setIsStreamLive(false);
    } else {
      setIsVerifying(false);
      setIsStreamLive(false);
      setStreamError(false);
    }
  }, [device?.cameraStreamUrl]);

  const handleSaveUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setStreamError(false);
    setIsStreamLive(false);
    setIsVerifying(true);
    await setCameraStreamUrl(streamInput);
    setIsEditingUrl(false);
  };

  const handleImgLoad = () => {
    setIsStreamLive(true);
    setStreamError(false);
    setIsVerifying(false);
  };

  const handleImgError = () => {
    setIsStreamLive(false);
    setStreamError(true);
    setIsVerifying(false);
  };

  // Determine honest camera status
  const getCameraStatusDetails = () => {
    if (!device) {
      return { label: 'Device Not Connected', color: 'text-slate-500 bg-slate-100 border-slate-200' };
    }
    if (!device.cameraStreamUrl) {
      return { label: 'Camera Not Configured', color: 'text-slate-600 bg-slate-100 border-slate-200' };
    }
    if (connectionState !== 'CONNECTED') {
      return { label: 'Camera Unavailable (Rover Offline)', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    }
    if (isVerifying) {
      return { label: 'Verifying Camera Reachability...', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    }
    if (isStreamLive) {
      return { label: 'Camera Streaming (Live)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    }
    if (streamError) {
      return { label: 'Camera Disconnected / Unreachable', color: 'text-rose-700 bg-rose-50 border-rose-200' };
    }
    return { label: 'Camera Status Unavailable', color: 'text-slate-600 bg-slate-100 border-slate-200' };
  };

  const statusDetails = getCameraStatusDetails();

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
          <span>Configure Stream URL</span>
        </button>
      </div>

      {/* Stream Config Form */}
      {isEditingUrl && (
        <form onSubmit={handleSaveUrl} className="p-5 rounded-2xl bg-white border border-blue-200 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Camera Stream URL (MJPEG / WebRTC / RTSP HTTP Proxy)
            </label>
            <input
              type="text"
              value={streamInput}
              onChange={(e) => setStreamInput(e.target.value)}
              placeholder="e.g. http://192.168.1.120:81/stream"
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
        {/* If URL configured, attempt real rendering without faking */}
        {device?.cameraStreamUrl && !streamError ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {isVerifying && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-100/90 backdrop-blur-xs">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
                <span className="text-xs text-slate-600 font-medium">Connecting to stream endpoint...</span>
              </div>
            )}
            <img
              src={device.cameraStreamUrl}
              alt="Live Rover Feed"
              onLoad={handleImgLoad}
              onError={handleImgError}
              className={`w-full h-full object-cover transition-opacity duration-300 ${isStreamLive ? 'opacity-100' : 'opacity-0'}`}
            />
          </div>
        ) : (
          /* Honest Not Connected / Unreachable Canvas */
          <div className="flex flex-col items-center justify-center p-8 text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 mb-4 shadow-xs">
              <Camera className="w-8 h-8" />
            </div>

            <h3 className="text-base font-bold text-slate-900">
              {streamError
                ? 'Camera Stream Unreachable'
                : !device?.cameraStreamUrl
                ? 'Camera Not Configured'
                : 'Camera Feed Not Connected'}
            </h3>

            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              {streamError
                ? `Could not reach ${device?.cameraStreamUrl}. Ensure your ESP32-CAM is powered, has firmware flashed, and shares the local network.`
                : !device?.cameraStreamUrl
                ? 'No video stream URL configured for this rover. Click Configure Stream URL to connect an ESP32-CAM module.'
                : 'Waiting for camera stream connection.'}
            </p>

            <button
              onClick={() => setIsEditingUrl(true)}
              className="mt-5 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Settings className="w-4 h-4 text-blue-600" />
              <span>{device?.cameraStreamUrl ? 'Reconfigure Stream' : 'Configure Stream URL'}</span>
            </button>
          </div>
        )}

        {/* Status Overlay Badge */}
        <div className={`absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl border shadow-xs backdrop-blur-md text-xs font-semibold ${statusDetails.color}`}>
          <span
            className={`w-2 h-2 rounded-full ${
              isStreamLive
                ? 'bg-emerald-500 animate-ping'
                : streamError
                ? 'bg-rose-500'
                : 'bg-amber-500'
            }`}
          />
          <span>{statusDetails.label}</span>
        </div>

        {/* Stream specs if genuinely active */}
        {isStreamLive && (
          <div className="absolute bottom-4 right-4 z-20 px-3 py-1 rounded-lg bg-white/90 text-[10px] text-blue-700 font-mono font-bold border border-slate-200 shadow-xs">
            Live Stream Verified
          </div>
        )}
      </div>

      {/* Hardware Architecture Notes */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm text-xs text-slate-700 space-y-2">
        <div className="flex items-center gap-2 font-bold text-blue-900">
          <Cpu className="w-4 h-4 text-blue-600" />
          <span>Real Camera Streaming Architecture (Section 4 & 18)</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Standard ESP32-CAM modules stream video frames via HTTP MJPEG or WebRTC directly to the client browser over WiFi. Continuous video is not stored in Firebase. The status is only marked as Streaming when the browser genuinely receives live video frames from the camera.
        </p>
      </div>
    </div>
  );
};
