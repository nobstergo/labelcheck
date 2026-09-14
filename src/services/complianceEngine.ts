import { ExtractedField, RuleEvaluation, RuleStatus } from '../types';
import { LEGAL_METROLOGY_RULES } from '../data/rulesDefinition';

interface ComplianceResult {
  evaluations: RuleEvaluation[];
  summary: {
    totalRules: number;
    passCount: number;
    reviewCount: number;
    missingCount: number;
    notApplicableCount: number;
  };
}

export function evaluateCompliance(
  fields: Record<string, ExtractedField>,
  fullRawText = ''
): ComplianceResult {
  const evaluations: RuleEvaluation[] = [];
  const lowerFullText = fullRawText.toLowerCase();

  for (const rule of LEGAL_METROLOGY_RULES) {
    const field = fields[rule.code];
    const val = (field?.rawValue || '').trim();

    let status: RuleStatus = 'MISSING';
    let findings = 'Declaration not detected on visible label.';
    let actionableNote = 'Check package to ensure this declaration is printed.';

    switch (rule.code) {
      case 'LM-001': { // Manufacturer / Packer / Importer
        if (val) {
          const hasPin = /\b\d{6}\b/.test(val) || /\b\d{6}\b/.test(lowerFullText);
          const hasLocationKeywords = /(road|street|nagar|plot|industrial|dist|state|india|bengaluru|mumbai|delhi|gujarat|pune|chennai|hyderabad|estate|block|sector|city)/i.test(val);

          if (val.length > 20 && (hasPin || hasLocationKeywords)) {
            status = 'PASS';
            findings = 'Complete manufacturer/packer name and postal address found.';
            actionableNote = 'Meets Rule 6(1)(a) requirement.';
          } else {
            status = 'REVIEW';
            findings = 'Address lacks complete postal details or PIN code.';
            actionableNote = 'Check if complete address with state and PIN is printed on package.';
          }
        } else {
          status = 'MISSING';
          findings = 'Manufacturer, packer, or importer address not detected.';
          actionableNote = 'Rule 6(1)(a) requires explicit name and complete address.';
        }
        break;
      }

      case 'LM-002': { // Common or Generic Name
        if (val) {
          if (val.length >= 2) {
            status = 'PASS';
            findings = `Generic product name declared: "${val}".`;
            actionableNote = 'Meets Rule 6(1)(b) requirement.';
          } else {
            status = 'REVIEW';
            findings = `Product name "${val}" is too short or unclear.`;
            actionableNote = 'State generic name clearly alongside any brand name.';
          }
        } else {
          status = 'MISSING';
          findings = 'Common or generic commodity name not detected.';
          actionableNote = 'Commodity must be explicitly named on package.';
        }
        break;
      }

      case 'LM-003': { // Net Quantity
        if (val) {
          const hasNonStandardUnit = /\b(gms?|kilos?|litres?|ltrs?|mls?)\b/i.test(val);
          const hasStandardUnit = /\b(\d+(\.\d+)?)\s*(g|kg|ml|l|m|cm|mm|n|units|tablets|pcs|pieces)\b/i.test(val);

          if (hasNonStandardUnit) {
            status = 'REVIEW';
            findings = `Uses non-standard abbreviation (e.g., "gm"). Must use standard SI symbol "g".`;
            actionableNote = 'Use "g" instead of "gm"/"gms", or "mL"/"ml" instead of "mls".';
          } else if (hasStandardUnit) {
            status = 'PASS';
            findings = `Net quantity declared in standard metric unit: "${val}".`;
            actionableNote = 'Conforms to Rule 6(1)(c) and Second Schedule.';
          } else {
            status = 'REVIEW';
            findings = `Net quantity "${val}" missing clear metric unit.`;
            actionableNote = 'Verify standard unit symbol (g, kg, ml, l, or count).';
          }
        } else {
          status = 'MISSING';
          findings = 'Net quantity declaration not detected.';
          actionableNote = 'Mandatory declaration under Rule 6(1)(c).';
        }
        break;
      }

      case 'LM-004': { // Month & Year
        if (val) {
          const hasValidDateFormat = /(\b(0[1-9]|1[0-2])[\/\.-](20\d\d|\d\d)\b)|(\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s,]+(20\d\d|\d\d)\b)/i.test(val);
          if (hasValidDateFormat) {
            status = 'PASS';
            findings = `Manufacture or packing date declared: "${val}".`;
            actionableNote = 'Meets Rule 6(1)(d) month and year requirement.';
          } else {
            status = 'REVIEW';
            findings = `Date "${val}" format is unclear. Must indicate month and year.`;
            actionableNote = 'Follow MM/YYYY or Month YYYY format.';
          }
        } else {
          status = 'MISSING';
          findings = 'Month and year of manufacture or packing not detected.';
          actionableNote = 'Mandatory declaration under Rule 6(1)(d).';
        }
        break;
      }

      case 'LM-005': { // Maximum Retail Price (MRP)
        if (val) {
          const hasCurrency = /(₹|rs\.?|inr|rupees)/i.test(val) || /(₹|rs\.?|inr|rupees)/i.test(lowerFullText);
          
          // Comprehensive tax inclusive matching (handles: "Incl. of all taxes", "incl of all taxes", "incl. of taxes", "incl.of all taxes", "incl taxes", "inclusive of all taxes", "inc. of all taxes", etc.)
          const combinedTaxSearch = `${val} ${lowerFullText}`.toLowerCase();
          const hasTaxesQualifier = 
            /(incl\.?|inclusive|inc\.?)\s*(of)?\s*(all)?\s*tax(es)?/i.test(combinedTaxSearch) ||
            /tax(es)?\s*(incl\.?|inclusive|included)/i.test(combinedTaxSearch) ||
            /all\s*tax(es)?\s*(incl\.?|inclusive|included)/i.test(combinedTaxSearch) ||
            /all\s*taxes/i.test(combinedTaxSearch) ||
            /\bincl\b/i.test(combinedTaxSearch) ||
            /\b(incl|inc|inclusive)\b[^\n\r]{0,30}\b(tax|taxes|gst)\b/i.test(combinedTaxSearch);

          const hasNumericPrice = /\d+(\.\d{1,2})?/.test(val);

          if (hasNumericPrice && hasTaxesQualifier && hasCurrency) {
            status = 'PASS';
            findings = `MRP declared with currency and tax inclusive text: "${val}".`;
            actionableNote = 'Complies with Rule 6(1)(e).';
          } else if (hasNumericPrice && (hasTaxesQualifier || hasCurrency)) {
            status = 'PASS';
            findings = `MRP declared as "${val}" with tax/currency indication.`;
            actionableNote = 'Complies with Rule 6(1)(e).';
          } else if (hasNumericPrice) {
            status = 'REVIEW';
            findings = `Price figure "${val}" detected. Verify standard format "MRP ₹ xx.xx (incl. of all taxes)".`;
            actionableNote = 'Rule 6(1)(e) requires "inclusive of all taxes" statement with MRP.';
          } else {
            status = 'REVIEW';
            findings = `Price text "${val}" could not be read clearly.`;
            actionableNote = 'Check price legibility on package.';
          }
        } else {
          // Check if MRP or price is in raw text
          const mrpInFullText = /(mrp|maximum\s*retail\s*price)[^0-9\n\r]{0,20}(\d+(\.\d{1,2})?)/i.exec(lowerFullText);
          if (mrpInFullText) {
            status = 'PASS';
            findings = `MRP detected in label context: "${mrpInFullText[0]}".`;
            actionableNote = 'Complies with Rule 6(1)(e).';
          } else {
            status = 'MISSING';
            findings = 'Maximum Retail Price (MRP) declaration not detected.';
            actionableNote = 'Mandatory declaration under Rule 6(1)(e).';
          }
        }
        break;
      }

      case 'LM-006': { // Consumer Care
        if (val) {
          const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(val) || /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(lowerFullText);
          const hasPhone = /(\+?91[\-\s]?)?[6-9]\d{9}|\b1800[\-\s]?\d{3,4}[\-\s]?\d{3,4}\b|\b0\d{2,4}[\-\s]?\d{6,8}\b/.test(val) || /1800|\bhelpline\b|\btoll\s*free\b|\bcall\b/i.test(lowerFullText);
          const hasExecutiveOrAddress = /(manager|executive|officer|cell|care|desk|feedback|grievance|address)/i.test(val) || /(consumer\s*care|customer\s*care)/i.test(lowerFullText);

          if ((hasEmail || hasPhone) && hasExecutiveOrAddress) {
            status = 'PASS';
            findings = 'Consumer care contact details found with valid phone or email.';
            actionableNote = 'Complies with Rule 6(1)(f).';
          } else if (hasEmail || hasPhone) {
            status = 'REVIEW';
            findings = 'Contact channel found, but person/designation for grievances is unclear.';
            actionableNote = 'Name person or office to contact for complaints under Rule 6(1)(f).';
          } else {
            status = 'REVIEW';
            findings = 'Consumer care text detected but missing phone number or email address.';
            actionableNote = 'Provide valid telephone number and email address.';
          }
        } else {
          status = 'MISSING';
          findings = 'Consumer care contact details not detected.';
          actionableNote = 'Mandatory declaration under Rule 6(1)(f).';
        }
        break;
      }

      case 'LM-007': { // Country of Origin
        if (val) {
          status = 'PASS';
          findings = `Country of origin declared: "${val}".`;
          actionableNote = 'Complies with Rule 6(1)(n).';
        } else {
          status = 'MISSING';
          findings = 'Country of origin not detected on package.';
          actionableNote = 'Mandatory declaration under Rule 6(1)(n).';
        }
        break;
      }

      case 'LM-008': { // Unit Sale Price (USP)
        if (val) {
          const hasUspPattern = /(usp|unit\s*sale\s*price|unit\s*price|₹\s*\/?\s*(g|kg|ml|l|m|piece|unit|n)|rs\.?\s*\/?\s*(g|kg|ml|l|m|piece|unit|n)|\/\s*(g|kg|ml|l|m|piece|unit|n))/i.test(val);
          if (hasUspPattern) {
            status = 'PASS';
            findings = `Unit Sale Price declared: "${val}".`;
            actionableNote = 'Complies with Rule 6(10).';
          } else {
            status = 'PASS';
            findings = `Unit Sale Price indicated: "${val}".`;
            actionableNote = 'Conforms to Rule 6(10).';
          }
        } else {
          // Check net quantity field - USP is only mandatory for packages containing > 1 unit/measure or multi-units
          const netQtyVal = (fields['LM-003']?.rawValue || '').toLowerCase();
          const isSingleUnitOrExempt = 
            /\b(1\s*(n|unit|piece|pc|item|bottle|pack|set))\b/i.test(netQtyVal) ||
            /\b(1\s*(kg|l|litre|liter|meter|m))\b/i.test(netQtyVal) ||
            !netQtyVal;

          if (isSingleUnitOrExempt) {
            status = 'NOT_APPLICABLE';
            findings = 'Unit Sale Price (USP) not required for single-unit / standard quantity package under Rule 6(10).';
            actionableNote = 'Rule 6(10) exempts single-unit items where retail price equals unit price.';
          } else {
            // Conditional check under Rule 6(10)
            status = 'NOT_APPLICABLE';
            findings = 'Unit Sale Price (USP) is conditional under Rule 6(10) (applicable for packages containing > 1 unit/measure).';
            actionableNote = 'Verify if commodity requires unit price per g/kg/ml/l.';
          }
        }
        break;
      }
    }

    evaluations.push({
      ruleCode: rule.code,
      ruleTitle: rule.title,
      citation: rule.citation,
      statutoryReference: rule.citation,
      status,
      detectedText: val,
      confidence: field?.confidence ?? (val ? 0.9 : 0.0),
      findings,
      actionableNote,
      bbox: field?.bbox
    });
  }

  // User requirement: Keep review and missing checks on top, passed checks on bottom
  const statusPriority: Record<RuleStatus, number> = {
    'REVIEW': 1,
    'MISSING': 2,
    'NOT_APPLICABLE': 3,
    'PASS': 4
  };

  evaluations.sort((a, b) => {
    const pA = statusPriority[a.status] || 99;
    const pB = statusPriority[b.status] || 99;
    if (pA !== pB) return pA - pB;
    return a.ruleCode.localeCompare(b.ruleCode);
  });

  const summary = {
    totalRules: evaluations.length,
    passCount: evaluations.filter((e) => e.status === 'PASS').length,
    reviewCount: evaluations.filter((e) => e.status === 'REVIEW').length,
    missingCount: evaluations.filter((e) => e.status === 'MISSING').length,
    notApplicableCount: evaluations.filter((e) => e.status === 'NOT_APPLICABLE').length
  };

  return { evaluations, summary };
}
