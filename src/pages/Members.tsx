// ==========================================
// Members Page — StyleStock 会员管理
// ==========================================

import { useState, useMemo, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import {
  Search,
  Plus,
  UserPlus,
  Upload,
  Download,
  X,
  ChevronDown,
  ChevronUp,
  Crown,
  Gift,
  Wallet,
  TrendingUp,
  ShoppingBag,
  Calendar,
  MessageSquare,
  Minus,
  Plus as PlusIcon,
  CreditCard,
  Banknote,
  QrCode,
  Send,
  Sparkles,
  User,
  Filter,
  MoreHorizontal,
  Receipt,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Member } from '@/types';

// ==========================================
// Utils
// ==========================================

function maskPhone(phone: string): string {
  if (phone.length === 11) {
    return phone.slice(0, 3) + '****' + phone.slice(7);
  }
  return phone;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatCurrency(n: number): string {
  return '¥' + n.toLocaleString('zh-CN');
}

function formatNumber(n: number): string {
  return n.toLocaleString('zh-CN');
}

function getTierInfo(level: Member['level']) {
  switch (level) {
    case 'platinum':
    case 'gold':
      return {
        label: '金卡会员',
        className: 'bg-gradient-to-br from-[#D4853C] to-[#BF7532] text-white',
        icon: Crown,
        shimmer: true,
      };
    case 'silver':
      return {
        label: '银卡会员',
        className: 'bg-gradient-to-br from-[#A39E99] to-[#8A8580] text-white',
        icon: Crown,
        shimmer: true,
      };
    case 'bronze':
    default:
      return {
        label: '普通会员',
        className: 'bg-[rgba(45,41,38,0.08)] text-[#6B6560]',
        icon: User,
        shimmer: false,
      };
  }
}

function getGenderLabel(g: Member['gender']) {
  switch (g) {
    case 'male': return '男';
    case 'female': return '女';
    default: return '保密';
  }
}

function getNextMemberNo(members: Member[]): string {
  const max = members.reduce((acc, m) => {
    const num = parseInt(m.id.replace('m', ''), 10);
    return num > acc ? num : acc;
  }, 0);
  return `M${String(max + 1).padStart(3, '0')}`;
}

function generateMemberId(members: Member[]): string {
  const max = members.reduce((acc, m) => {
    const num = parseInt(m.id.replace('m', ''), 10);
    return num > acc ? num : acc;
  }, 0);
  return `m${max + 1}`;
}

// ==========================================
// TierBadge Component
// ==========================================

function TierBadge({ level, className }: { level: Member['level']; className?: string }) {
  const info = getTierInfo(level);
  const Icon = info.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-lg px-2.5 py-[3px] text-xs font-medium',
        info.className,
        info.shimmer && 'animate-shimmer bg-[length:200%_200%]',
        className
      )}
      style={
        info.shimmer
          ? {
              backgroundImage: `linear-gradient(135deg, ${level === 'silver' ? '#A39E99, #8A8580, #B8B3AE, #8A8580' : '#D4853C, #BF7532, #E8A96E, #BF7532'})`,
              backgroundSize: '200% 200%',
              animation: 'shimmer 3s ease infinite',
            }
          : undefined
      }
    >
      <Icon className="h-3 w-3" />
      {info.label}
    </span>
  );
}

// ==========================================
// CountUp Component
// ==========================================

// ==========================================
// Mock consumption history for a member
// ==========================================

function generateMockConsumption(memberId: string) {
  const items = [
    { name: '经典纯棉T恤', qty: 2, price: 199 },
    { name: '修身牛仔裤', qty: 1, price: 399 },
    { name: '印花连衣裙', qty: 1, price: 599 },
    { name: '棒球夹克', qty: 1, price: 899 },
    { name: '休闲短裤', qty: 2, price: 149 },
    { name: '羊绒围巾', qty: 1, price: 299 },
  ];
  const paymentLabels: Record<string, string> = { wechat: '微信支付', alipay: '支付宝', cash: '现金', card: '刷卡', stored_value: '储值' };
  const history = [];
  const baseSeed = memberId.charCodeAt(1) || 1;
  for (let i = 0; i < 6; i++) {
    const itemCount = 1 + (baseSeed + i) % 3;
    const orderItems = [];
    let total = 0;
    for (let j = 0; j < itemCount; j++) {
      const item = items[(baseSeed + i + j) % items.length];
      orderItems.push({ ...item, qty: 1 + (baseSeed + j) % 2 });
      total += item.price * (1 + (baseSeed + j) % 2);
    }
    const day = String((baseSeed + i * 3) % 28 + 1).padStart(2, '0');
    const month = String(1 + (baseSeed + i) % 3).padStart(2, '0');
    const methods: Array<keyof typeof paymentLabels> = ['wechat', 'alipay', 'cash', 'card'];
    history.push({
      date: `2025-${month}-${day}`,
      orderNo: `S${String(100000 + baseSeed * 10 + i)}`,
      items: orderItems,
      total,
      payment: paymentLabels[methods[(baseSeed + i) % methods.length]],
    });
  }
  return history;
}

function generateMockPointsHistory(memberId: string) {
  const history = [];
  const reasons = ['消费奖励', '签到奖励', '活动赠送', '积分兑换', '生日 bonus'];
  const baseSeed = memberId.charCodeAt(1) || 1;
  let balance = 0;
  for (let i = 4; i >= 0; i--) {
    const delta = (50 + (baseSeed + i) * 37) % 200 + 10;
    const isEarn = i !== 3;
    const actualDelta = isEarn ? delta : -Math.min(delta, balance);
    balance += actualDelta;
    const day = String((baseSeed + i * 5) % 28 + 1).padStart(2, '0');
    const month = String(1 + (baseSeed + i) % 3).padStart(2, '0');
    history.push({
      date: `2025-${month}-${day}`,
      reason: reasons[(baseSeed + i) % reasons.length],
      delta: actualDelta,
      balance,
    });
  }
  return history;
}

function generateMockStoredValueHistory(memberId: string) {
  const history = [];
  const baseSeed = memberId.charCodeAt(1) || 1;
  const actions = [
    { type: '充值', amount: 500, bonus: 50 },
    { type: '消费', amount: -199, bonus: 0 },
    { type: '充值', amount: 1000, bonus: 120 },
    { type: '消费', amount: -399, bonus: 0 },
    { type: '充值', amount: 200, bonus: 0 },
  ];
  let balance = 0;
  for (let i = 0; i < actions.length; i++) {
    const act = actions[(baseSeed + i) % actions.length];
    const actualAmount = act.type === '充值' ? act.amount : act.amount;
    balance += actualAmount;
    if (act.bonus) balance += act.bonus;
    const day = String((baseSeed * 3 + i * 7) % 28 + 1).padStart(2, '0');
    const month = String(1 + (baseSeed + i * 2) % 3).padStart(2, '0');
    history.push({
      date: `2025-${month}-${day}`,
      type: act.type,
      amount: actualAmount,
      bonus: act.bonus,
      balance,
    });
  }
  return history;
}

// ==========================================
// Main Members Page
// ==========================================

export default function Members() {
  const { state, dispatch } = useApp();
  const { members } = state;

  // ---- Filter state ----
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [showFilters, setShowFilters] = useState(false);

  // ---- Drawer & Modal state ----
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showMarketing, setShowMarketing] = useState(false);

  // ---- Derived data ----
  const filteredMembers = useMemo(() => {
    let list = [...members];

    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.phone.includes(q) ||
        m.id.toLowerCase().includes(q)
      );
    }

    // Tier filter
    if (tierFilter !== 'all') {
      list = list.filter(m => m.level === tierFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date('2025-04-02');
      list = list.filter(m => {
        const d = new Date(m.createdAt);
        if (dateFilter === 'today') {
          return d.toDateString() === now.toDateString();
        }
        if (dateFilter === 'week') {
          const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
          return d >= weekAgo;
        }
        if (dateFilter === 'month') {
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }
        if (dateFilter === 'year') {
          return d.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'recent') {
        return (b.lastPurchaseDate || '') > (a.lastPurchaseDate || '') ? 1 : -1;
      }
      if (sortBy === 'points') return b.points - a.points;
      if (sortBy === 'stored') return b.storedValue - a.storedValue;
      if (sortBy === 'spent') return b.totalSpent - a.totalSpent;
      return 0;
    });

    return list;
  }, [members, search, tierFilter, dateFilter, sortBy]);

  const newThisMonth = useMemo(() => {
    const now = new Date('2025-04-02');
    return members.filter(m => {
      const d = new Date(m.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [members]);

  const activeMembers = useMemo(() => {
    const monthAgo = new Date('2025-04-02'); monthAgo.setDate(monthAgo.getDate() - 30);
    return members.filter(m => m.lastPurchaseDate && new Date(m.lastPurchaseDate) >= monthAgo).length;
  }, [members]);

  // ---- Handlers ----
  const openMemberDetail = useCallback((member: Member) => {
    setSelectedMember(member);
    setShowDrawer(true);
  }, []);

  const handleAddMember = useCallback((formData: Partial<Member>) => {
    const id = generateMemberId(members);
    const newMember: Member = {
      id,
      name: formData.name || '未命名',
      phone: formData.phone || '',
      gender: (formData.gender as Member['gender']) || 'other',
      birthday: formData.birthday,
      level: 'bronze',
      points: 0,
      storedValue: 0,
      totalSpent: 0,
      totalOrders: 0,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      notes: formData.notes || '',
    };
    dispatch({ type: 'ADD_MEMBER', payload: newMember });
    setShowAddModal(false);
  }, [members, dispatch]);

  const handlePointsAdjust = useCallback((memberId: string, delta: number, _reason: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    const updated: Member = {
      ...member,
      points: Math.max(0, member.points + delta),
    };
    dispatch({ type: 'UPDATE_MEMBER', payload: updated });
    setShowPointsModal(false);
    setSelectedMember(updated);
  }, [members, dispatch]);

  const handleTopUp = useCallback((memberId: string, amount: number, _method: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    let bonus = 0;
    if (amount >= 1000) bonus = 150;
    else if (amount >= 500) bonus = 50;
    else if (amount >= 200) bonus = 15;
    const updated: Member = {
      ...member,
      storedValue: member.storedValue + amount + bonus,
    };
    dispatch({ type: 'UPDATE_MEMBER', payload: updated });
    setShowTopUpModal(false);
    setSelectedMember(updated);
  }, [members, dispatch]);

  return (
    <div className="space-y-6">
      {/* ---- Shimmer keyframes (scoped style) ---- */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      {/* ====== PAGE HEADER ====== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-[32px] font-semibold leading-tight text-[#2D2926]">
            会员管理
          </h1>
          <p className="mt-1 text-sm text-[#A39E99]">
            管理会员信息、积分、储值与营销活动
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#4A9B8E]">
            本月新增: +{newThisMonth}人
          </span>
          <span className="text-xs text-[#A39E99]">
            活跃会员: {activeMembers}人
          </span>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#D4853C] px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#BF7532] hover:shadow-[0_2px_8px_rgba(212,133,60,0.30)] hover:-translate-y-0.5 active:translate-y-0"
          >
            <UserPlus className="h-4 w-4" />
            新增会员
          </button>
        </div>
      </div>

      {/* ====== FILTER BAR ====== */}
      <div className="rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(45,41,38,0.06)]">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#A39E99]" />
            <input
              type="text"
              placeholder="搜索会员号、姓名、手机号..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-[rgba(45,41,38,0.12)] bg-white py-0 pl-10 pr-3 text-sm text-[#2D2926] transition-all placeholder:text-[#A39E99] focus:border-[#D4853C] focus:shadow-[0_0_0_3px_rgba(212,133,60,0.12)] focus:outline-none"
            />
          </div>

          {/* Tier filter */}
          <select
            value={tierFilter}
            onChange={e => setTierFilter(e.target.value)}
            className="h-10 rounded-xl border border-[rgba(45,41,38,0.12)] bg-white px-3 text-sm text-[#2D2926] focus:border-[#D4853C] focus:outline-none"
          >
            <option value="all">全部等级</option>
            <option value="gold">金卡会员</option>
            <option value="silver">银卡会员</option>
            <option value="bronze">普通会员</option>
          </select>

          {/* Date filter */}
          <select
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="h-10 rounded-xl border border-[rgba(45,41,38,0.12)] bg-white px-3 text-sm text-[#2D2926] focus:border-[#D4853C] focus:outline-none"
          >
            <option value="all">全部时间</option>
            <option value="today">今日</option>
            <option value="week">本周</option>
            <option value="month">本月</option>
            <option value="year">本年</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="h-10 rounded-xl border border-[rgba(45,41,38,0.12)] bg-white px-3 text-sm text-[#2D2926] focus:border-[#D4853C] focus:outline-none"
          >
            <option value="recent">最近消费</option>
            <option value="points">积分</option>
            <option value="stored">储值金额</option>
            <option value="spent">累计消费</option>
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[rgba(45,41,38,0.12)] px-3 text-sm text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.04)]"
          >
            <Filter className="h-4 w-4" />
            更多
          </button>
        </div>
      </div>

      {/* ====== ACTION TOOLBAR ====== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[rgba(45,41,38,0.12)] px-3 text-sm text-[#2D2926] transition-colors hover:bg-[rgba(45,41,38,0.04)]">
            <Upload className="h-4 w-4" />
            导入
          </button>
          <button className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[rgba(45,41,38,0.12)] px-3 text-sm text-[#2D2926] transition-colors hover:bg-[rgba(45,41,38,0.04)]">
            <Download className="h-4 w-4" />
            导出
          </button>
        </div>
        <span className="text-xs text-[#A39E99]">
          共 {formatNumber(filteredMembers.length)} 人
        </span>
      </div>

      {/* ====== MEMBER TABLE ====== */}
      <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(45,41,38,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[rgba(45,41,38,0.08)]">
                <th className="w-12 px-4 py-3">
                  <input type="checkbox" className="rounded border-[rgba(45,41,38,0.12)]" />
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">会员号</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">姓名</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">等级</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">手机号</th>
                <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">积分</th>
                <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">储值余额</th>
                <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">累计消费</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">最近消费</th>
                <th className="w-16 px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center">
                    <User className="mx-auto h-12 w-12 text-[#A39E99] opacity-40" />
                    <p className="mt-3 text-sm font-medium text-[#6B6560]">暂无数据</p>
                    <p className="mt-1 text-xs text-[#A39E99]">没有找到符合条件的会员</p>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member, idx) => (
                  <motion.tr
                    key={member.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.3 }}
                    className="group border-b border-[rgba(45,41,38,0.08)] transition-colors hover:bg-[rgba(45,41,38,0.03)] cursor-pointer"
                    onClick={() => openMemberDetail(member)}
                  >
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" className="rounded border-[rgba(45,41,38,0.12)]" />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#2D2926]">{member.id.replace('m', 'M')}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[#2D2926]">{member.name}</td>
                    <td className="px-4 py-3">
                      <TierBadge level={member.level} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#6B6560]">{maskPhone(member.phone)}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-[#2D2926]">{formatNumber(member.points)}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-[#2D2926]">
                      {member.storedValue === 0 ? (
                        <span className="text-[#A39E99]">¥0</span>
                      ) : (
                        formatCurrency(member.storedValue)
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-[#2D2926]">{formatCurrency(member.totalSpent)}</td>
                    <td className="px-4 py-3 text-xs text-[#6B6560]">{member.lastPurchaseDate || '-'}</td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => openMemberDetail(member)}
                        className="inline-flex h-8 items-center rounded-lg px-2 text-xs text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.06)] hover:text-[#2D2926]"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ====== MARKETING PANEL ====== */}
      <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(45,41,38,0.06)] overflow-hidden">
        <button
          onClick={() => setShowMarketing(!showMarketing)}
          className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[rgba(45,41,38,0.02)]"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#D4853C]" />
            <span className="text-base font-semibold text-[#2D2926]">会员营销</span>
          </div>
          {showMarketing ? <ChevronUp className="h-5 w-5 text-[#A39E99]" /> : <ChevronDown className="h-5 w-5 text-[#A39E99]" />}
        </button>
        <AnimatePresence>
          {showMarketing && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="border-t border-[rgba(45,41,38,0.08)] px-5 py-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Coupon */}
                  <MarketingCard icon={Gift} title="优惠推送" desc="创建优惠券并推送给目标会员">
                    <button className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#D4853C] px-4 text-sm font-medium text-white transition-all hover:bg-[#BF7532]">
                      <Send className="h-4 w-4" />
                      发放优惠券
                    </button>
                  </MarketingCard>
                  {/* Birthday */}
                  <MarketingCard icon={Calendar} title="生日提醒" desc={`本月 ${members.filter(m => {
                    if (!m.birthday) return false;
                    const d = new Date(m.birthday);
                    return d.getMonth() === 3; // April
                  }).length} 位会员过生日`}>
                    <button className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-xl border border-[rgba(45,41,38,0.12)] px-4 text-sm text-[#2D2926] transition-colors hover:bg-[rgba(45,41,38,0.04)]">
                      <MessageSquare className="h-4 w-4" />
                      发送祝福
                    </button>
                  </MarketingCard>
                  {/* Activity */}
                  <MarketingCard icon={Sparkles} title="会员活动" desc="配置会员日、积分翻倍等活动">
                    <button className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-xl border border-[rgba(45,41,38,0.12)] px-4 text-sm text-[#2D2926] transition-colors hover:bg-[rgba(45,41,38,0.04)]">
                      <Plus className="h-4 w-4" />
                      创建活动
                    </button>
                  </MarketingCard>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ====== MEMBER DETAIL DRAWER ====== */}
      <AnimatePresence>
        {showDrawer && selectedMember && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-[rgba(45,41,38,0.40)] backdrop-blur-sm"
              onClick={() => setShowDrawer(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[520px] overflow-y-auto bg-white shadow-[-8px_0_32px_rgba(45,41,38,0.12)]"
            >
              <MemberDetail
                member={selectedMember}
                onClose={() => setShowDrawer(false)}
                onAdjustPoints={() => setShowPointsModal(true)}
                onTopUp={() => setShowTopUpModal(true)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ====== ADD MEMBER MODAL ====== */}
      <AnimatePresence>
        {showAddModal && (
          <AddMemberModal
            onClose={() => setShowAddModal(false)}
            onSave={handleAddMember}
            members={members}
          />
        )}
      </AnimatePresence>

      {/* ====== POINTS ADJUSTMENT MODAL ====== */}
      <AnimatePresence>
        {showPointsModal && selectedMember && (
          <PointsAdjustmentModal
            member={selectedMember}
            onClose={() => setShowPointsModal(false)}
            onConfirm={handlePointsAdjust}
          />
        )}
      </AnimatePresence>

      {/* ====== TOP-UP MODAL ====== */}
      <AnimatePresence>
        {showTopUpModal && selectedMember && (
          <TopUpModal
            member={selectedMember}
            onClose={() => setShowTopUpModal(false)}
            onConfirm={handleTopUp}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// Marketing Card
// ==========================================

function MarketingCard({ icon: Icon, title, desc, children }: { icon: React.ElementType; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[rgba(45,41,38,0.08)] p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-[#D4853C]" />
        <span className="text-sm font-semibold text-[#2D2926]">{title}</span>
      </div>
      <p className="mt-1 text-xs text-[#6B6560]">{desc}</p>
      {children}
    </div>
  );
}

// ==========================================
// Member Detail (Drawer Content)
// ==========================================

function MemberDetail({ member, onClose, onAdjustPoints, onTopUp }: {
  member: Member;
  onClose: () => void;
  onAdjustPoints: () => void;
  onTopUp: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'consumption' | 'points' | 'stored'>('consumption');

  const consumptionHistory = useMemo(() => generateMockConsumption(member.id), [member.id]);
  const pointsHistory = useMemo(() => generateMockPointsHistory(member.id), [member.id]);
  const storedValueHistory = useMemo(() => generateMockStoredValueHistory(member.id), [member.id]);

  const avgOrder = member.totalOrders > 0 ? Math.round(member.totalSpent / member.totalOrders) : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(212,133,60,0.12)]">
            <User className="h-6 w-6 text-[#D4853C]" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#2D2926]">{member.name}</h2>
            <div className="mt-1 flex items-center gap-2">
              <TierBadge level={member.level} />
              <span className="text-xs text-[#A39E99]">注册于 {formatDate(member.createdAt)}</span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#A39E99] transition-colors hover:bg-[rgba(45,41,38,0.06)] hover:text-[#2D2926]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Basic Info */}
      <div className="rounded-2xl bg-[#F8F5F2] p-5">
        <h3 className="mb-3 text-sm font-semibold text-[#2D2926]">基本信息</h3>
        <div className="grid grid-cols-2 gap-3">
          <InfoRow label="会员号" value={member.id.replace('m', 'M')} mono />
          <InfoRow label="手机号" value={maskPhone(member.phone)} />
          <InfoRow label="性别" value={getGenderLabel(member.gender)} />
          <InfoRow label="生日" value={member.birthday || '-'} />
          <InfoRow label="状态" value={member.status === 'active' ? '正常' : '冻结'} />
          <InfoRow label="备注" value={member.notes || '-'} />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <MiniStatCard label="累计消费" value={formatCurrency(member.totalSpent)} icon={TrendingUp} />
        <MiniStatCard label="消费次数" value={`${member.totalOrders}次`} icon={ShoppingBag} />
        <MiniStatCard label="平均客单价" value={formatCurrency(avgOrder)} icon={Receipt} />
      </div>

      {/* Points & Stored Value */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white border border-[rgba(45,41,38,0.08)] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#A39E99]">当前积分</span>
            <Gift className="h-4 w-4 text-[#D4853C]" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-[#2D2926]">{formatNumber(member.points)}</p>
          <button
            onClick={onAdjustPoints}
            className="mt-3 inline-flex h-8 items-center gap-1 rounded-lg border border-[rgba(45,41,38,0.12)] px-3 text-xs text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.04)]"
          >
            调整积分
          </button>
        </div>
        <div className="rounded-2xl bg-white border border-[rgba(45,41,38,0.08)] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#A39E99]">储值余额</span>
            <Wallet className="h-4 w-4 text-[#4A9B8E]" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-[#2D2926]">{formatCurrency(member.storedValue)}</p>
          <button
            onClick={onTopUp}
            className="mt-3 inline-flex h-8 items-center gap-1 rounded-lg bg-[#D4853C] px-3 text-xs font-medium text-white transition-colors hover:bg-[#BF7532]"
          >
            充值
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-[#F8F5F2] p-1">
        {[
          { key: 'consumption' as const, label: '消费记录' },
          { key: 'points' as const, label: '积分明细' },
          { key: 'stored' as const, label: '储值明细' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex-1 rounded-lg py-2 text-xs font-medium transition-all',
              activeTab === tab.key
                ? 'bg-white font-semibold text-[#2D2926] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                : 'text-[#6B6560] hover:text-[#2D2926]'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-3">
        {activeTab === 'consumption' && consumptionHistory.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="rounded-xl border border-[rgba(45,41,38,0.08)] p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#2D2926]">{item.orderNo}</p>
                <p className="text-xs text-[#A39E99]">{item.date}</p>
              </div>
              <span className="font-mono text-sm font-semibold text-[#2D2926]">{formatCurrency(item.total)}</span>
            </div>
            <div className="mt-2 space-y-1">
              {item.items.map((it, j) => (
                <div key={j} className="flex items-center justify-between text-xs text-[#6B6560]">
                  <span>{it.name} x{it.qty}</span>
                  <span>¥{it.price}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-xs text-[#A39E99]">支付方式: {item.payment}</div>
          </motion.div>
        ))}

        {activeTab === 'points' && (
          <div className="rounded-xl border border-[rgba(45,41,38,0.08)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#F8F5F2]">
                <tr>
                  <th className="px-4 py-2 text-left text-xs text-[#A39E99]">日期</th>
                  <th className="px-4 py-2 text-left text-xs text-[#A39E99]">事由</th>
                  <th className="px-4 py-2 text-right text-xs text-[#A39E99]">变动</th>
                  <th className="px-4 py-2 text-right text-xs text-[#A39E99]">余额</th>
                </tr>
              </thead>
              <tbody>
                {pointsHistory.map((item, idx) => (
                  <tr key={idx} className="border-t border-[rgba(45,41,38,0.08)]">
                    <td className="px-4 py-2 text-xs text-[#6B6560]">{item.date}</td>
                    <td className="px-4 py-2 text-xs text-[#2D2926]">{item.reason}</td>
                    <td className={cn('px-4 py-2 text-right font-mono text-xs', item.delta >= 0 ? 'text-[#4A9B8E]' : 'text-[#C75C3A]')}>
                      {item.delta >= 0 ? '+' : ''}{item.delta}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-xs text-[#2D2926]">{item.balance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'stored' && (
          <div className="rounded-xl border border-[rgba(45,41,38,0.08)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#F8F5F2]">
                <tr>
                  <th className="px-4 py-2 text-left text-xs text-[#A39E99]">日期</th>
                  <th className="px-4 py-2 text-left text-xs text-[#A39E99]">类型</th>
                  <th className="px-4 py-2 text-right text-xs text-[#A39E99]">金额</th>
                  <th className="px-4 py-2 text-right text-xs text-[#A39E99]">余额</th>
                </tr>
              </thead>
              <tbody>
                {storedValueHistory.map((item, idx) => (
                  <tr key={idx} className="border-t border-[rgba(45,41,38,0.08)]">
                    <td className="px-4 py-2 text-xs text-[#6B6560]">{item.date}</td>
                    <td className="px-4 py-2 text-xs text-[#2D2926]">
                      <span className={cn(
                        'rounded-md px-2 py-0.5 text-[11px]',
                        item.type === '充值' ? 'bg-[rgba(74,155,142,0.10)] text-[#4A9B8E]' : 'bg-[rgba(212,133,60,0.10)] text-[#D4853C]'
                      )}>
                        {item.type}
                      </span>
                    </td>
                    <td className={cn('px-4 py-2 text-right font-mono text-xs', item.amount >= 0 ? 'text-[#4A9B8E]' : 'text-[#C75C3A]')}>
                      {item.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(item.amount))}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-xs text-[#2D2926]">{formatCurrency(item.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// Info Row
// ==========================================

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] text-[#A39E99]">{label}</p>
      <p className={cn('mt-0.5 text-sm text-[#2D2926]', mono && 'font-mono')}>{value}</p>
    </div>
  );
}

// ==========================================
// Mini Stat Card
// ==========================================

function MiniStatCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="rounded-xl border border-[rgba(45,41,38,0.08)] p-4 text-center">
      <Icon className="mx-auto h-5 w-5 text-[#A39E99]" />
      <p className="mt-2 font-mono text-lg font-semibold text-[#2D2926]">{value}</p>
      <p className="text-[11px] text-[#A39E99]">{label}</p>
    </div>
  );
}

// ==========================================
// Add Member Modal
// ==========================================

function AddMemberModal({ onClose, onSave, members }: {
  onClose: () => void;
  onSave: (data: Partial<Member>) => void;
  members: Member[];
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<Member['gender']>('other');
  const [birthday, setBirthday] = useState('');
  const [preferences, setPreferences] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const memberNo = useMemo(() => getNextMemberNo(members), [members]);

  const prefOptions = ['上衣', '裤子', '裙子', '配饰', '外套'];

  const togglePref = (p: string) => {
    setPreferences(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const handleSubmit = () => {
    if (!name.trim() || !phone.trim()) return;
    onSave({ name: name.trim(), phone, gender, birthday: birthday || undefined, notes });
  };

  return (
    <ModalWrapper onClose={onClose} width="480px">
      <h2 className="text-xl font-semibold text-[#2D2926]">新增会员</h2>
      <p className="mt-1 text-xs text-[#A39E99]">会员号将自动生成: {memberNo}</p>

      <div className="mt-5 space-y-4">
        <FormField label="姓名 *">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="请输入姓名"
            className="h-11 w-full rounded-xl border border-[rgba(45,41,38,0.12)] bg-white px-3.5 text-sm text-[#2D2926] placeholder:text-[#A39E99] focus:border-[#D4853C] focus:shadow-[0_0_0_3px_rgba(212,133,60,0.12)] focus:outline-none"
          />
        </FormField>

        <FormField label="手机号 *">
          <input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="请输入手机号"
            className="h-11 w-full rounded-xl border border-[rgba(45,41,38,0.12)] bg-white px-3.5 text-sm text-[#2D2926] placeholder:text-[#A39E99] focus:border-[#D4853C] focus:shadow-[0_0_0_3px_rgba(212,133,60,0.12)] focus:outline-none"
          />
        </FormField>

        <FormField label="性别">
          <div className="flex gap-4">
            {([['male', '男'], ['female', '女'], ['other', '保密']] as const).map(([val, label]) => (
              <label key={val} className="flex cursor-pointer items-center gap-2 text-sm text-[#2D2926]">
                <input
                  type="radio"
                  name="gender"
                  checked={gender === val}
                  onChange={() => setGender(val)}
                  className="text-[#D4853C] focus:ring-[#D4853C]"
                />
                {label}
              </label>
            ))}
          </div>
        </FormField>

        <FormField label="生日">
          <input
            type="date"
            value={birthday}
            onChange={e => setBirthday(e.target.value)}
            className="h-11 w-full rounded-xl border border-[rgba(45,41,38,0.12)] bg-white px-3.5 text-sm text-[#2D2926] focus:border-[#D4853C] focus:shadow-[0_0_0_3px_rgba(212,133,60,0.12)] focus:outline-none"
          />
        </FormField>

        <FormField label="偏好品类">
          <div className="flex flex-wrap gap-2">
            {prefOptions.map(p => (
              <button
                key={p}
                onClick={() => togglePref(p)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                  preferences.includes(p)
                    ? 'bg-[#D4853C] text-white'
                    : 'bg-[#F8F5F2] text-[#6B6560] hover:bg-[rgba(45,41,38,0.08)]'
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="备注">
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="可选填"
            rows={3}
            className="w-full rounded-xl border border-[rgba(45,41,38,0.12)] bg-white px-3.5 py-2.5 text-sm text-[#2D2926] placeholder:text-[#A39E99] focus:border-[#D4853C] focus:shadow-[0_0_0_3px_rgba(212,133,60,0.12)] focus:outline-none resize-none"
          />
        </FormField>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="h-10 rounded-xl border border-[rgba(45,41,38,0.12)] px-5 text-sm font-medium text-[#2D2926] transition-colors hover:bg-[rgba(45,41,38,0.04)]"
        >
          取消
        </button>
        <button
          onClick={handleSubmit}
          disabled={!name.trim() || !phone.trim()}
          className="h-10 rounded-xl bg-[#D4853C] px-5 text-sm font-semibold text-white transition-all hover:bg-[#BF7532] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          保存
        </button>
      </div>
    </ModalWrapper>
  );
}

// ==========================================
// Points Adjustment Modal
// ==========================================

function PointsAdjustmentModal({ member, onClose, onConfirm }: {
  member: Member;
  onClose: () => void;
  onConfirm: (id: string, delta: number, reason: string) => void;
}) {
  const [mode, setMode] = useState<'add' | 'deduct'>('add');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('手动调整');

  const reasonOptions = ['消费奖励', '活动赠送', '积分兑换', '手动调整', '其他'];

  const handleConfirm = () => {
    const val = parseInt(amount, 10);
    if (isNaN(val) || val <= 0) return;
    onConfirm(member.id, mode === 'add' ? val : -val, reason);
  };

  return (
    <ModalWrapper onClose={onClose} width="400px">
      <h2 className="text-xl font-semibold text-[#2D2926]">调整积分</h2>
      <p className="mt-1 text-xs text-[#A39E99]">当前积分: <span className="font-mono font-semibold text-[#2D2926]">{formatNumber(member.points)}</span></p>

      <div className="mt-5 space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setMode('add')}
            className={cn(
              'flex-1 rounded-xl py-2.5 text-sm font-medium transition-all',
              mode === 'add' ? 'bg-[#4A9B8E] text-white' : 'bg-[#F8F5F2] text-[#6B6560]'
            )}
          >
            <PlusIcon className="mx-auto h-4 w-4" />
            增加
          </button>
          <button
            onClick={() => setMode('deduct')}
            className={cn(
              'flex-1 rounded-xl py-2.5 text-sm font-medium transition-all',
              mode === 'deduct' ? 'bg-[#C75C3A] text-white' : 'bg-[#F8F5F2] text-[#6B6560]'
            )}
          >
            <Minus className="mx-auto h-4 w-4" />
            扣除
          </button>
        </div>

        <FormField label="积分数额">
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="输入积分数额"
            min={1}
            className="h-11 w-full rounded-xl border border-[rgba(45,41,38,0.12)] bg-white px-3.5 text-sm text-[#2D2926] placeholder:text-[#A39E99] focus:border-[#D4853C] focus:shadow-[0_0_0_3px_rgba(212,133,60,0.12)] focus:outline-none"
          />
        </FormField>

        <FormField label="原因">
          <select
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="h-11 w-full rounded-xl border border-[rgba(45,41,38,0.12)] bg-white px-3.5 text-sm text-[#2D2926] focus:border-[#D4853C] focus:outline-none"
          >
            {reasonOptions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </FormField>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} className="h-10 rounded-xl border border-[rgba(45,41,38,0.12)] px-5 text-sm font-medium text-[#2D2926] transition-colors hover:bg-[rgba(45,41,38,0.04)]">
          取消
        </button>
        <button
          onClick={handleConfirm}
          disabled={!amount || parseInt(amount, 10) <= 0}
          className="h-10 rounded-xl bg-[#D4853C] px-5 text-sm font-semibold text-white transition-all hover:bg-[#BF7532] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          确认
        </button>
      </div>
    </ModalWrapper>
  );
}

// ==========================================
// Top-Up Modal
// ==========================================

function TopUpModal({ member, onClose, onConfirm }: {
  member: Member;
  onClose: () => void;
  onConfirm: (id: string, amount: number, method: string) => void;
}) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [method, setMethod] = useState('wechat');

  const quickAmounts = [100, 200, 500, 1000];

  const finalAmount = selectedAmount ?? (parseInt(customAmount, 10) || 0);

  const getBonus = (amt: number) => {
    if (amt >= 1000) return 150;
    if (amt >= 500) return 50;
    if (amt >= 200) return 15;
    return 0;
  };

  const bonus = getBonus(finalAmount);

  const handleConfirm = () => {
    if (finalAmount <= 0) return;
    onConfirm(member.id, finalAmount, method);
  };

  const methods: Array<{ key: string; label: string; icon: React.ElementType }> = [
    { key: 'wechat', label: '微信支付', icon: QrCode },
    { key: 'alipay', label: '支付宝', icon: QrCode },
    { key: 'cash', label: '现金', icon: Banknote },
    { key: 'card', label: '刷卡', icon: CreditCard },
  ];

  return (
    <ModalWrapper onClose={onClose} width="440px">
      <h2 className="text-xl font-semibold text-[#2D2926]">会员充值</h2>
      <p className="mt-1 text-xs text-[#A39E99]">当前余额: <span className="font-mono font-semibold text-[#2D2926]">{formatCurrency(member.storedValue)}</span></p>

      <div className="mt-5 space-y-5">
        {/* Quick amounts */}
        <div>
          <label className="mb-2 block text-xs font-medium text-[#2D2926]">快捷金额</label>
          <div className="grid grid-cols-4 gap-2">
            {quickAmounts.map(amt => (
              <button
                key={amt}
                onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                className={cn(
                  'rounded-xl py-2.5 text-sm font-medium transition-all',
                  selectedAmount === amt
                    ? 'bg-[#D4853C] text-white shadow-[0_2px_8px_rgba(212,133,60,0.25)]'
                    : 'bg-[#F8F5F2] text-[#2D2926] hover:bg-[rgba(45,41,38,0.08)]'
                )}
              >
                ¥{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Custom amount */}
        <FormField label="自定义金额">
          <input
            type="number"
            value={customAmount}
            onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
            placeholder="输入充值金额"
            className="h-11 w-full rounded-xl border border-[rgba(45,41,38,0.12)] bg-white px-3.5 text-sm text-[#2D2926] placeholder:text-[#A39E99] focus:border-[#D4853C] focus:shadow-[0_0_0_3px_rgba(212,133,60,0.12)] focus:outline-none"
          />
        </FormField>

        {/* Bonus */}
        {bonus > 0 && (
          <div className="rounded-xl bg-[rgba(74,155,142,0.10)] p-3 text-center">
            <span className="text-xs text-[#4A9B8E]">充¥{finalAmount}送 </span>
            <span className="font-mono text-sm font-semibold text-[#4A9B8E]">¥{bonus}</span>
          </div>
        )}

        {/* Payment method */}
        <div>
          <label className="mb-2 block text-xs font-medium text-[#2D2926]">支付方式</label>
          <div className="grid grid-cols-2 gap-2">
            {methods.map(m => (
              <button
                key={m.key}
                onClick={() => setMethod(m.key)}
                className={cn(
                  'flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-all',
                  method === m.key
                    ? 'border-[#D4853C] bg-[rgba(212,133,60,0.08)] text-[#2D2926]'
                    : 'border-[rgba(45,41,38,0.12)] text-[#6B6560] hover:bg-[rgba(45,41,38,0.04)]'
                )}
              >
                <m.icon className="h-4 w-4" />
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} className="h-10 rounded-xl border border-[rgba(45,41,38,0.12)] px-5 text-sm font-medium text-[#2D2926] transition-colors hover:bg-[rgba(45,41,38,0.04)]">
          取消
        </button>
        <button
          onClick={handleConfirm}
          disabled={finalAmount <= 0}
          className="h-10 rounded-xl bg-[#D4853C] px-5 text-sm font-semibold text-white transition-all hover:bg-[#BF7532] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          确认充值
        </button>
      </div>
    </ModalWrapper>
  );
}

// ==========================================
// Modal Wrapper
// ==========================================

function ModalWrapper({ children, onClose, width = '480px' }: {
  children: React.ReactNode;
  onClose: () => void;
  width?: string;
}) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-[rgba(45,41,38,0.40)] backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
        className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[20px] bg-white shadow-[0_20px_60px_rgba(45,41,38,0.15)]"
        style={{ width }}
      >
        <div className="p-6">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-[#A39E99] transition-colors hover:bg-[rgba(45,41,38,0.06)] hover:text-[#2D2926]"
          >
            <X className="h-5 w-5" />
          </button>
          {children}
        </div>
      </motion.div>
    </>
  );
}

// ==========================================
// Form Field
// ==========================================

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[#2D2926]">{label}</label>
      {children}
    </div>
  );
}
