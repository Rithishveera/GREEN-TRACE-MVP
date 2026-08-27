import React, { useState } from 'react';
import {
  MapPin, ShieldCheck, Waves, Copy, Check, AlertTriangle,
  Building2, TrendingUp
} from 'lucide-react';

import { RunStatusResponse, ECCondition } from '../types/schemas';

interface Props { status: RunStatusResponse; }

export const FindingsPanel: React.FC<Props> = ({ status }) => {
  const [filter, setFilter]     = useState<'all' | 'spatial' | 'qualitative'>('all');
  const [copiedCoord, setCopiedCoord] = useState(false);

  const a1  = status.agent1?.data as any;
  const a3  = status.agent3?.data as any;
  const a4  = status.agent4?.data as any;
  const sf  = status.summary_findings;

  const conditions: ECCondition[] = a1?.conditions ?? [];
  const filtered = filter === 'all' ? conditions
    : filter === 'spatial' ? conditions.filter(c => c.condition_type === 'quantitative_spatial')
    : conditions.filter(c => c.condition_type === 'qualitative');

  const copyCoords = () => {
    const coord = a1?.primary_coordinate;
    if (coord) {
      navigator.clipboard.writeText(`${coord[0]}, ${coord[1]}`);
      setCopiedCoord(true);
      setTimeout(() => setCopiedCoord(false), 1500);
    }
  };

  if (!a1 && !a4) {
    return (
      <div style={{
        padding: '60px 24px', textAlign: 'center',
        background: 'rgba(15,23,42,0.5)', borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ fontSize: '2rem', marginBottom: 14 }}>📋</div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>Awaiting Agent Results</div>
        <div style={{ fontSize: '0.85rem', color: '#1e293b' }}>Findings will appear once Agent 1 (Paralegal Extraction) completes.</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Summary metrics ── */}
      {sf && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {[
            {
              icon: Building2, label: 'Change Area', color: sf.discrepancy_detected ? '#ef4444' : '#10b981',
              value: sf.change_area_m2 > 0 ? `${sf.change_area_m2.toLocaleString()} m²` : '—',
              sub: sf.change_percentage > 0 ? `${sf.change_percentage.toFixed(1)}% of buffer` : 'No change detected',
            },
            {
              icon: Waves, label: 'Buffer Zone', color: '#3b82f6',
              value: sf.buffer_total_m2 > 0 ? `${sf.buffer_total_m2.toLocaleString()} m²` : '—',
              sub: a3?.buffer_distance_meters ? `${a3.buffer_distance_meters}m radius` : 'Buffer area',
            },
            {
              icon: ShieldCheck, label: 'Parivesh Status', color: sf.parivesh_status === 'verified_active' ? '#10b981' : '#f59e0b',
              value: sf.parivesh_status?.replace(/_/g, ' ') ?? '—',
              sub: sf.file_number ?? 'File number',
            },
            {
              icon: TrendingUp, label: 'Discrepancy', color: sf.discrepancy_detected ? '#ef4444' : '#10b981',
              value: sf.discrepancy_detected ? 'DETECTED' : 'Not Found',
              sub: 'NDBI delta analysis',
            },
          ].map(({ icon: Icon, label, color, value, sub }) => (
            <div key={label} style={{
              padding: '16px 18px', borderRadius: 14,
              background: 'rgba(15,23,42,0.8)',
              border: `1px solid ${color}18`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: `${color}12`, border: `1px solid ${color}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={14} style={{ color }} />
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {label}
                </span>
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color, lineHeight: 1.2, marginBottom: 4 }}>{value}</div>
              <div style={{ fontSize: '0.72rem', color: '#334155' }}>{sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Project metadata ── */}
      {a1 && (
        <div style={{
          padding: '18px 20px', borderRadius: 14,
          background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 14 }}>
            Project Metadata
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {[
              { label: 'Project Name',   value: a1.project_name },
              { label: 'File Number',    value: a1.file_number, mono: true },
              { label: 'EC Approval',    value: a1.ec_approval_date },
              { label: 'Coordinates',    value: a1.primary_coordinate ? `${a1.primary_coordinate[0]?.toFixed(4)}°N, ${a1.primary_coordinate[1]?.toFixed(4)}°E` : '—', copyFn: copyCoords, copied: copiedCoord },
            ].map(({ label, value, mono, copyFn, copied }) => (
              <div key={label}>
                <div style={{ fontSize: '0.7rem', color: '#334155', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0',
                  fontFamily: mono ? 'JetBrains Mono, monospace' : undefined,
                }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value || '—'}</span>
                  {copyFn && (
                    <button
                      onClick={copyFn}
                      style={{ color: copied ? '#10b981' : '#475569', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}
                    >
                      {copied ? <Check size={11} /> : <Copy size={11} />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── EC Conditions ── */}
      {conditions.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              EC Conditions ({conditions.length})
            </div>
            <div style={{ display: 'flex', gap: 4, background: 'rgba(15,23,42,0.6)', borderRadius: 8, padding: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
              {([['all', 'All'], ['spatial', 'Spatial'], ['qualitative', 'Qualitative']] as const).map(([val, lbl]) => (
                <button
                  key={val}
                  onClick={() => setFilter(val)}
                  style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600,
                    border: 'none', cursor: 'pointer',
                    background: filter === val ? 'rgba(16,185,129,0.12)' : 'transparent',
                    color: filter === val ? '#10b981' : '#64748b',
                    transition: 'all 0.15s',
                  }}
                >{lbl}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(cond => {
              const isSpatial = cond.condition_type === 'quantitative_spatial';
              const color = isSpatial ? '#3b82f6' : '#8b5cf6';
              return (
                <div
                  key={cond.condition_id}
                  style={{
                    padding: '14px 16px', borderRadius: 12,
                    background: 'rgba(15,23,42,0.8)',
                    border: `1px solid ${color}18`,
                    borderLeft: `3px solid ${color}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.06em',
                        textTransform: 'uppercase', padding: '2px 8px', borderRadius: 99,
                        color, background: `${color}12`, border: `1px solid ${color}25`,
                      }}>
                        {isSpatial ? 'Spatial Buffer' : 'Qualitative'}
                      </span>
                      <span style={{ fontSize: '0.7rem', fontFamily: 'JetBrains Mono, monospace', color: '#475569' }}>
                        {cond.condition_id}
                      </span>
                    </div>
                    {isSpatial && cond.buffer_distance_meters && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                        <MapPin size={11} style={{ color: '#3b82f6' }} />
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#3b82f6' }}>
                          {cond.buffer_distance_meters}m from {cond.waterbody_target}
                        </span>
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.65 }}>{cond.text}</p>
                  {cond.mandate_summary && (
                    <p style={{ marginTop: 8, fontSize: '0.75rem', color: '#475569', fontStyle: 'italic' }}>
                      ↳ {cond.mandate_summary}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Geospatial result ── */}
      {a3 && (
        <div style={{
          padding: '16px 18px', borderRadius: 14,
          background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(245,158,11,0.15)',
        }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>
            Geospatial Buffer Analysis
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {[
              { label: 'Waterbody', value: a3.waterbody_name || a3.waterbody_type || 'N/A' },
              { label: 'OSM Elements', value: a3.osm_elements_count ?? '—' },
              { label: 'UTM Zone', value: a3.utm_zone || '—', mono: true },
              { label: 'Buffer', value: a3.buffer_distance_meters ? `${a3.buffer_distance_meters}m` : '—' },
              { label: 'Ground Truth', value: a3.waterbody_found ? '✓ OSM Geometry' : '⚠ Synthetic' },
            ].map(({ label, value, mono }) => (
              <div key={label} style={{ minWidth: 120 }}>
                <div style={{ fontSize: '0.68rem', color: '#334155', marginBottom: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                <div style={{
                  fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0',
                  fontFamily: mono ? 'JetBrains Mono, monospace' : undefined,
                }}>{String(value)}</div>
              </div>
            ))}
          </div>
          {a3.notes && (
            <p style={{ marginTop: 12, fontSize: '0.75rem', color: '#475569', fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10 }}>
              {a3.notes}
            </p>
          )}
        </div>
      )}

      {/* Suspicious directives warning */}
      {a1?.suspicious_directives?.length > 0 && (
        <div style={{
          padding: '14px 16px', borderRadius: 12,
          background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <AlertTriangle size={15} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>⚠ Security Alert: Prompt-Injection Detected</div>
            {a1.suspicious_directives.map((d: string, i: number) => (
              <div key={i} style={{ fontSize: '0.75rem', color: '#fca5a5', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.6 }}>"{d}"</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
