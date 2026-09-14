import { ApprovedProduct, ApprovedProductFields, ExtractedField, InspectionSession } from '../types';
import { SAMPLE_PRODUCTS } from '../data/sampleProducts';

const STORAGE_KEY_PRODUCTS = 'labelcheck_approved_products_v2';
const STORAGE_KEY_SESSIONS = 'labelcheck_inspection_sessions';

const DEFAULT_APPROVED_PRODUCTS: ApprovedProduct[] = [
  {
    id: 'prod-wheat-biscuits',
    name: 'Whole Wheat Biscuits 200g',
    category: 'Biscuits & Bakery',
    createdAt: '2026-09-14T06:00:00.000Z',
    referenceImageUrl: SAMPLE_PRODUCTS[0]?.imageUrl,
    rawOcrText: 'Whole Wheat Biscuits 200 g Apex Foods Pvt. Ltd. MRP ₹ 40.00 USP: ₹ 0.20 / g Country of Origin: India',
    parentKeywords: ['whole', 'wheat', 'biscuits', 'apex', 'foods'],
    fields: {
      product_name: 'Whole Wheat Biscuits',
      net_quantity: '200 g',
      mrp: '₹40.00',
      manufacturer: 'Apex Foods Pvt. Ltd., Sanand, Gujarat',
      consumer_care: '1800-209-1234',
      country_of_origin: 'India',
      date_info: '04/2024 (Batch: NW-421)',
      unit_sale_price: '₹0.20 / g'
    }
  },
  {
    id: 'prod-kashmiri-chilli',
    name: 'Kashmiri Chilli Powder 100g',
    category: 'Spices & Condiments',
    createdAt: '2026-09-14T05:30:00.000Z',
    referenceImageUrl: SAMPLE_PRODUCTS[3]?.imageUrl,
    rawOcrText: 'Kashmiri Chilli Powder 100 g Shuddh Masala Co. MRP ₹ 75.00 USP: ₹ 0.75 / g Made in India',
    parentKeywords: ['kashmiri', 'chilli', 'powder', 'shuddh', 'masala'],
    fields: {
      product_name: 'Kashmiri Chilli Powder',
      net_quantity: '100 g',
      mrp: '₹75.00',
      manufacturer: 'Shuddh Masala Co.',
      consumer_care: '',
      country_of_origin: 'India',
      date_info: 'Batch 12 / 2024',
      unit_sale_price: '₹0.75 / g'
    }
  },
  {
    id: 'prod-facial-lotion',
    name: 'Facial Cleansing Lotion 150mL',
    category: 'Cosmetics & Personal Care',
    createdAt: '2026-09-14T05:00:00.000Z',
    referenceImageUrl: SAMPLE_PRODUCTS[2]?.imageUrl,
    rawOcrText: 'Facial Cleansing Lotion 150 mL Luxe Brands India Pvt Ltd MRP ₹ 650.00 France',
    parentKeywords: ['facial', 'cleansing', 'lotion', 'luxe', 'brands', 'france'],
    fields: {
      product_name: 'Facial Cleansing Lotion',
      net_quantity: '150 mL',
      mrp: '₹650.00',
      manufacturer: 'Laboratoires Dermavital, Paris / Luxe Brands India',
      consumer_care: '1800-112-990',
      country_of_origin: 'France',
      date_info: 'Imported: 01/2024',
      unit_sale_price: ''
    }
  }
];

export function getApprovedProducts(): ApprovedProduct[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(DEFAULT_APPROVED_PRODUCTS));
      return DEFAULT_APPROVED_PRODUCTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(DEFAULT_APPROVED_PRODUCTS));
      return DEFAULT_APPROVED_PRODUCTS;
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load approved products from storage:', err);
    return DEFAULT_APPROVED_PRODUCTS;
  }
}

export function saveApprovedProduct(product: ApprovedProduct): void {
  try {
    const products = getApprovedProducts();
    const index = products.findIndex((p) => p.id === product.id);
    if (index >= 0) {
      products[index] = product;
    } else {
      products.unshift(product);
    }
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
  } catch (err) {
    console.error('Failed to save approved product:', err);
  }
}

export function deleteApprovedProduct(productId: string): void {
  try {
    const products = getApprovedProducts().filter((p) => p.id !== productId);
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
  } catch (err) {
    console.error('Failed to delete approved product:', err);
  }
}

export function createApprovedProductFromScan(
  name: string,
  fields: Record<string, ExtractedField>,
  referenceImageUrl?: string,
  rawFullText?: string
): ApprovedProduct {
  const productFields: ApprovedProductFields = {
    manufacturer: fields['LM-001']?.rawValue || '',
    product_name: fields['LM-002']?.rawValue || '',
    net_quantity: fields['LM-003']?.rawValue || '',
    date_info: fields['LM-004']?.rawValue || 'Valid Month and Year',
    mrp: fields['LM-005']?.rawValue || '',
    consumer_care: fields['LM-006']?.rawValue || '',
    country_of_origin: fields['LM-007']?.rawValue || 'India',
    unit_sale_price: fields['LM-008']?.rawValue || ''
  };

  const detectedName = productFields.product_name?.trim();
  const detectedQty = productFields.net_quantity?.trim();
  const autoTitle = detectedName
    ? `${detectedName}${detectedQty ? ' ' + detectedQty : ''}`
    : 'Approved Product Reference';

  const newProduct: ApprovedProduct = {
    id: `prod-${Date.now().toString(36)}`,
    name: name.trim() || autoTitle,
    category: 'Packaged Commodity',
    createdAt: new Date().toISOString(),
    fields: productFields,
    referenceImageUrl,
    rawOcrText: rawFullText
  };

  saveApprovedProduct(newProduct);
  return newProduct;
}

export function getInspectionSessions(): InspectionSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load inspection sessions:', err);
    return [];
  }
}

export function saveInspectionSession(session: InspectionSession): void {
  try {
    const sessions = getInspectionSessions();
    sessions.unshift(session);
    // Keep last 50 sessions
    const trimmed = sessions.slice(0, 50);
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(trimmed));
  } catch (err) {
    console.error('Failed to save inspection session:', err);
  }
}

export function clearInspectionHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_SESSIONS);
  } catch (err) {
    console.error('Failed to clear inspection history:', err);
  }
}
