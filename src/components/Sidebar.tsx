import { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Shirt,
  ClipboardList,
  Receipt,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';

interface NavItem {
  icon: React.ElementType;
  label: string;
  route: string;
  badge?: number;
}

const MAIN_NAV: NavItem[] = [
  { icon: LayoutDashboard, label: '首页概览', route: '/home' },
  { icon: ShoppingCart, label: '前台收银', route: '/pos' },
  { icon: Package, label: '库存管理', route: '/inventory' },
  { icon: Shirt, label: '商品管理', route: '/products' },
  { icon: ClipboardList, label: '采购管理', route: '/purchase' },
  { icon: Receipt, label: '销售记录', route: '/sales' },
];

const MANAGE_NAV: NavItem[] = [
  { icon: Users, label: '会员管理', route: '/members' },
  { icon: BarChart3, label: '数据分析', route: '/analytics' },
];

const SETTINGS_NAV: NavItem[] = [
  { icon: Settings, label: '系统设置', route: '/settings' },
];

function SidebarNavItem({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = location.pathname === item.route;

  return (
    <button
      onClick={() => navigate(item.route)}
      className={cn(
        'group relative flex w-full items-center rounded-xl px-3 py-3 transition-all duration-250',
        'mx-0 my-0.5',
        isActive
          ? 'bg-white font-semibold text-[#2D2926] shadow-[0_1px_3px_rgba(45,41,38,0.08)]'
          : 'text-[#6B6560] hover:bg-[rgba(45,41,38,0.06)] hover:text-[#2D2926]',
        collapsed && 'justify-center px-2'
      )}
      title={collapsed ? item.label : undefined}
    >
      <item.icon
        className={cn(
          'h-5 w-5 flex-shrink-0',
          isActive ? 'text-[#2D2926]' : 'text-[#6B6560]',
          'transition-colors'
        )}
        strokeWidth={1.5}
      />
      {!collapsed && (
        <>
          <span className="ml-3 text-sm">{item.label}</span>
          {item.badge !== undefined && item.badge > 0 && (
            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C75C3A] px-1.5 text-[11px] font-semibold text-white">
              {item.badge}
            </span>
          )}
        </>
      )}
    </button>
  );
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { state } = useApp();

  // Calculate badge counts from real data
  const lowStockCount = state.inventory.filter(i => i.quantity <= i.minStock).length;
  const newMembersCount = state.members.filter(m => {
    const created = new Date(m.createdAt);
    const now = new Date('2025-04-02');
    const diff = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 30;
  }).length;

  const mainNav = MAIN_NAV.map(item => {
    if (item.route === '/inventory') return { ...item, badge: lowStockCount };
    return item;
  });

  const manageNav = MANAGE_NAV.map(item => {
    if (item.route === '/members') return { ...item, badge: newMembersCount };
    return item;
  });

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 bottom-0 z-40 flex flex-col border-r border-[rgba(45,41,38,0.08)] bg-[#F0EDE8] transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-[228px]'
      )}
    >
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {/* 主要 */}
        {!collapsed && (
          <div className="mb-2 px-3 pt-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">
            主要
          </div>
        )}
        <div className={cn('space-y-0.5', collapsed && 'mt-2')}>
          {mainNav.map(item => (
            <SidebarNavItem key={item.route} item={item} collapsed={collapsed} />
          ))}
        </div>

        {/* 管理 */}
        {!collapsed && (
          <div className="mb-2 mt-6 px-3 pt-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">
            管理
          </div>
        )}
        {collapsed && <div className="mt-6" />}
        <div className="space-y-0.5">
          {manageNav.map(item => (
            <SidebarNavItem key={item.route} item={item} collapsed={collapsed} />
          ))}
        </div>

        {/* 设置 */}
        {!collapsed && (
          <div className="mb-2 mt-6 px-3 pt-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">
            设置
          </div>
        )}
        {collapsed && <div className="mt-6" />}
        <div className="space-y-0.5">
          {SETTINGS_NAV.map(item => (
            <SidebarNavItem key={item.route} item={item} collapsed={collapsed} />
          ))}
        </div>
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-[rgba(45,41,38,0.08)] p-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-xl py-2.5 text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.06)]"
          title={collapsed ? '展开' : '收起'}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="ml-2 text-xs">收起</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
