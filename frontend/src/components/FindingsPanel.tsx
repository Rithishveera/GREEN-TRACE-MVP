import React from 'react';
import { 
  Building2, 
  FileText, 
  MapPin, 
  ShieldCheck, 
  Waves, 
  ExternalLink 
} from 'lucide-react';
import { RunStatusResponse, ECCondition } from '../types/schemas';

interface FindingsPanelProps {
  status: RunStatusResponse;
}

export const FindingsPanel: React.FC<FindingsPanelProps> = ({ status }) => {
  const a1 = status.agent1?.data;
  const a2 = status.agent2?.data;
  const a3 = status.agent3?.data;

  return (
    <div className="space-y-6">
      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>Project Name</span>
          </div>
          <div className="text-sm font-bold text-slate-100 line-clamp-2">
            {a1?.project_name || 'Extracting...'}
          </div>
          <div className="text-xs text-slate-500 font-mono">
            {a1?.file_number || 'N/A'}
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>Site Coordinates</span>
          </div>
          <div className="text-sm font-bold text-slate-100 font-mono">
            {a1?.primary_coordinate 
              ? `${a1.primary_coordinate[0].toFixed(4)}° N, ${a1.primary_coordinate[1].toFixed(4)}° E`
              : 'Extracting...'}
          </div>
          <div className="text-xs text-emerald-400">
            UTM: {a3?.utm_zone || 'Calculating...'}
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>PARIVESH Legal Status</span>
          </div>
          <div className="text-sm font-bold text-slate-100">
            {a2?.parivesh_status ? a2.parivesh_status.toUpperCase() : 'Verifying...'}
          </div>
          {a2?.portal_url && (
            <a
              href={a2.portal_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-sky-400 hover:underline flex items-center gap-1"
            >
              <span>MoEFCC Portal Link</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        <div className="glass-panel p-4 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
            <Waves className="w-4 h-4 text-emerald-400" />
            <span>Waterbody Ground Truth</span>
          </div>
          <div className="text-sm font-bold text-slate-100">
            {a3?.waterbody_name || 'Searching OSM...'}
          </div>
          <div className="text-xs text-slate-400">
            Buffer: <span className="font-bold text-slate-200">{a3?.buffer_distance_meters || 100}m</span>
          </div>
        </div>
      </div>

      {/* Clearance Conditions Table */}
      <div className="glass-panel p-6 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            Extracted Environmental Clearance Clauses ({a1?.conditions?.length || 0})
          </h4>
          <span className="text-xs text-slate-400">
            Approval Date: <span className="font-semibold text-slate-200 font-mono">{a1?.ec_approval_date || 'N/A'}</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold w-28">Condition ID</th>
                <th className="pb-3 font-semibold">Mandated Clearance Rule</th>
                <th className="pb-3 font-semibold w-36">Classification</th>
                <th className="pb-3 font-semibold w-32">Buffer Distance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {a1?.conditions && a1.conditions.length > 0 ? (
                a1.conditions.map((c: ECCondition, i: number) => (
                  <tr key={i} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 font-mono font-bold text-emerald-400">{c.condition_id}</td>
                    <td className="py-3 pr-4 leading-relaxed">{c.text}</td>
                    <td className="py-3">
                      <span
                        className={`badge ${
                          c.condition_type === 'quantitative_spatial'
                            ? 'badge-success'
                            : 'badge-info'
                        }`}
                      >
                        {c.condition_type === 'quantitative_spatial' ? 'Quantitative Spatial' : 'Qualitative'}
                      </span>
                    </td>
                    <td className="py-3 font-mono font-semibold text-slate-200">
                      {c.buffer_distance_meters ? `${c.buffer_distance_meters} meters` : 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-slate-500">
                    Awaiting Agent 1 extraction...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
