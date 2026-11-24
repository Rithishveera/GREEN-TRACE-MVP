import React, { useState, useEffect, useRef } from 'react';
import { DraftReviewPage } from './pages/DraftReviewPage';
import { listRuns } from './api/client';
import { IngestResponse, RunStatusResponse } from './types/schemas';
import { Scale, ChevronRight, Plus, History, X, BookOpen } from 'lucide-react';

/* ─── Landing Page (Statutory Ledger Gazette Edition) ────── */
const LandingPage: React.FC<{ onEnter: () => void }> = ({ onEnter }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      background: 'var(--bg-app)',
      padding: '40px 24px',
    }}>
      {/* Outer Paper Border Ledger Frame */}
      <div
        className="landing-card-frame"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(16px)',
        }}
      >
        {/* Top Gazette Header Rule */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
          borderBottom: '1px solid var(--border-medium)',
          paddingBottom: 14,
          marginBottom: 36,
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>
          <span>Vol. MMXXVI · Issue 04</span>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Official Environmental Clearance Gazette</span>
          <span>Ref: EC-STAT-LEDGER</span>
        </div>

        {/* Insignia Stamp Emblem */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 64,
          height: 64,
          borderRadius: 'var(--radius-full)',
          border: '2px solid var(--text-primary)',
          background: 'var(--bg-surface-elevated)',
          marginBottom: 24,
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            inset: 4,
            borderRadius: 'var(--radius-full)',
            border: '1px dashed var(--text-secondary)',
          }} />
          <Scale size={28} style={{ color: 'var(--text-primary)' }} />
        </div>

        {/* Department / Category Tag */}
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          fontWeight: 700,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--text-secondary)',
          marginBottom: 12,
        }}>
          Autonomous Multi-Agent Evidence Registry
        </div>

        {/* Master Display Title in Fraunces Serif */}
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.4rem, 5.5vw, 3.8rem)',
          fontWeight: 800,
          lineHeight: 1.08,
          marginBottom: 22,
          letterSpacing: '-0.02em',
          color: 'var(--text-primary)',
        }}>
          GreenTrace Statutory Ledger
        </h1>

        <div style={{
          width: 80,
          height: 2,
          background: 'var(--text-primary)',
          margin: '0 auto 28px',
        }} />

        {/* Legal Inscription Quote */}
        <blockquote style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'clamp(1rem, 2vw, 1.12rem)',
          color: 'var(--text-secondary)',
          lineHeight: 1.7,
          marginBottom: 40,
          maxWidth: 620,
          margin: '0 auto 36px',
        }}>
          “The environment is not a resource to be exploited — it is a public trust to be honoured.
          Every clearance mandate must be enforced, and every ground discrepancy proven with unassailable spatial provenance.”
          <cite style={{
            display: 'block',
            marginTop: 14,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            fontStyle: 'normal',
            fontWeight: 700,
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            — Statutory Verification Framework § MoEFCC / SEIAA
          </cite>
        </blockquote>

        {/* CTA Button — Flat Ink Button */}
        <button
          onClick={onEnter}
          className="btn-primary"
          style={{
            padding: '16px 40px',
            fontSize: '1rem',
            letterSpacing: '0.04em',
            gap: 12,
          }}
        >
          <BookOpen size={18} />
          <span>Open Registry &amp; Inspect Clearance</span>
          <ChevronRight size={18} />
        </button>

        {/* Footer Note */}
        <div style={{
          marginTop: 36,
          paddingTop: 16,
          borderTop: '1px solid var(--border-subtle)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.68rem',
          color: 'var(--text-muted)',
          display: 'flex',
          justifyContent: 'center',
          gap: 24,
          flexWrap: 'wrap',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          <span>Deterministic Audit</span>
          <span>·</span>
          <span>Zero Silent Fabrication</span>
          <span>·</span>
          <span>Human-Attested Dossier</span>
        </div>
      </div>
    </div>
  );
};

/* ─── State Stamp Metadata (Replacing glowing chips) ───── */
const stateMeta: Record<string, { label: string; stampClass: string; color: string; bg: string; border: string }> = {
  ingested:             { label: 'INGESTED',         stampClass: 'stamp-chip--pending',   color: '#4B5D50', bg: 'rgba(75,93,80,0.1)',   border: 'rgba(28,42,32,0.2)' },
  agent1_done:          { label: 'PARALEGAL DONE',   stampClass: 'stamp-chip--pending',   color: '#4B5D50', bg: 'rgba(75,93,80,0.1)',   border: 'rgba(28,42,32,0.2)' },
  processing:           { label: 'IN PROGRESS',      stampClass: 'stamp-chip--warning',   color: '#9C7A24', bg: 'rgba(156,122,36,0.12)', border: '#9C7A24' },
  draft_pending_review: { label: 'PENDING REVIEW',   stampClass: 'stamp-chip--warning',   color: '#9C7A24', bg: 'rgba(156,122,36,0.12)', border: '#9C7A24' },
  manual_legal_review:  { label: 'MANUAL REVIEW',    stampClass: 'stamp-chip--flagged',   color: '#8B3A2B', bg: 'rgba(139,58,43,0.1)',  border: '#8B3A2B' },
  reviewed_confirmed:   { label: 'CONFIRMED & SEALED', stampClass: 'stamp-chip--confirmed', color: '#4B6B4E', bg: 'rgba(75,107,78,0.12)', border: '#4B6B4E' },
  failed:               { label: 'FAILED / REJECTED',stampClass: 'stamp-chip--flagged',   color: '#8B3A2B', bg: 'rgba(139,58,43,0.1)',  border: '#8B3A2B' },
};


/* ─── App Shell ──────────────────────────────────────────── */
export const App: React.FC = () => {
  const [screen, setScreen] = useState<'landing' | 'dashboard'>('landing');
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [runsHistory, setRunsHistory] = useState<RunStatusResponse[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const historyRef = useRef<HTMLDivElement>(null);

  const loadHistory = async () => {
    try { setRunsHistory(await listRuns()); } catch {}
  };

  useEffect(() => { if (screen === 'dashboard') loadHistory(); }, [screen, currentRunId]);

  useEffect(() => {
    if (!showHistory) return;
    const handler = (e: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showHistory]);

  const handleIngestSuccess = (res: IngestResponse) => setCurrentRunId(res.run_id);
  const filteredRuns = runsHistory.filter(r => {
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase();
    return r.run_id.toLowerCase().includes(q) || r.filename.toLowerCase().includes(q) || r.state.toLowerCase().includes(q);
  });

  if (screen === 'landing') {
    return <LandingPage onEnter={() => setScreen('dashboard')} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
      {/* ── Top Statutory Navigation ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        borderBottom: '1px solid var(--border-medium)',
        background: 'var(--bg-surface)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div className="app-header-inner">
          {/* Official Registry Logo */}
          <button
            onClick={() => { setCurrentRunId(null); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '6px 10px', borderRadius: 'var(--radius-sm)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--primary-surface)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-medium)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Scale size={18} style={{ color: 'var(--text-primary)' }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}>
                GreenTrace <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Ledger</span>
              </div>
              <div className="hidden-mobile" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Statutory Evidence Registry
              </div>
            </div>
          </button>

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {currentRunId && (
              <button
                onClick={() => setCurrentRunId(null)}
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                title="New Clearance Audit"
              >
                <Plus size={14} style={{ color: 'var(--text-primary)' }} />
                <span className="hidden-mobile">New Audit</span>
              </button>
            )}

            {/* History dropdown */}
            <div style={{ position: 'relative' }} ref={historyRef}>
              <button
                onClick={() => { setShowHistory(v => !v); loadHistory(); }}
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '6px 12px', gap: 6 }}
                title="Archived Case Files"
              >
                <History size={14} style={{ color: 'var(--text-secondary)' }} />
                <span className="hidden-mobile">Case Registry</span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.68rem', fontWeight: 700,
                  background: 'var(--primary-surface)', color: 'var(--text-primary)',
                  border: '1px solid var(--border-medium)',
                  padding: '1px 6px', borderRadius: 'var(--radius-sm)',
                }}>{runsHistory.length}</span>
              </button>

              {showHistory && (
                <div className="history-dropdown">
                  <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        Archived Case Files
                      </span>
                      <button
                        onClick={() => setShowHistory(false)}
                        style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={historySearch}
                      onChange={e => setHistorySearch(e.target.value)}
                      placeholder="Filter by Run ID, filename or status…"
                      style={{
                        width: '100%', padding: '7px 12px',
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                        fontSize: '0.8rem', outline: 'none',
                        fontFamily: 'var(--font-mono)',
                      }}
                    />
                  </div>
                  <div style={{ padding: '8px' }}>
                    {filteredRuns.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                        {runsHistory.length === 0 ? 'No prior case files recorded.' : 'No matching entries found.'}
                      </div>
                    ) : filteredRuns.map(r => {
                      const sm = stateMeta[r.state] || stateMeta.ingested;
                      const isCurrent = currentRunId === r.run_id;
                      return (
                        <div
                          key={r.run_id}
                          onClick={() => { setCurrentRunId(r.run_id); setShowHistory(false); }}
                          style={{
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            marginBottom: 4,
                            background: isCurrent ? 'var(--bg-surface-elevated)' : 'transparent',
                            border: `1px solid ${isCurrent ? 'var(--border-focus)' : 'var(--border-subtle)'}`,
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { if (!isCurrent) (e.currentTarget as HTMLDivElement).style.background = 'var(--primary-surface)'; }}
                          onMouseLeave={e => { if (!isCurrent) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                              {r.run_id}
                            </span>
                            <span className={`stamp-chip ${sm.stampClass}`}>
                              {sm.label}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {r.filename}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 3, fontFamily: 'var(--font-mono)' }}>
                            {r.created_at.slice(0, 16).replace('T', ' ')} UTC
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className="app-main-content">
        {currentRunId ? (
          <DraftReviewPage
            runId={currentRunId}
            onBackToUpload={() => setCurrentRunId(null)}
          />
        ) : (
          <UploadDashboard onIngestSuccess={handleIngestSuccess} recentRuns={runsHistory} onSelectRun={setCurrentRunId} />
        )}
      </main>

      {/* ── Statutory Footer ── */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        padding: '16px 24px',
        textAlign: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.68rem', color: 'var(--text-muted)',
        letterSpacing: '0.06em',
      }}>
        GreenTrace MVP · Statutory Environmental Clearance Audit Ledger · India MoEFCC / SEIAA Evidence Format
      </footer>
    </div>
  );
};

/* ─── Upload Dashboard (Folio Ingestion Stage) ───────────── */
import { UploadZone } from './components/UploadZone';

const UploadDashboard: React.FC<{
  onIngestSuccess: (r: IngestResponse) => void;
  recentRuns: RunStatusResponse[];
  onSelectRun: (id: string) => void;
}> = ({ onIngestSuccess, recentRuns, onSelectRun }) => {
  const pipeline = [
    { num: 1, folio: 'Folio I', label: 'Paralegal Extraction', desc: 'Parses the statutory EC document, extracting project identity, geospatial coordinates, file numbers, approval dates, and verbatim conditions.', color: 'var(--text-primary)', icon: '§' },
    { num: 2, folio: 'Folio II', label: 'Legal Validator', desc: 'Validates file number against MoEFCC / State SEIAA statutory portal naming patterns; surfaces live registry limitations explicitly.', color: 'var(--text-primary)', icon: '⚖' },
    { num: 3, folio: 'Folio III', label: 'Geospatial Scout', desc: 'Queries OpenStreetMap Overpass vector waterbody geometry and constructs verified UTM metric buffer polygons.', color: 'var(--text-primary)', icon: '⌖' },
    { num: 4, folio: 'Folio IV', label: 'Satellite Analyst', desc: 'Computes Sentinel-2 multi-spectral delta across the buffer zone, calculating physical m² built-up footprint changes.', color: 'var(--text-primary)', icon: '◈' },
  ];

  const recent5 = recentRuns.slice(0, 5);

  return (
    <div style={{ animation: 'fadeInUp 0.3s ease both' }}>
      {/* Folio Page Header */}
      <div style={{ marginBottom: 36, maxWidth: 720 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          marginBottom: 12,
        }}>
          <span className="folio-number">
            Section 01 · Ingestion &amp; Dispatch
          </span>
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.9rem, 4vw, 2.7rem)',
          fontWeight: 800, letterSpacing: '-0.02em',
          color: 'var(--text-primary)', marginBottom: 12, lineHeight: 1.15,
        }}>
          Environmental Clearance Discrepancy Audit
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.65, maxWidth: 640 }}>
          Submit an official MoEFCC or State SEIAA Environmental Clearance grant. Four sequential agents parse statutory conditions, cross-reference vector hydrology, and audit physical ground compliance.
        </p>
      </div>

      <div className="dashboard-grid">
        {/* Left: Ingestion + Agent Architecture */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* Upload Zone Card */}
          <UploadZone onIngestSuccess={onIngestSuccess} />

          {/* Sequential Agent Ledgers */}
          <div>
            <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="folio-number">
                Audit Sequence — 4 Autonomous Folios
              </span>
            </div>
            <div className="pipeline-cards-grid">
              {pipeline.map((step) => (
                <div
                  key={step.num}
                  className="card"
                  style={{
                    padding: '18px 20px',
                    background: 'var(--bg-card)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-medium)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                    }}>
                      {step.icon}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>
                        {step.folio} · Agent {step.num}
                      </div>
                      <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                        {step.label}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Recent Case Files */}
        <div>
          <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="folio-number">
              Recent Case Ledger
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{recentRuns.length} recorded</span>
          </div>

          {recent5.length === 0 ? (
            <div style={{
              padding: '36px 20px', textAlign: 'center',
              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: 8, color: 'var(--text-muted)' }}>◈</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>No case files recorded yet.</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Upload an EC grant document to open the first case file.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recent5.map(r => {
                const sm = stateMeta[r.state] || stateMeta.ingested;
                return (
                  <div
                    key={r.run_id}
                    onClick={() => onSelectRun(r.run_id)}
                    className="card"
                    style={{
                      padding: '12px 16px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {r.run_id}
                        </span>
                        <span className={`stamp-chip ${sm.stampClass}`}>
                          {sm.label}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.filename}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 3, fontFamily: 'var(--font-mono)' }}>
                        {r.created_at.slice(0, 16).replace('T', ' ')} UTC
                      </div>
                    </div>
                    <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

