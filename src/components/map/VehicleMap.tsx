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
  const { device, liveGps } = useDevice();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  const [historicalPoints, setHistoricalPoints] = useState<GPSRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const hasLiveFix = !!(
    liveGps &&
    liveGps.latitude !== null &&
    liveGps.longitude !== null &&
    !isNaN(liveGps.latitude) &&
    !isNaN(liveGps.longitude)
  );

  // Initialize or update Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default center fallback (if no live GPS yet, standard view)
      const initialLat = hasLiveFix ? liveGps.latitude! : 14.5995;
      const initialLng = hasLiveFix ? liveGps.longitude! : 120.9842;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: hasLiveFix ? 16 : 4,
        zoomControl: false,
      });

      // CartoDB Dark Matter tiles for modern automotive/robotics styling
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          maxZoom: 19,
        }
      ).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Update vehicle marker if real fix is present
    if (hasLiveFix) {
      const lat = liveGps.latitude!;
      const lng = liveGps.longitude!;
      const pos: L.LatLngExpression = [lat, lng];

      // Custom high-contrast SVG vehicle icon with heading rotation
      const heading = liveGps.heading || 0;
      const vehicleIcon = L.divIcon({
        className: 'vehicle-marker-icon',
        html: `
          <div style="transform: rotate(${heading}deg); transition: transform 0.3s ease-out;" class="flex items-center justify-center w-10 h-10 -ml-5 -mt-5">
            <div class="relative w-8 h-8 rounded-full bg-cyan-500 border-2 border-white shadow-[0_0_15px_#06b6d4] flex items-center justify-center">
              <div class="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[9px] border-b-slate-950 -mt-0.5"></div>
            </div>
          </div>
        `,
        iconSize: [40, 40],
      });

      if (!vehicleMarkerRef.current) {
        vehicleMarkerRef.current = L.marker(pos, { icon: vehicleIcon }).addTo(map);
        vehicleMarkerRef.current.bindPopup(`
          <div class="p-1 text-slate-900 font-sans">
            <strong>${device?.name || 'NexaRover-01'}</strong><br/>
            Speed: ${liveGps.speed ?? 0} km/h<br/>
            Accuracy: ±${liveGps.accuracy ?? 2.5}m
          </div>
        `);
      } else {
        vehicleMarkerRef.current.setLatLng(pos);
        vehicleMarkerRef.current.setIcon(vehicleIcon);
      }

      map.panTo(pos);
    } else {
      if (vehicleMarkerRef.current) {
        vehicleMarkerRef.current.remove();
        vehicleMarkerRef.current = null;
      }
    }

    return () => {
      // Cleanup on unmount handled on component teardown
    };
  }, [hasLiveFix, liveGps, device?.name]);

  // Load historical GPS points if requested
  const handleToggleHistory = async () => {
    if (!showHistory) {
      setLoadingHistory(true);
      const now = Date.now();
      const points = await fetchHistoricalGPS(
        device?.deviceId || 'ROVER-ESP32-01',
        now - 24 * 60 * 60 * 1000,
        now
      );
      setHistoricalPoints(points);

      if (mapInstanceRef.current && points.length > 1) {
        const latLngs = points
          .filter((p) => p.latitude !== null && p.longitude !== null)
          .map((p) => [p.latitude!, p.longitude!] as [number, number]);

        if (routePolylineRef.current) {
          routePolylineRef.current.remove();
        }
        routePolylineRef.current = L.polyline(latLngs, {
          color: '#06b6d4',
          weight: 4,
          opacity: 0.8,
          dashArray: '6, 6',
        }).addTo(mapInstanceRef.current);

        mapInstanceRef.current.fitBounds(routePolylineRef.current.getBounds());
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-medium block">
            Latitude / Longitude
          </span>
          <div className="mt-1 text-xs font-mono font-bold text-white truncate">
            {hasLiveFix ? (
              `${liveGps.latitude!.toFixed(6)}, ${liveGps.longitude!.toFixed(6)}`
            ) : (
              <span className="text-amber-400">Unavailable</span>
            )}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-medium block">
            GPS Signal & Fix
          </span>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-bold">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span className={hasLiveFix ? 'text-emerald-400' : 'text-amber-400'}>
              {hasLiveFix ? '3D Satellite Fix' : 'GPS Not Connected'}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-medium block">
            Heading & Speed
          </span>
          <div className="mt-1 text-xs font-mono font-bold text-slate-200">
            {hasLiveFix ? (
              `${liveGps.heading ?? 0}° • ${liveGps.speed ?? 0} km/h`
            ) : (
              <span className="text-slate-500">No telemetry</span>
            )}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-medium block">
            Horizontal Accuracy
          </span>
          <div className="mt-1 text-xs font-mono font-bold text-slate-200">
            {hasLiveFix && liveGps.accuracy ? (
              `±${liveGps.accuracy.toFixed(1)} meters`
            ) : (
              <span className="text-slate-500">Unavailable</span>
            )}
          </div>
        </div>
      </div>

      {/* Map Container & Floating Controls */}
      <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Floating Map Controls */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 shadow-lg cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 shadow-lg cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleCenter}
            disabled={!hasLiveFix}
            className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-cyan-400 border border-slate-700 shadow-lg disabled:opacity-40 cursor-pointer"
            title="Center Rover"
          >
            <Crosshair className="w-4 h-4" />
          </button>
          <button
            onClick={handleToggleHistory}
            className={`p-2.5 rounded-xl border shadow-lg cursor-pointer transition ${
              showHistory
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                : 'bg-slate-900/90 text-white hover:bg-slate-800 border-slate-700'
            }`}
            title="Toggle Real Route History"
          >
            <History className="w-4 h-4" />
          </button>
        </div>

        {/* Overlay Notice if GPS is Not Connected */}
        {!hasLiveFix && (
          <div className="absolute bottom-4 left-4 right-4 z-20 p-4 rounded-xl bg-slate-900/95 border border-amber-500/40 backdrop-blur-md text-xs shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-950/80 border border-amber-800 text-amber-400 shrink-0">
                <WifiOff className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-white block font-bold">
                  GPS Hardware Not Connected / Awaiting Satellite Fix
                </strong>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  The u-blox NEO-6M/NEO-8M GPS module has not transmitted valid NMEA coordinates to Firebase yet.
                  Live positioning will automatically track and draw travel history as soon as real satellite lock is acquired.
                </p>
              </div>
            </div>

            <div className="text-[10px] font-mono text-cyan-400 bg-cyan-950/70 border border-cyan-800/50 px-2.5 py-1.5 rounded-lg shrink-0">
              RX2: GPIO16 | TX2: GPIO17
            </div>
          </div>
        )}
      </div>

      {/* GPS Hardware & Architecture Guide */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
        <div className="flex items-center gap-2 font-bold text-cyan-400 mb-2">
          <Cpu className="w-4 h-4" />
          <span>Real-time GPS Tracking Architecture (Section 11 & 12)</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          The tracking pipeline operates as: <strong>NEO-6M GPS Module → ESP32 TinyGPS++ parser → Firebase RTDB/Firestore → Leaflet Map Engine</strong>.
          No fake coordinates or simulated vehicle positions are generated. Only real NMEA sentence readings from physical satellites are mapped.
        </p>
      </div>
    </div>
  );
};
