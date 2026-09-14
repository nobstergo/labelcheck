import React from 'react';
import { InspectionSession } from '../types';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  X,
  Clock,
  ArrowRight,
  FileText
} from 'lucide-react';
import { generateInspectionPDF } from '../services/reportExporter';

interface InspectionSessionSummaryModalProps {
  session: InspectionSession | null;
  isOpen: boolean;
  onClose: () => void;
  onNewInspection: () => void;
}

export const InspectionSessionSummaryModal: React.FC<InspectionSessionSummaryModalProps> = ({
  session,
  isOpen,
  onClose,
  onNewInspection
}) => {
  if (!isOpen || !session) return null;

  const handleExportPdf = () => {
    generateInspectionPDF({
      session,
      productName: session.productName,
      records: session.records,
      sessionStartTime: session.startTime,
      sessionEndTime: session.endTime,
      counters: session.counters
    });
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(session, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LabelCheck_Session_${session.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const startTime = new Date(session.startTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
  const endTime = session.endTime
    ? new Date(session.endTime).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Now';

  const passRate = session.counters.totalChecked > 0
    ? Math.round((session.counters.passed / session.counters.totalChecked) * 100)
    : 100;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
              Inspection Batch Complete
            </span>
            <h3 className="text-lg font-bold text-slate-950">
              Session Summary & Verification
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Product details */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Reference Benchmark:</span>
            <span className="font-bold text-slate-900">{session.productName}</span>
          </div>
          <div className="flex justify-between items-center font-mono text-[11px] text-slate-600">
            <span>Session Window:</span>
            <span>
              {startTime} to {endTime}
            </span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-500">Batch Compliance Rate:</span>
            <span className={`font-bold font-mono ${passRate >= 90 ? 'text-emerald-700' : 'text-amber-700'}`}>
              {passRate}% Pass Rate ({session.counters.passed} of {session.counters.totalChecked} units)
            </span>
          </div>
        </div>

        {/* Counters Box */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
            <span className="text-slate-500 block text-[10px] font-semibold uppercase">Total</span>
            <span className="text-xl font-bold font-mono text-slate-900">
              {session.counters.totalChecked}
            </span>
          </div>
          <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/60">
            <span className="text-emerald-800 font-semibold block text-[10px] uppercase">Passed</span>
            <span className="text-xl font-bold font-mono text-emerald-700">
              {session.counters.passed}
            </span>
          </div>
          <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/60">
            <span className="text-rose-800 font-semibold block text-[10px] uppercase">Flagged</span>
            <span className="text-xl font-bold font-mono text-rose-700">
              {session.counters.flagged}
            </span>
          </div>
          <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/60">
            <span className="text-amber-800 font-semibold block text-[10px] uppercase">Review</span>
            <span className="text-xl font-bold font-mono text-amber-700">
              {session.counters.review}
            </span>
          </div>
        </div>

        {/* Common Issues */}
        {session.commonIssues && session.commonIssues.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Discrepancies Observed
            </h4>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {session.commonIssues.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900"
                >
                  <span className="font-medium truncate max-w-[280px]">
                    {item.issue}
                  </span>
                  <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-rose-200 shrink-0">
                    {item.count} pkg
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Main PDF Export Button */}
            <button
              type="button"
              onClick={handleExportPdf}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Export PDF Report</span>
            </button>

            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors"
              title="Export raw session JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onNewInspection();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-semibold shadow-xs"
            >
              <span>New Inspection</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
