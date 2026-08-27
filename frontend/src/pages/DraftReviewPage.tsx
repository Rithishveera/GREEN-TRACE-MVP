import React, { useEffect, useState } from 'react';
import { AgentStatusTracker } from '../components/AgentStatusTracker';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';
import { FindingsPanel } from '../components/FindingsPanel';
import { ReviewGateBanner } from '../components/ReviewGateBanner';
import { DossierDownloadButton } from '../components/DossierDownloadButton';
import { RunStatusResponse } from '../types/schemas';
import { getRunStatus } from '../api/client';
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

interface DraftReviewPageProps {
  runId: string;
  onBackToUpload: () => void;
}

export const DraftReviewPage: React.FC<DraftReviewPageProps> = ({ runId, onBackToUpload }) => {
  const [status, setStatus] = useState<RunStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const data = await getRunStatus(runId);
      setStatus(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch run status.');
    } finally {
      setLoading(false);
    }
  };

  // Poll while processing
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      if (
        status &&
        ['draft_pending_review', 'reviewed_confirmed', 'manual_legal_review', 'failed'].includes(
          status.state
        )
      ) {
        clearInterval(interval);
      } else {
        fetchStatus();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [runId, status?.state]);

  if (loading && !status) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-10 h-10 mx-auto border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading audit run {runId}...</p>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error || 'Run details could not be found.'}</span>
        </div>
        <button onClick={onBackToUpload} className="btn-secondary">
          <ArrowLeft className="w-4 h-4" /> Return to Ingestion
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-4">
      {/* Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToUpload}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-100">Audit Run Overview</h2>
              <span className="font-mono text-xs text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                {status.run_id}
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <span>File: {status.filename}</span>
              <span>•</span>
              <span>Started: {status.created_at.slice(0, 19).replace('T', ' ')}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStatus}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Refresh Status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <DossierDownloadButton status={status} />
        </div>
      </div>

      {/* Multi-Agent Pipeline Status Tracker */}
      <AgentStatusTracker status={status} />

      {/* Satellite Imagery Comparison */}
      {status.agent4?.data && (
        <BeforeAfterSlider agent4Data={status.agent4.data as any} />
      )}

      {/* Extracted Findings & Legal Rules Panel */}
      <FindingsPanel status={status} />

      {/* Human Review Gate */}
      {['draft_pending_review', 'manual_legal_review', 'reviewed_confirmed'].includes(status.state) && (
        <ReviewGateBanner
          status={status}
          onReviewConfirmed={(updated) => setStatus(updated)}
        />
      )}
    </div>
  );
};
