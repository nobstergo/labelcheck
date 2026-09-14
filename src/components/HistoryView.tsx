import React, { useState } from 'react';
import { getInspectionSessions, clearInspectionHistory } from '../services/productStorage';
import { InspectionSession } from '../types';
import { Clock, CheckCircle2, XCircle, AlertTriangle, Download, Trash2, FileText } from 'lucide-react';

export const HistoryView: React.FC = () => {
  const [sessions, setSessions] = useState<InspectionSession[]>(getInspectionSessions);

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all inspection history?')) {
      clearInspectionHistory();
      setSessions([]);
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-950">
            Inspection History
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Archived continuous inspection sessions and quality control records.
          </p>
        </div>

        {sessions.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center space-y-3">
          <Clock className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">
            No inspection sessions recorded yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Completed Inspect Mode sessions will automatically appear here with package counts, pass/flag tallies, and detected mismatches.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const dateStr = new Date(session.startTime).toLocaleDateString([], {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });
            const timeStr = `${new Date(session.startTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })} - ${
              session.endTime
                ? new Date(session.endTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Incomplete'
            }`;

            return (
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
                      <span>{dateStr}</span>
                      <span>•</span>
                      <span>{timeStr}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleExportSession(session)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium self-start sm:self-auto"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Export JSON</span>
                  </button>
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

                {/* Common Issues List */}
                {session.commonIssues && session.commonIssues.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-700">Issues:</span>
                    {session.commonIssues.map((iss, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-800 font-medium text-[11px]"
                      >
                        {iss.issue} ({iss.count})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
