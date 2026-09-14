import React from 'react';
import { X, Printer, ShieldCheck } from 'lucide-react';
import { VerificationResult } from '../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: VerificationResult;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  result
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const { summary } = result;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-xl border border-slate-300 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col my-6 print:max-h-none print:shadow-none print:border-none print:my-0">
        {/* Modal Controls Bar (Hidden during print) */}
        <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-xl print:hidden">
          <span className="text-xs font-semibold text-slate-700">
            Inspection Audit Report Preview
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Audit Document */}
        <div id="printable-audit-sheet" className="p-8 space-y-6 overflow-y-auto flex-1 font-sans text-slate-900 print:overflow-visible">
          {/* Header Banner */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-slate-900" />
                <h2 className="text-lg font-bold uppercase tracking-wider text-slate-950">
                  LabelCheck Compliance Verification Report
                </h2>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                LEGAL METROLOGY (PACKAGED COMMODITIES) RULES, 2011 — STATUTORY AUDIT
              </p>
            </div>

            <div className="text-right space-y-0.5 font-mono text-xs text-slate-600">
              <div><span className="font-semibold text-slate-900">Audit ID:</span> {result.id}</div>
              <div><span className="font-semibold text-slate-900">Date:</span> {new Date(result.timestamp).toLocaleString()}</div>
            </div>
          </div>

          {/* Commodity & Package Summary Box */}
          <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 font-medium block">Commodity Description:</span>
              <span className="font-bold text-slate-900 text-sm">{result.commodityType}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium block">Source Document:</span>
              <span className="font-medium text-slate-900 truncate block">{result.imageFileName}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium block">Audit Result:</span>
              <span className="font-mono font-bold text-slate-900">
                {summary.passCount} PASS / {summary.reviewCount} REVIEW / {summary.missingCount} MISSING
              </span>
            </div>
          </div>

          {/* Detailed Itemized Findings Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-700">
                  <th className="p-2.5 w-16">Code</th>
                  <th className="p-2.5 w-28">Statutory Rule</th>
                  <th className="p-2.5">Observed Package Text</th>
                  <th className="p-2.5 w-24 text-center">Status</th>
                  <th className="p-2.5">Inspector Findings &amp; Observations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {result.evaluations.map((ev) => (
                  <tr key={ev.ruleCode} className="hover:bg-slate-50/60">
                    <td className="p-2.5 font-mono font-bold text-slate-800 align-top">
                      {ev.ruleCode}
                    </td>
                    <td className="p-2.5 align-top">
                      <div className="font-semibold text-slate-900">{ev.ruleTitle}</div>
                      <div className="font-mono text-[11px] text-blue-700">{ev.citation}</div>
                    </td>
                    <td className="p-2.5 font-mono text-[11px] text-slate-800 align-top break-words max-w-[200px]">
                      {ev.detectedText ? (
                        ev.detectedText
                      ) : (
                        <span className="text-rose-600 italic">Not detected</span>
                      )}
                    </td>
                    <td className="p-2.5 text-center align-top">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          ev.status === 'PASS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ev.status === 'REVIEW'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {ev.status}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-700 align-top text-[11px] leading-relaxed">
                      {ev.findings}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Inspection Sign-off */}
          <div className="pt-4 border-t border-slate-200">
            <div className="grid grid-cols-2 gap-8 pt-4">
              <div className="space-y-1 text-xs text-slate-500">
                <div>Legal Metrology (Packaged Commodities) Rules, 2011</div>
                <div>Principal Display Panel Preliminary Inspection</div>
              </div>

              <div className="text-right space-y-6">
                <div className="border-b border-slate-300 w-48 ml-auto"></div>
                <div className="text-xs font-semibold text-slate-800">
                  Authorized Signature
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
