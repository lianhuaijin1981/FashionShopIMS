import { useState, useMemo } from 'react';
import { X, Minus, Plus } from 'lucide-react';
import type { Product } from '@/types';
import { cn } from '@/lib/utils';

interface SizeColorModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, color: string, colorHex: string, size: string, qty: number) => void;
}

export default function SizeColorModal({ product, onClose, onAddToCart }: SizeColorModalProps) {
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [qty, setQty] = useState(1);
  const [animating, setAnimating] = useState(false);

  if (!product) return null;

  const availableColors = product.specs;
  
  const availableSizes = useMemo(() => {
    if (!selectedColor) return [];
    const spec = product.specs.find(s => s.color === selectedColor);
    return spec ? Object.keys(spec.sizes) : [];
  }, [product, selectedColor]);

  const getStockForSize = (size: string): number => {
    if (!selectedColor) return 0;
    const spec = product.specs.find(s => s.color === selectedColor);
    return spec?.sizes[size] || 0;
  };

  const selectedColorHex = availableColors.find(c => c.color === selectedColor)?.colorHex || '#E9E6E1';

  const handleAdd = () => {
    if (!selectedColor || !selectedSize) return;
    setAnimating(true);
    setTimeout(() => {
      onAddToCart(product, selectedColor, selectedColorHex, selectedSize, qty);
      setSelectedColor('');
      setSelectedSize('');
      setQty(1);
      setAnimating(false);
      onClose();
    }, 200);
  };

  const canAdd = selectedColor && selectedSize && getStockForSize(selectedSize) > 0 && qty > 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[rgba(45,41,38,0.40)] backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative w-full max-w-[480px] overflow-hidden rounded-[20px] bg-white shadow-[0_20px_60px_rgba(45,41,38,0.15)] transition-all duration-250',
          animating && 'scale-95 opacity-80'
        )}
        style={{ animation: 'modalIn 0.25s cubic-bezier(0.25, 0.1, 0.25, 1)' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.04)]"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Product Image */}
        <div
          className="flex aspect-[4/3] items-center justify-center bg-[#E9E6E1]"
          style={{ backgroundColor: selectedColor ? `${selectedColorHex}30` : '#E9E6E1' }}
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/60">
            <svg className="h-10 w-10 text-[#A39E99]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Name + SKU + Price */}
          <h3 className="text-xl font-semibold text-[#2D2926]">{product.name}</h3>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-mono text-xs text-[#A39E99]">{product.sku}</span>
            <span className="text-xs text-[#A39E99]">|</span>
            <span className="text-xs text-[#6B6560]">{product.category}</span>
          </div>
          <p className="mt-2 font-mono text-xl font-semibold text-[#D4853C]">
            ¥{product.retailPrice}
          </p>

          {/* Color Selection */}
          <div className="mt-5">
            <label className="text-sm font-medium text-[#2D2926]">颜色</label>
            <div className="mt-2 flex flex-wrap gap-3">
              {availableColors.map((color) => (
                <button
                  key={color.color}
                  onClick={() => {
                    setSelectedColor(color.color);
                    setSelectedSize('');
                  }}
                  className={cn(
                    'group relative h-9 w-9 rounded-full border-2 transition-all duration-200',
                    selectedColor === color.color
                      ? 'border-[#D4853C] shadow-[0_0_0_3px_rgba(212,133,60,0.25)]'
                      : 'border-[rgba(45,41,38,0.12)] hover:border-[rgba(45,41,38,0.30)]'
                  )}
                  style={{ backgroundColor: color.colorHex }}
                  title={color.color}
                >
                  {selectedColor === color.color && (
                    <svg
                      className="absolute inset-0 m-auto h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={color.colorHex === '#f5f5f5' || color.colorHex === '#d4c4a8' ? '#2D2926' : '#fff'}
                      strokeWidth="3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            {selectedColor && (
              <p className="mt-1.5 text-xs text-[#6B6560]">已选: {selectedColor}</p>
            )}
          </div>

          {/* Size Selection */}
          <div className="mt-5">
            <label className="text-sm font-medium text-[#2D2926]">尺码</label>
            {selectedColor ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {availableSizes.map((size) => {
                  const stock = getStockForSize(size);
                  const isSelected = selectedSize === size;
                  const isDisabled = stock <= 0;

                  return (
                    <button
                      key={size}
                      onClick={() => !isDisabled && setSelectedSize(size)}
                      disabled={isDisabled}
                      className={cn(
                        'relative flex min-w-[52px] flex-col items-center rounded-[10px] border-[1.5px] px-2 py-1.5 transition-all duration-200',
                        isSelected
                          ? 'border-[#D4853C] bg-[#D4853C] text-white'
                          : isDisabled
                          ? 'cursor-not-allowed border-[rgba(45,41,38,0.06)] bg-[rgba(45,41,38,0.03)] text-[#A39E99]'
                          : 'border-[rgba(45,41,38,0.12)] bg-white text-[#2D2926] hover:border-[#D4853C] hover:text-[#D4853C]'
                      )}
                    >
                      <span className="text-sm font-medium">{size}</span>
                      <span className={cn('text-[10px]', isSelected ? 'text-white/80' : '')}>
                        {stock > 0 ? `${stock}件` : '缺货'}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="mt-2 text-xs text-[#A39E99]">请先选择颜色</p>
            )}
          </div>

          {/* Quantity */}
          <div className="mt-5">
            <label className="text-sm font-medium text-[#2D2926]">数量</label>
            <div className="mt-2 flex items-center gap-3">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                disabled={qty <= 1}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(45,41,38,0.12)] text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.04)] disabled:opacity-30"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-[40px] text-center text-lg font-semibold text-[#2D2926]">{qty}</span>
              <button
                onClick={() => {
                  const maxStock = selectedSize ? getStockForSize(selectedSize) : 99;
                  setQty(Math.min(maxStock, qty + 1));
                }}
                disabled={selectedSize ? qty >= getStockForSize(selectedSize) : false}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(45,41,38,0.12)] text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.04)] disabled:opacity-30"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex h-11 flex-1 items-center justify-center rounded-xl border border-[rgba(45,41,38,0.12)] text-sm font-medium text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.04)]"
            >
              取消
            </button>
            <button
              onClick={handleAdd}
              disabled={!canAdd}
              className={cn(
                'flex h-11 flex-1 items-center justify-center rounded-xl text-sm font-semibold text-white transition-all',
                canAdd
                  ? 'bg-[#D4853C] hover:bg-[#BF7532] hover:shadow-[0_2px_8px_rgba(212,133,60,0.30)]'
                  : 'cursor-not-allowed bg-[#A39E99] opacity-50'
              )}
            >
              加入购物车
            </button>
          </div>
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
