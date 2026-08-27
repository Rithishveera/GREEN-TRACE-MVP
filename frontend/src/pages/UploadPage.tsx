import React from 'react';
import { UploadZone } from '../components/UploadZone';
import { IngestResponse } from '../types/schemas';
import { ShieldCheck, Satellite, Compass, FileCheck } from 'lucide-react';

interface UploadPageProps {
  onIngestSuccess: (res: IngestResponse) => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({ onIngestSuccess }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-10 py-6">
      {/* Hero Title */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
          <span>AI Autonomous Regulatory Auditing</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
          Environmental Clearance <span className="text-emerald-400">Discrepancy Detection</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Upload MoEFCC / SEIAA approval documents to initiate autonomous multi-agent verification, satellite spectral audit, and legal evidence compilation.
        </p>
      </div>

      {/* Upload Zone */}
      <UploadZone onIngestSuccess={onIngestSuccess} />

      {/* 4-Agent Pipeline Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
        <div className="glass-panel p-4 text-center space-y-2 border-slate-800">
          <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <FileCheck className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-xs text-slate-200">1. Paralegal Agent</h4>
          <p className="text-[11px] text-slate-400">
            Extracts project metadata, coordinates, and spatial buffer conditions.
          </p>
        </div>

        <div className="glass-panel p-4 text-center space-y-2 border-slate-800">
          <div className="w-10 h-10 mx-auto rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-xs text-slate-200">2. Legal Validator</h4>
          <p className="text-[11px] text-slate-400">
            Queries PARIVESH portal registry & tracks amendment history.
          </p>
        </div>

        <div className="glass-panel p-4 text-center space-y-2 border-slate-800">
          <div className="w-10 h-10 mx-auto rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Compass className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-xs text-slate-200">3. Geospatial Scout</h4>
          <p className="text-[11px] text-slate-400">
            Overpass OSM geometry & UTM metric buffer calculations.
          </p>
        </div>

        <div className="glass-panel p-4 text-center space-y-2 border-slate-800">
          <div className="w-10 h-10 mx-auto rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <Satellite className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-xs text-slate-200">4. Satellite Analyst</h4>
          <p className="text-[11px] text-slate-400">
            Sentinel-2 NDBI delta spectral audit & discrepancy mask generation.
          </p>
        </div>
      </div>
    </div>
  );
};
