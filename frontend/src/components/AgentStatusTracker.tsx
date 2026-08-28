import React, { useState } from 'react';
import {
  FileSearch, ShieldCheck, Compass, Satellite,
  AlertTriangle, ChevronDown, ChevronUp, Copy, Check
} from 'lucide-react';
import { RunStatusResponse, AgentResult } from '../types/schemas';

interface Props { status: RunStatusResponse; }

const AGENTS = [
  {
    key: 'agent1' as const,
    num: 1,
    folio: 'Folio I',
    label: 'Paralegal Extractor',
    desc: 'Extracts project identity, coordinates, file numbers, approval dates, and verbatim conditions from the statutory PDF document.',
    icon: FileSearch,
    runningState: 'ingested',
  },
  {
    key: 'agent2' as const,
    num: 2,
    folio: 'Folio II',
    label: 'Legal Validator',
    desc: 'Queries PARIVESH portal registry structure, validates statutory clearance status, and tracks amendment history.',
    icon: ShieldCheck,
    runningState: 'processing',
  },
  {
    key: 'agent3' as const,
    num: 3,
    folio: 'Folio III',
    label: 'Geospatial Scout',
    desc: 'Extracts real vector waterbody geometry via OpenStreetMap Overpass API and computes UTM metric buffer boundaries.',
    icon: Compass,
    runningState: 'processing',
  },
  {
    key: 'agent4' as const,
    num: 4,
    folio: 'Folio IV',
    label: 'Satellite Analyst',
    desc: 'Runs Sentinel-2 NDBI multi-spectral delta across the protected buffer, computing exact m² of ground alteration.',
    icon: Satellite,
    runningState: 'processing',
  },
];

const AgentCard: React.FC<{
  agent: typeof AGENTS[0];
  result?: AgentResult;
  isRunning: boolean;
}> = ({ agent, result, isRunning }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const Icon = agent.icon;

  const copyRef = (txt: string, i: number) => {
    navigator.clipboard.writeText(txt);
    setCopied(i);
    setTimeout(() => setCopied(null), 1500);
  };

  let status: 'done' | 'running' | 'pending' | 'error' | 'flagged' = 'pending';
  if (result) {
    status = result.status === 'failed' ? 'error' : result.status === 'flagged' ? 'flagged' : 'done';
  } else if (isRunning) {
    status = 'running';
  }

  const statusMeta = {
    done:    { label: 'COMPLETED', stampClass: 'stamp-chip--confirmed' },
    flagged: { label: 'FLAGGED',   stampClass: 'stamp-chip--flagged' },
    running: { label: 'IN PROCESS', stampClass: 'stamp-chip--warning' },
    pending: { label: 'QUEUED',    stampClass: 'stamp-chip--pending' },
    error:   { label: 'ERROR',     stampClass: 'stamp-chip--flagged' },
  }[status];

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      transition: 'border-color 0.15s, box-shadow 0.15s',
    }}>
      {/* Card header */}
      <div
        style={{
          padding: '16px 18px',
          display: 'flex', alignItems: 'center', gap: 14,
          cursor: result ? 'pointer' : 'default',
        }}
        onClick={() => result && setExpanded(v => !v)}
      >
        {/* Agent index badge */}
        <div style={{
          width: 38, height: 38, borderRadius: 'var(--radius-sm)', flexShrink: 0,
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-medium)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          {isRunning ? (
            <div style={{
              width: 18, height: 18,
              border: '2px solid var(--border-medium)',
              borderTopColor: 'var(--text-primary)',
              borderRadius: 'var(--radius-full)',
              animation: 'spin 0.8s linear infinite',
            }} />
          ) : (
            <Icon size={18} style={{ color: result ? 'var(--text-primary)' : 'var(--text-muted)' }} />
          )}
          {/* Folio digit */}
          <div style={{
            position: 'absolute', bottom: -4, right: -4,
            width: 15, height: 15, borderRadius: 'var(--radius-full)',
            background: 'var(--text-primary)',
            fontSize: '0.55rem', fontWeight: 800, color: 'var(--bg-surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-mono)',
          }}>
            {agent.num}
          </div>
        </div>

        {/* Name + desc */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span className="folio-number" style={{ fontSize: '0.65rem' }}>{agent.folio}</span>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {agent.label}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {agent.desc}
          </div>
        </div>

        {/* Status + confidence */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {result && (
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem', fontWeight: 700,
              padding: '2px 8px', borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)', background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
            }}>
              {Math.round(result.confidence * 100)}% DET
            </div>
          )}
          <span className={`stamp-chip ${statusMeta.stampClass}`}>
            {statusMeta.label}
          </span>
          {result && (
            expanded ? <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
          )}
        </div>
      </div>

      {/* Warnings strip */}
      {result?.warnings && result.warnings.length > 0 && (
        <div style={{
          margin: '0 18px 12px', padding: '8px 12px', borderRadius: 'var(--radius-sm)',
          background: 'var(--status-warning-bg)', border: '1px solid var(--status-warning)',
        }}>
          {result.warnings.map((w, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.75rem', color: 'var(--status-warning)', lineHeight: 1.5, fontFamily: 'var(--font-sans)' }}>
              <AlertTriangle size={13} style={{ marginTop: 2, flexShrink: 0 }} />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Expanded evidence ledger */}
      {expanded && result && (
        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '14px 18px',
          background: 'var(--bg-surface-elevated)',
          animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Registered Evidence Items ({result.evidence.length})
          </div>
          {result.evidence.map((ev, i) => (
            <div key={i} style={{
              marginBottom: i < result.evidence.length - 1 ? 8 : 0,
              padding: '10px 12px', borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'var(--font-mono)' }}>
                  {ev.source}
                </span>
                <button
                  onClick={() => copyRef(ev.raw_reference, i)}
                  className="btn-ghost"
                  style={{ padding: '2px 6px', fontSize: '0.68rem' }}
                >
                  {copied === i ? <Check size={11} /> : <Copy size={11} />}
                  <span>{copied === i ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', lineHeight: 1.5, wordBreak: 'break-all' }}>
                {ev.raw_reference}
              </p>
              <div style={{ marginTop: 4, fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Recorded: {ev.timestamp.slice(0, 19).replace('T', ' ')} UTC
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const AgentStatusTracker: React.FC<Props> = ({ status }) => {
  const overallBand = status.confidence_band;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Overall confidence determination banner */}
      {overallBand && (
        <div style={{
          padding: '14px 18px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
              Deterministic Confidence Band
            </div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700,
              color: 'var(--text-primary)',
            }}>
              {overallBand === 'green' ? 'High Provenance Verification' : overallBand === 'yellow' ? 'Medium Confidence — Inspection Recommended' : 'Low Confidence / Simulation Active — Manual Review Required'}
            </div>
          </div>
          <span className={`stamp-chip ${overallBand === 'green' ? 'stamp-chip--confirmed' : overallBand === 'yellow' ? 'stamp-chip--warning' : 'stamp-chip--flagged'}`}>
            BAND {overallBand.toUpperCase()}
          </span>
        </div>
      )}

      {/* Agent cards list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {AGENTS.map(agent => (
          <AgentCard
            key={agent.key}
            agent={agent}
            result={status[agent.key]}
            isRunning={!status[agent.key] && status.state === agent.runningState}
          />
        ))}
      </div>
    </div>
  );
};

