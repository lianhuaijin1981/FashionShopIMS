// ==========================================
// Purchase Management — Shared Utils & Types
// ==========================================

import type { PurchasePlan } from '@/types';

// ─── Extended Types for UI ───

export interface InboundRecord {
  id: string;
  inboundNo: string;
  orderId: string;
  orderNo: string;
  supplierId: string;
  supplierName: string;
  items: InboundItem[];
  totalQty: number;
  totalAmount: number;
  date: string;
  operator: string;
  status: 'completed' | 'partial';
  notes: string;
}

export interface InboundItem {
  productId: string;
  sku: string;
  productName: string;
  color: string;
  size: string;
  orderedQty: number;
  receivedQty: number;
  quality: 'pass' | 'fail' | 'shortage';
  batchNo: string;
  unitPrice: number;
}

export interface ReturnRecord {
  id: string;
  returnNo: string;
  orderId: string;
  orderNo: string;
  supplierId: string;
  supplierName: string;
  items: ReturnItem[];
  totalAmount: number;
  reason: 'quality_issue' | 'shortage' | 'slow_moving' | 'other';
  reasonDetail: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  date: string;
  approvedDate?: string;
  operator: string;
}

export interface ReturnItem {
  productId: string;
  sku: string;
  productName: string;
  color: string;
  size: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// ─── Status Maps ───

export const planStatusMap: Record<PurchasePlan['status'], { label: string; color: string; bg: string }> = {
  draft:       { label: '草稿',     color: '#A39E99', bg: 'rgba(45,41,38,0.08)' },
  pending:     { label: '待审批',   color: '#D4853C', bg: 'rgba(212,133,60,0.12)' },
  approved:    { label: '已批准',   color: '#4A9B8E', bg: 'rgba(74,155,142,0.10)' },
  ordered:     { label: '已下单',   color: '#3b6ea5', bg: 'rgba(59,110,165,0.12)' },
  completed:   { label: '已完成',   color: '#4A9B8E', bg: 'rgba(74,155,142,0.10)' },
  cancelled:   { label: '已取消',   color: '#A39E99', bg: 'rgba(45,41,38,0.08)' },
};

export const orderStatusMap: Record<string, { label: string; color: string; bg: string }> = {
  pending_review: { label: '待审核',   color: '#A39E99', bg: 'rgba(45,41,38,0.08)' },
  reviewed:       { label: '已审核',   color: '#D4853C', bg: 'rgba(212,133,60,0.12)' },
  shipped:        { label: '已发货',   color: '#3b6ea5', bg: 'rgba(59,110,165,0.12)' },
  received:       { label: '已收货',   color: '#4A9B8E', bg: 'rgba(74,155,142,0.10)' },
  partial:        { label: '部分收货', color: '#D4853C', bg: 'rgba(212,133,60,0.15)' },
  cancelled:      { label: '已取消',   color: '#A39E99', bg: 'rgba(45,41,38,0.08)' },
  pending:        { label: '待审核',   color: '#A39E99', bg: 'rgba(45,41,38,0.08)' },
};

export const inboundStatusMap: Record<string, { label: string; color: string; bg: string }> = {
  completed: { label: '已完成', color: '#4A9B8E', bg: 'rgba(74,155,142,0.10)' },
  partial:   { label: '部分入库', color: '#D4853C', bg: 'rgba(212,133,60,0.15)' },
};

export const returnStatusMap: Record<ReturnRecord['status'], { label: string; color: string; bg: string }> = {
  pending:   { label: '待审核', color: '#C75C3A', bg: 'rgba(199,92,58,0.10)' },
  approved:  { label: '已通过', color: '#4A9B8E', bg: 'rgba(74,155,142,0.10)' },
  rejected:  { label: '已拒绝', color: '#A39E99', bg: 'rgba(45,41,38,0.08)' },
  completed: { label: '已退货', color: '#4A9B8E', bg: 'rgba(74,155,142,0.10)' },
};

export const returnReasonMap: Record<ReturnRecord['reason'], string> = {
  quality_issue: '质量问题',
  shortage: '数量短缺',
  slow_moving: '滞销品',
  other: '其他',
};

export const qualityStatusMap: Record<InboundItem['quality'], { label: string; color: string; bg: string }> = {
  pass:     { label: '合格', color: '#4A9B8E', bg: 'rgba(74,155,142,0.10)' },
  fail:     { label: '不合格', color: '#C75C3A', bg: 'rgba(199,92,58,0.10)' },
  shortage: { label: '短缺', color: '#D4853C', bg: 'rgba(212,133,60,0.15)' },
};

// ─── ID Generators ───

export function generatePlanNo() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const r = String(Math.floor(Math.random() * 900) + 100);
  return `JH${y}${m}${d}${r}`;
}

export function generateOrderNo() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const r = String(Math.floor(Math.random() * 900) + 100);
  return `CG${y}${m}${d}${r}`;
}

export function generateInboundNo() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const r = String(Math.floor(Math.random() * 900) + 100);
  return `RK${y}${m}${d}${r}`;
}

export function generateReturnNo() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const r = String(Math.floor(Math.random() * 900) + 100);
  return `TH${y}${m}${d}${r}`;
}

// ─── Formatters ───

export function fmtMoney(n: number) {
  return `¥${n.toLocaleString('zh-CN')}`;
}

export function fmtDate(d: string) {
  if (!d) return '-';
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

// ─── localStorage helpers ───

const INBOUND_KEY = 'stylestock_inbound';
const RETURNS_KEY = 'stylestock_returns';

export function loadInboundRecords(): InboundRecord[] {
  try {
    const raw = localStorage.getItem(INBOUND_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

export function saveInboundRecords(records: InboundRecord[]) {
  try {
    localStorage.setItem(INBOUND_KEY, JSON.stringify(records));
  } catch { /* ignore */ }
}

export function loadReturnRecords(): ReturnRecord[] {
  try {
    const raw = localStorage.getItem(RETURNS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

export function saveReturnRecords(records: ReturnRecord[]) {
  try {
    localStorage.setItem(RETURNS_KEY, JSON.stringify(records));
  } catch { /* ignore */ }
}
