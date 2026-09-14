import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
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
    const { imageBase64, fileName, sampleId } = req.body;

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

      return res.json({ success: true, result });
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

    const prompt = `
You are a precision optical OCR and object detection auditor for packaged commodity labels in India under Legal Metrology (Packaged Commodities) Rules, 2011.

INSTRUCTIONS:
1. Examine the provided package label image carefully.
2. Read the EXACT literal text printed on the label for every statutory declaration. DO NOT hardcode, invent, round, or alter any numbers, names, or addresses.
   - If MRP is Rs 1000, report exact text e.g. "MRP Rs. 1000.00 (inclusive of all taxes)".
   - If net quantity is 500 g, report exact text e.g. "Net Qty: 500 g".
   - Report the manufacturer's exact name and complete printed address.
3. For each detected field, provide its PRECISE bounding box coordinates using box_2d: [ymin, xmin, ymax, xmax] on a 0 to 1000 integer scale:
   - ymin: top coordinate of the text (0 to 1000)
   - xmin: left coordinate of the text (0 to 1000)
   - ymax: bottom coordinate of the text (0 to 1000)
   - xmax: right coordinate of the text (0 to 1000)
   Make sure the bounding box tightly wraps ONLY where that specific text is located on the image. DO NOT place boxes randomly.

STATUTORY FIELD MAPPING:
- LM-001: Manufacturer / Packer / Importer name and address [Rule 6(1)(a)]
- LM-002: Common or generic commodity name [Rule 6(1)(b)]
- LM-003: Net quantity declaration with metric unit [Rule 6(1)(c)]
- LM-004: Month and year of manufacture or packing [Rule 6(1)(d)]
- LM-005: Maximum Retail Price (MRP) including taxes text [Rule 6(1)(e)]
- LM-006: Consumer care helpline / email / address [Rule 6(1)(f)]
- LM-007: Country of origin [Rule 6(1)(n)]
- LM-008: Unit Sale Price (USP) [Rule 6(10)]

If any field is NOT visible or absent on the package, do not output that field or leave rawValue empty.
`;

    // Primary and fallback models (prioritizing fast flash-lite to avoid 503 high-demand errors)
    const candidateModels = [
      'gemini-3.1-flash-lite',
      'gemini-3-flash-preview',
      'gemini-3.6-flash'
    ];
    let lastError: any = null;
    let geminiResponse: any = null;

    for (const modelName of candidateModels) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout with model ${modelName}`)), 35000)
        );

        const generatePromise = ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: rawBase64
                }
              },
              { text: prompt }
            ]
          },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                commodityType: { type: Type.STRING, description: 'Type or category of commodity detected' },
                rawFullText: { type: Type.STRING, description: 'All visible text detected on the package' },
                ocrTokens: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      text: { type: Type.STRING },
                      confidence: { type: Type.NUMBER },
                      box_2d: {
                        type: Type.ARRAY,
                        items: { type: Type.INTEGER },
                        description: '[ymin, xmin, ymax, xmax] 0-1000 scale'
                      }
                    },
                    required: ['id', 'text', 'box_2d']
                  }
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
                    required: ['ruleCode', 'rawValue', 'box_2d']
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

    // Parse general OCR tokens
    if (Array.isArray(parsed.ocrTokens)) {
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
    }

    const rawFullText = parsed.rawFullText || Object.values(extractedFieldsRecord).map((f) => f.rawValue).join('\n');
    const { evaluations, summary } = evaluateCompliance(extractedFieldsRecord, rawFullText);

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

    return res.json({ success: true, result });
  } catch (err: any) {
    console.error('Error during image analysis:', err);
    return res.status(500).json({
      error: err.message || 'Unable to inspect package label. Please ensure the image is clear and text is visible.'
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
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LabelCheck Server running on port ${PORT}`);
  });
}

startServer();
