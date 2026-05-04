import { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, ShoppingCart, Plus } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { Product } from '@/types';
import { cn } from '@/lib/utils';
import CartPanel, { type CartItem } from '@/components/pos/CartPanel';
import SizeColorModal from '@/components/pos/SizeColorModal';
import ReceiptModal from '@/components/pos/ReceiptModal';

const CATEGORIES = ['全部', '上衣', '裤装', '裙装', '外套', '配饰'];

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

export default function Pos() {
  const { state, dispatch } = useApp();

  // Search & filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('全部');

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [paymentMethod, setPaymentMethod] = useState('wechat');

  // UI state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showSizeColorModal, setShowSizeColorModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [lastOrderNo, setLastOrderNo] = useState('');

  // Live clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  // Filter products
  const filteredProducts = useMemo(() => {
    let products = state.products.filter(p => p.status === 'active');

    if (activeCategory !== '全部') {
      products = products.filter(p => p.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      products = products.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    return products;
  }, [state.products, activeCategory, searchQuery]);

  // Cart actions
  const handleAddToCart = useCallback(
    (product: Product, color: string, colorHex: string, size: string, qty: number) => {
      setCartItems(prev => {
        const existingIndex = prev.findIndex(
          item => item.productId === product.id && item.color === color && item.size === size
        );
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            qty: updated[existingIndex].qty + qty,
          };
          return updated;
        }
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            color,
            colorHex,
            size,
            price: product.retailPrice,
            qty,
          },
        ];
      });
      addToast(`已添加: ${product.name} ${color}/${size} ×${qty}`);
    },
    [addToast]
  );

  const handleQuickAdd = useCallback(
    (product: Product) => {
      // Quick add with first color and first size
      const spec = product.specs[0];
      if (!spec) return;
      const sizes = Object.keys(spec.sizes).filter(s => spec.sizes[s] > 0);
      if (sizes.length === 0) return;
      handleAddToCart(product, spec.color, spec.colorHex, sizes[0], 1);
    },
    [handleAddToCart]
  );

  const handleUpdateQty = useCallback((index: number, qty: number) => {
    if (qty <= 0) {
      setCartItems(prev => prev.filter((_, i) => i !== index));
    } else {
      setCartItems(prev => prev.map((item, i) => (i === index ? { ...item, qty } : item)));
    }
  }, []);

  const handleRemoveItem = useCallback((index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleClearCart = useCallback(() => {
    setCartItems([]);
    setDiscount(0);
    setPaymentMethod('wechat');
  }, []);

  // Checkout
  const handleCheckout = useCallback(() => {
    if (cartItems.length === 0 || !paymentMethod) return;

    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    const discountAmount = discountType === 'percent' ? Math.round(subtotal * (discount / 100)) : discount;
    const total = Math.max(0, subtotal - discountAmount);

    const orderNo = `XS${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(Math.floor(Math.random() * 900) + 100)}`;
    setLastOrderNo(orderNo);

    // Create sales order
    const salesOrder = {
      id: `sale-${Date.now()}`,
      orderNo,
      items: cartItems.map(item => ({
        productId: item.productId,
        sku: item.sku,
        productName: item.name,
        color: item.color,
        size: item.size,
        quantity: item.qty,
        unitPrice: item.price,
        totalPrice: item.price * item.qty,
      })),
      totalAmount: subtotal,
      totalQuantity: cartItems.reduce((sum, item) => sum + item.qty, 0),
      discount: discountAmount,
      finalAmount: total,
      paymentMethod: paymentMethod as 'cash' | 'wechat' | 'alipay' | 'card' | 'stored_value',
      pointsEarned: Math.floor(total * 0.1),
      pointsUsed: 0,
      status: 'completed' as const,
      storeId: state.currentStore?.id || 'HQ',
      storeName: state.currentStore?.name || '总店',
      operator: state.user?.name || '系统',
      createdAt: new Date().toISOString(),
      notes: '',
    };

    dispatch({ type: 'ADD_SALE', payload: salesOrder });

    // Update inventory
    cartItems.forEach(item => {
      const invItem = state.inventory.find(
        inv => inv.productId === item.productId && inv.color === item.color && inv.size === item.size
      );
      if (invItem) {
        dispatch({
          type: 'UPDATE_INVENTORY',
          payload: { ...invItem, quantity: Math.max(0, invItem.quantity - item.qty) },
        });
      }
    });

    setCheckoutSuccess(true);
    addToast(`收银成功 ¥${total.toLocaleString()}`, 'success');

    setTimeout(() => {
      setShowReceipt(true);
      setCheckoutSuccess(false);
    }, 800);
  }, [cartItems, paymentMethod, discount, discountType, state, dispatch, addToast]);

  const handleReceiptClose = useCallback(() => {
    setShowReceipt(false);
    setCartItems([]);
    setDiscount(0);
    setPaymentMethod('wechat');
  }, []);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discountAmount = discountType === 'percent' ? Math.round(subtotal * (discount / 100)) : discount;
  const total = Math.max(0, subtotal - discountAmount);

  return (
    <div className="relative flex h-[calc(100dvh-64px)] flex-col overflow-hidden bg-[#F8F5F2]">
      {/* POS Header */}
      <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-[rgba(45,41,38,0.08)] bg-white px-6">
        <div className="flex items-center gap-3">
          <span className="font-display text-base font-bold text-[#D4853C]">StyleStock</span>
          <span className="rounded-md bg-[rgba(212,133,60,0.12)] px-2 py-0.5 text-[11px] font-medium text-[#D4853C]">
            前台收银
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#6B6560]">
            收银员: <span className="font-medium text-[#2D2926]">{state.user?.name || '系统'}</span>
          </span>
          <span className="text-xs text-[#A39E99]">{state.currentStore?.name || '总店'}</span>
        </div>
        <span className="font-mono text-base text-[#2D2926]">
          {currentTime.toLocaleTimeString('zh-CN', { hour12: false })}
        </span>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Product Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 lg:pr-[436px]">
          {/* Search Bar */}
          <div className="sticky top-0 z-10 bg-[#F8F5F2] pb-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#A39E99]" />
              <input
                type="text"
                placeholder="搜索款号、商品名称或扫码..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full rounded-xl border border-[rgba(45,41,38,0.12)] bg-white py-0 pl-10 pr-4 text-sm text-[#2D2926] transition-all placeholder:text-[#A39E99] focus:border-[#D4853C] focus:shadow-[0_0_0_3px_rgba(212,133,60,0.12)] focus:outline-none"
              />
            </div>

            {/* Category Filter */}
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    'flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200',
                    activeCategory === cat
                      ? 'bg-[#D4853C] text-white'
                      : 'border border-[rgba(45,41,38,0.12)] bg-[rgba(45,41,38,0.06)] text-[#6B6560] hover:border-[rgba(45,41,38,0.20)]'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div
            className="grid gap-4 pb-8"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}
          >
            {filteredProducts.map((product) => {
              const colorsToShow = product.specs.slice(0, 3);

              return (
                <div
                  key={product.id}
                  className="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(45,41,38,0.06)] transition-all duration-300 hover:translate-y-[-3px] hover:shadow-[0_6px_20px_rgba(45,41,38,0.10)]"
                  onClick={() => {
                    setSelectedProduct(product);
                    setShowSizeColorModal(true);
                  }}
                >
                  {/* Image Area */}
                  <div className="relative aspect-square overflow-hidden bg-[#E9E6E1]">
                    <div className="flex h-full w-full items-center justify-center">
                      <svg
                        className="h-10 w-10 text-[#A39E99] opacity-40 transition-transform duration-300 group-hover:scale-105"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                      >
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 01-8 0" />
                      </svg>
                    </div>
                    {/* Quick Add Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickAdd(product);
                      }}
                      className="absolute right-2 bottom-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#D4853C] text-white opacity-0 shadow-md transition-all duration-200 hover:bg-[#BF7532] hover:scale-105 group-hover:opacity-100"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Info Area */}
                  <div className="p-3">
                    <p className="truncate text-sm font-medium text-[#2D2926]">{product.name}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-[#A39E99]">{product.sku}</p>

                    {/* Color swatches */}
                    {colorsToShow.length > 0 && (
                      <div className="mt-1.5 flex gap-1">
                        {colorsToShow.map((c) => (
                          <span
                            key={c.color}
                            className="h-2 w-2 rounded-full border border-[rgba(0,0,0,0.1)]"
                            style={{ backgroundColor: c.colorHex }}
                            title={c.color}
                          />
                        ))}
                        {product.specs.length > 3 && (
                          <span className="text-[9px] text-[#A39E99]">+{product.specs.length - 3}</span>
                        )}
                      </div>
                    )}

                    {/* Price */}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-mono text-base font-semibold text-[#D4853C]">
                        ¥{product.retailPrice}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <svg
                className="h-12 w-12 text-[#A39E99] opacity-40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              >
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              <p className="mt-4 text-sm text-[#A39E99]">暂无商品</p>
              <p className="mt-1 text-xs text-[#A39E99]">请尝试其他搜索条件</p>
            </div>
          )}
        </div>

        {/* Cart Panel (Desktop fixed / Mobile slide) */}
        <CartPanel
          items={cartItems}
          onUpdateQty={handleUpdateQty}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          discount={discount}
          onDiscountChange={setDiscount}
          discountType={discountType}
          onDiscountTypeChange={setDiscountType}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          onCheckout={handleCheckout}
          isMobileOpen={mobileCartOpen}
          onMobileClose={() => setMobileCartOpen(false)}
          checkoutSuccess={checkoutSuccess}
        />
      </div>

      {/* Mobile Cart FAB */}
      <button
        onClick={() => setMobileCartOpen(true)}
        className="fixed right-5 bottom-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#D4853C] text-white shadow-lg transition-transform hover:scale-105 active:scale-95 lg:hidden"
      >
        <ShoppingCart className="h-6 w-6" />
        {cartItems.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#C75C3A] text-[11px] font-bold">
            {cartItems.reduce((s, i) => s + i.qty, 0)}
          </span>
        )}
      </button>

      {/* Size/Color Modal */}
      {showSizeColorModal && selectedProduct && (
        <SizeColorModal
          product={selectedProduct}
          onClose={() => {
            setShowSizeColorModal(false);
            setSelectedProduct(null);
          }}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Receipt Modal */}
      {showReceipt && (
        <ReceiptModal
          orderNo={lastOrderNo}
          items={cartItems}
          subtotal={subtotal}
          discount={discount}
          discountType={discountType}
          total={total}
          paymentMethod={paymentMethod}
          cashier={state.user?.name || '系统'}
          storeName={state.currentStore?.name || '总店'}
          createdAt={new Date().toLocaleString('zh-CN')}
          onClose={handleReceiptClose}
          onPrint={() => addToast('打印指令已发送', 'success')}
        />
      )}

      {/* Toasts */}
      <div className="fixed right-6 bottom-6 z-[80] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-[0_8px_24px_rgba(45,41,38,0.15)] transition-all',
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
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
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
