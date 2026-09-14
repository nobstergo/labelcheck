import React from 'react';
import { ShieldCheck, RotateCcw, FileText, ChevronDown, CheckSquare, Camera, Clock, Info } from 'lucide-react';
import { SAMPLE_PRODUCTS } from '../data/sampleProducts';
import { NavigationTab } from '../types';

interface HeaderProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  onSelectSample?: (sampleId: string) => void;
  onReset?: () => void;
  onOpenReport?: () => void;
  hasResult?: boolean;
  selectedSampleId?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  onSelectSample,
  onReset,
  onOpenReport,
  hasResult,
  selectedSampleId
}) => {
  return (
    <header id="main-header" className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Branding & Regulatory Citation */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-950 font-sans">
                LabelCheck
              </h1>
              <p className="text-xs text-slate-500 hidden md:block">
                Legal Metrology Label Verification (Rule 6)
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              id="nav-tab-scan"
              onClick={() => onTabChange('scan')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                currentTab === 'scan'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Scan</span>
            </button>

            <button
              type="button"
              id="nav-tab-inspect"
              onClick={() => onTabChange('inspect')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                currentTab === 'inspect'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Inspect</span>
            </button>

            <button
              type="button"
              id="nav-tab-history"
              onClick={() => onTabChange('history')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                currentTab === 'history'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>History</span>
            </button>

            <button
              type="button"
              id="nav-tab-about"
              onClick={() => onTabChange('about')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                currentTab === 'about'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>About</span>
            </button>
          </nav>
        </div>

        {/* Right: Actions and Sample Picker (When on Scan Tab) */}
        {currentTab === 'scan' && (
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Sample selector */}
            {onSelectSample && (
              <div className="relative inline-block text-left hidden sm:block">
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
            )}

            {hasResult && onOpenReport && (
              <button
                type="button"
                id="header-btn-report"
                onClick={onOpenReport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Inspection Report</span>
              </button>
            )}

            {hasResult && onReset && (
              <button
                type="button"
                id="header-btn-reset"
                onClick={onReset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                title="Reset inspection and inspect another package"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">New Scan</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
