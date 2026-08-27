import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, AlertCircle, Sparkles, CheckCircle2, X } from 'lucide-react';
import { ingestPdf, ingestDemoPdf } from '../api/client';
import { IngestResponse } from '../types/schemas';

interface UploadZoneProps {
  onIngestSuccess: (res: IngestResponse) => void;
}

const STEPS = [
  'Uploading & validating PDF structure…',
  'Extracting coordinates & legal conditions…',
  'Spawning autonomous agent pipeline…',
];

export const UploadZone: React.FC<UploadZoneProps> = ({ onIngestSuccess }) => {
  const [isDragging, setIsDragging]   = useState(false);
  const [loading, setLoading]         = useState(false);
  const [stepIdx, setStepIdx]         = useState(0);
  const [error, setError]             = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a valid Environmental Clearance PDF document.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('File size exceeds the 50 MB limit.');
      return;
    }

    setSelectedFile(file);
    setLoading(true);
    setStepIdx(0);
    setError(null);

    const t1 = setTimeout(() => setStepIdx(1), 900);
    const t2 = setTimeout(() => setStepIdx(2), 2200);

    try {
      const res = await ingestPdf(file);
      onIngestSuccess(res);
    } catch (err: any) {
      setError(err.message || 'Failed to ingest the Environmental Clearance PDF.');
    } finally {
      clearTimeout(t1); clearTimeout(t2);
      setLoading(false);
      setStepIdx(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleDemo = async () => {
    setLoading(true);
    setStepIdx(0);
    setError(null);
    setSelectedFile(null);

    const t1 = setTimeout(() => setStepIdx(1), 800);
    const t2 = setTimeout(() => setStepIdx(2), 2000);

    try {
      const res = await ingestDemoPdf();
      onIngestSuccess(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load demo clearance.');
    } finally {
      clearTimeout(t1); clearTimeout(t2);
      setLoading(false);
      setStepIdx(0);
    }
  };

  return (
    <div
      style={{
        background: isDragging
          ? 'rgba(16,185,129,0.06)'
          : 'rgba(15,23,42,0.7)',
        border: `2px ${isDragging ? 'dashed' : 'solid'} ${isDragging ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 20,
        padding: '36px 32px',
        transition: 'all 0.25s ease',
        transform: isDragging ? 'scale(1.01)' : 'scale(1)',
        boxShadow: isDragging ? '0 0 40px rgba(16,185,129,0.12)' : 'none',
      }}
      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        style={{ display: 'none' }}
        onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
      />

      {/* Upload icon */}
      <div style={{
        display: 'flex', justifyContent: 'center', marginBottom: 20,
      }}>
        <div style={{
          width: 68, height: 68, borderRadius: 20,
          background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: loading ? '0 0 24px rgba(16,185,129,0.2)' : 'none',
          transition: 'all 0.3s',
        }}>
          {loading ? (
            <div style={{
              width: 28, height: 28,
              border: '3px solid rgba(16,185,129,0.3)',
              borderTopColor: '#10b981',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
          ) : (
            <UploadCloud size={28} style={{ color: '#10b981' }} />
          )}
        </div>
      </div>

      {/* Text */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f1f5f9', marginBottom: 8, letterSpacing: '-0.01em' }}>
          {loading ? 'Processing Clearance Document' : 'Upload EC Document'}
        </h3>
        <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.6, maxWidth: 400, margin: '0 auto' }}>
          {loading
            ? STEPS[stepIdx]
            : 'Drop your MoEFCC / SEIAA approval PDF here, or browse to select. Max 50 MB.'}
        </p>
      </div>

      {/* Loading progress */}
      {loading && (
        <div style={{ marginBottom: 20 }}>
          <div style={{
            background: 'rgba(16,185,129,0.08)', borderRadius: 8,
            padding: '8px 16px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#10b981', animation: 'pulse-ring 1.5s infinite',
            }} />
            <span style={{ fontSize: '0.8rem', color: '#34d399', fontFamily: 'JetBrains Mono, monospace' }}>
              {STEPS[stepIdx]}
            </span>
          </div>
          {/* Step dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 10 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{
                width: i <= stepIdx ? 20 : 6, height: 6, borderRadius: 3,
                background: i <= stepIdx ? '#10b981' : 'rgba(255,255,255,0.1)',
                transition: 'all 0.4s',
              }} />
            ))}
          </div>
        </div>
      )}

      {/* Selected file preview */}
      {selectedFile && !loading && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', borderRadius: 10, marginBottom: 16,
          background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
        }}>
          <FileText size={16} style={{ color: '#10b981', flexShrink: 0 }} />
          <span style={{ fontSize: '0.8rem', color: '#e2e8f0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedFile.name}
          </span>
          <span style={{ fontSize: '0.7rem', color: '#475569', flexShrink: 0 }}>
            {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
          </span>
          <button onClick={() => setSelectedFile(null)} style={{ color: '#475569', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>
            <X size={12} />
          </button>
        </div>
      )}

      {/* Buttons */}
      {!loading && (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary"
          >
            <FileText size={15} />
            <span>Browse PDF</span>
          </button>
          <button
            onClick={handleDemo}
            className="btn-secondary"
            style={{ borderColor: 'rgba(16,185,129,0.25)', color: '#34d399' }}
          >
            <Sparkles size={15} style={{ color: '#10b981' }} />
            <span>Load Demo EC</span>
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          marginTop: 16, padding: '12px 14px', borderRadius: 10,
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <AlertCircle size={15} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: '0.8rem', color: '#fca5a5', lineHeight: 1.5 }}>{error}</span>
        </div>
      )}

      {/* Footer features */}
      {!loading && (
        <div style={{
          marginTop: 20, paddingTop: 16,
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16,
        }}>
          {['Single EC PDF', 'UTM Metric Buffering', 'Deterministic Scoring'].map(feat => (
            <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: '#334155' }}>
              <CheckCircle2 size={12} style={{ color: '#10b981' }} />
              {feat}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
