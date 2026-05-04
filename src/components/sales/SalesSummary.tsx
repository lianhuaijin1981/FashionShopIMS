import { X, TrendingUp, Receipt, RotateCcw, Wallet } from 'lucide-react';
import type { SalesOrder } from '@/types';
import { cn } from '@/lib/utils';

interface SalesSummaryProps {
  orders: SalesOrder[];
  onClose: () => void;
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: '现金',
  wechat: '微信支付',
  alipay: '支付宝',
  card: '刷卡',
  stored_value: '会员储值',
  mixed: '混合支付',
};

export default function SalesSummary({ orders, onClose }: SalesSummaryProps) {
  // Calculate summary
  const totalSales = orders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + o.finalAmount, 0);

  const totalOrders = orders.filter((o) => o.status === 'completed').length;

  const refundAmount = orders
    .filter((o) => o.status === 'refunded' || o.status === 'partial_refund')
    .reduce((sum, o) => sum + o.discount, 0);

  const netAmount = totalSales - refundAmount;

  // Payment breakdown
  const paymentBreakdown: Record<string, number> = {};
  orders
    .filter((o) => o.status === 'completed')
    .forEach((o) => {
      const method = PAYMENT_LABELS[o.paymentMethod] || o.paymentMethod;
      paymentBreakdown[method] = (paymentBreakdown[method] || 0) + o.finalAmount;
    });

  const maxPayment = Math.max(...Object.values(paymentBreakdown), 1);

  // Hourly breakdown
  const hourlyData: Record<number, number> = {};
  orders
    .filter((o) => o.status === 'completed')
    .forEach((o) => {
      const hour = new Date(o.createdAt).getHours();
      hourlyData[hour] = (hourlyData[hour] || 0) + o.finalAmount;
    });
  const maxHourly = Math.max(...Object.values(hourlyData), 1);
  const hours = Array.from({ length: 12 }, (_, i) => 8 + i); // 8AM - 7PM

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[rgba(45,41,38,0.40)] backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-[560px] max-h-[85vh] overflow-hidden rounded-[20px] bg-white shadow-[0_20px_60px_rgba(45,41,38,0.15)]"
        style={{ animation: 'modalIn 0.25s cubic-bezier(0.25, 0.1, 0.25, 1)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(45,41,38,0.08)] px-6 py-4">
          <h3 className="text-lg font-semibold text-[#2D2926]">销售汇总</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.04)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[rgba(212,133,60,0.08)] p-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-[#D4853C]" />
                <span className="text-xs text-[#6B6560]">销售总额</span>
              </div>
              <p className="mt-2 font-mono text-xl font-semibold text-[#2D2926]">
                ¥{totalSales.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl bg-[rgba(74,155,142,0.08)] p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#4A9B8E]" />
                <span className="text-xs text-[#6B6560]">销售笔数</span>
              </div>
              <p className="mt-2 font-mono text-xl font-semibold text-[#2D2926]">
                {totalOrders} 笔
              </p>
            </div>
            <div className="rounded-xl bg-[rgba(199,92,58,0.08)] p-4">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-[#C75C3A]" />
                <span className="text-xs text-[#6B6560]">退货金额</span>
              </div>
              <p className="mt-2 font-mono text-xl font-semibold text-[#C75C3A]">
                -¥{refundAmount.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl bg-[rgba(45,41,38,0.05)] p-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-[#6B6560]" />
                <span className="text-xs text-[#6B6560]">实收净额</span>
              </div>
              <p className="mt-2 font-mono text-xl font-semibold text-[#2D2926]">
                ¥{netAmount.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-[#2D2926]">支付方式分布</h4>
            <div className="mt-3 space-y-2">
              {Object.entries(paymentBreakdown).map(([method, amount]) => {
                const pct = Math.round((amount / maxPayment) * 100);
                return (
                  <div key={method} className="flex items-center gap-3">
                    <span className="w-16 text-xs text-[#6B6560]">{method}</span>
                    <div className="flex-1 overflow-hidden rounded-full bg-[#E9E6E1] h-5">
                      <div
                        className="h-full rounded-full bg-[#D4853C] transition-all duration-500"
                        style={{ width: `${Math.max(5, pct)}%` }}
                      />
                    </div>
                    <span className="w-20 text-right font-mono text-xs text-[#2D2926]">
                      ¥{amount.toLocaleString()}
                    </span>
                  </div>
                );
              })}
              {Object.keys(paymentBreakdown).length === 0 && (
                <p className="py-4 text-center text-xs text-[#A39E99]">暂无数据</p>
              )}
            </div>
          </div>

          {/* Hourly Chart */}
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-[#2D2926]">时段销售趋势</h4>
            <div className="mt-3 flex items-end gap-1 h-28">
              {hours.map((hour) => {
                const amount = hourlyData[hour] || 0;
                const pct = maxHourly > 0 ? (amount / maxHourly) * 100 : 0;
                return (
                  <div key={hour} className="flex flex-1 flex-col items-center gap-1">
                    <div className="w-full flex-1 flex items-end">
                      <div
                        className={cn(
                          'w-full rounded-t-sm transition-all duration-500',
                          amount > 0 ? 'bg-[#D4853C]' : 'bg-[#E9E6E1]'
                        )}
                        style={{ height: `${Math.max(4, pct)}%` }}
                        title={`${hour}:00 ¥${amount.toLocaleString()}`}
                      />
                    </div>
                    <span className="text-[9px] text-[#A39E99]">{hour}h</span>
                  </div>
                );
              })}
            </div>
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
