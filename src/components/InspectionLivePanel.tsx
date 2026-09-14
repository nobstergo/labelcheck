import React from 'react';
import {
  ApprovedProduct,
  InspectionCounters,
  InspectionResult
} from '../types';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ExternalLink,
  Layers,
  CheckCheck
} from 'lucide-react';

interface InspectionLivePanelProps {
  approvedProduct: ApprovedProduct;
  counters: InspectionCounters;
  currentResult: InspectionResult | null;
  onOpenEvidenceModal?: (result: InspectionResult) => void;
}

export const InspectionLivePanel: React.FC<InspectionLivePanelProps> = ({
  approvedProduct,
  counters,
  currentResult,
  onOpenEvidenceModal
}) => {
  const renderStatusBanner = () => {
    if (!currentResult || currentResult.status === 'WAITING') {
      return (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-between shadow-2xs">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Live Inspection Active
            </span>
            <h4 className="text-sm font-bold text-slate-800">
              Ready for next package
            </h4>
            <p className="text-xs text-slate-500">
              Position package label in camera viewfinder or tap "Inspect Next Item"
            </p>
          </div>
          <Clock className="w-5 h-5 text-slate-400 shrink-0" />
        </div>
      );
    }

    const isResolved = currentResult.isResolved;
    const isForeign = currentResult.status === 'FOREIGN_PRODUCT' || currentResult.isForeignProduct;
    const isPass = currentResult.status === 'PASS';
    const isFlag = currentResult.status === 'FLAG';
    const packetNum = currentResult.packetNumber ? `Packet #${currentResult.packetNumber}` : 'Latest Item';

    const matched = typeof currentResult.matchedCount === 'number'
      ? currentResult.matchedCount
      : currentResult.fields.filter((f) => f.status === 'MATCH').length;
    const total = typeof currentResult.totalParametersCount === 'number'
      ? currentResult.totalParametersCount
      : Math.max(currentResult.fields.length, 8);

    if (isForeign) {
      return (
        <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 flex items-center justify-between shadow-2xs">
          <div className="space-y-0.5 min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-800 text-white font-mono">
                {packetNum}: FOREIGN
              </span>
              <span className="text-xs text-purple-700 font-mono">
                {new Date(currentResult.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <h4 className="text-xs font-bold text-purple-950 truncate">
              Scanned package does not belong to "{approvedProduct.name}"
            </h4>
            <p className="text-[11px] text-purple-900 truncate">
              {currentResult.statusMessage}
            </p>
          </div>
          {onOpenEvidenceModal && (
            <button
              type="button"
              onClick={() => onOpenEvidenceModal(currentResult)}
              className="p-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-semibold shrink-0"
              title="Inspect package"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
        </div>
      );
    }

    if (isPass) {
      return (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between shadow-2xs">
          <div className="space-y-0.5 min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-700 text-white font-mono">
                {packetNum}: {isResolved ? 'PASSED (RESOLVED)' : 'PASSED'}
              </span>
              <span className="text-xs text-emerald-800 font-mono">
                {matched}/{total} parameters matched
              </span>
            </div>
            <h4 className="text-xs font-bold text-emerald-950 truncate">
              Matches master parent reference
            </h4>
            <p className="text-[11px] text-emerald-850 truncate">
              All statutory declarations and legal metrology pricing verified.
            </p>
          </div>
          {onOpenEvidenceModal && (
            <button
              type="button"
              onClick={() => onOpenEvidenceModal(currentResult)}
              className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-semibold shrink-0"
              title="Inspect package"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
        </div>
      );
    }

    // Tampered / Scam Alert
    if (currentResult.tamperAnalysis?.isTampered) {
      return (
        <div className="p-3.5 rounded-xl bg-red-950 border border-red-800 text-white flex items-center justify-between shadow-md animate-pulse">
          <div className="space-y-0.5 min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white font-mono flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                {packetNum}: TAMPER ALERT
              </span>
              <span className="text-xs text-red-300 font-mono">
                {currentResult.tamperAnalysis.tamperType.replace(/_/g, ' ')}
              </span>
            </div>
            <h4 className="text-xs font-bold text-red-100 truncate">
              Physical Alteration or Sticker Detected
            </h4>
            <p className="text-[11px] text-red-200 truncate">
              {currentResult.tamperAnalysis.details}
            </p>
          </div>
          {onOpenEvidenceModal && (
            <button
              type="button"
              onClick={() => onOpenEvidenceModal(currentResult)}
              className="p-1.5 rounded-lg bg-red-800 hover:bg-red-700 text-white text-xs font-semibold shrink-0"
              title="Inspect package evidence and scam details"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
        </div>
      );
    }

    // Discrepancy / Flagged / Review
    return (
      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 flex items-center justify-between shadow-2xs">
        <div className="space-y-0.5 min-w-0 pr-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-700 text-white font-mono">
              {packetNum}: {currentResult.status}
            </span>
            <span className="text-xs text-rose-800 font-mono">
              {matched}/{total} parameters matched
            </span>
          </div>
          <h4 className="text-xs font-bold text-rose-950 truncate">
            Discrepancy detected vs parent benchmark
          </h4>
          <p className="text-[11px] text-rose-900 truncate">
            {currentResult.mismatchSummary || currentResult.statusMessage}
          </p>
        </div>
        {onOpenEvidenceModal && (
          <button
            type="button"
            onClick={() => onOpenEvidenceModal(currentResult)}
            className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-semibold shrink-0"
            title="Inspect package and resolve"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Product Reference Title */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="min-w-0">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
            PARENT REFERENCE BENCHMARK
          </span>
          <h3 className="text-base font-bold text-slate-950 leading-tight truncate">
            {approvedProduct.name}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Inspecting live stream packets against master declarations.
          </p>
        </div>

        <div className="shrink-0 text-right">
          <span className="text-xs font-mono font-bold text-emerald-700 block">
            {approvedProduct.fields.mrp || 'MRP Target'}
          </span>
          <span className="text-[11px] font-mono text-slate-600 block">
            {approvedProduct.fields.net_quantity || ''}
          </span>
        </div>
      </div>

      {/* Counters Grid */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="p-2.5 rounded-xl border border-slate-200 bg-white">
          <span className="text-[10px] text-slate-500 font-semibold block uppercase">Total</span>
          <span className="text-xl font-bold font-mono text-slate-900">
            {counters.totalChecked}
          </span>
        </div>

        <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60">
          <span className="text-[10px] text-emerald-800 font-semibold block uppercase">Passed</span>
          <span className="text-xl font-bold font-mono text-emerald-700">
            {counters.passed}
          </span>
        </div>

        <div className="p-2.5 rounded-xl border border-rose-200 bg-rose-50/60">
          <span className="text-[10px] text-rose-800 font-semibold block uppercase">Flagged</span>
          <span className="text-xl font-bold font-mono text-rose-700">
            {counters.flagged}
          </span>
        </div>

        <div className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60">
          <span className="text-[10px] text-amber-800 font-semibold block uppercase">Review</span>
          <span className="text-xl font-bold font-mono text-amber-700">
            {counters.review}
          </span>
        </div>
      </div>

      {/* Live Status Banner */}
      {renderStatusBanner()}
    </div>
  );
};
