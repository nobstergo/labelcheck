export type RuleStatus = 'PASS' | 'REVIEW' | 'MISSING' | 'NOT_APPLICABLE';

export interface BoundingBox {
  ymin: number; // 0 to 100 (%)
  xmin: number; // 0 to 100 (%)
  ymax: number; // 0 to 100 (%)
  xmax: number; // 0 to 100 (%)
}

export interface OCRToken {
  id: string;
  text: string;
  confidence: number; // 0 to 1
  bbox: BoundingBox;
}

export interface ExtractedField {
  ruleCode: string;
  fieldName: string;
  rawValue: string;
  normalizedValue?: string;
  confidence: number;
  bbox?: BoundingBox;
  tokenIds?: string[];
  isEdited?: boolean;
}

export interface ComplianceRule {
  code: string; // e.g. 'LM-001'
  title: string;
  citation: string; // e.g. 'Rule 6(1)(a)'
  description: string;
  mandatory: boolean;
  notes?: string;
}

export interface RuleEvaluation {
  ruleCode: string;
  ruleTitle: string;
  citation: string;
  status: RuleStatus;
  detectedText: string;
  confidence: number;
  bbox?: BoundingBox;
  findings: string;
  actionableNote?: string;
  statutoryReference: string;
}

export interface VerificationResult {
  id: string;
  timestamp: string;
  imageFileName: string;
  imageUrl: string;
  imageDimensions: {
    width: number;
    height: number;
  };
  commodityType: string;
  ocrTokens: OCRToken[];
  extractedFields: Record<string, ExtractedField>;
  evaluations: RuleEvaluation[];
  summary: {
    passCount: number;
    reviewCount: number;
    missingCount: number;
    notApplicableCount: number;
    totalRules: number;
  };
}

export interface SampleProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  expectedOutcome: string;
}

export type NavigationTab = 'scan' | 'inspect' | 'history' | 'about';

export interface ApprovedProductFields {
  product_name?: string; // LM-002
  net_quantity?: string; // LM-003
  mrp?: string; // LM-005
  manufacturer?: string; // LM-001
  consumer_care?: string; // LM-006
  country_of_origin?: string; // LM-007
  date_info?: string; // LM-004
  unit_sale_price?: string; // LM-008
}

export interface ApprovedProduct {
  id: string;
  name: string;
  category?: string;
  createdAt: string;
  fields: ApprovedProductFields;
  referenceImageUrl?: string; // The parent scanned benchmark image
  rawOcrText?: string;
  parentKeywords?: string[];
  commodityType?: string;
}

export type ComparisonFieldStatus = 'MATCH' | 'MISMATCH' | 'MISSING' | 'REVIEW';
export type InspectionPackageStatus = 'PASS' | 'FLAG' | 'REVIEW' | 'WAITING' | 'FOREIGN_PRODUCT';

export type TamperType =
  | 'STICKER_OVERLAY'
  | 'HANDWRITTEN_OVERWRITE'
  | 'CORRECTION_FLUID'
  | 'FONT_PRINT_MISMATCH'
  | 'SURFACE_ALTERATION'
  | 'NONE';

export interface TamperAnalysis {
  isTampered: boolean;
  tamperType: TamperType;
  confidence: number; // 0 to 1
  affectedFields: string[]; // e.g. ['LM-005', 'mrp']
  details: string;
}

export interface FieldComparisonResult {
  fieldKey: keyof ApprovedProductFields;
  fieldName: string;
  ruleCode: string;
  expected: string;
  detected: string;
  status: ComparisonFieldStatus;
  differenceNote?: string;
  bbox?: BoundingBox;
  confidence: number;
  isTampered?: boolean;
  tamperNote?: string;
}

export interface InspectionResult {
  id: string;
  timestamp: string;
  status: InspectionPackageStatus;
  statusMessage: string;
  approvedProductId: string;
  approvedProductName: string;
  referenceImageUrl?: string; // Parent scanned image for visual verification
  fields: FieldComparisonResult[];
  capturedImageUrl: string;
  mismatchSummary?: string;
  rawFullText?: string;
  belongsToParent?: boolean;
  parentMatchConfidence?: number; // 0-100%
  isForeignProduct?: boolean;
  foreignReason?: string;
  packetNumber?: number;
  isResolved?: boolean;
  resolutionNote?: string;
  matchedCount?: number;
  totalParametersCount?: number;
  tamperAnalysis?: TamperAnalysis;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  provider: 'google';
  lastLoginAt: string;
}

export interface ScanHistoryItem {
  id: string;
  userId: string;
  timestamp: string;
  imageFileName: string;
  imageUrl?: string;
  commodityType: string;
  summary: {
    passCount: number;
    reviewCount: number;
    missingCount: number;
    notApplicableCount: number;
    totalRules: number;
  };
  evaluations: RuleEvaluation[];
  extractedFields: Record<string, ExtractedField>;
}

export interface InspectionCounters {
  totalChecked: number;
  passed: number;
  flagged: number;
  review: number;
}

export interface InspectionSession {
  id: string;
  productId: string;
  productName: string;
  startTime: string;
  endTime?: string;
  counters: InspectionCounters;
  commonIssues: Array<{ issue: string; count: number }>;
  records: InspectionResult[];
}

