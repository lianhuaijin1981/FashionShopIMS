import { useLocation } from 'react-router';
import { useMemo } from 'react';
import { Construction } from 'lucide-react';

const PAGE_NAMES: Record<string, string> = {
  '/pos': '前台收银',
  '/inventory': '库存管理',
  '/products': '商品管理',
  '/purchase': '采购管理',
  '/sales': '销售记录',
  '/members': '会员管理',
  '/analytics': '数据分析',
  '/settings': '系统设置',
};

export default function StubPage() {
  const location = useLocation();
  const pageName = useMemo(() => PAGE_NAMES[location.pathname] || '页面', [location.pathname]);

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center rounded-2xl bg-white p-12 shadow-[0_1px_3px_rgba(45,41,38,0.06)]"
      style={{ minHeight: '60vh' }}
    >
      <Construction className="h-16 w-16 text-[#A39E99] opacity-50" />
      <h2 className="mt-6 font-display text-2xl font-semibold text-[#2D2926]">
        {pageName}
      </h2>
      <p className="mt-2 text-sm text-[#A39E99]">该模块正在开发中，敬请期待...</p>
    </div>
  );
}
