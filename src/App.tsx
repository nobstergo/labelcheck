import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { ImageViewer } from './components/ImageViewer';
import { VerificationSummary } from './components/VerificationSummary';
import { RuleCard } from './components/RuleCard';
import { FieldEditorModal } from './components/FieldEditorModal';
import { ReportModal } from './components/ReportModal';
import { InspectPage } from './components/InspectPage';
import { HistoryView } from './components/HistoryView';
import { AboutView } from './components/AboutView';
import { SaveAsApprovedModal } from './components/SaveAsApprovedModal';
import { LoginView } from './components/LoginView';
import { ExtractedField, NavigationTab, RuleStatus, ScanHistoryItem, UserProfile, VerificationResult } from './types';
import { evaluateCompliance } from './services/complianceEngine';
import { getCurrentUser, setCurrentUser as saveCurrentUser, logoutUser, saveScanHistory } from './services/accountStorage';
import { auth, fbOnAuthStateChanged, signOutFirebase } from './services/firebase';
import { AlertCircle, Loader2 } from 'lucide-react';

export function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getCurrentUser());
  const [currentTab, setCurrentTab] = useState<NavigationTab>('scan');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedRuleCode, setSelectedRuleCode] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<RuleStatus | 'ALL'>('ALL');
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isFieldEditorOpen, setIsFieldEditorOpen] = useState<boolean>(false);
  const [isSaveAsApprovedOpen, setIsSaveAsApprovedOpen] = useState<boolean>(false);
  const [editingTargetRule, setEditingTargetRule] = useState<string | null>(null);
  const [reportModalResult, setReportModalResult] = useState<VerificationResult | null>(null);

  // Synchronize Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = fbOnAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const userProfile: UserProfile = {
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Google User',
          email: fbUser.email || 'user@gmail.com',
          avatarUrl:
            fbUser.photoURL ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              fbUser.displayName || 'Google User'
            )}&background=0F172A&color=38BDF8&bold=true`,
          provider: 'google',
          lastLoginAt: new Date().toISOString()
        };
        saveCurrentUser(userProfile);
        setCurrentUser(userProfile);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = (user: UserProfile) => {
    saveCurrentUser(user);
    setCurrentUser(user);
    setCurrentTab('scan');
  };

  const handleLogout = async () => {
    try {
      await signOutFirebase();
    } catch (err) {
      console.warn('Firebase signout note:', err);
    }
    logoutUser();
    setCurrentUser(null);
    setResult(null);
    setErrorMessage(null);
  };

  // Send image to /api/analyze
  const handleAnalyzeImage = async (base64: string, fileName: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setLoadingStage('Scanning label and detecting declarations...');

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

      const scanResult: VerificationResult = data.result;
      setResult(scanResult);
      setSelectedRuleCode(null);
      setActiveFilter('ALL');

      // Automatically persist to account history
      const historyRecord: ScanHistoryItem = {
        id: scanResult.id || `scan-${Date.now().toString(36)}`,
        timestamp: new Date().toISOString(),
        imageFileName: fileName,
        commodityType: scanResult.commodityType || 'Packaged Commodity',
        summary: scanResult.summary,
        evaluations: scanResult.evaluations,
        extractedFields: scanResult.extractedFields,
        imageUrl: scanResult.imageUrl,
        userId: currentUser?.id
      };
      saveScanHistory(historyRecord, currentUser?.id);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setErrorMessage(err.message || 'Unable to analyze image. Please ensure the label image is clear and legible.');
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

    const updated: VerificationResult = {
      ...result,
      extractedFields: updatedFields,
      evaluations,
      summary
    };
    setResult(updated);

    // Update history record as well
    const historyRecord: ScanHistoryItem = {
      id: updated.id,
      timestamp: new Date().toISOString(),
      imageFileName: updated.imageFileName,
      commodityType: updated.commodityType || 'Packaged Commodity',
      summary: updated.summary,
      evaluations: updated.evaluations,
      extractedFields: updated.extractedFields,
      imageUrl: updated.imageUrl,
      userId: currentUser?.id
    };
    saveScanHistory(historyRecord, currentUser?.id);
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

  // Open report modal from history item
  const handleOpenReportForScan = (scan: ScanHistoryItem) => {
    const historicalResult: VerificationResult = {
      id: scan.id,
      timestamp: scan.timestamp,
      imageFileName: scan.imageFileName,
      imageUrl: scan.imageUrl,
      imageDimensions: { width: 800, height: 1000 },
      ocrTokens: [],
      extractedFields: scan.extractedFields,
      evaluations: scan.evaluations,
      summary: scan.summary,
      commodityType: scan.commodityType
    };
    setReportModalResult(historicalResult);
    setIsReportModalOpen(true);
  };

  // If not logged in, present Google Auth login view
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLogin} />;
  }

  // Filter evaluations
  const filteredEvaluations = result
    ? result.evaluations.filter((e) => {
        if (activeFilter === 'ALL') return true;
        return e.status === activeFilter;
      })
    : [];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-900 w-full max-w-full overflow-x-hidden">
      {/* Header with Navigation and Account */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        onReset={handleReset}
        onOpenReport={() => {
          setReportModalResult(result);
          setIsReportModalOpen(true);
        }}
        hasResult={Boolean(result)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 flex flex-col overflow-x-hidden">
        {/* Error Banner */}
        {errorMessage && currentTab === 'scan' && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3 text-xs shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm">Notice</p>
              <p className="text-rose-800">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* TAB 1: SCAN MODE */}
        {currentTab === 'scan' && (
          <>
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
              <div className="my-auto py-6 space-y-6 w-full max-w-full">
                <div className="text-center max-w-xl mx-auto space-y-1.5 px-2">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
                    Packaged Commodity Label Verification
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600">
                    Upload or capture a label image to verify Legal Metrology Rule 6 statutory declarations.
                  </p>
                </div>

                {/* Uploader */}
                <ImageUploader
                  onImageSelected={handleAnalyzeImage}
                  isLoading={isLoading}
                />
              </div>
            )}

            {/* Step 2: Verification Results & Evidence Mapping View */}
            {result && !isLoading && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start w-full max-w-full">
                {/* Left Column: Interactive Image Evidence Viewer (7 cols) */}
                <div className="lg:col-span-7 space-y-4 w-full min-w-0">
                  <ImageViewer
                    imageUrl={result.imageUrl}
                    fields={result.extractedFields}
                    evaluations={result.evaluations}
                    selectedRuleCode={selectedRuleCode}
                    onSelectRule={handleSelectRule}
                  />

                  {/* Package Details Bar */}
                  <div className="bg-white rounded-lg border border-slate-200 px-3 sm:px-4 py-2.5 sm:py-3 text-xs flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-slate-500 font-medium shrink-0">Source:</span>
                      <span className="font-mono font-semibold text-slate-800 truncate">{result.imageFileName}</span>
                    </div>
                    <div className="text-slate-500 font-mono text-[11px] shrink-0">
                      Text blocks: {result.ocrTokens.length}
                    </div>
                  </div>
                </div>

                {/* Right Column: Statutory Summary & Compliance Rule Cards (5 cols) */}
                <div className="lg:col-span-5 space-y-4 w-full min-w-0">
                  {/* Summary Stats & Categorical Tallies */}
                  <VerificationSummary
                    result={result}
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                    onOpenReport={() => {
                      setReportModalResult(result);
                      setIsReportModalOpen(true);
                    }}
                    onOpenFieldEditor={() => {
                      setEditingTargetRule(null);
                      setIsFieldEditorOpen(true);
                    }}
                    onExportJson={handleExportJson}
                    onSaveAsApproved={() => setIsSaveAsApprovedOpen(true)}
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
          </>
        )}

        {/* TAB 2: INSPECT MODE */}
        {currentTab === 'inspect' && <InspectPage currentUser={currentUser} />}

        {/* TAB 3: HISTORY */}
        {currentTab === 'history' && (
          <HistoryView
            currentUser={currentUser}
            onOpenReportForScan={handleOpenReportForScan}
          />
        )}

        {/* TAB 4: ABOUT */}
        {currentTab === 'about' && <AboutView />}
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
      {(reportModalResult || result) && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => {
            setIsReportModalOpen(false);
            setReportModalResult(null);
          }}
          result={reportModalResult || result!}
        />
      )}

      {/* Save as Approved Product Modal */}
      {result && (
        <SaveAsApprovedModal
          isOpen={isSaveAsApprovedOpen}
          onClose={() => setIsSaveAsApprovedOpen(false)}
          extractedFields={result.extractedFields}
          imageUrl={result.imageUrl}
          onSaved={() => {
            setCurrentTab('inspect');
          }}
        />
      )}
    </div>
  );
}

export default App;
