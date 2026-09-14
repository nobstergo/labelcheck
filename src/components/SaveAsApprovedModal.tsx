import React, { useState } from 'react';
import { ExtractedField } from '../types';
import { createApprovedProductFromScan } from '../services/productStorage';
import { ShieldCheck, Check, X } from 'lucide-react';

interface SaveAsApprovedModalProps {
  isOpen: boolean;
  onClose: () => void;
  extractedFields: Record<string, ExtractedField>;
  imageUrl?: string;
  defaultCommodity?: string;
  onSaved: (productId: string) => void;
}

export const SaveAsApprovedModal: React.FC<SaveAsApprovedModalProps> = ({
  isOpen,
  onClose,
  extractedFields,
  imageUrl,
  defaultCommodity,
  onSaved
}) => {
  if (!isOpen) return null;

  const defaultName =
    extractedFields['LM-002']?.rawValue || defaultCommodity || 'New Approved Reference';

  const [productName, setProductName] = useState(defaultName);
  const [fields, setFields] = useState({
    product_name: extractedFields['LM-002']?.rawValue || '',
    net_quantity: extractedFields['LM-003']?.rawValue || '',
    mrp: extractedFields['LM-005']?.rawValue || '',
    manufacturer: extractedFields['LM-001']?.rawValue || '',
    consumer_care: extractedFields['LM-006']?.rawValue || '',
    country_of_origin: extractedFields['LM-007']?.rawValue || 'India',
    date_info: extractedFields['LM-004']?.rawValue || 'Valid Month and Year',
    unit_sale_price: extractedFields['LM-008']?.rawValue || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) return;

    // Create synthetic fields map to pass into createApprovedProductFromScan
    const syntheticFields: Record<string, ExtractedField> = {
      'LM-001': { ruleCode: 'LM-001', fieldName: 'Manufacturer', rawValue: fields.manufacturer, confidence: 1 },
      'LM-002': { ruleCode: 'LM-002', fieldName: 'Product Name', rawValue: fields.product_name, confidence: 1 },
      'LM-003': { ruleCode: 'LM-003', fieldName: 'Net Quantity', rawValue: fields.net_quantity, confidence: 1 },
      'LM-004': { ruleCode: 'LM-004', fieldName: 'Date Info', rawValue: fields.date_info, confidence: 1 },
      'LM-005': { ruleCode: 'LM-005', fieldName: 'MRP', rawValue: fields.mrp, confidence: 1 },
      'LM-006': { ruleCode: 'LM-006', fieldName: 'Consumer Care', rawValue: fields.consumer_care, confidence: 1 },
      'LM-007': { ruleCode: 'LM-007', fieldName: 'Country of Origin', rawValue: fields.country_of_origin, confidence: 1 },
      'LM-008': { ruleCode: 'LM-008', fieldName: 'Unit Sale Price', rawValue: fields.unit_sale_price, confidence: 1 }
    };

    const newProd = createApprovedProductFromScan(productName, syntheticFields, imageUrl);
    onSaved(newProd.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-slate-800" />
            <h3 className="text-base font-bold text-slate-950">
              Save as Approved Product Reference
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600">
          Review and verify extracted values before saving this package as a benchmark for Inspect Mode.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Reference Name *
            </label>
            <input
              type="text"
              required
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md font-medium focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Net Quantity *
              </label>
              <input
                type="text"
                required
                value={fields.net_quantity}
                onChange={(e) => setFields({ ...fields, net_quantity: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                MRP (incl. taxes) *
              </label>
              <input
                type="text"
                required
                value={fields.mrp}
                onChange={(e) => setFields({ ...fields, mrp: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Manufacturer / Packer
            </label>
            <input
              type="text"
              value={fields.manufacturer}
              onChange={(e) => setFields({ ...fields, manufacturer: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md font-medium focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Consumer Care
              </label>
              <input
                type="text"
                value={fields.consumer_care}
                onChange={(e) => setFields({ ...fields, consumer_care: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md font-medium focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Country of Origin
              </label>
              <input
                type="text"
                value={fields.country_of_origin}
                onChange={(e) => setFields({ ...fields, country_of_origin: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md font-medium focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1 px-4 py-1.5 bg-slate-900 text-white rounded-md hover:bg-slate-800 font-semibold shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save & Use in Inspect</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
