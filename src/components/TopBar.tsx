import { useState } from 'react';
import { Search, Bell, ChevronRight, LogOut, Settings, User } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useLocation } from 'react-router';

const BREADCRUMB_MAP: Record<string, string> = {
  '/home': '首页 / 仪表盘',
  '/pos': '首页 / 前台收银',
  '/inventory': '首页 / 库存管理',
  '/products': '首页 / 商品管理',
  '/purchase': '首页 / 采购管理',
  '/sales': '首页 / 销售记录',
  '/members': '首页 / 会员管理',
  '/analytics': '首页 / 数据分析',
  '/settings': '首页 / 系统设置',
};

export default function TopBar() {
  const { state, logout } = useApp();
  const location = useLocation();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const breadcrumb = BREADCRUMB_MAP[location.pathname] || '首页 / 仪表盘';
  const unreadCount = state.notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center border-b border-[rgba(45,41,38,0.08)] bg-white px-6">
      {/* Brand */}
      <div className="mr-8 flex flex-col justify-center">
        <span className="font-display text-lg font-bold leading-tight text-[#D4853C]">
          StyleStock
        </span>
        <span className="text-[11px] leading-tight text-[#A39E99]">
          门店进销存
        </span>
      </div>

      {/* Breadcrumb */}
      <div className="hidden items-center text-xs font-medium tracking-wide text-[#A39E99] md:flex">
        {breadcrumb.split(' / ').map((part, i, arr) => (
          <span key={i} className="flex items-center">
            <span>{part}</span>
            {i < arr.length - 1 && <ChevronRight className="mx-1 h-3 w-3" />}
          </span>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="relative mr-4 hidden md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#A39E99]" />
        <input
          type="text"
          placeholder="搜索款号、商品名称或SKU..."
          className="h-10 w-[360px] rounded-xl border border-[rgba(45,41,38,0.12)] bg-white py-0 pl-10 pr-3 text-sm text-[#2D2926] transition-all placeholder:text-[#A39E99] focus:border-[#D4853C] focus:shadow-[0_0_0_3px_rgba(212,133,60,0.12)] focus:outline-none"
        />
      </div>

      {/* Notification Bell */}
      <div className="relative mr-4">
        <button
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.04)]"
          onClick={() => setShowNotifDropdown(!showNotifDropdown)}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#C75C3A]" />
          )}
        </button>

        {showNotifDropdown && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowNotifDropdown(false)} />
            <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-[rgba(45,41,38,0.12)] bg-white p-4 shadow-[0_8px_32px_rgba(45,41,38,0.12)]">
              <h3 className="mb-2 text-sm font-semibold text-[#2D2926]">通知</h3>
              {state.notifications.length === 0 ? (
                <p className="py-4 text-center text-sm text-[#A39E99]">暂无通知</p>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {state.notifications.map(n => (
                    <div key={n.id} className={`cursor-pointer border-b border-[rgba(45,41,38,0.08)] py-2.5 last:border-0 ${n.read ? 'opacity-60' : ''}`}>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${n.type === 'warning' ? 'bg-[#C75C3A]' : n.type === 'success' ? 'bg-[#4A9B8E]' : 'bg-[#D4853C]'}`} />
                        <span className="text-sm font-medium text-[#2D2926]">{n.title}</span>
                      </div>
                      <p className="mt-0.5 pl-4 text-xs text-[#6B6560]">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* User Avatar */}
      <div className="relative">
        <button
          className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#D4853C] text-sm font-semibold text-white transition-transform hover:scale-105"
          onClick={() => setShowUserDropdown(!showUserDropdown)}
        >
          {state.user?.name?.charAt(0) || 'U'}
        </button>

        {showUserDropdown && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowUserDropdown(false)} />
            <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-[rgba(45,41,38,0.12)] bg-white p-2 shadow-[0_8px_32px_rgba(45,41,38,0.12)]">
              <div className="border-b border-[rgba(45,41,38,0.08)] px-3 py-2.5">
                <p className="text-sm font-semibold text-[#2D2926]">{state.user?.name || '用户'}</p>
                <p className="text-xs text-[#A39E99]">{state.user?.storeName || ''}</p>
              </div>
              <button className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.04)]">
                <User className="h-4 w-4" />
                个人资料
              </button>
              <button className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.04)]">
                <Settings className="h-4 w-4" />
                系统设置
              </button>
              <button
                onClick={logout}
                className="mb-1 mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-[#C75C3A] transition-colors hover:bg-[rgba(199,92,58,0.08)]"
              >
                <LogOut className="h-4 w-4" />
                退出登录
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
