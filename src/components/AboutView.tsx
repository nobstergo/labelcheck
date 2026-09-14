import React from 'react';
import { ShieldCheck, Camera, CheckSquare, Layers, FileText } from 'lucide-react';

export const AboutView: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto text-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 space-y-1">
        <h2 className="text-xl font-bold tracking-tight text-slate-950">
          About LabelCheck
        </h2>
        <p className="text-xs text-slate-600">
          Statutory compliance verification and continuous quality inspection for packaged commodities.
        </p>
      </div>

      {/* Primary Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-2.5">
          <div className="flex items-center gap-2 text-slate-900">
            <CheckSquare className="w-5 h-5 text-slate-700" />
            <h3 className="text-sm font-bold">Scan Mode (Rule 6 Audit)</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Performs an in-depth preliminary statutory audit of a single package label image. Identifies all Rule 6 declarations, evaluates compliance criteria (mandatory elements, formatting, unit rules), maps visual bounding box evidence on the original label, and generates printable inspection sheets.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-2.5">
          <div className="flex items-center gap-2 text-slate-900">
            <Camera className="w-5 h-5 text-slate-700" />
            <h3 className="text-sm font-bold">Inspect Mode (Continuous Verification)</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Enables hands-free, automated verification on the device camera. Users select or create a verified reference product once, after which Inspect Mode repeatedly captures frames, detects printed declarations, and compares them against approved reference benchmarks to output instantaneous PASS or FLAG results.
          </p>
        </div>
      </div>

      {/* Rule 6 Statutory Declarations Reference Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="text-sm font-bold text-slate-900">
            Legal Metrology (Packaged Commodities) Rules, 2011 Declarations
          </h3>
          <p className="text-xs text-slate-500">
            Mandatory declarations required under Rule 6 on the Principal Display Panel:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
            <div className="font-bold text-slate-900">1. Manufacturer / Packer Details</div>
            <div className="text-slate-500 text-[11px]">Rule 6(1)(a)</div>
            <div className="text-slate-600 leading-relaxed">
              Complete name and address of the manufacturer, packer, or importer.
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
            <div className="font-bold text-slate-900">2. Generic Name of Commodity</div>
            <div className="text-slate-500 text-[11px]">Rule 6(1)(b)</div>
            <div className="text-slate-600 leading-relaxed">
              Generic or common name of the commodity contained in the package.
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
            <div className="font-bold text-slate-900">3. Net Quantity Declaration</div>
            <div className="text-slate-500 text-[11px]">Rule 6(1)(c)</div>
            <div className="text-slate-600 leading-relaxed">
              Net quantity in standard metric units (weight, measure, or count) without non-standard qualifiers.
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
            <div className="font-bold text-slate-900">4. Date of Manufacture / Pre-packing</div>
            <div className="text-slate-500 text-[11px]">Rule 6(1)(d)</div>
            <div className="text-slate-600 leading-relaxed">
              Month and year of manufacture or pre-packing.
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
            <div className="font-bold text-slate-900">5. Maximum Retail Price (MRP)</div>
            <div className="text-slate-500 text-[11px]">Rule 6(1)(e)</div>
            <div className="text-slate-600 leading-relaxed">
              Retail sale price clearly indicating inclusive of all taxes in Rupees.
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
            <div className="font-bold text-slate-900">6. Consumer Care Contact</div>
            <div className="text-slate-500 text-[11px]">Rule 6(1)(f)</div>
            <div className="text-slate-600 leading-relaxed">
              Name, address, telephone number, and email address of designated person for complaints.
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
            <div className="font-bold text-slate-900">7. Country of Origin</div>
            <div className="text-slate-500 text-[11px]">Rule 6(10) / Rule 6(1)(b)</div>
            <div className="text-slate-600 leading-relaxed">
              Country of origin explicitly declared for imported or domestic packaged commodities.
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
            <div className="font-bold text-slate-900">8. Unit Sale Price (USP)</div>
            <div className="text-slate-500 text-[11px]">Rule 6(11)</div>
            <div className="text-slate-600 leading-relaxed">
              Unit price declared per gram, kilogram, millilitre, litre, or item for multi-quantity packages.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
