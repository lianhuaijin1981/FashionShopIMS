import { useState, useMemo, useCallback } from 'react';
import { Download, BarChart3, ChevronLeft, ChevronRight, Receipt } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { SalesOrder } from '@/types';
import { cn } from '@/lib/utils';
import FilterBar from '@/components/sales/FilterBar';
import SaleDetailDrawer from '@/components/sales/SaleDetailDrawer';
import ReturnModal from '@/components/sales/ReturnModal';
import SalesSummary from '@/components/sales/SalesSummary';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

const PAYMENT_ICONS: Record<string, string> = {
  cash: '💵',
  wechat: '💬',
  alipay: '🔷',
  card: '💳',
  stored_value: '👤',
  mixed: '🔀',
  refund: '↩️',
  none: '—',
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: '现金',
  wechat: '微信',
  alipay: '支付宝',
  card: '刷卡',
  stored_value: '储值',
  mixed: '混合',
  refund: '退款',
  none: '—',
};

const TYPE_BADGE: Record<string, { label: string; class: string; prefix: string }> = {
  completed: { label: '销售', class: 'bg-[rgba(74,155,142,0.10)] text-[#4A9B8E]', prefix: 'XS' },
  refunded: { label: '退货', class: 'bg-[rgba(199,92,58,0.10)] text-[#C75C3A]', prefix: 'TH' },
  partial_refund: { label: '部分退', class: 'bg-[rgba(212,133,60,0.12)] text-[#D4853C]', prefix: 'PT' },
};

const PAGE_SIZE = 15;

export default function Sales() {
  const { state, dispatch } = useApp();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('today');
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [cashier, setCashier] = useState('all');
  const [orderType, setOrderType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // UI state
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  // Get unique cashiers
  const cashiers = useMemo(() => {
    const set = new Set<string>();
    state.sales.forEach((s) => set.add(s.operator));
    return Array.from(set);
  }, [state.sales]);

  // Filter sales
  const filteredSales = useMemo(() => {
    let sales = [...state.sales];

    // Date range filter
    const now = new Date('2025-04-02'); // Use mock data date
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (dateRange === 'today') {
      sales = sales.filter((s) => new Date(s.createdAt) >= today);
    } else if (dateRange === 'yesterday') {
      const yest = new Date(today);
      yest.setDate(yest.getDate() - 1);
      sales = sales.filter((s) => {
        const d = new Date(s.createdAt);
        return d >= yest && d < today;
      });
    } else if (dateRange === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      sales = sales.filter((s) => new Date(s.createdAt) >= weekAgo);
    } else if (dateRange === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      sales = sales.filter((s) => new Date(s.createdAt) >= monthAgo);
    }

    // Payment method filter
    if (paymentMethod !== 'all') {
      sales = sales.filter((s) => s.paymentMethod === paymentMethod);
    }

    // Cashier filter
    if (cashier !== 'all') {
      sales = sales.filter((s) => s.operator === cashier);
    }

    // Order type filter
    if (orderType !== 'all') {
      const typeMap: Record<string, string> = {
        sale: 'completed',
        return: 'refunded',
        exchange: 'partial_refund',
      };
      sales = sales.filter((s) => s.status === typeMap[orderType]);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      sales = sales.filter(
        (s) =>
          s.orderNo.toLowerCase().includes(q) ||
          s.items.some((i) =>
            i.productName.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)
          )
      );
    }

    return sales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [state.sales, dateRange, paymentMethod, cashier, orderType, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredSales.length / PAGE_SIZE);
  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredSales.slice(start, start + PAGE_SIZE);
  }, [filteredSales, currentPage]);

  // Summary stats
  const todayTotal = filteredSales
    .filter((s) => s.status === 'completed')
    .reduce((sum, s) => sum + s.finalAmount, 0);
  const todayCount = filteredSales.filter((s) => s.status === 'completed').length;

  // Handlers
  const handleRefresh = useCallback(() => {
    addToast('数据已刷新', 'success');
  }, [addToast]);

  const handleRowClick = useCallback((order: SalesOrder) => {
    setSelectedOrder(order);
    setShowDetail(true);
  }, []);

  const handleReturn = useCallback(() => {
    setShowDetail(false);
    setShowReturnModal(true);
  }, []);

  const handleConfirmReturn = useCallback(
    (
      items: {
        productId: string;
        sku: string;
        productName: string;
        color: string;
        size: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
      }[],
      refundAmount: number,
      reason: string
    ) => {
      if (!selectedOrder) return;

      // Create return order
      const returnOrderNo = `TH${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(Math.floor(Math.random() * 900) + 100)}`;

      const returnOrder: SalesOrder = {
        ...selectedOrder,
        id: `return-${Date.now()}`,
        orderNo: returnOrderNo,
        items,
        totalAmount: refundAmount,
        totalQuantity: items.reduce((s, i) => s + i.quantity, 0),
        finalAmount: -refundAmount,
        paymentMethod: 'refund' as 'cash',
        status: 'refunded',
        notes: `退货原因: ${reason}, 原单: ${selectedOrder.orderNo}`,
        createdAt: new Date().toISOString(),
      };

      dispatch({ type: 'ADD_SALE', payload: returnOrder });

      // Restore inventory
      items.forEach((item) => {
        const invItem = state.inventory.find(
          (inv) => inv.productId === item.productId && inv.color === item.color && inv.size === item.size
        );
        if (invItem) {
          dispatch({
            type: 'UPDATE_INVENTORY',
            payload: { ...invItem, quantity: invItem.quantity + item.quantity },
          });
        }
      });

      // Update original order status
      dispatch({
        type: 'UPDATE_SALE',
        payload: { ...selectedOrder, status: 'refunded' as const },
      });

      setShowReturnModal(false);
      setSelectedOrder(null);
      addToast(`退货成功，退款金额: ¥${refundAmount.toLocaleString()}`, 'success');
    },
    [selectedOrder, state.inventory, dispatch, addToast]
  );

  const isWithinReturnWindow = useCallback((order: SalesOrder) => {
    const orderDate = new Date(order.createdAt);
    const now = new Date('2025-04-02');
    const diffDays = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  }, []);

  const handleExport = useCallback(() => {
    // Simulate CSV export
    const headers = ['订单编号', '时间', '商品数量', '金额', '支付方式', '收银员'];
    const rows = filteredSales.map((s) => [
      s.orderNo,
      new Date(s.createdAt).toLocaleString('zh-CN'),
      s.totalQuantity,
      s.finalAmount,
      PAYMENT_LABELS[s.paymentMethod] || s.paymentMethod,
      s.operator,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `销售记录_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    addToast('报表已导出', 'success');
  }, [filteredSales, addToast]);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#2D2926]">销售记录</h1>
          <p className="mt-1 text-xs text-[#A39E99]">查看所有销售、退货和换货记录</p>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={(val) => { setSearchQuery(val); setCurrentPage(1); }}
        dateRange={dateRange}
        onDateRangeChange={(val) => { setDateRange(val); setCurrentPage(1); }}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={(val) => { setPaymentMethod(val); setCurrentPage(1); }}
        cashier={cashier}
        onCashierChange={(val) => { setCashier(val); setCurrentPage(1); }}
        orderType={orderType}
        onOrderTypeChange={(val) => { setOrderType(val); setCurrentPage(1); }}
        cashiers={cashiers}
        onRefresh={handleRefresh}
      />

      {/* Action Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex h-10 items-center gap-2 rounded-xl border border-[rgba(45,41,38,0.12)] px-4 text-sm font-medium text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.04)]"
          >
            <Download className="h-4 w-4" />
            导出报表
          </button>
          <button
            onClick={() => setShowSummary(true)}
            className="flex h-10 items-center gap-2 rounded-xl border border-[rgba(45,41,38,0.12)] px-4 text-sm font-medium text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.04)]"
          >
            <BarChart3 className="h-4 w-4" />
            销售汇总
          </button>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm font-semibold text-[#D4853C]">
            ¥{todayTotal.toLocaleString()}
          </span>
          <span className="text-xs text-[#6B6560]">{todayCount} 笔</span>
        </div>
      </div>

      {/* Sales Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(45,41,38,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[rgba(45,41,38,0.08)]">
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">
                  单号
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">
                  时间
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">
                  类型
                </th>
                <th className="px-4 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">
                  商品数
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">
                  金额
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">
                  支付方式
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">
                  会员
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">
                  收银员
                </th>
                <th className="px-4 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(45,41,38,0.08)]">
              {paginatedSales.map((order, idx) => {
                const typeInfo = TYPE_BADGE[order.status] || TYPE_BADGE.completed;
                const time = new Date(order.createdAt).toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                });
                const isReturn = order.status === 'refunded';
                const isPartial = order.status === 'partial_refund';

                return (
                  <tr
                    key={order.id}
                    onClick={() => handleRowClick(order)}
                    className={cn(
                      'cursor-pointer transition-colors hover:bg-[rgba(45,41,38,0.03)]',
                      isReturn && 'border-l-[3px] border-l-[#C75C3A]',
                      isPartial && 'border-l-[3px] border-l-[#D4853C]'
                    )}
                    style={{
                      animation: `rowIn 0.3s ease forwards`,
                      animationDelay: `${idx * 0.03}s`,
                      opacity: 0,
                    }}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-[13px] text-[#2D2926]">{order.orderNo}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#6B6560]">{time}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-lg px-2 py-0.5 text-[11px] font-medium',
                          typeInfo.class
                        )}
                      >
                        {typeInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-[#2D2926]">
                      {order.totalQuantity}件
                    </td>
                    <td className={cn(
                      'px-4 py-3 text-right font-mono text-sm font-semibold',
                      isReturn ? 'text-[#C75C3A]' : 'text-[#2D2926]'
                    )}>
                      {isReturn && '-'}
                      {order.status === 'partial_refund' ? '¥0' : `¥${order.finalAmount.toLocaleString()}`}
                      {order.status === 'partial_refund' && (
                        <span className="ml-1 text-xs text-[#A39E99]">(换货)</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs text-[#6B6560]">
                        <span>{PAYMENT_ICONS[order.paymentMethod] || '💵'}</span>
                        <span>{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#6B6560]">
                      {order.memberName || '散客'}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#6B6560]">{order.operator}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(order);
                        }}
                        className="rounded-lg px-2 py-1 text-xs text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.04)] hover:text-[#2D2926]"
                      >
                        查看
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {paginatedSales.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <Receipt className="h-12 w-12 text-[#A39E99] opacity-40" />
            <p className="mt-4 text-sm text-[#A39E99]">暂无销售记录</p>
            <p className="mt-1 text-xs text-[#A39E99]">尝试调整筛选条件</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[rgba(45,41,38,0.08)] px-4 py-3">
            <span className="text-xs text-[#A39E99]">
              共 {filteredSales.length} 笔 | 第 {currentPage}/{totalPages} 页
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(45,41,38,0.12)] text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.04)] disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors',
                      currentPage === pageNum
                        ? 'bg-[#D4853C] text-white'
                        : 'text-[#6B6560] hover:bg-[rgba(45,41,38,0.04)]'
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(45,41,38,0.12)] text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.04)] disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      {showDetail && selectedOrder && (
        <SaleDetailDrawer
          order={selectedOrder}
          onClose={() => { setShowDetail(false); setSelectedOrder(null); }}
          onPrint={() => addToast('打印指令已发送', 'success')}
          onReturn={handleReturn}
          isWithinReturnWindow={isWithinReturnWindow(selectedOrder)}
        />
      )}

      {/* Return Modal */}
      {showReturnModal && selectedOrder && (
        <ReturnModal
          order={selectedOrder}
          onClose={() => setShowReturnModal(false)}
          onConfirm={handleConfirmReturn}
        />
      )}

      {/* Summary Modal */}
      {showSummary && (
        <SalesSummary
          orders={filteredSales}
          onClose={() => setShowSummary(false)}
        />
      )}

      {/* Toasts */}
      <div className="fixed right-6 bottom-6 z-[80] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-[0_8px_24px_rgba(45,41,38,0.15)]',
              toast.type === 'success' ? 'bg-[#4A9B8E]' : 'bg-[#C75C3A]',
              'animate-toastIn'
            )}
          >
            {toast.type === 'success' ? (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            )}
            {toast.message}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes rowIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes toastIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-toastIn {
          animation: toastIn 0.3s ease forwards;
        }
      `}</style>
    </div>
  );
}
