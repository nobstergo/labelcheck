import {
  ApprovedProduct,
  ApprovedProductFields,
  BoundingBox,
  ComparisonFieldStatus,
  ExtractedField,
  FieldComparisonResult,
  InspectionPackageStatus,
  InspectionResult,
  TamperAnalysis
} from '../types';

interface RuleMapping {
  fieldKey: keyof ApprovedProductFields;
  ruleCode: string;
  displayName: string;
}

export const FIELD_MAPPINGS: RuleMapping[] = [
  { fieldKey: 'product_name', ruleCode: 'LM-002', displayName: 'Product Name / Commodity' },
  { fieldKey: 'net_quantity', ruleCode: 'LM-003', displayName: 'Net Quantity' },
  { fieldKey: 'mrp', ruleCode: 'LM-005', displayName: 'Maximum Retail Price (MRP)' },
  { fieldKey: 'manufacturer', ruleCode: 'LM-001', displayName: 'Manufacturer / Packer' },
  { fieldKey: 'consumer_care', ruleCode: 'LM-006', displayName: 'Consumer Care' },
  { fieldKey: 'country_of_origin', ruleCode: 'LM-007', displayName: 'Country of Origin' },
  { fieldKey: 'date_info', ruleCode: 'LM-004', displayName: 'Date Information' },
  { fieldKey: 'unit_sale_price', ruleCode: 'LM-008', displayName: 'Unit Sale Price (USP)' }
];

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'ltd', 'pvt', 'co', 'of', 'in', 'pack', 'net', 'mrp', 'batch',
  'weight', 'all', 'taxes', 'with', 'from', 'best', 'before', 'mfg', 'pkd', 'unit', 'price',
  'sale', 'email', 'care', 'customer', 'road', 'plot', 'estate', 'india', 'incl', 'inclusive'
]);

// Normalize text for fuzzy token matching
export function cleanText(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract significant keywords
export function extractKeywords(text: string): string[] {
  return cleanText(text)
    .split(' ')
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

// Extract numeric value from text (e.g. "₹ 120.00" -> 120, "500 g" -> 500)
export function extractNumber(text: string): number | null {
  const clean = (text || '').replace(/,/g, '');
  const match = clean.match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
}

// Extract standard quantity unit
export function extractUnit(text: string): string {
  const lower = (text || '').toLowerCase();
  if (lower.includes('kg') || lower.includes('kilogram')) return 'kg';
  if (lower.includes('gm') || lower.includes('gram') || /\bg\b/.test(lower)) return 'g';
  if (lower.includes('ml') || lower.includes('millilitre')) return 'ml';
  if (lower.includes('ltr') || lower.includes('litre') || /\bl\b/.test(lower)) return 'l';
  if (lower.includes('piece') || lower.includes('unit') || lower.includes('pc') || /\bu\b/.test(lower)) return 'u';
  return '';
}

// Convert quantity to normalized base metric value (grams or millilitres)
export function normalizeQuantity(num: number, unit: string): number {
  if (unit === 'kg' || unit === 'l') return num * 1000;
  return num;
}

/**
 * ALGORITHM: Check if candidate image belongs to the parent scanned image profile
 * Evaluates brand tokens, commodity keywords, and conflicting categories
 */
export function evaluateParentMembership(
  parent: ApprovedProduct,
  candidateFullText: string,
  candidateFields: Record<string, ExtractedField>
): {
  belongsToParent: boolean;
  confidenceScore: number;
  reason: string;
  detectedBrandOrCommodity?: string;
} {
  const parentName = parent.name || '';
  const parentFields = parent.fields || {};
  const parentCommodity = parentFields.product_name || parentName;
  const parentKeywords = extractKeywords(
    `${parentName} ${parentCommodity} ${parentFields.manufacturer || ''} ${parent.rawOcrText || ''}`
  );

  const candidateText = cleanText(
    `${candidateFullText || ''} ${Object.values(candidateFields).map((f) => f.rawValue).join(' ')}`
  );

  // If candidate has virtually no text, can't determine
  if (candidateText.length < 10) {
    return {
      belongsToParent: false,
      confidenceScore: 0,
      reason: 'No readable package text detected in frame'
    };
  }

  // Check how many of the parent distinctive keywords appear in the candidate text
  const matchedKeywords = parentKeywords.filter((kw) => candidateText.includes(kw));
  const keywordRatio = parentKeywords.length > 0 ? matchedKeywords.length / parentKeywords.length : 0;

  // Check product name / commodity field specifically
  const candidateCommodity = candidateFields['LM-002']?.rawValue || '';
  const parentNameClean = cleanText(parentCommodity);
  const candidateNameClean = cleanText(candidateCommodity);

  const commodityWordOverlap = extractKeywords(parentCommodity).filter((kw) =>
    candidateNameClean.includes(kw) || candidateText.includes(kw)
  );

  // Severe category conflicts check (e.g. candidate is Tea while parent is Chilli Powder)
  const knownCategories = [
    { label: 'Tea', keywords: ['tea', 'chai', 'leaf', 'assam', 'darjeeling'] },
    { label: 'Spices', keywords: ['chilli', 'masala', 'turmeric', 'powder', 'spice', 'pepper'] },
    { label: 'Biscuits / Bakery', keywords: ['biscuit', 'cookie', 'cookies', 'bakery', 'rusk', 'wafer'] },
    { label: 'Rice / Grains', keywords: ['rice', 'basmati', 'grain', 'wheat', 'atta', 'flour', 'dal'] },
    { label: 'Cosmetics / Lotion', keywords: ['lotion', 'cleansing', 'face', 'shampoo', 'cream', 'skincare'] },
    { label: 'Confectionery', keywords: ['cocoa', 'chocolate', 'candy', 'confectionery', 'sweet'] }
  ];

  const parentCategoryMatch = knownCategories.find((cat) =>
    cat.keywords.some((kw) => parentNameClean.includes(kw))
  );

  let categoryConflict = false;
  let detectedOtherCategory = '';

  if (parentCategoryMatch) {
    for (const cat of knownCategories) {
      if (cat.label === parentCategoryMatch.label) continue;
      // If candidate mentions multiple distinctive keywords of a completely different category
      const clash = cat.keywords.filter((kw) => candidateNameClean.includes(kw) || candidateText.includes(kw));
      if (clash.length >= 2 && !cat.keywords.some((kw) => parentNameClean.includes(kw))) {
        categoryConflict = true;
        detectedOtherCategory = cat.label;
        break;
      }
    }
  }

  if (categoryConflict) {
    return {
      belongsToParent: false,
      confidenceScore: 20,
      reason: `Package appears to be a different commodity (${detectedOtherCategory}) rather than ${parentName}`,
      detectedBrandOrCommodity: candidateCommodity || detectedOtherCategory
    };
  }

  // Strong match conditions:
  // 1. Direct commodity name match or high word overlap
  if (commodityWordOverlap.length >= Math.min(2, extractKeywords(parentCommodity).length)) {
    const score = Math.min(98, Math.round(75 + keywordRatio * 25));
    return {
      belongsToParent: true,
      confidenceScore: score,
      reason: `Matches parent product identity (${commodityWordOverlap.join(', ')})`,
      detectedBrandOrCommodity: candidateCommodity || parentCommodity
    };
  }

  // 2. High overall keyword overlap
  if (keywordRatio >= 0.4 || matchedKeywords.length >= 3) {
    const score = Math.min(95, Math.round(60 + keywordRatio * 35));
    return {
      belongsToParent: true,
      confidenceScore: score,
      reason: `Strong brand and packaging alignment with parent (${matchedKeywords.slice(0, 3).join(', ')})`,
      detectedBrandOrCommodity: candidateCommodity || parentCommodity
    };
  }

  // Weak/No match: candidate does not belong to parent
  return {
    belongsToParent: false,
    confidenceScore: Math.round(keywordRatio * 100),
    reason: `Candidate package text does not match parent profile "${parentName}"`,
    detectedBrandOrCommodity: candidateCommodity || 'Unrecognized product'
  };
}

/**
 * ALGORITHM: Compare specific declaration against parent reference
 */
export function compareFieldValues(
  fieldKey: keyof ApprovedProductFields,
  expectedRaw: string,
  detectedRaw: string
): { status: ComparisonFieldStatus; differenceNote?: string } {
  const exp = (expectedRaw || '').trim();
  const det = (detectedRaw || '').trim();

  // If no expected value benchmark in parent, consider matched/optional
  if (!exp) {
    return { status: 'MATCH' };
  }

  // If expected is defined in parent but absent on candidate
  if (!det) {
    return {
      status: 'MISSING',
      differenceNote: `Missing on label: Expected "${exp}"`
    };
  }

  // 1. MRP comparison: numeric parsing with currency tolerance
  if (fieldKey === 'mrp') {
    const expNum = extractNumber(exp);
    const detNum = extractNumber(det);

    if (expNum !== null && detNum !== null) {
      const diff = detNum - expNum;
      if (Math.abs(diff) < 0.01) {
        return { status: 'MATCH' };
      } else {
        const sign = diff > 0 ? `+₹${diff.toFixed(2)}` : `-₹${Math.abs(diff).toFixed(2)}`;
        return {
          status: 'MISMATCH',
          differenceNote: `MRP mismatch: Expected ₹${expNum}, found ₹${detNum} (${sign})`
        };
      }
    }
    if (cleanText(exp) === cleanText(det)) return { status: 'MATCH' };
    return {
      status: 'MISMATCH',
      differenceNote: `MRP mismatch: Expected ${exp}, found ${det}`
    };
  }

  // 2. Net Quantity comparison: numeric + metric conversion
  if (fieldKey === 'net_quantity') {
    const expNum = extractNumber(exp);
    const detNum = extractNumber(det);
    const expUnit = extractUnit(exp);
    const detUnit = extractUnit(det);

    if (expNum !== null && detNum !== null) {
      // Normalize to base units
      const expBase = normalizeQuantity(expNum, expUnit);
      const detBase = normalizeQuantity(detNum, detUnit);

      if (Math.abs(expBase - detBase) < 0.01) {
        return { status: 'MATCH' };
      } else {
        return {
          status: 'MISMATCH',
          differenceNote: `Quantity mismatch: Expected ${exp}, found ${det}`
        };
      }
    }

    if (cleanText(exp) === cleanText(det)) return { status: 'MATCH' };
    return {
      status: 'MISMATCH',
      differenceNote: `Quantity mismatch: Expected ${exp}, found ${det}`
    };
  }

  // 3. Date declaration: format and statutory presence
  if (fieldKey === 'date_info') {
    const hasDatePattern = /\b(202\d|203\d|\d{1,2}[\/\-.]\d{2,4}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|mfg|use by|best before|pkd|batch)\b/i.test(det);
    if (hasDatePattern || det.length >= 3) {
      return { status: 'MATCH' };
    }
    return {
      status: 'REVIEW',
      differenceNote: `Date format needs check: ${det}`
    };
  }

  // 4. Consumer Care
  if (fieldKey === 'consumer_care') {
    const expDigits = exp.replace(/\D/g, '');
    const detDigits = det.replace(/\D/g, '');
    if (expDigits && detDigits && (detDigits.includes(expDigits) || expDigits.includes(detDigits))) {
      return { status: 'MATCH' };
    }
    const expClean = cleanText(exp);
    const detClean = cleanText(det);
    if (detClean.includes(expClean) || expClean.includes(detClean)) {
      return { status: 'MATCH' };
    }
    // If contact email or phone or website is present in both
    if (det.includes('@') || detDigits.length >= 8) {
      return { status: 'MATCH' };
    }
    return {
      status: 'REVIEW',
      differenceNote: `Consumer care details differ from reference`
    };
  }

  // 5. Country of origin
  if (fieldKey === 'country_of_origin') {
    const expClean = cleanText(exp);
    const detClean = cleanText(det);
    if (detClean.includes(expClean) || expClean.includes(detClean) || (detClean.includes('india') && expClean.includes('india'))) {
      return { status: 'MATCH' };
    }
    return {
      status: 'MISMATCH',
      differenceNote: `Origin mismatch: Expected ${exp}, found ${det}`
    };
  }

  // 6. Manufacturer / Packer
  if (fieldKey === 'manufacturer') {
    const expWords = extractKeywords(exp);
    const detClean = cleanText(det);
    const matched = expWords.filter((w) => detClean.includes(w));
    if (matched.length >= Math.min(2, Math.ceil(expWords.length * 0.3)) || detClean.length > 15) {
      return { status: 'MATCH' };
    }
    return {
      status: 'MISMATCH',
      differenceNote: `Manufacturer differs from reference`
    };
  }

  // 7. Product Name
  if (fieldKey === 'product_name') {
    const expWords = extractKeywords(exp);
    const detClean = cleanText(det);
    const matched = expWords.filter((w) => detClean.includes(w));
    if (matched.length >= Math.min(2, Math.ceil(expWords.length * 0.35))) {
      return { status: 'MATCH' };
    }
    return {
      status: 'MISMATCH',
      differenceNote: `Product name differs: Expected "${exp}"`
    };
  }

  // 8. Unit Sale Price (USP)
  if (fieldKey === 'unit_sale_price') {
    const expNum = extractNumber(exp);
    const detNum = extractNumber(det);
    if (expNum !== null && detNum !== null && Math.abs(expNum - detNum) < 0.05) {
      return { status: 'MATCH' };
    }
    if (cleanText(exp) === cleanText(det)) return { status: 'MATCH' };
    return {
      status: 'MISMATCH',
      differenceNote: `Unit sale price mismatch: Expected ${exp}, found ${det}`
    };
  }

  // Default fallback
  if (cleanText(exp) === cleanText(det)) {
    return { status: 'MATCH' };
  }

  return {
    status: 'REVIEW',
    differenceNote: `Value differs: Expected ${exp}, found ${det}`
  };
}

/**
 * Main Comparison Pipeline:
 * 1. Checks if candidate belongs to parent product scanned reference
 * 2. If belongs to parent, compares dynamic packaging declarations
 */
export function compareProductInspection(
  approvedProduct: ApprovedProduct,
  extractedFields: Record<string, ExtractedField>,
  rawFullText: string,
  capturedImageUrl: string,
  tamperAnalysis?: TamperAnalysis
): InspectionResult {
  const timestamp = new Date().toISOString();
  const inspectionId = `INSP-${Date.now().toString(36).toUpperCase()}`;

  // Heuristic: Check if any readable package is visible in frame
  const detectedKeys = Object.keys(extractedFields).filter((k) => extractedFields[k]?.rawValue?.trim());
  const hasSubstantialText = (rawFullText || '').trim().length >= 10;

  if (detectedKeys.length === 0 && !hasSubstantialText) {
    return {
      id: inspectionId,
      timestamp,
      status: 'WAITING',
      statusMessage: 'Waiting for product... Align label in viewfinder',
      approvedProductId: approvedProduct.id,
      approvedProductName: approvedProduct.name,
      referenceImageUrl: approvedProduct.referenceImageUrl,
      fields: [],
      capturedImageUrl,
      rawFullText,
      belongsToParent: false,
      parentMatchConfidence: 0
    };
  }

  // STEP 1: ALGORITHMIC PARENT MEMBERSHIP EVALUATION
  const membership = evaluateParentMembership(approvedProduct, rawFullText, extractedFields);

  // If the scanned package does NOT belong to the parent scanned image
  if (!membership.belongsToParent) {
    return {
      id: inspectionId,
      timestamp,
      status: 'FOREIGN_PRODUCT',
      statusMessage: `Foreign Product Detected: Scanned package does not belong to parent "${approvedProduct.name}". (${membership.reason})`,
      approvedProductId: approvedProduct.id,
      approvedProductName: approvedProduct.name,
      referenceImageUrl: approvedProduct.referenceImageUrl,
      fields: [
        {
          fieldKey: 'product_name',
          fieldName: 'Parent Product Identity',
          ruleCode: 'LM-002',
          expected: approvedProduct.name,
          detected: membership.detectedBrandOrCommodity || 'Different Product',
          status: 'MISMATCH',
          differenceNote: membership.reason,
          confidence: membership.confidenceScore / 100
        }
      ],
      capturedImageUrl,
      mismatchSummary: membership.reason,
      rawFullText,
      belongsToParent: false,
      parentMatchConfidence: membership.confidenceScore,
      isForeignProduct: true,
      foreignReason: membership.reason,
      matchedCount: 0,
      totalParametersCount: Object.values(approvedProduct.fields).filter((v) => typeof v === 'string' && v.trim().length > 0).length || 8,
      tamperAnalysis
    };
  }

  // STEP 2: Belongs to parent! Now compare all dynamic declarations against parent reference
  const comparisonResults: FieldComparisonResult[] = [];
  const mismatches: string[] = [];
  let hasFlag = false;
  let hasReview = false;

  for (const mapping of FIELD_MAPPINGS) {
    const expectedValue = approvedProduct.fields[mapping.fieldKey] || '';
    if (!expectedValue.trim()) continue; // Not configured in parent

    const detectedField = extractedFields[mapping.ruleCode];
    const detectedValue = detectedField?.rawValue || '';
    const bbox: BoundingBox | undefined = detectedField?.bbox;
    const confidence = detectedField?.confidence ?? (detectedValue ? 0.95 : 0);

    let { status, differenceNote } = compareFieldValues(
      mapping.fieldKey,
      expectedValue,
      detectedValue
    );

    // Check if this specific field was visually flagged for physical tampering
    const isFieldTampered = Boolean(
      tamperAnalysis?.isTampered &&
        (tamperAnalysis.affectedFields.includes(mapping.ruleCode) ||
          tamperAnalysis.affectedFields.includes(mapping.fieldKey) ||
          (tamperAnalysis.affectedFields.length === 0 && mapping.fieldKey === 'mrp'))
    );

    let tamperNote: string | undefined;
    if (isFieldTampered) {
      status = 'MISMATCH';
      tamperNote = `Physical Tampering Detected: ${tamperAnalysis?.details || 'Overlaid sticker, handwritten ink, or visual mismatch against parent'}`;
      differenceNote = tamperNote;
      hasFlag = true;
      mismatches.push(tamperNote);
    } else if (status === 'MISMATCH' || status === 'MISSING') {
      hasFlag = true;
      if (differenceNote) mismatches.push(differenceNote);
    } else if (status === 'REVIEW') {
      hasReview = true;
    }

    comparisonResults.push({
      fieldKey: mapping.fieldKey,
      fieldName: mapping.displayName,
      ruleCode: mapping.ruleCode,
      expected: expectedValue,
      detected: detectedValue,
      status,
      differenceNote,
      bbox,
      confidence,
      isTampered: isFieldTampered,
      tamperNote
    });
  }

  let finalStatus: InspectionPackageStatus = 'PASS';
  let statusMessage = 'Verified: All label declarations match';

  if (tamperAnalysis?.isTampered) {
    finalStatus = 'FLAG';
    statusMessage = `Tamper Alert: ${tamperAnalysis.details}`;
  } else if (hasFlag) {
    finalStatus = 'FLAG';
    statusMessage = mismatches.length > 0 ? mismatches[0] : 'Discrepancy found against reference';
  } else if (hasReview) {
    finalStatus = 'REVIEW';
    statusMessage = 'Check required for some label declarations';
  }

  const matchedCount = comparisonResults.filter((f) => f.status === 'MATCH').length;
  const totalParametersCount = comparisonResults.length;

  return {
    id: inspectionId,
    timestamp,
    status: finalStatus,
    statusMessage,
    approvedProductId: approvedProduct.id,
    approvedProductName: approvedProduct.name,
    referenceImageUrl: approvedProduct.referenceImageUrl,
    fields: comparisonResults,
    capturedImageUrl,
    mismatchSummary: mismatches.join('; '),
    rawFullText,
    belongsToParent: true,
    parentMatchConfidence: membership.confidenceScore,
    isForeignProduct: false,
    matchedCount,
    totalParametersCount,
    tamperAnalysis
  };
}
