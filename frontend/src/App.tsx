import React, { useState, useEffect } from 'react';
import { UploadPage } from './pages/UploadPage';
import { DraftReviewPage } from './pages/DraftReviewPage';
import { useTheme } from './theme/ThemeProvider';
import { listRuns } from './api/client';
import { IngestResponse, RunStatusResponse } from './types/schemas';
import { 
  TreePine, 
  History, 
  ChevronDown
} from 'lucide-react';

export const App: React.FC = () => {
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [runsHistory, setRunsHistory] = useState<RunStatusResponse[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const { theme, setTheme } = useTheme();

  const loadHistory = async () => {
    try {
      const runs = await listRuns();
      setRunsHistory(runs);
    } catch (err) {
      console.error('Failed to load runs history:', err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [currentRunId]);

  const handleIngestSuccess = (res: IngestResponse) => {
    setCurrentRunId(res.run_id);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-app)] text-[var(--text-primary)]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[var(--bg-surface)]/80 border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div
            onClick={() => setCurrentRunId(null)}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shadow-glow">
              <TreePine className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight text-slate-100 flex items-center gap-1.5">
                <span>Green</span><span className="text-emerald-400">Trace</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  MVP
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Environmental Clearance Discrepancy Detection</p>
            </div>
          </div>

          {/* Right Navigation Controls */}
          <div className="flex items-center gap-3">
            {/* History Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowHistory(!showHistory);
                  loadHistory();
                }}
                className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
              >
                <History className="w-3.5 h-3.5 text-slate-400" />
                <span>Audit History</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showHistory && (
                <div className="absolute right-0 mt-2 w-80 glass-panel p-3 border-slate-700 bg-slate-900/95 shadow-2xl z-50 space-y-2 max-h-96 overflow-y-auto">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                    Recent Runs ({runsHistory.length})
                  </div>
                  {runsHistory.length === 0 ? (
                    <div className="text-xs text-slate-500 p-2 text-center">No previous audits found.</div>
                  ) : (
                    runsHistory.map((r) => (
                      <div
                        key={r.run_id}
                        onClick={() => {
                          setCurrentRunId(r.run_id);
                          setShowHistory(false);
                        }}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                          currentRunId === r.run_id
                            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-semibold">{r.run_id}</span>
                          <span className="text-[10px] uppercase font-bold text-slate-500">{r.state}</span>
                        </div>
                        <div className="text-slate-400 truncate text-[11px]">{r.filename}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Theme Picker */}
            <div className="flex items-center p-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <button
                onClick={() => setTheme('civic')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                  theme === 'civic' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="GreenTrace Civic Palette"
              >
                Civic
              </button>
              <button
                onClick={() => setTheme('forest')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                  theme === 'forest' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Nordic Forest Palette"
              >
                Forest
              </button>
              <button
                onClick={() => setTheme('slate')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                  theme === 'slate' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Clean Slate Palette"
              >
                Slate
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Page Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentRunId ? (
          <DraftReviewPage
            runId={currentRunId}
            onBackToUpload={() => setCurrentRunId(null)}
          />
        ) : (
          <UploadPage onIngestSuccess={handleIngestSuccess} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>GreenTrace MVP — Multi-Agent Evidence-Generation System</span>
          <span>FastAPI • GEE Sentinel-2 • Overpass OSM • Gemini LLM • ReportLab</span>
        </div>
      </footer>
    </div>
  );
};
