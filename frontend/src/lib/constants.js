// ─────────────────────────────────────────────
// EBOS — Application Constants
// Central config: API URL, payment modes, nav tabs
// ─────────────────────────────────────────────

const getEnvApiUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:3000';
  }
  return '';
};

export const API_BASE_URL = getEnvApiUrl();

export const PAYMENT_MODES = [
  { value: 'CASH',          label: 'Cash' },
  { value: 'TELEBIRR',      label: 'Telebirr Mobile Pay' },
  { value: 'CBE_BIRR',      label: 'CBE Birr' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CREDIT',        label: 'Business Credit Ledger' },
];

export const PAYMENT_MODES_NO_CREDIT = PAYMENT_MODES.filter(m => m.value !== 'CREDIT');

export const MOVEMENT_TYPES = [
  { value: 'STOCK_IN',    label: 'Stock In (Purchase / Receive)' },
  { value: 'STOCK_OUT',   label: 'Stock Out (Loss / Damage)' },
  { value: 'ADJUSTMENT',  label: 'Count Adjustment' },
];

export const MODULES = [
  { id: 'sales',     icon: '🛒', label: 'Sales' },
  { id: 'purchases', icon: '🚚', label: 'Purchases' },
  { id: 'inventory', icon: '📦', label: 'Inventory' },
  { id: 'settings',  icon: '⚙️',  label: 'Settings' },
];

export const NAV_TABS = {
  sales: [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'pos',       icon: '🛒', label: 'Checkout POS' },
    { id: 'customers', icon: '👥', label: 'Customers' },
    { id: 'reports',   icon: '📈', label: 'Reports' },
  ],
  purchases: [
    { id: 'po',        icon: '📝', label: 'Purchase Orders' },
    { id: 'suppliers', icon: '🏭', label: 'Vendors' },
  ],
  inventory: [
    { id: 'stock',     icon: '📦', label: 'Stock Ledger' },
    { id: 'products',  icon: '🏷️',  label: 'Products' },
  ],
  settings: [
    { id: 'users',     icon: '👤', label: 'Users & Roles' },
  ]
};

export const DEFAULT_BRANCH_ID  = 'br_mercato_main';
export const DEFAULT_BUSINESS_ID = 'bus_mercato_001';

export const UNIT_OF_MEASURES = [
  'pcs', 'kg', 'g', 'litre', 'ml', 'box', 'pack', 'pair', 'set', 'roll', 'bag', 'bottle', 'carton', 'dozen',
];

export const PAYMENT_MODE_COLORS = {
  CASH:          'bg-emerald-50 text-emerald-700',
  TELEBIRR:      'bg-blue-50   text-blue-700',
  CBE_BIRR:      'bg-indigo-50 text-indigo-700',
  BANK_TRANSFER: 'bg-purple-50 text-purple-700',
  CREDIT:        'bg-amber-50  text-amber-700',
};
