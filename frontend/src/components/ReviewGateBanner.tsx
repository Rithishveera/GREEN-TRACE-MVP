import React, { useState } from 'react';
import {
  ShieldAlert, CheckCircle2, UserCheck, AlertTriangle,
  FileCheck, Award, Scale
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
      label: 'Legal Counsel',
      name: 'Adv. Rajesh V. Ramanathan (Lead Legal Counsel)',
      notes: defaultNote,
    },
    {
      label: 'Environmental Scientist',
      name: 'Dr. Priya Nair (Senior Environmental Scientist / Auditor)',
      notes: `Satellite spectral delta confirms NDBI surge in ${wbName} buffer corridor for ${projName.slice(0, 40)}. Ground survey verified.`,
    },
    {
      label: 'SEIAA Officer',
      name: 'State Environmental Impact Assessment Authority (SEIAA) Nodal Officer',
      notes: `Clearance terms reviewed for ${projName.slice(0, 40)}. Initiating formal compliance assessment proceedings.`,
    },
  ];


  const isSealed       = status.state === 'reviewed_confirmed';
  const isManual       = status.state === 'manual_legal_review';
  const downloadUrl    = getDossierDownloadUrl(status.run_id);

  const handleSignOff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim()) { setError('Please provide your name or designation.'); return; }
    if (!isConfirmed) { setError('You must check the confirmation box to proceed.'); return; }
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
      setError(err.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Already sealed ── */
  if (isSealed) {
    return (
      <div style={{
        padding: '24px 26px', borderRadius: 18,
        background: 'rgba(16,185,129,0.06)',
        border: '1px solid rgba(16,185,129,0.2)',
        boxShadow: '0 0 40px rgba(16,185,129,0.06)',
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircle2 size={24} style={{ color: '#10b981' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>Audit Reviewed & Formally Sealed</h3>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '3px 10px', borderRadius: 99, background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Tamper-Sealed
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6 }}>
                Attested by <strong style={{ color: '#e2e8f0' }}>{status.reviewer_name}</strong>
                {status.reviewed_at && (
                  <span style={{ color: '#475569' }}> on {status.reviewed_at.slice(0, 10)}</span>
                )}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {onViewDossier && (
              <button onClick={onViewDossier} className="btn-secondary" style={{ borderColor: 'rgba(16,185,129,0.25)', color: '#34d399' }}>
                <FileCheck size={15} style={{ color: '#10b981' }} />
                Inspect Dossier
              </button>
            )}
            <a href={downloadUrl} download={`GreenTrace_Dossier_${status.run_id}.pdf`} className="btn-primary">
              <Award size={15} />
              Download PDF Dossier
            </a>
          </div>
        </div>
      </div>
    );
  }

  /* ── Review form ── */
  const headerColor = isManual ? '#f59e0b' : '#3b82f6';
  const HeaderIcon  = isManual ? Scale : ShieldAlert;

  return (
    <div style={{
      padding: '24px 26px', borderRadius: 18,
      background: `rgba(${isManual ? '245,158,11' : '59,130,246'},0.04)`,
      border: `1px solid rgba(${isManual ? '245,158,11' : '59,130,246'},0.18)`,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 22 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14, flexShrink: 0,
          background: `rgba(${isManual ? '245,158,11' : '59,130,246'},0.1)`,
          border: `1px solid rgba(${isManual ? '245,158,11' : '59,130,246'},0.25)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <HeaderIcon size={22} style={{ color: headerColor }} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f1f5f9' }}>
              Human Review Gate
            </h3>
            <span style={{
              fontSize: '0.65rem', fontWeight: 800, padding: '3px 10px', borderRadius: 99,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              color: headerColor,
              background: `rgba(${isManual ? '245,158,11' : '59,130,246'},0.1)`,
              border: `1px solid rgba(${isManual ? '245,158,11' : '59,130,246'},0.25)`,
            }}>
              {isManual ? 'Manual Legal Review' : 'Auditor Sign-Off'}
            </span>
          </div>
          <p style={{ fontSize: '0.83rem', color: '#64748b', lineHeight: 1.65, maxWidth: 580 }}>
            {isManual
              ? 'Qualitative conditions or portal discrepancies detected. Review the extracted mandates and confirm findings before generating the legal dossier.'
              : 'GreenTrace architectural safeguard: multi-agent AI evidence cannot be treated as statutory evidence without explicit human sign-off. Review and confirm below.'}
          </p>
        </div>
      </div>

      {/* Preset buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600, alignSelf: 'center', marginRight: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Presets:</span>
        {presets.map(p => (

          <button
            key={p.label}
            type="button"
            onClick={() => { setReviewerName(p.name); setNotes(p.notes); }}
            style={{
              fontSize: '0.75rem', fontWeight: 600, padding: '5px 12px',
              borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(30,41,59,0.8)', color: '#94a3b8',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(16,185,129,0.3)'; (e.currentTarget as HTMLButtonElement).style.color = '#34d399'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'; }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSignOff}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          {/* Reviewer name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>
              Auditor / Reviewer Name *
            </label>
            <input
              type="text"
              value={reviewerName}
              onChange={e => setReviewerName(e.target.value)}
              placeholder="Full name & designation"
              required
              style={{
                width: '100%', padding: '10px 14px',
                background: 'rgba(6,13,26,0.8)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10, color: '#e2e8f0',
                fontSize: '0.87rem', outline: 'none',
                fontFamily: 'Inter, sans-serif',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(16,185,129,0.4)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>
              Discrepancy Findings Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Brief summary of findings"
              style={{
                width: '100%', padding: '10px 14px',
                background: 'rgba(6,13,26,0.8)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10, color: '#e2e8f0',
                fontSize: '0.87rem', outline: 'none',
                fontFamily: 'Inter, sans-serif',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(16,185,129,0.4)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
          </div>
        </div>

        {/* Checkbox */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16 }}>
          <input
            id="confirm-audit"
            type="checkbox"
            checked={isConfirmed}
            onChange={e => setIsConfirmed(e.target.checked)}
            style={{ marginTop: 3, accentColor: '#10b981', width: 15, height: 15, cursor: 'pointer' }}
          />
          <label htmlFor="confirm-audit" style={{ fontSize: '0.83rem', color: '#64748b', cursor: 'pointer', lineHeight: 1.6 }}>
            I confirm that I have reviewed the satellite baseline comparison, extracted EC clauses, and spatial buffer metrics. I authorise generation of the formal statutory Evidence Dossier.
          </label>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginBottom: 14, padding: '10px 14px', borderRadius: 10,
            background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.22)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <AlertTriangle size={14} style={{ color: '#ef4444', flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', color: '#fca5a5' }}>{error}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !isConfirmed}
          className="btn-primary"
          style={{ fontSize: '0.9rem' }}
        >
          {submitting ? (
            <>
              <div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              Signing & Compiling PDF Dossier…
            </>
          ) : (
            <>
              <UserCheck size={16} />
              Confirm & Sign Legal Evidence Dossier
            </>
          )}
        </button>
      </form>
    </div>
  );
};
