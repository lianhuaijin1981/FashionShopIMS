import { useState } from 'react';
import { Minus, Plus, Trash2, X, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  color: string;
  colorHex: string;
  size: string;
  price: number;
  qty: number;
}

interface CartPanelProps {
  items: CartItem[];
  onUpdateQty: (index: number, qty: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  discount: number;
  onDiscountChange: (val: number) => void;
  discountType: 'percent' | 'amount';
  onDiscountTypeChange: (type: 'percent' | 'amount') => void;
  paymentMethod: string;
  onPaymentMethodChange: (method: string) => void;
  onCheckout: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
  checkoutSuccess: boolean;
}

const PAYMENT_METHODS = [
  { key: 'wechat', label: '微信支付', icon: '💬', color: '#4A9B8E' },
  { key: 'alipay', label: '支付宝', icon: '🔷', color: '#3b6ea5' },
  { key: 'cash', label: '现金', icon: '💵', color: '#D4853C' },
  { key: 'card', label: '刷卡', icon: '💳', color: '#6B6560' },
  { key: 'stored_value', label: '会员储值', icon: '👤', color: '#722f37' },
];

export default function CartPanel({
  items,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  discount,
  onDiscountChange,
  discountType,
  onDiscountTypeChange,
  paymentMethod,
  onPaymentMethodChange,
  onCheckout,
  isMobileOpen,
  onMobileClose,
  checkoutSuccess,
}: CartPanelProps) {
  const [discountInput, setDiscountInput] = useState('');
  const [cashTendered, setCashTendered] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discountAmount = discountType === 'percent' ? Math.round(subtotal * (discount / 100)) : discount;
  const total = Math.max(0, subtotal - discountAmount);
  const change = paymentMethod === 'cash' && cashTendered ? Math.max(0, parseFloat(cashTendered) - total) : 0;

  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);

  const handleApplyDiscount = () => {
    const val = parseFloat(discountInput);
    if (!isNaN(val) && val >= 0) {
      onDiscountChange(val);
    }
  };

  const handleClear = () => {
    if (showClearConfirm) {
      onClearCart();
      setShowClearConfirm(false);
    } else {
      setShowClearConfirm(true);
      setTimeout(() => setShowClearConfirm(false), 2000);
    }
  };

  return (
    <>
      {/* Desktop overlay for mobile */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 bg-[rgba(45,41,38,0.40)] backdrop-blur-sm lg:hidden" onClick={onMobileClose} />
      )}

      <aside
        className={cn(
          'fixed right-0 top-16 bottom-0 z-50 flex w-full max-w-[420px] flex-col border-l border-[rgba(45,41,38,0.08)] bg-white shadow-[-4px_0_24px_rgba(45,41,38,0.06)] transition-transform duration-300 lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        )}
        style={{ maxWidth: '100vw' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(45,41,38,0.08)] px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-[#2D2926]">购物车</h2>
            <span className="text-xs text-[#A39E99]">{itemCount}件</span>
          </div>
          <div className="flex items-center gap-1">
            {items.length > 0 && (
              <button
                onClick={handleClear}
                className={cn(
                  'rounded-lg px-2 py-1 text-xs font-medium transition-all',
                  showClearConfirm
                    ? 'bg-[rgba(199,92,58,0.10)] text-[#C75C3A]'
                    : 'text-[#C75C3A] hover:bg-[rgba(199,92,58,0.08)]'
                )}
              >
                {showClearConfirm ? '确认清空?' : '清空'}
              </button>
            )}
            <button
              onClick={onMobileClose}
              className="rounded-lg p-1.5 text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.04)] lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <ShoppingCart className="h-12 w-12 text-[#A39E99] opacity-40" />
              <p className="mt-4 text-sm text-[#A39E99]">购物车为空</p>
              <p className="mt-1 text-xs text-[#A39E99]">请点击左侧商品添加</p>
            </div>
          ) : (
            <div className="divide-y divide-[rgba(45,41,38,0.08)]">
              {items.map((item, index) => (
                <div key={`${item.productId}-${item.color}-${item.size}`} className="flex gap-3 py-3.5">
                  {/* Thumbnail */}
                  <div
                    className="h-12 w-12 flex-shrink-0 rounded-lg border border-[rgba(45,41,38,0.08)]"
                    style={{ backgroundColor: item.colorHex || '#E9E6E1' }}
                  />
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#2D2926]">{item.name}</p>
                    <p className="text-xs text-[#A39E99]">
                      {item.color} / {item.size}
                    </p>
                    <p className="font-mono text-[11px] text-[#A39E99]">{item.sku}</p>
                  </div>
                  {/* Price & Qty */}
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="font-mono text-sm font-medium text-[#D4853C]">
                      ¥{item.price}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onUpdateQty(index, item.qty - 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-md bg-[#E9E6E1] text-[#6B6560] transition-colors hover:bg-[#D4853C] hover:text-white"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="min-w-[20px] text-center text-sm font-medium text-[#2D2926]">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => onUpdateQty(index, item.qty + 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-md bg-[#E9E6E1] text-[#6B6560] transition-colors hover:bg-[#D4853C] hover:text-white"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="font-mono text-xs text-[#2D2926]">
                      ¥{item.price * item.qty}
                    </span>
                  </div>
                  {/* Delete */}
                  <button
                    onClick={() => onRemoveItem(index)}
                    className="ml-1 flex h-6 w-6 items-center justify-center self-center rounded-md text-[#A39E99] opacity-0 transition-all hover:bg-[rgba(199,92,58,0.08)] hover:text-[#C75C3A] group-hover:opacity-100"
                    style={{ opacity: 1 }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Discount Section */}
        <div className="border-t border-[rgba(45,41,38,0.08)] px-5 py-3">
          <div className="flex gap-2">
            <div className="flex flex-1 gap-1">
              <input
                type="number"
                placeholder={discountType === 'percent' ? '折扣 %' : '减免金额'}
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                className="h-9 flex-1 rounded-lg border border-[rgba(45,41,38,0.12)] bg-white px-3 text-sm text-[#2D2926] placeholder:text-[#A39E99] focus:border-[#D4853C] focus:shadow-[0_0_0_3px_rgba(212,133,60,0.12)] focus:outline-none"
              />
              <select
                value={discountType}
                onChange={(e) => onDiscountTypeChange(e.target.value as 'percent' | 'amount')}
                className="h-9 rounded-lg border border-[rgba(45,41,38,0.12)] bg-white px-2 text-xs text-[#6B6560] focus:border-[#D4853C] focus:outline-none"
              >
                <option value="percent">%</option>
                <option value="amount">¥</option>
              </select>
            </div>
            <button
              onClick={handleApplyDiscount}
              className="h-9 rounded-lg border border-[rgba(45,41,38,0.12)] px-3 text-xs font-medium text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.04)]"
            >
              应用
            </button>
          </div>
          {discount > 0 && (
            <div className="mt-1.5 flex items-center justify-between text-xs">
              <span className="text-[#6B6560]">
                已应用: {discountType === 'percent' ? `${discount}%` : `¥${discount}`}
              </span>
              <button
                onClick={() => { onDiscountChange(0); setDiscountInput(''); }}
                className="text-[#C75C3A] hover:underline"
              >
                取消
              </button>
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="border-t border-[rgba(45,41,38,0.08)] px-5 py-3">
          <div className="flex justify-between text-sm">
            <span className="text-[#6B6560]">小计</span>
            <span className="font-mono text-[#2D2926]">¥{subtotal.toLocaleString()}</span>
          </div>
          {discountAmount > 0 && (
            <div className="mt-1 flex justify-between text-sm">
              <span className="text-[#6B6560]">折扣</span>
              <span className="font-mono text-[#4A9B8E]">-¥{discountAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="my-2 h-px bg-[rgba(45,41,38,0.08)]" />
          <div className="flex justify-between">
            <span className="font-semibold text-[#2D2926]">应收合计</span>
            <span className="font-mono text-2xl font-semibold text-[#2D2926]">
              ¥{total.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="px-5 pb-3">
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.key}
                onClick={() => onPaymentMethodChange(method.key)}
                className={cn(
                  'flex h-11 items-center justify-center gap-1.5 rounded-xl border-[1.5px] text-xs font-medium transition-all duration-200',
                  paymentMethod === method.key
                    ? 'border-[#D4853C] bg-[rgba(212,133,60,0.12)] text-[#D4853C] shadow-[0_0_0_3px_rgba(212,133,60,0.12)]'
                    : 'border-[rgba(45,41,38,0.12)] bg-white text-[#6B6560] hover:border-[rgba(45,41,38,0.20)]'
                )}
              >
                <span className="text-base">{method.icon}</span>
                <span>{method.label}</span>
                {paymentMethod === method.key && (
                  <svg className="ml-0.5 h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {/* Cash tendered input */}
          {paymentMethod === 'cash' && (
            <div className="mt-2">
              <input
                type="number"
                placeholder="实收金额"
                value={cashTendered}
                onChange={(e) => setCashTendered(e.target.value)}
                className="h-10 w-full rounded-lg border border-[rgba(45,41,38,0.12)] bg-white px-3 text-sm text-[#2D2926] placeholder:text-[#A39E99] focus:border-[#D4853C] focus:shadow-[0_0_0_3px_rgba(212,133,60,0.12)] focus:outline-none"
              />
              {change > 0 && (
                <p className="mt-1 text-right text-sm text-[#6B6560]">
                  找零: <span className="font-mono font-medium text-[#4A9B8E]">¥{change.toFixed(2)}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Checkout Button */}
        <div className="px-5 pb-5">
          <button
            onClick={onCheckout}
            disabled={items.length === 0 || !paymentMethod || checkoutSuccess}
            className={cn(
              'flex h-[52px] w-full items-center justify-center rounded-xl text-base font-semibold text-white transition-all duration-300',
              checkoutSuccess
                ? 'bg-[#4A9B8E]'
                : items.length === 0 || !paymentMethod
                ? 'cursor-not-allowed bg-[#A39E99] opacity-50'
                : 'bg-[#D4853C] hover:bg-[#BF7532] hover:shadow-[0_4px_16px_rgba(212,133,60,0.35)] active:translate-y-0'
            )}
          >
            {checkoutSuccess ? (
              <span className="flex items-center gap-2">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                收款成功
              </span>
            ) : (
              <>确认收款 ¥{total.toLocaleString()}</>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
