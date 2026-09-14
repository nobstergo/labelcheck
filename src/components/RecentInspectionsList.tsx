import React from 'react';
import { InspectionResult } from '../types';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldAlert,
  CheckCheck,
  Download,
  FileCheck,
  ExternalLink,
  Layers,
  ChevronRight
} from 'lucide-react';

interface RecentInspectionsListProps {
  records: InspectionResult[];
  onSelectRecord: (record: InspectionResult) => void;
  onResolveDiscrepancy: (recordId: string, note?: string) => void;
  onExportPdf?: () => void;
}

export const RecentInspectionsList: React.FC<RecentInspectionsListProps> = ({
  records,
  onSelectRecord,
  onResolveDiscrepancy,
  onExportPdf
}) => {
  if (records.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-3 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <FileCheck className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-800">
            No Packets Inspected Yet
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Place packaging units in the camera viewfinder or click "Inspect Next Item". Every inspected packet will appear here with its packet number and parameter match rate.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
      {/* Header with Title and PDF Export Button */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Inspection Log ({records.length} Packets)
            </h4>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold font-mono">
              Live Session
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Click any packet to inspect side-by-side parent reference & candidate images.
          </p>
        </div>

        {onExportPdf && (
          <button
            type="button"
            onClick={onExportPdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all shadow-2xs shrink-0"
            title="Export session to PDF report"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF Report</span>
          </button>
        )}
      </div>

      {/* Packet Entries List */}
      <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
        {records.map((rec, index) => {
          const packetNum = rec.packetNumber || records.length - index;
          const isResolved = rec.isResolved;
          const isPass = rec.status === 'PASS';
          const isFlag = rec.status === 'FLAG';
          const isForeign = rec.status === 'FOREIGN_PRODUCT' || rec.isForeignProduct;
          const hasDiscrepancy = !isPass || isForeign || isFlag;

          const matched = typeof rec.matchedCount === 'number'
            ? rec.matchedCount
            : rec.fields.filter((f) => f.status === 'MATCH').length;
          const total = typeof rec.totalParametersCount === 'number'
            ? rec.totalParametersCount
            : Math.max(rec.fields.length, 8);
          const matchPct = Math.round((matched / Math.max(total, 1)) * 100);

          const timeStr = new Date(rec.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });

          return (
            <div
              key={rec.id}
              className={`p-3 rounded-xl border text-xs transition-all shadow-2xs ${
                isResolved
                  ? 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/70'
                  : isPass
                  ? 'border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/60'
                  : isForeign
                  ? 'border-purple-200 bg-purple-50/30 hover:bg-purple-50/60'
                  : isFlag
                  ? 'border-rose-200 bg-rose-50/30 hover:bg-rose-50/60'
                  : 'border-amber-200 bg-amber-50/30 hover:bg-amber-50/60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Left info: Identifier, Status, Thumbnail, Time */}
                <div
                  onClick={() => onSelectRecord(rec)}
                  className="flex items-start gap-2.5 flex-1 cursor-pointer min-w-0"
                >
                  {/* Thumbnail */}
                  {rec.capturedImageUrl && (
                    <img
                      src={rec.capturedImageUrl}
                      alt={`Packet #${packetNum}`}
                      className="w-11 h-13 object-cover rounded-md border border-slate-200 shrink-0 bg-slate-950 mt-0.5"
                    />
                  )}

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Packet unique identifier */}
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                        Packet #{packetNum}
                      </span>

                      {/* Status badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
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
                            <CheckCheck className="w-3 h-3 text-emerald-600" />
                            <span>PASSED (Resolved)</span>
                          </>
                        ) : isPass ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>PASSED</span>
                          </>
                        ) : isForeign ? (
                          <>
                            <ShieldAlert className="w-3 h-3 text-purple-600" />
                            <span>FOREIGN</span>
                          </>
                        ) : isFlag ? (
                          <>
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>FLAGGED</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>REVIEW</span>
                          </>
                        )}
                      </span>

                      {/* Parameter Match Rate Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold font-mono ${
                          matched === total
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : matched >= total - 2
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        <span>{matched}/{total} Matched</span>
                        <span className="text-[9px] opacity-75">({matchPct}%)</span>
                      </span>

                      <span className="font-mono text-[10px] text-slate-400">
                        {timeStr}
                      </span>
                    </div>

                    {/* Discrepancy or status summary */}
                    <div className="text-[11px] text-slate-700 truncate max-w-md">
                      {isResolved ? (
                        <span className="text-emerald-700 font-medium">
                          ✓ Operator override: {rec.resolutionNote || 'Accepted simple variation'}
                        </span>
                      ) : rec.mismatchSummary ? (
                        <span className="text-rose-700 font-medium">
                          {rec.mismatchSummary}
                        </span>
                      ) : (
                        <span className="text-slate-500">
                          All statutory declarations match parent reference.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right actions: Resolve button & Open detail */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {hasDiscrepancy && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onResolveDiscrepancy(rec.id);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs transition-colors"
                      title="Mark this packet as PASSED by ignoring simple discrepancy"
                    >
                      <CheckCheck className="w-3 h-3" />
                      <span>Ignore / Resolve</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onSelectRecord(rec)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors"
                    title="View parent reference & candidate image"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
