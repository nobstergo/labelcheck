import React, { useState } from 'react';
import { X, Save, RotateCcw, AlertCircle } from 'lucide-react';
import { ExtractedField } from '../types';
import { LEGAL_METROLOGY_RULES } from '../data/rulesDefinition';

interface FieldEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  fields: Record<string, ExtractedField>;
  initialRuleCode?: string | null;
  onSaveFields: (updatedFields: Record<string, ExtractedField>) => void;
}

export const FieldEditorModal: React.FC<FieldEditorModalProps> = ({
  isOpen,
  onClose,
  fields,
  initialRuleCode,
  onSaveFields
}) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    LEGAL_METROLOGY_RULES.forEach((rule) => {
      initial[rule.code] = fields[rule.code]?.rawValue || '';
    });
    return initial;
  });

  const handleChange = (ruleCode: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [ruleCode]: value
    }));
  };

  const handleSave = () => {
    const updated: Record<string, ExtractedField> = { ...fields };
    LEGAL_METROLOGY_RULES.forEach((rule) => {
      const val = formData[rule.code] || '';
      updated[rule.code] = {
        ruleCode: rule.code,
        fieldName: rule.title,
        rawValue: val,
        confidence: updated[rule.code]?.confidence ?? 1.0,
        bbox: updated[rule.code]?.bbox,
        isEdited: true
      };
    });
    onSaveFields(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-xl">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Inspector Field Override &amp; Corrections
            </h3>
            <p className="text-xs text-slate-500">
              Adjust detected OCR declarations to account for package glare or optical errors.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              Modifying these declarations triggers an immediate recalculation across all 8 Legal Metrology compliance rules.
            </p>
          </div>

          {LEGAL_METROLOGY_RULES.map((rule) => {
            const isTarget = initialRuleCode === rule.code;
            return (
              <div
                key={rule.code}
                className={`space-y-1.5 p-3 rounded-lg border transition-colors ${
                  isTarget ? 'bg-blue-50/40 border-blue-300' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <label
                    htmlFor={`field-input-${rule.code}`}
                    className="text-xs font-bold text-slate-800 flex items-center gap-1.5"
                  >
                    <span className="font-mono bg-slate-100 text-slate-700 px-1 rounded text-[11px]">
                      {rule.code}
                    </span>
                    <span>{rule.title}</span>
                    <span className="text-[11px] font-mono text-blue-700 font-normal">
                      [{rule.citation}]
                    </span>
                  </label>
                  {fields[rule.code]?.isEdited && (
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                      Modified
                    </span>
                  )}
                </div>

                <input
                  id={`field-input-${rule.code}`}
                  type="text"
                  value={formData[rule.code] || ''}
                  onChange={(e) => handleChange(rule.code, e.target.value)}
                  placeholder={`Enter ${rule.title}...`}
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden"
                />
                <p className="text-[11px] text-slate-500">
                  {rule.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save &amp; Re-verify Compliance</span>
          </button>
        </div>
      </div>
    </div>
  );
};
