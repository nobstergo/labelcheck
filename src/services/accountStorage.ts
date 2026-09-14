import { ApprovedProduct, ApprovedProductFields, ExtractedField, InspectionSession, ScanHistoryItem, UserProfile } from '../types';

const AUTH_USER_KEY = 'labelcheck_auth_user_v1';
const KEY_PREFIX_PRODUCTS = 'labelcheck_user_products_';
const KEY_PREFIX_SESSIONS = 'labelcheck_user_sessions_';
const KEY_PREFIX_SCANS = 'labelcheck_user_scans_';

// Default user profiles for smooth demo/login experience
export const DEMO_GOOGLE_USERS: UserProfile[] = [
  {
    id: 'usr-google-ameer',
    name: 'Ameeruddin Baxavee',
    email: 'ameeruddinbaxavee@gmail.com',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    provider: 'google',
    lastLoginAt: new Date().toISOString()
  },
  {
    id: 'usr-google-qc-lead',
    name: 'QC Lead Inspector',
    email: 'qc.inspector@enterprise.org',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    provider: 'google',
    lastLoginAt: new Date().toISOString()
  }
];

const DEFAULT_APPROVED_PRODUCTS: ApprovedProduct[] = [
  {
    id: 'prod-wheat-biscuits',
    name: 'Whole Wheat Biscuits 200g',
    category: 'Biscuits & Bakery',
    createdAt: '2026-09-14T06:00:00.000Z',
    rawOcrText: 'Whole Wheat Biscuits 200 g Apex Foods Pvt. Ltd. MRP ₹ 40.00 USP: ₹ 0.20 / g Country of Origin: India',
    parentKeywords: ['whole', 'wheat', 'biscuits', 'apex', 'foods'],
    fields: {
      product_name: 'Whole Wheat Biscuits',
      net_quantity: '200 g',
      mrp: '₹40.00 (incl. of all taxes)',
      manufacturer: 'Apex Foods Pvt. Ltd., Sanand, Gujarat - 382110',
      consumer_care: '1800-209-1234 / care@apexfoods.in',
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
    rawOcrText: 'Kashmiri Chilli Powder 100 g Shuddh Masala Co. MRP ₹ 75.00 USP: ₹ 0.75 / g Made in India',
    parentKeywords: ['kashmiri', 'chilli', 'powder', 'shuddh', 'masala'],
    fields: {
      product_name: 'Kashmiri Chilli Powder',
      net_quantity: '100 g',
      mrp: '₹75.00 (incl. of all taxes)',
      manufacturer: 'Shuddh Masala Co., Plot 14, Industrial Area, Rajasthan - 302013',
      consumer_care: '1800-222-3333 / feedback@shuddhmasala.com',
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
    rawOcrText: 'Facial Cleansing Lotion 150 mL Luxe Brands India Pvt Ltd MRP ₹ 650.00 France',
    parentKeywords: ['facial', 'cleansing', 'lotion', 'luxe', 'brands', 'france'],
    fields: {
      product_name: 'Facial Cleansing Lotion',
      net_quantity: '150 mL',
      mrp: '₹650.00 (incl. of all taxes)',
      manufacturer: 'Laboratoires Dermavital, Paris / Luxe Brands India Pvt Ltd, Mumbai - 400001',
      consumer_care: '1800-112-990 / support@luxebrands.com',
      country_of_origin: 'France',
      date_info: 'Imported: 01/2024',
      unit_sale_price: ''
    }
  }
];

// AUTH METHODS
export function getStoredUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading auth user:', err);
    return null;
  }
}

export const getCurrentUser = getStoredUser;

export function setStoredUser(user: UserProfile | null): void {
  try {
    if (user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
    }
  } catch (err) {
    console.error('Error writing auth user:', err);
  }
}

export const setCurrentUser = setStoredUser;

export async function loginWithGoogleAccount(customUser?: Partial<UserProfile>): Promise<UserProfile> {
  const selectedUser: UserProfile = {
    id: customUser?.id || `usr-google-${Date.now().toString(36)}`,
    name: customUser?.name || 'Authorized Compliance Officer',
    email: customUser?.email || 'officer@compliance.legalmetrology.gov.in',
    avatarUrl: customUser?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(customUser?.name || 'Google User')}&background=0F172A&color=fff`,
    provider: 'google',
    lastLoginAt: new Date().toISOString()
  };

  setStoredUser(selectedUser);

  // Initialize default approved products if not present for user
  const products = getApprovedProducts(selectedUser.id);
  if (products.length === 0) {
    localStorage.setItem(`${KEY_PREFIX_PRODUCTS}${selectedUser.id}`, JSON.stringify(DEFAULT_APPROVED_PRODUCTS));
  }

  return selectedUser;
}

export function logoutUser(): void {
  setStoredUser(null);
}

// ACCOUNT-SCOPED APPROVED PRODUCTS
export function getApprovedProducts(userId?: string): ApprovedProduct[] {
  try {
    const activeUserId = userId || getStoredUser()?.id || 'guest';
    const raw = localStorage.getItem(`${KEY_PREFIX_PRODUCTS}${activeUserId}`);
    if (!raw) {
      localStorage.setItem(`${KEY_PREFIX_PRODUCTS}${activeUserId}`, JSON.stringify(DEFAULT_APPROVED_PRODUCTS));
      return DEFAULT_APPROVED_PRODUCTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_APPROVED_PRODUCTS;
  } catch (err) {
    console.error('Error getting approved products:', err);
    return DEFAULT_APPROVED_PRODUCTS;
  }
}

export function saveApprovedProduct(product: ApprovedProduct, userId?: string): void {
  try {
    const activeUserId = userId || getStoredUser()?.id || 'guest';
    const products = getApprovedProducts(activeUserId);
    const index = products.findIndex((p) => p.id === product.id);
    if (index >= 0) {
      products[index] = product;
    } else {
      products.unshift(product);
    }
    localStorage.setItem(`${KEY_PREFIX_PRODUCTS}${activeUserId}`, JSON.stringify(products));
  } catch (err) {
    console.error('Error saving approved product:', err);
  }
}

export function deleteApprovedProduct(productId: string, userId?: string): void {
  try {
    const activeUserId = userId || getStoredUser()?.id || 'guest';
    const products = getApprovedProducts(activeUserId).filter((p) => p.id !== productId);
    localStorage.setItem(`${KEY_PREFIX_PRODUCTS}${activeUserId}`, JSON.stringify(products));
  } catch (err) {
    console.error('Error deleting approved product:', err);
  }
}

export function createApprovedProductFromScan(
  name: string,
  fields: Record<string, ExtractedField>,
  referenceImageUrl?: string,
  rawFullText?: string,
  userId?: string
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

  saveApprovedProduct(newProduct, userId);
  return newProduct;
}

// ACCOUNT-SCOPED INSPECTION SESSIONS
export function getInspectionSessions(userId?: string): InspectionSession[] {
  try {
    const activeUserId = userId || getStoredUser()?.id || 'guest';
    const raw = localStorage.getItem(`${KEY_PREFIX_SESSIONS}${activeUserId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error loading inspection sessions:', err);
    return [];
  }
}

export function saveInspectionSession(session: InspectionSession, userId?: string): void {
  try {
    const activeUserId = userId || getStoredUser()?.id || 'guest';
    const sessions = getInspectionSessions(activeUserId);
    const existingIdx = sessions.findIndex((s) => s.id === session.id);
    if (existingIdx >= 0) {
      sessions[existingIdx] = session;
    } else {
      sessions.unshift(session);
    }
    const trimmed = sessions.slice(0, 100);
    localStorage.setItem(`${KEY_PREFIX_SESSIONS}${activeUserId}`, JSON.stringify(trimmed));
  } catch (err) {
    console.error('Error saving inspection session:', err);
  }
}

export function deleteInspectionSession(sessionId: string, userId?: string): void {
  try {
    const activeUserId = userId || getStoredUser()?.id || 'guest';
    const sessions = getInspectionSessions(activeUserId).filter((s) => s.id !== sessionId);
    localStorage.setItem(`${KEY_PREFIX_SESSIONS}${activeUserId}`, JSON.stringify(sessions));
  } catch (err) {
    console.error('Error deleting inspection session:', err);
  }
}

export function clearInspectionHistory(userId?: string): void {
  try {
    const activeUserId = userId || getStoredUser()?.id || 'guest';
    localStorage.removeItem(`${KEY_PREFIX_SESSIONS}${activeUserId}`);
  } catch (err) {
    console.error('Error clearing inspection sessions:', err);
  }
}

// ACCOUNT-SCOPED SCAN VERIFICATION HISTORY
export function getScanHistory(userId?: string): ScanHistoryItem[] {
  try {
    const activeUserId = userId || getStoredUser()?.id || 'guest';
    const raw = localStorage.getItem(`${KEY_PREFIX_SCANS}${activeUserId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error loading scan history:', err);
    return [];
  }
}

export function saveScanHistory(item: ScanHistoryItem, userId?: string): void {
  try {
    const activeUserId = userId || getStoredUser()?.id || 'guest';
    const scans = getScanHistory(activeUserId);
    const existingIdx = scans.findIndex((s) => s.id === item.id);
    if (existingIdx >= 0) {
      scans[existingIdx] = item;
    } else {
      scans.unshift(item);
    }
    const trimmed = scans.slice(0, 100);
    localStorage.setItem(`${KEY_PREFIX_SCANS}${activeUserId}`, JSON.stringify(trimmed));
  } catch (err) {
    console.error('Error saving scan history:', err);
  }
}

export function deleteScanHistory(scanId: string, userId?: string): void {
  try {
    const activeUserId = userId || getStoredUser()?.id || 'guest';
    const scans = getScanHistory(activeUserId).filter((s) => s.id !== scanId);
    localStorage.setItem(`${KEY_PREFIX_SCANS}${activeUserId}`, JSON.stringify(scans));
  } catch (err) {
    console.error('Error deleting scan history:', err);
  }
}

export function clearScanHistory(userId?: string): void {
  try {
    const activeUserId = userId || getStoredUser()?.id || 'guest';
    localStorage.removeItem(`${KEY_PREFIX_SCANS}${activeUserId}`);
  } catch (err) {
    console.error('Error clearing scan history:', err);
  }
}
