import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import L from 'leaflet';
import { Vehicle, Booking } from '../types';
import {
  Navigation,
  Car,
  MapPin,
  Radio,
  Clock,
  Gauge,
  Compass,
  Layers,
  Crosshair,
  Maximize2,
  Minimize2,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Fuel,
  Shield,
  Activity,
  ArrowUpRight,
  Route,
  Flame,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Volume2,
} from 'lucide-react';

// OGA International Head Office (Sathorn / Bangkok)
const OGA_HQ_COORDS = { lat: 13.7225, lng: 100.5283 };

// Destination coordinate dictionary for common locations in OGA Fleet
const KNOWN_DESTINATIONS: Record<string, { lat: number; lng: number; label: string; address: string; routeWaypoints: [number, number][] }> = {
  'ปทุมธานี': {
    lat: 14.0205,
    lng: 100.5284,
    label: 'คลังสินค้า OGA จ.ปทุมธานี',
    address: 'นิคมอุตสาหกรรมนวนคร ถ.พหลโยธิน คลองหนึ่ง อ.คลองหลวง จ.ปทุมธานี',
    routeWaypoints: [
      [13.7225, 100.5283], // OGA Sathorn HQ
      [13.7385, 100.5312], // Rama 4
      [13.7650, 100.5385], // Din Daeng Tollway
      [13.8050, 100.5590], // Vibhavadi Rangsit
      [13.8580, 100.5730], // Don Mueang Tollway
      [13.9130, 100.5980], // Don Mueang Airport
      [13.9850, 100.6180], // Rangsit Future Park
      [14.0205, 100.5284], // Navanakorn Pathum Thani
    ],
  },
  'บางนา': {
    lat: 13.6682,
    lng: 100.6341,
    label: 'ศูนย์กระจายสินค้า บางนา-ตราด',
    address: 'ถ.บางนา-ตราด กม.18 อ.บางพลี จ.สมุทรปราการ',
    routeWaypoints: [
      [13.7225, 100.5283],
      [13.7150, 100.5500],
      [13.7020, 100.5850],
      [13.6780, 100.6120],
      [13.6682, 100.6341],
    ],
  },
  'ชลบุรี': {
    lat: 13.3611,
    lng: 100.9847,
    label: 'นิคมอุตสาหกรรมอมตะซิตี้ จ.ชลบุรี',
    address: 'นิคมอุตสาหกรรมอมตะซิตี้ ต.คลองตำหรุ อ.เมืองชลบุรี',
    routeWaypoints: [
      [13.7225, 100.5283],
      [13.7020, 100.5850],
      [13.6682, 100.6341],
      [13.5850, 100.7500],
      [13.4800, 100.8700],
      [13.3611, 100.9847],
    ],
  },
  'กระทรวงการคลัง': {
    lat: 13.7797,
    lng: 100.5342,
    label: 'กระทรวงการคลัง ถ.พระราม 6',
    address: 'ถ.พระราม 6 แขวงพญาไท เขตพญาไท กรุงเทพฯ',
    routeWaypoints: [
      [13.7225, 100.5283],
      [13.7450, 100.5310],
      [13.7650, 100.5330],
      [13.7797, 100.5342],
    ],
  },
  'สนามบินสุวรรณภูมิ': {
    lat: 13.6900,
    lng: 100.7501,
    label: 'ท่าอากาศยานสุวรรณภูมิ (BKK)',
    address: 'ต.หนองปรือ อ.บางพลี จ.สมุทรปราการ',
    routeWaypoints: [
      [13.7225, 100.5283],
      [13.7380, 100.5650],
      [13.7320, 100.6400],
      [13.7150, 100.7000],
      [13.6900, 100.7501],
    ],
  },
  'โรงแรม Centara Grand': {
    lat: 13.8183,
    lng: 100.5601,
    label: 'โรงแรม Centara Grand Central Plaza',
    address: 'ถ.พหลโยธิน แขวงจตุจักร เขตจตุจักร กรุงเทพฯ',
    routeWaypoints: [
      [13.7225, 100.5283],
      [13.7480, 100.5340],
      [13.7820, 100.5520],
      [13.8183, 100.5601],
    ],
  },
};

function getDestinationInfo(destinationName?: string) {
  if (!destinationName) return KNOWN_DESTINATIONS['ปทุมธานี'];
  for (const [key, val] of Object.entries(KNOWN_DESTINATIONS)) {
    if (destinationName.toLowerCase().includes(key.toLowerCase())) {
      return val;
    }
  }
  return {
    lat: 13.9880,
    lng: 100.6170,
    label: destinationName,
    address: destinationName,
    routeWaypoints: [
      [13.7225, 100.5283],
      [13.7650, 100.5385],
      [13.8580, 100.5730],
      [13.9880, 100.6170],
    ] as [number, number][],
  };
}

interface GPSTrackingViewProps {
  vehicles: Vehicle[];
  bookings?: Booking[];
}

export const GPSTrackingView: React.FC<GPSTrackingViewProps> = ({ vehicles, bookings = [] }) => {
  // Currently selected vehicle for focused telematics
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(() => {
    const inUse = vehicles.find((v) => v.status === 'in_use');
    return inUse ? inUse.id : vehicles[0]?.id || 'v-1';
  });

  // Map Tile Mode: 'dark' (Carto DarkMatter), 'streets' (OSM), 'satellite' (Esri World Imagery)
  const [mapLayerType, setMapLayerType] = useState<'dark' | 'satellite' | 'streets'>('dark');
  const [showTraffic, setShowTraffic] = useState<boolean>(true);
  const [autoFollow, setAutoFollow] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [simSpeedMultiplier, setSimSpeedMultiplier] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Live Telemetry states
  const [progressRatio, setProgressRatio] = useState<number>(0.42); // 0.0 to 1.0 along the route
  const [currentSpeed, setCurrentSpeed] = useState<number>(64);
  const [calculatedDistanceKm, setCalculatedDistanceKm] = useState<number>(38.4);

  // Map DOM reference
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const trafficLayerRef = useRef<L.Polyline | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const originMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);

  // Selected Vehicle
  const activeVehicle = useMemo(() => {
    return vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];
  }, [vehicles, selectedVehicleId]);

  // Active Booking
  const activeBooking = useMemo(() => {
    return (
      bookings.find(
        (b) =>
          b.vehicleId === activeVehicle?.id &&
          (b.status === 'in_progress' || b.status === 'approved' || b.status === 'pending_dept')
      ) ||
      bookings.find((b) => b.vehicleId === activeVehicle?.id)
    );
  }, [bookings, activeVehicle]);

  // Destination Info
  const destinationInfo = useMemo(() => {
    return getDestinationInfo(activeBooking?.destination || 'ปทุมธานี');
  }, [activeBooking]);

  // Calculate current vehicle GPS position by interpolating along waypoints
  const waypoints = destinationInfo.routeWaypoints;
  const currentCoords = useMemo(() => {
    if (waypoints.length < 2) return { lat: OGA_HQ_COORDS.lat, lng: OGA_HQ_COORDS.lng, heading: 0 };
    const totalSegments = waypoints.length - 1;
    const scaledProgress = Math.max(0, Math.min(1, progressRatio)) * totalSegments;
    const currentSegmentIndex = Math.min(Math.floor(scaledProgress), totalSegments - 1);
    const segmentFraction = scaledProgress - currentSegmentIndex;

    const p1 = waypoints[currentSegmentIndex];
    const p2 = waypoints[currentSegmentIndex + 1];

    const lat = p1[0] + (p2[0] - p1[0]) * segmentFraction;
    const lng = p1[1] + (p2[1] - p1[1]) * segmentFraction;

    // Calculate heading angle
    const dLat = p2[0] - p1[0];
    const dLng = p2[1] - p1[1];
    const angleRad = Math.atan2(dLng, dLat);
    const heading = (angleRad * 180) / Math.PI;

    return { lat, lng, heading };
  }, [waypoints, progressRatio]);

  // Live timer update
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Animation Loop: simulate vehicle moving along route
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setProgressRatio((prev) => {
        const step = 0.0025 * simSpeedMultiplier;
        const next = prev + step;
        if (next >= 1.0) {
          return 0.05; // Loop back
        }
        return next;
      });

      // Random speed fluctuations between 55 and 82 km/h
      setCurrentSpeed((prev) => {
        const delta = (Math.random() - 0.5) * 4;
        const newSpeed = Math.max(45, Math.min(88, Math.round(prev + delta)));
        return newSpeed;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [isSimulating, simSpeedMultiplier]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (leafletMapRef.current) return; // already initialized

    // Create Map
    const map = L.map(mapContainerRef.current, {
      center: [currentCoords.lat, currentCoords.lng],
      zoom: 12,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial Tile Layer (Dark Matter)
    const tileLayer = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
        maxZoom: 19,
        subdomains: 'abcd',
      }
    ).addTo(map);

    tileLayerRef.current = tileLayer;
    leafletMapRef.current = map;

    return () => {
      map.remove();
      leafletMapRef.current = null;
    };
  }, []);

  // Switch Tile Layer when layerType changes
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    let attribution = '&copy; CARTO &copy; OpenStreetMap';

    if (mapLayerType === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
    } else if (mapLayerType === 'streets') {
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '&copy; OpenStreetMap contributors';
    } else {
      // Dark
      url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      attribution = '&copy; CARTO &copy; OpenStreetMap';
    }

    const newTileLayer = L.tileLayer(url, { attribution, maxZoom: 19 }).addTo(map);
    tileLayerRef.current = newTileLayer;
  }, [mapLayerType]);

  // Update Route Polyline & Markers on destination or vehicle change
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    // Remove existing layers
    if (routePolylineRef.current) map.removeLayer(routePolylineRef.current);
    if (trafficLayerRef.current) map.removeLayer(trafficLayerRef.current);
    if (originMarkerRef.current) map.removeLayer(originMarkerRef.current);
    if (destinationMarkerRef.current) map.removeLayer(destinationMarkerRef.current);

    // 1. Draw Route Polyline
    const polyline = L.polyline(waypoints, {
      color: '#f59e0b',
      weight: 5,
      opacity: 0.85,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);
    routePolylineRef.current = polyline;

    // 2. Origin Marker (OGA Sathorn HQ)
    const originIcon = L.divIcon({
      className: 'custom-map-icon',
      html: `
        <div class="flex flex-col items-center">
          <div class="px-2 py-0.5 rounded-md bg-slate-900 border border-emerald-500 text-white text-[10px] font-bold shadow-lg mb-1 whitespace-nowrap flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            OGA สำนักงานใหญ่
          </div>
          <div class="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg border-2 border-white text-xs">
            <i class="fa-solid fa-building"></i>
          </div>
        </div>
      `,
      iconSize: [120, 50],
      iconAnchor: [60, 48],
    });
    const originMarker = L.marker([OGA_HQ_COORDS.lat, OGA_HQ_COORDS.lng], { icon: originIcon }).addTo(map);
    originMarkerRef.current = originMarker;

    // 3. Destination Marker
    const destIcon = L.divIcon({
      className: 'custom-map-icon',
      html: `
        <div class="flex flex-col items-center">
          <div class="px-2.5 py-0.5 rounded-md bg-slate-900 border border-rose-500 text-white text-[10px] font-bold shadow-lg mb-1 whitespace-nowrap flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-rose-400"></span>
            ${destinationInfo.label}
          </div>
          <div class="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg border-2 border-white text-xs">
            <i class="fa-solid fa-flag-checkered"></i>
          </div>
        </div>
      `,
      iconSize: [140, 50],
      iconAnchor: [70, 48],
    });
    const destMarker = L.marker([destinationInfo.lat, destinationInfo.lng], { icon: destIcon }).addTo(map);
    destinationMarkerRef.current = destMarker;

    // Fit bounds smoothly
    const bounds = L.latLngBounds(waypoints);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [waypoints, destinationInfo]);

  // Update Moving Vehicle Marker position & heading
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    const carHtml = `
      <div class="relative flex flex-col items-center cursor-pointer">
        <!-- Radar Pulse -->
        <span class="absolute -top-1 w-12 h-12 rounded-full bg-amber-400/30 animate-ping pointer-events-none"></span>
        
        <!-- Live Vehicle Badge -->
        <div class="mb-1 bg-slate-950/95 backdrop-blur-md px-2.5 py-1 rounded-xl border border-amber-500 text-white shadow-2xl text-center whitespace-nowrap z-30 pointer-events-auto">
          <div class="text-[11px] font-black text-amber-400 font-mono flex items-center justify-center gap-1">
            <i class="fa-solid fa-car"></i>
            ${activeVehicle.plate}
          </div>
          <div class="text-[10px] text-emerald-400 font-mono font-bold">
            ${currentSpeed} km/h • กำลังวิ่ง
          </div>
        </div>

        <!-- Vehicle Icon Circle with Arrow -->
        <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 flex items-center justify-center shadow-2xl border-2 border-white z-20 transition-transform duration-300" style="transform: rotate(${currentCoords.heading}deg)">
          <i class="fa-solid fa-location-arrow text-sm"></i>
        </div>
      </div>
    `;

    const vehicleIcon = L.divIcon({
      className: 'custom-vehicle-marker',
      html: carHtml,
      iconSize: [120, 80],
      iconAnchor: [60, 70],
    });

    if (!vehicleMarkerRef.current) {
      const marker = L.marker([currentCoords.lat, currentCoords.lng], { icon: vehicleIcon }).addTo(map);
      vehicleMarkerRef.current = marker;
    } else {
      vehicleMarkerRef.current.setLatLng([currentCoords.lat, currentCoords.lng]);
      vehicleMarkerRef.current.setIcon(vehicleIcon);
    }

    // If auto-follow is enabled, pan camera slightly
    if (autoFollow) {
      map.panTo([currentCoords.lat, currentCoords.lng], { animate: true, duration: 0.4 });
    }
  }, [currentCoords, activeVehicle, currentSpeed, autoFollow]);

  // Recalculate distance and ETA based on progressRatio
  const distTraveled = (calculatedDistanceKm * progressRatio).toFixed(1);
  const distRemaining = (calculatedDistanceKm * (1 - progressRatio)).toFixed(1);
  const etaMinutes = Math.max(2, Math.round((calculatedDistanceKm * (1 - progressRatio)) / (currentSpeed / 60)));

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 font-black">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  ติดตามตำแหน่ง GPS ยานพาหนะ (Real-time Telematics)
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  LIVE GPS 10Hz
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                ระบบระบุพิกัดดาวเทียมแบบเรียลไทม์ ตรวจจับความเร็ว เส้นทางเดินรถ และปริมาณเชื้อเพลิง
              </p>
            </div>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-900 text-white border border-slate-800 text-xs flex items-center gap-3 font-mono shadow-sm">
            <div className="flex items-center gap-1.5 text-amber-400">
              <Radio className="w-4 h-4 animate-pulse" />
              <span>SATELLITES: 16/18</span>
            </div>
            <div className="h-4 w-px bg-slate-800" />
            <div className="text-slate-300">
              {currentTime || '12:00:00'}
            </div>
          </div>
        </div>
      </div>

      {/* Fleet Vehicles Quick Picker Carousel */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
        {vehicles.map((veh) => {
          const isSelected = veh.id === activeVehicle.id;
          const isMoving = veh.status === 'in_use';

          return (
            <button
              key={veh.id}
              onClick={() => {
                setSelectedVehicleId(veh.id);
                setProgressRatio(0.35); // Reset vehicle on path
              }}
              className={`flex-shrink-0 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border text-left transition cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 border-amber-500 shadow-md ring-2 ring-amber-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950'
                    : isMoving
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                <Car className="w-4 h-4" />
              </div>
              <div>
                <div className="font-extrabold text-xs leading-tight">{veh.plate}</div>
                <div className="text-[10px] opacity-75 truncate max-w-[110px]">{veh.name}</div>
              </div>
              {isMoving && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
              )}
            </button>
          );
        })}
      </div>

      {/* Main Map & Live Telemetry Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Map Canvas (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="panel p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            {/* Map Header & Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-500" />
                  แผนที่นำทางสด:
                </span>
                <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                  {activeVehicle.name} ({activeVehicle.plate})
                </span>
              </div>

              {/* Map Layer Mode Switcher */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setMapLayerType('dark')}
                  className={`px-2.5 py-1 text-xs rounded-xl font-bold transition flex items-center gap-1 ${
                    mapLayerType === 'dark'
                      ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>โหมดมืด</span>
                </button>

                <button
                  onClick={() => setMapLayerType('satellite')}
                  className={`px-2.5 py-1 text-xs rounded-xl font-bold transition flex items-center gap-1 ${
                    mapLayerType === 'satellite'
                      ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>ดาวเทียม</span>
                </button>

                <button
                  onClick={() => setMapLayerType('streets')}
                  className={`px-2.5 py-1 text-xs rounded-xl font-bold transition flex items-center gap-1 ${
                    mapLayerType === 'streets'
                      ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <MapPin className="w-3 h-3" />
                  <span>ถนน</span>
                </button>

                <button
                  onClick={() => setAutoFollow(!autoFollow)}
                  title="โฟกัสกล้องติดตามรถอัตโนมัติ"
                  className={`px-2.5 py-1 text-xs rounded-xl font-bold transition flex items-center gap-1 ${
                    autoFollow
                      ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Crosshair className="w-3 h-3" />
                  <span>{autoFollow ? 'ติดตามรถ' : 'ล็อกมุมมอง'}</span>
                </button>
              </div>
            </div>

            {/* Live Leaflet Map Container */}
            <div className="relative h-[440px] sm:h-[500px] w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner bg-slate-950">
              <div ref={mapContainerRef} className="w-full h-full z-10" />

              {/* Floating Speed HUD Overlay */}
              <div className="absolute top-3 left-3 z-20 bg-slate-950/90 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-slate-700/80 shadow-2xl text-white pointer-events-auto flex items-center gap-3 font-mono">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                  <Gauge className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">ความเร็ว GPS</div>
                  <div className="text-xl font-black text-amber-400 leading-none">
                    {currentSpeed}{' '}
                    <span className="text-xs font-normal text-slate-400">km/h</span>
                  </div>
                </div>
              </div>

              {/* Floating Route Progress HUD Overlay */}
              <div className="absolute bottom-3 left-3 right-3 z-20 bg-slate-950/95 backdrop-blur-md p-3 rounded-2xl border border-slate-700/80 shadow-2xl text-white pointer-events-auto">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-400 flex items-center gap-1">
                      <Route className="w-3.5 h-3.5" />
                      {destinationInfo.label}
                    </span>
                    <span className="text-[11px] text-slate-400">({distTraveled} / {calculatedDistanceKm} กม.)</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-xs">
                    <span className="text-emerald-400 font-bold">
                      เหลืออีก {distRemaining} กม.
                    </span>
                    <span className="text-amber-300 font-bold">
                      ETA: ~{etaMinutes} นาที
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.round(progressRatio * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Map Simulation Controls Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSimulating(!isSimulating)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                    isSimulating
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isSimulating ? 'หยุดจำลอง' : 'เริ่มจำลองการวิ่ง'}</span>
                </button>

                <button
                  onClick={() => setProgressRatio(0.05)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>เริ่มเส้นทางใหม่</span>
                </button>

                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <span className="text-[10px] text-slate-400 px-1 font-semibold">สปีด:</span>
                  {[1, 2, 4].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSimSpeedMultiplier(s)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                        simSpeedMultiplier === s
                          ? 'bg-amber-500 text-slate-950'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="font-mono text-[11px] text-slate-400">
                พิกัด: {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)} (ทิศ {Math.round(currentCoords.heading)}°)
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Telematics Dashboard & Diagnostics (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Booking & Driver Card */}
          <div className="panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-500" />
                ข้อมูลภารกิจ & ผู้ขับขี่
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                ACTIVE MISSION
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] text-slate-400 font-medium">ยานพาหนะประจำภารกิจ</div>
                <div className="text-sm font-black text-slate-900 dark:text-slate-100 mt-0.5">
                  {activeVehicle.name}
                </div>
                <div className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                  ทะเบียน: {activeVehicle.plate} ({activeVehicle.type})
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px]">พนักงานขับรถ</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {activeBooking?.driverName || 'นายสมบัติ รักความเร็ว'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px]">ผู้จอง / แผนก</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {activeBooking?.userName || 'คุณณัฐพงษ์ (Sales)'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 block mb-1">
                  📍 จุดหมายปลายทาง:
                </span>
                <div className="font-bold text-slate-900 dark:text-slate-100">
                  {destinationInfo.label}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  {destinationInfo.address}
                </p>
              </div>
            </div>
          </div>

          {/* Vehicle Telematics Diagnostics */}
          <div className="panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              การตรวจวัดสถานะเครื่องยนต์ (OBD-II)
            </h3>

            <div className="space-y-3 text-xs">
              {/* Dual Fuel & Gas Status */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-500" />
                    ระดับก๊าซ LPG / NGV (Dual Fuel)
                  </span>
                  <span className="font-mono font-bold text-amber-500">78%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '78%' }} />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Fuel className="w-4 h-4 text-blue-500" />
                    ระดับน้ำมันเบนซิน 95
                  </span>
                  <span className="font-mono font-bold text-blue-500">85%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '85%' }} />
                </div>
              </div>

              {/* Engine Stats Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px]">อุณหภูมิน้ำหล่อเย็น</span>
                  <div className="text-base font-black text-slate-800 dark:text-slate-200 font-mono">
                    89°C <span className="text-xs text-emerald-500 font-normal">(ปกติ)</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px]">แรงดันแบตเตอรี่</span>
                  <div className="text-base font-black text-slate-800 dark:text-slate-200 font-mono">
                    14.2 V <span className="text-xs text-emerald-500 font-normal">(ปกติ)</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px]">รอบเครื่องยนต์ (RPM)</span>
                  <div className="text-base font-black text-slate-800 dark:text-slate-200 font-mono">
                    1,850 <span className="text-xs text-slate-400 font-normal">rpm</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px]">สถานะความปลอดภัย</span>
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    ปลอดภัยในเส้นทาง
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
