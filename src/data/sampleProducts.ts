import { OCRToken, SampleProduct } from '../types';

// Helper to create high-resolution SVG product label data URLs
function createSampleLabelSvg(title: string, subtitle: string, panels: {
  mfg: string;
  name: string;
  qty: string;
  date: string;
  mrp: string;
  care: string;
  origin: string;
  usp: string;
  fssai?: string;
  variantColor?: string;
  accentColor?: string;
}): string {
  const bg = panels.variantColor || '#FFFFFF';
  const border = panels.accentColor || '#1E293B';

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">
  <defs>
    <style>
      .hdr { font-family: 'IBM Plex Sans', sans-serif; font-size: 28px; font-weight: 700; fill: #0F172A; }
      .sub { font-family: 'IBM Plex Sans', sans-serif; font-size: 16px; fill: #475569; }
      .lbl { font-family: 'IBM Plex Sans', sans-serif; font-size: 13px; font-weight: 600; fill: #334155; }
      .val { font-family: 'IBM Plex Mono', monospace; font-size: 14px; fill: #0F172A; }
      .box { fill: #F8FAFC; stroke: #CBD5E1; stroke-width: 1.5; rx: 6; }
      .mrp-box { fill: #EFF6FF; stroke: #93C5FD; stroke-width: 2; rx: 6; }
      .bar { fill: #0F172A; }
    </style>
  </defs>

  <!-- Package Background -->
  <rect x="20" y="20" width="760" height="960" rx="16" fill="${bg}" stroke="${border}" stroke-width="4"/>

  <!-- Top Brand Banner -->
  <rect x="40" y="40" width="720" height="130" rx="8" fill="#1E293B"/>
  <text x="400" y="95" text-anchor="middle" font-family="'IBM Plex Sans', sans-serif" font-size="36" font-weight="800" fill="#F8FAFC" letter-spacing="1">${title}</text>
  <text x="400" y="135" text-anchor="middle" font-family="'IBM Plex Sans', sans-serif" font-size="16" fill="#94A3B8">${subtitle}</text>

  <!-- Principal Display Panel (Declarations Grid) -->

  <!-- Panel 1: Generic Commodity Name -->
  <rect x="50" y="190" width="700" height="70" class="box"/>
  <text x="70" y="215" class="lbl">COMMON OR GENERIC COMMODITY NAME [Rule 6(1)(b)]</text>
  <text x="70" y="242" class="val" font-size="18" font-weight="700">${panels.name}</text>

  <!-- Panel 2: Net Quantity & Unit Sale Price -->
  <rect x="50" y="275" width="340" height="85" class="box"/>
  <text x="70" y="300" class="lbl">NET QUANTITY [Rule 6(1)(c)]</text>
  <text x="70" y="332" class="val" font-size="20" font-weight="700">${panels.qty}</text>

  <rect x="410" y="275" width="340" height="85" class="box"/>
  <text x="430" y="300" class="lbl">UNIT SALE PRICE (USP) [Rule 6(10)]</text>
  <text x="430" y="332" class="val" font-size="16">${panels.usp}</text>

  <!-- Panel 3: Maximum Retail Price (MRP) Mandatory Box -->
  <rect x="50" y="375" width="700" height="95" class="mrp-box"/>
  <text x="70" y="405" class="lbl" fill="#1E40AF">MAXIMUM RETAIL PRICE (MRP) [Rule 6(1)(e)]</text>
  <text x="70" y="442" class="val" font-size="22" font-weight="700" fill="#1E3A8A">${panels.mrp}</text>

  <!-- Panel 4: Month and Year of Manufacture / Packing -->
  <rect x="50" y="485" width="340" height="80" class="box"/>
  <text x="70" y="510" class="lbl">MFG / PKG DATE [Rule 6(1)(d)]</text>
  <text x="70" y="542" class="val">${panels.date}</text>

  <!-- Panel 5: Country of Origin -->
  <rect x="410" y="485" width="340" height="80" class="box"/>
  <text x="430" y="510" class="lbl">COUNTRY OF ORIGIN [Rule 6(1)(n)]</text>
  <text x="430" y="542" class="val">${panels.origin}</text>

  <!-- Panel 6: Manufacturer / Packer / Importer Details -->
  <rect x="50" y="580" width="700" height="110" class="box"/>
  <text x="70" y="605" class="lbl">MANUFACTURED &amp; PACKED BY [Rule 6(1)(a)]</text>
  <text x="70" y="635" class="val" font-size="13">${panels.mfg}</text>

  <!-- Panel 7: Consumer Care Details -->
  <rect x="50" y="705" width="700" height="110" class="box"/>
  <text x="70" y="730" class="lbl">CONSUMER CARE CELL / REDRESSAL [Rule 6(1)(f)]</text>
  <text x="70" y="760" class="val" font-size="13">${panels.care}</text>

  <!-- Bottom Panel: Barcode & Statutory Notice -->
  <g transform="translate(60, 835)">
    <!-- Simulated EAN-13 Barcode -->
    <rect x="0" y="0" width="4" height="60" class="bar"/>
    <rect x="8" y="0" width="2" height="60" class="bar"/>
    <rect x="14" y="0" width="6" height="60" class="bar"/>
    <rect x="24" y="0" width="2" height="60" class="bar"/>
    <rect x="32" y="0" width="8" height="60" class="bar"/>
    <rect x="44" y="0" width="2" height="60" class="bar"/>
    <rect x="52" y="0" width="4" height="60" class="bar"/>
    <rect x="62" y="0" width="6" height="60" class="bar"/>
    <rect x="74" y="0" width="4" height="60" class="bar"/>
    <rect x="84" y="0" width="2" height="60" class="bar"/>
    <rect x="92" y="0" width="6" height="60" class="bar"/>
    <rect x="104" y="0" width="4" height="60" class="bar"/>
    <rect x="114" y="0" width="8" height="60" class="bar"/>
    <rect x="128" y="0" width="2" height="60" class="bar"/>
    <rect x="136" y="0" width="6" height="60" class="bar"/>
    <rect x="148" y="0" width="4" height="60" class="bar"/>
    <text x="75" y="80" text-anchor="middle" font-family="'IBM Plex Mono', monospace" font-size="12" fill="#475569">8 901234 567890</text>
  </g>

  <g transform="translate(260, 835)">
    <rect x="0" y="0" width="490" height="85" fill="#F1F5F9" stroke="#E2E8F0" rx="4"/>
    <text x="15" y="25" font-family="'IBM Plex Sans', sans-serif" font-size="11" font-weight="700" fill="#334155">LEGAL METROLOGY (PACKAGED COMMODITIES) RULES, 2011</text>
    <text x="15" y="45" font-family="'IBM Plex Sans', sans-serif" font-size="10" fill="#64748B">This label is intended for compliance inspection audit under Rule 6.</text>
    <text x="15" y="65" font-family="'IBM Plex Sans', sans-serif" font-size="10" fill="#64748B">${panels.fssai || 'Lic. No. 10014011000123 | Batch No: B-94812'}</text>
  </g>
</svg>
`.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const SAMPLE_PRODUCTS: SampleProduct[] = [
  {
    id: 'sample-compliant-food',
    name: 'Standard Compliant Food Package',
    description: 'Whole wheat biscuits label satisfying all 8 Legal Metrology declarations.',
    category: 'Food & Bakery',
    imageUrl: createSampleLabelSvg(
      'NUTRIWHEAT CRUNCH',
      'High Fiber Whole Wheat Digestive Biscuits',
      {
        name: 'Whole Wheat Biscuits',
        qty: '200 g',
        usp: 'USP: ₹ 0.20 / g (₹ 20.00 / 100 g)',
        mrp: 'MRP ₹ 40.00 (inclusive of all taxes)',
        date: '04/2024 (Batch: NW-421)',
        origin: 'Country of Origin: India',
        mfg: 'Mfd & Pkd By: Apex Foods Pvt. Ltd., Plot 14, GIDC Estate, Sanand, Ahmedabad, Gujarat 382170, India.',
        care: 'Consumer Care Executive, Apex Foods, P.O. Box 42, Sanand 382170 | Phone: 1800-209-1234 | Email: care@apexfoods.in'
      }
    ),
    expectedOutcome: '8 PASS'
  },
  {
    id: 'sample-nonstandard-unit',
    name: 'Non-Standard Unit & Missing Tax Qualifier',
    description: 'Uses forbidden abbreviation "gms" and lacks "inclusive of all taxes" phrase.',
    category: 'Confectionery',
    imageUrl: createSampleLabelSvg(
      'CHOCODELIGHT PREMIUM',
      'Rich Roasted Cocoa Choco Squares',
      {
        name: 'Cocoa Confectionery',
        qty: '250 gms', // Violation: gms instead of g
        usp: 'Unit Price: Rs 0.60 per gm',
        mrp: 'MRP: Rs. 150.00', // Violation: missing inclusive of all taxes
        date: 'Manufactured: 02/2024',
        origin: 'India',
        mfg: 'Mfg by: SweetCraft Bakers, 12 Industrial Area, Phase II, Bengaluru 560058',
        care: 'Contact: 080-49128888, support@sweetcraft.com'
      }
    ),
    expectedOutcome: '5 PASS, 2 REVIEW, 1 MISSING'
  },
  {
    id: 'sample-imported-cosmetics',
    name: 'Imported Personal Care Item',
    description: 'Imported package with importer info, but missing Unit Sale Price declaration.',
    category: 'Personal Care',
    imageUrl: createSampleLabelSvg(
      'DERMAVITAL CLEANSING LOTION',
      'Hydrating Gentle Facial Cleanser',
      {
        name: 'Facial Cleansing Lotion',
        qty: '150 mL',
        usp: '', // Missing USP
        mrp: 'MRP ₹ 650.00 (incl. of all taxes)',
        date: 'Imported: 01/2024',
        origin: 'Country of Origin: France',
        mfg: 'Mfg: Laboratoires Dermavital, 14 Rue de la Paix, Paris, France. Imported & Packed in India by: Luxe Brands India Pvt Ltd, Nariman Point, Mumbai 400021.',
        care: 'Customer Care Desk, Luxe Brands India, Mumbai 400021 | Helpline: 1800-112-990 | care@luxebrands.in'
      }
    ),
    expectedOutcome: '6 PASS, 1 REVIEW, 1 MISSING'
  },
  {
    id: 'sample-missing-care',
    name: 'Missing Consumer Care & Unclear Address',
    description: 'Spices pouch with missing consumer care cell and vague manufacturer locality.',
    category: 'Spices & Condiments',
    imageUrl: createSampleLabelSvg(
      'SHUDDH MASALA CO.',
      'Premium Kashmiri Red Chilli Powder',
      {
        name: 'Kashmiri Chilli Powder',
        qty: '100 g',
        usp: 'USP: ₹ 0.75 / g',
        mrp: 'MRP ₹ 75.00 (inclusive of all taxes)',
        date: 'Batch 12 / 2024',
        origin: 'Made in India',
        mfg: 'Packed by: Shuddh Masala Co., Village Ramnagar.', // Missing complete postal city, state, pin
        care: '' // Missing consumer care
      }
    ),
    expectedOutcome: '5 PASS, 1 REVIEW, 2 MISSING'
  }
];

// Helper to provide pre-mapped OCR tokens for sample labels for instant verification
export function getSampleTokens(sampleId: string): OCRToken[] {
  // Approximate normalized bboxes (0-100%) matching the SVG layout
  if (sampleId === 'sample-compliant-food') {
    return [
      { id: 't1', text: 'Whole Wheat Biscuits', confidence: 0.99, bbox: { ymin: 19.0, xmin: 6.2, ymax: 26.0, xmax: 93.8 } },
      { id: 't2', text: '200 g', confidence: 0.98, bbox: { ymin: 27.5, xmin: 6.2, ymax: 36.0, xmax: 48.8 } },
      { id: 't3', text: 'USP: ₹ 0.20 / g (₹ 20.00 / 100 g)', confidence: 0.96, bbox: { ymin: 27.5, xmin: 51.2, ymax: 36.0, xmax: 93.8 } },
      { id: 't4', text: 'MRP ₹ 40.00 (inclusive of all taxes)', confidence: 0.99, bbox: { ymin: 37.5, xmin: 6.2, ymax: 47.0, xmax: 93.8 } },
      { id: 't5', text: '04/2024 (Batch: NW-421)', confidence: 0.97, bbox: { ymin: 48.5, xmin: 6.2, ymax: 56.5, xmax: 48.8 } },
      { id: 't6', text: 'Country of Origin: India', confidence: 0.99, bbox: { ymin: 48.5, xmin: 51.2, ymax: 56.5, xmax: 93.8 } },
      { id: 't7', text: 'Mfd & Pkd By: Apex Foods Pvt. Ltd., Plot 14, GIDC Estate, Sanand, Ahmedabad, Gujarat 382170, India.', confidence: 0.95, bbox: { ymin: 58.0, xmin: 6.2, ymax: 69.0, xmax: 93.8 } },
      { id: 't8', text: 'Consumer Care Executive, Apex Foods, P.O. Box 42, Sanand 382170 | Phone: 1800-209-1234 | Email: care@apexfoods.in', confidence: 0.96, bbox: { ymin: 70.5, xmin: 6.2, ymax: 81.5, xmax: 93.8 } }
    ];
  } else if (sampleId === 'sample-nonstandard-unit') {
    return [
      { id: 't1', text: 'Cocoa Confectionery', confidence: 0.97, bbox: { ymin: 19.0, xmin: 6.2, ymax: 26.0, xmax: 93.8 } },
      { id: 't2', text: '250 gms', confidence: 0.98, bbox: { ymin: 27.5, xmin: 6.2, ymax: 36.0, xmax: 48.8 } },
      { id: 't3', text: 'Unit Price: Rs 0.60 per gm', confidence: 0.93, bbox: { ymin: 27.5, xmin: 51.2, ymax: 36.0, xmax: 93.8 } },
      { id: 't4', text: 'MRP: Rs. 150.00', confidence: 0.96, bbox: { ymin: 37.5, xmin: 6.2, ymax: 47.0, xmax: 93.8 } },
      { id: 't5', text: 'Manufactured: 02/2024', confidence: 0.95, bbox: { ymin: 48.5, xmin: 6.2, ymax: 56.5, xmax: 48.8 } },
      { id: 't6', text: 'India', confidence: 0.92, bbox: { ymin: 48.5, xmin: 51.2, ymax: 56.5, xmax: 93.8 } },
      { id: 't7', text: 'Mfg by: SweetCraft Bakers, 12 Industrial Area, Phase II, Bengaluru 560058', confidence: 0.94, bbox: { ymin: 58.0, xmin: 6.2, ymax: 69.0, xmax: 93.8 } },
      { id: 't8', text: 'Contact: 080-49128888, support@sweetcraft.com', confidence: 0.95, bbox: { ymin: 70.5, xmin: 6.2, ymax: 81.5, xmax: 93.8 } }
    ];
  } else if (sampleId === 'sample-imported-cosmetics') {
    return [
      { id: 't1', text: 'Facial Cleansing Lotion', confidence: 0.98, bbox: { ymin: 19.0, xmin: 6.2, ymax: 26.0, xmax: 93.8 } },
      { id: 't2', text: '150 mL', confidence: 0.99, bbox: { ymin: 27.5, xmin: 6.2, ymax: 36.0, xmax: 48.8 } },
      { id: 't3', text: '', confidence: 0.0, bbox: { ymin: 27.5, xmin: 51.2, ymax: 36.0, xmax: 93.8 } },
      { id: 't4', text: 'MRP ₹ 650.00 (incl. of all taxes)', confidence: 0.99, bbox: { ymin: 37.5, xmin: 6.2, ymax: 47.0, xmax: 93.8 } },
      { id: 't5', text: 'Imported: 01/2024', confidence: 0.96, bbox: { ymin: 48.5, xmin: 6.2, ymax: 56.5, xmax: 48.8 } },
      { id: 't6', text: 'Country of Origin: France', confidence: 0.99, bbox: { ymin: 48.5, xmin: 51.2, ymax: 56.5, xmax: 93.8 } },
      { id: 't7', text: 'Mfg: Laboratoires Dermavital, 14 Rue de la Paix, Paris, France. Imported & Packed in India by: Luxe Brands India Pvt Ltd, Nariman Point, Mumbai 400021.', confidence: 0.96, bbox: { ymin: 58.0, xmin: 6.2, ymax: 69.0, xmax: 93.8 } },
      { id: 't8', text: 'Customer Care Desk, Luxe Brands India, Mumbai 400021 | Helpline: 1800-112-990 | care@luxebrands.in', confidence: 0.97, bbox: { ymin: 70.5, xmin: 6.2, ymax: 81.5, xmax: 93.8 } }
    ];
  } else {
    // sample-missing-care
    return [
      { id: 't1', text: 'Kashmiri Chilli Powder', confidence: 0.98, bbox: { ymin: 19.0, xmin: 6.2, ymax: 26.0, xmax: 93.8 } },
      { id: 't2', text: '100 g', confidence: 0.99, bbox: { ymin: 27.5, xmin: 6.2, ymax: 36.0, xmax: 48.8 } },
      { id: 't3', text: 'USP: ₹ 0.75 / g', confidence: 0.97, bbox: { ymin: 27.5, xmin: 51.2, ymax: 36.0, xmax: 93.8 } },
      { id: 't4', text: 'MRP ₹ 75.00 (inclusive of all taxes)', confidence: 0.99, bbox: { ymin: 37.5, xmin: 6.2, ymax: 47.0, xmax: 93.8 } },
      { id: 't5', text: 'Batch 12 / 2024', confidence: 0.92, bbox: { ymin: 48.5, xmin: 6.2, ymax: 56.5, xmax: 48.8 } },
      { id: 't6', text: 'Made in India', confidence: 0.98, bbox: { ymin: 48.5, xmin: 51.2, ymax: 56.5, xmax: 93.8 } },
      { id: 't7', text: 'Packed by: Shuddh Masala Co., Village Ramnagar.', confidence: 0.91, bbox: { ymin: 58.0, xmin: 6.2, ymax: 69.0, xmax: 93.8 } },
      { id: 't8', text: '', confidence: 0.0, bbox: { ymin: 70.5, xmin: 6.2, ymax: 81.5, xmax: 93.8 } }
    ];
  }
}
