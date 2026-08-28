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
        background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: 12, color: 'var(--text-muted)' }}>§</div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Awaiting Paralegal Extraction</div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Statutory findings will appear once Folio I completes parsing.</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Summary Key Metrics (Ledger Table Form) ── */}
      {sf && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
          {[
            {
              icon: Building2, label: 'Altered Footprint', color: sf.discrepancy_detected ? 'var(--status-danger)' : 'var(--status-success)',
              value: sf.change_area_m2 > 0 ? `${sf.change_area_m2.toLocaleString()} m²` : '0 m²',
              sub: sf.change_percentage > 0 ? `${sf.change_percentage.toFixed(1)}% of corridor` : 'Zero buffer alteration',
            },
            {
              icon: Waves, label: 'Monitored Buffer Corridor', color: 'var(--text-primary)',
              value: sf.buffer_total_m2 > 0 ? `${sf.buffer_total_m2.toLocaleString()} m²` : '—',
              sub: a3?.buffer_distance_meters ? `${a3.buffer_distance_meters}m statutory setback` : 'Hydrology setback',
            },
            {
              icon: ShieldCheck, label: 'Registry Verification', color: sf.parivesh_status === 'verified_active' ? 'var(--status-success)' : 'var(--status-warning)',
              value: sf.parivesh_status?.replace(/_/g, ' ').toUpperCase() ?? '—',
              sub: sf.file_number ?? 'File identification',
            },
            {
              icon: TrendingUp, label: 'Compliance Status', color: sf.discrepancy_detected ? 'var(--status-danger)' : 'var(--status-success)',
              value: sf.discrepancy_detected ? 'DISCREPANCY DETECTED' : 'CLEARED / COMPLIANT',
              sub: 'Multi-spectral NDBI verification',
            },
          ].map(({ icon: Icon, label, color, value, sub }) => (
            <div key={label} className="card" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-medium)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={13} style={{ color: 'var(--text-primary)' }} />
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {label}
                </span>
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color, fontFamily: 'var(--font-mono)', marginBottom: 2 }}>{value}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Project Particulars Metadata Table ── */}
      {a1 && (
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="folio-number">Folio II.A · Project Particulars</span>
            <span className="stamp-chip stamp-chip--pending" style={{ fontSize: '0.62rem' }}>
              Method: {a1.extraction_method || 'LLM'}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            {[
              { label: 'Project Name',   value: a1.project_name },
              { label: 'File Number',    value: a1.file_number, mono: true },
              { label: 'Approval Date',  value: a1.ec_approval_date, mono: true },
              { label: 'Site Coordinates', value: a1.primary_coordinate ? `${a1.primary_coordinate[0]?.toFixed(4)}°N, ${a1.primary_coordinate[1]?.toFixed(4)}°E` : '—', mono: true, copyFn: copyCoords, copied: copiedCoord },
            ].map(({ label, value, mono, copyFn, copied }) => (
              <div key={label}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)',
                  fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
                }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value || '—'}</span>
                  {copyFn && (
                    <button
                      onClick={copyFn}
                      className="btn-ghost"
                      style={{ padding: '2px 4px' }}
                      title="Copy Coordinates"
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

      {/* ── Extracted EC Conditions ── */}
      {conditions.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
            <span className="folio-number">
              Folio II.B · Mandated Statutory Conditions ({conditions.length})
            </span>
            <div style={{ display: 'flex', gap: 2, background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)', padding: 2, border: '1px solid var(--border-medium)' }}>
              {([['all', 'All'], ['spatial', 'Spatial'], ['qualitative', 'Qualitative']] as const).map(([val, lbl]) => (
                <button
                  key={val}
                  onClick={() => setFilter(val)}
                  style={{
                    padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.72rem',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: filter === val ? 700 : 500,
                    border: '1px solid',
                    borderColor: filter === val ? 'var(--border-focus)' : 'transparent',
                    cursor: 'pointer',
                    background: filter === val ? 'var(--bg-surface)' : 'transparent',
                    color: filter === val ? 'var(--text-primary)' : 'var(--text-secondary)',
                    transition: 'all 0.15s',
                  }}
                >{lbl}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(cond => {
              const isSpatial = cond.condition_type === 'quantitative_spatial';
              return (
                <div
                  key={cond.condition_id}
                  className="card"
                  style={{
                    padding: '14px 16px',
                    borderLeft: isSpatial ? '3px solid var(--text-primary)' : '3px solid var(--border-medium)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`stamp-chip ${isSpatial ? 'stamp-chip--warning' : 'stamp-chip--pending'}`} style={{ fontSize: '0.62rem' }}>
                        {isSpatial ? 'QUANTITATIVE SPATIAL' : 'QUALITATIVE DIRECTIVE'}
                      </span>
                      <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {cond.condition_id}
                      </span>
                    </div>
                    {isSpatial && cond.buffer_distance_meters && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                        <MapPin size={12} style={{ color: 'var(--text-primary)' }} />
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                          {cond.buffer_distance_meters}m Setback ({cond.waterbody_target})
                        </span>
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{cond.text}</p>
                  {cond.mandate_summary && (
                    <p style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', fontFamily: 'var(--font-sans)' }}>
                      ↳ Mandate Summary: {cond.mandate_summary}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Geospatial Hydrology Verification ── */}
      {a3 && (
        <div className="card" style={{ padding: '16px 18px' }}>
          <div style={{ marginBottom: 12 }}>
            <span className="folio-number">Folio III.A · Vector Hydrology Geometry</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {[
              { label: 'Waterbody', value: a3.waterbody_name || a3.waterbody_type || 'N/A' },
              { label: 'OSM Elements', value: a3.osm_elements_count ?? '—' },
              { label: 'UTM Zone', value: a3.utm_zone || '—', mono: true },
              { label: 'Buffer Applied', value: a3.buffer_distance_meters ? `${a3.buffer_distance_meters}m` : '—', mono: true },
              { label: 'Ground Truth Geometry', value: a3.waterbody_found ? '✓ Verified OSM Vector' : '⚠ Proxy Layout' },
            ].map(({ label, value, mono }) => (
              <div key={label} style={{ minWidth: 120 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                <div style={{
                  fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)',
                  fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
                }}>{String(value)}</div>
              </div>
            ))}
          </div>
          {a3.notes && (
            <p style={{ marginTop: 10, fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', borderTop: '1px solid var(--border-subtle)', paddingTop: 8 }}>
              {a3.notes}
            </p>
          )}
        </div>
      )}

      {/* Security alert for suspicious directives */}
      {a1?.suspicious_directives?.length > 0 && (
        <div style={{
          padding: '14px 16px', borderRadius: 'var(--radius-sm)',
          background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger)',
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <AlertTriangle size={15} style={{ color: 'var(--status-danger)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--status-danger)', marginBottom: 4 }}>⚠ Security Flag: Adversarial Prompt-Injection Detected</div>
            {a1.suspicious_directives.map((d: string, i: number) => (
              <div key={i} style={{ fontSize: '0.75rem', color: 'var(--status-danger)', fontFamily: 'var(--font-mono)', lineHeight: 1.6 }}>"{d}"</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

