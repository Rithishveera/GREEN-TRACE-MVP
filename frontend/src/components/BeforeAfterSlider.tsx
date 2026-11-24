import React, { useState, useRef, useEffect } from 'react';
import {
  Sliders, Layers, Maximize2, Map as MapIcon,
  Globe, ZoomIn, ZoomOut, Crosshair, ExternalLink
} from 'lucide-react';
import { Agent4Data, Agent1Data, Agent3Data, RunStatusResponse } from '../types/schemas';
import { MapLegend } from './MapLegend';
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
    description: 'High-resolution optical aerial and orbital satellite orthophoto showing actual ground clearing and industrial buildings.',
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
    name: 'OpenStreetMap Vector / Topo',
    badge: 'VECTOR GROUND TRUTH',
    color: '#f59e0b',
    description: 'Cartographic vector map with detailed waterbody names, cadastral boundaries, highways, and infrastructure.',
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
    name: 'Dark Reference Basemap',
    badge: 'REFERENCE BASEMAP',
    color: '#a855f7',
    description: 'ESRI dark-gray cartographic basemap for visual contrast reference — NOT derived from SAR or radar data.',
    url: 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri, HERE, Garmin, © OpenStreetMap',
    maxZoom: 18,
  },
];

export const BeforeAfterSlider: React.FC<Props> = ({
  agent4Data,
  agent1Data,
  agent3Data,
}) => {
  const isSimulation = !agent4Data?.analysis_mode || agent4Data.analysis_mode !== 'live_gee';

  const [activeProviderId, setActiveProviderId] = useState<string>('esri');
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side' | 'diff' | 'real-map'>('slider');
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showBufferOverlay, setShowBufferOverlay] = useState<boolean>(true);
  const [showEncroachmentOverlay, setShowEncroachmentOverlay] = useState<boolean>(true);
  const [showVegetationOverlay, setShowVegetationOverlay] = useState<boolean>(true);
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
  const changeAreaM2 = agent4Data?.change_area_m2 || 0;
  const changePct = agent4Data?.change_percentage || 0;
  const projectName = agent1Data?.project_name || 'Environmental Clearance Site';

  const activeProvider = SATELLITE_PROVIDERS.find(p => p.id === activeProviderId) || SATELLITE_PROVIDERS[0];

  // Derive tight georeferenced bounding box for composite image overlays
  const getImageBounds = (): L.LatLngBoundsExpression => {
    if (agent3Data?.bbox && agent3Data.bbox.length === 4) {
      const [minLon, minLat, maxLon, maxLat] = agent3Data.bbox;
      return [[minLat, minLon], [maxLat, maxLon]];
    }
    const degOffset = (bufferDist * 3) / 111320;
    return [
      [lat - degOffset, lon - degOffset],
      [lat + degOffset, lon + degOffset],
    ];
  };

  // Helper: Create custom pin marker
  const createSiteMarker = (mLat: number, mLon: number) => {
    const customIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="
          width: 28px; height: 28px; border-radius: 4px;
          background: #1C2A20; border: 2px solid #F1EEE3;
          display: flex; align-items: center; justify-content: center;
          color: #F1EEE3; font-weight: bold; font-size: 13px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        ">§</div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
    return L.marker([mLat, mLon], { icon: customIcon }).bindPopup(`
      <div style="font-family: var(--font-sans, sans-serif); color: #1C2A20; padding: 4px; max-width: 220px;">
        <strong style="font-size: 12px; display: block; margin-bottom: 2px;">${projectName}</strong>
        <span style="font-size: 10px; color: #4B5D50; font-family: monospace;">${mLat.toFixed(4)}°N, ${mLon.toFixed(4)}°E</span>
      </div>
    `);
  };

  // Helper: Add Waterbody OSM vector geometry
  const addWaterbodyLayer = (map: L.Map) => {
    if (agent3Data?.raw_geometry_geojson) {
      try {
        L.geoJSON(agent3Data.raw_geometry_geojson as any, {
          style: {
            color: '#3b82f6',
            weight: 2,
            fillColor: '#3b82f6',
            fillOpacity: 0.25,
          },
        })
          .bindTooltip(`Protected Waterbody: ${waterbodyName}`, { sticky: true })
          .addTo(map);
      } catch (e) {
        console.warn('Failed to add waterbody geometry:', e);
      }
    }
  };

  // Helper: Add statutory buffer boundary
  const addBufferZone = (map: L.Map) => {
    if (!showBufferOverlay) return;
    if (agent3Data?.buffered_geometry_geojson) {
      try {
        L.geoJSON(agent3Data.buffered_geometry_geojson as any, {
          style: {
            color: '#eab308',
            weight: 2,
            dashArray: '6, 6',
            fill: false,
          },
        })
          .bindTooltip(`Statutory ${bufferDist}m Setback Boundary (${waterbodyName})`, { sticky: true })
          .addTo(map);
        return;
      } catch (e) {
        console.warn('Failed to render buffered_geometry_geojson, falling back to circle', e);
      }
    }

    // Fallback circle if vector geometry missing
    L.circle([lat, lon], {
      radius: bufferDist * 1.5,
      color: '#eab308',
      weight: 2,
      dashArray: '6, 6',
      fill: false,
    })
      .bindTooltip(`Mandatory ${bufferDist}m Environmental Buffer Zone`, { sticky: true })
      .addTo(map);
  };

  // Helper: Add real vectorized change detection geometry
  const addDetectionLayers = (map: L.Map) => {
    if (!isSimulation && agent4Data) {
      // 1. Detected unauthorized built-up change polygons (NDBI delta)
      if (showEncroachmentOverlay && agent4Data.change_geometry_geojson) {
        try {
          const features = (agent4Data.change_geometry_geojson as any)?.features || [];
          if (features.length > 0) {
            L.geoJSON(agent4Data.change_geometry_geojson as any, {
              style: {
                color: '#ef4444',
                weight: 2,
                fillColor: '#ef4444',
                fillOpacity: 0.45,
              },
            })
              .bindPopup(`
                <div style="font-family: sans-serif; color: #1C2A20; padding: 4px;">
                  <strong style="color: #ef4444; font-size: 12px;">⚠ Unauthorized Built-up Alteration</strong>
                  <p style="font-size: 11px; margin: 4px 0 0 0; color: #334155;">
                    Sentinel-2 Detected Discrepancy: <b>${changeAreaM2.toLocaleString()} m²</b> (${changePct}%)
                  </p>
                  <p style="font-size: 10px; margin: 2px 0 0 0; color: #64748b;">
                    Vectorized inside ${bufferDist}m ${waterbodyName} corridor
                  </p>
                </div>
              `)
              .addTo(map);
          }
        } catch (e) {
          console.warn('Error adding change_geometry_geojson:', e);
        }
      }

      // 2. Detected vegetation/canopy loss polygons (NDVI delta)
      if (showVegetationOverlay && agent4Data.vegetation_loss_geojson) {
        try {
          const features = (agent4Data.vegetation_loss_geojson as any)?.features || [];
          if (features.length > 0) {
            L.geoJSON(agent4Data.vegetation_loss_geojson as any, {
              style: {
                color: '#f59e0b',
                weight: 2,
                fillColor: '#f59e0b',
                fillOpacity: 0.35,
              },
            })
              .bindTooltip('Sentinel-2 Canopy / Vegetation Loss (ΔNDVI > 0.20)', { sticky: true })
              .addTo(map);
          }
        } catch (e) {
          console.warn('Error adding vegetation_loss_geojson:', e);
        }
      }
    }
  };

  // 1. Initialize Dual-Layer Split Slider Maps
  useEffect(() => {
    if (viewMode !== 'slider' || !mapBottomRef.current || !mapTopRef.current) return;

    if (mapBottomInstance.current) { mapBottomInstance.current.remove(); mapBottomInstance.current = null; }
    if (mapTopInstance.current) { mapTopInstance.current.remove(); mapTopInstance.current = null; }

    try {
      const bounds = getImageBounds();

      // Bottom Map: Post-EC Satellite with True RGB Composite + Vector Overlays
      const mapBottom = L.map(mapBottomRef.current, {
        center: [lat, lon],
        zoom: currentZoom,
        zoomControl: false,
        attributionControl: false,
      });
      L.tileLayer(activeProvider.url, { maxZoom: activeProvider.maxZoom }).addTo(mapBottom);
      if (agent4Data?.post_ec_thumbnail_url && !isSimulation) {
        L.imageOverlay(agent4Data.post_ec_thumbnail_url, bounds, { opacity: 0.95 }).addTo(mapBottom);
      }
      createSiteMarker(lat, lon).addTo(mapBottom);
      addWaterbodyLayer(mapBottom);
      addBufferZone(mapBottom);
      addDetectionLayers(mapBottom);

      // Top Map: Pre-EC Baseline (True Pre-EC Sentinel-2 Composite)
      const mapTop = L.map(mapTopRef.current, {
        center: [lat, lon],
        zoom: currentZoom,
        zoomControl: false,
        attributionControl: false,
      });
      L.tileLayer(activeProvider.url, { maxZoom: activeProvider.maxZoom }).addTo(mapTop);
      if (agent4Data?.pre_ec_thumbnail_url && !isSimulation) {
        L.imageOverlay(agent4Data.pre_ec_thumbnail_url, bounds, { opacity: 0.95 }).addTo(mapTop);
      }
      createSiteMarker(lat, lon).addTo(mapTop);
      addWaterbodyLayer(mapTop);
      addBufferZone(mapTop);

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
  }, [viewMode, lat, lon, activeProviderId, showBufferOverlay, showEncroachmentOverlay, showVegetationOverlay, bufferDist, changeAreaM2, agent4Data]);

  // 2. Initialize Side-by-Side Synchronized Maps
  useEffect(() => {
    if (viewMode !== 'side-by-side' || !mapSideLeftRef.current || !mapSideRightRef.current) return;

    if (mapSideLeftInstance.current) { mapSideLeftInstance.current.remove(); mapSideLeftInstance.current = null; }
    if (mapSideRightInstance.current) { mapSideRightInstance.current.remove(); mapSideRightInstance.current = null; }

    try {
      const bounds = getImageBounds();

      // Left: Pre-EC Baseline
      const mapLeft = L.map(mapSideLeftRef.current, {
        center: [lat, lon],
        zoom: currentZoom,
        zoomControl: false,
        attributionControl: false,
      });
      L.tileLayer(activeProvider.url, { maxZoom: activeProvider.maxZoom }).addTo(mapLeft);
      if (agent4Data?.pre_ec_thumbnail_url && !isSimulation) {
        L.imageOverlay(agent4Data.pre_ec_thumbnail_url, bounds, { opacity: 0.95 }).addTo(mapLeft);
      }
      createSiteMarker(lat, lon).addTo(mapLeft);
      addWaterbodyLayer(mapLeft);
      addBufferZone(mapLeft);

      // Right: Post-EC Audit
      const mapRight = L.map(mapSideRightRef.current, {
        center: [lat, lon],
        zoom: currentZoom,
        zoomControl: false,
        attributionControl: false,
      });
      L.tileLayer(activeProvider.url, { maxZoom: activeProvider.maxZoom }).addTo(mapRight);
      if (agent4Data?.post_ec_thumbnail_url && !isSimulation) {
        L.imageOverlay(agent4Data.post_ec_thumbnail_url, bounds, { opacity: 0.95 }).addTo(mapRight);
      }
      createSiteMarker(lat, lon).addTo(mapRight);
      addWaterbodyLayer(mapRight);
      addBufferZone(mapRight);
      addDetectionLayers(mapRight);

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
  }, [viewMode, lat, lon, activeProviderId, showBufferOverlay, showEncroachmentOverlay, showVegetationOverlay, bufferDist, changeAreaM2, agent4Data]);

  // 3. Initialize Delta Heatmap Map
  useEffect(() => {
    if (viewMode !== 'diff' || !mapDiffRef.current) return;

    if (mapDiffInstance.current) { mapDiffInstance.current.remove(); mapDiffInstance.current = null; }

    try {
      const bounds = getImageBounds();
      const map = L.map(mapDiffRef.current, {
        center: [lat, lon],
        zoom: currentZoom,
        zoomControl: false,
        attributionControl: false,
      });
      L.tileLayer(activeProvider.url, { maxZoom: activeProvider.maxZoom }).addTo(map);

      // Add real GEE heatmap thumbnail if available
      if (agent4Data?.change_heatmap_url && !isSimulation) {
        L.imageOverlay(agent4Data.change_heatmap_url, bounds, { opacity: 0.85 }).addTo(map);
      }

      createSiteMarker(lat, lon).addTo(map);
      addWaterbodyLayer(map);
      addBufferZone(map);
      addDetectionLayers(map);

      mapDiffInstance.current = map;
    } catch (e) {
      console.warn('Heatmap map initialization:', e);
    }

    return () => {
      if (mapDiffInstance.current) { mapDiffInstance.current.remove(); mapDiffInstance.current = null; }
    };
  }, [viewMode, lat, lon, activeProviderId, showBufferOverlay, showEncroachmentOverlay, showVegetationOverlay, bufferDist, changeAreaM2, agent4Data]);

  // 4. Initialize 3D / Vector Interactive Map
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
      addWaterbodyLayer(map);
      addBufferZone(map);
      addDetectionLayers(map);

      mapInteractiveInstance.current = map;
    } catch (e) {
      console.warn('Interactive map initialization:', e);
    }

    return () => {
      if (mapInteractiveInstance.current) { mapInteractiveInstance.current.remove(); mapInteractiveInstance.current = null; }
    };
  }, [viewMode, lat, lon, activeProviderId, showBufferOverlay, showEncroachmentOverlay, showVegetationOverlay, bufferDist, changeAreaM2, agent4Data]);

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

  // Zoom control helpers
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

  const hasChangeGeometry = !!(agent4Data?.change_geometry_geojson && (agent4Data.change_geometry_geojson as any)?.features?.length > 0);
  const hasVegetationLoss = !!(agent4Data?.vegetation_loss_geojson && (agent4Data.vegetation_loss_geojson as any)?.features?.length > 0);

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
                <span className={`stamp-chip ${!isSimulation ? 'stamp-chip--confirmed' : 'stamp-chip--warning'}`} style={{ fontSize: '0.65rem' }}>
                  {!isSimulation ? 'LIVE GEE SENTINEL-2' : 'SIMULATION MODE'}
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
              { mode: 'real-map' as const, label: 'Vector Map', icon: MapIcon },
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
        <div className="horizontal-scroll-bar">
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
                The map displays georeferenced basemap tile imagery for the coordinates, but spectral delta indices reflect document metadata simulations. Live detection polygon vectorization is active only when live GEE credentials are used.
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
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
            <span>Detected Build-up</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showVegetationOverlay}
              onChange={e => setShowVegetationOverlay(e.target.checked)}
              style={{ accentColor: '#f59e0b' }}
            />
            <span>Vegetation Loss</span>
          </label>
        </div>
      </div>

      {/* ── Main Imagery / Map Canvas ── */}

      {/* 1. Real Satellite Split-Slider */}
      {viewMode === 'slider' && (
        <div
          ref={sliderContainerRef}
          className="map-canvas-container"
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

          {/* Statutory Map Legend */}
          <MapLegend
            bufferDist={bufferDist}
            waterbodyName={waterbodyName}
            analysisMode={agent4Data?.analysis_mode}
            hasChangeGeometry={hasChangeGeometry}
            hasVegetationLoss={hasVegetationLoss}
          />
        </div>
      )}

      {/* 2. Side-by-Side Synchronized Real Satellite Maps */}
      {viewMode === 'side-by-side' && (
        <div className="side-by-side-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', padding: '0 2px' }}>
              <span>PRE-EC BASELINE</span>
              <span style={{ color: 'var(--text-muted)' }}>{agent4Data?.pre_ec_date}</span>
            </div>
            <div className="side-by-side-map-item">
              <div ref={mapSideLeftRef} style={{ width: '100%', height: '100%' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--status-danger)', padding: '0 2px' }}>
              <span>POST-EC AUDIT</span>
              <span style={{ color: 'var(--text-muted)' }}>{agent4Data?.post_ec_date}</span>
            </div>
            <div className="side-by-side-map-item">
              <div ref={mapSideRightRef} style={{ width: '100%', height: '100%' }} />
              <MapLegend
                bufferDist={bufferDist}
                waterbodyName={waterbodyName}
                analysisMode={agent4Data?.analysis_mode}
                hasChangeGeometry={hasChangeGeometry}
                hasVegetationLoss={hasVegetationLoss}
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. Delta Spectral Heatmap Map */}
      {viewMode === 'diff' && (
        <div className="map-canvas-container">
          <div ref={mapDiffRef} style={{ width: '100%', height: '100%' }} />
          <MapLegend
            bufferDist={bufferDist}
            waterbodyName={waterbodyName}
            analysisMode={agent4Data?.analysis_mode}
            hasChangeGeometry={hasChangeGeometry}
            hasVegetationLoss={hasVegetationLoss}
          />
        </div>
      )}

      {/* 4. 3D / Vector Interactive Map */}
      {viewMode === 'real-map' && (
        <div className="map-canvas-container">
          <div ref={mapInteractiveRef} style={{ width: '100%', height: '100%' }} />

          <div style={{
            position: 'absolute', top: 12, right: 12, zIndex: 1000,
            padding: '6px 12px', borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-medium)',
            fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: 'var(--radius-full)', background: 'var(--text-primary)' }} />
            <span>Active Layer: <b style={{ color: 'var(--text-primary)' }}>{activeProvider.name}</b></span>
            <span style={{ color: 'var(--border-medium)' }}>|</span>
            <a
              href={`https://www.google.com/maps/@?api=1&map_action=map&center=${lat},${lon}&zoom=16&basemap=satellite`}
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: 3, textDecoration: 'underline' }}
            >
              <span>Google Aerial</span>
              <ExternalLink size={10} />
            </a>
          </div>

          <MapLegend
            bufferDist={bufferDist}
            waterbodyName={waterbodyName}
            analysisMode={agent4Data?.analysis_mode}
            hasChangeGeometry={hasChangeGeometry}
            hasVegetationLoss={hasVegetationLoss}
          />
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
            sub: `${changePct}% corridor alteration`,
          },
          {
            label: 'Sensor / Source',
            value: !isSimulation ? 'Sentinel-2 MSI' : 'Simulation Engine',
            color: 'var(--text-primary)',
            sub: !isSimulation ? 'Live Copernicus GEE' : 'Offline demo mode',
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
