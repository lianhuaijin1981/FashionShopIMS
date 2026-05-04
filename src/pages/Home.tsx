import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  PlusCircle,
  ShoppingCart,
  ClipboardCheck,
  FileText,
  UserPlus,
  BarChart3,
  Receipt,
  ArrowDownToLine,
  User,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useApp } from '@/context/AppContext';
import { SALES_TREND_DATA, LOW_STOCK_ITEMS, RECENT_ACTIVITIES } from '@/data/mockData';
import type { Activity } from '@/types';
import { cn } from '@/lib/utils';

// ==========================================
// Dot-Matrix Canvas Background
// ==========================================
function DotMatrixCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999, lx: -9999, ly: -9999 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const SPACING = 24;
    const DOT_SIZE = 2;
    const INFLUENCE = 150;
    const LERP = 0.08;

    function resize() {
      const rect = container!.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = rect.width * dpr;
      canvas!.height = rect.height * dpr;
      canvas!.style.width = rect.width + 'px';
      canvas!.style.height = rect.height + 'px';
      ctx!.scale(dpr, dpr);
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    function handleMouseMove(e: MouseEvent) {
      const rect = container!.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    }

    container.addEventListener('mousemove', handleMouseMove);

    function draw() {
      const rect = container!.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const m = mouseRef.current;

      // Lerp mouse position
      m.lx += (m.x - m.lx) * LERP;
      m.ly += (m.y - m.ly) * LERP;

      ctx!.clearRect(0, 0, w, h);

      const cols = Math.ceil(w / SPACING) + 1;
      const rows = Math.ceil(h / SPACING) + 1;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const px = c * SPACING;
          const py = r * SPACING;
          const dx = px - m.lx;
          const dy = py - m.ly;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let alpha = 0.06;
          let scale = 1;

          if (dist < INFLUENCE) {
            const t = 1 - dist / INFLUENCE;
            alpha = 0.06 + t * 0.16;
            scale = 1 + t * 0.6;
          }

          const sz = DOT_SIZE * scale;
          ctx!.beginPath();
          ctx!.arc(px, py, sz / 2, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(45, 41, 38, ${alpha})`;
          ctx!.fill();
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      container.removeEventListener('mousemove', handleMouseMove);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 -left-8 -right-8 -top-5 -bottom-5 z-0"
    >
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      />
    </div>
  );
}

// ==========================================
// StatGlowDot
// ==========================================
function StatGlowDot({ alert }: { alert?: boolean }) {
  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{
        background: alert ? '#C75C3A' : '#D4853C',
        boxShadow: alert
          ? '0 0 8px 2px rgba(199, 92, 58, 0.50)'
          : '0 0 8px 2px rgba(212, 133, 60, 0.50)',
        animation: 'stat-glow-pulse 2s ease-in-out infinite',
      }}
    />
  );
}

// ==========================================
// StatTrendBadge
// ==========================================
function StatTrendBadge({
  trend,
  label,
  type = 'positive',
}: {
  trend?: number;
  label?: string;
  type?: 'positive' | 'negative' | 'neutral';
}) {
  if (label) {
    return (
      <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-medium text-[#A39E99] bg-[rgba(45,41,38,0.06)]">
        {label}
      </span>
    );
  }
  const isPos = (trend ?? 0) >= 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-lg px-2 py-0.5 text-[11px] font-medium',
        type === 'positive' || (isPos && type !== 'neutral')
          ? 'bg-[rgba(74,155,142,0.10)] text-[#4A9B8E]'
          : type === 'negative'
            ? 'bg-[rgba(199,92,58,0.10)] text-[#C75C3A]'
            : 'bg-[rgba(45,41,38,0.06)] text-[#A39E99]'
      )}
    >
      {isPos ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isPos ? '+' : ''}{trend}%
    </span>
  );
}

// ==========================================
// KPI Card
// ==========================================
function KPICard({
  label,
  value,
  prefix,
  suffix,
  trend,
  trendLabel,
  trendType,
  helper,
  helperType,
  hasAlert,
  sparklineData,
  delay = 0,
}: {
  label: string;
  value: string;
  prefix?: string;
  suffix?: string;
  trend?: number;
  trendLabel?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  helper?: string;
  helperType?: 'default' | 'success' | 'alert';
  hasAlert?: boolean;
  sparklineData?: number[];
  delay?: number;
}) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const numericValue = parseFloat(value.replace(/,/g, ''));
  const hasAnimated = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 1200;
          const start = performance.now();

          function tick(now: number) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // ease-smooth: cubic-bezier(0.25, 0.1, 0.25, 1)
            const eased = 1 - Math.pow(1 - progress, 2);
            setAnimatedValue(Math.floor(numericValue * eased));
            if (progress < 1) requestAnimationFrame(tick);
          }

          setTimeout(() => requestAnimationFrame(tick), delay);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(card);
    return () => observer.disconnect();
  }, [numericValue, delay]);

  const formatAnimated = () => {
    if (isNaN(numericValue)) return value;
    const v = animatedValue;
    if (prefix === '¥') return `¥${v.toLocaleString()}`;
    return `${v.toLocaleString()}${suffix || ''}`;
  };

  // Mini sparkline SVG
  const sparklineSVG = useCallback(() => {
    if (!sparklineData || sparklineData.length === 0) return null;
    const w = 120;
    const h = 40;
    const max = Math.max(...sparklineData);
    const min = Math.min(...sparklineData);
    const range = max - min || 1;
    const points = sparklineData.map((v, i) => {
      const x = (i / (sparklineData.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    });
    const pathD = `M${points.join(' L')}`;
    const areaD = `${pathD} L${w},${h} L0,${h} Z`;

    return (
      <svg width="100%" height="40" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="mt-3">
        <defs>
          <linearGradient id="sparklineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D4853C" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#D4853C" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#sparklineFill)" />
        <path d={pathD} fill="none" stroke="#D4853C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }, [sparklineData]);

  return (
    <div
      ref={cardRef}
      className={cn(
        'relative rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(45,41,38,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(45,41,38,0.10)]',
        hasAlert && 'border-l-[3px] border-l-[#C75C3A]'
      )}
      style={{
        animation: `fade-in-up 0.5s cubic-bezier(0.25, 0.1, 0.25, 1) ${delay}ms both`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#A39E99]">{label}</span>
          <StatGlowDot alert={hasAlert} />
        </div>
        {(trend !== undefined || trendLabel) && (
          <StatTrendBadge trend={trend} label={trendLabel} type={trendType} />
        )}
      </div>

      {/* Value */}
      <div className="mt-2 text-[28px] font-semibold leading-tight text-[#2D2926]" style={{ fontFamily: '"IBM Plex Mono", monospace' }}>
        {isNaN(numericValue) ? value : formatAnimated()}
      </div>

      {/* Helper */}
      {helper && (
        <p className={cn(
          'mt-1 text-xs',
          helperType === 'success' ? 'text-[#4A9B8E]' : helperType === 'alert' ? 'text-[#C75C3A]' : 'text-[#A39E99]'
        )}>
          {helper}
        </p>
      )}

      {/* Sparkline */}
      {sparklineData && sparklineData.length > 0 && sparklineSVG()}
    </div>
  );
}

// ==========================================
// Activity Icon
// ==========================================
function ActivityIcon({ type }: { type: Activity['type'] }) {
  const config: Record<string, { bg: string; icon: React.ElementType; color: string }> = {
    sale: { bg: 'bg-[rgba(74,155,142,0.10)]', icon: Receipt, color: 'text-[#4A9B8E]' },
    inbound: { bg: 'bg-[rgba(212,133,60,0.10)]', icon: ArrowDownToLine, color: 'text-[#D4853C]' },
    member: { bg: 'bg-[rgba(45,41,38,0.06)]', icon: User, color: 'text-[#6B6560]' },
    alert: { bg: 'bg-[rgba(199,92,58,0.10)]', icon: AlertTriangle, color: 'text-[#C75C3A]' },
    count: { bg: 'bg-[rgba(45,41,38,0.06)]', icon: ClipboardCheck, color: 'text-[#6B6560]' },
    purchase: { bg: 'bg-[rgba(212,133,60,0.10)]', icon: FileText, color: 'text-[#D4853C]' },
    outbound: { bg: 'bg-[rgba(74,155,142,0.10)]', icon: ArrowDownToLine, color: 'text-[#4A9B8E]' },
    refund: { bg: 'bg-[rgba(199,92,58,0.10)]', icon: Receipt, color: 'text-[#C75C3A]' },
  };

  const c = config[type] || config.sale;
  const Icon = c.icon;

  return (
    <div className={cn('flex h-8 w-8 items-center justify-center rounded-full', c.bg)}>
      <Icon className={cn('h-4 w-4', c.color)} />
    </div>
  );
}

// ==========================================
// Quick Action Card
// ==========================================
function QuickActionCard({
  icon: Icon,
  title,
  description,
  onClick,
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
  delay?: number;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col rounded-2xl bg-white p-6 text-left shadow-[0_1px_3px_rgba(45,41,38,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(45,41,38,0.10)]"
      style={{
        animation: `fade-in-up 0.5s cubic-bezier(0.25, 0.1, 0.25, 1) ${delay}ms both`,
      }}
    >
      <Icon className="h-7 w-7 text-[#D4853C] transition-transform duration-300 group-hover:scale-110" />
      <span className="mt-4 text-base font-semibold text-[#2D2926]">{title}</span>
      <span className="mt-1 text-xs text-[#6B6560]">{description}</span>
    </button>
  );
}

// ==========================================
// Custom Tooltip for Chart
// ==========================================
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-[#2D2926] px-3 py-2 text-xs text-white shadow-lg">
      <p className="font-medium">{label}</p>
      <p style={{ fontFamily: '"IBM Plex Mono", monospace' }}>
        销售额: ¥{payload[0].value.toLocaleString()}
      </p>
    </div>
  );
}

// ==========================================
// Main Home Page
// ==========================================
export default function Home() {
  const navigate = useNavigate();
  const { state } = useApp();
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year'>('week');

  const totalStock = useMemo(() => {
    return state.inventory.reduce((sum, i) => sum + i.quantity, 0);
  }, [state.inventory]);

  const lowStockCount = useMemo(() => {
    return state.inventory.filter(i => i.quantity <= i.minStock).length;
  }, [state.inventory]);

  const pendingInbound = useMemo(() => {
    return state.purchaseOrders.filter(p => p.status === 'pending' || p.status === 'partial').length;
  }, [state.purchaseOrders]);

  const pendingAmount = useMemo(() => {
    return state.purchaseOrders
      .filter(p => p.status === 'pending' || p.status === 'partial')
      .reduce((sum, p) => sum + p.totalAmount, 0);
  }, [state.purchaseOrders]);

  const timeRangeLabels: Record<string, string> = {
    today: '今日',
    week: '本周',
    month: '本月',
    year: '本年',
  };

  return (
    <div>
      {/* Page Header */}
      <div
        className="mb-6 flex items-end justify-between"
        style={{ animation: 'fade-in-up 0.4s cubic-bezier(0.25, 0.1, 0.25, 1) 0s both' }}
      >
        <div>
          <h1 className="font-display text-[32px] font-semibold text-[#2D2926]">
            首页概览
          </h1>
          <p className="mt-1 text-xs font-medium tracking-wide text-[#A39E99]">
            首页 / 仪表盘
          </p>
        </div>
        <p className="text-sm text-[#6B6560]">
          2025年4月2日 星期三
        </p>
      </div>

      {/* KPI Grid Section with Dot Matrix Canvas */}
      <div className="relative">
        <DotMatrixCanvas />
        <div className="relative z-[1] grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <KPICard
            label="今日销售额"
            value="12847"
            prefix="¥"
            trend={12.5}
            trendType="positive"
            helper="较昨日"
            sparklineData={SALES_TREND_DATA.map(d => d.amount)}
            delay={150}
          />
          <KPICard
            label="今日订单数"
            value="86"
            suffix="笔"
            trend={8.2}
            trendType="positive"
            helper="较昨日"
            sparklineData={SALES_TREND_DATA.map(d => d.orders)}
            delay={230}
          />
          <KPICard
            label="库存总量"
            value={String(totalStock)}
            suffix="件"
            trendLabel="-3件 今日变动"
            trendType="neutral"
            helper="实时库存"
            delay={310}
          />
          <KPICard
            label="缺货预警"
            value={String(lowStockCount)}
            suffix="项"
            helper="需处理"
            helperType="alert"
            hasAlert
            delay={390}
          />
          <KPICard
            label="会员总数"
            value={String(state.members.length)}
            suffix="人"
            helper="+5人 本月新增"
            helperType="success"
            delay={470}
          />
          <KPICard
            label="采购待入库"
            value={String(pendingInbound)}
            suffix="单"
            helper={`¥${pendingAmount.toLocaleString()} 待入库金额`}
            hasAlert={pendingInbound > 0}
            delay={550}
          />
        </div>
      </div>

      {/* Sales Trend + Low Stock Alerts */}
      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Sales Trend Chart */}
        <div
          className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(45,41,38,0.06)] xl:col-span-2"
          style={{ animation: 'fade-in-up 0.5s cubic-bezier(0.25, 0.1, 0.25, 1) 0.5s both' }}
        >
          {/* Chart Header */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#2D2926]">销售趋势</h2>
              <p className="mt-0.5 text-xs text-[#A39E99]">4月1日 - 4月14日</p>
            </div>
            <div className="flex gap-1">
              {(['today', 'week', 'month', 'year'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={cn(
                    'rounded-lg px-3 py-1 text-xs font-medium transition-colors',
                    timeRange === r
                      ? 'bg-[#D4853C] text-white'
                      : 'text-[#6B6560] hover:bg-[rgba(45,41,38,0.04)]'
                  )}
                >
                  {timeRangeLabels[r]}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SALES_TREND_DATA} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D4853C" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#D4853C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,41,38,0.08)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#A39E99' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#A39E99', fontFamily: '"IBM Plex Mono", monospace' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `¥${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#D4853C"
                  strokeWidth={2.5}
                  fill="url(#areaFill)"
                  dot={false}
                  activeDot={{ r: 6, fill: '#FFFFFF', stroke: '#D4853C', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div
          className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(45,41,38,0.06)]"
          style={{ animation: 'fade-in-up 0.5s cubic-bezier(0.25, 0.1, 0.25, 1) 0.5s both' }}
        >
          <div className="mb-1 flex items-center gap-2">
            <h2 className="text-lg font-semibold text-[#2D2926]">库存预警</h2>
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C75C3A] px-1.5 text-[11px] font-semibold text-white">
              {LOW_STOCK_ITEMS.length}
            </span>
          </div>
          <p className="mb-3 text-xs text-[#6B6560]">以下商品库存不足，请及时补货</p>

          <div className="max-h-[280px] overflow-y-auto">
            {LOW_STOCK_ITEMS.map((item, idx) => (
              <div
                key={`${item.sku}-${item.color}-${item.size}-${idx}`}
                className="flex items-center justify-between border-b border-[rgba(45,41,38,0.08)] py-2.5 last:border-0"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.colorHex }}
                  />
                  <div>
                    <span className="text-[13px] font-medium text-[#2D2926]" style={{ fontFamily: '"IBM Plex Mono", monospace' }}>
                      {item.sku}
                    </span>
                    <span className="ml-1.5 text-[11px] text-[#6B6560]">
                      {item.color}-{item.size}
                    </span>
                  </div>
                </div>
                <span className={cn(
                  'text-xs font-medium',
                  item.stock <= 2 ? 'text-[#C75C3A]' : 'text-[#A39E99]'
                )}>
                  库存:{item.stock}件
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('/inventory')}
            className="mt-3 flex items-center text-xs font-medium text-[#D4853C] transition-colors hover:underline"
          >
            查看全部库存
            <ArrowRight className="ml-1 h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <QuickActionCard
          icon={ShoppingCart}
          title="前台收银"
          description="开始收银结算"
          onClick={() => navigate('/pos')}
          delay={700}
        />
        <QuickActionCard
          icon={FileText}
          title="新建采购"
          description="创建采购订单"
          onClick={() => navigate('/purchase')}
          delay={760}
        />
        <QuickActionCard
          icon={ClipboardCheck}
          title="库存盘点"
          description="开始库存盘点"
          onClick={() => navigate('/inventory')}
          delay={820}
        />
        <QuickActionCard
          icon={UserPlus}
          title="新增会员"
          description="注册新会员"
          onClick={() => navigate('/members')}
          delay={880}
        />
        <QuickActionCard
          icon={PlusCircle}
          title="商品上新"
          description="录入新品信息"
          onClick={() => navigate('/products')}
          delay={940}
        />
        <QuickActionCard
          icon={BarChart3}
          title="数据报表"
          description="查看经营分析"
          onClick={() => navigate('/analytics')}
          delay={1000}
        />
      </div>

      {/* Recent Activity */}
      <div
        className="mt-5 rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(45,41,38,0.06)]"
        style={{ animation: 'fade-in-up 0.5s cubic-bezier(0.25, 0.1, 0.25, 1) 0.9s both' }}
      >
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-lg font-semibold text-[#2D2926]">最近动态</h2>
          <span className="flex items-center gap-1.5 text-xs text-[#A39E99]">
            实时更新
            <StatGlowDot />
          </span>
        </div>

        <div>
          {RECENT_ACTIVITIES.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center gap-4 border-b border-[rgba(45,41,38,0.08)] py-3 transition-colors last:border-0 hover:bg-[rgba(45,41,38,0.02)]"
            >
              <ActivityIcon type={activity.type} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-[#2D2926]">{activity.title}</p>
                {activity.operator && (
                  <p className="mt-0.5 text-xs text-[#A39E99]">店员:{activity.operator}</p>
                )}
                {activity.reference && (
                  <p className="mt-0.5 text-xs text-[#A39E99]">{activity.reference}</p>
                )}
                {activity.points !== undefined && activity.points > 0 && (
                  <p className="mt-0.5 text-xs text-[#4A9B8E]">积分+{activity.points}</p>
                )}
                {activity.detail && (
                  <p className="mt-0.5 text-xs text-[#C75C3A]">{activity.detail}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-[#A39E99]">{activity.time}</span>
                {activity.amount !== undefined && (
                  <span className="text-sm font-medium text-[#2D2926]" style={{ fontFamily: '"IBM Plex Mono", monospace' }}>
                    ¥{activity.amount.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate('/sales')}
          className="mt-3 flex items-center text-xs font-medium text-[#D4853C] transition-colors hover:underline"
        >
          查看全部记录
          <ArrowRight className="ml-1 h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
