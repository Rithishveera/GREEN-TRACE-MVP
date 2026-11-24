import React from 'react';
import { MapPin, Layers, AlertTriangle } from 'lucide-react';

interface MapLegendProps {
  bufferDist?: number;
  waterbodyName?: string;
  analysisMode?: 'live_gee' | 'offline_demo_simulation';
  hasChangeGeometry?: boolean;
  hasVegetationLoss?: boolean;
}

export const MapLegend: React.FC<MapLegendProps> = ({
  bufferDist = 100,
  waterbodyName = 'Waterbody',
  analysisMode = 'live_gee',
  hasChangeGeometry = false,
  hasVegetationLoss = false,
}) => {
  const isLive = analysisMode === 'live_gee';

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 14,
        left: 14,
        zIndex: 1000,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-sm)',
        padding: '10px 14px',
        boxShadow: 'var(--shadow-md)',
        maxWidth: 320,
        fontSize: '0.72rem',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-sans)',
        pointerEvents: 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <Layers size={13} style={{ color: 'var(--text-primary)' }} />
          <span>Statutory Legend</span>
        </div>
        <span
          className={`stamp-chip ${isLive ? 'stamp-chip--confirmed' : 'stamp-chip--warning'}`}
          style={{ fontSize: '0.58rem', padding: '1px 6px' }}
        >
          {isLive ? 'LIVE SENTINEL-2' : 'SIMULATION MODE'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Site Center Pin */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapPin size={13} style={{ color: 'var(--status-danger)' }} />
          </div>
          <span>Site Center GPS Coordinates</span>
        </div>

        {/* Protected Buffer Zone */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 16,
              height: 0,
              borderTop: '2px dashed #eab308',
            }}
          />
          <span>
            {bufferDist}m Statutory Setback ({waterbodyName})
          </span>
        </div>

        {/* Waterbody Corridor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 16,
              height: 10,
              background: 'rgba(59, 130, 246, 0.25)',
              border: '1px solid #3b82f6',
              borderRadius: 2,
            }}
          />
          <span>Protected Waterbody Geometry (OSM)</span>
        </div>

        {/* Detected Build-up Alteration */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 16,
              height: 10,
              background: isLive ? 'rgba(239, 68, 68, 0.35)' : 'transparent',
              border: `1px solid ${isLive ? '#ef4444' : 'var(--border-subtle)'}`,
              borderRadius: 2,
            }}
          />
          <span>
            {isLive ? (
              hasChangeGeometry ? 'Unauthorized Build-up (NDBI Delta > 0.15)' : 'No Build-up Discrepancy Detected'
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>Build-up Detection (Live Mode Only)</span>
            )}
          </span>
        </div>

        {/* Vegetation Loss */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 16,
              height: 10,
              background: isLive ? 'rgba(245, 158, 11, 0.3)' : 'transparent',
              border: `1px solid ${isLive ? '#f59e0b' : 'var(--border-subtle)'}`,
              borderRadius: 2,
            }}
          />
          <span>
            {isLive ? (
              hasVegetationLoss ? 'Vegetation Loss (NDVI Delta > 0.20)' : 'No Significant Canopy Loss'
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>Canopy Loss (Live Mode Only)</span>
            )}
          </span>
        </div>

        {!isLive && (
          <div style={{ marginTop: 4, paddingTop: 4, borderTop: '1px solid var(--border-subtle)', color: 'var(--status-warning)', fontSize: '0.66rem', display: 'flex', alignItems: 'center', gap: 5 }}>
            <AlertTriangle size={11} style={{ flexShrink: 0 }} />
            <span>Offline simulation — no live vector geometry generated.</span>
          </div>
        )}
      </div>
    </div>
  );
};
