// ==========================================
// StyleStock — 服装门店进销存系统 TypeScript Types
// ==========================================

export interface ProductSpec {
  color: string;
  colorHex: string;
  sizes: Record<string, number>; // size -> stock quantity
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  subcategory: string;
  description: string;
  costPrice: number;
  retailPrice: number;
  wholesalePrice: number;
  specs: ProductSpec[];
  images: string[];
  status: 'active' | 'discontinued' | 'draft';
  createdAt: string;
  updatedAt: string;
  supplierId: string;
  season: string;
  year: number;
  tags: string[];
}

export interface Inventory {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  color: string;
  colorHex: string;
  size: string;
  quantity: number;
  storeId: string;
  storeName: string;
  lastUpdated: string;
  minStock: number;
  maxStock: number;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  category: string;
  status: 'active' | 'inactive';
  rating: number;
  totalOrders: number;
  createdAt: string;
}

export interface PurchasePlan {
  id: string;
  planNo: string;
  title: string;
  supplierId: string;
  supplierName: string;
  items: PurchasePlanItem[];
  totalAmount: number;
  totalQuantity: number;
  status: 'draft' | 'pending' | 'approved' | 'ordered' | 'completed' | 'cancelled';
  createdAt: string;
  expectedDate: string;
  createdBy: string;
}

export interface PurchasePlanItem {
  productId: string;
  sku: string;
  productName: string;
  color: string;
  size: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PurchaseOrder {
  id: string;
  orderNo: string;
  planId?: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  totalQuantity: number;
  status: 'pending' | 'partial' | 'received' | 'cancelled';
  inboundStatus: 'not_started' | 'in_progress' | 'completed';
  createdAt: string;
  expectedDate: string;
  receivedDate?: string;
  createdBy: string;
  notes: string;
}

export interface PurchaseOrderItem {
  productId: string;
  sku: string;
  productName: string;
  color: string;
  size: string;
  quantity: number;
  receivedQuantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface SalesOrderItem {
  productId: string;
  sku: string;
  productName: string;
  color: string;
  size: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface SalesOrder {
  id: string;
  orderNo: string;
  items: SalesOrderItem[];
  totalAmount: number;
  totalQuantity: number;
  discount: number;
  finalAmount: number;
  paymentMethod: 'cash' | 'wechat' | 'alipay' | 'card' | 'stored_value';
  memberId?: string;
  memberName?: string;
  memberPhone?: string;
  pointsEarned: number;
  pointsUsed: number;
  status: 'completed' | 'refunded' | 'partial_refund';
  storeId: string;
  storeName: string;
  operator: string;
  createdAt: string;
  notes: string;
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  gender: 'male' | 'female' | 'other';
  birthday?: string;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  points: number;
  storedValue: number;
  totalSpent: number;
  totalOrders: number;
  lastPurchaseDate?: string;
  status: 'active' | 'inactive' | 'frozen';
  createdAt: string;
  notes: string;
}

export interface Store {
  id: string;
  name: string;
  address: string;
  phone: string;
  manager: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface User {
  id: string;
  account: string;
  name: string;
  role: 'admin' | 'shop_manager' | 'staff';
  storeId: string;
  storeName: string;
  avatar?: string;
  phone: string;
  status: 'active' | 'inactive';
  lastLogin?: string;
}

export interface AppSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  receiptFooter: string;
  lowStockThreshold: number;
  autoBackup: boolean;
  theme: 'light';
  language: 'zh-CN';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: string;
  route?: string;
}

export interface Activity {
  id: string;
  type: 'sale' | 'inbound' | 'outbound' | 'refund' | 'member' | 'alert' | 'count' | 'purchase';
  title: string;
  detail?: string;
  time: string;
  amount?: number;
  operator?: string;
  reference?: string;
  points?: number;
}

export interface DashboardKPI {
  label: string;
  value: string;
  numericValue: number;
  prefix?: string;
  suffix?: string;
  trend?: number;
  trendLabel?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  helper?: string;
  helperType?: 'default' | 'success' | 'alert';
  hasAlert?: boolean;
  sparklineData?: number[];
}

export interface SalesTrendPoint {
  date: string;
  amount: number;
  orders: number;
}

// App State
export interface AppState {
  products: Product[];
  inventory: Inventory[];
  sales: SalesOrder[];
  members: Member[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  purchasePlans: PurchasePlan[];
  user: User | null;
  currentStore: Store | null;
  stores: Store[];
  settings: AppSettings;
  notifications: Notification[];
  isLoading: boolean;
  isInitialized: boolean;
}

// App Actions
export type AppAction =
  | { type: 'INIT_STATE'; payload: Partial<AppState> }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_CURRENT_STORE'; payload: Store }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'ADD_INVENTORY'; payload: Inventory }
  | { type: 'UPDATE_INVENTORY'; payload: Inventory }
  | { type: 'ADD_SALE'; payload: SalesOrder }
  | { type: 'UPDATE_SALE'; payload: SalesOrder }
  | { type: 'ADD_MEMBER'; payload: Member }
  | { type: 'UPDATE_MEMBER'; payload: Member }
  | { type: 'DELETE_MEMBER'; payload: string }
  | { type: 'ADD_SUPPLIER'; payload: Supplier }
  | { type: 'UPDATE_SUPPLIER'; payload: Supplier }
  | { type: 'ADD_PURCHASE_ORDER'; payload: PurchaseOrder }
  | { type: 'UPDATE_PURCHASE_ORDER'; payload: PurchaseOrder }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'READ_NOTIFICATION'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'MARK_INITIALIZED' };
