import { Search, RefreshCw } from 'lucide-react';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  dateRange: string;
  onDateRangeChange: (val: string) => void;
  paymentMethod: string;
  onPaymentMethodChange: (val: string) => void;
  cashier: string;
  onCashierChange: (val: string) => void;
  orderType: string;
  onOrderTypeChange: (val: string) => void;
  cashiers: string[];
  onRefresh: () => void;
}

const DATE_RANGES = [
  { value: 'today', label: '今天' },
  { value: 'yesterday', label: '昨天' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'custom', label: '自定义' },
];

const PAYMENT_METHODS = [
  { value: 'all', label: '全部方式' },
  { value: 'wechat', label: '微信' },
  { value: 'alipay', label: '支付宝' },
  { value: 'cash', label: '现金' },
  { value: 'card', label: '刷卡' },
  { value: 'stored_value', label: '储值' },
  { value: 'mixed', label: '混合' },
];

const ORDER_TYPES = [
  { value: 'all', label: '全部类型' },
  { value: 'sale', label: '销售' },
  { value: 'return', label: '退货' },
  { value: 'exchange', label: '换货' },
];

export default function FilterBar({
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  paymentMethod,
  onPaymentMethodChange,
  cashier,
  onCashierChange,
  orderType,
  onOrderTypeChange,
  cashiers,
  onRefresh,
}: FilterBarProps) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(45,41,38,0.06)]">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 basis-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#A39E99]" />
          <input
            type="text"
            placeholder="搜索销售单号、商品..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 w-full rounded-xl border border-[rgba(45,41,38,0.12)] bg-white py-0 pl-10 pr-3 text-sm text-[#2D2926] transition-all placeholder:text-[#A39E99] focus:border-[#D4853C] focus:shadow-[0_0_0_3px_rgba(212,133,60,0.12)] focus:outline-none"
          />
        </div>

        {/* Date Range */}
        <select
          value={dateRange}
          onChange={(e) => onDateRangeChange(e.target.value)}
          className="h-10 rounded-xl border border-[rgba(45,41,38,0.12)] bg-white px-3 text-sm text-[#6B6560] focus:border-[#D4853C] focus:outline-none"
        >
          {DATE_RANGES.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>

        {/* Payment Method */}
        <select
          value={paymentMethod}
          onChange={(e) => onPaymentMethodChange(e.target.value)}
          className="h-10 rounded-xl border border-[rgba(45,41,38,0.12)] bg-white px-3 text-sm text-[#6B6560] focus:border-[#D4853C] focus:outline-none"
        >
          {PAYMENT_METHODS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>

        {/* Cashier */}
        <select
          value={cashier}
          onChange={(e) => onCashierChange(e.target.value)}
          className="h-10 rounded-xl border border-[rgba(45,41,38,0.12)] bg-white px-3 text-sm text-[#6B6560] focus:border-[#D4853C] focus:outline-none"
        >
          <option value="all">全部收银员</option>
          {cashiers.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Order Type */}
        <select
          value={orderType}
          onChange={(e) => onOrderTypeChange(e.target.value)}
          className="h-10 rounded-xl border border-[rgba(45,41,38,0.12)] bg-white px-3 text-sm text-[#6B6560] focus:border-[#D4853C] focus:outline-none"
        >
          {ORDER_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(45,41,38,0.12)] text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.04)]"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
