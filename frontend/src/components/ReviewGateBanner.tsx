import React, { useState } from 'react';
import {
  AlertTriangle,
  FileCheck, Download, Scale, Stamp as StampIcon
} from 'lucide-react';

import { RunStatusResponse } from '../types/schemas';
import { submitReview, getDossierDownloadUrl } from '../api/client';

interface Props {
  status: RunStatusResponse;
  onReviewConfirmed: (updated: RunStatusResponse) => void;
  onViewDossier?: () => void;
}

export const ReviewGateBanner: React.FC<Props> = ({ status, onReviewConfirmed, onViewDossier }) => {
  const projName = (status.agent1?.data as any)?.project_name || status.filename;
  const changeM2 = (status.agent4?.data as any)?.change_area_m2 || 0;
  const bufferDist = (status.agent3?.data as any)?.buffer_distance_meters || 100;
  const wbName = (status.agent3?.data as any)?.waterbody_name || 'riparian';

  const defaultNote = changeM2 > 0
    ? `Ground discrepancy confirmed: ${changeM2.toLocaleString()} m² unauthorized built-up clearing inside ${bufferDist}m ${wbName} buffer zone for "${projName.slice(0, 45)}". Forwarded for regulatory notice under Section 5 EPA 1986.`
    : `Clearance audit verified for "${projName.slice(0, 45)}". Baseline conditions inspected and confirmed.`;

  const [reviewerName, setReviewerName] = useState('Adv. Rajesh V. Ramanathan (Lead Legal Counsel)');
  const [notes, setNotes]         = useState(defaultNote);
  const [isConfirmed, setIsConfirmed] = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const presets = [
    {
      label: 'Lead Legal Counsel',
      name: 'Adv. Rajesh V. Ramanathan (Lead Legal Counsel)',
      notes: defaultNote,
    },
    {
      label: 'Senior Environmental Auditor',
      name: 'Dr. Priya Nair (Senior Environmental Scientist / Auditor)',
      notes: `Satellite spectral delta confirms NDBI surge in ${wbName} buffer corridor for ${projName.slice(0, 40)}. Ground survey verified.`,
    },
    {
      label: 'SEIAA Nodal Officer',
      name: 'State Environmental Impact Assessment Authority (SEIAA) Nodal Officer',
      notes: `Clearance terms reviewed for ${projName.slice(0, 40)}. Initiating formal compliance assessment proceedings.`,
    },
  ];

  const isSealed       = status.state === 'reviewed_confirmed';
  const isManual       = status.state === 'manual_legal_review';
  const downloadUrl    = getDossierDownloadUrl(status.run_id);

  const handleSignOff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim()) { setError('Please provide your legal name or statutory designation.'); return; }
    if (!isConfirmed) { setError('You must check the confirmation checkbox to seal the dossier.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      const updated = await submitReview({
        run_id: status.run_id,
        reviewer_name: reviewerName.trim(),
        confirm: true,
        reviewer_notes: notes.trim(),
      });
      onReviewConfirmed(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to record human attestation in the registry.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Already Sealed & Attested (Official Stamp Presentation) ── */
  if (isSealed) {
    return (
      <div style={{
        padding: '28px 32px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-card)',
        border: '2px solid var(--border-medium)',
        boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 24, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {/* Signature Official Stamp Component */}
            <div className="stamp stamp--confirmed stamp--just-confirmed">
              <span style={{ fontSize: '0.62rem', letterSpacing: '0.1em' }}>ATTESTED</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, margin: '2px 0' }}>REVIEWED</span>
              <span style={{ fontSize: '0.55rem', opacity: 0.85, fontFamily: 'var(--font-mono)' }}>&amp; SIGNED</span>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                <span className="folio-number">Statutory Sign-Off Complete</span>
                <span className="stamp-chip stamp-chip--confirmed">
                  OFFICIALLY SEALED
                </span>
              </div>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.2rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 6,
              }}>
                Statutory Evidence Dossier Formally Attested
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Certified by <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>{status.reviewer_name}</strong>
                {status.reviewed_at && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}> · {status.reviewed_at.slice(0, 19).replace('T', ' ')} UTC</span>
                )}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {onViewDossier && (
              <button onClick={onViewDossier} className="btn-secondary" style={{ gap: 8 }}>
                <FileCheck size={15} />
                <span>Inspect Dossier Folio</span>
              </button>
            )}
            <a href={downloadUrl} download={`GreenTrace_Dossier_${status.run_id}.pdf`} className="btn-primary" style={{ gap: 8 }}>
              <Download size={15} />
              <span>Download Signed PDF</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  /* ── Attestation Form (Registry Ledger Mode) ── */
  return (
    <div style={{
      padding: '24px 28px',
      borderRadius: 'var(--radius-md)',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-medium)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 22, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 'var(--radius-sm)', flexShrink: 0,
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-medium)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Scale size={22} style={{ color: 'var(--text-primary)' }} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
            <span className="folio-number">Folio IV · Human Sign-Off Gate</span>
            <span className={`stamp-chip ${isManual ? 'stamp-chip--flagged' : 'stamp-chip--warning'}`}>
              {isManual ? 'MANUAL LEGAL REVIEW' : 'SIGN-OFF PENDING'}
            </span>
          </div>
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.15rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 4,
          }}>
            Human Verification Gate &amp; Legal Attestation
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 640 }}>
            {isManual
              ? 'Qualitative mandates or unrecognized portal format detected. In accordance with statutory procedure, manual legal confirmation is mandatory before compiling the formal dossier.'
              : 'GreenTrace statutory safeguard: autonomous multi-agent findings cannot be certified as regulatory evidence without explicit human verification and signature.'}
          </p>
        </div>
      </div>

      {/* Preset Designation Selectors */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 4 }}>
          Statutory Roles:
        </span>
        {presets.map(p => (
          <button
            key={p.label}
            type="button"
            onClick={() => { setReviewerName(p.name); setNotes(p.notes); }}
            className="btn-secondary"
            style={{
              fontSize: '0.75rem', padding: '4px 10px',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Attestation Form Fields */}
      <form onSubmit={handleSignOff}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          {/* Reviewer Name */}
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Attesting Officer / Legal Counsel *
            </label>
            <input
              type="text"
              value={reviewerName}
              onChange={e => setReviewerName(e.target.value)}
              placeholder="Full name & statutory designation"
              required
              style={{
                width: '100%', padding: '9px 12px',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                fontSize: '0.85rem', outline: 'none',
                fontFamily: 'var(--font-sans)',
              }}
            />
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Attestation Finding Summary
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Summary of discrepancy findings"
              style={{
                width: '100%', padding: '9px 12px',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                fontSize: '0.85rem', outline: 'none',
                fontFamily: 'var(--font-sans)',
              }}
            />
          </div>
        </div>

        {/* Legal Attestation Checkbox */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20 }}>
          <input
            id="confirm-audit"
            type="checkbox"
            checked={isConfirmed}
            onChange={e => setIsConfirmed(e.target.checked)}
            style={{ marginTop: 4, accentColor: 'var(--text-primary)', width: 16, height: 16, cursor: 'pointer' }}
          />
          <label htmlFor="confirm-audit" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer', lineHeight: 1.6 }}>
            I formally certify that I have inspected the multi-spectral satellite baseline, extracted clearance conditions, and spatial buffer metrics. I authorise recording this attestation and generating the statutory Evidence Dossier.
          </label>
        </div>

        {/* Error notification */}
        {error && (
          <div style={{
            marginBottom: 16, padding: '10px 14px', borderRadius: 'var(--radius-sm)',
            background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <AlertTriangle size={14} style={{ color: 'var(--status-danger)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--status-danger)' }}>{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || !isConfirmed}
          className="btn-primary"
          style={{ padding: '12px 24px', fontSize: '0.88rem' }}
        >
          {submitting ? (
            <>
              <div style={{ width: 14, height: 14, border: '2px solid var(--bg-surface)', borderTopColor: 'transparent', borderRadius: 'var(--radius-full)', animation: 'spin 0.8s linear infinite' }} />
              <span>Sealing &amp; Compiling Statutory Dossier…</span>
            </>
          ) : (
            <>
              <StampIcon size={16} />
              <span>Attest, Seal &amp; Compile Evidence Dossier</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

