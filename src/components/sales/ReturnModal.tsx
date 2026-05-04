import { useState, useMemo } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import type { SalesOrder } from '@/types';
import { cn } from '@/lib/utils';

interface ReturnItem {
  productId: string;
  sku: string;
  productName: string;
  color: string;
  size: string;
  unitPrice: number;
  originalQty: number;
  returnQty: number;
  selected: boolean;
}

interface ReturnModalProps {
  order: SalesOrder | null;
  onClose: () => void;
  onConfirm: (items: { productId: string; sku: string; productName: string; color: string; size: string; quantity: number; unitPrice: number; totalPrice: number }[], refundAmount: number, reason: string) => void;
}

const RETURN_REASONS = ['质量问题', '尺码不合', '不喜欢', '其他'];

export default function ReturnModal({ order, onClose, onConfirm }: ReturnModalProps) {
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [reason, setReason] = useState('质量问题');
  const [confirming, setConfirming] = useState(false);

  // Initialize return items from order
  useMemo(() => {
    if (order) {
      setReturnItems(
        order.items.map((item) => ({
          productId: item.productId,
          sku: item.sku,
          productName: item.productName,
          color: item.color,
          size: item.size,
          unitPrice: item.unitPrice,
          originalQty: item.quantity,
          returnQty: item.quantity,
          selected: false,
        }))
      );
    }
  }, [order]);

  if (!order) return null;

  const refundAmount = returnItems
    .filter((item) => item.selected)
    .reduce((sum, item) => sum + item.unitPrice * item.returnQty, 0);

  const selectedCount = returnItems.filter((item) => item.selected).length;

  const toggleItem = (index: number) => {
    setReturnItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item))
    );
  };

  const updateReturnQty = (index: number, qty: number) => {
    setReturnItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, returnQty: Math.max(1, Math.min(item.originalQty, qty)) } : item
      )
    );
  };

  const handleConfirm = () => {
    if (selectedCount === 0) return;
    setConfirming(true);

    const selectedItems = returnItems
      .filter((item) => item.selected)
      .map((item) => ({
        productId: item.productId,
        sku: item.sku,
        productName: item.productName,
        color: item.color,
        size: item.size,
        quantity: item.returnQty,
        unitPrice: item.unitPrice,
        totalPrice: item.unitPrice * item.returnQty,
      }));

    setTimeout(() => {
      onConfirm(selectedItems, refundAmount, reason);
      setConfirming(false);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[rgba(45,41,38,0.40)] backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-[520px] max-h-[85vh] overflow-hidden rounded-[20px] bg-white shadow-[0_20px_60px_rgba(45,41,38,0.15)]"
        style={{ animation: 'modalIn 0.25s cubic-bezier(0.25, 0.1, 0.25, 1)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(45,41,38,0.08)] px-6 py-4">
          <h3 className="text-lg font-semibold text-[#2D2926]">销售退货</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.04)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
          {/* Original Sale Summary */}
          <div className="rounded-xl bg-[#F8F5F2] p-4">
            <div className="flex justify-between text-sm">
              <span className="text-[#A39E99]">原单号</span>
              <span className="font-mono text-[#2D2926]">{order.orderNo}</span>
            </div>
            <div className="mt-1 flex justify-between text-sm">
              <span className="text-[#A39E99]">原单金额</span>
              <span className="font-mono text-[#2D2926]">¥{order.finalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Return Items */}
          <div className="mt-5">
            <h4 className="text-sm font-semibold text-[#2D2926]">选择退货商品</h4>
            <div className="mt-3 space-y-2">
              {returnItems.map((item, index) => (
                <div
                  key={`${item.sku}-${item.color}-${item.size}`}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border p-3 transition-all',
                    item.selected
                      ? 'border-[#D4853C] bg-[rgba(212,133,60,0.06)]'
                      : 'border-[rgba(45,41,38,0.08)]'
                  )}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleItem(index)}
                    className={cn(
                      'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all',
                      item.selected
                        ? 'border-[#D4853C] bg-[#D4853C] text-white'
                        : 'border-[rgba(45,41,38,0.20)]'
                    )}
                  >
                    {item.selected && (
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#2D2926]">{item.productName}</p>
                    <p className="text-xs text-[#A39E99]">
                      {item.color} / {item.size} | 原购 {item.originalQty}件
                    </p>
                  </div>

                  {/* Qty control */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateReturnQty(index, item.returnQty - 1)}
                      disabled={!item.selected || item.returnQty <= 1}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-[rgba(45,41,38,0.12)] text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.04)] disabled:opacity-30"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <span className={cn('min-w-[20px] text-center text-sm', !item.selected && 'text-[#A39E99]')}>
                      {item.returnQty}
                    </span>
                    <button
                      onClick={() => updateReturnQty(index, item.returnQty + 1)}
                      disabled={!item.selected || item.returnQty >= item.originalQty}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-[rgba(45,41,38,0.12)] text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.04)] disabled:opacity-30"
                    >
                      <span className="text-sm">+</span>
                    </button>
                  </div>

                  {/* Price */}
                  <span className="w-16 text-right font-mono text-sm text-[#2D2926]">
                    ¥{item.unitPrice * item.returnQty}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div className="mt-5">
            <label className="text-sm font-semibold text-[#2D2926]">退货原因</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {RETURN_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-sm transition-all',
                    reason === r
                      ? 'bg-[#D4853C] text-white'
                      : 'border border-[rgba(45,41,38,0.12)] text-[#6B6560] hover:border-[#D4853C]'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Refund Info */}
          {selectedCount > 0 && (
            <div className="mt-5 rounded-xl border border-[rgba(74,155,142,0.20)] bg-[rgba(74,155,142,0.06)] p-4">
              <div className="flex items-center gap-2 text-[#4A9B8E]">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">退款金额</span>
              </div>
              <p className="mt-1 font-mono text-2xl font-semibold text-[#4A9B8E]">
                ¥{refundAmount.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-[#6B6560]">将按原支付方式退回</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-[rgba(45,41,38,0.08)] p-5">
          <button
            onClick={onClose}
            className="flex h-11 flex-1 items-center justify-center rounded-xl border border-[rgba(45,41,38,0.12)] text-sm font-medium text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.04)]"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedCount === 0 || confirming}
            className={cn(
              'flex h-11 flex-1 items-center justify-center rounded-xl text-sm font-semibold text-white transition-all',
              selectedCount > 0 && !confirming
                ? 'bg-[#C75C3A] hover:bg-[#b55030] hover:shadow-[0_2px_8px_rgba(199,92,58,0.25)]'
                : 'cursor-not-allowed bg-[#A39E99] opacity-50'
            )}
          >
            {confirming ? '处理中...' : `确认退货 ¥${refundAmount.toLocaleString()}`}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
