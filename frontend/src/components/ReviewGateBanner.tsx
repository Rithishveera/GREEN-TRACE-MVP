import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, UserCheck, AlertTriangle } from 'lucide-react';
import { RunStatusResponse } from '../types/schemas';
import { submitReview } from '../api/client';

interface ReviewGateBannerProps {
  status: RunStatusResponse;
  onReviewConfirmed: (updated: RunStatusResponse) => void;
}

export const ReviewGateBanner: React.FC<ReviewGateBannerProps> = ({ status, onReviewConfirmed }) => {
  const [reviewerName, setReviewerName] = useState('Adv. Rajesh V. Ramanathan');
  const [notes, setNotes] = useState(
    'Ground discrepancy confirmed: 3,820 m² unauthorized clearing inside 100m Bhadra river buffer zone. Forwarded for regulatory notice under Section 5 EPA 1986.'
  );
  const [isConfirmed, setIsConfirmed] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAlreadyReviewed = status.state === 'reviewed_confirmed';

  const handleSignOff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim()) {
      setError('Please provide your name or official designation for the legal signature.');
      return;
    }
    if (!isConfirmed) {
      setError('You must check the confirmation checkbox to seal the legal dossier.');
      return;
    }

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
      setError(err.message || 'Failed to submit review confirmation.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isAlreadyReviewed) {
    return (
      <div className="glass-panel p-6 border-emerald-500/50 bg-emerald-950/20 rounded-xl space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-emerald-300">
              Audit Reviewed & Formally Sealed
            </h4>
            <p className="text-xs text-slate-300">
              Attested by <span className="font-semibold text-slate-100">{status.reviewer_name}</span> at{' '}
              <span className="font-mono text-emerald-400">{status.reviewed_at?.slice(0, 19)}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 border-amber-500/50 bg-amber-950/15 rounded-xl space-y-4">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 mt-0.5">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-base font-bold text-amber-300 flex items-center gap-2">
            Human Review Gate — State: DRAFT_PENDING_REVIEW
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Statutory Safeguard: Under GreenTrace architectural rules, multi-agent AI evidence outputs cannot be exported or treated as statutory evidence without explicit human auditor sign-off.
          </p>
        </div>
      </div>

      <form onSubmit={handleSignOff} className="space-y-4 pt-2 border-t border-amber-500/20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Auditor / Reviewer Full Name & Designation *
            </label>
            <input
              type="text"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              placeholder="e.g. Dr. Priya Nair (Senior Environmental Scientist / Auditor)"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-400 transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Auditor Notes / Discrepancy Findings Summary
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Unauthorized built-up encroachment confirmed in 100m river buffer."
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-400 transition"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <input
            id="confirm-check"
            type="checkbox"
            checked={isConfirmed}
            onChange={(e) => setIsConfirmed(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-400 bg-slate-900 cursor-pointer"
          />
          <label htmlFor="confirm-check" className="text-xs text-slate-300 cursor-pointer select-none">
            I confirm that I have inspected the satellite baseline comparison, extracted clauses, and spatial buffer metrics. Sign and generate formal Evidence Dossier.
          </label>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting || !isConfirmed}
            className="btn-primary w-full sm:w-auto"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Signing & Compiling PDF Dossier...</span>
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                <span>Confirm & Sign Legal Dossier</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
