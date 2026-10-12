import React, { useEffect, useRef, useState } from 'react';
import { useDevice } from '../../context/DeviceContext';
import { fetchHistoricalGPS } from '../../services/firebaseService';
import { GPSRecord } from '../../types';
import L from 'leaflet';
import {
  MapPin,
  Navigation,
  Compass,
  Radio,
  Layers,
  ZoomIn,
  ZoomOut,
  Crosshair,
  WifiOff,
  Clock,
  Gauge,
  History,
  Cpu,
} from 'lucide-react';

export const VehicleMap: React.FC = () => {
  const { device, liveGps, connectionState } = useDevice();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  const [historicalPoints, setHistoricalPoints] = useState<GPSRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyNotice, setHistoryNotice] = useState<string | null>(null);

  const isConnected = connectionState === 'CONNECTED';

  const hasLiveFix = !!(
    isConnected &&
    liveGps &&
    liveGps.latitude !== null &&
    liveGps.longitude !== null &&
    !isNaN(liveGps.latitude) &&
    !isNaN(liveGps.longitude) &&
    liveGps.status === 'FIX_ACQUIRED'
  );

  // Initialize or update Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize map with neutral global view if no live fix yet
      const initialLat = hasLiveFix ? liveGps.latitude! : 20.0;
      const initialLng = hasLiveFix ? liveGps.longitude! : 0.0;
      const initialZoom = hasLiveFix ? 16 : 2;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: initialZoom,
        zoomControl: false,
      });

      // Real OpenStreetMap standard tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Update vehicle marker ONLY when real satellite fix exists
    if (hasLiveFix) {
      const lat = liveGps.latitude!;
      const lng = liveGps.longitude!;
      const pos: L.LatLngExpression = [lat, lng];

      const heading = liveGps.heading || 0;
      const vehicleIcon = L.divIcon({
        className: 'vehicle-marker-icon',
        html: `
          <div style="transform: rotate(${heading}deg); transition: transform 0.3s ease-out;" class="flex items-center justify-center w-10 h-10 -ml-5 -mt-5">
            <div class="relative w-8 h-8 rounded-full bg-blue-600 border-2 border-white shadow-md flex items-center justify-center">
              <div class="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[9px] border-b-white -mt-0.5"></div>
            </div>
          </div>
        `,
        iconSize: [40, 40],
      });

      if (!vehicleMarkerRef.current) {
        vehicleMarkerRef.current = L.marker(pos, { icon: vehicleIcon }).addTo(map);
        vehicleMarkerRef.current.bindPopup(`
          <div class="p-1 text-slate-900 font-sans text-xs">
            <strong class="text-blue-600">${device?.name || 'Rover'}</strong><br/>
            Speed: ${liveGps.speed ?? 0} km/h<br/>
            Accuracy: ±${liveGps.accuracy ?? 2.5}m<br/>
            Fix Time: ${new Date(liveGps.timestamp).toLocaleTimeString()}
          </div>
        `);
      } else {
        vehicleMarkerRef.current.setLatLng(pos);
        vehicleMarkerRef.current.setIcon(vehicleIcon);
      }

      map.panTo(pos);
    } else {
      // Remove marker if no satellite fix
      if (vehicleMarkerRef.current) {
        vehicleMarkerRef.current.remove();
        vehicleMarkerRef.current = null;
      }
    }
  }, [hasLiveFix, liveGps, device?.name]);

  // Load historical GPS points if requested
  const handleToggleHistory = async () => {
    if (!device) return;

    if (!showHistory) {
      setLoadingHistory(true);
      setHistoryNotice(null);
      const now = Date.now();
      const points = await fetchHistoricalGPS(device.deviceId, now - 24 * 60 * 60 * 1000, now);
      setHistoricalPoints(points);

      if (mapInstanceRef.current && points.length > 1) {
        const latLngs = points
          .filter((p) => p.latitude !== null && p.longitude !== null)
          .map((p) => [p.latitude!, p.longitude!] as [number, number]);

        if (routePolylineRef.current) {
          routePolylineRef.current.remove();
        }
        routePolylineRef.current = L.polyline(latLngs, {
          color: '#2563eb',
          weight: 4,
          opacity: 0.85,
          dashArray: '6, 6',
        }).addTo(mapInstanceRef.current);

        mapInstanceRef.current.fitBounds(routePolylineRef.current.getBounds());
      } else {
        setHistoryNotice('No historical route data recorded for this time range.');
        setTimeout(() => setHistoryNotice(null), 4000);
      }
      setLoadingHistory(false);
      setShowHistory(true);
    } else {
      if (routePolylineRef.current) {
        routePolylineRef.current.remove();
        routePolylineRef.current = null;
      }
      setShowHistory(false);
    }
  };

  const handleCenter = () => {
    if (mapInstanceRef.current && hasLiveFix) {
      mapInstanceRef.current.setView([liveGps.latitude!, liveGps.longitude!], 17);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top GPS Telemetry Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">
            Latitude / Longitude
          </span>
          <div className="mt-1 text-xs font-mono font-bold text-slate-900 truncate">
            {hasLiveFix ? (
              `${liveGps.latitude!.toFixed(6)}, ${liveGps.longitude!.toFixed(6)}`
            ) : (
              <span className="text-amber-700 font-sans">No GPS data available</span>
            )}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">
            GPS Signal & Satellite Fix
          </span>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-bold">
            <Radio className="w-3.5 h-3.5 text-blue-600" />
            <span className={hasLiveFix ? 'text-emerald-700' : 'text-amber-700'}>
              {hasLiveFix
                ? '3D Satellite Fix Acquired'
                : connectionState === 'DISCONNECTED'
                ? 'Rover Disconnected'
                : 'Waiting for Satellite Fix'}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">
            Heading & Speed
          </span>
          <div className="mt-1 text-xs font-mono font-bold text-slate-800">
            {hasLiveFix ? (
              `${liveGps.heading !== null && liveGps.heading !== undefined ? `${liveGps.heading}°` : '—'} • ${liveGps.speed !== null && liveGps.speed !== undefined ? `${liveGps.speed} km/h` : '0 km/h'}`
            ) : (
              <span className="text-slate-400 font-sans">Unavailable</span>
            )}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">
            Horizontal Accuracy
          </span>
          <div className="mt-1 text-xs font-mono font-bold text-slate-800">
            {hasLiveFix && liveGps.accuracy ? (
              `±${liveGps.accuracy.toFixed(1)} meters`
            ) : (
              <span className="text-slate-400 font-sans">Unavailable</span>
            )}
          </div>
        </div>
      </div>

      {historyNotice && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
          {historyNotice}
        </div>
      )}

      {/* Map Canvas & Floating Controls */}
      <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Floating Controls */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="p-2.5 rounded-xl bg-white/95 hover:bg-white text-slate-800 border border-slate-200 shadow-sm cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="p-2.5 rounded-xl bg-white/95 hover:bg-white text-slate-800 border border-slate-200 shadow-sm cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleCenter}
            disabled={!hasLiveFix}
            className="p-2.5 rounded-xl bg-white/95 hover:bg-white text-blue-600 border border-slate-200 shadow-sm disabled:opacity-40 cursor-pointer"
            title="Center Vehicle Marker"
          >
            <Crosshair className="w-4 h-4" />
          </button>
          <button
            onClick={handleToggleHistory}
            disabled={!device}
            className={`p-2.5 rounded-xl border shadow-sm cursor-pointer transition ${
              showHistory
                ? 'bg-blue-600 text-white border-blue-700 font-bold'
                : 'bg-white/95 text-slate-800 hover:bg-white border-slate-200'
            } disabled:opacity-40`}
            title="Toggle Real Route History"
          >
            <History className="w-4 h-4" />
          </button>
        </div>

        {/* Overlay Notice if GPS is Not Connected */}
        {!hasLiveFix && (
          <div className="absolute bottom-4 left-4 right-4 z-20 p-4 rounded-xl bg-white/95 border border-amber-300 backdrop-blur-md text-xs shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 shrink-0">
                <WifiOff className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-slate-900 block font-bold">
                  No GPS data available — Waiting for Satellite Fix
                </strong>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  The u-blox NEO-6M/NEO-8M GPS module has not transmitted valid coordinates to Firebase.
                  The vehicle position marker will only appear when physical satellites provide a real lock.
                </p>
              </div>
            </div>

            <div className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1.5 rounded-lg shrink-0">
              Interface: UART Serial (RX2 / TX2)
            </div>
          </div>
        )}
      </div>

      {/* GPS Architecture Notes */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm text-xs text-slate-700">
        <div className="flex items-center gap-2 font-bold text-blue-900 mb-2">
          <Cpu className="w-4 h-4 text-blue-600" />
          <span>Real-time GPS Tracking Architecture (Section 7)</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          The tracking pipeline operates as: <strong>NEO-6M GPS Module → ESP32 TinyGPS++ parser → Firebase RTDB/Firestore → Map Engine</strong>.
          No fake coordinates or simulated vehicle positions are generated. Only real NMEA sentence readings from physical satellites are mapped.
        </p>
      </div>
    </div>
  );
};
