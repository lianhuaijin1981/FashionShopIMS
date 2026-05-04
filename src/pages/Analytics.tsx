// ==========================================
// Analytics Page — StyleStock 数据分析
// ==========================================

import { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  RotateCcw,
  Receipt,
  Wallet,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight,
  Download,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import type { Member } from '@/types';

// ==========================================
// Constants & Mock Data
// ==========================================

const CATEGORY_DATA = [
  { name: '上衣', value: 45200, percentage: 35.2, color: '#D4853C' },
  { name: '裤子', value: 28600, percentage: 22.3, color: '#E8A96E' },
  { name: '裙子', value: 22400, percentage: 17.4, color: '#4A9B8E' },
  { name: '外套', value: 18900, percentage: 14.7, color: '#C4A882' },
  { name: '配饰', value: 12800, percentage: 9.9, color: '#A39E99' },
  { name: '其他', value: 570, percentage: 0.4, color: '#D1CCC6' },
];

const PRODUCT_RANKING = [
  { name: '经典纯棉T恤', amount: 45200, qty: 180 },
  { name: '修身牛仔裤', amount: 28600, qty: 95 },
  { name: '印花连衣裙', amount: 22400, qty: 62 },
  { name: '棒球夹克', amount: 18900, qty: 38 },
  { name: '休闲短裤', amount: 15200, qty: 120 },
  { name: '羊绒围巾', amount: 12800, qty: 85 },
  { name: '百褶半身裙', amount: 10500, qty: 55 },
  { name: '真皮腰带', amount: 8900, qty: 72 },
  { name: '针织开衫', amount: 7200, qty: 48 },
  { name: '运动卫衣', amount: 6400, qty: 58 },
];

const PAYMENT_DATA = [
  { method: '微信支付', amount: 57800, percentage: 45, color: '#D4853C' },
  { method: '支付宝', amount: 41100, percentage: 32, color: '#E8A96E' },
  { method: '现金', amount: 23100, percentage: 18, color: '#A39E99' },
  { method: '其他', amount: 6420, percentage: 5, color: '#D1CCC6' },
];

const HOURLY_HEATMAP = [
  ['周一', [1200, 2800, 1500, 2200, 3500, 1800, 900]],
  ['周二', [1500, 3200, 1800, 2600, 4200, 2200, 1100]],
  ['周三', [1800, 3800, 2000, 3000, 4800, 2600, 1300]],
  ['周四', [1600, 3500, 1900, 2800, 4500, 2400, 1200]],
  ['周五', [2000, 4200, 2200, 3200, 5500, 3000, 1500]],
  ['周六', [3500, 5800, 4200, 4800, 6200, 5200, 3800]],
  ['周日', [3200, 5500, 3800, 4500, 5800, 4800, 3500]],
];

const TIME_SLOTS = ['8-10', '10-12', '12-14', '14-16', '16-18', '18-20', '20-22'];

function generateSalesTrend(period: string) {
  const baseData = [
    { date: '4/1', current: 8200, previous: 7500, orders: 45 },
    { date: '4/2', current: 12847, previous: 9200, orders: 62 },
    { date: '4/3', current: 9500, previous: 8800, orders: 48 },
    { date: '4/4', current: 11200, previous: 10200, orders: 55 },
    { date: '4/5', current: 7800, previous: 8500, orders: 40 },
    { date: '4/6', current: 10500, previous: 9800, orders: 52 },
    { date: '4/7', current: 8900, previous: 9100, orders: 44 },
    { date: '4/8', current: 7200, previous: 6800, orders: 38 },
    { date: '4/9', current: 9800, previous: 8900, orders: 50 },
    { date: '4/10', current: 11500, previous: 10200, orders: 58 },
    { date: '4/11', current: 13200, previous: 10500, orders: 65 },
    { date: '4/12', current: 8700, previous: 9200, orders: 42 },
    { date: '4/13', current: 10800, previous: 9800, orders: 54 },
    { date: '4/14', current: 9400, previous: 8800, orders: 47 },
    { date: '4/15', current: 12500, previous: 11000, orders: 60 },
  ];
  if (period === 'today') return baseData.slice(-1);
  if (period === 'week') return baseData.slice(-7);
  if (period === 'month') return baseData;
  return baseData;
}

function generateMemberGrowth(members: Member[]) {
  const months = ['2024-10', '2024-11', '2024-12', '2025-01', '2025-02', '2025-03'];
  return months.map((m, i) => ({
    month: m,
    newMembers: Math.floor(members.length / 6) + (i % 3) * 3,
    totalMembers: Math.floor(members.length / 6) * (i + 1),
  }));
}

// ==========================================
// Utils
// ==========================================

function formatCurrency(n: number): string {
  if (n >= 10000) return `¥${(n / 10000).toFixed(1)}万`;
  return `¥${n.toLocaleString('zh-CN')}`;
}

function formatNumber(n: number): string {
  return n.toLocaleString('zh-CN');
}

function getHeatColor(value: number, max: number): string {
  const ratio = value / max;
  if (ratio < 0.2) return 'rgba(212, 133, 60, 0.08)';
  if (ratio < 0.4) return 'rgba(212, 133, 60, 0.20)';
  if (ratio < 0.6) return 'rgba(212, 133, 60, 0.40)';
  if (ratio < 0.8) return 'rgba(212, 133, 60, 0.65)';
  return 'rgba(212, 133, 60, 0.90)';
}

// ==========================================
// CountUp Component
// ==========================================

function CountUp({ target, duration = 1200, prefix = '', suffix = '', decimals = 0 }: {
  target: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const [val, setVal] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = performance.now();
    function tick(now: number) {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(eased * target);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  const formatted = decimals > 0 ? val.toFixed(decimals) : Math.floor(val).toLocaleString('zh-CN');

  return (
    <span className="font-mono text-[28px] font-semibold text-[#2D2926]">
      {prefix}{formatted}{suffix}
    </span>
  );
}

// ==========================================
// KPI Card
// ==========================================

function KPICard({ label, value, prefix, suffix, decimals, trend, trendLabel, icon: Icon, delay = 0, sparklineData }: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  trend: number;
  trendLabel: string;
  icon: React.ElementType;
  delay?: number;
  sparklineData?: number[];
}) {
  const positive = trend >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(45,41,38,0.06)] transition-all hover:shadow-[0_4px_16px_rgba(45,41,38,0.10)] hover:-translate-y-0.5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-[#A39E99]" />
          <span className="text-xs font-medium text-[#A39E99]">{label}</span>
        </div>
        <span className={cn(
          'inline-flex items-center gap-0.5 rounded-lg px-2 py-0.5 text-[11px] font-medium',
          positive ? 'bg-[rgba(74,155,142,0.10)] text-[#4A9B8E]' : 'bg-[rgba(199,92,58,0.10)] text-[#C75C3A]'
        )}>
          {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {positive ? '+' : ''}{trend}%
        </span>
      </div>
      <div className="mt-2">
        <CountUp target={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </div>
      <p className="mt-1 text-[11px] text-[#A39E99]">{trendLabel}</p>
      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-3 h-10">
          <ResponsiveContainer width="100%" height={40}>
            <AreaChart data={sparklineData.map((v, i) => ({ i, v }))}>
              <defs>
                <linearGradient id={`spark-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4853C" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#D4853C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke="#D4853C" strokeWidth={2} fill={`url(#spark-${label})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}

// ==========================================
// Custom Tooltip for Sales Chart
// ==========================================

function SalesTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload || !payload.length) return null;
  const current = payload.find(p => p.name === '本期');
  const previous = payload.find(p => p.name === '上期');
  const delta = current && previous ? ((current.value - previous.value) / previous.value * 100).toFixed(1) : '0';
  const positive = parseFloat(delta) >= 0;

  return (
    <div className="rounded-xl bg-[#2D2926] px-4 py-3 text-white shadow-lg">
      <p className="text-xs text-[#A39E99]">{label}</p>
      <div className="mt-1 flex items-center gap-4">
        {current && (
          <div>
            <span className="text-[10px] text-[#A39E99]">本期</span>
            <p className="font-mono text-sm font-semibold">¥{formatNumber(Math.round(current.value))}</p>
          </div>
        )}
        {previous && (
          <div>
            <span className="text-[10px] text-[#A39E99]">上期</span>
            <p className="font-mono text-sm text-[#A39E99]">¥{formatNumber(Math.round(previous.value))}</p>
          </div>
        )}
      </div>
      {previous && (
        <p className={cn('mt-1 text-[11px]', positive ? 'text-[#4A9B8E]' : 'text-[#C75C3A]')}>
          较上期 {positive ? '+' : ''}{delta}%
        </p>
      )}
    </div>
  );
}

// ==========================================
// Main Analytics Page
// ==========================================

export default function Analytics() {
  const { state } = useApp();
  const { members, sales, inventory } = state;

  const [period, setPeriod] = useState<string>('month');
  const [compareEnabled, setCompareEnabled] = useState(true);

  // ---- KPI calculations ----
  const totalSales = sales.reduce((s, o) => s + o.finalAmount, 0);
  const totalOrders = sales.length;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;
  const refundRate = 3.2;
  const inventoryTurnover = 4.5;

  const memberSpending = sales
    .filter(s => s.memberId)
    .reduce((s, o) => s + o.finalAmount, 0);

  // Generate trend data based on period
  const trendData = useMemo(() => generateSalesTrend(period), [period]);

  // Sparkline data (14 days)
  const sparklineData = useMemo(() => {
    return trendData.map(d => d.current);
  }, [trendData]);

  // Member growth data
  const memberGrowthData = useMemo(() => generateMemberGrowth(members), [members]);

  // Inventory stats
  const totalInventoryQty = inventory.reduce((s, i) => s + i.quantity, 0);
  const totalInventoryValue = inventory.reduce((s, i) => s + i.quantity * 100, 0); // approximate
  const lowStockItems = inventory.filter(i => i.quantity <= i.minStock).length;

  const periodOptions = [
    { key: 'today', label: '今日' },
    { key: 'week', label: '本周' },
    { key: 'month', label: '本月' },
    { key: 'year', label: '本年' },
    { key: 'custom', label: '自定义' },
  ];

  const maxHeatVal = Math.max(...HOURLY_HEATMAP.flatMap(d => d[1] as number[]));

  return (
    <div className="space-y-6">
      {/* ====== PAGE HEADER ====== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-[32px] font-semibold leading-tight text-[#2D2926]">
            数据分析
          </h1>
          <p className="mt-1 text-sm text-[#A39E99]">经营报表与业务洞察</p>
        </div>
        <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#D4853C] px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#BF7532] hover:shadow-[0_2px_8px_rgba(212,133,60,0.30)] hover:-translate-y-0.5 active:translate-y-0">
          <FileSpreadsheet className="h-4 w-4" />
          导出报表
        </button>
      </div>

      {/* ====== PERIOD SELECTOR ====== */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-1 rounded-xl bg-[#E9E6E1] p-1">
          {periodOptions.map(opt => (
            <button
              key={opt.key}
              onClick={() => setPeriod(opt.key)}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-all',
                period === opt.key
                  ? 'bg-white font-semibold text-[#2D2926] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                  : 'text-[#6B6560] hover:text-[#2D2926]'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-[#6B6560]">
          <input
            type="checkbox"
            checked={compareEnabled}
            onChange={e => setCompareEnabled(e.target.checked)}
            className="rounded border-[rgba(45,41,38,0.12)] text-[#D4853C] focus:ring-[#D4853C]"
          />
          对比上期
        </label>
      </div>

      {/* ====== KPI CARDS (Row 1) ====== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KPICard
          label="销售总额"
          value={totalSales}
          prefix="¥"
          trend={15.3}
          trendLabel="较上月 +15.3%"
          icon={TrendingUp}
          delay={0}
          sparklineData={sparklineData}
        />
        <KPICard
          label="订单数量"
          value={totalOrders}
          suffix="笔"
          trend={8.2}
          trendLabel="较上月 +8.2%"
          icon={ShoppingCart}
          delay={0.08}
          sparklineData={sparklineData}
        />
        <KPICard
          label="客单价"
          value={avgOrderValue}
          prefix="¥"
          trend={-2.1}
          trendLabel="较上月 -2.1%"
          icon={Receipt}
          delay={0.16}
          sparklineData={sparklineData}
        />
      </div>

      {/* ====== KPI CARDS (Row 2) ====== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KPICard
          label="会员消费"
          value={memberSpending}
          prefix="¥"
          trend={22.1}
          trendLabel="较上月 +22.1%"
          icon={Users}
          delay={0.24}
          sparklineData={sparklineData}
        />
        <KPICard
          label="退货率"
          value={refundRate}
          suffix="%"
          decimals={1}
          trend={-0.5}
          trendLabel="较上月 -0.5%"
          icon={RotateCcw}
          delay={0.32}
        />
        <KPICard
          label="库存周转率"
          value={inventoryTurnover}
          suffix="x"
          decimals={1}
          trend={0.3}
          trendLabel="较上月 +0.3x"
          icon={Package}
          delay={0.40}
        />
      </div>

      {/* ====== SALES TREND + CATEGORY BREAKDOWN ====== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Sales Trend */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(45,41,38,0.06)] lg:col-span-3"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#2D2926]">销售趋势</h2>
              <p className="text-xs text-[#A39E99]">{compareEnabled ? '较上月对比' : '本期数据'}</p>
            </div>
            {compareEnabled && (
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-xs text-[#6B6560]">
                  <span className="h-2 w-2 rounded-full bg-[#D4853C]" />
                  本期
                </span>
                <span className="flex items-center gap-1.5 text-xs text-[#6B6560]">
                  <span className="h-2 w-2 rounded-full bg-[#A39E99]" />
                  上期
                </span>
              </div>
            )}
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D4853C" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#D4853C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,41,38,0.08)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#A39E99' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#A39E99', fontFamily: 'IBM Plex Mono' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => v >= 1000 ? `¥${(v / 1000).toFixed(0)}k` : `¥${v}`}
                />
                <Tooltip content={<SalesTooltip />} />
                <Area
                  type="monotone"
                  dataKey="current"
                  name="本期"
                  stroke="#D4853C"
                  strokeWidth={2.5}
                  fill="url(#colorCurrent)"
                  dot={{ r: 3, fill: '#D4853C', strokeWidth: 0 }}
                  activeDot={{ r: 5, stroke: '#D4853C', strokeWidth: 2, fill: '#fff' }}
                />
                {compareEnabled && (
                  <Area
                    type="monotone"
                    dataKey="previous"
                    name="上期"
                    stroke="#A39E99"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fill="none"
                    dot={false}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Category Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.28 }}
          className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(45,41,38,0.06)] lg:col-span-2"
        >
          <h2 className="mb-4 text-lg font-semibold text-[#2D2926]">品类销售占比</h2>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={CATEGORY_DATA}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {CATEGORY_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, _name, props) => [
                    `¥${formatNumber(Number(value))} (${(props?.payload as Record<string, unknown>)?.percentage ?? 0}%)`,
                    String((props?.payload as Record<string, unknown>)?.name ?? '')
                  ]}
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 8px 24px rgba(45,41,38,0.12)',
                    fontSize: '12px',
                  }}
                />
                <text x="50%" y="42%" textAnchor="middle" dominantBaseline="middle" className="text-xs fill-[#A39E99]">
                  总销
                </text>
                <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle" className="text-sm font-semibold fill-[#2D2926]" style={{ fontFamily: 'IBM Plex Mono' }}>
                  ¥128k
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
            {CATEGORY_DATA.map(cat => (
              <div key={cat.name} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-xs text-[#6B6560]">{cat.name}</span>
                <span className="ml-auto font-mono text-[11px] text-[#2D2926]">{cat.percentage}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ====== PRODUCT RANKING ====== */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.36 }}
        className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(45,41,38,0.06)]"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#2D2926]">商品销售排行</h2>
          <span className="text-xs text-[#A39E99]">Top 10</span>
        </div>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={PRODUCT_RANKING}
              layout="vertical"
              margin={{ top: 0, right: 30, left: 100, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,41,38,0.08)" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: '#A39E99', fontFamily: 'IBM Plex Mono' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `¥${(v / 1000).toFixed(0)}k`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: '#2D2926' }}
                axisLine={false}
                tickLine={false}
                width={95}
              />
              <Tooltip
                formatter={(value: number) => [`¥${formatNumber(value)}`, '销售额']}
                contentStyle={{
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 8px 24px rgba(45,41,38,0.12)',
                  fontSize: '12px',
                }}
              />
              <Bar
                dataKey="amount"
                fill="#D4853C"
                radius={[0, 6, 6, 0]}
                barSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* ====== HOURLY HEATMAP + PAYMENT DISTRIBUTION ====== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.44 }}
          className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(45,41,38,0.06)]"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#2D2926]">时段热力图</h2>
            <span className="text-xs text-[#A39E99]">工作日/周末</span>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[400px]">
              {/* Column headers */}
              <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-1">
                <div />
                {TIME_SLOTS.map(slot => (
                  <div key={slot} className="text-center text-[10px] text-[#A39E99] py-1">{slot}</div>
                ))}
              </div>
              {/* Rows */}
              {HOURLY_HEATMAP.map(([day, values]) => (
                <div key={day as string} className="grid grid-cols-[60px_repeat(7,1fr)] gap-1 mt-1">
                  <div className="flex items-center text-xs text-[#6B6560]">{day as string}</div>
                  {(values as number[]).map((val, colIdx) => (
                    <div
                      key={colIdx}
                      className="aspect-square rounded transition-all hover:ring-2 hover:ring-[#D4853C] hover:ring-offset-1 cursor-pointer"
                      style={{ backgroundColor: getHeatColor(val as number, maxHeatVal) }}
                      title={`${day as string} ${TIME_SLOTS[colIdx]}: ¥${formatNumber(val as number)}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          {/* Legend */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[10px] text-[#A39E99]">低</span>
            {[0.1, 0.3, 0.5, 0.7, 0.9].map((r, i) => (
              <div
                key={i}
                className="h-3 w-6 rounded"
                style={{ backgroundColor: `rgba(212, 133, 60, ${r})` }}
              />
            ))}
            <span className="text-[10px] text-[#A39E99]">高</span>
          </div>
        </motion.div>

        {/* Payment Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.52 }}
          className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(45,41,38,0.06)]"
        >
          <h2 className="mb-4 text-lg font-semibold text-[#2D2926]">支付方式分布</h2>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PAYMENT_DATA} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,41,38,0.08)" vertical={false} />
                <XAxis
                  dataKey="method"
                  tick={{ fontSize: 12, fill: '#6B6560' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  formatter={(value, _name, props) => [
                    `¥${formatNumber(Number(value))} (${(props?.payload as Record<string, unknown>)?.percentage ?? 0}%)`,
                    '金额'
                  ]}
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 8px 24px rgba(45,41,38,0.12)',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]} barSize={48}>
                  {PAYMENT_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex justify-center gap-4">
            {PAYMENT_DATA.map(p => (
              <div key={p.method} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-xs text-[#6B6560]">{p.method}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ====== INVENTORY ANALYTICS ====== */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(45,41,38,0.06)]"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#2D2926]">库存分析</h2>
          <button className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[rgba(45,41,38,0.12)] px-3 text-xs text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.04)]">
            <Download className="h-3.5 w-3.5" />
            导出
          </button>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <InventoryStatCard label="库存总量" value={formatNumber(totalInventoryQty)} sub="件商品在库" />
          <InventoryStatCard label="库存金额" value={`¥${(totalInventoryValue / 10000).toFixed(1)}万`} sub="库存总价值" />
          <InventoryStatCard label="低库存预警" value={String(lowStockItems)} sub="需补货商品" alert={lowStockItems > 0} />
          <InventoryStatCard label="周转率" value="4.5x" sub="月均周转" />
        </div>
      </motion.div>

      {/* ====== MEMBER ANALYTICS ====== */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.68 }}
        className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(45,41,38,0.06)]"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#2D2926]">会员分析</h2>
          <button className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[rgba(45,41,38,0.12)] px-3 text-xs text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.04)]">
            <Download className="h-3.5 w-3.5" />
            导出
          </button>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Member Growth Chart */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-[#6B6560]">会员增长趋势</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={memberGrowthData}>
                  <defs>
                    <linearGradient id="memberGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4A9B8E" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#4A9B8E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,41,38,0.08)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#A39E99' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#A39E99', fontFamily: 'IBM Plex Mono' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 8px 24px rgba(45,41,38,0.12)',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="newMembers"
                    name="新增会员"
                    stroke="#4A9B8E"
                    strokeWidth={2}
                    fill="url(#memberGrad)"
                    dot={{ r: 3, fill: '#4A9B8E', strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Member Stats */}
          <div className="grid grid-cols-2 gap-4">
            <MemberStatCard label="总会员数" value={formatNumber(members.length)} sub="注册会员" icon={Users} />
            <MemberStatCard
              label="活跃会员"
              value={formatNumber(members.filter(m => {
                const monthAgo = new Date('2025-04-02'); monthAgo.setDate(monthAgo.getDate() - 30);
                return m.lastPurchaseDate && new Date(m.lastPurchaseDate) >= monthAgo;
              }).length)}
              sub="30天内有消费"
              icon={ShoppingCart}
            />
            <MemberStatCard label="复购率" value="68.5%" sub="二次消费占比" icon={RotateCcw} />
            <MemberStatCard
              label="会员均消费"
              value={members.length > 0 ? formatCurrency(Math.round(members.reduce((s, m) => s + m.totalSpent, 0) / members.length)) : '¥0'}
              sub="人均消费金额"
              icon={Wallet}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ==========================================
// Inventory Stat Card
// ==========================================

function InventoryStatCard({ label, value, sub, alert }: { label: string; value: string; sub: string; alert?: boolean }) {
  return (
    <div className="rounded-xl border border-[rgba(45,41,38,0.08)] p-4">
      <p className="text-xs text-[#A39E99]">{label}</p>
      <p className={cn('mt-1 font-mono text-xl font-semibold', alert ? 'text-[#C75C3A]' : 'text-[#2D2926]')}>
        {value}
      </p>
      <p className="mt-0.5 text-[11px] text-[#6B6560]">{sub}</p>
    </div>
  );
}

// ==========================================
// Member Stat Card
// ==========================================

function MemberStatCard({ label, value, sub, icon: Icon }: { label: string; value: string; sub: string; icon: React.ElementType }) {
  return (
    <div className="rounded-xl border border-[rgba(45,41,38,0.08)] p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#A39E99]" />
        <span className="text-xs text-[#A39E99]">{label}</span>
      </div>
      <p className="mt-2 font-mono text-xl font-semibold text-[#2D2926]">{value}</p>
      <p className="mt-0.5 text-[11px] text-[#6B6560]">{sub}</p>
    </div>
  );
}
