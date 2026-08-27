import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, AlertCircle, Sparkles } from 'lucide-react';
import { ingestPdf, ingestDemoPdf } from '../api/client';
import { IngestResponse } from '../types/schemas';

interface UploadZoneProps {
  onIngestSuccess: (res: IngestResponse) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onIngestSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a valid Environmental Clearance PDF document.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await ingestPdf(file);
      onIngestSuccess(res);
    } catch (err: any) {
      setError(err.message || 'Failed to ingest Environmental Clearance PDF.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSampleDemo = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ingestDemoPdf();
      onIngestSuccess(res);
    } catch (err: any) {
      setError(err.message || 'Failed to trigger demo clearance document.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div
        className={`glass-panel p-8 text-center transition-all duration-300 ${
          isDragging
            ? 'border-emerald-400 bg-emerald-950/20 scale-[1.01]'
            : 'border-slate-700/60'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        style={{
          borderStyle: isDragging ? 'dashed' : 'solid',
          borderWidth: '2px',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-glow mb-1">
            {loading ? (
              <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <UploadCloud className="w-8 h-8" />
            )}
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-100 mb-1">
              Upload Environmental Clearance (EC) Letter
            </h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Drop official MoEFCC / SEIAA approval PDF. Our multi-agent system will extract legal clauses, query PARIVESH, establish satellite ground truth, and calculate spatial discrepancies.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="btn-primary"
            >
              <FileText className="w-4 h-4" />
              <span>Browse PDF Document</span>
            </button>

            <button
              onClick={handleSampleDemo}
              disabled={loading}
              className="btn-secondary text-emerald-400 hover:text-emerald-300"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Load Verified Demo EC</span>
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="text-xs text-slate-500 pt-2 flex items-center justify-center gap-4">
            <span>• Single EC PDF ingestion</span>
            <span>• Direct geospatial UTM buffering</span>
            <span>• Deterministic confidence scoring</span>
          </div>
        </div>
      </div>
    </div>
  );
};
