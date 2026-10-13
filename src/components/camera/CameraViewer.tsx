import React, { useState, useEffect } from 'react';
import { useDevice } from '../../context/DeviceContext';
import { Esp32CodeModal } from './Esp32CodeModal';
import {
  Camera,
  Wifi,
  WifiOff,
  AlertTriangle,
  RotateCcw,
  Settings,
  Cpu,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Code2,
  RefreshCw,
  Sliders,
  Copy,
  Maximize2
} from 'lucide-react';

export const CameraViewer: React.FC = () => {
  const { device, setCameraStreamUrl, connectionState } = useDevice();
  const detectedIp = device?.ipAddress || '10.181.152.99';
  const defaultStreamUrl = `http://${detectedIp}:81/stream`;
  const defaultSnapshotUrl = `http://${detectedIp}/cam-hi.jpg`;

  const [streamUrl, setStreamUrl] = useState(device?.cameraStreamUrl || defaultStreamUrl);
  const [streamInput, setStreamInput] = useState(device?.cameraStreamUrl || defaultStreamUrl);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [isStreamLive, setIsStreamLive] = useState(false);
  const [streamError, setStreamError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [streamMode, setStreamMode] = useState<'STREAM' | 'SNAPSHOT'>('STREAM');
  const [snapshotTimestamp, setSnapshotTimestamp] = useState(Date.now());
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Sync stream URL with device state
  useEffect(() => {
    if (device?.cameraStreamUrl) {
      setStreamUrl(device.cameraStreamUrl);
      setStreamInput(device.cameraStreamUrl);
    } else if (detectedIp) {
      const autoUrl = `http://${detectedIp}:81/stream`;
      setStreamUrl(autoUrl);
      setStreamInput(autoUrl);
    }
  }, [device?.cameraStreamUrl, detectedIp]);

  // Snapshot refresh loop if snapshot mode is active
  useEffect(() => {
    if (streamMode === 'SNAPSHOT' && connectionState === 'CONNECTED') {
      const timer = setInterval(() => {
        setSnapshotTimestamp(Date.now());
      }, 500);
      return () => clearInterval(timer);
    }
  }, [streamMode, connectionState]);

  const handleSaveUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setStreamError(false);
    setIsStreamLive(false);
    setIsVerifying(true);
    setStreamUrl(streamInput);
    await setCameraStreamUrl(streamInput);
    setIsEditingUrl(false);
  };

  const handleSetPreset = async (url: string) => {
    setStreamInput(url);
    setStreamUrl(url);
    setIsEditingUrl(false);
    setStreamError(false);
    setIsStreamLive(false);
    setIsVerifying(true);
    await setCameraStreamUrl(url);
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

  const handleRetryStream = () => {
    setIsVerifying(true);
    setStreamError(false);
    setIsStreamLive(false);
    setSnapshotTimestamp(Date.now());
  };

  const handleCopyStreamLink = () => {
    navigator.clipboard.writeText(streamUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const isOnline = connectionState === 'CONNECTED';

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              ESP32 हार्डवेयर कैमरा (OV2640)
            </h1>
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold border ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {isOnline ? 'ESP32 ONLINE' : 'ESP32 OFFLINE'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ESP32 चिप में इनबिल्ट OV2640 कैमरा मॉड्यूल से लाइव वीडियो ट्रांसमिशन ({detectedIp})
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Prominent ArduinoDroid Code Button */}
          <button
            onClick={() => setIsCodeModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-md shadow-blue-500/20"
          >
            <Code2 className="w-4 h-4" />
            <span>ESP32 कैमरा कोड (कॉपी करें)</span>
          </button>

          {/* Settings / Edit URL */}
          <button
            onClick={() => setIsEditingUrl(!isEditingUrl)}
            className="px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-slate-200 shadow-xs"
          >
            <Settings className="w-4 h-4 text-blue-600" />
            <span>IP सेटिंग्स</span>
          </button>
        </div>
      </div>

      {/* Stream Config Form (if editing) */}
      {isEditingUrl && (
        <form onSubmit={handleSaveUrl} className="p-5 rounded-2xl bg-white border border-blue-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-800">
              ESP32-CAM वीडियो स्ट्रीम URL
            </label>
            <span className="text-[11px] font-mono text-slate-500">
              डिटेक्टेड IP: <strong>{detectedIp}</strong>
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={streamInput}
              onChange={(e) => setStreamInput(e.target.value)}
              placeholder={`http://${detectedIp}:81/stream`}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono"
            />
            <button
              type="submit"
              className="px-4 py-2.5 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shadow-xs shrink-0"
            >
              सेव करें (Save)
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-semibold text-slate-500">क्विक प्रीसेट:</span>
            <button
              type="button"
              onClick={() => handleSetPreset(`http://${detectedIp}:81/stream`)}
              className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 cursor-pointer"
            >
              http://{detectedIp}:81/stream (MJPEG 30FPS)
            </button>
            <button
              type="button"
              onClick={() => handleSetPreset(`http://${detectedIp}/cam-hi.jpg`)}
              className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 cursor-pointer"
            >
              http://{detectedIp}/cam-hi.jpg (Snapshot)
            </button>
          </div>
        </form>
      )}

      {/* Camera Live Viewport */}
      <div className="relative w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm flex items-center justify-center">
        
        {/* If camera is streaming or loading */}
        {isOnline ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Live Camera Image Element */}
            <img
              key={`${streamUrl}-${streamMode === 'SNAPSHOT' ? snapshotTimestamp : 'stream'}`}
              src={
                streamMode === 'SNAPSHOT'
                  ? `${streamUrl.includes('?') ? streamUrl : streamUrl + '?'}_t=${snapshotTimestamp}`
                  : streamUrl
              }
              alt="ESP32 Live Rover Camera"
              onLoad={handleImgLoad}
              onError={handleImgError}
              className={`w-full h-full object-cover transition-opacity duration-200 ${
                isStreamLive ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Verifying / Loading Overlay */}
            {!isStreamLive && !streamError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-white p-6 text-center">
                <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                <h4 className="text-sm font-bold text-white">ESP32 चिप कैमरे से कनेक्ट हो रहा है...</h4>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  स्ट्रीम एड्रेस: {streamUrl}
                </p>
                <p className="text-[11px] text-amber-300/90 mt-2 max-w-sm">
                  नोट: अगर आपने अभी तक नया कैमरा कोड अपलोड नहीं किया है, तो नीचे दिए बटन से नया कोड ArduinoDroid में डालें।
                </p>
              </div>
            )}

            {/* Error or Browser Security Block Notice */}
            {streamError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center max-w-lg mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                
                <h3 className="text-sm font-bold text-white">
                  ESP32 कैमरा स्ट्रीम कनेक्ट नहीं हो पाई
                </h3>

                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  आपका ESP32 वाईफाई से जुड़ा है (<code className="text-blue-300 font-mono">{detectedIp}</code>), लेकिन कैमरे का वेब सर्वर अभी शुरू नहीं हुआ है। इसके 2 मुख्य कारण होते हैं:
                </p>

                <div className="text-[11px] text-left text-slate-300 bg-slate-800/80 p-3 rounded-xl border border-slate-700 w-full mt-3 space-y-1.5 font-sans">
                  <div>
                    1. <strong>पुराना कोड:</strong> पहले वाले कोड में कैमरा कोड शामिल नहीं था। नीचे हरा बटन दबाकर नया कोड कॉपी करें और ArduinoDroid से अपलोड करें।
                  </div>
                  <div>
                    2. <strong>ब्राउज़र सिक्योरिटी (Mixed Content):</strong> मोबाइल ब्राउज़र लोकल HTTP स्ट्रीम को रोक सकता है। नीचे नीले बटन से सीधे नए टैब में खोलें।
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                  {/* Direct link in new tab */}
                  <a
                    href={streamUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>सीधे ब्राउज़र में स्ट्रीम खोलें</span>
                  </a>

                  {/* Open Code Modal */}
                  <button
                    onClick={() => setIsCodeModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>नया कैमरा कोड देखें & कॉपी करें</span>
                  </button>

                  <button
                    onClick={handleRetryStream}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>पुनः प्रयास (Retry)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* When ESP32 is Disconnected / Offline */
          <div className="flex flex-col items-center justify-center p-6 text-center max-w-md bg-slate-900 text-white">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3 shadow-xs">
              <WifiOff className="w-7 h-7" />
            </div>

            <h3 className="text-sm font-bold text-white">
              ESP32 ऑफलाइन है (No Connection)
            </h3>

            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              जब ESP32 आपके मोबाइल हॉटस्पॉट (<strong className="text-slate-200">vivo</strong>) से जुड़ेगा, तो स्क्रीन अपने आप ऑनलाइन होकर लाइव कैमरा दिखाने लगेगी।
            </p>

            <div className="mt-4">
              <button
                onClick={() => setIsCodeModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Code2 className="w-4 h-4" />
                <span>ESP32 का कोड देखें</span>
              </button>
            </div>
          </div>
        )}

        {/* Status Badge in Top-Left */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl border shadow-sm backdrop-blur-md text-xs font-semibold bg-slate-900/80 text-white border-slate-700">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isStreamLive
                ? 'bg-emerald-500 animate-pulse'
                : isOnline
                ? 'bg-amber-400'
                : 'bg-rose-500'
            }`}
          />
          <span>
            {isStreamLive
              ? 'ESP32 चिप कैमरा LIVE'
              : isOnline
              ? 'ESP32 ऑनलाइन (स्ट्रीम कनेक्ट हो रही है)'
              : 'हार्डवेयर ऑफलाइन'}
          </span>
        </div>

        {/* Live FPS Badge */}
        {isStreamLive && (
          <div className="absolute bottom-4 right-4 z-20 px-3 py-1 rounded-lg bg-black/80 text-[10px] text-emerald-400 font-mono font-bold border border-emerald-900 shadow-xs flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>OV2640 LIVE STREAM</span>
          </div>
        )}
      </div>

      {/* Control Tools Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">स्ट्रीम मोड:</span>
          <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200">
            <button
              onClick={() => {
                setStreamMode('STREAM');
                setStreamUrl(`http://${detectedIp}:81/stream`);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                streamMode === 'STREAM'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              MJPEG Stream (/stream)
            </button>
            <button
              onClick={() => {
                setStreamMode('SNAPSHOT');
                setStreamUrl(`http://${detectedIp}/cam-hi.jpg`);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                streamMode === 'SNAPSHOT'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Snapshot Loop (/cam-hi.jpg)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={streamUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-slate-200"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
            <span>अलग विंडो में खोलें</span>
          </a>

          <button
            onClick={handleCopyStreamLink}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-slate-200"
          >
            <Copy className="w-3.5 h-3.5 text-slate-600" />
            <span>{copiedUrl ? 'लिंक कॉपी हो गया!' : 'स्ट्रीम लिंक कॉपी करें'}</span>
          </button>
        </div>
      </div>

      {/* Guide & Hardware Specs for Amit */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm text-xs text-slate-700 space-y-3">
        <div className="flex items-center gap-2 font-bold text-blue-900">
          <Cpu className="w-4 h-4 text-blue-600" />
          <span>अमित, ESP32 का चिप कैमरा कैसे चालू करें (3 आसान स्टेप्स):</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1">
            <div className="font-bold text-blue-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-mono">1</span>
              <span>नया कोड कॉपी करें</span>
            </div>
            <p className="text-[11px] text-slate-600">
              ऊपर <strong>&quot;ESP32 कैमरा कोड&quot;</strong> बटन दबाएं और पूरा कोड कॉपी करें। इसमें कैमरा ड्राइवर शामिल है।
            </p>
          </div>

          <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-1">
            <div className="font-bold text-indigo-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-mono">2</span>
              <span>ArduinoDroid में अपलोड करें</span>
            </div>
            <p className="text-[11px] text-slate-600">
              अपने मोबाइल में ArduinoDroid खोलें, पुराना कोड मिटाकर नया कोड पेस्ट करें और OTG केबल से ESP32 में फ्लैश करें।
            </p>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-1">
            <div className="font-bold text-emerald-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-mono">3</span>
              <span>लाइव कैमरा देखें</span>
            </div>
            <p className="text-[11px] text-slate-600">
              अपलोड होते ही ESP32 का OV2640 कैमरा ऑन हो जाएगा और इस वेबसाइट स्क्रीन पर कार का लाइव व्यू दिखने लगेगा!
            </p>
          </div>
        </div>
      </div>

      {/* Code Modal */}
      <Esp32CodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        detectedIp={detectedIp}
      />
    </div>
  );
};
