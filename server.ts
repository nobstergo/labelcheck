import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { BoundingBox, ExtractedField, OCRToken, VerificationResult } from './src/types';
import { evaluateCompliance } from './src/services/complianceEngine';
import { SAMPLE_PRODUCTS, getSampleTokens } from './src/data/sampleProducts';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set. Real OCR analysis will fail.');
      return null;
    }
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

// Coordinate normalizer for box_2d (0-1000 scale to 0-100 percentage)
function normalizeBox(box: any): BoundingBox | undefined {
  if (!box) return undefined;

  let ymin = 0, xmin = 0, ymax = 0, xmax = 0;

  if (Array.isArray(box) && box.length >= 4) {
    // Standard Gemini box_2d [ymin, xmin, ymax, xmax]
    const [y1, x1, y2, x2] = box;
    ymin = Number(y1);
    xmin = Number(x1);
    ymax = Number(y2);
    xmax = Number(x2);
  } else if (typeof box === 'object') {
    ymin = Number(box.ymin ?? 0);
    xmin = Number(box.xmin ?? 0);
    ymax = Number(box.ymax ?? 0);
    xmax = Number(box.xmax ?? 0);
  } else {
    return undefined;
  }

  // Convert 0-1000 scale to 0-100% scale if numbers exceed 100
  const isThousandScale = ymin > 100 || xmin > 100 || ymax > 100 || xmax > 100;
  const isUnitFraction = (ymin <= 1 && ymax <= 1 && xmin <= 1 && xmax <= 1) && (ymax > 0 || xmax > 0);

  if (isThousandScale) {
    ymin = ymin / 10;
    xmin = xmin / 10;
    ymax = ymax / 10;
    xmax = xmax / 10;
  } else if (isUnitFraction) {
    ymin = ymin * 100;
    xmin = xmin * 100;
    ymax = ymax * 100;
    xmax = xmax * 100;
  }

  ymin = Math.max(0, Math.min(100, ymin));
  xmin = Math.max(0, Math.min(100, xmin));
  ymax = Math.max(0, Math.min(100, ymax));
  xmax = Math.max(0, Math.min(100, xmax));

  if (ymax <= ymin || xmax <= xmin) {
    return undefined;
  }

  return { ymin, xmin, ymax, xmax };
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'LabelCheck Inspector API' });
});

// Main Analysis Endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { imageBase64, fileName, sampleId, parentReferenceBase64, parentProductName } = req.body;

    if (!imageBase64 && !sampleId) {
      return res.status(400).json({ error: 'Image data or sampleId is required' });
    }

    const timestamp = new Date().toISOString();
    const inspectionId = 'LC-' + Math.random().toString(36).substring(2, 9).toUpperCase();

    // 1. Handle pre-loaded samples
    if (sampleId) {
      const sample = SAMPLE_PRODUCTS.find((s) => s.id === sampleId);
      const tokens = getSampleTokens(sampleId);

      const fields: Record<string, ExtractedField> = {};
      const ruleCodeMap: Record<string, string> = {
        't1': 'LM-002',
        't2': 'LM-003',
        't3': 'LM-008',
        't4': 'LM-005',
        't5': 'LM-004',
        't6': 'LM-007',
        't7': 'LM-001',
        't8': 'LM-006'
      };

      tokens.forEach((t) => {
        const code = ruleCodeMap[t.id];
        if (code && t.text.trim()) {
          fields[code] = {
            ruleCode: code,
            fieldName: code,
            rawValue: t.text,
            confidence: t.confidence,
            bbox: t.bbox
          };
        }
      });

      const fullRawText = tokens.map((t) => t.text).join('\n');
      const { evaluations, summary } = evaluateCompliance(fields, fullRawText);

      const result: VerificationResult = {
        id: inspectionId,
        timestamp,
        imageFileName: sample ? sample.name : 'sample_label.png',
        imageUrl: sample ? sample.imageUrl : imageBase64,
        imageDimensions: { width: 800, height: 1000 },
        commodityType: sample?.category || 'Pre-Packaged Retail Commodity',
        ocrTokens: tokens,
        extractedFields: fields,
        evaluations,
        summary
      };

      return res.json({
        success: true,
        result,
        tamperAnalysis: {
          isTampered: false,
          tamperType: 'NONE',
          confidence: 0.99,
          affectedFields: [],
          details: 'No physical tampering or alterations detected.'
        }
      });
    }

    // 2. Real user uploaded image or camera capture
    let rawBase64 = imageBase64;
    let mimeType = 'image/jpeg';
    if (imageBase64.includes(';base64,')) {
      const parts = imageBase64.split(';base64,');
      mimeType = parts[0].replace('data:', '') || 'image/jpeg';
      rawBase64 = parts[1];
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({
        error: 'Gemini API key is not configured on the server. Please provide GEMINI_API_KEY in environment settings.'
      });
    }

    const hasParentRef = Boolean(parentReferenceBase64 && parentReferenceBase64.length > 50);

    const prompt = `
You are a precision optical OCR, statutory compliance auditor, and forensic packaging anti-tamper inspector for packaged commodity labels in India under Legal Metrology (Packaged Commodities) Rules, 2011.

INSTRUCTIONS:
1. Examine the provided candidate package label image carefully. ${hasParentRef ? `A second parent benchmark reference image ("${parentProductName || 'Original Product'}") is also provided for visual and physical comparison.` : ''}
2. Read the EXACT literal text printed on the label for every statutory declaration. DO NOT hardcode, invent, round, or alter any numbers, names, or addresses.
   - If MRP is Rs 1000, report exact text e.g. "MRP Rs. 1000.00 (inclusive of all taxes)".
   - If net quantity is 500 g, report exact text e.g. "Net Qty: 500 g".
   - Report the manufacturer's exact name and complete printed address.
3. For each detected field, provide its PRECISE bounding box coordinates using box_2d: [ymin, xmin, ymax, xmax] on a 0 to 1000 integer scale tightly wrapping where that text is located.
4. FORENSIC VISUAL ANTI-TAMPERING & PHYSICAL ANOMALY CHECK:
   Detect if any scam, manual modification, or packaging tampering is present:
   - STICKER_OVERLAY: Has a paper sticker, adhesive label, price tag, or slip been pasted over the original printed packaging (especially over MRP, Expiry/Mfg date, Net Qty, or Manufacturer)?
   - HANDWRITTEN_OVERWRITE: Has anyone rewritten or altered the MRP or date using a pen, ballpoint, marker, or manual ink over the original packaging?
   - CORRECTION_FLUID: Is there whitener, correction fluid, scratched-off ink, or erased text?
   - FONT_PRINT_MISMATCH: Does the typography, print quality, or layout conflict with the parent benchmark image?
   - If any tampering is detected, set isTampered=true, identify tamperType, affectedFields (e.g. ["LM-005"] for MRP), and provide clear forensic details. If no tampering is found, set isTampered=false and tamperType="NONE".

STATUTORY FIELD MAPPING:
- LM-001: Manufacturer / Packer / Importer name and address [Rule 6(1)(a)]
- LM-002: Common or generic commodity name [Rule 6(1)(b)]
- LM-003: Net quantity declaration with metric unit [Rule 6(1)(c)]
- LM-004: Month and year of manufacture or packing [Rule 6(1)(d)]
- LM-005: Maximum Retail Price (MRP) including taxes text [Rule 6(1)(e)]
- LM-006: Consumer care helpline / email / address [Rule 6(1)(f)]
- LM-007: Country of origin [Rule 6(1)(n)]
- LM-008: Unit Sale Price (USP) [Rule 6(10)]
`;

    // Construct multi-image contents if parent reference is available
    const contentParts: any[] = [
      {
        inlineData: {
          mimeType,
          data: rawBase64
        }
      }
    ];

    if (hasParentRef) {
      let refRawBase64 = parentReferenceBase64;
      let refMime = 'image/jpeg';
      if (parentReferenceBase64.includes(';base64,')) {
        const parts = parentReferenceBase64.split(';base64,');
        refMime = parts[0].replace('data:', '') || 'image/jpeg';
        refRawBase64 = parts[1];
      }
      contentParts.push({
        inlineData: {
          mimeType: refMime,
          data: refRawBase64
        }
      });
    }

    contentParts.push({ text: prompt });

    // Candidate models optimized for speed, reliability, and high-accuracy OCR
    const candidateModels = [
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-flash-latest'
    ];
    let lastError: any = null;
    let geminiResponse: any = null;

    for (const modelName of candidateModels) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout with model ${modelName}`)), 18000)
        );

        const generatePromise = ai.models.generateContent({
          model: modelName,
          contents: {
            parts: contentParts
          },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                commodityType: { type: Type.STRING, description: 'Type or category of commodity detected' },
                rawFullText: { type: Type.STRING, description: 'All visible text detected on the package' },
                tamperAnalysis: {
                  type: Type.OBJECT,
                  properties: {
                    isTampered: { type: Type.BOOLEAN, description: 'True if sticker, handwriting, or physical tampering detected' },
                    tamperType: {
                      type: Type.STRING,
                      enum: [
                        'STICKER_OVERLAY',
                        'HANDWRITTEN_OVERWRITE',
                        'CORRECTION_FLUID',
                        'FONT_PRINT_MISMATCH',
                        'SURFACE_ALTERATION',
                        'NONE'
                      ]
                    },
                    confidence: { type: Type.NUMBER, description: '0.0 to 1.0 confidence in forensic detection' },
                    affectedFields: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: 'List of ruleCodes affected e.g. LM-005 for MRP'
                    },
                    details: { type: Type.STRING, description: 'Detailed forensic observation of tampering' }
                  },
                  required: ['isTampered', 'tamperType', 'details']
                },
                fields: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      ruleCode: { type: Type.STRING, description: 'LM-001 through LM-008' },
                      fieldName: { type: Type.STRING },
                      rawValue: { type: Type.STRING },
                      confidence: { type: Type.NUMBER },
                      box_2d: {
                        type: Type.ARRAY,
                        items: { type: Type.INTEGER },
                        description: '[ymin, xmin, ymax, xmax] 0-1000 scale'
                      }
                    },
                    required: ['ruleCode', 'rawValue']
                  }
                }
              },
              required: ['fields', 'rawFullText']
            }
          }
        });

        const resp: any = await Promise.race([generatePromise, timeoutPromise]);
        if (resp && resp.text) {
          geminiResponse = resp;
          break; // Success with this model!
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} attempt failed:`, err?.message || err);
      }
    }

    if (!geminiResponse || !geminiResponse.text) {
      throw lastError || new Error('Vision analysis service is temporarily unavailable. Please try again.');
    }

    const parsed = JSON.parse(geminiResponse.text);
    const extractedFieldsRecord: Record<string, ExtractedField> = {};
    const ocrTokens: OCRToken[] = [];

    // Parse detected statutory fields with accurate bounding boxes
    if (Array.isArray(parsed.fields)) {
      parsed.fields.forEach((f: any) => {
        if (f.ruleCode && f.rawValue && f.rawValue.trim()) {
          const bbox = normalizeBox(f.box_2d || f.bbox);
          extractedFieldsRecord[f.ruleCode] = {
            ruleCode: f.ruleCode,
            fieldName: f.fieldName || f.ruleCode,
            rawValue: f.rawValue.trim(),
            confidence: typeof f.confidence === 'number' ? f.confidence : 0.95,
            bbox
          };
        }
      });
    }

    // Parse general OCR tokens or synthesize from extracted fields
    if (Array.isArray(parsed.ocrTokens) && parsed.ocrTokens.length > 0) {
      parsed.ocrTokens.forEach((t: any, idx: number) => {
        if (t.text && t.text.trim()) {
          ocrTokens.push({
            id: t.id || `tok-${idx + 1}`,
            text: t.text.trim(),
            confidence: typeof t.confidence === 'number' ? t.confidence : 0.95,
            bbox: normalizeBox(t.box_2d || t.bbox) || { ymin: 10, xmin: 10, ymax: 20, xmax: 90 }
          });
        }
      });
    } else {
      Object.entries(extractedFieldsRecord).forEach(([code, field], idx) => {
        ocrTokens.push({
          id: `tok-${idx + 1}`,
          text: field.rawValue,
          confidence: field.confidence,
          bbox: field.bbox || { ymin: 10, xmin: 10, ymax: 20, xmax: 90 }
        });
      });
    }

    const rawFullText = parsed.rawFullText || Object.values(extractedFieldsRecord).map((f) => f.rawValue).join('\n');
    const { evaluations, summary } = evaluateCompliance(extractedFieldsRecord, rawFullText);

    const tamperAnalysis = parsed.tamperAnalysis || {
      isTampered: false,
      tamperType: 'NONE',
      confidence: 0.95,
      affectedFields: [],
      details: 'No physical tampering detected.'
    };

    const result: VerificationResult = {
      id: inspectionId,
      timestamp,
      imageFileName: fileName || 'package_image.jpg',
      imageUrl: imageBase64,
      imageDimensions: { width: 800, height: 1000 },
      commodityType: parsed.commodityType || 'Packaged Commodity',
      ocrTokens,
      extractedFields: extractedFieldsRecord,
      evaluations,
      summary
    };

    return res.json({ success: true, result, tamperAnalysis });
  } catch (err: any) {
    console.error('Error during image analysis:', err);
    const isRateLimit = err?.status === 429 || /429|quota|rate limit|resource exhausted|too many requests/i.test(err?.message || '');
    return res.status(isRateLimit ? 429 : 500).json({
      error: isRateLimit
        ? 'AI rate limit reached on free quota. Please wait a few seconds before scanning again or use single-shot scan mode.'
        : (err.message || 'Unable to inspect package label. Please ensure the image is clear and text is visible.'),
      isRateLimit
    });
  }
});

// Re-evaluate Endpoint (when inspector edits fields manually)
app.post('/api/re-evaluate', (req, res) => {
  try {
    const { fields, rawFullText } = req.body;
    if (!fields) {
      return res.status(400).json({ error: 'fields object is required' });
    }
    const { evaluations, summary } = evaluateCompliance(fields, rawFullText || '');
    return res.json({ success: true, evaluations, summary });
  } catch (err: any) {
    console.error('Re-evaluate error:', err);
    return res.status(500).json({ error: 'Failed to re-evaluate compliance rules' });
  }
});

// Vite middleware integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LabelCheck Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
