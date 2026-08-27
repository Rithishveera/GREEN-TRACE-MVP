import React from 'react';
import { Download, Lock, FileCheck, ExternalLink } from 'lucide-react';
import { getDossierDownloadUrl } from '../api/client';
import { RunStatusResponse } from '../types/schemas';

interface DossierDownloadButtonProps {
  status: RunStatusResponse;
  onViewDossier?: () => void;
}

export const DossierDownloadButton: React.FC<DossierDownloadButtonProps> = ({ status, onViewDossier }) => {
  const isConfirmed = status.state === 'reviewed_confirmed';
  const downloadUrl = getDossierDownloadUrl(status.run_id);

  if (!isConfirmed) {
    return (
      <div className="flex items-center gap-2">
        <button
          disabled
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700/80 cursor-not-allowed flex items-center gap-1.5 opacity-60"
          title="Dossier generation is locked until Human Review confirmation."
        >
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>Dossier Locked (Pending Review)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {onViewDossier ? (
        <button
          onClick={onViewDossier}
          className="btn-secondary text-xs px-3 py-1.5"
          title="Inspect generated PDF dossier directly in GreenTrace"
        >
          <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>View Dossier</span>
        </button>
      ) : (
        <a
          href={downloadUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary text-xs px-3 py-1.5"
        >
          <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
          <span>Preview PDF</span>
        </a>
      )}

      <a
        href={downloadUrl}
        download={`GreenTrace_Dossier_${status.run_id}.pdf`}
        className="btn-primary text-xs px-3 py-1.5"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Download PDF</span>
      </a>
    </div>
  );
};

