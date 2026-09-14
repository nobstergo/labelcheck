import React from 'react';
import { ShieldCheck, RotateCcw, FileText, ChevronDown } from 'lucide-react';
import { SAMPLE_PRODUCTS } from '../data/sampleProducts';

interface HeaderProps {
  onSelectSample: (sampleId: string) => void;
  onReset: () => void;
  onOpenReport?: () => void;
  hasResult: boolean;
  selectedSampleId?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onSelectSample,
  onReset,
  onOpenReport,
  hasResult,
  selectedSampleId
}) => {
  return (
    <header id="main-header" className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Branding & Regulatory Citation */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-950 font-sans">
              LabelCheck
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">
              Legal Metrology Label Verification (Rule 6)
            </p>
          </div>
        </div>

        {/* Right: Actions and Sample Picker */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sample selector */}
          <div className="relative inline-block text-left">
            <div className="flex items-center">
              <label htmlFor="sample-select" className="sr-only">Load Sample Label</label>
              <select
                id="sample-select"
                aria-label="Load Sample Label"
                value={selectedSampleId || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    onSelectSample(e.target.value);
                  }
                }}
                className="text-xs bg-slate-50 border border-slate-300 text-slate-700 rounded-md px-3 py-1.5 pr-8 hover:bg-slate-100 focus:ring-2 focus:ring-slate-900 focus:outline-hidden appearance-none cursor-pointer font-medium"
              >
                <option value="">Load Sample Product...</option>
                {SAMPLE_PRODUCTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.expectedOutcome})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 -ml-6 pointer-events-none" />
            </div>
          </div>

          {hasResult && onOpenReport && (
            <button
              id="header-btn-report"
              onClick={onOpenReport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Inspection Report</span>
            </button>
          )}

          {hasResult && (
            <button
              id="header-btn-reset"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors"
              title="Reset inspection and inspect another package"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">New Inspection</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
