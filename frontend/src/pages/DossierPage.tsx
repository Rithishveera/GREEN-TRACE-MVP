import React, { useState } from 'react';
import { Download, ArrowLeft, ShieldCheck, ExternalLink, AlertCircle } from 'lucide-react';
import { getDossierDownloadUrl } from '../api/client';

import { RunStatusResponse } from '../types/schemas';

interface Props {
  status: RunStatusResponse;
  onBack: () => void;
}

export const DossierPage: React.FC<Props> = ({ status, onBack }) => {
  const downloadUrl = getDossierDownloadUrl(status.run_id);
  const [iframeError, setIframeError] = useState(false);

  const a1 = status.agent1?.data as any;
  const a4 = status.agent4?.data as any;

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease both', maxWidth: 1100, margin: '0 auto' }}>
      {/* ── Top Header ── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
        gap: 16, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 20, marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={onBack}
            style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#94a3b8', transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(30,41,59,1)';
              (e.currentTarget as HTMLButtonElement).style.color = '#e2e8f0';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(30,41,59,0.8)';
              (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8';
            }}
            title="Return to Review Overview"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={20} style={{ color: '#10b981' }} />
                Statutory Evidence Dossier
              </h2>
              <span style={{
                fontSize: '0.65rem', fontWeight: 800, padding: '3px 9px', borderRadius: 99,
                background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)',
                letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                Sealed & Validated
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 3, fontFamily: 'JetBrains Mono, monospace' }}>
              Run ID: {status.run_id} · Attested by {status.reviewer_name || 'Auditor'} · {status.reviewed_at?.slice(0, 19).replace('T', ' ')} UTC
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <a
            href={downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
            style={{ fontSize: '0.82rem', padding: '8px 14px' }}
          >
            <ExternalLink size={14} />
            <span>Open in New Tab</span>
          </a>

          <a
            href={downloadUrl}
            download={`GreenTrace_Dossier_${status.run_id}.pdf`}
            className="btn-primary"
            style={{ fontSize: '0.82rem', padding: '8px 16px' }}
          >
            <Download size={14} />
            <span>Download PDF Dossier</span>
          </a>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Project / Clearance', value: a1?.project_name || status.filename, color: '#e2e8f0' },
          { label: 'File Number', value: a1?.file_number || 'N/A', color: '#10b981', mono: true },
          { label: 'Discrepancy Area', value: a4?.change_area_m2 ? `${a4.change_area_m2.toLocaleString()} m²` : 'Ground Discrepancy Verified', color: '#ef4444', mono: true },
          { label: 'Sign-off Status', value: '✓ Legal Evidence Ready', color: '#34d399' },
        ].map(({ label, value, color, mono }) => (
          <div key={label} style={{
            padding: '14px 16px', borderRadius: 12,
            background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ fontSize: '0.68rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              {label}
            </div>
            <div style={{
              fontSize: '0.88rem', fontWeight: 700, color,
              fontFamily: mono ? 'JetBrains Mono, monospace' : undefined,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* ── PDF Container ── */}
      <div style={{
        width: '100%', height: '800px', borderRadius: 16,
        overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)',
        background: '#040812', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        position: 'relative',
      }}>
        <iframe
          src={downloadUrl}
          title="GreenTrace Statutory Evidence Dossier"
          style={{ width: '100%', height: '100%', border: 'none' }}
          onError={() => setIframeError(true)}
        />
        {iframeError && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: 32, textAlign: 'center', background: '#040812',
          }}>
            <AlertCircle size={48} style={{ color: '#f59e0b', marginBottom: 16 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f1f5f9', marginBottom: 8 }}>
              PDF Viewer Preview
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: 420, marginBottom: 20, lineHeight: 1.6 }}>
              Your browser may block embedded PDF rendering. You can download or view the compiled legal evidence dossier directly:
            </p>
            <a
              href={downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-primary"
            >
              <Download size={16} />
              <span>Download PDF Evidence Dossier</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
