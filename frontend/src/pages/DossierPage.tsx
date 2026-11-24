import React, { useState } from 'react';
import { Download, ArrowLeft, ExternalLink, AlertCircle, Scale } from 'lucide-react';
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
    <div style={{ animation: 'fadeInUp 0.35s ease both', maxWidth: 1100, margin: '0 auto' }}>
      {/* ── Top Header ── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
        gap: 16, borderBottom: '1px solid var(--border-medium)', paddingBottom: 20, marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={onBack}
            className="btn-secondary"
            style={{ padding: '8px 12px', gap: 6 }}
            title="Return to Review Overview"
          >
            <ArrowLeft size={14} />
            <span style={{ fontSize: '0.8rem' }}>Back</span>
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span className="folio-number">Official Legal Document</span>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.25rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <Scale size={20} style={{ color: 'var(--text-primary)' }} />
                Statutory Evidence Dossier
              </h2>
              <span className="stamp-chip stamp-chip--confirmed">
                SEALED &amp; VALIDATED
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 3, fontFamily: 'var(--font-mono)' }}>
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
            style={{ fontSize: '0.82rem', padding: '8px 14px', gap: 6 }}
          >
            <ExternalLink size={14} />
            <span>Open in New Tab</span>
          </a>

          <a
            href={downloadUrl}
            download={`GreenTrace_Dossier_${status.run_id}.pdf`}
            className="btn-primary"
            style={{ fontSize: '0.82rem', padding: '8px 16px', gap: 6 }}
          >
            <Download size={14} />
            <span>Download Signed PDF</span>
          </a>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Project / Clearance', value: a1?.project_name || status.filename, color: 'var(--text-primary)' },
          { label: 'File Number', value: a1?.file_number || 'N/A', color: 'var(--text-primary)', mono: true },
          { label: 'Discrepancy Area', value: a4?.change_area_m2 ? `${a4.change_area_m2.toLocaleString()} m²` : 'Ground Discrepancy Verified', color: a4?.change_area_m2 > 0 ? 'var(--status-danger)' : 'var(--status-success)', mono: true },
          { label: 'Attestation Status', value: '✓ Statutory Evidence Confirmed', color: 'var(--status-success)' },
        ].map(({ label, value, color, mono }) => (
          <div key={label} className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              {label}
            </div>
            <div style={{
              fontSize: '0.88rem', fontWeight: 700, color,
              fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* ── PDF Container ── */}
      <div style={{
        width: '100%', height: 'clamp(380px, 65vh, 800px)', borderRadius: 'var(--radius-md)',
        overflow: 'hidden', border: '1px solid var(--border-medium)',
        background: 'var(--bg-surface)', boxShadow: 'var(--shadow-md)',
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
            padding: 32, textAlign: 'center', background: 'var(--bg-surface)',
          }}>
            <AlertCircle size={48} style={{ color: 'var(--status-warning)', marginBottom: 16 }} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              PDF Viewer Preview
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: 420, marginBottom: 20, lineHeight: 1.6 }}>
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

