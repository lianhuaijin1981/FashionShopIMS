import { useState, useMemo, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import type { Inventory } from '@/types';
import { cn } from '@/lib/utils';
import {
  Search, Download, Printer, X,
  Package, CircleCheck, AlertTriangle, XCircle, ArrowUpDown,
  ChevronLeft, ChevronRight, Settings2, RotateCcw, Minus, Plus,
  Eye, History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle
} from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const STATUS_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'instock', label: '充足' },
  { value: 'lowstock', label: '预警' },
  { value: 'outofstock', label: '缺货' },
];
const CATEGORY_OPTIONS = ['全部', '上衣', '裤装', '裙装', '外套', '配饰'];
const REASON_OPTIONS = ['盘点调整', '损坏报废', '丢失', '其他'];
const ADJUST_TYPES = [
  { value: 'inbound', label: '入库 (+)' },
  { value: 'outbound', label: '出库 (-)' },
  { value: 'count', label: '盘点调整' },
];

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  instock:   { label: '充足', color: '#4A9B8E', bg: 'rgba(74,155,142,0.10)' },
  lowstock:  { label: '预警', color: '#C75C3A', bg: 'rgba(199,92,58,0.10)' },
  outofstock:{ label: '缺货', color: '#A39E99', bg: 'rgba(45,41,38,0.08)' },
};

const PAGE_SIZE_OPTIONS = [20, 50, 100];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getStockStatus(qty: number, minStock: number): string {
  if (qty === 0) return 'outofstock';
  if (qty <= minStock) return 'lowstock';
  return 'instock';
}

function getStatusMeta(qty: number, minStock: number) {
  return STATUS_META[getStockStatus(qty, minStock)];
}

function getAllColors(inventory: Inventory[]) {
  const map = new Map<string, string>();
  inventory.forEach(i => map.set(i.color, i.colorHex));
  return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
}

function formatPrice(n: number) {
  return `¥${n.toLocaleString('zh-CN')}`;
}

/* ------------------------------------------------------------------ */
/*  Inventory Page                                                     */
/* ------------------------------------------------------------------ */

export default function InventoryPage() {
  const { state, dispatch } = useApp();
  const inventory = state.inventory;
  const products = state.products;

  /* ---- filters ---- */
  const [search, setSearch] = useState('');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('全部');

  /* ---- sorting ---- */
  const [sortCol, setSortCol] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  /* ---- selection ---- */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  /* ---- pagination ---- */
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  /* ---- drawer & modals ---- */
  const [detailItem, setDetailItem] = useState<Inventory | null>(null);
  const [adjustItem, setAdjustItem] = useState<Inventory | null>(null);
  const [adjustType, setAdjustType] = useState('inbound');
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustReason, setAdjustReason] = useState(REASON_OPTIONS[0]);
  const [adjustNote, setAdjustNote] = useState('');

  /* ---- derived: colors list ---- */
  const allColors = useMemo(() => getAllColors(inventory), [inventory]);

  /* ---- derived: product lookup ---- */
  const productMap = useMemo(() => {
    const m = new Map<string, typeof products[0]>();
    products.forEach(p => m.set(p.id, p));
    return m;
  }, [products]);

  /* ---- category for inventory item ---- */
  const getCategory = useCallback((item: Inventory) => {
    const prod = productMap.get(item.productId);
    return prod?.category || '-';
  }, [productMap]);

  /* ---- filtering ---- */
  const filtered = useMemo(() => {
    let rows = [...inventory];

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        r.sku.toLowerCase().includes(q) ||
        r.productName.toLowerCase().includes(q)
      );
    }

    if (selectedColors.length) {
      rows = rows.filter(r => selectedColors.includes(r.color));
    }

    if (selectedSizes.length) {
      rows = rows.filter(r => selectedSizes.includes(r.size));
    }

    if (statusFilter !== 'all') {
      rows = rows.filter(r => getStockStatus(r.quantity, r.minStock) === statusFilter);
    }

    if (categoryFilter !== '全部') {
      rows = rows.filter(r => getCategory(r) === categoryFilter);
    }

    return rows;
  }, [inventory, search, selectedColors, selectedSizes, statusFilter, categoryFilter, getCategory]);

  /* ---- sorting ---- */
  const sorted = useMemo(() => {
    if (!sortCol) return filtered;
    const rows = [...filtered];
    rows.sort((a, b) => {
      let av: number | string;
      let bv: number | string;
      switch (sortCol) {
        case 'sku': av = a.sku; bv = b.sku; break;
        case 'productName': av = a.productName; bv = b.productName; break;
        case 'color': av = a.color; bv = b.color; break;
        case 'size': av = a.size; bv = b.size; break;
        case 'quantity': av = a.quantity; bv = b.quantity; break;
        case 'costPrice': av = a.productId ? (productMap.get(a.productId)?.costPrice || 0) : 0; bv = b.productId ? (productMap.get(b.productId)?.costPrice || 0) : 0; break;
        case 'retailPrice': av = a.productId ? (productMap.get(a.productId)?.retailPrice || 0) : 0; bv = b.productId ? (productMap.get(b.productId)?.retailPrice || 0) : 0; break;
        case 'storeName': av = a.storeName; bv = b.storeName; break;
        default: return 0;
      }
      if (typeof av === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
      }
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return rows;
  }, [filtered, sortCol, sortDir, productMap]);

  /* ---- pagination ---- */
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, safePage, pageSize]);

  /* ---- summary stats ---- */
  const stats = useMemo(() => {
    const totalItems = filtered.reduce((s, i) => s + i.quantity, 0);
    const totalSKUs = new Set(filtered.map(i => i.sku)).size;
    const lowStock = filtered.filter(i => getStockStatus(i.quantity, i.minStock) === 'lowstock').length;
    const outOfStock = filtered.filter(i => getStockStatus(i.quantity, i.minStock) === 'outofstock').length;
    const totalValue = filtered.reduce((s, i) => {
      const prod = productMap.get(i.productId);
      return s + i.quantity * (prod?.costPrice || 0);
    }, 0);
    return { totalItems, totalSKUs, lowStock, outOfStock, totalValue };
  }, [filtered, productMap]);

  /* ---- handlers ---- */
  const toggleColor = (c: string) => {
    setSelectedColors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
    setPage(1);
  };

  const toggleSize = (s: string) => {
    setSelectedSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
    setPage(1);
  };

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const toggleSelectAll = () => {
    const pageIds = paginated.map(r => r.id);
    const allSelected = pageIds.every(id => selectedIds.has(id));
    setSelectedIds(prev => {
      const n = new Set(prev);
      pageIds.forEach(id => allSelected ? n.delete(id) : n.add(id));
      return n;
    });
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedColors([]);
    setSelectedSizes([]);
    setStatusFilter('all');
    setCategoryFilter('全部');
    setPage(1);
  };

  const hasFilters = search || selectedColors.length || selectedSizes.length || statusFilter !== 'all' || categoryFilter !== '全部';

  /* ---- stock adjustment ---- */
  const openAdjust = (item: Inventory) => {
    setAdjustItem(item);
    setAdjustType('inbound');
    setAdjustQty(1);
    setAdjustReason(REASON_OPTIONS[0]);
    setAdjustNote('');
  };

  const submitAdjust = () => {
    if (!adjustItem) return;
    const delta = adjustType === 'outbound' ? -adjustQty : adjustType === 'count' ? adjustQty : adjustQty;
    const newQty = Math.max(0, adjustItem.quantity + delta);

    dispatch({
      type: 'UPDATE_INVENTORY',
      payload: { ...adjustItem, quantity: newQty, lastUpdated: new Date().toISOString().slice(0, 10) }
    });

    // add notification log
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        id: `notif_${Date.now()}`,
        title: '库存调整',
        message: `${adjustItem.sku} ${adjustItem.color}-${adjustItem.size} ${adjustType === 'outbound' ? '出库' : adjustType === 'count' ? '盘点调整' : '入库'} ${Math.abs(delta)}件，原因：${adjustReason}${adjustNote ? ` | ${adjustNote}` : ''}`,
        type: 'info',
        read: false,
        createdAt: new Date().toISOString(),
      }
    });

    setAdjustItem(null);
  };

  /* ---- product detail helpers ---- */
  const getProductSpecs = (item: Inventory) => {
    const prod = productMap.get(item.productId);
    if (!prod) return [];
    const specs: { color: string; colorHex: string; size: string; stock: number }[] = [];
    prod.specs.forEach(sp => {
      Object.entries(sp.sizes).forEach(([sz, qty]) => {
        specs.push({ color: sp.color, colorHex: sp.colorHex, size: sz, stock: qty });
      });
    });
    return specs;
  };

  const getRecentMovements = (item: Inventory) => {
    return state.sales
      .filter(s => s.items.some(it => it.sku === item.sku && it.color === item.color && it.size === item.size))
      .slice(0, 5)
      .map(s => ({
        type: 'sale' as const,
        title: `销售出库 ${s.items.find(it => it.sku === item.sku)?.quantity || 0}件`,
        time: s.createdAt.slice(0, 16).replace('T', ' '),
        ref: s.orderNo,
      }));
  };

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100dvh - 140px)' }}>
      {/* ======================== Page Header ======================== */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-[32px] font-semibold tracking-tight text-[#2D2926]">
            库存管理
          </h1>
          <p className="mt-1 text-xs text-[#A39E99]">首页 / 库存管理</p>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm text-[#A39E99]">
            同步于 {new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* ======================== Filter Bar ======================== */}
      <div className="mb-4 rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(45,41,38,0.06)]">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1" style={{ minWidth: 200 }}>
            <Search className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#A39E99]" />
            <Input
              placeholder="搜索款号、商品名称或SKU..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="h-10 rounded-xl border-[rgba(45,41,38,0.12)] bg-white pl-10 text-sm focus:border-[#D4853C] focus:ring-[3px] focus:ring-[rgba(212,133,60,0.12)]"
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
          </div>

          {/* Category */}
          <Select value={categoryFilter} onValueChange={v => { setCategoryFilter(v); setPage(1); }}>
            <SelectTrigger className="h-10 w-[120px] rounded-xl border-[rgba(45,41,38,0.12)] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {CATEGORY_OPTIONS.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Color */}
          <div className="flex items-center gap-1.5 rounded-xl border border-[rgba(45,41,38,0.12)] px-3 py-2">
            <span className="mr-1 text-xs text-[#A39E99]">颜色</span>
            {allColors.slice(0, 6).map(c => (
              <button
                key={c.name}
                onClick={() => toggleColor(c.name)}
                title={c.name}
                className={cn(
                  'h-5 w-5 rounded-full border-2 transition-all duration-200',
                  selectedColors.includes(c.name)
                    ? 'scale-110 border-[#D4853C] shadow-[0_0_0_2px_rgba(212,133,60,0.3)]'
                    : 'border-transparent hover:scale-105'
                )}
                style={{ backgroundColor: c.hex }}
              />
            ))}
            {allColors.length > 6 && (
              <span className="text-[10px] text-[#A39E99]">+{allColors.length - 6}</span>
            )}
          </div>

          {/* Size */}
          <div className="flex items-center gap-1 rounded-xl border border-[rgba(45,41,38,0.12)] px-2 py-1.5">
            <span className="mr-1 text-xs text-[#A39E99]">尺码</span>
            {SIZE_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => toggleSize(s)}
                className={cn(
                  'rounded-lg px-2 py-1 text-xs font-medium transition-all',
                  selectedSizes.includes(s)
                    ? 'bg-[#2D2926] text-white'
                    : 'bg-transparent text-[#6B6560] hover:bg-[rgba(45,41,38,0.06)]'
                )}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Status */}
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="h-10 w-[120px] rounded-xl border-[rgba(45,41,38,0.12)] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {STATUS_OPTIONS.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Reset */}
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-10 gap-1 rounded-xl text-[#6B6560] hover:bg-[rgba(45,41,38,0.06)] hover:text-[#2D2926]"
            >
              <RotateCcw className="h-4 w-4" />
              重置
            </Button>
          )}
        </div>

        {/* Active filter tags */}
        {hasFilters && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-[rgba(45,41,38,0.08)] pt-3">
            {search && (
              <Badge variant="secondary" className="gap-1 rounded-lg bg-[rgba(45,41,38,0.06)] px-2 py-1 text-xs font-medium text-[#6B6560]">
                搜索: {search} <X className="h-3 w-3 cursor-pointer" onClick={() => { setSearch(''); setPage(1); }} />
              </Badge>
            )}
            {selectedColors.map(c => (
              <Badge key={c} variant="secondary" className="gap-1 rounded-lg px-2 py-1 text-xs font-medium" style={{ background: allColors.find(cl => cl.name === c)?.hex + '20', color: allColors.find(cl => cl.name === c)?.hex }}>
                {c} <X className="h-3 w-3 cursor-pointer" onClick={() => toggleColor(c)} />
              </Badge>
            ))}
            {selectedSizes.map(s => (
              <Badge key={s} variant="secondary" className="gap-1 rounded-lg bg-[rgba(45,41,38,0.06)] px-2 py-1 text-xs font-medium text-[#6B6560]">
                {s} <X className="h-3 w-3 cursor-pointer" onClick={() => toggleSize(s)} />
              </Badge>
            ))}
            {statusFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1 rounded-lg bg-[rgba(45,41,38,0.06)] px-2 py-1 text-xs font-medium text-[#6B6560]">
                {STATUS_OPTIONS.find(s => s.value === statusFilter)?.label}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter('all')} />
              </Badge>
            )}
            {categoryFilter !== '全部' && (
              <Badge variant="secondary" className="gap-1 rounded-lg bg-[rgba(45,41,38,0.06)] px-2 py-1 text-xs font-medium text-[#6B6560]">
                {categoryFilter} <X className="h-3 w-3 cursor-pointer" onClick={() => setCategoryFilter('全部')} />
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* ======================== Action Toolbar ======================== */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 ? (
            <div className="flex items-center gap-2 rounded-xl bg-[rgba(212,133,60,0.08)] px-3 py-2">
              <span className="text-sm font-medium text-[#D4853C]">已选 {selectedIds.size} 项</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 rounded-lg text-xs text-[#6B6560] hover:text-[#2D2926]"
                onClick={() => {
                  const csv = inventory
                    .filter(i => selectedIds.has(i.id))
                    .map(i => `${i.sku},${i.productName},${i.color},${i.size},${i.quantity}`)
                    .join('\n');
                  const blob = new Blob([`SKU,商品名称,颜色,尺码,数量\n${csv}`], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = 'inventory_export.csv'; a.click();
                }}
              >
                <Download className="h-3.5 w-3.5" /> 批量导出
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 rounded-lg text-xs text-[#6B6560] hover:text-[#2D2926]"
                onClick={() => alert(`已打印 ${selectedIds.size} 个库存标签`)}
              >
                <Printer className="h-3.5 w-3.5" /> 打印库存标签
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 rounded-lg text-xs text-[#A39E99]"
                onClick={() => setSelectedIds(new Set())}
              >
                清除
              </Button>
            </div>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 rounded-xl border-[rgba(45,41,38,0.12)] text-sm text-[#2D2926] hover:bg-[rgba(45,41,38,0.04)]"
                onClick={() => {
                  const csv = sorted.map(i => `${i.sku},${i.productName},${i.color},${i.size},${i.quantity}`).join('\n');
                  const blob = new Blob([`SKU,商品名称,颜色,尺码,数量\n${csv}`], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = 'inventory_export.csv'; a.click();
                }}
              >
                <Download className="h-4 w-4" /> 导出
              </Button>
            </>
          )}
        </div>
        <p className="text-xs text-[#A39E99]">
          共 <span className="font-mono font-semibold text-[#2D2926]">{stats.totalSKUs}</span> 款{' '}
          <span className="font-mono font-semibold text-[#2D2926]">{stats.totalItems.toLocaleString('zh-CN')}</span> 件
        </p>
      </div>

      {/* ======================== Data Table ======================== */}
      <div className="mb-4 flex-1 overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(45,41,38,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="border-b border-[rgba(45,41,38,0.08)]">
                <th className="w-12 px-4 py-3 text-center">
                  <Checkbox
                    checked={paginated.length > 0 && paginated.every(r => selectedIds.has(r.id))}
                    onCheckedChange={toggleSelectAll}
                    className="h-4 w-4 border-[rgba(45,41,38,0.2)]"
                  />
                </th>
                {[
                  { key: 'sku', label: '款号', width: 120 },
                  { key: 'productName', label: '商品名称', width: 180 },
                  { key: 'color', label: '颜色', width: 80 },
                  { key: 'size', label: '尺码', width: 60 },
                  { key: 'quantity', label: '库存数量', width: 80 },
                  { key: 'costPrice', label: '成本价', width: 90 },
                  { key: 'retailPrice', label: '售价', width: 90 },
                  { key: 'storeName', label: '库存位置', width: 100 },
                  { key: 'status', label: '状态', width: 90 },
                ].map(col => (
                  <th
                    key={col.key}
                    className="cursor-pointer select-none px-4 py-3 text-left"
                    style={{ width: col.width }}
                    onClick={() => col.key !== 'status' && handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium uppercase tracking-wider text-[#A39E99]" style={{ letterSpacing: '0.04em' }}>
                        {col.label}
                      </span>
                      {col.key !== 'status' && <ArrowUpDown className="h-3 w-3 text-[#A39E99]" />}
                    </div>
                  </th>
                ))}
                <th className="w-16 px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-[#A39E99]">操作</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-16 text-center">
                    <Package className="mx-auto h-12 w-12 text-[#A39E99] opacity-50" />
                    <p className="mt-4 text-sm font-medium text-[#6B6560]">暂无数据</p>
                    <p className="mt-1 text-xs text-[#A39E99]">没有找到符合条件的库存记录</p>
                  </td>
                </tr>
              ) : (
                paginated.map((row) => {
                  const prod = productMap.get(row.productId);
                  const st = getStatusMeta(row.quantity, row.minStock);
                  const isSelected = selectedIds.has(row.id);
                  const costPrice = prod?.costPrice || 0;
                  const retailPrice = prod?.retailPrice || 0;

                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        'group cursor-pointer border-b border-[rgba(45,41,38,0.08)] transition-colors duration-150',
                        isSelected ? 'bg-[rgba(212,133,60,0.06)]' : 'hover:bg-[rgba(45,41,38,0.03)]'
                      )}
                      style={{ height: 56 }}
                      onClick={() => setDetailItem(row)}
                    >
                      <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(row.id)}
                          className="h-4 w-4 border-[rgba(45,41,38,0.2)]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[13px] text-[#2D2926]">{row.sku}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-[#2D2926]">{row.productName}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.colorHex }} />
                          <span className="text-xs text-[#6B6560]">{row.color}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-mono text-[13px] text-[#2D2926]">{row.size}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="font-mono text-[14px] font-semibold"
                          style={{ color: st.color, textDecoration: row.quantity === 0 ? 'line-through' : 'none' }}
                        >
                          {row.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[13px] text-[#6B6560]">{formatPrice(costPrice)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[13px] text-[#2D2926]">{formatPrice(retailPrice)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-[#6B6560]">{row.storeName}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-block rounded-lg px-2.5 py-1 text-[11px] font-medium"
                          style={{ backgroundColor: st.bg, color: st.color }}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => setDetailItem(row)}
                            className="rounded-lg p-1.5 text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.06)] hover:text-[#2D2926]"
                            title="查看详情"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openAdjust(row)}
                            className="rounded-lg p-1.5 text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.06)] hover:text-[#2D2926]"
                            title="库存调整"
                          >
                            <Settings2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================== Pagination ======================== */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(45,41,38,0.12)] text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.04)] disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pg: number;
            if (totalPages <= 5) pg = i + 1;
            else if (safePage <= 3) pg = i + 1;
            else if (safePage >= totalPages - 2) pg = totalPages - 4 + i;
            else pg = safePage - 2 + i;
            return (
              <button
                key={pg}
                onClick={() => setPage(pg)}
                className={cn(
                  'flex h-8 min-w-[32px] items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors',
                  pg === safePage
                    ? 'bg-[#D4853C] text-white'
                    : 'border border-[rgba(45,41,38,0.12)] text-[#6B6560] hover:bg-[rgba(45,41,38,0.04)]'
                )}
              >
                {pg}
              </button>
            );
          })}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(45,41,38,0.12)] text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.04)] disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#A39E99]">
          <span>每页</span>
          <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setPage(1); }}>
            <SelectTrigger className="h-8 w-[70px] rounded-lg border-[rgba(45,41,38,0.12)] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              {PAGE_SIZE_OPTIONS.map(ps => (
                <SelectItem key={ps} value={String(ps)}>{ps}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>条</span>
          <span className="ml-2">共 {sorted.length} 条</span>
        </div>
      </div>

      {/* ======================== Sticky Summary Bar ======================== */}
      <div
        className="sticky bottom-0 z-10 flex items-center gap-8 rounded-t-2xl border-t border-[rgba(45,41,38,0.08)] bg-white px-6 py-3 shadow-[0_-4px_16px_rgba(45,41,38,0.06)]"
      >
        <SummaryItem icon={<Package className="h-4 w-4" />} label="总库存" value={`${stats.totalItems.toLocaleString('zh-CN')}件`} color="#2D2926" />
        <Separator />
        <SummaryItem icon={<CircleCheck className="h-4 w-4" />} label="充足" value={`${(stats.totalItems - stats.lowStock - stats.outOfStock).toLocaleString('zh-CN')}件`} color="#4A9B8E" />
        <Separator />
        <SummaryItem icon={<AlertTriangle className="h-4 w-4" />} label="预警" value={`${stats.lowStock}件`} color="#C75C3A" />
        <Separator />
        <SummaryItem icon={<XCircle className="h-4 w-4" />} label="缺货" value={`${stats.outOfStock}件`} color="#A39E99" />
        <Separator />
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#A39E99]">库存总值</span>
          <span className="font-mono text-sm font-semibold text-[#2D2926]">¥{stats.totalValue.toLocaleString('zh-CN')}</span>
        </div>
      </div>

      {/* ======================== Detail Drawer ======================== */}
      <Sheet open={!!detailItem} onOpenChange={() => setDetailItem(null)}>
        <SheetContent className="w-[480px] overflow-y-auto rounded-l-2xl p-0 sm:max-w-[480px]">
          {detailItem && (
            <>
              <SheetHeader className="border-b border-[rgba(45,41,38,0.08)] p-6 pb-4">
                <SheetTitle className="font-display text-xl font-semibold text-[#2D2926]">库存详情</SheetTitle>
              </SheetHeader>

              <div className="p-6">
                {/* Product info */}
                <div className="mb-6 flex gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-[#E9E6E1]">
                    <Package className="h-8 w-8 text-[#A39E99]" />
                  </div>
                  <div>
                    <p className="font-mono text-xs text-[#A39E99]">{detailItem.sku}</p>
                    <p className="mt-1 text-base font-semibold text-[#2D2926]">{detailItem.productName}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: detailItem.colorHex }} />
                      <span className="text-sm text-[#6B6560]">{detailItem.color} / {detailItem.size}</span>
                    </div>
                  </div>
                </div>

                {/* Stock info cards */}
                <div className="mb-6 grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-[rgba(74,155,142,0.08)] p-3 text-center">
                    <p className="font-mono text-xl font-semibold text-[#4A9B8E]">{detailItem.quantity}</p>
                    <p className="mt-1 text-[11px] text-[#6B6560]">当前库存</p>
                  </div>
                  <div className="rounded-xl bg-[rgba(212,133,60,0.08)] p-3 text-center">
                    <p className="font-mono text-xl font-semibold text-[#D4853C]">{detailItem.minStock}</p>
                    <p className="mt-1 text-[11px] text-[#6B6560]">预警阈值</p>
                  </div>
                  <div className="rounded-xl bg-[rgba(45,41,38,0.06)] p-3 text-center">
                    <p className="font-mono text-xl font-semibold text-[#2D2926]">{detailItem.maxStock}</p>
                    <p className="mt-1 text-[11px] text-[#6B6560]">最大库存</p>
                  </div>
                </div>

                {/* SKU Breakdown */}
                <div className="mb-6">
                  <h3 className="mb-3 text-sm font-semibold text-[#2D2926]">SKU 库存分布</h3>
                  <div className="max-h-60 overflow-y-auto rounded-xl border border-[rgba(45,41,38,0.08)]">
                    {getProductSpecs(detailItem).map((spec, i) => {
                      const specStatus = getStockStatus(spec.stock, detailItem.minStock);
                      const specMeta = STATUS_META[specStatus];
                      return (
                        <div key={i} className="flex items-center justify-between border-b border-[rgba(45,41,38,0.08)] px-4 py-2.5 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: spec.colorHex }} />
                            <span className="text-xs text-[#6B6560]">{spec.color}</span>
                            <span className="font-mono text-xs text-[#2D2926]">{spec.size}</span>
                          </div>
                          <span className="rounded-md px-2 py-0.5 font-mono text-xs font-medium" style={{ backgroundColor: specMeta.bg, color: specMeta.color }}>
                            {spec.stock}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent movements */}
                <div className="mb-6">
                  <h3 className="mb-3 text-sm font-semibold text-[#2D2926]">最近动态</h3>
                  <div className="space-y-2">
                    {getRecentMovements(detailItem).length === 0 ? (
                      <p className="text-xs text-[#A39E99]">暂无动态记录</p>
                    ) : (
                      getRecentMovements(detailItem).map((m, i) => (
                        <div key={i} className="flex items-center gap-3 rounded-xl bg-[rgba(45,41,38,0.03)] px-4 py-3">
                          <History className="h-4 w-4 text-[#A39E99]" />
                          <div className="flex-1">
                            <p className="text-xs text-[#2D2926]">{m.title}</p>
                            <p className="text-[11px] text-[#A39E99]">{m.ref}</p>
                          </div>
                          <span className="text-[11px] text-[#A39E99]">{m.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <Button
                  onClick={() => { setDetailItem(null); openAdjust(detailItem); }}
                  className="w-full gap-2 rounded-xl bg-[#D4853C] py-5 text-sm font-semibold text-white hover:bg-[#BF7532]"
                >
                  <Settings2 className="h-4 w-4" /> 调整库存
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ======================== Stock Adjustment Modal ======================== */}
      <Dialog open={!!adjustItem} onOpenChange={() => setAdjustItem(null)}>
        <DialogContent className="rounded-2xl sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-semibold text-[#2D2926]">库存调整</DialogTitle>
          </DialogHeader>

          {adjustItem && (
            <div className="space-y-5 py-4">
              {/* Product info */}
              <div className="flex items-center gap-3 rounded-xl bg-[rgba(45,41,38,0.04)] p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#E9E6E1]">
                  <Package className="h-5 w-5 text-[#A39E99]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#2D2926]">{adjustItem.productName}</p>
                  <p className="font-mono text-xs text-[#A39E99]">{adjustItem.sku} / {adjustItem.color} / {adjustItem.size}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="font-mono text-lg font-semibold text-[#2D2926]">{adjustItem.quantity}</p>
                  <p className="text-[11px] text-[#A39E99]">当前库存</p>
                </div>
              </div>

              {/* Adjustment type */}
              <div>
                <Label className="mb-2 block text-xs font-medium text-[#2D2926]">调整类型</Label>
                <RadioGroup value={adjustType} onValueChange={setAdjustType} className="flex gap-3">
                  {ADJUST_TYPES.map(t => (
                    <div key={t.value} className="flex items-center">
                      <RadioGroupItem value={t.value} id={t.value} className="h-4 w-4 border-[rgba(45,41,38,0.2)] text-[#D4853C]" />
                      <Label htmlFor={t.value} className="ml-1.5 cursor-pointer text-sm text-[#6B6560]">{t.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Quantity */}
              <div>
                <Label className="mb-2 block text-xs font-medium text-[#2D2926]">调整数量</Label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setAdjustQty(q => Math.max(1, q - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(45,41,38,0.12)] text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.04)]"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <Input
                    type="number"
                    value={adjustQty}
                    onChange={e => setAdjustQty(Math.max(1, parseInt(e.target.value) || 0))}
                    className="h-10 w-24 text-center font-mono text-lg font-semibold"
                  />
                  <button
                    onClick={() => setAdjustQty(q => q + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(45,41,38,0.12)] text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.04)]"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Reason */}
              <div>
                <Label className="mb-2 block text-xs font-medium text-[#2D2926]">调整原因</Label>
                <div className="flex flex-wrap gap-2">
                  {REASON_OPTIONS.map(r => (
                    <button
                      key={r}
                      onClick={() => setAdjustReason(r)}
                      className={cn(
                        'rounded-lg px-3 py-2 text-sm transition-all',
                        adjustReason === r
                          ? 'bg-[#2D2926] text-white'
                          : 'border border-[rgba(45,41,38,0.12)] text-[#6B6560] hover:bg-[rgba(45,41,38,0.04)]'
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label className="mb-2 block text-xs font-medium text-[#2D2926]">备注</Label>
                <Textarea
                  value={adjustNote}
                  onChange={e => setAdjustNote(e.target.value)}
                  placeholder="可选：填写调整备注..."
                  rows={2}
                  className="rounded-xl border-[rgba(45,41,38,0.12)] text-sm"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustItem(null)} className="rounded-xl border-[rgba(45,41,38,0.12)] text-sm">
              取消
            </Button>
            <Button onClick={submitAdjust} className="rounded-xl bg-[#D4853C] text-sm font-semibold text-white hover:bg-[#BF7532]">
              确认调整
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function SummaryItem({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ color }}>{icon}</span>
      <span className="text-xs text-[#6B6560]">{label}</span>
      <span className="font-mono text-sm font-semibold" style={{ color: '#2D2926' }}>{value}</span>
    </div>
  );
}

function Separator() {
  return <div className="h-6 w-px bg-[rgba(45,41,38,0.08)]" />;
}
