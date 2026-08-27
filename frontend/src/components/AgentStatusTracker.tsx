import React, { useState } from 'react';
import {
  FileSearch, ShieldCheck, Compass, Satellite,
  CheckCircle2, Clock, AlertTriangle, XCircle,
  ChevronDown, ChevronUp, Copy, Check, Activity
} from 'lucide-react';
import { RunStatusResponse, AgentResult } from '../types/schemas';

interface Props { status: RunStatusResponse; }

const AGENTS = [
  {
    key: 'agent1' as const,
    num: 1,
    label: 'Paralegal Extractor',
    desc: 'Reads the EC PDF, extracts project name, file number, coordinates, EC date and all environmental conditions using Gemini LLM + Regex.',
    icon: FileSearch,
    color: '#3b82f6',
    runningState: 'ingested',
  },
  {
    key: 'agent2' as const,
    num: 2,
    label: 'Legal Validator',
    desc: 'Queries PARIVESH portal registry to verify clearance status, tracks amendment history and flags discrepancies.',
    icon: ShieldCheck,
    color: '#8b5cf6',
    runningState: 'processing',
  },
  {
    key: 'agent3' as const,
    num: 3,
    label: 'Geospatial Scout',
    desc: 'Fetches real OSM waterbody geometry via Overpass API and applies exact UTM metric buffer calculations.',
    icon: Compass,
    color: '#f59e0b',
    runningState: 'processing',
  },
  {
    key: 'agent4' as const,
    num: 4,
    label: 'Satellite Analyst',
    desc: 'Runs Sentinel-2 NDBI spectral delta across the buffer zone, calculating m² of built-up encroachment post-clearance.',
    icon: Satellite,
    color: '#10b981',
    runningState: 'processing',
  },
];

const confidenceBand = (c: number) => {
  if (c >= 0.85) return { label: 'High', color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
  if (c >= 0.65) return { label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
  return { label: 'Low', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
};

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
    done:    { label: 'Complete',  color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', Icon: CheckCircle2 },
    flagged: { label: 'Flagged',   color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', Icon: AlertTriangle },
    running: { label: 'Running…',  color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)', Icon: Activity },
    pending: { label: 'Queued',    color: '#475569', bg: 'rgba(71,85,105,0.08)',   border: 'rgba(71,85,105,0.15)',   Icon: Clock },
    error:   { label: 'Error',     color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)',  Icon: XCircle },
  }[status];

  const cb = result ? confidenceBand(result.confidence) : null;

  return (
    <div style={{
      background: 'rgba(15,23,42,0.8)',
      border: `1px solid ${result ? `${agent.color}20` : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 14, overflow: 'hidden',
      transition: 'border-color 0.2s',
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
        {/* Agent icon */}
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: result ? `${agent.color}15` : 'rgba(30,41,59,0.5)',
          border: `1px solid ${result ? `${agent.color}30` : 'rgba(255,255,255,0.06)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          {isRunning ? (
            <div style={{
              width: 22, height: 22,
              border: `2px solid ${agent.color}40`,
              borderTopColor: agent.color,
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
          ) : (
            <Icon size={20} style={{ color: result ? agent.color : '#334155' }} />
          )}
          {/* Step number */}
          <div style={{
            position: 'absolute', bottom: -4, right: -4,
            width: 16, height: 16, borderRadius: '50%',
            background: result ? agent.color : '#1e293b',
            border: '1.5px solid #060d1a',
            fontSize: '0.6rem', fontWeight: 800, color: result ? '#fff' : '#475569',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {agent.num}
          </div>
        </div>

        {/* Name + desc */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: result ? '#f1f5f9' : '#475569', marginBottom: 3 }}>
            {agent.label}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#334155', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {agent.desc}
          </div>
        </div>

        {/* Status + confidence */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {cb && (
            <div style={{
              fontSize: '0.7rem', fontWeight: 700, padding: '3px 9px',
              borderRadius: 99, color: cb.color, background: cb.bg,
            }}>
              {Math.round(result!.confidence * 100)}%
            </div>
          )}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: '0.7rem', fontWeight: 700, padding: '3px 9px', borderRadius: 99,
            letterSpacing: '0.04em', textTransform: 'uppercase',
            color: statusMeta.color, background: statusMeta.bg, border: `1px solid ${statusMeta.border}`,
          }}>
            {isRunning && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#3b82f6', animation: 'pulse-ring 1.2s infinite' }} />}
            {statusMeta.label}
          </div>
          {result && (
            expanded ? <ChevronUp size={14} style={{ color: '#475569' }} /> : <ChevronDown size={14} style={{ color: '#475569' }} />
          )}
        </div>
      </div>

      {/* Warnings strip */}
      {result?.warnings && result.warnings.length > 0 && (
        <div style={{
          margin: '0 18px 12px', padding: '8px 12px', borderRadius: 8,
          background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
        }}>
          {result.warnings.map((w, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.75rem', color: '#d97706', lineHeight: 1.5 }}>
              <AlertTriangle size={12} style={{ marginTop: 2, flexShrink: 0 }} />
              {w}
            </div>
          ))}
        </div>
      )}

      {/* Expanded evidence */}
      {expanded && result && (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          padding: '14px 18px',
          animation: 'fadeIn 0.2s ease',
        }}>
          {result.evidence.map((ev, i) => (
            <div key={i} style={{
              marginBottom: i < result.evidence.length - 1 ? 10 : 0,
              padding: '10px 12px', borderRadius: 8,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {ev.source}
                </span>
                <button
                  onClick={() => copyRef(ev.raw_reference, i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: '0.7rem', color: copied === i ? '#10b981' : '#475569',
                    background: 'none', border: 'none', cursor: 'pointer',
                    transition: 'color 0.15s',
                  }}
                >
                  {copied === i ? <Check size={11} /> : <Copy size={11} />}
                  {copied === i ? 'Copied' : 'Copy ref'}
                </button>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.5, wordBreak: 'break-all' }}>
                {ev.raw_reference}
              </p>
              <div style={{ marginTop: 6, fontSize: '0.68rem', color: '#334155', fontFamily: 'JetBrains Mono, monospace' }}>
                {ev.timestamp.slice(0, 19).replace('T', ' ')} UTC
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
    <div>
      {/* Overall confidence */}
      {overallBand && (
        <div style={{
          marginBottom: 20, padding: '14px 18px',
          background: overallBand === 'green' ? 'rgba(16,185,129,0.06)' : overallBand === 'yellow' ? 'rgba(245,158,11,0.06)' : 'rgba(239,68,68,0.06)',
          border: `1px solid ${overallBand === 'green' ? 'rgba(16,185,129,0.2)' : overallBand === 'yellow' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}`,
          borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
            background: overallBand === 'green' ? '#10b981' : overallBand === 'yellow' ? '#f59e0b' : '#ef4444',
          }} />
          <div>
            <span style={{
              fontSize: '0.8rem', fontWeight: 700,
              color: overallBand === 'green' ? '#10b981' : overallBand === 'yellow' ? '#f59e0b' : '#ef4444',
            }}>
              {overallBand === 'green' ? 'High Confidence Audit' : overallBand === 'yellow' ? 'Medium Confidence — Review Recommended' : 'Low Confidence — Expert Review Required'}
            </span>
            <span style={{ fontSize: '0.78rem', color: '#475569', marginLeft: 10 }}>
              Confidence band: <strong style={{ color: '#94a3b8', textTransform: 'uppercase' }}>{overallBand}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Agent cards */}
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
