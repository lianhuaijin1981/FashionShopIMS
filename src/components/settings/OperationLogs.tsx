import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ScrollText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ---- Types ----
interface OperationLog {
  id: string;
  time: string;
  user: string;
  module: string;
  actionType: string;
  actionLabel: string;
  content: string;
  result: 'success' | 'failed';
  ip: string;
  detail?: string;
  before?: string;
  after?: string;
}

// ---- Mock Data: 50+ realistic operation logs ----
const MODULES = ['销售', '库存', '商品', '采购', '会员', '系统', '数据分析'];
const USERS = ['张丽', '王强', '李明', '李梅', '陈刚', '赵敏', '系统', '刘芳'];

const ACTION_TYPES: Record<string, { label: string; color: string }> = {
  login: { label: '登录', color: 'bg-[rgba(45,41,38,0.08)] text-[#6B6560]' },
  add: { label: '新增', color: 'bg-[rgba(74,155,142,0.10)] text-[#4A9B8E]' },
  edit: { label: '编辑', color: 'bg-[rgba(212,133,60,0.12)] text-[#D4853C]' },
  delete: { label: '删除', color: 'bg-[rgba(199,92,58,0.10)] text-[#C75C3A]' },
  view: { label: '查看', color: 'bg-[rgba(163,158,153,0.12)] text-[#A39E99]' },
  export: { label: '导出', color: 'bg-[rgba(107,101,96,0.10)] text-[#6B6560]' },
  pos: { label: '收银', color: 'bg-[rgba(74,155,142,0.10)] text-[#4A9B8E]' },
  inbound: { label: '入库', color: 'bg-[rgba(212,133,60,0.12)] text-[#D4853C]' },
  count: { label: '盘点', color: 'bg-[rgba(107,101,96,0.10)] text-[#6B6560]' },
  alert: { label: '预警', color: 'bg-[rgba(199,92,58,0.10)] text-[#C75C3A]' },
  backup: { label: '备份', color: 'bg-[rgba(74,155,142,0.10)] text-[#4A9B8E]' },
  restore: { label: '恢复', color: 'bg-[rgba(212,133,60,0.12)] text-[#D4853C]' },
};

function generateMockLogs(): OperationLog[] {
  const logs: OperationLog[] = [];
  const contents = [
    { module: '销售', actionType: 'pos', content: '创建销售单 {ORDER}', result: 'success' as const },
    { module: '销售', actionType: 'add', content: '新增会员消费记录', result: 'success' as const },
    { module: '库存', actionType: 'inbound', content: '入库{NUM}件 {SKU}-{COLOR}-{SIZE}', result: 'success' as const },
    { module: '库存', actionType: 'edit', content: '调整库存 {SKU}-{COLOR}-{SIZE} 从{OLD}到{NEW}', result: 'success' as const },
    { module: '库存', actionType: 'count', content: '完成盘点任务 #{ID}', result: 'success' as const },
    { module: '库存', actionType: 'alert', content: '{SKU}-{COLOR}-{SIZE} 库存不足', result: 'success' as const },
    { module: '商品', actionType: 'add', content: '新增商品 {SKU} {NAME}', result: 'success' as const },
    { module: '商品', actionType: 'edit', content: '编辑商品 {SKU} 价格信息', result: 'success' as const },
    { module: '商品', actionType: 'delete', content: '删除商品 {SKU}', result: 'success' as const },
    { module: '采购', actionType: 'add', content: '创建采购计划 #{ID}', result: 'success' as const },
    { module: '采购', actionType: 'edit', content: '审核采购订单 #{ID}', result: 'success' as const },
    { module: '会员', actionType: 'add', content: '新增会员 {PHONE}', result: 'success' as const },
    { module: '会员', actionType: 'edit', content: '会员积分调整 +{NUM}', result: 'success' as const },
    { module: '系统', actionType: 'login', content: '用户登录成功', result: 'success' as const },
    { module: '系统', actionType: 'edit', content: '修改系统设置', result: 'success' as const },
    { module: '数据分析', actionType: 'view', content: '查看销售报表', result: 'success' as const },
    { module: '数据分析', actionType: 'export', content: '导出销售数据', result: 'success' as const },
    { module: '系统', actionType: 'backup', content: '执行数据备份', result: 'success' as const },
  ];

  const skus = ['A1001', 'A1002', 'B2001', 'B2002', 'C3001', 'D4001', 'E5001'];
  const colors = ['黑色', '白色', '灰色', '蓝色', '酒红', '卡其'];
  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
  const names = ['经典款T恤', '印花卫衣', '修身牛仔裤', '商务衬衫', '羊毛大衣'];

  let id = 1;
  const baseDate = new Date('2025-04-02T18:00:00');

  for (let day = 0; day < 7; day++) {
    const dayLogs = 7 + Math.floor(Math.random() * 5);
    for (let i = 0; i < dayLogs; i++) {
      const template = contents[Math.floor(Math.random() * contents.length)];
      const date = new Date(baseDate.getTime() - day * 86400000 - i * 3600000 * (1 + Math.floor(Math.random() * 3)));
      const timeStr = date.toISOString().slice(0, 16).replace('T', ' ');

      let content = template.content
        .replace('{ORDER}', `XS${timeStr.slice(0, 10).replace(/-/g, '')}${String(1000 + id).slice(1)}`)
        .replace('{NUM}', String(Math.floor(Math.random() * 50) + 1))
        .replace('{SKU}', skus[Math.floor(Math.random() * skus.length)])
        .replace('{COLOR}', colors[Math.floor(Math.random() * colors.length)])
        .replace('{SIZE}', sizes[Math.floor(Math.random() * sizes.length)])
        .replace('{NAME}', names[Math.floor(Math.random() * names.length)])
        .replace('{OLD}', String(Math.floor(Math.random() * 100)))
        .replace('{NEW}', String(Math.floor(Math.random() * 100)))
        .replace('{ID}', String(100 + id))
        .replace('{PHONE}', `138${String(Math.floor(10000000 + Math.random() * 90000000))}`);

      const user = template.module === '系统' && (template.actionType === 'backup' || template.actionType === 'alert')
        ? '系统'
        : USERS[Math.floor(Math.random() * (USERS.length - 1))];

      logs.push({
        id: `log_${id}`,
        time: timeStr,
        user,
        module: template.module,
        actionType: template.actionType,
        actionLabel: ACTION_TYPES[template.actionType]?.label || template.actionType,
        content,
        result: template.result,
        ip: user === '系统' ? '—' : `192.168.1.${Math.floor(Math.random() * 20) + 1}`,
        detail: `操作详情: ${content}\n操作人: ${user}\n时间: ${timeStr}`,
      });
      id++;
    }
  }

  // Add a few failed attempts
  logs.push({
    id: `log_${id++}`,
    time: '2025-04-02 09:15',
    user: '赵敏',
    module: '系统',
    actionType: 'login',
    actionLabel: '登录',
    content: '用户登录失败 - 密码错误',
    result: 'failed',
    ip: '192.168.1.12',
    detail: '连续3次密码错误，账户已临时锁定15分钟',
  });
  logs.push({
    id: `log_${id++}`,
    time: '2025-04-01 14:30',
    user: '王强',
    module: '销售',
    actionType: 'pos',
    actionLabel: '收银',
    content: '收银操作失败 - 支付超时',
    result: 'failed',
    ip: '192.168.1.5',
    detail: '微信支付接口超时，已提示顾客重新扫码',
  });

  return logs.sort((a, b) => b.time.localeCompare(a.time));
}

const ALL_LOGS = generateMockLogs();
const PAGE_SIZE = 10;

const EASE_SMOOTH = [0.25, 0.1, 0.25, 1] as [number, number, number, number];

// ---- Main Component ----
export default function OperationLogs() {
  const [logs] = useState<OperationLog[]>(ALL_LOGS);
  const [search, setSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const users = useMemo(() => {
    const set = new Set(logs.map((l) => l.user));
    return Array.from(set).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const matchSearch = !search || l.content.includes(search) || l.user.includes(search);
      const matchUser = userFilter === 'all' || l.user === userFilter;
      const matchAction = actionFilter === 'all' || l.actionType === actionFilter;
      const matchModule = moduleFilter === 'all' || l.module === moduleFilter;
      let matchDate = true;
      if (dateRange === 'today') {
        matchDate = l.time.startsWith('2025-04-02');
      } else if (dateRange === 'week') {
        matchDate = l.time >= '2025-03-27';
      } else if (dateRange === 'month') {
        matchDate = l.time >= '2025-03-01';
      }
      return matchSearch && matchUser && matchAction && matchModule && matchDate;
    });
  }, [logs, search, userFilter, actionFilter, moduleFilter, dateRange]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedLogs = filteredLogs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-[#2D2926]">操作日志</h2>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1" style={{ maxWidth: 240 }}>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A39E99]" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="搜索操作内容..."
            className="h-10 rounded-xl border-[rgba(45,41,38,0.12)] pl-10 text-sm placeholder:text-[#A39E99] focus:border-[#D4853C]"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A39E99]">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Select value={userFilter} onValueChange={(v) => { setUserFilter(v); setPage(1); }}>
          <SelectTrigger className="h-10 w-[120px] rounded-xl border-[rgba(45,41,38,0.12)] text-sm">
            <SelectValue placeholder="操作人" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">全部人员</SelectItem>
            {users.map((u) => (
              <SelectItem key={u} value={u}>{u}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
          <SelectTrigger className="h-10 w-[120px] rounded-xl border-[rgba(45,41,38,0.12)] text-sm">
            <SelectValue placeholder="操作类型" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">全部类型</SelectItem>
            {Object.entries(ACTION_TYPES).map(([key, val]) => (
              <SelectItem key={key} value={key}>{val.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={moduleFilter} onValueChange={(v) => { setModuleFilter(v); setPage(1); }}>
          <SelectTrigger className="h-10 w-[120px] rounded-xl border-[rgba(45,41,38,0.12)] text-sm">
            <SelectValue placeholder="模块" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">全部模块</SelectItem>
            {MODULES.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={dateRange} onValueChange={(v) => { setDateRange(v); setPage(1); }}>
          <SelectTrigger className="h-10 w-[130px] rounded-xl border-[rgba(45,41,38,0.12)] text-sm">
            <SelectValue placeholder="时间范围" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">全部时间</SelectItem>
            <SelectItem value="today">今天</SelectItem>
            <SelectItem value="week">近7天</SelectItem>
            <SelectItem value="month">近30天</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-[#A39E99]">
        <span>共 {filteredLogs.length} 条记录</span>
        <span>成功: {filteredLogs.filter(l => l.result === 'success').length}</span>
        <span>失败: {filteredLogs.filter(l => l.result === 'failed').length}</span>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(45,41,38,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(45,41,38,0.08)]">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#A39E99]">时间</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#A39E99]">用户</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#A39E99]">模块</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#A39E99]">操作类型</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#A39E99]">操作内容</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#A39E99]">结果</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#A39E99]">IP地址</th>
              </tr>
            </thead>
            <tbody>
              {pagedLogs.map((log) => (
                <>
                  <tr
                    key={log.id}
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    className={cn(
                      'cursor-pointer border-b border-[rgba(45,41,38,0.06)] transition-colors hover:bg-[rgba(45,41,38,0.03)]',
                      expandedId === log.id && 'bg-[rgba(212,133,60,0.04)]'
                    )}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-[#2D2926]">{log.time}</td>
                    <td className="px-4 py-3 text-sm text-[#2D2926]">{log.user}</td>
                    <td className="px-4 py-3 text-sm text-[#6B6560]">{log.module}</td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex rounded-lg px-2 py-0.5 text-xs font-medium', ACTION_TYPES[log.actionType]?.color || '')}>
                        {log.actionLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[300px] truncate text-sm text-[#2D2926]">{log.content}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center gap-1 text-xs font-medium',
                        log.result === 'success' ? 'text-[#4A9B8E]' : 'text-[#C75C3A]'
                      )}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', log.result === 'success' ? 'bg-[#4A9B8E]' : 'bg-[#C75C3A]')} />
                        {log.result === 'success' ? '成功' : '失败'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#A39E99]">{log.ip}</td>
                  </tr>
                  {/* Expanded detail row */}
                  <AnimatePresence>
                    {expandedId === log.id && (
                      <motion.tr
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: EASE_SMOOTH }}
                      >
                        <td colSpan={7} className="border-b border-[rgba(45,41,38,0.08)] bg-[#FAFAF8] px-4 py-3">
                          <div className="text-sm text-[#6B6560]">
                            <p className="font-medium text-[#2D2926]">操作详情</p>
                            <p className="mt-1">{log.detail}</p>
                            {log.before && (
                              <div className="mt-2 grid grid-cols-2 gap-4">
                                <div className="rounded-lg bg-white p-3">
                                  <p className="mb-1 text-xs text-[#A39E99]">修改前</p>
                                  <p className="text-sm text-[#2D2926]">{log.before}</p>
                                </div>
                                <div className="rounded-lg bg-white p-3">
                                  <p className="mb-1 text-xs text-[#A39E99]">修改后</p>
                                  <p className="text-sm text-[#2D2926]">{log.after}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </>
              ))}
              {pagedLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <ScrollText className="mx-auto mb-3 h-10 w-10 text-[#A39E99] opacity-40" />
                    <p className="text-sm text-[#A39E99]">暂无匹配的日志记录</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#A39E99]">
            第 {currentPage} / {totalPages} 页，共 {filteredLogs.length} 条
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.06)] disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors',
                  p === currentPage
                    ? 'bg-[#D4853C] font-medium text-white'
                    : 'text-[#6B6560] hover:bg-[rgba(45,41,38,0.06)]'
                )}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.06)] disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
