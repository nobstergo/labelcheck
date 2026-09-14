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
