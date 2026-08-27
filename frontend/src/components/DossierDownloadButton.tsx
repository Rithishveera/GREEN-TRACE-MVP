import React from 'react';
import { Download, Lock, ExternalLink } from 'lucide-react';
import { getDossierDownloadUrl } from '../api/client';
import { RunStatusResponse } from '../types/schemas';

interface DossierDownloadButtonProps {
  status: RunStatusResponse;
}

export const DossierDownloadButton: React.FC<DossierDownloadButtonProps> = ({ status }) => {
  const isConfirmed = status.state === 'reviewed_confirmed';
  const downloadUrl = getDossierDownloadUrl(status.run_id);

  if (!isConfirmed) {
    return (
      <div className="flex items-center gap-3">
        <button
          disabled
          className="btn-primary opacity-50 cursor-not-allowed bg-slate-800 text-slate-400 border border-slate-700"
          title="Dossier generation is locked until Human Review confirmation."
        >
          <Lock className="w-4 h-4 text-amber-400" />
          <span>Dossier Locked (Pending Review)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <a
        href={downloadUrl}
        target="_blank"
        rel="noreferrer"
        className="btn-secondary text-slate-100"
      >
        <ExternalLink className="w-4 h-4 text-emerald-400" />
        <span>Preview Dossier PDF</span>
      </a>

      <a
        href={downloadUrl}
        download={`GreenTrace_Dossier_${status.run_id}.pdf`}
        className="btn-primary"
      >
        <Download className="w-4 h-4" />
        <span>Download Evidence Dossier</span>
      </a>
    </div>
  );
};
