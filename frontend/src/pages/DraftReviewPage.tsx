import React, { useEffect, useState, useRef } from 'react';
import { AgentStatusTracker } from '../components/AgentStatusTracker';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';
import { FindingsPanel } from '../components/FindingsPanel';
import { ReviewGateBanner } from '../components/ReviewGateBanner';
import { DossierPage } from './DossierPage';
import { RunStatusResponse } from '../types/schemas';
import { getRunStatus } from '../api/client';
import { ArrowLeft, RefreshCw, AlertCircle, BookOpen, MapPin, Satellite, Scale } from 'lucide-react';

interface Props {
  runId: string;
  onBackToUpload: () => void;
}

const STATE_INFO: Record<string, { label: string; stampClass: string; description: string }> = {
  ingested:             { label: 'INGESTED',       stampClass: 'stamp-chip--pending',   description: 'Document recorded in register; initiating paralegal extraction…' },
  agent1_done:          { label: 'PARALEGAL DONE', stampClass: 'stamp-chip--pending',   description: 'Clearance particulars parsed; proceeding to validation folios…' },
  processing:           { label: 'AUDITING',       stampClass: 'stamp-chip--warning',   description: 'Executing vector hydrology verification & satellite spectral delta…' },
  draft_pending_review: { label: 'PENDING REVIEW', stampClass: 'stamp-chip--warning',   description: 'All 4 folios compiled. Awaiting formal human verification.' },
  manual_legal_review:  { label: 'MANUAL REVIEW',  stampClass: 'stamp-chip--flagged',   description: 'Qualitative conditions or unrecognized format flagged for manual review.' },
  reviewed_confirmed:   { label: 'SEALED & ATTESTED', stampClass: 'stamp-chip--confirmed', description: 'Statutory evidence dossier formally confirmed & signed.' },
  failed:               { label: 'AUDIT FAILED',   stampClass: 'stamp-chip--flagged',   description: 'Audit execution halted due to processing anomaly.' },
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
        <div style={{
          width: 44, height: 44,
          border: '2px solid var(--border-medium)',
          borderTopColor: 'var(--text-primary)',
          borderRadius: 'var(--radius-full)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            Opening Statutory Case File
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Entry: {runId}
          </div>
        </div>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div style={{ maxWidth: 520, margin: '80px auto', textAlign: 'center' }}>
        <div style={{ padding: '20px 24px', borderRadius: 'var(--radius-md)', background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, textAlign: 'left' }}>
          <AlertCircle size={20} style={{ color: 'var(--status-danger)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.88rem', color: 'var(--status-danger)' }}>{error || 'Case file could not be retrieved from the registry.'}</span>
        </div>
        <button onClick={onBackToUpload} className="btn-secondary">
          <ArrowLeft size={15} /> Return to Case Register
        </button>
      </div>
    );
  }

  if (viewingDossier) {
    return <DossierPage status={status} onBack={() => setViewingDossier(false)} />;
  }

  const si = STATE_INFO[status.state] || STATE_INFO.ingested;
  const isReady = ['draft_pending_review','manual_legal_review','reviewed_confirmed'].includes(status.state);
  const hasAgent4 = !!status.agent4?.data;

  const sections = [
    { key: 'pipeline',  folio: 'Folio I',   label: 'Pipeline Ledger',  icon: BookOpen,  available: true },
    { key: 'findings',  folio: 'Folio II',  label: 'Legal Mandates',   icon: MapPin,    available: !!status.agent1 },
    { key: 'satellite', folio: 'Folio III', label: 'Ground-Truth',     icon: Satellite, available: hasAgent4 },
    { key: 'review',    folio: 'Folio IV',  label: 'Attestation Gate', icon: Scale,     available: isReady },
  ] as const;

  return (
    <div style={{ animation: 'fadeInUp 0.35s ease both' }}>
      {/* ── Case File Master Header ── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start',
        justifyContent: 'space-between', gap: 16, marginBottom: 28,
        paddingBottom: 20, borderBottom: '1px solid var(--border-medium)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <button
            onClick={onBackToUpload}
            className="btn-secondary"
            style={{
              padding: '8px 12px',
              gap: 6,
            }}
            title="Return to Registry Index"
          >
            <ArrowLeft size={14} />
            <span style={{ fontSize: '0.8rem' }}>Register</span>
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
              <span className="folio-number">Case File</span>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.35rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}>
                Statutory Environmental Clearance Audit
              </h1>
              <code style={{
                fontSize: '0.75rem', fontFamily: 'var(--font-mono)',
                color: 'var(--text-primary)', background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-medium)',
                padding: '2px 8px', borderRadius: 'var(--radius-sm)',
              }}>{status.run_id}</code>
              <span className={`stamp-chip ${si.stampClass}`}>
                {si.label}
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{status.filename}</strong>
              <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>·</span>
              {si.description}
            </p>
          </div>
        </div>

        <button
          onClick={fetchStatus}
          className="btn-secondary"
          style={{ padding: '8px 12px', gap: 6, fontSize: '0.8rem' }}
          title="Refresh Record"
        >
          <RefreshCw size={13} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── Folio Tabs (Ledger Index Style) ── */}
      <div className="responsive-tabs">
        {sections.map(({ key, folio, label, icon: Icon, available }) => {
          const isActiveTab = activeSection === key;
          return (
            <button
              key={key}
              onClick={() => available && setActiveSection(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 14px', borderRadius: 'var(--radius-sm)',
                border: '1px solid',
                borderColor: isActiveTab ? 'var(--border-focus)' : 'transparent',
                cursor: available ? 'pointer' : 'not-allowed',
                background: isActiveTab ? 'var(--bg-surface)' : 'transparent',
                color: isActiveTab ? 'var(--text-primary)' : available ? 'var(--text-secondary)' : 'var(--text-muted)',
                fontSize: '0.8rem', fontWeight: isActiveTab ? 700 : 500,
                transition: 'all 0.15s',
                opacity: available ? 1 : 0.45,
                boxShadow: isActiveTab ? 'var(--shadow-sm)' : 'none',
              }}
            >
              <Icon size={13} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>{folio}:</span>
              <span>{label}</span>
              {key === 'review' && isReady && (
                <span className={`stamp-chip ${status.state === 'reviewed_confirmed' ? 'stamp-chip--confirmed' : 'stamp-chip--warning'}`} style={{ padding: '1px 5px', fontSize: '0.6rem' }}>
                  {status.state === 'reviewed_confirmed' ? 'SEALED' : 'REQUIRED'}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Main Case File Container with Stitched Spine Motif ── */}
      <div className="case-file" style={{ animation: 'fadeIn 0.25s ease both' }}>
        {activeSection === 'pipeline' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h2 className="folio-header" style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                <span className="folio-number">Folio I</span>
                Autonomous Paralegal &amp; Geospatial Pipeline
              </h2>
            </div>
            <AgentStatusTracker status={status} />
          </div>
        )}

        {activeSection === 'findings' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h2 className="folio-header" style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                <span className="folio-number">Folio II</span>
                Extracted Clearance Particulars &amp; Statutory Conditions
              </h2>
            </div>
            <FindingsPanel status={status} />
          </div>
        )}

        {activeSection === 'satellite' && hasAgent4 && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h2 className="folio-header" style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                <span className="folio-number">Folio III</span>
                Satellite Multi-Spectral Baseline &amp; Buffer Compliance
              </h2>
            </div>
            <BeforeAfterSlider
              agent4Data={status.agent4!.data as any}
              agent1Data={status.agent1?.data as any}
              agent3Data={status.agent3?.data as any}
              status={status}
            />
          </div>
        )}

        {activeSection === 'satellite' && !hasAgent4 && (
          <div style={{
            padding: '60px 24px', textAlign: 'center',
            background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: 12, color: 'var(--text-muted)' }}>◈</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
              Folio III: Satellite Ground-Truth Analysis Pending
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Optical multi-spectral analysis will execute upon resolution of earlier folios.
            </div>
          </div>
        )}

        {activeSection === 'review' && isReady && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h2 className="folio-header" style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                <span className="folio-number">Folio IV</span>
                Human Auditor Review &amp; Statutory Attestation
              </h2>
            </div>
            <ReviewGateBanner
              status={status}
              onReviewConfirmed={updated => { setStatus(updated); }}
              onViewDossier={() => setViewingDossier(true)}
            />
          </div>
        )}

        {activeSection === 'review' && !isReady && (
          <div style={{
            padding: '60px 24px', textAlign: 'center',
            background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: 12, color: 'var(--text-muted)' }}>§</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
              Folio IV: Attestation Gate Locked
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              The attestation gate requires completion of Paralegal and Validator folios before legal sign-off.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
