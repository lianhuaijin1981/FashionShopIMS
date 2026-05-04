import { X, Printer, RotateCcw } from 'lucide-react';
import type { SalesOrder } from '@/types';
import { cn } from '@/lib/utils';

interface SaleDetailDrawerProps {
  order: SalesOrder | null;
  onClose: () => void;
  onPrint: () => void;
  onReturn: () => void;
  isWithinReturnWindow: boolean;
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: '现金',
  wechat: '微信支付',
  alipay: '支付宝',
  card: '刷卡',
  stored_value: '会员储值',
  mixed: '混合支付',
  refund: '原路退回',
  none: '—',
};

const TYPE_CONFIG: Record<string, { label: string; color: string; border: string }> = {
  completed: { label: '销售', color: 'bg-[rgba(74,155,142,0.10)] text-[#4A9B8E]', border: 'border-l-[3px] border-l-[#4A9B8E]' },
  refunded: { label: '退货', color: 'bg-[rgba(199,92,58,0.10)] text-[#C75C3A]', border: 'border-l-[3px] border-l-[#C75C3A]' },
  partial_refund: { label: '部分退货', color: 'bg-[rgba(212,133,60,0.12)] text-[#D4853C]', border: 'border-l-[3px] border-l-[#D4853C]' },
};

export default function SaleDetailDrawer({
  order,
  onClose,
  onPrint,
  onReturn,
  isWithinReturnWindow,
}: SaleDetailDrawerProps) {
  if (!order) return null;

  const typeConfig = TYPE_CONFIG[order.status] || TYPE_CONFIG.completed;
  const date = new Date(order.createdAt).toLocaleString('zh-CN');

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[60] bg-[rgba(45,41,38,0.40)] backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div
        className="fixed right-0 top-16 bottom-0 z-[61] flex w-full max-w-[480px] flex-col overflow-hidden bg-white shadow-[-8px_0_32px_rgba(45,41,38,0.10)]"
        style={{ animation: 'drawerSlide 0.35s cubic-bezier(0.25, 0.1, 0.25, 1)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(45,41,38,0.08)] px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-base font-semibold text-[#2D2926]">{order.orderNo}</span>
            <span className={cn('rounded-lg px-2 py-0.5 text-xs font-medium', typeConfig.color)}>
              {typeConfig.label}
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.04)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Info Section */}
          <div className="space-y-2 rounded-xl bg-[#F8F5F2] p-4">
            <div className="flex justify-between text-sm">
              <span className="text-[#A39E99]">时间</span>
              <span className="text-[#2D2926]">{date}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#A39E99]">收银员</span>
              <span className="text-[#2D2926]">{order.operator}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#A39E99]">门店</span>
              <span className="text-[#2D2926]">{order.storeName}</span>
            </div>
            {order.memberName && (
              <div className="flex justify-between text-sm">
                <span className="text-[#A39E99]">会员</span>
                <span className="text-[#2D2926]">{order.memberName}</span>
              </div>
            )}
            {!order.memberName && (
              <div className="flex justify-between text-sm">
                <span className="text-[#A39E99]">会员</span>
                <span className="text-[#6B6560]">散客</span>
              </div>
            )}
          </div>

          {/* Product List */}
          <div className="mt-5">
            <h4 className="text-sm font-semibold text-[#2D2926]">商品明细</h4>
            <div className="mt-3 space-y-3">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex gap-3 rounded-xl border border-[rgba(45,41,38,0.08)] p-3"
                >
                  {/* Thumbnail */}
                  <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-[#E9E6E1]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#2D2926]">{item.productName}</p>
                    <p className="text-xs text-[#A39E99]">
                      {item.color} / {item.size}
                    </p>
                    <p className="font-mono text-[11px] text-[#A39E99]">{item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[#2D2926]">
                      {item.quantity} × <span className="font-mono">¥{item.unitPrice}</span>
                    </p>
                    <p className="mt-0.5 font-mono text-sm font-semibold text-[#2D2926]">
                      ¥{item.totalPrice.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="mt-5 rounded-xl border border-[rgba(45,41,38,0.08)] p-4">
            <div className="flex justify-between text-sm">
              <span className="text-[#6B6560]">商品合计</span>
              <span className="font-mono text-[#2D2926]">¥{order.totalAmount.toLocaleString()}</span>
            </div>
            {order.discount > 0 && (
              <div className="mt-1.5 flex justify-between text-sm">
                <span className="text-[#6B6560]">折扣</span>
                <span className="font-mono text-[#4A9B8E]">-¥{order.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="mt-2 flex justify-between border-t border-[rgba(45,41,38,0.08)] pt-2">
              <span className="font-semibold text-[#2D2926]">应收</span>
              <span className="font-mono text-lg font-semibold text-[#2D2926]">
                ¥{order.finalAmount.toLocaleString()}
              </span>
            </div>
            <div className="mt-1.5 flex justify-between text-xs text-[#6B6560]">
              <span>支付方式</span>
              <span>{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</span>
            </div>
            {order.pointsEarned > 0 && (
              <div className="mt-1 flex justify-between text-xs text-[#6B6560]">
                <span>获得积分</span>
                <span className="text-[#4A9B8E]">+{order.pointsEarned}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-[rgba(45,41,38,0.08)] p-5">
          <button
            onClick={onPrint}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#D4853C] text-sm font-semibold text-white transition-all hover:bg-[#BF7532] hover:shadow-[0_2px_8px_rgba(212,133,60,0.30)]"
          >
            <Printer className="h-4 w-4" />
            打印小票
          </button>
          {order.status === 'completed' && isWithinReturnWindow && (
            <button
              onClick={onReturn}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[rgba(199,92,58,0.30)] text-sm font-semibold text-[#C75C3A] transition-all hover:bg-[rgba(199,92,58,0.08)] hover:shadow-[0_0_8px_rgba(199,92,58,0.15)]"
            >
              <RotateCcw className="h-4 w-4" />
              退货
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes drawerSlide {
          from { transform: translateX(100%); opacity: 0.8; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}
