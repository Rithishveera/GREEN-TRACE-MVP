import React from 'react';
import { Download, ArrowLeft, ShieldCheck } from 'lucide-react';
import { getDossierDownloadUrl } from '../api/client';
import { RunStatusResponse } from '../types/schemas';

interface DossierPageProps {
  status: RunStatusResponse;
  onBack: () => void;
}

export const DossierPage: React.FC<DossierPageProps> = ({ status, onBack }) => {
  const downloadUrl = getDossierDownloadUrl(status.run_id);

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Official Environmental Discrepancy Evidence Dossier
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Run #{status.run_id} • Signed by {status.reviewer_name || 'Auditor'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={downloadUrl}
            download={`GreenTrace_Dossier_${status.run_id}.pdf`}
            className="btn-primary"
          >
            <Download className="w-4 h-4" />
            <span>Download Signed PDF</span>
          </a>
        </div>
      </div>

      <div className="w-full h-[750px] rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
        <iframe
          src={downloadUrl}
          title="GreenTrace Dossier PDF Viewer"
          className="w-full h-full"
        />
      </div>
    </div>
  );
};
