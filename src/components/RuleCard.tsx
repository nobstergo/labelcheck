import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, MinusCircle, Crosshair, Edit3 } from 'lucide-react';
import { RuleEvaluation } from '../types';

interface RuleCardProps {
  evaluation: RuleEvaluation;
  isSelected: boolean;
  onSelect: (ruleCode: string) => void;
  onEditField: (ruleCode: string) => void;
}

export const RuleCard: React.FC<RuleCardProps> = ({
  evaluation,
  isSelected,
  onSelect,
  onEditField
}) => {
  const { ruleCode, ruleTitle, citation, status, detectedText, confidence, findings, actionableNote, bbox } = evaluation;

  // Status-specific badges
  const renderStatusBadge = () => {
    switch (status) {
      case 'PASS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            PASS
          </span>
        );
      case 'REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            REVIEW
          </span>
        );
      case 'MISSING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            MISSING
          </span>
        );
      case 'NOT_APPLICABLE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <MinusCircle className="w-3.5 h-3.5 text-slate-500" />
            N/A
          </span>
        );
    }
  };

  return (
    <div
      id={`rule-card-${ruleCode}`}
      onClick={() => onSelect(ruleCode)}
      className={`rounded-xl border p-4 transition-all cursor-pointer bg-white ${
        isSelected
          ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
      }`}
    >
      {/* Header: Code, Citation, Title, Status */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
              {ruleCode}
            </span>
            <span className="text-xs font-semibold text-blue-700 font-mono">
              {citation}
            </span>
          </div>
          <h4 className="text-sm font-bold text-slate-900 leading-tight">
            {ruleTitle}
          </h4>
        </div>

        <div className="shrink-0">
          {renderStatusBadge()}
        </div>
      </div>

      {/* Observed Declaration / OCR Snippet */}
      <div className="mb-2.5 space-y-1">
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span>Detected Text:</span>
          {detectedText && confidence > 0 && (
            <span className="font-mono text-[10px] text-slate-500">
              Confidence: {Math.round(confidence * 100)}%
            </span>
          )}
        </div>

        {detectedText ? (
          <div className="bg-slate-50 border border-slate-200 rounded-md p-2 font-mono text-xs text-slate-900 break-words leading-relaxed">
            {detectedText}
          </div>
        ) : (
          <div className="bg-rose-50/50 border border-rose-200/80 rounded-md p-2 text-xs text-rose-700 italic">
            Not detected on visible label
          </div>
        )}
      </div>

      {/* Findings Note */}
      <div className="text-xs space-y-1 bg-slate-50/80 rounded-lg p-2.5 border border-slate-200/60 text-slate-700">
        <p className="leading-relaxed text-slate-800 text-xs font-medium">
          {findings}
        </p>
        {actionableNote && (
          <p className="text-[11px] text-slate-500 border-t border-slate-200/60 pt-1 mt-1">
            {actionableNote}
          </p>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
        {bbox ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(ruleCode);
            }}
            className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 font-semibold text-[11px]"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Locate on Label</span>
          </button>
        ) : (
          <span className="text-[11px] text-slate-400 italic">
            No bounding coordinates
          </span>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEditField(ruleCode);
          }}
          className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 text-[11px] font-medium"
        >
          <Edit3 className="w-3 h-3 text-slate-400" />
          <span>Edit Declaration</span>
        </button>
      </div>
    </div>
  );
};
