import React, { useState } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { ImageViewer } from './components/ImageViewer';
import { VerificationSummary } from './components/VerificationSummary';
import { RuleCard } from './components/RuleCard';
import { FieldEditorModal } from './components/FieldEditorModal';
import { ReportModal } from './components/ReportModal';
import { ExtractedField, RuleStatus, VerificationResult } from './types';
import { evaluateCompliance } from './services/complianceEngine';
import { AlertCircle, Loader2 } from 'lucide-react';

export function App() {
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedRuleCode, setSelectedRuleCode] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<RuleStatus | 'ALL'>('ALL');
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isFieldEditorOpen, setIsFieldEditorOpen] = useState<boolean>(false);
  const [editingTargetRule, setEditingTargetRule] = useState<string | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState<string | undefined>(undefined);

  // Send image to /api/analyze
  const handleAnalyzeImage = async (base64: string, fileName: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setLoadingStage('Scanning label and detecting declarations...');
    setSelectedSampleId(undefined);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          fileName
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Label analysis failed. Please try again.');
      }

      setResult(data.result);
      setSelectedRuleCode(null);
      setActiveFilter('ALL');
    } catch (err: any) {
      console.error('Analysis error:', err);
      setErrorMessage(err.message || 'Unable to analyze image. Please ensure the label image is clear and legible.');
    } finally {
      setIsLoading(false);
      setLoadingStage('');
    }
  };

  // Select sample preset
  const handleSelectSample = async (sampleId: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setLoadingStage('Loading sample label...');
    setSelectedSampleId(sampleId);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sampleId })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load sample label');
      }

      setResult(data.result);
      setSelectedRuleCode(null);
      setActiveFilter('ALL');
    } catch (err: any) {
      console.error('Sample loading error:', err);
      setErrorMessage(err.message || 'Failed to load sample');
    } finally {
      setIsLoading(false);
      setLoadingStage('');
    }
  };

  // Reset to input view
  const handleReset = () => {
    setResult(null);
    setErrorMessage(null);
    setSelectedRuleCode(null);
    setActiveFilter('ALL');
    setSelectedSampleId(undefined);
  };

  // Handle interactive selection from viewer or card
  const handleSelectRule = (ruleCode: string) => {
    setSelectedRuleCode((prev) => (prev === ruleCode ? null : ruleCode));
    const cardEl = document.getElementById(`rule-card-${ruleCode}`);
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // Save manual field adjustments
  const handleSaveFields = (updatedFields: Record<string, ExtractedField>) => {
    if (!result) return;
    const fullText = Object.values(updatedFields)
      .map((f) => f.rawValue)
      .filter(Boolean)
      .join('\n');

    const { evaluations, summary } = evaluateCompliance(updatedFields, fullText);

    setResult({
      ...result,
      extractedFields: updatedFields,
      evaluations,
      summary
    });
  };

  // Export JSON
  const handleExportJson = () => {
    if (!result) return;
    const jsonStr = JSON.stringify(result, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LabelCheck_${result.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter evaluations (already ordered with REVIEW & MISSING on top)
  const filteredEvaluations = result
    ? result.evaluations.filter((e) => {
        if (activeFilter === 'ALL') return true;
        return e.status === activeFilter;
      })
    : [];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-900">
      {/* Header */}
      <Header
        onSelectSample={handleSelectSample}
        onReset={handleReset}
        onOpenReport={() => setIsReportModalOpen(true)}
        hasResult={Boolean(result)}
        selectedSampleId={selectedSampleId}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col">
        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3 text-xs shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm">Notice</p>
              <p className="text-rose-800">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Loading Overlay State */}
        {isLoading && (
          <div className="my-auto py-16 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-900">
              <Loader2 className="w-8 h-8 animate-spin text-slate-800" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-slate-900">Analyzing Label</h3>
              <p className="text-xs text-slate-500 font-mono">{loadingStage}</p>
            </div>
          </div>
        )}

        {/* Step 1: Input Screen (When no active result & not loading) */}
        {!result && !isLoading && (
          <div className="my-auto py-6 space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-1.5">
              <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                Packaged Commodity Label Verification
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Upload or capture a label image to verify Legal Metrology Rule 6 statutory declarations.
              </p>
            </div>

            {/* Uploader & Presets */}
            <ImageUploader
              onImageSelected={handleAnalyzeImage}
              onSampleSelected={handleSelectSample}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Step 2: Verification Results & Evidence Mapping View */}
        {result && !isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Interactive Image Evidence Viewer (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <ImageViewer
                imageUrl={result.imageUrl}
                fields={result.extractedFields}
                evaluations={result.evaluations}
                selectedRuleCode={selectedRuleCode}
                onSelectRule={handleSelectRule}
              />

              {/* Package Details Bar */}
              <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 text-xs flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">Source:</span>
                  <span className="font-mono font-semibold text-slate-800">{result.imageFileName}</span>
                </div>
                <div className="text-slate-500 font-mono text-[11px]">
                  Text blocks: {result.ocrTokens.length}
                </div>
              </div>
            </div>

            {/* Right Column: Statutory Summary & Compliance Rule Cards (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Summary Stats & Categorical Tallies */}
              <VerificationSummary
                result={result}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                onOpenReport={() => setIsReportModalOpen(true)}
                onOpenFieldEditor={() => {
                  setEditingTargetRule(null);
                  setIsFieldEditorOpen(true);
                }}
                onExportJson={handleExportJson}
              />

              {/* Rule Cards List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
                  <span>Showing {filteredEvaluations.length} of {result.evaluations.length} checks</span>
                  {activeFilter !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => setActiveFilter('ALL')}
                      className="text-blue-700 hover:underline font-semibold text-[11px]"
                    >
                      Clear filter
                    </button>
                  )}
                </div>

                {filteredEvaluations.length === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-white border border-slate-200 text-slate-500 text-xs">
                    No checks matching current filter.
                  </div>
                ) : (
                  filteredEvaluations.map((ev) => (
                    <RuleCard
                      key={ev.ruleCode}
                      evaluation={ev}
                      isSelected={selectedRuleCode === ev.ruleCode}
                      onSelect={handleSelectRule}
                      onEditField={(code) => {
                        setEditingTargetRule(code);
                        setIsFieldEditorOpen(true);
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Field Override Modal */}
      {result && (
        <FieldEditorModal
          isOpen={isFieldEditorOpen}
          onClose={() => setIsFieldEditorOpen(false)}
          fields={result.extractedFields}
          initialRuleCode={editingTargetRule}
          onSaveFields={handleSaveFields}
        />
      )}

      {/* Inspection Report Modal */}
      {result && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          result={result}
        />
      )}
    </div>
  );
}

export default App;
