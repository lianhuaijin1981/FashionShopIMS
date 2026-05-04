import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Shield,
  Database,
  ScrollText,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import UserManagement from '@/components/settings/UserManagement';
import PermissionManagement from '@/components/settings/PermissionManagement';
import DataManagement from '@/components/settings/DataManagement';
import OperationLogs from '@/components/settings/OperationLogs';
import BasicSettings from '@/components/settings/BasicSettings';

const SUB_NAV_ITEMS = [
  { id: 'users', label: '用户管理', icon: Users },
  { id: 'permissions', label: '权限管理', icon: Shield },
  { id: 'data', label: '数据管理', icon: Database },
  { id: 'logs', label: '操作日志', icon: ScrollText },
  { id: 'basic', label: '基础设置', icon: SlidersHorizontal },
];

const EASE_SMOOTH = [0.25, 0.1, 0.25, 1] as [number, number, number, number];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[#2D2926]">
          系统设置
        </h1>
        <span className="text-xs font-medium text-[#A39E99]">王府井分店</span>
      </div>

      {/* Settings Layout: Sub-nav + Content */}
      <div className="flex gap-6" style={{ minHeight: '70vh' }}>
        {/* Sub-Navigation */}
        <nav className="w-[180px] flex-shrink-0 border-r border-[rgba(45,41,38,0.08)] pr-4">
          <div className="space-y-1">
            {SUB_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-sm transition-all duration-200',
                    isActive
                      ? 'bg-white font-semibold text-[#2D2926] shadow-[0_1px_3px_rgba(45,41,38,0.08)]'
                      : 'text-[#6B6560] hover:bg-[rgba(45,41,38,0.04)]'
                  )}
                >
                  <Icon className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={1.5} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Content Area */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.25,
                ease: EASE_SMOOTH,
              }}
            >
              {activeTab === 'users' && <UserManagement />}
              {activeTab === 'permissions' && <PermissionManagement />}
              {activeTab === 'data' && <DataManagement />}
              {activeTab === 'logs' && <OperationLogs />}
              {activeTab === 'basic' && <BasicSettings />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
