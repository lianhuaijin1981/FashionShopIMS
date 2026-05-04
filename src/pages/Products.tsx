import { useState, useMemo, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import type { Product, ProductSpec } from '@/types';
import { cn } from '@/lib/utils';
import {
  Search, PlusCircle, Upload, Grid3X3, LayoutList,
  X, ChevronLeft, ChevronRight, Pencil, Eye, Trash2, Package,
  Check, FileSpreadsheet
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CATEGORY_OPTIONS = ['全部', '上衣', '裤装', '裙装', '外套', '配饰'];
const SEASON_OPTIONS = ['全部', '春/夏', '秋/冬', '四季'];
const STATUS_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '正常' },
  { value: 'discontinued', label: '下架' },
  { value: 'draft', label: '草稿' },
];
const SORT_OPTIONS = [
  { value: 'newest', label: '最新上架' },
  { value: 'name', label: '名称' },
  { value: 'price_asc', label: '价格 ↑' },
  { value: 'price_desc', label: '价格 ↓' },
];

const FIT_OPTIONS = ['修身', '宽松', '标准', 'oversize'];
const PRODUCT_STATUS_OPTIONS = [
  { value: 'active', label: '正常' },
  { value: 'discontinued', label: '下架' },
  { value: 'draft', label: '草稿' },
];
const PREDEFINED_COLORS = [
  { name: '黑色', hex: '#1a1a1a' },
  { name: '白色', hex: '#f5f5f5' },
  { name: '灰色', hex: '#888888' },
  { name: '米色', hex: '#d4c4a8' },
  { name: '藏青', hex: '#2c3e6b' },
  { name: '蓝色', hex: '#3b6ea5' },
  { name: '酒红', hex: '#722f37' },
  { name: '卡其', hex: '#c3b091' },
  { name: '军绿', hex: '#4a5d3f' },
  { name: '粉色', hex: '#e8a0bf' },
];
const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '均码'];
const PAGE_SIZE = 24;

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: '正常', color: '#4A9B8E', bg: 'rgba(74,155,142,0.10)' },
  discontinued: { label: '下架', color: '#A39E99', bg: 'rgba(45,41,38,0.08)' },
  draft: { label: '草稿', color: '#6B6560', bg: 'rgba(45,41,38,0.06)' },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatPrice(n: number) {
  return `¥${n.toLocaleString('zh-CN')}`;
}

// Product SKU helper - not needed for current implementation

/* ------------------------------------------------------------------ */
/*  Products Page                                                      */
/* ------------------------------------------------------------------ */

export default function ProductsPage() {
  const { state, dispatch } = useApp();
  const products = state.products;

  /* ---- view state ---- */
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  /* ---- filters ---- */
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('全部');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  /* ---- pagination ---- */
  const [page, setPage] = useState(1);

  /* ---- modals ---- */
  const [showAddModal, setShowAddModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);

  /* ---- filtering ---- */
  const filtered = useMemo(() => {
    let rows = [...products];

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(p =>
        p.sku.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    if (categoryFilter !== '全部') {
      rows = rows.filter(p => p.category === categoryFilter);
    }

    if (statusFilter !== 'all') {
      rows = rows.filter(p => p.status === statusFilter);
    }

    // Sort
    switch (sortBy) {
      case 'name':
        rows.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price_asc':
        rows.sort((a, b) => a.retailPrice - b.retailPrice);
        break;
      case 'price_desc':
        rows.sort((a, b) => b.retailPrice - a.retailPrice);
        break;
      case 'newest':
      default:
        rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return rows;
  }, [products, search, categoryFilter, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  /* ---- product card actions ---- */
  const handleDelete = () => {
    if (!deleteProduct) return;
    dispatch({ type: 'DELETE_PRODUCT', payload: deleteProduct.id });
    setDeleteProduct(null);
  };

  const handleToggleStatus = (product: Product) => {
    const newStatus = product.status === 'discontinued' ? 'active' : 'discontinued';
    dispatch({
      type: 'UPDATE_PRODUCT',
      payload: { ...product, status: newStatus, updatedAt: new Date().toISOString().slice(0, 10) }
    });
  };

  /* ---- stats ---- */
  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    discontinued: products.filter(p => p.status === 'discontinued').length,
    draft: products.filter(p => p.status === 'draft').length,
  }), [products]);

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100dvh - 140px)' }}>
      {/* ======================== Page Header ======================== */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-[32px] font-semibold tracking-tight text-[#2D2926]">
            商品管理
          </h1>
          <p className="mt-1 text-xs text-[#A39E99]">首页 / 商品管理</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center rounded-xl border border-[rgba(45,41,38,0.12)] p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
                viewMode === 'grid' ? 'bg-[#2D2926] text-white' : 'text-[#6B6560] hover:bg-[rgba(45,41,38,0.06)]'
              )}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
                viewMode === 'list' ? 'bg-[#2D2926] text-white' : 'text-[#6B6560] hover:bg-[rgba(45,41,38,0.06)]'
              )}
            >
              <LayoutList className="h-4 w-4" />
            </button>
          </div>

          <Button
            onClick={() => setShowAddModal(true)}
            className="h-10 gap-2 rounded-xl bg-[#D4853C] px-5 text-sm font-semibold text-white hover:bg-[#BF7532]"
          >
            <PlusCircle className="h-4 w-4" /> 新增商品
          </Button>
        </div>
      </div>

      {/* ======================== Filter Bar ======================== */}
      <div className="mb-4 rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(45,41,38,0.06)]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1" style={{ minWidth: 200 }}>
            <Search className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#A39E99]" />
            <Input
              placeholder="搜索款号、商品名称..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="h-10 rounded-xl border-[rgba(45,41,38,0.12)] bg-white pl-10 text-sm"
            />
          </div>

          <Select value={categoryFilter} onValueChange={v => { setCategoryFilter(v); setPage(1); }}>
            <SelectTrigger className="h-10 w-[130px] rounded-xl border-[rgba(45,41,38,0.12)] text-sm">
              <SelectValue placeholder="全部分类" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {CATEGORY_OPTIONS.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="h-10 w-[120px] rounded-xl border-[rgba(45,41,38,0.12)] text-sm">
              <SelectValue placeholder="全部状态" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {STATUS_OPTIONS.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-10 w-[130px] rounded-xl border-[rgba(45,41,38,0.12)] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {SORT_OPTIONS.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImport(true)}
            className="h-10 gap-2 rounded-xl border-[rgba(45,41,38,0.12)] text-sm text-[#2D2926] hover:bg-[rgba(45,41,38,0.04)]"
          >
            <Upload className="h-4 w-4" /> 批量导入
          </Button>
        </div>
      </div>

      {/* ======================== Stats Bar ======================== */}
      <div className="mb-4 flex items-center gap-6 rounded-2xl bg-white px-5 py-3 shadow-[0_1px_3px_rgba(45,41,38,0.06)]">
        <span className="text-sm text-[#6B6560]">全部 <span className="ml-1 font-mono font-semibold text-[#2D2926]">{stats.total}</span></span>
        <span className="h-4 w-px bg-[rgba(45,41,38,0.08)]" />
        <span className="text-sm text-[#6B6560]">正常 <span className="ml-1 font-mono font-semibold text-[#4A9B8E]">{stats.active}</span></span>
        <span className="h-4 w-px bg-[rgba(45,41,38,0.08)]" />
        <span className="text-sm text-[#6B6560]">下架 <span className="ml-1 font-mono font-semibold text-[#A39E99]">{stats.discontinued}</span></span>
        <span className="h-4 w-px bg-[rgba(45,41,38,0.08)]" />
        <span className="text-sm text-[#6B6560]">草稿 <span className="ml-1 font-mono font-semibold text-[#6B6560]">{stats.draft}</span></span>
        <span className="ml-auto text-xs text-[#A39E99]">共 {filtered.length} 款商品</span>
      </div>

      {/* ======================== Grid View ======================== */}
      {viewMode === 'grid' ? (
        <div className="mb-6 grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-5">
          {paginated.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onPreview={() => setPreviewProduct(product)}
              onEdit={() => setEditProduct(product)}
              onToggleStatus={() => handleToggleStatus(product)}
              onDelete={() => setDeleteProduct(product)}
            />
          ))}
        </div>
      ) : (
        /* ======================== List View ======================== */
        <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(45,41,38,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr className="border-b border-[rgba(45,41,38,0.08)]">
                  <th className="w-12 px-4 py-3 text-center">
                    <Checkbox className="h-4 w-4" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#A39E99]">图片</th>
                  {[
                    { key: 'sku', label: '款号' },
                    { key: 'name', label: '商品名称' },
                    { key: 'category', label: '分类' },
                    { key: 'specs', label: '颜色数' },
                    { key: 'retailPrice', label: '售价' },
                    { key: 'costPrice', label: '成本价' },
                    { key: 'status', label: '状态' },
                  ].map(col => (
                    <th key={col.key} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#A39E99]">
                      {col.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-[#A39E99]">操作</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-16 text-center">
                      <Package className="mx-auto h-12 w-12 text-[#A39E99] opacity-50" />
                      <p className="mt-4 text-sm font-medium text-[#6B6560]">暂无数据</p>
                    </td>
                  </tr>
                ) : (
                  paginated.map(product => {
                    const statusMeta = STATUS_META[product.status] || STATUS_META.active;
                    return (
                      <tr
                        key={product.id}
                        className="group cursor-pointer border-b border-[rgba(45,41,38,0.08)] transition-colors hover:bg-[rgba(45,41,38,0.03)]"
                        style={{ height: 56 }}
                      >
                        <td className="px-4 py-3 text-center">
                          <Checkbox className="h-4 w-4" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E9E6E1]">
                            <Package className="h-5 w-5 text-[#A39E99]" />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-[13px] text-[#2D2926]">{product.sku}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-[#2D2926]">{product.name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-md bg-[rgba(45,41,38,0.06)] px-2 py-1 text-xs text-[#6B6560]">{product.category}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {product.specs.map((s, i) => (
                              <span key={i} className="inline-block h-3 w-3 rounded-full border border-[rgba(45,41,38,0.12)]" style={{ backgroundColor: s.colorHex }} />
                            ))}
                            <span className="ml-1 text-xs text-[#A39E99]">{product.specs.length}色</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-[13px] font-medium text-[#2D2926]">{formatPrice(product.retailPrice)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-[13px] text-[#6B6560]">{formatPrice(product.costPrice)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-lg px-2.5 py-1 text-[11px] font-medium" style={{ backgroundColor: statusMeta.bg, color: statusMeta.color }}>
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button onClick={() => setPreviewProduct(product)} className="rounded-lg p-1.5 text-[#6B6560] hover:bg-[rgba(45,41,38,0.06)] hover:text-[#2D2926]">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button onClick={() => setEditProduct(product)} className="rounded-lg p-1.5 text-[#6B6560] hover:bg-[rgba(45,41,38,0.06)] hover:text-[#2D2926]">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleToggleStatus(product)} className="rounded-lg p-1.5 text-[#6B6560] hover:bg-[rgba(45,41,38,0.06)] hover:text-[#2D2926]">
                              {product.status === 'discontinued' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
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
      )}

      {/* ======================== Pagination ======================== */}
      {totalPages > 1 && (
        <div className="mb-8 flex items-center justify-center gap-2">
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
          <span className="ml-3 text-xs text-[#A39E99]">共 {filtered.length} 条</span>
        </div>
      )}

      {/* ======================== Add/Edit Product Modal ======================== */}
      <ProductModal
        open={showAddModal || !!editProduct}
        onClose={() => { setShowAddModal(false); setEditProduct(null); }}
        product={editProduct}
        onSubmit={(product) => {
          if (editProduct) {
            dispatch({ type: 'UPDATE_PRODUCT', payload: product });
          } else {
            dispatch({ type: 'ADD_PRODUCT', payload: product });
          }
          setShowAddModal(false);
          setEditProduct(null);
        }}
      />

      {/* ======================== Preview Drawer ======================== */}
      <Sheet open={!!previewProduct} onOpenChange={() => setPreviewProduct(null)}>
        <SheetContent className="w-[420px] overflow-y-auto rounded-l-2xl p-0 sm:max-w-[420px]">
          {previewProduct && (
            <>
              <SheetHeader className="border-b border-[rgba(45,41,38,0.08)] p-6 pb-4">
                <SheetTitle className="font-display text-xl font-semibold text-[#2D2926]">商品预览</SheetTitle>
              </SheetHeader>
              <div className="p-6">
                <div className="mb-4 flex aspect-[4/5] items-center justify-center rounded-2xl bg-[#E9E6E1]">
                  <Package className="h-16 w-16 text-[#A39E99] opacity-50" />
                </div>
                <p className="font-mono text-xs text-[#A39E99]">{previewProduct.sku}</p>
                <p className="mt-1 text-lg font-semibold text-[#2D2926]">{previewProduct.name}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-md bg-[rgba(45,41,38,0.06)] px-2 py-1 text-xs text-[#6B6560]">{previewProduct.category}</span>
                  <span className="rounded-md bg-[rgba(45,41,38,0.06)] px-2 py-1 text-xs text-[#6B6560]">{previewProduct.season}</span>
                  <span className="rounded-lg px-2.5 py-1 text-[11px] font-medium" style={{
                    backgroundColor: STATUS_META[previewProduct.status]?.bg || STATUS_META.active.bg,
                    color: STATUS_META[previewProduct.status]?.color || STATUS_META.active.color,
                  }}>
                    {STATUS_META[previewProduct.status]?.label || '正常'}
                  </span>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-mono text-2xl font-semibold text-[#D4853C]">{formatPrice(previewProduct.retailPrice)}</span>
                  <span className="font-mono text-sm text-[#A39E99] line-through">{formatPrice(previewProduct.costPrice)}</span>
                </div>
                <div className="mt-4">
                  <h4 className="mb-2 text-sm font-medium text-[#2D2926]">颜色与尺码</h4>
                  {previewProduct.specs.map((spec, i) => (
                    <div key={i} className="mb-2 flex items-center gap-2 rounded-xl bg-[rgba(45,41,38,0.03)] px-4 py-2">
                      <span className="inline-block h-4 w-4 rounded-full border border-[rgba(45,41,38,0.12)]" style={{ backgroundColor: spec.colorHex }} />
                      <span className="text-sm text-[#6B6560]">{spec.color}</span>
                      <div className="ml-auto flex gap-1">
                        {Object.keys(spec.sizes).map(sz => (
                          <span key={sz} className="font-mono text-xs text-[#2D2926]">{sz}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ======================== Delete Confirmation ======================== */}
      <Dialog open={!!deleteProduct} onOpenChange={() => setDeleteProduct(null)}>
        <DialogContent className="rounded-2xl sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-semibold text-[#2D2926]">确认删除</DialogTitle>
          </DialogHeader>
          <p className="py-4 text-sm text-[#6B6560]">
            确定要删除商品 <span className="font-semibold text-[#2D2926]">{deleteProduct?.name}</span>（{deleteProduct?.sku}）吗？此操作不可撤销。
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteProduct(null)} className="rounded-xl border-[rgba(45,41,38,0.12)] text-sm">
              取消
            </Button>
            <Button onClick={handleDelete} className="rounded-xl bg-[#C75C3A] text-sm font-semibold text-white hover:bg-[#b34e32]">
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================== Bulk Import Drawer ======================== */}
      <Sheet open={showImport} onOpenChange={() => setShowImport(false)}>
        <SheetContent className="w-[500px] overflow-y-auto rounded-l-2xl p-0 sm:max-w-[500px]">
          <SheetHeader className="border-b border-[rgba(45,41,38,0.08)] p-6 pb-4">
            <SheetTitle className="font-display text-xl font-semibold text-[#2D2926]">批量导入商品</SheetTitle>
          </SheetHeader>
          <div className="p-6">
            <div className="mb-6 rounded-xl bg-[rgba(45,41,38,0.04)] p-4">
              <h4 className="mb-2 text-sm font-medium text-[#2D2926]">导入说明</h4>
              <ol className="list-inside list-decimal space-y-1 text-xs text-[#6B6560]">
                <li>下载导入模板，按格式填写商品信息</li>
                <li>支持 CSV、Excel (.xlsx) 格式</li>
                <li>每行一个商品，包含必填字段</li>
                <li>文件大小不超过 5MB</li>
              </ol>
            </div>

            <Button
              variant="outline"
              className="mb-6 w-full gap-2 rounded-xl border-dashed border-[rgba(45,41,38,0.2)] py-6 text-sm text-[#6B6560] hover:border-[#D4853C] hover:text-[#D4853C]"
              onClick={() => {
                const template = '款号,商品名称,品牌,分类,版型,材质,季节,吊牌价,售价,成本价,颜色,尺码\nA1001,测试商品,品牌A,上衣,修身,棉,四季,399,299,89,黑色|白色,M|L|XL';
                const blob = new Blob([template], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = 'product_import_template.csv'; a.click();
              }}
            >
              <FileSpreadsheet className="h-4 w-4" /> 下载导入模板
            </Button>

            <div
              className="mb-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[rgba(45,41,38,0.15)] bg-[rgba(45,41,38,0.02)] p-12 transition-colors hover:border-[#D4853C]"
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                alert('文件已接收（模拟导入）。实际项目中会解析 CSV/Excel 文件。');
                setShowImport(false);
              }}
            >
              <Upload className="mb-3 h-10 w-10 text-[#A39E99]" />
              <p className="text-sm font-medium text-[#6B6560]">拖拽文件到此处，或点击上传</p>
              <p className="mt-1 text-xs text-[#A39E99]">支持 CSV, Excel (.xlsx)</p>
              <input
                type="file"
                accept=".csv,.xlsx"
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={() => {
                  alert('文件已选择（模拟导入）。实际项目中会解析文件内容。');
                  setShowImport(false);
                }}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Product Card                                                       */
/* ------------------------------------------------------------------ */

function ProductCard({
  product,
  onPreview,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  product: Product;
  onPreview: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  const statusMeta = STATUS_META[product.status] || STATUS_META.active;
  const colorCount = product.specs.length;

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(45,41,38,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(45,41,38,0.10)]">
      {/* Status badge */}
      <span
        className="absolute right-3 top-3 z-10 rounded-lg px-2 py-1 text-[11px] font-medium"
        style={{ backgroundColor: statusMeta.bg, color: statusMeta.color }}
      >
        {statusMeta.label}
      </span>

      {/* Image area */}
      <div className="relative aspect-[4/5] overflow-hidden bg-[#E9E6E1]">
        <div className="flex h-full w-full items-center justify-center">
          <Package className="h-10 w-10 text-[#A39E99] opacity-50" />
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black/40 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <button
            onClick={(e) => { e.stopPropagation(); onPreview(); }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#2D2926] shadow-sm transition-colors hover:bg-white"
            title="预览"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#2D2926] shadow-sm transition-colors hover:bg-white"
            title="编辑"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleStatus(); }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#2D2926] shadow-sm transition-colors hover:bg-white"
            title={product.status === 'discontinued' ? '上架' : '下架'}
          >
            {product.status === 'discontinued' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#C75C3A] shadow-sm transition-colors hover:bg-white"
            title="删除"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Info section */}
      <div className="p-4 pt-3">
        <p className="font-mono text-[11px] text-[#A39E99]">{product.sku}</p>
        <p className="mt-1 truncate text-sm font-medium text-[#2D2926]">{product.name}</p>
        <p className="mt-2 font-mono text-base font-semibold text-[#D4853C]">{formatPrice(product.retailPrice)}</p>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {product.specs.slice(0, 3).map((s, i) => (
              <span key={i} className="inline-block h-2.5 w-2.5 rounded-full border border-[rgba(45,41,38,0.12)]" style={{ backgroundColor: s.colorHex }} />
            ))}
            {colorCount > 3 && <span className="text-[10px] text-[#A39E99]">+{colorCount - 3}</span>}
            <span className="ml-1 text-[11px] text-[#A39E99]">{colorCount}色</span>
          </div>
          <span className="rounded-md bg-[rgba(45,41,38,0.06)] px-2 py-0.5 text-[10px] text-[#6B6560]">{product.category}</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Product Modal (3-step Add/Edit)                                    */
/* ------------------------------------------------------------------ */

function ProductModal({
  open,
  onClose,
  product,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  onSubmit: (p: Product) => void;
}) {
  const [step, setStep] = useState(1);

  // Step 1: Basic info
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('上衣');
  const [fit, setFit] = useState('标准');
  const [material, setMaterial] = useState('');
  const [season, setSeason] = useState('四季');
  const [tagPrice, setTagPrice] = useState('');
  const [retailPrice, setRetailPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');

  // Step 2: Specs
  const [selectedColors, setSelectedColors] = useState<{ name: string; hex: string }[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [specMatrix, setSpecMatrix] = useState<Record<string, Record<string, number>>>({});

  // Step 3: Settings
  const [productStatus, setProductStatus] = useState('active');
  const [minStockThreshold, setMinStockThreshold] = useState('5');
  const [notes, setNotes] = useState('');

  // Reset form when opening
  const resetForm = useCallback(() => {
    if (product) {
      setSku(product.sku);
      setName(product.name);
      setBrand(product.supplierId || '');
      setCategory(product.category);
      setFit('标准');
      setMaterial('');
      setSeason(product.season);
      setTagPrice(String(product.retailPrice));
      setRetailPrice(String(product.retailPrice));
      setCostPrice(String(product.costPrice));
      setSelectedColors(product.specs.map(s => ({ name: s.color, hex: s.colorHex })));
      const allSizes = new Set<string>();
      product.specs.forEach(s => Object.keys(s.sizes).forEach(sz => allSizes.add(sz)));
      setSelectedSizes(Array.from(allSizes));
      const matrix: Record<string, Record<string, number>> = {};
      product.specs.forEach(s => {
        matrix[s.color] = {};
        Object.entries(s.sizes).forEach(([sz, qty]) => {
          matrix[s.color][sz] = qty;
        });
      });
      setSpecMatrix(matrix);
      setProductStatus(product.status);
      setMinStockThreshold('5');
      setNotes('');
    } else {
      setSku('');
      setName('');
      setBrand('');
      setCategory('上衣');
      setFit('标准');
      setMaterial('');
      setSeason('四季');
      setTagPrice('');
      setRetailPrice('');
      setCostPrice('');
      setSelectedColors([]);
      setSelectedSizes([]);
      setSpecMatrix({});
      setProductStatus('active');
      setMinStockThreshold('5');
      setNotes('');
    }
    setStep(1);
  }, [product]);

  useState(() => {
    if (open) resetForm();
  });

  // Initialize form when opening
  useState(() => {});

  // Use effect to reset on open
  const [initialized, setInitialized] = useState(false);
  if (open && !initialized) {
    setInitialized(true);
    resetForm();
  }
  if (!open && initialized) {
    setInitialized(false);
  }

  const toggleColor = (c: { name: string; hex: string }) => {
    setSelectedColors(prev => {
      const exists = prev.find(x => x.name === c.name);
      if (exists) return prev.filter(x => x.name !== c.name);
      return [...prev, c];
    });
  };

  const toggleSize = (s: string) => {
    setSelectedSizes(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const updateMatrix = (color: string, size: string, qty: number) => {
    setSpecMatrix(prev => ({
      ...prev,
      [color]: { ...prev[color], [size]: Math.max(0, qty) },
    }));
  };

  const canNextStep1 = sku.trim() && name.trim() && retailPrice && costPrice;
  const canNextStep2 = selectedColors.length > 0 && selectedSizes.length > 0;

  const handleSubmit = () => {
    const specs: ProductSpec[] = selectedColors.map(c => ({
      color: c.name,
      colorHex: c.hex,
      sizes: selectedSizes.reduce((acc, sz) => {
        acc[sz] = specMatrix[c.name]?.[sz] || 0;
        return acc;
      }, {} as Record<string, number>),
    }));

    const newProduct: Product = {
      id: product?.id || `p${Date.now()}`,
      sku,
      name,
      category,
      subcategory: category,
      description: '',
      costPrice: Number(costPrice) || 0,
      retailPrice: Number(retailPrice) || 0,
      wholesalePrice: Math.floor((Number(retailPrice) || 0) * 0.7),
      specs,
      images: [],
      status: productStatus as Product['status'],
      createdAt: product?.createdAt || new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
      supplierId: brand || 's1',
      season,
      year: new Date().getFullYear(),
      tags: [category, ...selectedColors.map(c => c.name)],
    };

    onSubmit(newProduct);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-semibold text-[#2D2926]">
            {product ? `编辑商品 — ${product.sku}` : '新增商品'}
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="mb-4 mt-2 flex items-center gap-2">
          {[1, 2, 3].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                step === s ? 'bg-[#D4853C] text-white' : step > s ? 'bg-[#4A9B8E] text-white' : 'bg-[rgba(45,41,38,0.08)] text-[#A39E99]'
              )}>
                {step > s ? <Check className="h-4 w-4" /> : s}
              </div>
              <span className={cn('text-xs', step === s ? 'font-medium text-[#2D2926]' : 'text-[#A39E99]')}>
                {s === 1 ? '基本信息' : s === 2 ? '规格矩阵' : '其他设置'}
              </span>
              {i < 2 && <div className="mx-1 h-px w-8 bg-[rgba(45,41,38,0.12)]" />}
            </div>
          ))}
        </div>

        {/* ---- Step 1: Basic Info ---- */}
        {step === 1 && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-[#2D2926]">款号 (SKU) *</Label>
                <Input value={sku} onChange={e => setSku(e.target.value)} placeholder="如 A1001" className="h-11 rounded-xl border-[rgba(45,41,38,0.12)] font-mono text-sm" />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-[#2D2926]">商品名称 *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="输入商品名称" className="h-11 rounded-xl border-[rgba(45,41,38,0.12)] text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-[#2D2926]">品牌</Label>
                <Input value={brand} onChange={e => setBrand(e.target.value)} placeholder="品牌名称" className="h-11 rounded-xl border-[rgba(45,41,38,0.12)] text-sm" />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-[#2D2926]">分类 *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-11 rounded-xl border-[rgba(45,41,38,0.12)] text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {CATEGORY_OPTIONS.filter(c => c !== '全部').map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-[#2D2926]">版型</Label>
                <Select value={fit} onValueChange={setFit}>
                  <SelectTrigger className="h-11 rounded-xl border-[rgba(45,41,38,0.12)] text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {FIT_OPTIONS.map(f => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-[#2D2926]">季节</Label>
                <Select value={season} onValueChange={setSeason}>
                  <SelectTrigger className="h-11 rounded-xl border-[rgba(45,41,38,0.12)] text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {SEASON_OPTIONS.filter(s => s !== '全部').map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs font-medium text-[#2D2926]">材质</Label>
              <Input value={material} onChange={e => setMaterial(e.target.value)} placeholder="如 棉、涤纶、羊毛" className="h-11 rounded-xl border-[rgba(45,41,38,0.12)] text-sm" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-[#2D2926]">吊牌价</Label>
                <Input value={tagPrice} onChange={e => setTagPrice(e.target.value)} type="number" placeholder="¥" className="h-11 rounded-xl border-[rgba(45,41,38,0.12)] font-mono text-sm" />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-[#2D2926]">售价 *</Label>
                <Input value={retailPrice} onChange={e => setRetailPrice(e.target.value)} type="number" placeholder="¥" className="h-11 rounded-xl border-[rgba(45,41,38,0.12)] font-mono text-sm" />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-[#2D2926]">成本价 *</Label>
                <Input value={costPrice} onChange={e => setCostPrice(e.target.value)} type="number" placeholder="¥" className="h-11 rounded-xl border-[rgba(45,41,38,0.12)] font-mono text-sm" />
              </div>
            </div>
          </div>
        )}

        {/* ---- Step 2: Spec Matrix ---- */}
        {step === 2 && (
          <div className="space-y-5 py-2">
            {/* Color selector */}
            <div>
              <Label className="mb-2 block text-xs font-medium text-[#2D2926]">选择颜色</Label>
              <div className="flex flex-wrap gap-2">
                {PREDEFINED_COLORS.map(c => {
                  const selected = selectedColors.find(sc => sc.name === c.name);
                  return (
                    <button
                      key={c.name}
                      onClick={() => toggleColor(c)}
                      className={cn(
                        'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-all',
                        selected
                          ? 'border-[#D4853C] bg-[rgba(212,133,60,0.08)] text-[#2D2926]'
                          : 'border-[rgba(45,41,38,0.12)] text-[#6B6560] hover:border-[rgba(45,41,38,0.2)]'
                      )}
                    >
                      <span className="inline-block h-3.5 w-3.5 rounded-full border border-[rgba(45,41,38,0.15)]" style={{ backgroundColor: c.hex }} />
                      {c.name}
                      {selected && <Check className="ml-1 h-3 w-3 text-[#D4853C]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size selector */}
            <div>
              <Label className="mb-2 block text-xs font-medium text-[#2D2926]">选择尺码</Label>
              <div className="flex flex-wrap gap-2">
                {SIZE_OPTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => toggleSize(s)}
                    className={cn(
                      'rounded-lg px-4 py-2 text-sm font-medium transition-all',
                      selectedSizes.includes(s)
                        ? 'bg-[#2D2926] text-white'
                        : 'border border-[rgba(45,41,38,0.12)] text-[#6B6560] hover:border-[rgba(45,41,38,0.2)]'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Spec Matrix Table */}
            {selectedColors.length > 0 && selectedSizes.length > 0 && (
              <div>
                <Label className="mb-2 block text-xs font-medium text-[#2D2926]">库存矩阵</Label>
                <div className="overflow-x-auto rounded-xl border border-[rgba(45,41,38,0.08)]">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[rgba(45,41,38,0.08)] bg-[rgba(45,41,38,0.02)]">
                        <th className="px-3 py-2 text-left text-xs font-medium text-[#A39E99]">颜色</th>
                        {selectedSizes.map(s => (
                          <th key={s} className="px-2 py-2 text-center text-xs font-medium text-[#A39E99]">{s}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedColors.map(c => (
                        <tr key={c.name} className="border-b border-[rgba(45,41,38,0.06)] last:border-0">
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: c.hex }} />
                              <span className="text-xs text-[#6B6560]">{c.name}</span>
                            </div>
                          </td>
                          {selectedSizes.map(s => (
                            <td key={s} className="px-2 py-2">
                              <Input
                                type="number"
                                min={0}
                                value={specMatrix[c.name]?.[s] || 0}
                                onChange={e => updateMatrix(c.name, s, parseInt(e.target.value) || 0)}
                                className="h-8 w-16 rounded-lg px-1 text-center font-mono text-xs"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---- Step 3: Settings ---- */}
        {step === 3 && (
          <div className="space-y-5 py-2">
            <div>
              <Label className="mb-2 block text-xs font-medium text-[#2D2926]">商品状态</Label>
              <RadioGroup value={productStatus} onValueChange={setProductStatus} className="flex gap-4">
                {PRODUCT_STATUS_OPTIONS.map(opt => (
                  <div key={opt.value} className="flex items-center">
                    <RadioGroupItem value={opt.value} id={opt.value} className="h-4 w-4 text-[#D4853C]" />
                    <Label htmlFor={opt.value} className="ml-2 cursor-pointer text-sm text-[#6B6560]">{opt.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label className="mb-1.5 block text-xs font-medium text-[#2D2926]">库存预警阈值</Label>
              <Input
                type="number"
                value={minStockThreshold}
                onChange={e => setMinStockThreshold(e.target.value)}
                className="h-11 w-32 rounded-xl border-[rgba(45,41,38,0.12)] font-mono text-sm"
              />
            </div>

            <div>
              <Label className="mb-1.5 block text-xs font-medium text-[#2D2926]">备注</Label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="可选：填写商品备注信息..."
                rows={3}
                className="rounded-xl border-[rgba(45,41,38,0.12)] text-sm"
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <DialogFooter className="mt-4">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="rounded-xl border-[rgba(45,41,38,0.12)] text-sm">
              上一步
            </Button>
          )}
          {step < 3 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 1 ? !canNextStep1 : !canNextStep2}
              className="rounded-xl bg-[#D4853C] text-sm font-semibold text-white hover:bg-[#BF7532] disabled:opacity-50"
            >
              下一步
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="rounded-xl bg-[#D4853C] text-sm font-semibold text-white hover:bg-[#BF7532]">
              {product ? '保存修改' : '保存商品'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
