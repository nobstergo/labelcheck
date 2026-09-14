import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Eye, EyeOff, Tag } from 'lucide-react';
import { BoundingBox, ExtractedField, RuleEvaluation } from '../types';

interface ImageViewerProps {
  imageUrl: string;
  fields: Record<string, ExtractedField>;
  evaluations: RuleEvaluation[];
  selectedRuleCode: string | null;
  onSelectRule: (ruleCode: string) => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  imageUrl,
  fields,
  evaluations,
  selectedRuleCode,
  onSelectRule
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showBoxes, setShowBoxes] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [hoveredBox, setHoveredBox] = useState<{
    ruleCode: string;
    ruleTitle: string;
    text: string;
    status: string;
    confidence: number;
    x: number;
    y: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom handlers
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3.5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.6));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Build box list mapped to evaluations
  const boxes = (Object.entries(fields) as [string, ExtractedField][])
    .filter(([_, field]) => field.bbox && field.rawValue.trim())
    .map(([ruleCode, field]) => {
      const evaluation = evaluations.find((e) => e.ruleCode === ruleCode);
      const bbox = field.bbox as BoundingBox;
      const isSelected = selectedRuleCode === ruleCode;
      const status = evaluation?.status || 'REVIEW';

      let borderColor = '#3B82F6';
      let fillColor = 'rgba(59, 130, 246, 0.12)';
      let badgeBg = '#2563EB';

      if (status === 'PASS') {
        borderColor = '#059669';
        fillColor = 'rgba(5, 150, 105, 0.12)';
        badgeBg = '#059669';
      } else if (status === 'REVIEW') {
        borderColor = '#D97706';
        fillColor = 'rgba(217, 119, 6, 0.14)';
        badgeBg = '#D97706';
      } else if (status === 'MISSING') {
        borderColor = '#DC2626';
        fillColor = 'rgba(220, 38, 38, 0.14)';
        badgeBg = '#DC2626';
      }

      if (isSelected) {
        borderColor = '#1E3A8A';
        fillColor = 'rgba(30, 58, 138, 0.25)';
        badgeBg = '#1E3A8A';
      }

      return {
        ruleCode,
        title: evaluation?.ruleTitle || ruleCode,
        citation: evaluation?.citation || '',
        text: field.rawValue,
        confidence: field.confidence,
        status,
        bbox,
        isSelected,
        borderColor,
        fillColor,
        badgeBg
      };
    });

  return (
    <div
      id="visual-evidence-viewer"
      className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden flex flex-col h-full min-h-[520px] shadow-sm select-none"
    >
      {/* Top Toolbar */}
      <div className="bg-slate-950/80 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200">Label View</span>
          <span className="text-slate-500">|</span>
          <span className="text-[11px] text-slate-400">
            {boxes.length} fields detected
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Toggle Bounding Boxes */}
          <button
            id="btn-toggle-boxes"
            type="button"
            onClick={() => setShowBoxes(!showBoxes)}
            className={`p-1.5 rounded hover:bg-slate-800 transition-colors flex items-center gap-1 text-[11px] ${
              showBoxes ? 'text-emerald-400 bg-slate-800/60' : 'text-slate-400'
            }`}
            title="Toggle Bounding Boxes"
          >
            {showBoxes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Boxes</span>
          </button>

          {/* Toggle Labels */}
          <button
            id="btn-toggle-labels"
            type="button"
            onClick={() => setShowLabels(!showLabels)}
            className={`p-1.5 rounded hover:bg-slate-800 transition-colors flex items-center gap-1 text-[11px] ${
              showLabels ? 'text-emerald-400 bg-slate-800/60' : 'text-slate-400'
            }`}
            title="Toggle Rule Labels"
          >
            <Tag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Labels</span>
          </button>

          <span className="text-slate-700">|</span>

          {/* Zoom controls */}
          <button
            id="btn-zoom-out"
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] text-slate-400 w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            id="btn-zoom-in"
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            id="btn-zoom-reset"
            type="button"
            onClick={handleResetZoom}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Reset View"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden p-4 ${
          zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
        }`}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out'
          }}
          className="relative max-w-full max-h-full inline-block shadow-2xl rounded-sm"
        >
          {/* Base Product Label Image */}
          <img
            src={imageUrl}
            alt="Packaged commodity label"
            className="max-h-[640px] w-auto object-contain block rounded-sm pointer-events-none"
          />

          {/* SVG Bounding Box Layer */}
          {showBoxes && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-auto"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {boxes.map((box) => {
                const width = Math.max(box.bbox.xmax - box.bbox.xmin, 2);
                const height = Math.max(box.bbox.ymax - box.bbox.ymin, 2);

                return (
                  <g key={box.ruleCode} className="cursor-pointer">
                    {/* Bounding Box Rect */}
                    <rect
                      x={`${box.bbox.xmin}%`}
                      y={`${box.bbox.ymin}%`}
                      width={`${width}%`}
                      height={`${height}%`}
                      fill={box.fillColor}
                      stroke={box.borderColor}
                      strokeWidth={box.isSelected ? '0.6' : '0.35'}
                      strokeDasharray={box.isSelected ? 'none' : undefined}
                      rx="0.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRule(box.ruleCode);
                      }}
                      onMouseEnter={(e) => {
                        const rect = containerRef.current?.getBoundingClientRect();
                        if (rect) {
                          setHoveredBox({
                            ruleCode: box.ruleCode,
                            ruleTitle: box.title,
                            text: box.text,
                            status: box.status,
                            confidence: box.confidence,
                            x: e.clientX - rect.left,
                            y: e.clientY - rect.top
                          });
                        }
                      }}
                      onMouseLeave={() => setHoveredBox(null)}
                      className="transition-all hover:opacity-90"
                    />

                    {/* Corner Reticle on Selected Box */}
                    {box.isSelected && (
                      <>
                        <circle
                          cx={`${box.bbox.xmin}%`}
                          cy={`${box.bbox.ymin}%`}
                          r="0.8"
                          fill="#FFFFFF"
                          stroke={box.borderColor}
                          strokeWidth="0.3"
                        />
                        <circle
                          cx={`${box.bbox.xmax}%`}
                          cy={`${box.bbox.ymax}%`}
                          r="0.8"
                          fill="#FFFFFF"
                          stroke={box.borderColor}
                          strokeWidth="0.3"
                        />
                      </>
                    )}
                  </g>
                );
              })}
            </svg>
          )}

          {/* HTML Overlay for Text Labels (Crisp scaling) */}
          {showBoxes && showLabels && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {boxes.map((box) => (
                <div
                  key={`lbl-${box.ruleCode}`}
                  style={{
                    left: `${box.bbox.xmin}%`,
                    top: `${Math.max(box.bbox.ymin - 3, 0)}%`,
                    transform: 'translateY(-100%)'
                  }}
                  className="absolute pointer-events-auto"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectRule(box.ruleCode);
                    }}
                    style={{ backgroundColor: box.badgeBg }}
                    className={`text-[9px] font-mono font-bold text-white px-1.5 py-0.2 rounded shadow-xs whitespace-nowrap flex items-center gap-1 cursor-pointer transition-transform hover:scale-105 ${
                      box.isSelected ? 'ring-2 ring-white scale-105' : 'opacity-90'
                    }`}
                  >
                    <span>{box.ruleCode}</span>
                    <span className="opacity-80 font-normal">[{box.citation}]</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hover Inspector Tooltip */}
        {hoveredBox && (
          <div
            style={{
              left: `${hoveredBox.x + 15}px`,
              top: `${hoveredBox.y + 15}px`
            }}
            className="absolute z-40 pointer-events-none bg-slate-900/95 border border-slate-700 text-white rounded-lg p-2.5 max-w-xs shadow-xl backdrop-blur-xs space-y-1 text-xs"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-slate-200">{hoveredBox.ruleCode}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                  hoveredBox.status === 'PASS'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : hoveredBox.status === 'REVIEW'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-rose-950 text-rose-300 border border-rose-800'
                }`}
              >
                {hoveredBox.status}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">{hoveredBox.ruleTitle}</p>
            <div className="bg-slate-950/80 p-1.5 rounded font-mono text-[11px] text-slate-200 border border-slate-800 break-words">
              {hoveredBox.text}
            </div>
            <div className="text-[10px] text-slate-400 text-right">
              Confidence: {Math.round(hoveredBox.confidence * 100)}%
            </div>
          </div>
        )}
      </div>

      {/* Bottom Hint */}
      <div className="bg-slate-950 border-t border-slate-800 px-4 py-2 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            Pass
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            Review Needed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
            Missing
          </span>
        </div>
        <span className="hidden sm:inline text-slate-500 font-mono text-[10px]">
          Click any box to inspect details
        </span>
      </div>
    </div>
  );
};
