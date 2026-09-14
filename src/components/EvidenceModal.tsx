import React, { useState } from 'react';
import { InspectionResult } from '../types';
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldAlert,
  CheckCheck,
  RotateCcw,
  Sparkles,
  Layers,
  FileCheck
} from 'lucide-react';

interface EvidenceModalProps {
  result: InspectionResult | null;
  isOpen: boolean;
  onClose: () => void;
  onResolveDiscrepancy?: (recordId: string, reason?: string) => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  result,
  isOpen,
  onClose,
  onResolveDiscrepancy
}) => {
  const [overrideReason, setOverrideReason] = useState<string>(
    'Minor packaging variation acceptable (e.g. Origin / Print formatting)'
  );
  const [showReasonInput, setShowReasonInput] = useState(false);

  if (!isOpen || !result) return null;

  const isResolved = result.isResolved;
  const isPass = result.status === 'PASS';
  const isForeign = result.status === 'FOREIGN_PRODUCT' || result.isForeignProduct;
  const isFlag = result.status === 'FLAG';
  const hasDiscrepancy = !isPass || isForeign || isFlag;

  const matched = typeof result.matchedCount === 'number'
    ? result.matchedCount
    : result.fields.filter((f) => f.status === 'MATCH').length;
  const total = typeof result.totalParametersCount === 'number'
    ? result.totalParametersCount
    : Math.max(result.fields.length, 8);
  const matchPct = Math.round((matched / Math.max(total, 1)) * 100);

  const handleResolve = () => {
    if (onResolveDiscrepancy) {
      onResolveDiscrepancy(result.id, overrideReason);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full p-4 sm:p-6 space-y-4 my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-3 gap-2">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-xs font-bold font-mono bg-slate-900 text-white shadow-2xs">
                Packet #{result.packetNumber || 1}
              </span>

              <span
                className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-xs font-bold font-mono ${
                  isResolved
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : isPass
                    ? 'bg-emerald-100 text-emerald-800'
                    : isForeign
                    ? 'bg-purple-100 text-purple-800'
                    : isFlag
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isResolved ? (
                  <>
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>PASSED (Resolved)</span>
                  </>
                ) : isPass ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>PASSED</span>
                  </>
                ) : isForeign ? (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
                    <span>FOREIGN</span>
                  </>
                ) : isFlag ? (
                  <>
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>FLAGGED</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>REVIEW</span>
                  </>
                )}
              </span>

              {/* Matched parameters counter */}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  {matched}/{total} ({matchPct}%)
                </span>
              </span>

              <span className="text-xs text-slate-500 font-mono">
                {new Date(result.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1 truncate">
              Parent Reference: {result.approvedProductName}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Anti-Tamper & Fraud Detection Alert */}
        {result.tamperAnalysis?.isTampered && (
          <div className="p-3.5 rounded-xl bg-red-900 text-white shadow-md border border-red-800 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-300 shrink-0" />
                <span className="font-bold text-xs uppercase tracking-wider text-red-200">
                  Physical Packaging Tamper Warning
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-800 text-red-100 uppercase font-mono">
                {result.tamperAnalysis.tamperType.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-red-100 font-medium leading-relaxed">
              {result.tamperAnalysis.details}
            </p>
            <p className="text-[10px] text-red-300">
              Confidence: {Math.round((result.tamperAnalysis.confidence || 0.95) * 100)}% | Visual alteration detected.
            </p>
          </div>
        )}

        {/* Action Banner: Ignore / Resolve Discrepancy */}
        {hasDiscrepancy && (
          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Discrepancy on Packet #{result.packetNumber || 1}</span>
              </div>
              <p className="text-amber-900 text-[11px]">
                {result.mismatchSummary || result.statusMessage}
              </p>
              <p className="text-slate-600 text-[10px]">
                If this difference is acceptable, you can override and approve this packet.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onResolveDiscrepancy && (
                <button
                  type="button"
                  onClick={handleResolve}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Mark as Passed (Override)</span>
                </button>
              )}
            </div>
          </div>
        )}

        {isResolved && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
            <CheckCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold">Operator Override Applied: </span>
              <span>This packet has been approved and marked as PASSED for batch compliance.</span>
              {result.resolutionNote && (
                <div className="text-[11px] text-emerald-800 font-mono mt-0.5">
                  Note: {result.resolutionNote}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Side-by-side Viewport: Parent Benchmark vs Scanned Packet */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Parent Reference Benchmark */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase text-slate-500 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Parent Reference Benchmark Image</span>
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">Master Reference</span>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center max-h-72 aspect-4/3 shadow-inner">
              {result.referenceImageUrl ? (
                <img
                  src={result.referenceImageUrl}
                  alt="Parent benchmark reference"
                  className="w-full h-full object-contain max-h-72"
                />
              ) : (
                <span className="text-xs text-slate-400">Master benchmark image</span>
              )}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900/85 text-white backdrop-blur-xs">
                MASTER BENCHMARK
              </div>
            </div>
          </div>

          {/* Right: Candidate Inspected Item */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Packet #{result.packetNumber || 1} Scanned Image</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">Inspected Sample</span>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center max-h-72 aspect-4/3 shadow-inner">
              <img
                src={result.capturedImageUrl}
                alt={`Packet #${result.packetNumber || 1} captured evidence`}
                className="w-full h-full object-contain max-h-72"
              />

              <div
                className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold text-white backdrop-blur-xs ${
                  isResolved
                    ? 'bg-emerald-700/90'
                    : isPass
                    ? 'bg-emerald-700/90'
                    : isForeign
                    ? 'bg-purple-800/90'
                    : 'bg-rose-700/90'
                }`}
              >
                PACKET #{result.packetNumber || 1}: {isResolved ? 'PASSED (RESOLVED)' : result.status}
              </div>

              {/* Bounding box overlays */}
              {result.fields.map((f) => {
                if (!f.bbox) return null;
                const b = f.bbox;
                const isMismatch = f.status === 'MISMATCH' || f.status === 'MISSING';
                return (
                  <div
                    key={f.fieldKey}
                    style={{
                      top: `${b.ymin}%`,
                      left: `${b.xmin}%`,
                      width: `${Math.max(b.xmax - b.xmin, 4)}%`,
                      height: `${Math.max(b.ymax - b.ymin, 3)}%`
                    }}
                    className={`absolute border-2 rounded pointer-events-none ${
                      isMismatch
                        ? 'border-rose-500 bg-rose-500/20'
                        : 'border-emerald-500 bg-emerald-500/10'
                    }`}
                  >
                    <span
                      className={`absolute -top-5 left-0 px-1 py-0.2 rounded text-[9px] font-mono font-bold text-white whitespace-nowrap shadow-xs ${
                        isMismatch ? 'bg-rose-600' : 'bg-emerald-600'
                      }`}
                    >
                      {f.fieldName}: {f.detected}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Detailed Declaration Comparison Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Statutory Parameter Comparison ({matched} of {total} Matched)
            </h4>
            <span className="text-[11px] text-slate-500">
              Legal Metrology (Packaged Commodities) Rules 2011
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs max-h-56 overflow-y-auto pr-1">
            {result.fields.map((f) => {
              const isMatch = f.status === 'MATCH';
              const isMismatch = f.status === 'MISMATCH' || f.status === 'MISSING';

              return (
                <div
                  key={f.fieldKey}
                  className={`p-2.5 rounded-lg border transition-colors ${
                    isMatch
                      ? 'border-slate-200 bg-slate-50/70'
                      : isMismatch
                      ? 'border-rose-200 bg-rose-50/80'
                      : 'border-amber-200 bg-amber-50/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-semibold text-slate-900">{f.fieldName}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                        isMatch
                          ? 'bg-emerald-100 text-emerald-800'
                          : isMismatch
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {f.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase">Parent Expected:</span>
                      <span className="text-slate-800 font-semibold truncate block">
                        {f.expected || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase">Candidate Detected:</span>
                      <span
                        className={`truncate block font-semibold ${
                          isMismatch ? 'text-rose-700' : 'text-slate-800'
                        }`}
                      >
                        {f.detected || 'Not detected'}
                      </span>
                    </div>
                  </div>

                  {f.differenceNote && (
                    <div className="mt-1 pt-1 border-t border-slate-200/60 text-[10px] text-rose-700 font-medium">
                      {f.differenceNote}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
