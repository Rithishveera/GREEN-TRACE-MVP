import React, { useState } from 'react';
import { 
  FileSearch, 
  ShieldCheck, 
  Compass, 
  Satellite, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  ChevronRight,
  Layers,
  Database
} from 'lucide-react';
import { RunStatusResponse, AgentResult } from '../types/schemas';

interface AgentStatusTrackerProps {
  status: RunStatusResponse;
}

export const AgentStatusTracker: React.FC<AgentStatusTrackerProps> = ({ status }) => {
  const [selectedAgent, setSelectedAgent] = useState<AgentResult | null>(null);

  const agents = [
    {
      id: 'agent1',
      name: 'Agent 1 — Paralegal Extractor',
      desc: 'LLM & Regex extraction of project clauses & coordinates',
      icon: FileSearch,
      result: status.agent1,
      running: status.state === 'ingested',
    },
    {
      id: 'agent2',
      name: 'Agent 2 — Legal Validator',
      desc: 'PARIVESH portal registry & amendment verification',
      icon: ShieldCheck,
      result: status.agent2,
      running: status.state === 'agent1_done' || (status.state === 'processing' && !status.agent2),
    },
    {
      id: 'agent3',
      name: 'Agent 3 — Geospatial Scout',
      desc: 'Overpass OSM waterbody geometry & UTM metric buffer',
      icon: Compass,
      result: status.agent3,
      running: status.state === 'agent1_done' || (status.state === 'processing' && !status.agent3),
    },
    {
      id: 'agent4',
      name: 'Agent 4 — Satellite Analyst',
      desc: 'Sentinel-2/SAR fallback chain & NDBI spectral delta',
      icon: Satellite,
      result: status.agent4,
      running: status.state === 'processing' && status.agent3 && !status.agent4,
    },
  ];

  const getStatusBadge = (agentRes?: AgentResult, isRunning?: boolean) => {
    if (isRunning) {
      return (
        <span className="badge badge-info animate-pulse-subtle">
          <Clock className="w-3 h-3 animate-spin" /> In Progress
        </span>
      );
    }
    if (!agentRes) {
      return (
        <span className="badge" style={{ background: 'rgba(100, 116, 139, 0.2)', color: '#94a3b8' }}>
          Queued
        </span>
      );
    }
    if (agentRes.status === 'success') {
      return (
        <span className="badge badge-success">
          <CheckCircle className="w-3 h-3" /> Validated ({Math.round(agentRes.confidence * 100)}%)
        </span>
      );
    }
    if (agentRes.status === 'flagged') {
      return (
        <span className="badge badge-warning">
          <AlertTriangle className="w-3 h-3" /> Review Flag ({Math.round(agentRes.confidence * 100)}%)
        </span>
      );
    }
    return (
      <span className="badge badge-danger">
        <XCircle className="w-3 h-3" /> Failed
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            Autonomous Multi-Agent Pipeline
          </h3>
          <p className="text-xs text-slate-400">
            Real-time execution status and verifiable evidence provenance trail.
          </p>
        </div>

        {status.confidence_band && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700">
            <span className="text-xs font-semibold text-slate-400">Confidence Band:</span>
            <span
              className={`badge ${
                status.confidence_band === 'green'
                  ? 'badge-success'
                  : status.confidence_band === 'yellow'
                  ? 'badge-warning'
                  : 'badge-danger'
              }`}
            >
              ● {status.confidence_band.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {agents.map((a) => {
          const Icon = a.icon;
          return (
            <div
              key={a.id}
              onClick={() => a.result && setSelectedAgent(a.result)}
              className={`glass-panel p-4 rounded-xl transition-all cursor-pointer relative overflow-hidden ${
                selectedAgent?.agent === a.result?.agent
                  ? 'border-emerald-500 ring-1 ring-emerald-500/50'
                  : 'hover:border-slate-600'
              } ${a.running ? 'border-sky-500/50 bg-sky-950/10' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200">
                  <Icon className="w-5 h-5 text-emerald-400" />
                </div>
                {getStatusBadge(a.result, a.running)}
              </div>

              <h4 className="font-bold text-sm text-slate-100 mb-1">{a.name}</h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">{a.desc}</p>

              {a.result && (
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-emerald-400 font-medium">
                  <span>{a.result.evidence.length} Evidence Trace{a.result.evidence.length > 1 ? 's' : ''}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Evidence Inspection Modal / Drawer */}
      {selectedAgent && (
        <div className="glass-panel p-6 border-emerald-500/40 bg-slate-900/95 relative animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-100 text-base capitalize">
                  {selectedAgent.agent.replace('_', ' ')} — Evidence Provenance
                </h4>
                <p className="text-xs text-slate-400">
                  Verifiable agent observations and raw references.
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedAgent(null)}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Close Inspector
            </button>
          </div>

          <div className="space-y-4">
            {selectedAgent.warnings.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Agent Warnings:
                </div>
                {selectedAgent.warnings.map((w, i) => (
                  <div key={i} className="pl-5">• {w}</div>
                ))}
              </div>
            )}

            <div>
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Evidence Items ({selectedAgent.evidence.length})
              </h5>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {selectedAgent.evidence.map((ev, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-emerald-300">{ev.source}</span>
                      <span className="text-slate-500 font-mono text-[11px]">{ev.timestamp.slice(0, 19)}</span>
                    </div>
                    <div className="text-slate-300">
                      <span className="text-slate-500">Reference:</span> <span className="font-mono text-slate-200">{ev.raw_reference}</span>
                    </div>
                    {ev.details && (
                      <div className="p-2 rounded bg-slate-900 font-mono text-[11px] text-slate-400 overflow-x-auto">
                        <pre>{JSON.stringify(ev.details, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
