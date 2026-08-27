import React, { useState, useEffect, useRef } from 'react';
import { DraftReviewPage } from './pages/DraftReviewPage';
import { listRuns } from './api/client';
import { IngestResponse, RunStatusResponse } from './types/schemas';
import { TreePine, Clock, CheckCircle, XCircle, AlertTriangle, ChevronRight, Plus, History, X } from 'lucide-react';

/* ─── Landing Page ──────────────────────────────────────── */
const LandingPage: React.FC<{ onEnter: () => void }> = ({ onEnter }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 100); }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #020917 0%, #0a1628 40%, #0d1f3c 70%, #061412 100%)',
    }}>
      {/* Ambient orbs */}
      <div style={{
        position: 'absolute', top: '15%', left: '10%',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '5%',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      {/* Grid pattern */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(16,185,129,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(16,185,129,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 10, textAlign: 'center',
        maxWidth: 700, padding: '0 24px',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(32px)',
        transition: 'all 0.8s cubic-bezier(0.22,1,0.36,1)',
      }}>
        {/* Logo mark */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 80, height: 80, borderRadius: 24,
          background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.05) 100%)',
          border: '1px solid rgba(16,185,129,0.25)',
          marginBottom: 32,
          boxShadow: '0 0 40px rgba(16,185,129,0.15)',
          animation: 'float 4s ease-in-out infinite',
        }}>
          <TreePine size={36} style={{ color: '#10b981' }} />
        </div>

        {/* Brand */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          marginBottom: 12,
        }}>
          <span style={{
            fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: '#10b981',
            padding: '4px 12px', borderRadius: 99,
            border: '1px solid rgba(16,185,129,0.3)',
            background: 'rgba(16,185,129,0.08)',
          }}>AI · Environmental Auditing</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
          fontWeight: 900,
          lineHeight: 1.1,
          marginBottom: 20,
          letterSpacing: '-0.03em',
        }}>
          <span style={{ color: '#f8fafc' }}>Green</span>
          <span style={{
            background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>Trace</span>
        </h1>

        {/* Quote */}
        <blockquote style={{
          position: 'relative',
          fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
          fontStyle: 'italic',
          color: '#94a3b8',
          lineHeight: 1.7,
          marginBottom: 48,
          padding: '0 24px',
        }}>
          <span style={{
            position: 'absolute', top: -10, left: 0,
            fontSize: '4rem', color: 'rgba(16,185,129,0.15)',
            fontFamily: 'Georgia, serif', lineHeight: 1,
          }}>"</span>
          The environment is not a resource to be exploited — it is a trust to be honoured.
          Every clearance must be earned, every encroachment must be proven.
          <cite style={{
            display: 'block', marginTop: 16,
            fontSize: '0.8rem', fontStyle: 'normal',
            fontWeight: 600, color: '#475569',
            letterSpacing: '0.05em', textTransform: 'uppercase',
          }}>— GreenTrace Environmental Intelligence</cite>
        </blockquote>

        {/* CTA */}
        <button
          onClick={onEnter}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 12,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff',
            padding: '18px 48px',
            borderRadius: 16,
            border: 'none',
            fontSize: '1.1rem',
            fontWeight: 700,
            letterSpacing: '0.01em',
            cursor: 'pointer',
            boxShadow: '0 4px 32px rgba(16,185,129,0.4), 0 0 0 0 rgba(16,185,129,0.4)',
            transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
            animation: 'pulse-ring 2.5s ease-out infinite',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-3px) scale(1.02)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 40px rgba(16,185,129,0.55)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = '';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 32px rgba(16,185,129,0.4)';
          }}
        >
          <TreePine size={20} />
          <span>Begin Audit</span>
          <ChevronRight size={18} />
        </button>

        <p style={{
          marginTop: 20, fontSize: '0.8rem', color: '#334155',
          letterSpacing: '0.05em',
        }}>
          Autonomous · Multi-Agent · Evidence-Grade
        </p>
      </div>

      {/* Bottom strip */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 1,
        background: 'linear-gradient(to right, transparent, rgba(16,185,129,0.3), transparent)',
      }} />
    </div>
  );
};

/* ─── State pill colors ──────────────────────────────────── */
const stateMeta: Record<string, { label: string; color: string; bg: string; border: string }> = {
  ingested:             { label: 'Ingested',         color: '#94a3b8', bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.25)' },
  agent1_done:          { label: 'Agent 1 Done',     color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.25)' },
  processing:           { label: 'Processing',       color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)' },
  draft_pending_review: { label: 'Pending Review',   color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.25)' },
  manual_legal_review:  { label: 'Manual Review',    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)' },
  reviewed_confirmed:   { label: 'Confirmed ✓',      color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' },
  failed:               { label: 'Failed',           color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)' },
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#060d1a' }}>
      {/* ── Top Nav ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(6,13,26,0.92)',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          padding: '0 24px',
          height: 64,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <button
            onClick={() => { setCurrentRunId(null); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '6px 10px', borderRadius: 10,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'rgba(16,185,129,0.12)',
              border: '1px solid rgba(16,185,129,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TreePine size={17} style={{ color: '#10b981' }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
                Green<span style={{ color: '#10b981' }}>Trace</span>
              </div>
              <div style={{ fontSize: '0.65rem', color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Environmental Auditing
              </div>
            </div>
          </button>

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {currentRunId && (
              <button
                onClick={() => setCurrentRunId(null)}
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              >
                <Plus size={14} style={{ color: '#10b981' }} />
                New Audit
              </button>
            )}

            {/* History dropdown */}
            <div style={{ position: 'relative' }} ref={historyRef}>
              <button
                onClick={() => { setShowHistory(v => !v); loadHistory(); }}
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '6px 14px', gap: 8 }}
              >
                <History size={14} style={{ color: '#64748b' }} />
                <span>History</span>
                <span style={{
                  fontSize: '0.7rem', fontWeight: 700,
                  background: 'rgba(16,185,129,0.15)', color: '#10b981',
                  padding: '1px 6px', borderRadius: 99,
                }}>{runsHistory.length}</span>
              </button>

              {showHistory && (
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                  width: 360, maxHeight: 480, overflowY: 'auto',
                  background: '#0d1929', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                  zIndex: 200,
                  animation: 'scaleIn 0.2s ease',
                  transformOrigin: 'top right',
                }}>
                  <div style={{ padding: '14px 14px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        Recent Audits
                      </span>
                      <button
                        onClick={() => setShowHistory(false)}
                        style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={historySearch}
                      onChange={e => setHistorySearch(e.target.value)}
                      placeholder="Search by ID, file or status..."
                      style={{
                        width: '100%', padding: '7px 12px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8, color: '#e2e8f0',
                        fontSize: '0.8rem', outline: 'none',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    />
                  </div>
                  <div style={{ padding: '0 8px 10px' }}>
                    {filteredRuns.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#475569', fontSize: '0.8rem' }}>
                        {runsHistory.length === 0 ? 'No audits yet.' : 'No matches.'}
                      </div>
                    ) : filteredRuns.map(r => {
                      const sm = stateMeta[r.state] || stateMeta.ingested;
                      const isCurrent = currentRunId === r.run_id;
                      return (
                        <div
                          key={r.run_id}
                          onClick={() => { setCurrentRunId(r.run_id); setShowHistory(false); }}
                          style={{
                            padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                            marginBottom: 4,
                            background: isCurrent ? 'rgba(16,185,129,0.08)' : 'transparent',
                            border: `1px solid ${isCurrent ? 'rgba(16,185,129,0.2)' : 'transparent'}`,
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { if (!isCurrent) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'; }}
                          onMouseLeave={e => { if (!isCurrent) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8' }}>
                              {r.run_id}
                            </span>
                            <span style={{
                              fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.04em',
                              textTransform: 'uppercase', padding: '2px 8px', borderRadius: 99,
                              color: sm.color, background: sm.bg, border: `1px solid ${sm.border}`,
                            }}>{sm.label}</span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {r.filename}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#334155', marginTop: 3, fontFamily: 'JetBrains Mono, monospace' }}>
                            {r.created_at.slice(0, 16).replace('T', ' ')}
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

      {/* ── Main Content ── */}
      <main style={{ flex: 1, maxWidth: 1280, width: '100%', margin: '0 auto', padding: '32px 24px' }}>
        {currentRunId ? (
          <DraftReviewPage
            runId={currentRunId}
            onBackToUpload={() => setCurrentRunId(null)}
          />
        ) : (
          <UploadDashboard onIngestSuccess={handleIngestSuccess} recentRuns={runsHistory} onSelectRun={setCurrentRunId} />
        )}
      </main>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '16px 24px',
        textAlign: 'center',
        fontSize: '0.7rem', color: '#1e293b',
        letterSpacing: '0.04em',
      }}>
        GreenTrace MVP · FastAPI · Sentinel-2 GEE · Overpass OSM · Gemini LLM · ReportLab
      </footer>
    </div>
  );
};

/* ─── Upload Dashboard ───────────────────────────────────── */
import { UploadZone } from './components/UploadZone';

const UploadDashboard: React.FC<{
  onIngestSuccess: (r: IngestResponse) => void;
  recentRuns: RunStatusResponse[];
  onSelectRun: (id: string) => void;
}> = ({ onIngestSuccess, recentRuns, onSelectRun }) => {
  const pipeline = [
    { num: 1, label: 'Paralegal Extraction', desc: 'Reads the EC PDF, extracts project name, coordinates, file number, EC date and all environmental conditions.', color: '#3b82f6', icon: '📄' },
    { num: 2, label: 'Legal Validator',       desc: 'Queries the PARIVESH portal registry, verifies clearance status and tracks amendment history.',                color: '#8b5cf6', icon: '⚖️' },
    { num: 3, label: 'Geospatial Scout',      desc: 'Fetches OSM waterbody geometry via Overpass API and applies exact UTM metric buffer calculations.',           color: '#f59e0b', icon: '🗺️' },
    { num: 4, label: 'Satellite Analyst',     desc: 'Runs Sentinel-2 NDBI spectral delta across the buffer, calculating m² of built-up encroachment.',            color: '#10b981', icon: '🛰️' },
  ];

  const recent5 = recentRuns.slice(0, 5);

  return (
    <div style={{ animation: 'fadeInUp 0.5s ease both' }}>
      {/* Page header */}
      <div style={{ marginBottom: 40, maxWidth: 640 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          marginBottom: 14, padding: '4px 12px', borderRadius: 99,
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse-ring 2s infinite' }} />
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10b981', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Autonomous AI Pipeline · Ready
          </span>
        </div>
        <h1 style={{
          fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
          fontWeight: 900, letterSpacing: '-0.03em',
          color: '#f1f5f9', marginBottom: 12, lineHeight: 1.15,
        }}>
          Environmental Clearance<br />
          <span style={{
            background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>Discrepancy Audit</span>
        </h1>
        <p style={{ fontSize: '1rem', color: '#64748b', lineHeight: 1.7, maxWidth: 520 }}>
          Upload an official MoEFCC / SEIAA Environmental Clearance PDF. Four autonomous agents verify the clearance, map the buffer zone, and compile statutory evidence.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 28, alignItems: 'start' }}>
        {/* Left: Upload + Pipeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Upload Card */}
          <UploadZone onIngestSuccess={onIngestSuccess} />

          {/* Pipeline Steps */}
          <div>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Autonomous Pipeline — 4 Agents
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {pipeline.map((step, i) => (
                <div
                  key={step.num}
                  className="card"
                  style={{
                    padding: 18,
                    animationName: 'fadeInUp',
                    animationDuration: '0.5s',
                    animationDelay: `${i * 0.08}s`,
                    animationFillMode: 'both',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: `${step.color}14`,
                      border: `1px solid ${step.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.1rem',
                    }}>
                      {step.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: step.color, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                        Agent {step.num}
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>
                        {step.label}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.55 }}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Recent audits */}
        <div>
          <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Recent Audits
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#334155' }}>{recentRuns.length} total</span>
          </div>

          {recent5.length === 0 ? (
            <div style={{
              padding: '40px 24px', textAlign: 'center',
              background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 14,
            }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: '0.85rem', color: '#475569' }}>No audits yet. Upload an EC document to begin.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recent5.map(r => {
                const sm = stateMeta[r.state] || stateMeta.ingested;
                const StateIcon = r.state === 'reviewed_confirmed' ? CheckCircle
                  : r.state === 'failed' ? XCircle
                  : r.state === 'manual_legal_review' ? AlertTriangle
                  : Clock;
                return (
                  <div
                    key={r.run_id}
                    onClick={() => onSelectRun(r.run_id)}
                    className="card"
                    style={{
                      padding: '14px 16px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 14,
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: sm.bg, border: `1px solid ${sm.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <StateIcon size={16} style={{ color: sm.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                        <span style={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: '#64748b' }}>
                          {r.run_id}
                        </span>
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.04em',
                          padding: '2px 7px', borderRadius: 99, textTransform: 'uppercase',
                          color: sm.color, background: sm.bg, border: `1px solid ${sm.border}`,
                          flexShrink: 0, marginLeft: 8,
                        }}>{sm.label}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.filename}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#334155', marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>
                        {r.created_at.slice(0, 16).replace('T', ' ')}
                      </div>
                    </div>
                    <ChevronRight size={14} style={{ color: '#334155', flexShrink: 0 }} />
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
