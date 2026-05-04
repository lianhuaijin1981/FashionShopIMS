import { Printer, Plus } from 'lucide-react';
import type { CartItem } from './CartPanel';

interface ReceiptModalProps {
  orderNo: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  discountType: 'percent' | 'amount';
  total: number;
  paymentMethod: string;
  cashier: string;
  storeName: string;
  createdAt: string;
  onClose: () => void;
  onPrint: () => void;
}

const PAYMENT_LABELS: Record<string, string> = {
  wechat: '微信支付',
  alipay: '支付宝',
  cash: '现金',
  card: '刷卡',
  stored_value: '会员储值',
};

export default function ReceiptModal({
  orderNo,
  items,
  subtotal,
  discount,
  discountType,
  total,
  paymentMethod,
  cashier,
  storeName,
  createdAt,
  onClose,
  onPrint,
}: ReceiptModalProps) {
  const discountAmount = discountType === 'percent' ? Math.round(subtotal * (discount / 100)) : discount;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[rgba(45,41,38,0.40)] backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-[400px] overflow-hidden rounded-[20px] bg-white shadow-[0_20px_60px_rgba(45,41,38,0.15)]"
        style={{ animation: 'receiptSlideUp 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)' }}
      >
        {/* Receipt Content */}
        <div className="p-6">
          {/* Store Info */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-[#2D2926]">{storeName}</h3>
            <p className="mt-1 text-xs text-[#A39E99]">销售小票</p>
          </div>

          {/* Order Info */}
          <div className="mt-4 border-t border-dashed border-[rgba(45,41,38,0.15)] pt-4">
            <div className="flex justify-between text-xs text-[#6B6560]">
              <span>单号</span>
              <span className="font-mono">{orderNo}</span>
            </div>
            <div className="mt-1 flex justify-between text-xs text-[#6B6560]">
              <span>时间</span>
              <span>{createdAt}</span>
            </div>
            <div className="mt-1 flex justify-between text-xs text-[#6B6560]">
              <span>收银员</span>
              <span>{cashier}</span>
            </div>
          </div>

          {/* Items */}
          <div className="mt-4 border-t border-dashed border-[rgba(45,41,38,0.15)] pt-4">
            <div className="flex justify-between text-xs text-[#A39E99]">
              <span className="flex-1">商品</span>
              <span className="w-10 text-center">数量</span>
              <span className="w-16 text-right">金额</span>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="mt-2 flex justify-between text-sm">
                <div className="flex-1">
                  <p className="font-medium text-[#2D2926]">{item.name}</p>
                  <p className="text-xs text-[#A39E99]">
                    {item.color} / {item.size}
                  </p>
                </div>
                <span className="w-10 text-center text-[#6B6560]">{item.qty}</span>
                <span className="w-16 text-right font-mono text-[#2D2926]">
                  ¥{(item.price * item.qty).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-4 border-t border-dashed border-[rgba(45,41,38,0.15)] pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-[#6B6560]">小计</span>
              <span className="font-mono text-[#2D2926]">¥{subtotal.toLocaleString()}</span>
            </div>
            {discountAmount > 0 && (
              <div className="mt-1 flex justify-between text-sm">
                <span className="text-[#6B6560]">折扣</span>
                <span className="font-mono text-[#4A9B8E]">
                  -¥{discountAmount.toLocaleString()}
                  {discountType === 'percent' && ` (${discount}%)`}
                </span>
              </div>
            )}
            <div className="mt-2 flex justify-between border-t border-[rgba(45,41,38,0.08)] pt-2">
              <span className="font-semibold text-[#2D2926]">合计</span>
              <span className="font-mono text-lg font-semibold text-[#2D2926]">
                ¥{total.toLocaleString()}
              </span>
            </div>
            <div className="mt-2 flex justify-between text-xs text-[#6B6560]">
              <span>支付方式</span>
              <span>{PAYMENT_LABELS[paymentMethod] || paymentMethod}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 border-t border-dashed border-[rgba(45,41,38,0.15)] pt-4 text-center">
            <p className="text-xs text-[#A39E99]">谢谢惠顾，欢迎下次光临</p>
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
          <button
            onClick={onClose}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[rgba(45,41,38,0.12)] text-sm font-medium text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.04)]"
          >
            <Plus className="h-4 w-4 rotate-45" />
            继续收银
          </button>
        </div>
      </div>

      <style>{`
        @keyframes receiptSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
