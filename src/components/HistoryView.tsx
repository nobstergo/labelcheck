import React, { useState, useEffect } from 'react';
import {
  getInspectionSessions,
  clearInspectionHistory,
  getScanHistory,
  clearScanHistory,
  deleteScanHistory,
  deleteInspectionSession
} from '../services/accountStorage';
import { InspectionSession, ScanHistoryItem, UserProfile } from '../types';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
  Trash2,
  FileText,
  CheckSquare,
  Camera,
  Layers,
  Search,
  Filter
} from 'lucide-react';

interface HistoryViewProps {
  currentUser: UserProfile | null;
  onOpenReportForScan?: (scan: ScanHistoryItem) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  currentUser,
  onOpenReportForScan
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'scans' | 'sessions'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sessions, setSessions] = useState<InspectionSession[]>([]);
  const [scans, setScans] = useState<ScanHistoryItem[]>([]);

  const refreshHistory = () => {
    const userId = currentUser?.id;
    setSessions(getInspectionSessions(userId));
    setScans(getScanHistory(userId));
  };

  useEffect(() => {
    refreshHistory();
  }, [currentUser]);

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all history records for your account?')) {
      const userId = currentUser?.id;
      clearInspectionHistory(userId);
      clearScanHistory(userId);
      refreshHistory();
    }
  };

  const handleDeleteScan = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this scan record?')) {
      deleteScanHistory(id, currentUser?.id);
      refreshHistory();
    }
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this inspection session?')) {
      deleteInspectionSession(id, currentUser?.id);
      refreshHistory();
    }
  };

  const handleExportSession = (session: InspectionSession) => {
    const jsonStr = JSON.stringify(session, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LabelCheck_Session_${session.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportScan = (scan: ScanHistoryItem) => {
    const jsonStr = JSON.stringify(scan, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LabelCheck_Scan_${scan.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered lists
  const filteredScans = scans.filter((s) => {
    const term = searchQuery.toLowerCase();
    const name = s.imageFileName.toLowerCase();
    const commodity = (s.commodityType || '').toLowerCase();
    return name.includes(term) || commodity.includes(term) || s.id.toLowerCase().includes(term);
  });

  const filteredSessions = sessions.filter((s) => {
    const term = searchQuery.toLowerCase();
    const name = s.productName.toLowerCase();
    const id = s.id.toLowerCase();
    return name.includes(term) || id.includes(term);
  });

  const totalEntries = scans.length + sessions.length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-950">
            Account Activity & History
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Persisted verification records and quality inspection sessions for{' '}
            <span className="font-semibold text-slate-900">{currentUser?.name || 'Logged User'}</span>
          </p>
        </div>

        {totalEntries > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Clear All History</span>
          </button>
        )}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Activity ({totalEntries})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('scans')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'scans'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Single Scans ({scans.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sessions')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'sessions'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Continuous Inspect ({sessions.length})</span>
          </button>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by label or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
          />
        </div>
      </div>

      {/* Zero State */}
      {totalEntries === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center space-y-3">
          <Clock className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">
            No history recorded yet for this account
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Scans from the Scan tab and completed continuous sessions from the Inspect tab will automatically persist under your account.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* SECTION 1: Single Scan Verifications */}
          {(activeTab === 'all' || activeTab === 'scans') && filteredScans.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-slate-700" />
                  <span>Single Label Scans</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">{filteredScans.length} records</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {filteredScans.map((scan) => {
                  const passPercent = scan.summary.totalRules
                    ? Math.round((scan.summary.passCount / scan.summary.totalRules) * 100)
                    : 0;

                  return (
                    <div
                      key={scan.id}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700 shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-slate-900 truncate">
                              {scan.imageFileName}
                            </h4>
                            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                              {scan.commodityType}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                scan.summary.missingCount === 0
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {passPercent}% Compliance ({scan.summary.passCount}/{scan.summary.totalRules} passed)
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-mono mt-1">
                            {new Date(scan.timestamp).toLocaleString()} • ID: {scan.id}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        {onOpenReportForScan && (
                          <button
                            type="button"
                            onClick={() => onOpenReportForScan(scan)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-900 text-white hover:bg-slate-800 transition shadow-2xs"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View Report</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleExportScan(scan)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-100 border border-slate-200 transition"
                          title="Export JSON"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteScan(scan.id, e)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 2: Continuous Inspect Sessions */}
          {(activeTab === 'all' || activeTab === 'sessions') && filteredSessions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-slate-700" />
                  <span>Continuous Inspection Sessions</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">{filteredSessions.length} sessions</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">
                            {session.productName}
                          </h4>
                          <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {session.id}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 font-mono">
                          <span>{new Date(session.startTime).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleExportSession(session)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-500" />
                          <span>Export JSON</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition"
                          title="Delete Session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Counters */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                        <span className="text-slate-500 block text-[11px]">Total Checked</span>
                        <span className="text-lg font-bold font-mono text-slate-900">
                          {session.counters.totalChecked}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50">
                        <span className="text-emerald-800 font-semibold block text-[11px]">Passed</span>
                        <span className="text-lg font-bold font-mono text-emerald-700">
                          {session.counters.passed}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg border border-rose-200 bg-rose-50/50">
                        <span className="text-rose-800 font-semibold block text-[11px]">Flagged</span>
                        <span className="text-lg font-bold font-mono text-rose-700">
                          {session.counters.flagged}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/50">
                        <span className="text-amber-800 font-semibold block text-[11px]">Review</span>
                        <span className="text-lg font-bold font-mono text-amber-700">
                          {session.counters.review}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
