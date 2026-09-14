import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, MinusCircle, Download, FileText, Edit3, ShieldCheck } from 'lucide-react';
import { RuleStatus, VerificationResult } from '../types';

interface VerificationSummaryProps {
  result: VerificationResult;
  activeFilter: RuleStatus | 'ALL';
  onFilterChange: (filter: RuleStatus | 'ALL') => void;
  onOpenReport: () => void;
  onOpenFieldEditor: () => void;
  onExportJson: () => void;
  onSaveAsApproved?: () => void;
}

export const VerificationSummary: React.FC<VerificationSummaryProps> = ({
  result,
  activeFilter,
  onFilterChange,
  onOpenReport,
  onOpenFieldEditor,
  onExportJson,
  onSaveAsApproved
}) => {
  const { summary } = result;

  return (
    <div id="verification-summary-card" className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
      {/* Top Header: Inspection Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {result.id}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
              {new Date(result.timestamp).toLocaleDateString()}
            </span>
          </div>
          <p className="text-xs font-medium text-slate-700 mt-1">
            Commodity: <span className="text-slate-900 font-semibold">{result.commodityType}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            id="btn-edit-fields"
            type="button"
            onClick={onOpenFieldEditor}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-medium transition-colors"
            title="Inspect and edit OCR detected values"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
            <span>Edit Fields</span>
          </button>

          <button
            id="btn-export-json"
            type="button"
            onClick={onExportJson}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-medium transition-colors"
            title="Export verification JSON data"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>JSON</span>
          </button>

          {onSaveAsApproved && (
            <button
              id="btn-save-approved"
              type="button"
              onClick={onSaveAsApproved}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-300 text-slate-800 bg-white hover:bg-slate-50 text-xs font-semibold transition-colors shadow-2xs"
              title="Save as Approved Product Reference for Inspect Mode"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
              <span>Save as Approved</span>
            </button>
          )}

          <button
            id="btn-print-report"
            type="button"
            onClick={onOpenReport}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold transition-colors shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Inspection Report</span>
          </button>
        </div>
      </div>

      {/* Categorical Compliance Tallies (No Single Percentage) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          type="button"
          onClick={() => onFilterChange('PASS')}
          className={`p-3 rounded-lg border text-left transition-all ${
            activeFilter === 'PASS'
              ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600'
              : 'border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-900">Compliant</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-emerald-700 font-mono">
              {summary.passCount}
            </span>
            <span className="text-[11px] text-emerald-800/80">Rules</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onFilterChange('REVIEW')}
          className={`p-3 rounded-lg border text-left transition-all ${
            activeFilter === 'REVIEW'
              ? 'border-amber-600 bg-amber-50/70 ring-1 ring-amber-600'
              : 'border-amber-200 bg-amber-50/30 hover:bg-amber-50/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900">Review Required</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-amber-700 font-mono">
              {summary.reviewCount}
            </span>
            <span className="text-[11px] text-amber-800/80">Discrepancies</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onFilterChange('MISSING')}
          className={`p-3 rounded-lg border text-left transition-all ${
            activeFilter === 'MISSING'
              ? 'border-rose-600 bg-rose-50/70 ring-1 ring-rose-600'
              : 'border-rose-200 bg-rose-50/30 hover:bg-rose-50/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-900">Missing</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-rose-700 font-mono">
              {summary.missingCount}
            </span>
            <span className="text-[11px] text-rose-800/80">Omissions</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onFilterChange('NOT_APPLICABLE')}
          className={`p-3 rounded-lg border text-left transition-all ${
            activeFilter === 'NOT_APPLICABLE'
              ? 'border-slate-400 bg-slate-100 ring-1 ring-slate-400'
              : 'border-slate-200 bg-slate-50/40 hover:bg-slate-100/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Not Applicable</span>
            <MinusCircle className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-700 font-mono">
              {summary.notApplicableCount}
            </span>
            <span className="text-[11px] text-slate-500">Exemptions</span>
          </div>
        </button>
      </div>

      {/* Filter Tabs Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-100">
        <span className="text-xs text-slate-500 font-medium mr-1 shrink-0">Filter:</span>
        <button
          type="button"
          onClick={() => onFilterChange('ALL')}
          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            activeFilter === 'ALL'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Declarations (8)
        </button>
        <button
          type="button"
          onClick={() => onFilterChange('PASS')}
          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            activeFilter === 'PASS'
              ? 'bg-emerald-700 text-white'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          Compliant ({summary.passCount})
        </button>
        <button
          type="button"
          onClick={() => onFilterChange('REVIEW')}
          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            activeFilter === 'REVIEW'
              ? 'bg-amber-700 text-white'
              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
          }`}
        >
          Review ({summary.reviewCount})
        </button>
        <button
          type="button"
          onClick={() => onFilterChange('MISSING')}
          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            activeFilter === 'MISSING'
              ? 'bg-rose-700 text-white'
              : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
          }`}
        >
          Missing ({summary.missingCount})
        </button>
      </div>
    </div>
  );
};
