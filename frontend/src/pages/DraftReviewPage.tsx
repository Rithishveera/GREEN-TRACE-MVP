import React, { useEffect, useState, useRef } from 'react';
import { AgentStatusTracker } from '../components/AgentStatusTracker';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';
import { FindingsPanel } from '../components/FindingsPanel';
import { ReviewGateBanner } from '../components/ReviewGateBanner';
import { DossierPage } from './DossierPage';
import { RunStatusResponse } from '../types/schemas';
import { getRunStatus } from '../api/client';
import { ArrowLeft, RefreshCw, AlertCircle, Activity, MapPin, Satellite, Scale } from 'lucide-react';

interface Props {
  runId: string;
  onBackToUpload: () => void;
}

const STATE_INFO: Record<string, { label: string; color: string; bg: string; description: string }> = {
  ingested:             { label: 'Ingested',       color: '#94a3b8', bg: 'rgba(100,116,139,0.12)', description: 'Document received, pipeline starting…' },
  agent1_done:          { label: 'Agent 1 Done',   color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  description: 'Paralegal extraction complete, continuing pipeline…' },
  processing:           { label: 'Processing',     color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  description: 'Running geospatial scout & legal validator in parallel…' },
  draft_pending_review: { label: 'Ready for Review', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', description: 'All agents complete. Awaiting human sign-off.' },
  manual_legal_review:  { label: 'Manual Review',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  description: 'Qualitative conditions flagged. Expert review required.' },
  reviewed_confirmed:   { label: 'Sealed ✓',       color: '#10b981', bg: 'rgba(16,185,129,0.12)', description: 'Audit confirmed & legal dossier compiled.' },
  failed:               { label: 'Failed',         color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  description: 'Pipeline encountered an error.' },
};

export const DraftReviewPage: React.FC<Props> = ({ runId, onBackToUpload }) => {
  const [status, setStatus]           = useState<RunStatusResponse | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [viewingDossier, setViewingDossier] = useState(false);
  const [activeSection, setActiveSection]   = useState<'pipeline' | 'findings' | 'satellite' | 'review'>('pipeline');
  const statusRef = useRef<RunStatusResponse | null>(null);
  statusRef.current = status;

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

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      const cur = statusRef.current;
      const done = cur && ['draft_pending_review','reviewed_confirmed','manual_legal_review','failed'].includes(cur.state);
      if (!done) fetchStatus();
      else clearInterval(interval);
    }, 2500);
    return () => clearInterval(interval);
  }, [runId]);

  if (loading && !status) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 20 }}>
        <div style={{
          width: 52, height: 52,
          border: '3px solid rgba(16,185,129,0.2)',
          borderTopColor: '#10b981',
          borderRadius: '50%',
          animation: 'spin 0.9s linear infinite',
          boxShadow: '0 0 20px rgba(16,185,129,0.15)',
        }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>Initializing Audit Pipeline</div>
          <div style={{ fontSize: '0.8rem', color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>run/{runId}</div>
        </div>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center' }}>
        <div style={{ padding: '20px 24px', borderRadius: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, textAlign: 'left' }}>
          <AlertCircle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
          <span style={{ fontSize: '0.9rem', color: '#fca5a5' }}>{error || 'Run details could not be loaded.'}</span>
        </div>
        <button onClick={onBackToUpload} className="btn-secondary">
          <ArrowLeft size={15} /> Return to Upload
        </button>
      </div>
    );
  }

  if (viewingDossier) {
    return <DossierPage status={status} onBack={() => setViewingDossier(false)} />;
  }

  const si = STATE_INFO[status.state] || STATE_INFO.ingested;
  const isReady = ['draft_pending_review','manual_legal_review','reviewed_confirmed'].includes(status.state);
  const isActive = ['ingested','agent1_done','processing'].includes(status.state);
  const hasAgent4 = !!status.agent4?.data;

  const sections = [
    { key: 'pipeline',  label: 'Pipeline',  icon: Activity, available: true },
    { key: 'findings',  label: 'Findings',  icon: MapPin,   available: !!status.agent1 },
    { key: 'satellite', label: 'Satellite', icon: Satellite, available: hasAgent4 },
    { key: 'review',    label: 'Review Gate', icon: Scale,  available: isReady },
  ] as const;

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
      {/* ── Header ── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start',
        justifyContent: 'space-between', gap: 16, marginBottom: 28,
        paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <button
            onClick={onBackToUpload}
            style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#94a3b8', marginTop: 2,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(30,41,59,1)'; (e.currentTarget as HTMLButtonElement).style.color = '#e2e8f0'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(30,41,59,0.8)'; (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'; }}
            title="Return to Upload"
          >
            <ArrowLeft size={15} />
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
                Clearance Audit
              </h1>
              <code style={{
                fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace',
                color: '#475569', background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '2px 10px', borderRadius: 6,
              }}>{status.run_id}</code>
              <span style={{
                fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.05em',
                textTransform: 'uppercase', padding: '3px 10px', borderRadius: 99,
                color: si.color, background: si.bg, border: `1px solid ${si.color}30`,
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                {isActive && (
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%', background: si.color,
                    animation: 'pulse-ring 1.5s infinite',
                  }} />
                )}
                {si.label}
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#475569' }}>
              <span style={{ color: '#64748b' }}>{status.filename}</span>
              <span style={{ margin: '0 8px', color: '#1e293b' }}>·</span>
              {si.description}
            </p>
          </div>
        </div>

        <button
          onClick={fetchStatus}
          style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#64748b', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#10b981'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#64748b'; }}
          title="Refresh"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* ── Section tabs ── */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 24,
        background: 'rgba(15,23,42,0.6)', borderRadius: 12,
        padding: 5, border: '1px solid rgba(255,255,255,0.06)',
        width: 'fit-content',
      }}>
        {sections.map(({ key, label, icon: Icon, available }) => {
          const isActive = activeSection === key;
          return (
            <button
              key={key}
              onClick={() => available && setActiveSection(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 16px', borderRadius: 8,
                border: 'none', cursor: available ? 'pointer' : 'not-allowed',
                background: isActive ? 'rgba(16,185,129,0.12)' : 'transparent',
                color: isActive ? '#10b981' : available ? '#64748b' : '#1e293b',
                fontSize: '0.82rem', fontWeight: 600,
                transition: 'all 0.15s',
                opacity: available ? 1 : 0.4,
              }}
            >
              <Icon size={14} />
              {label}
              {key === 'review' && isReady && (
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: status.state === 'reviewed_confirmed' ? '#10b981' : '#f59e0b' }} />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Section content ── */}
      <div style={{ animation: 'fadeIn 0.3s ease both' }}>
        {activeSection === 'pipeline' && (
          <AgentStatusTracker status={status} />
        )}

        {activeSection === 'findings' && (
          <FindingsPanel status={status} />
        )}

        {activeSection === 'satellite' && hasAgent4 && (
          <BeforeAfterSlider
            agent4Data={status.agent4!.data as any}
            agent1Data={status.agent1?.data as any}
            agent3Data={status.agent3?.data as any}
            status={status}
          />
        )}


        {activeSection === 'satellite' && !hasAgent4 && (
          <div style={{
            padding: '60px 24px', textAlign: 'center',
            background: 'rgba(15,23,42,0.5)', borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>🛰️</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', marginBottom: 8 }}>Satellite Analysis Pending</div>
            <div style={{ fontSize: '0.85rem', color: '#1e293b' }}>The satellite analyst will run once geospatial scouting completes.</div>
          </div>
        )}

        {activeSection === 'review' && isReady && (
          <ReviewGateBanner
            status={status}
            onReviewConfirmed={updated => { setStatus(updated); }}
            onViewDossier={() => setViewingDossier(true)}
          />
        )}

        {activeSection === 'review' && !isReady && (
          <div style={{
            padding: '60px 24px', textAlign: 'center',
            background: 'rgba(15,23,42,0.5)', borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>⏳</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', marginBottom: 8 }}>Pipeline Still Running</div>
            <div style={{ fontSize: '0.85rem', color: '#1e293b' }}>The Review Gate unlocks once all four agents have completed.</div>
          </div>
        )}
      </div>
    </div>
  );
};
