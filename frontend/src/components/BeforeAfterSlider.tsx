import React, { useState, useRef, useCallback } from 'react';
import { Eye, Sliders } from 'lucide-react';
import { Agent4Data } from '../types/schemas';

interface BeforeAfterSliderProps {
  agent4Data?: Agent4Data;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({ agent4Data }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<'slider' | 'diff' | 'side-by-side'>('slider');
  const containerRef = useRef<HTMLDivElement>(null);

  const preImage = agent4Data?.pre_ec_thumbnail_url || '';
  const postImage = agent4Data?.post_ec_thumbnail_url || '';
  const diffImage = agent4Data?.change_heatmap_url || '';

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  return (
    <div className="glass-panel p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Eye className="w-5 h-5 text-emerald-400" />
            Satellite Ground-Truth Comparison
          </h3>
          <p className="text-xs text-slate-400">
            {agent4Data?.sensor_used || 'Sentinel-2'} spectral baseline comparison within protected 100m waterbody buffer.
          </p>
        </div>

        {/* Mode Toggle Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-900 border border-slate-800">
          <button
            onClick={() => setViewMode('slider')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              viewMode === 'slider'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Split Slider
          </button>
          <button
            onClick={() => setViewMode('diff')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              viewMode === 'diff'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Delta Mask Heatmap
          </button>
          <button
            onClick={() => setViewMode('side-by-side')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              viewMode === 'side-by-side'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Side-by-Side
          </button>
        </div>
      </div>

      {/* Main Imagery Canvas */}
      {viewMode === 'slider' && (
        <div
          ref={containerRef}
          className="relative w-full aspect-[16/10] max-h-[440px] rounded-xl overflow-hidden border border-slate-700 select-none cursor-ew-resize bg-slate-950"
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onMouseMove={handleMouseMove}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          onTouchMove={handleTouchMove}
        >
          {/* Post-EC Image (Background full layer) */}
          <img
            src={postImage}
            alt="Post-EC Satellite Audit"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />

          {/* Pre-EC Image (Clipped overlay) */}
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              src={preImage}
              alt="Pre-EC Satellite Baseline"
              className="absolute inset-0 w-full h-full object-cover max-w-none"
              style={{
                width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
                height: '100%',
              }}
            />
          </div>

          {/* Divider Line & Handle */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-emerald-400 cursor-ew-resize shadow-[0_0_12px_rgba(16,185,129,0.8)]"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-900 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-lg">
              <Sliders className="w-4 h-4" />
            </div>
          </div>

          {/* Bottom Labels */}
          <div className="absolute bottom-3 left-3 pointer-events-none px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800 text-[11px] font-bold text-emerald-400">
            PRE-EC BASELINE ({agent4Data?.pre_ec_date || 'Baseline'})
          </div>

          <div className="absolute bottom-3 right-3 pointer-events-none px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800 text-[11px] font-bold text-rose-400">
            POST-EC AUDIT ({agent4Data?.post_ec_date || 'Audit'})
          </div>
        </div>
      )}

      {viewMode === 'diff' && (
        <div className="relative w-full aspect-[16/10] max-h-[440px] rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
          <img
            src={diffImage || postImage}
            alt="Delta NDBI Spectral Discrepancy Mask"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-slate-950/90 border border-slate-800 text-xs text-amber-300 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
            <span>Hotspots indicate NDBI delta &gt; 0.15 (Unauthorized Built-Up Encroachment)</span>
          </div>
        </div>
      )}

      {viewMode === 'side-by-side' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-emerald-400">PRE-EC BASELINE ({agent4Data?.pre_ec_date})</div>
            <div className="aspect-[4/3] rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
              <img src={preImage} alt="Pre-EC" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-rose-400">POST-EC AUDIT ({agent4Data?.post_ec_date})</div>
            <div className="aspect-[4/3] rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
              <img src={postImage} alt="Post-EC" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      )}

      {/* Satellite Spectral Metrics Bar */}
      {agent4Data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">Buffer Zone Area</div>
            <div className="text-base font-bold text-slate-100 font-mono">
              {agent4Data.buffer_total_area_m2.toLocaleString()} m²
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">Discrepancy Detected</div>
            <div className={`text-base font-bold font-mono ${agent4Data.discrepancy_detected ? 'text-rose-400' : 'text-emerald-400'}`}>
              {agent4Data.change_area_m2.toLocaleString()} m²
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">Buffer Encroachment %</div>
            <div className="text-base font-bold text-amber-400 font-mono">
              {agent4Data.change_percentage}%
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">Spectral Index</div>
            <div className="text-base font-bold text-emerald-400 font-mono">
              {agent4Data.index_computed.split(' ')[0]}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
