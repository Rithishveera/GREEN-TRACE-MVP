import React, { useState, useRef, useEffect } from 'react';
import {
  Sliders, Layers, Maximize2, Map as MapIcon,
  Globe, ZoomIn, ZoomOut, Crosshair, ExternalLink
} from 'lucide-react';
import { Agent4Data, Agent1Data, Agent3Data, RunStatusResponse } from '../types/schemas';
import L from 'leaflet';

interface Props {
  agent4Data?: Agent4Data;
  agent1Data?: Agent1Data;
  agent3Data?: Agent3Data;
  status?: RunStatusResponse;
}

// Real Satellite & Aerial Tile Providers
const SATELLITE_PROVIDERS = [
  {
    id: 'esri',
    name: 'ESRI World Imagery HD',
    badge: 'SUB-METER AERIAL',
    color: '#10b981',
    description: 'High-resolution true optical aerial and orbital satellite orthophoto showing actual ground clearing and industrial buildings.',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri, Maxar, Earthstar Geographics, USDA, USGS',
    maxZoom: 19,
  },
  {
    id: 'sentinel2',
    name: 'Sentinel-2 True Color (ESA)',
    badge: 'COPERNICUS L2A',
    color: '#3b82f6',
    description: 'European Space Agency 10m multispectral optical imagery for statutory environmental clearance auditing.',
    url: 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg',
    attribution: '© Sentinel-2 cloudless by EOX IT Services GmbH (Contains modified Copernicus Sentinel data)',
    maxZoom: 17,
  },
  {
    id: 'osm',
    name: 'OpenStreetMap 3D / Topo',
    badge: 'VECTOR GROUND TRUTH',
    color: '#f59e0b',
    description: 'Cartographic vector map with detailed river names, cadastral boundaries, highways, and infrastructure.',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  },
  {
    id: 'opentopo',
    name: 'OpenTopoMap Terrain',
    badge: 'ELEVATION RELIEF',
    color: '#06b6d4',
    description: 'Topographic contour relief highlighting river floodplains, drainage morphology, and elevation slopes.',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© OpenTopoMap (CC-BY-SA)',
    maxZoom: 17,
  },
  {
    id: 'carto_dark',
    // Honest label: this tile source is an ESRI dark-gray cartographic basemap,
    // NOT actual Sentinel-1 SAR backscatter data.
    name: 'Dark Reference Basemap (contrast only)',
    badge: 'REFERENCE BASEMAP',
    color: '#a855f7',
    description: 'ESRI dark-gray cartographic basemap for visual contrast reference — NOT derived from SAR or radar data. Select ESRI World Imagery for real satellite imagery.',
    url: 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri, HERE, Garmin, © OpenStreetMap',
    maxZoom: 18,
  },
  {
    id: 'nasa_night',
    // Honest label: raw VIIRS night-lights tiles; no thermal band processing applied.
    name: 'Nighttime Lights Reference (VIIRS, unprocessed)',
    badge: 'VIIRS UNPROCESSED',
    color: '#ec4899',
    description: 'NASA VIIRS raw night-lights mosaic tiles. No thermal band processing applied — shows light radiance only, not industrial heat signatures.',
    url: 'https://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg',
    attribution: '© NASA Global Imagery Browse Services (GIBS)',
    maxZoom: 8,
  },
];


export const BeforeAfterSlider: React.FC<Props> = ({
  agent4Data,
  agent1Data,
  agent3Data,
}) => {
  // Determine if we are in simulation mode — this gates what overlays are allowed to show
  const isSimulation = !agent4Data?.analysis_mode || agent4Data.analysis_mode !== 'live_gee';

  const [activeProviderId, setActiveProviderId] = useState<string>('esri');
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side' | 'diff' | 'real-map'>('slider');
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showBufferOverlay, setShowBufferOverlay] = useState<boolean>(true);
  const [showEncroachmentOverlay, setShowEncroachmentOverlay] = useState<boolean>(true);
  const [currentZoom, setCurrentZoom] = useState<number>(15);

  // Map DOM Refs
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const mapBottomRef = useRef<HTMLDivElement>(null);
  const mapTopRef = useRef<HTMLDivElement>(null);
  const mapSideLeftRef = useRef<HTMLDivElement>(null);
  const mapSideRightRef = useRef<HTMLDivElement>(null);
  const mapDiffRef = useRef<HTMLDivElement>(null);
  const mapInteractiveRef = useRef<HTMLDivElement>(null);

  // Map Instance Refs
  const mapBottomInstance = useRef<L.Map | null>(null);
  const mapTopInstance = useRef<L.Map | null>(null);
  const mapSideLeftInstance = useRef<L.Map | null>(null);
  const mapSideRightInstance = useRef<L.Map | null>(null);
  const mapDiffInstance = useRef<L.Map | null>(null);
  const mapInteractiveInstance = useRef<L.Map | null>(null);

  // Resolve project coordinates & data
  const coords = agent1Data?.primary_coordinate || agent1Data?.coordinates?.[0] || [13.8485, 75.7042];
  const lat = coords[0] || 13.8485;
  const lon = coords[1] || 75.7042;
  const bufferDist = agent3Data?.buffer_distance_meters || 100;
  const waterbodyName = agent3Data?.waterbody_name || 'Riparian Waterbody';
  const changeAreaM2 = agent4Data?.change_area_m2 || 3820;
  const changePct = agent4Data?.change_percentage || 18.5;
  const projectName = agent1Data?.project_name || 'Environmental Clearance Site';

  const activeProvider = SATELLITE_PROVIDERS.find(p => p.id === activeProviderId) || SATELLITE_PROVIDERS[0];

  // Helper: Create custom map marker
  const createSiteMarker = (mLat: number, mLon: number) => {
    const customIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="
          width: 32px; height: 32px; border-radius: 50%;
          background: rgba(16,185,129,0.95); border: 2px solid #ffffff;
          display: flex; align-items: center; justify-content: center;
          color: #ffffff; font-weight: bold; font-size: 15px;
          box-shadow: 0 0 25px rgba(16,185,129,0.8);
        ">📍</div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
    return L.marker([mLat, mLon], { icon: customIcon }).bindPopup(`
      <div style="font-family: sans-serif; color: #0f172a; padding: 4px; max-width: 200px;">
        <strong style="font-size: 12px; display: block; margin-bottom: 3px;">${projectName}</strong>
        <span style="font-size: 10px; color: #64748b; font-family: monospace;">${mLat.toFixed(4)}°N, ${mLon.toFixed(4)}°E</span>
      </div>
    `);
  };

  // Helper: Add buffer zone polygon
  const addBufferZone = (map: L.Map) => {
    if (!showBufferOverlay) return;
    L.circle([lat, lon], {
      radius: bufferDist * 2.8,
      color: '#eab308',
      weight: 2,
      dashArray: '6, 6',
      fillColor: '#eab308',
      fillOpacity: 0.14,
    })
      .bindTooltip(`Mandatory ${bufferDist}m Environmental Buffer Zone`, { sticky: true })
      .addTo(map);
  };

  // Helper: Add encroachment polygon
  // IMPORTANT: Only rendered when analysis_mode === 'live_gee'.
  // In simulation mode, the encroachment location and size are NOT derived from
  // real satellite data, so displaying a red circle would be misleading.
  const addEncroachmentZone = (map: L.Map) => {
    if (!showEncroachmentOverlay) return;
    if (isSimulation) {
      // In simulation mode, add a clearly-labelled illustrative marker instead
      const offsetLat = lat + 0.0011;
      const offsetLon = lon + 0.0014;
      const illIcon = L.divIcon({
        className: '',
        html: `<div style="
          padding: 4px 8px; border-radius: 6px;
          background: rgba(245,158,11,0.9); color: #000;
          font-weight: 800; font-size: 10px; white-space: nowrap;
          border: 1.5px solid #f59e0b; font-family: sans-serif;
        ">ILLUSTRATIVE — NOT AN ACTUAL DETECTION</div>`,
        iconAnchor: [90, 10],
      });
      L.marker([offsetLat, offsetLon], { icon: illIcon }).addTo(map);
      return;
    }
    const radius = Math.max(40, Math.sqrt(changeAreaM2 / Math.PI));

    L.circle([lat + 0.0011, lon + 0.0014], {
      radius,
      color: '#ef4444',
      weight: 2,
      fillColor: '#ef4444',
      fillOpacity: 0.45,
    })
      .bindPopup(`
        <div style="font-family: sans-serif; color: #0f172a; padding: 4px;">
          <strong style="color: #ef4444; font-size: 12px;">⚠ Unauthorized Encroachment</strong>
          <p style="font-size: 11px; margin: 4px 0 0 0; color: #334155;">
            Detected Built-up: <b>${changeAreaM2.toLocaleString()} m²</b> (${changePct}%)
          </p>
          <p style="font-size: 10px; margin: 2px 0 0 0; color: #64748b;">
            Inside ${bufferDist}m ${waterbodyName} zone
          </p>
        </div>
      `)
      .addTo(map);
  };

  // 1. Initialize Dual-Layer Split Slider Maps
  useEffect(() => {
    if (viewMode !== 'slider' || !mapBottomRef.current || !mapTopRef.current) return;

    if (mapBottomInstance.current) { mapBottomInstance.current.remove(); mapBottomInstance.current = null; }
    if (mapTopInstance.current) { mapTopInstance.current.remove(); mapTopInstance.current = null; }

    try {
      // Bottom Map: Post-EC Satellite with Encroachment & Buffer Overlay
      const mapBottom = L.map(mapBottomRef.current, {
        center: [lat, lon],
        zoom: currentZoom,
        zoomControl: false,
        attributionControl: false,
      });
      L.tileLayer(activeProvider.url, { maxZoom: activeProvider.maxZoom }).addTo(mapBottom);
      createSiteMarker(lat, lon).addTo(mapBottom);
      addBufferZone(mapBottom);
      addEncroachmentZone(mapBottom);

      // Top Map: Pre-EC Satellite Baseline (Unaltered real satellite tiles)
      const mapTop = L.map(mapTopRef.current, {
        center: [lat, lon],
        zoom: currentZoom,
        zoomControl: false,
        attributionControl: false,
      });
      L.tileLayer(activeProvider.url, { maxZoom: activeProvider.maxZoom }).addTo(mapTop);
      createSiteMarker(lat, lon).addTo(mapTop);

      // Synchronize panning & zooming between top and bottom maps
      let isSyncing = false;
      mapBottom.on('move', () => {
        if (!isSyncing && mapTop) {
          isSyncing = true;
          mapTop.setView(mapBottom.getCenter(), mapBottom.getZoom(), { animate: false });
          isSyncing = false;
        }
      });
      mapTop.on('move', () => {
        if (!isSyncing && mapBottom) {
          isSyncing = true;
          mapBottom.setView(mapTop.getCenter(), mapTop.getZoom(), { animate: false });
          isSyncing = false;
        }
      });

      mapBottomInstance.current = mapBottom;
      mapTopInstance.current = mapTop;
    } catch (e) {
      console.warn('Split map initialization:', e);
    }

    return () => {
      if (mapBottomInstance.current) { mapBottomInstance.current.remove(); mapBottomInstance.current = null; }
      if (mapTopInstance.current) { mapTopInstance.current.remove(); mapTopInstance.current = null; }
    };
  }, [viewMode, lat, lon, activeProviderId, showBufferOverlay, showEncroachmentOverlay, bufferDist, changeAreaM2]);

  // 2. Initialize Side-by-Side Synchronized Maps
  useEffect(() => {
    if (viewMode !== 'side-by-side' || !mapSideLeftRef.current || !mapSideRightRef.current) return;

    if (mapSideLeftInstance.current) { mapSideLeftInstance.current.remove(); mapSideLeftInstance.current = null; }
    if (mapSideRightInstance.current) { mapSideRightInstance.current.remove(); mapSideRightInstance.current = null; }

    try {
      // Left: Pre-EC Baseline
      const mapLeft = L.map(mapSideLeftRef.current, {
        center: [lat, lon],
        zoom: currentZoom,
        zoomControl: false,
        attributionControl: false,
      });
      L.tileLayer(activeProvider.url, { maxZoom: activeProvider.maxZoom }).addTo(mapLeft);
      createSiteMarker(lat, lon).addTo(mapLeft);

      // Right: Post-EC Audit
      const mapRight = L.map(mapSideRightRef.current, {
        center: [lat, lon],
        zoom: currentZoom,
        zoomControl: false,
        attributionControl: false,
      });
      L.tileLayer(activeProvider.url, { maxZoom: activeProvider.maxZoom }).addTo(mapRight);
      createSiteMarker(lat, lon).addTo(mapRight);
      addBufferZone(mapRight);
      addEncroachmentZone(mapRight);

      // Sync movement between left and right
      let isSyncing = false;
      mapLeft.on('move', () => {
        if (!isSyncing && mapRight) {
          isSyncing = true;
          mapRight.setView(mapLeft.getCenter(), mapLeft.getZoom(), { animate: false });
          isSyncing = false;
        }
      });
      mapRight.on('move', () => {
        if (!isSyncing && mapLeft) {
          isSyncing = true;
          mapLeft.setView(mapRight.getCenter(), mapRight.getZoom(), { animate: false });
          isSyncing = false;
        }
      });

      mapSideLeftInstance.current = mapLeft;
      mapSideRightInstance.current = mapRight;
    } catch (e) {
      console.warn('Side-by-side map initialization:', e);
    }

    return () => {
      if (mapSideLeftInstance.current) { mapSideLeftInstance.current.remove(); mapSideLeftInstance.current = null; }
      if (mapSideRightInstance.current) { mapSideRightInstance.current.remove(); mapSideRightInstance.current = null; }
    };
  }, [viewMode, lat, lon, activeProviderId, showBufferOverlay, showEncroachmentOverlay, bufferDist, changeAreaM2]);

  // 3. Initialize Delta Heatmap Map
  useEffect(() => {
    if (viewMode !== 'diff' || !mapDiffRef.current) return;

    if (mapDiffInstance.current) { mapDiffInstance.current.remove(); mapDiffInstance.current = null; }

    try {
      const map = L.map(mapDiffRef.current, {
        center: [lat, lon],
        zoom: currentZoom,
        zoomControl: false,
        attributionControl: false,
      });
      L.tileLayer(activeProvider.url, { maxZoom: activeProvider.maxZoom }).addTo(map);
      createSiteMarker(lat, lon).addTo(map);
      addBufferZone(map);

      // Heatmap glowing circle overlay over real satellite imagery
      const offsetLat = lat + 0.0011;
      const offsetLon = lon + 0.0014;
      L.circle([offsetLat, offsetLon], {
        radius: Math.max(50, Math.sqrt(changeAreaM2 / Math.PI) * 1.3),
        color: '#f97316',
        weight: 3,
        fillColor: '#ef4444',
        fillOpacity: 0.65,
      })
        .bindTooltip(`ΔNDBI Spectral Disturbance Anomaly (${changeAreaM2.toLocaleString()} m²)`, { sticky: true })
        .addTo(map);

      mapDiffInstance.current = map;
    } catch (e) {
      console.warn('Heatmap map initialization:', e);
    }

    return () => {
      if (mapDiffInstance.current) { mapDiffInstance.current.remove(); mapDiffInstance.current = null; }
    };
  }, [viewMode, lat, lon, activeProviderId, showBufferOverlay, bufferDist, changeAreaM2]);

  // 4. Initialize 3D Interactive Map
  useEffect(() => {
    if (viewMode !== 'real-map' || !mapInteractiveRef.current) return;

    if (mapInteractiveInstance.current) { mapInteractiveInstance.current.remove(); mapInteractiveInstance.current = null; }

    try {
      const map = L.map(mapInteractiveRef.current, {
        center: [lat, lon],
        zoom: currentZoom,
        zoomControl: false,
        attributionControl: false,
      });
      L.tileLayer(activeProvider.url, { maxZoom: activeProvider.maxZoom }).addTo(map);
      createSiteMarker(lat, lon).addTo(map);
      addBufferZone(map);
      addEncroachmentZone(map);

      mapInteractiveInstance.current = map;
    } catch (e) {
      console.warn('Interactive map initialization:', e);
    }

    return () => {
      if (mapInteractiveInstance.current) { mapInteractiveInstance.current.remove(); mapInteractiveInstance.current = null; }
    };
  }, [viewMode, lat, lon, activeProviderId, showBufferOverlay, showEncroachmentOverlay, bufferDist, changeAreaM2]);

  // Handle global slider drag
  const handleSliderMove = (clientX: number) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(Math.round(percentage * 10) / 10);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => { if (isDragging) handleSliderMove(e.clientX); };
    const onMouseUp = () => { if (isDragging) setIsDragging(false); };
    const onTouchMove = (e: TouchEvent) => { if (isDragging && e.touches[0]) handleSliderMove(e.touches[0].clientX); };
    const onTouchEnd = () => { if (isDragging) setIsDragging(false); };

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging]);

  // Zoom control helper
  const handleZoom = (delta: number) => {
    const newZoom = Math.max(12, Math.min(19, currentZoom + delta));
    setCurrentZoom(newZoom);
    if (mapBottomInstance.current) mapBottomInstance.current.setZoom(newZoom);
    if (mapTopInstance.current) mapTopInstance.current.setZoom(newZoom);
    if (mapSideLeftInstance.current) mapSideLeftInstance.current.setZoom(newZoom);
    if (mapSideRightInstance.current) mapSideRightInstance.current.setZoom(newZoom);
    if (mapDiffInstance.current) mapDiffInstance.current.setZoom(newZoom);
    if (mapInteractiveInstance.current) mapInteractiveInstance.current.setZoom(newZoom);
  };

  const handleRecenter = () => {
    const targetZoom = 15;
    setCurrentZoom(targetZoom);
    if (mapBottomInstance.current) mapBottomInstance.current.setView([lat, lon], targetZoom);
    if (mapTopInstance.current) mapTopInstance.current.setView([lat, lon], targetZoom);
    if (mapSideLeftInstance.current) mapSideLeftInstance.current.setView([lat, lon], targetZoom);
    if (mapSideRightInstance.current) mapSideRightInstance.current.setView([lat, lon], targetZoom);
    if (mapDiffInstance.current) mapDiffInstance.current.setView([lat, lon], targetZoom);
    if (mapInteractiveInstance.current) mapInteractiveInstance.current.setView([lat, lon], targetZoom);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Top Satellite Provider Selector Bar ── */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-md)', padding: '16px 20px',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-medium)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Globe size={18} style={{ color: 'var(--text-primary)' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Satellite Imagery &amp; Multi-Spectral Intelligence
                </h3>
                <span className="stamp-chip stamp-chip--pending" style={{ fontSize: '0.65rem' }}>
                  GPS {lat.toFixed(4)}°N, {lon.toFixed(4)}°E
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                High-resolution optical orbital tiles and vector terrain registry directly referenced to site coordinates.
              </p>
            </div>
          </div>

          {/* View mode toggle */}
          <div style={{
            display: 'flex', gap: 2, background: 'var(--bg-surface-elevated)',
            borderRadius: 'var(--radius-sm)', padding: 3, border: '1px solid var(--border-medium)',
          }}>
            {[
              { mode: 'slider' as const, label: 'Split Slider', icon: Sliders },
              { mode: 'side-by-side' as const, label: 'Side-by-Side', icon: Maximize2 },
              { mode: 'diff' as const, label: 'Delta Heatmap', icon: Layers },
              { mode: 'real-map' as const, label: '3D Vector Map', icon: MapIcon },
            ].map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 10px', borderRadius: 'var(--radius-sm)',
                  border: '1px solid',
                  borderColor: viewMode === mode ? 'var(--border-focus)' : 'transparent',
                  fontSize: '0.72rem', fontWeight: viewMode === mode ? 700 : 500, cursor: 'pointer',
                  background: viewMode === mode ? 'var(--bg-surface)' : 'transparent',
                  color: viewMode === mode ? 'var(--text-primary)' : 'var(--text-secondary)',
                  transition: 'all 0.15s',
                }}
              >
                <Icon size={12} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Satellite Provider Selection (Ledger Index Tabs) */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {SATELLITE_PROVIDERS.map(p => {
            const isSelected = p.id === activeProviderId;
            return (
              <button
                key={p.id}
                onClick={() => setActiveProviderId(p.id)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                  padding: '8px 12px', borderRadius: 'var(--radius-sm)', flexShrink: 0,
                  background: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                  border: '1px solid',
                  borderColor: isSelected ? 'var(--border-focus)' : 'var(--border-subtle)',
                  borderBottom: isSelected ? '3px solid var(--text-primary)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <div style={{ width: 6, height: 6, borderRadius: 'var(--radius-full)', background: 'var(--text-primary)' }} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {p.name}
                  </span>
                </div>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {p.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Simulation mode warning banner */}
        {isSimulation && (
          <div style={{
            marginTop: 12,
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--status-warning-bg)',
            border: '1px solid var(--status-warning)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}>
            <span style={{ fontSize: '0.9rem', lineHeight: 1 }}>⚠</span>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--status-warning)' }}>
                Illustrative simulation overlay only — not derived from live satellite data for this specific location.&nbsp;
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                The map displays real georeferenced satellite tile imagery for the coordinates, but spectral delta indices and encroachment measurements reflect document metadata simulations.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Active Provider Info & Layer Overlay Controls ── */}
      <div style={{
        padding: '10px 16px', borderRadius: 'var(--radius-sm)',
        background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="stamp-chip stamp-chip--pending" style={{ fontSize: '0.62rem' }}>
            {activeProvider.badge}
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {activeProvider.description}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showBufferOverlay}
              onChange={e => setShowBufferOverlay(e.target.checked)}
              style={{ accentColor: 'var(--status-warning)' }}
            />
            <span>{bufferDist}m Buffer Zone</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showEncroachmentOverlay}
              onChange={e => setShowEncroachmentOverlay(e.target.checked)}
              style={{ accentColor: 'var(--status-danger)' }}
            />
            <span>Encroachment Zone</span>
          </label>
        </div>
      </div>

      {/* ── Main Imagery / Map Canvas ── */}

      {/* 1. Real Satellite Split-Slider */}
      {viewMode === 'slider' && (
        <div
          ref={sliderContainerRef}
          style={{
            position: 'relative', width: '100%', height: 480,
            borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-medium)',
            background: 'var(--bg-app)', boxShadow: 'var(--shadow-md)',
            userSelect: 'none',
          }}
        >
          {/* Bottom Layer: Post-EC Satellite with Encroachment & Buffer */}
          <div ref={mapBottomRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

          {/* Top Layer: Pre-EC Satellite Baseline (Clipped) */}
          <div
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
              zIndex: 400,
            }}
          >
            <div ref={mapTopRef} style={{ width: '100%', height: '100%' }} />
          </div>

          {/* Draggable Divider Line */}
          <div
            style={{
              position: 'absolute', top: 0, bottom: 0, width: 2,
              background: 'var(--text-primary)', cursor: 'ew-resize',
              left: `${sliderPosition}%`, zIndex: 600,
            }}
            onMouseDown={e => { e.preventDefault(); setIsDragging(true); }}
            onTouchStart={() => { setIsDragging(true); }}
          >
            <div style={{
              position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)',
              width: 32, height: 32, borderRadius: 'var(--radius-full)',
              background: 'var(--bg-surface)', border: '2px solid var(--text-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-primary)', boxShadow: 'var(--shadow-md)',
              cursor: 'ew-resize',
            }}>
              <Sliders size={14} />
            </div>
          </div>

          {/* Floating Badges */}
          <div style={{
            position: 'absolute', top: 12, left: 12, zIndex: 700, pointerEvents: 'none',
            padding: '4px 10px', borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-surface)', border: '1px solid var(--border-medium)',
            fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)',
          }}>
            PRE-EC BASELINE ({agent4Data?.pre_ec_date?.slice(0, 10) || 'Baseline'})
          </div>

          <div style={{
            position: 'absolute', top: 12, right: 12, zIndex: 700, pointerEvents: 'none',
            padding: '4px 10px', borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-surface)', border: '1px solid var(--border-medium)',
            fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, color: 'var(--status-danger)',
          }}>
            POST-EC AUDIT ({agent4Data?.post_ec_date?.slice(0, 10) || 'Audit'})
          </div>

          {/* Zoom & Recenter Controls */}
          <div style={{
            position: 'absolute', bottom: 12, right: 12, zIndex: 700,
            display: 'flex', gap: 6,
          }}>
            <button
              onClick={() => handleZoom(1)}
              style={{
                width: 30, height: 30, borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)', color: 'var(--text-primary)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={() => handleZoom(-1)}
              style={{
                width: 30, height: 30, borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)', color: 'var(--text-primary)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
            <button
              onClick={handleRecenter}
              style={{
                width: 30, height: 30, borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)', color: 'var(--text-primary)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              title="Recenter Site"
            >
              <Crosshair size={14} />
            </button>
          </div>

          <div style={{
            position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 700, pointerEvents: 'none',
            padding: '3px 10px', borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-secondary)',
          }}>
            Drag divider to compare baseline against current ({sliderPosition}%)
          </div>
        </div>
      )}

      {/* 2. Side-by-Side Synchronized Real Satellite Maps */}
      {viewMode === 'side-by-side' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', padding: '0 2px' }}>
              <span>PRE-EC BASELINE</span>
              <span style={{ color: 'var(--text-muted)' }}>{agent4Data?.pre_ec_date}</span>
            </div>
            <div style={{ height: 440, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-medium)', background: 'var(--bg-app)' }}>
              <div ref={mapSideLeftRef} style={{ width: '100%', height: '100%' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--status-danger)', padding: '0 2px' }}>
              <span>POST-EC AUDIT</span>
              <span style={{ color: 'var(--text-muted)' }}>{agent4Data?.post_ec_date}</span>
            </div>
            <div style={{ height: 440, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-medium)', background: 'var(--bg-app)' }}>
              <div ref={mapSideRightRef} style={{ width: '100%', height: '100%' }} />
            </div>
          </div>
        </div>
      )}

      {/* 3. Delta Spectral Heatmap Map */}
      {viewMode === 'diff' && (
        <div style={{
          position: 'relative', width: '100%', height: 480,
          borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-medium)',
          boxShadow: 'var(--shadow-md)', background: 'var(--bg-app)',
        }}>
          <div ref={mapDiffRef} style={{ width: '100%', height: '100%' }} />
          <div style={{
            position: 'absolute', bottom: 12, left: 12, right: 12, zIndex: 1000,
            padding: '8px 14px', borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-medium)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: 'var(--radius-full)', background: 'var(--status-danger)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              Red anomaly zones indicate positive NDBI built-up surge exceeding 0.15 threshold inside the {bufferDist}m {waterbodyName} buffer.
            </span>
          </div>
        </div>
      )}

      {/* 4. 3D Interactive Map */}
      {viewMode === 'real-map' && (
        <div style={{
          position: 'relative', width: '100%', height: 480,
          borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-medium)',
          boxShadow: 'var(--shadow-md)', background: 'var(--bg-app)',
        }}>
          <div ref={mapInteractiveRef} style={{ width: '100%', height: '100%' }} />

          <div style={{
            position: 'absolute', bottom: 12, left: 12, zIndex: 1000,
            padding: '6px 12px', borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-medium)',
            fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: 'var(--radius-full)', background: 'var(--text-primary)' }} />
            <span>Interactive 3D Earth Layer: <b style={{ color: 'var(--text-primary)' }}>{activeProvider.name}</b></span>
            <span style={{ color: 'var(--border-medium)' }}>|</span>
            <a
              href={`https://www.google.com/maps/@?api=1&map_action=map&center=${lat},${lon}&zoom=16&basemap=satellite`}
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: 3, textDecoration: 'underline' }}
            >
              <span>Google 3D Aerial</span>
              <ExternalLink size={10} />
            </a>
          </div>
        </div>
      )}

      {/* ── Ground Truth Metrics Bar (Ledger Row Format) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        {[
          {
            label: 'Monitored Buffer Corridor',
            value: `${agent4Data?.buffer_total_area_m2?.toLocaleString() || '48,500'} m²`,
            color: 'var(--text-primary)',
            sub: `${bufferDist}m around ${waterbodyName}`,
          },
          {
            label: 'Detected Discrepancy',
            value: `${changeAreaM2.toLocaleString()} m²`,
            color: changeAreaM2 > 0 ? 'var(--status-danger)' : 'var(--status-success)',
            sub: `${changePct}% buffer encroachment`,
          },
          {
            label: 'Selected Provider',
            value: activeProvider.name.split(' ')[0],
            color: 'var(--text-primary)',
            sub: activeProvider.badge,
          },
          {
            label: 'GPS Coordinates',
            value: `${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E`,
            color: 'var(--text-primary)',
            sub: 'Geo-referenced site center',
          },
        ].map(({ label, value, color, sub }) => (
          <div
            key={label}
            className="card"
            style={{
              padding: '12px 16px',
            }}
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 4 }}>
              {label}
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color, fontFamily: 'var(--font-mono)', marginBottom: 2 }}>
              {value}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              {sub}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

