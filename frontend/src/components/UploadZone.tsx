import React, { useState, useRef } from 'react';
import { FileUp, FileText, AlertCircle, Sparkles, CheckCircle2, X } from 'lucide-react';
import { ingestPdf, ingestDemoPdf } from '../api/client';
import { IngestResponse } from '../types/schemas';

interface UploadZoneProps {
  onIngestSuccess: (res: IngestResponse) => void;
}

const STEPS = [
  'Registering clearance document in ledger…',
  'Extracting GPS coordinates & statutory clauses…',
  'Initializing multi-agent audit pipeline…',
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
      setError('Please submit an authentic Environmental Clearance PDF document.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('Document file size exceeds the 50 MB registry limit.');
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
      setError(err.message || 'Failed to ingest and parse the Environmental Clearance document.');
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
      setError(err.message || 'Failed to load demo clearance grant.');
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
          ? 'var(--bg-surface-elevated)'
          : 'var(--bg-card)',
        border: `2px dashed ${isDragging ? 'var(--border-focus)' : 'var(--border-medium)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '36px 32px',
        transition: 'all 0.15s ease',
        boxShadow: isDragging ? 'var(--shadow-md)' : 'var(--shadow-sm)',
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

      {/* Upload icon insignia */}
      <div style={{
        display: 'flex', justifyContent: 'center', marginBottom: 18,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-medium)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {loading ? (
            <div style={{
              width: 24, height: 24,
              border: '2px solid var(--border-medium)',
              borderTopColor: 'var(--text-primary)',
              borderRadius: 'var(--radius-full)',
              animation: 'spin 0.8s linear infinite',
            }} />
          ) : (
            <FileUp size={24} style={{ color: 'var(--text-primary)' }} />
          )}
        </div>
      </div>

      {/* Headings */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
          {loading ? 'Processing Document Ingestion' : 'Submit Environmental Clearance Document'}
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 460, margin: '0 auto' }}>
          {loading
            ? STEPS[stepIdx]
            : 'Drop an official MoEFCC / SEIAA approval grant PDF here, or select from local storage. Limit 50 MB.'}
        </p>
      </div>

      {/* Ingestion progress note */}
      {loading && (
        <div style={{ marginBottom: 20, textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-medium)',
            padding: '8px 18px', borderRadius: 'var(--radius-sm)',
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              ↳ {STEPS[stepIdx]}
            </span>
          </div>
        </div>
      )}

      {/* Selected file preview */}
      {selectedFile && !loading && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: 16,
          background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-medium)',
        }}>
          <FileText size={16} style={{ color: 'var(--text-primary)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedFile.name}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
            {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
          </span>
          <button onClick={() => setSelectedFile(null)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>
            <X size={13} />
          </button>
        </div>
      )}

      {/* Buttons */}
      {!loading && (
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary"
            style={{ padding: '10px 22px' }}
          >
            <FileText size={15} />
            <span>Select PDF Grant</span>
          </button>
          <button
            onClick={handleDemo}
            className="btn-secondary"
            style={{ padding: '10px 20px' }}
          >
            <Sparkles size={14} style={{ color: 'var(--text-secondary)' }} />
            <span>Load Demo Grant (Bhadra Steel)</span>
          </button>
        </div>
      )}

      {/* Error notification */}
      {error && (
        <div style={{
          marginTop: 16, padding: '12px 14px', borderRadius: 'var(--radius-sm)',
          background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger)',
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <AlertCircle size={15} style={{ color: 'var(--status-danger)', flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: '0.82rem', color: 'var(--status-danger)', lineHeight: 1.5 }}>{error}</span>
        </div>
      )}

      {/* Statutory Features strip */}
      {!loading && (
        <div style={{
          marginTop: 24, paddingTop: 16,
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 20,
        }}>
          {['PDF Verbatim Condition Parsing', 'Vector Hydrology Setbacks', 'Deterministic Scoring & Provenance'].map(feat => (
            <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              <CheckCircle2 size={12} style={{ color: 'var(--text-primary)' }} />
              <span>{feat}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

