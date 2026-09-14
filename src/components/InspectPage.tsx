import React, { useState, useCallback, useRef } from 'react';
import {
  ApprovedProduct,
  InspectionCounters,
  InspectionResult,
  InspectionSession
} from '../types';
import { ApprovedProductManager } from './ApprovedProductManager';
import { CameraInspector } from './CameraInspector';
import { InspectionLivePanel } from './InspectionLivePanel';
import { RecentInspectionsList } from './RecentInspectionsList';
import { InspectionSessionSummaryModal } from './InspectionSessionSummaryModal';
import { EvidenceModal } from './EvidenceModal';
import { CreateProfileByScanModal } from './CreateProfileByScanModal';
import { compareProductInspection } from '../services/comparisonEngine';
import { saveInspectionSession, getApprovedProducts } from '../services/productStorage';
import { generateInspectionPDF } from '../services/reportExporter';
import { ArrowLeft, Sparkles, ChevronDown, Download } from 'lucide-react';

interface InspectPageProps {
  initialProductId?: string;
}

export const InspectPage: React.FC<InspectPageProps> = () => {
  const [selectedProduct, setSelectedProduct] = useState<ApprovedProduct | null>(null);
  const [allProducts, setAllProducts] = useState<ApprovedProduct[]>(getApprovedProducts);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [currentResult, setCurrentResult] = useState<InspectionResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Ready to inspect');
  const [counters, setCounters] = useState<InspectionCounters>({
    totalChecked: 0,
    passed: 0,
    flagged: 0,
    review: 0
  });
  const [recentRecords, setRecentRecords] = useState<InspectionResult[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<string>('');
  const [completedSession, setCompletedSession] = useState<InspectionSession | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState<boolean>(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState<boolean>(false);
  const [modalEvidenceResult, setModalEvidenceResult] = useState<InspectionResult | null>(null);

  const packetCounterRef = useRef<number>(0);
  const consecutiveFailuresRef = useRef<number>(0);
  const mismatchesCounterRef = useRef<Record<string, number>>({});
  const isRequestInFlightRef = useRef<boolean>(false);

  // When user selects a product to inspect
  const handleSelectProduct = (product: ApprovedProduct) => {
    setSelectedProduct(product);
    setCurrentResult(null);
    setStatusMessage('Ready to inspect. Align package label in viewfinder.');
    setCounters({ totalChecked: 0, passed: 0, flagged: 0, review: 0 });
    setRecentRecords([]);
    packetCounterRef.current = 0;
    setSessionStartTime(new Date().toISOString());
    mismatchesCounterRef.current = {};
    consecutiveFailuresRef.current = 0;
  };

  // Automated or manual frame capture callback from CameraInspector
  const handleFrameCaptured = useCallback(
    async (base64Image: string) => {
      if (!selectedProduct || isRequestInFlightRef.current) return;

      isRequestInFlightRef.current = true;
      setIsAnalyzing(true);
      setStatusMessage('Comparing candidate against parent reference...');

      // Enforce a 30-second abort to guarantee the UI never gets permanently stuck
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Image,
            fileName: 'inspect_frame.jpg'
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        const data = await res.json();
        if (!res.ok || !data.success || !data.result) {
          throw new Error(data.error || 'Frame processing error');
        }

        consecutiveFailuresRef.current = 0;

        // Run through comparison engine
        const comparison = compareProductInspection(
          selectedProduct,
          data.result.extractedFields || {},
          data.result.rawFullText || '',
          base64Image
        );

        // Assign sequential packet number
        packetCounterRef.current += 1;
        comparison.packetNumber = packetCounterRef.current;

        setCurrentResult(comparison);
        setStatusMessage(comparison.statusMessage);

        // If a usable package was detected, update counters and history
        if (comparison.status !== 'WAITING') {
          setCounters((prev) => {
            const next = { ...prev, totalChecked: prev.totalChecked + 1 };
            if (comparison.status === 'PASS') next.passed += 1;
            else if (comparison.status === 'FLAG' || comparison.status === 'FOREIGN_PRODUCT') next.flagged += 1;
            else if (comparison.status === 'REVIEW') next.review += 1;
            return next;
          });

          // Tally mismatch causes
          if (comparison.mismatchSummary) {
            const key = comparison.statusMessage || 'Field Mismatch';
            mismatchesCounterRef.current[key] =
              (mismatchesCounterRef.current[key] || 0) + 1;
          }

          setRecentRecords((prev) => [comparison, ...prev]);
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        console.warn('Frame analysis delay or error:', err?.message || err);
        consecutiveFailuresRef.current += 1;
        setStatusMessage(
          err.name === 'AbortError'
            ? 'Scan timed out. Please try again with steady lighting.'
            : 'Analysis could not complete. Retrying...'
        );
      } finally {
        isRequestInFlightRef.current = false;
        setIsAnalyzing(false);
      }
    },
    [selectedProduct]
  );

  // Operator action: Ignore / Resolve Discrepancy (Mark as PASSED)
  const handleResolveDiscrepancy = (recordId: string, note?: string) => {
    let resolvedItem: InspectionResult | null = null;

    setRecentRecords((prev) =>
      prev.map((rec) => {
        if (rec.id === recordId) {
          resolvedItem = rec;
          return {
            ...rec,
            status: 'PASS',
            isResolved: true,
            resolutionNote: note || 'Discrepancy accepted by inspector (e.g. Origin / print format variation)',
            statusMessage: 'Discrepancy resolved: Marked as PASSED'
          };
        }
        return rec;
      })
    );

    setCurrentResult((prev) => {
      if (prev && prev.id === recordId) {
        return {
          ...prev,
          status: 'PASS',
          isResolved: true,
          resolutionNote: note || 'Discrepancy accepted by inspector',
          statusMessage: 'Discrepancy resolved: Marked as PASSED'
        };
      }
      return prev;
    });

    setModalEvidenceResult((prev) => {
      if (prev && prev.id === recordId) {
        return {
          ...prev,
          status: 'PASS',
          isResolved: true,
          resolutionNote: note || 'Discrepancy accepted by inspector',
          statusMessage: 'Discrepancy resolved: Marked as PASSED'
        };
      }
      return prev;
    });

    // Rebalance counters: decrement flagged/review, increment passed
    setCounters((prev) => {
      const target = recentRecords.find((r) => r.id === recordId);
      if (!target || target.status === 'PASS') return prev;

      const wasFlagged = target.status === 'FLAG' || target.status === 'FOREIGN_PRODUCT';
      const wasReview = target.status === 'REVIEW';

      return {
        ...prev,
        passed: prev.passed + 1,
        flagged: wasFlagged ? Math.max(0, prev.flagged - 1) : prev.flagged,
        review: wasReview ? Math.max(0, prev.review - 1) : prev.review
      };
    });
  };

  // Export inspection session directly to PDF
  const handleExportPdf = () => {
    if (!selectedProduct) return;
    generateInspectionPDF({
      productName: selectedProduct.name,
      records: recentRecords,
      sessionStartTime,
      sessionEndTime: new Date().toISOString(),
      counters
    });
  };

  // Stop current inspection session and open summary modal
  const handleStopInspection = () => {
    if (!selectedProduct) return;

    const endTime = new Date().toISOString();
    const commonIssues: Array<{ issue: string; count: number }> = Object.entries(
      mismatchesCounterRef.current
    ).map(([issue, count]) => ({ issue, count: Number(count) }));

    const session: InspectionSession = {
      id: `SES-${Date.now().toString(36).toUpperCase()}`,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      startTime: sessionStartTime || new Date().toISOString(),
      endTime,
      counters,
      commonIssues,
      records: recentRecords
    };

    saveInspectionSession(session);
    setCompletedSession(session);
    setIsSummaryModalOpen(true);
  };

  const handleOpenEvidence = (result: InspectionResult) => {
    setModalEvidenceResult(result);
    setIsEvidenceModalOpen(true);
  };

  const handleProfileCreated = (newProduct: ApprovedProduct) => {
    setAllProducts(getApprovedProducts());
    handleSelectProduct(newProduct);
  };

  return (
    <div className="space-y-6">
      {/* State A: Product Selection Screen */}
      {!selectedProduct && (
        <ApprovedProductManager onSelectProduct={handleSelectProduct} />
      )}

      {/* State B: Active Inspection Screen */}
      {selectedProduct && (
        <div className="space-y-4">
          {/* Top Bar: Active Reference Product, Switcher & Return Action */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 bg-slate-50/50 p-3 rounded-xl border">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Profiles</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 hidden sm:inline">
                  Active Reference:
                </span>
                <div className="relative inline-block">
                  <select
                    value={selectedProduct.id}
                    onChange={(e) => {
                      const prod = allProducts.find((p) => p.id === e.target.value);
                      if (prod) handleSelectProduct(prod);
                    }}
                    className="appearance-none pr-7 pl-2.5 py-1 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg shadow-2xs focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    {allProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2 top-2 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={recentRecords.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Export PDF Report</span>
              </button>

              <button
                type="button"
                onClick={() => setIsScanModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Scan New Reference</span>
              </button>
            </div>
          </div>

          {/* Main Inspection Viewport: Desktop 2-column / Mobile stacked */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Camera Viewport (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <CameraInspector
                onFrameCaptured={handleFrameCaptured}
                isAnalyzing={isAnalyzing}
                currentStatus={currentResult?.status || 'WAITING'}
                statusMessage={statusMessage}
                onStopInspection={handleStopInspection}
                approvedProduct={selectedProduct}
              />

              {/* Instructions Bar */}
              <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-600 flex items-center justify-between shadow-2xs">
                <span>Align packaging sequentially in the viewfinder or click "Inspect Next Item".</span>
                <span className="font-mono text-[11px] text-blue-700 font-semibold">
                  Inspection Active
                </span>
              </div>
            </div>

            {/* Right Column: Sleek Top Counters & Recent Inspections Log holding all entries */}
            <div className="lg:col-span-5 space-y-4">
              <InspectionLivePanel
                approvedProduct={selectedProduct}
                counters={counters}
                currentResult={currentResult}
                onOpenEvidenceModal={handleOpenEvidence}
              />

              {/* Recent Inspections Log: All entries with Packet #, matched counts, resolve action */}
              <RecentInspectionsList
                records={recentRecords}
                onSelectRecord={handleOpenEvidence}
                onResolveDiscrepancy={handleResolveDiscrepancy}
                onExportPdf={handleExportPdf}
              />
            </div>
          </div>
        </div>
      )}

      {/* Session Summary Modal on Stop */}
      <InspectionSessionSummaryModal
        session={completedSession}
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        onNewInspection={() => {
          setSelectedProduct(null);
          setIsSummaryModalOpen(false);
        }}
      />

      {/* Frame Evidence Detail Modal with Parent & Scanned image, matched params, and resolve action */}
      <EvidenceModal
        result={modalEvidenceResult}
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
        onResolveDiscrepancy={handleResolveDiscrepancy}
      />

      {/* Scan to Create Profile Modal */}
      <CreateProfileByScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onProfileCreated={handleProfileCreated}
      />
    </div>
  );
};
