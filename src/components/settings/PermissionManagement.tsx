import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  Store,
  User,
  Package,
  ChevronRight,
  ChevronDown,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

// ---- Types ----
type RoleType = 'admin' | 'shop_manager' | 'staff' | 'warehouse';

interface PermissionModule {
  id: string;
  label: string;
  permissions: { id: string; label: string }[];
}

interface RoleConfig {
  id: RoleType;
  name: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  userCount: number;
}

// ---- Constants ----

const ROLES: RoleConfig[] = [
  {
    id: 'admin',
    name: '管理员',
    description: '系统全部权限，包括用户管理、数据配置和高级设置',
    icon: Crown,
    iconColor: 'text-[#D4853C]',
    iconBg: 'bg-[rgba(212,133,60,0.12)]',
    userCount: 1,
  },
  {
    id: 'shop_manager',
    name: '店长',
    description: '门店管理权限，包含销售、库存、会员等日常运营',
    icon: Store,
    iconColor: 'text-[#4A9B8E]',
    iconBg: 'bg-[rgba(74,155,142,0.12)]',
    userCount: 2,
  },
  {
    id: 'staff',
    name: '店员',
    description: '前台收银、查看商品和会员信息的基础权限',
    icon: User,
    iconColor: 'text-[#6B6560]',
    iconBg: 'bg-[rgba(45,41,38,0.08)]',
    userCount: 3,
  },
  {
    id: 'warehouse',
    name: '库管',
    description: '库存管理和采购操作权限，负责入库盘点等',
    icon: Package,
    iconColor: 'text-[#6B6560]',
    iconBg: 'bg-[rgba(107,101,96,0.10)]',
    userCount: 1,
  },
];

const PERMISSION_MODULES: PermissionModule[] = [
  {
    id: 'products',
    label: '商品管理',
    permissions: [
      { id: 'products_view', label: '查看商品' },
      { id: 'products_add', label: '新增商品' },
      { id: 'products_edit', label: '编辑商品' },
      { id: 'products_delete', label: '删除商品' },
      { id: 'products_import', label: '批量导入' },
      { id: 'products_export', label: '导出数据' },
    ],
  },
  {
    id: 'purchase',
    label: '采购管理',
    permissions: [
      { id: 'purchase_view', label: '查看计划' },
      { id: 'purchase_plan', label: '创建计划' },
      { id: 'purchase_order', label: '创建订单' },
      { id: 'purchase_approve', label: '审核订单' },
      { id: 'purchase_inbound', label: '入库操作' },
      { id: 'purchase_return', label: '退货处理' },
    ],
  },
  {
    id: 'sales',
    label: '销售管理',
    permissions: [
      { id: 'sales_pos', label: '前台收银' },
      { id: 'sales_return', label: '退货处理' },
      { id: 'sales_exchange', label: '换货处理' },
      { id: 'sales_view', label: '查看记录' },
    ],
  },
  {
    id: 'inventory',
    label: '库存管理',
    permissions: [
      { id: 'inventory_view', label: '查看库存' },
      { id: 'inventory_adjust', label: '库存调整' },
      { id: 'inventory_count', label: '盘点操作' },
      { id: 'inventory_transfer', label: '调拨管理' },
    ],
  },
  {
    id: 'members',
    label: '会员管理',
    permissions: [
      { id: 'members_view', label: '查看会员' },
      { id: 'members_add', label: '新增会员' },
      { id: 'members_edit', label: '编辑会员' },
      { id: 'members_points', label: '积分调整' },
      { id: 'members_stored', label: '储值充值' },
    ],
  },
  {
    id: 'analytics',
    label: '数据分析',
    permissions: [
      { id: 'analytics_view', label: '查看报表' },
      { id: 'analytics_export', label: '导出报表' },
    ],
  },
  {
    id: 'settings',
    label: '系统设置',
    permissions: [
      { id: 'settings_users', label: '用户管理' },
      { id: 'settings_permissions', label: '权限管理' },
      { id: 'settings_data', label: '数据管理' },
      { id: 'settings_basic', label: '基础设置' },
    ],
  },
];

// ---- Default role permissions ----
function getDefaultPermissions(roleId: RoleType): Set<string> {
  const all = new Set<string>();
  PERMISSION_MODULES.forEach((m) => m.permissions.forEach((p) => all.add(p.id)));

  switch (roleId) {
    case 'admin':
      return all;
    case 'shop_manager':
      return new Set([
        'products_view', 'products_add', 'products_edit',
        'purchase_view', 'purchase_plan', 'purchase_order', 'purchase_inbound',
        'sales_pos', 'sales_return', 'sales_exchange', 'sales_view',
        'inventory_view', 'inventory_adjust', 'inventory_count', 'inventory_transfer',
        'members_view', 'members_add', 'members_edit', 'members_points', 'members_stored',
        'analytics_view', 'analytics_export',
      ]);
    case 'warehouse':
      return new Set([
        'products_view',
        'purchase_view', 'purchase_plan', 'purchase_order', 'purchase_inbound', 'purchase_return',
        'inventory_view', 'inventory_adjust', 'inventory_count', 'inventory_transfer',
        'sales_view',
      ]);
    case 'staff':
      return new Set([
        'products_view',
        'sales_pos', 'sales_return', 'sales_exchange', 'sales_view',
        'inventory_view',
        'members_view', 'members_add', 'members_edit',
      ]);
    default:
      return new Set();
  }
}

const EASE_SMOOTH = [0.25, 0.1, 0.25, 1] as [number, number, number, number];

// ---- Permission Module Row ----
function PermissionModuleRow({
  module,
  selected,
  onToggle,
}: {
  module: PermissionModule;
  selected: Set<string>;
  onToggle: (permId: string, checked: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const allChecked = module.permissions.every((p) => selected.has(p.id));
  const someChecked = module.permissions.some((p) => selected.has(p.id)) && !allChecked;

  const toggleAll = () => {
    const shouldCheck = !allChecked;
    module.permissions.forEach((p) => onToggle(p.id, shouldCheck));
  };

  return (
    <div className="rounded-xl border border-[rgba(45,41,38,0.08)] bg-[#FAFAF8]">
      {/* Module Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-4 py-3 transition-colors hover:bg-[rgba(45,41,38,0.03)]"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-[#A39E99]" />
        ) : (
          <ChevronRight className="h-4 w-4 text-[#A39E99]" />
        )}
        <Checkbox
          checked={allChecked}
          data-state={someChecked ? 'indeterminate' : allChecked ? 'checked' : 'unchecked'}
          onCheckedChange={toggleAll}
          className="border-[rgba(45,41,38,0.20)] data-[state=checked]:border-[#D4853C] data-[state=checked]:bg-[#D4853C]"
          onClick={(e) => e.stopPropagation()}
        />
        <span className="text-sm font-semibold text-[#2D2926]">{module.label}</span>
        <span className="ml-1 text-xs text-[#A39E99]">
          ({module.permissions.filter((p) => selected.has(p.id)).length}/{module.permissions.length})
        </span>
      </button>

      {/* Permissions */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE_SMOOTH }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-2 px-4 pb-3 sm:grid-cols-3">
              {module.permissions.map((perm) => (
                <label
                  key={perm.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-[rgba(45,41,38,0.03)]"
                >
                  <Checkbox
                    checked={selected.has(perm.id)}
                    onCheckedChange={(checked) => onToggle(perm.id, checked as boolean)}
                    className="border-[rgba(45,41,38,0.20)] data-[state=checked]:border-[#D4853C] data-[state=checked]:bg-[#D4853C]"
                  />
                  <span className="text-sm text-[#2D2926]">{perm.label}</span>
                </label>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---- Main Component ----
export default function PermissionManagement() {
  const [editingRole, setEditingRole] = useState<RoleType | null>(null);
  const [permissions, setPermissions] = useState<Record<RoleType, Set<string>>>({
    admin: getDefaultPermissions('admin'),
    shop_manager: getDefaultPermissions('shop_manager'),
    staff: getDefaultPermissions('staff'),
    warehouse: getDefaultPermissions('warehouse'),
  });

  const handleToggle = (roleId: RoleType, permId: string, checked: boolean) => {
    setPermissions((prev) => {
      const next = new Set(prev[roleId]);
      if (checked) next.add(permId);
      else next.delete(permId);
      return { ...prev, [roleId]: next };
    });
  };

  const handleSave = () => {
    setEditingRole(null);
  };

  const editingConfig = ROLES.find((r) => r.id === editingRole);

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-[#2D2926]">权限管理</h2>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ROLES.map((role) => {
          const Icon = role.icon;
          const permCount = permissions[role.id].size;
          const totalPerm = PERMISSION_MODULES.reduce((s, m) => s + m.permissions.length, 0);
          return (
            <motion.div
              key={role.id}
              whileHover={{ y: -2, boxShadow: '0 4px 16px rgba(45,41,38,0.10)' }}
              transition={{ duration: 0.3, ease: EASE_SMOOTH }}
              className="group cursor-pointer rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(45,41,38,0.06)] transition-all"
              onClick={() => setEditingRole(role.id)}
            >
              <div className="flex items-start gap-4">
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', role.iconBg)}>
                  <Icon className={cn('h-6 w-6', role.iconColor)} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-[#2D2926]">{role.name}</h3>
                    <span className="flex items-center gap-1 text-xs text-[#A39E99]">
                      <Users className="h-3 w-3" />
                      {role.userCount}人
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-[#6B6560]">{role.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-[#A39E99]">
                      已授权 {permCount}/{totalPerm} 项
                    </span>
                    <span className="text-xs font-medium text-[#D4853C]">编辑权限</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Edit Permission Dialog */}
      <Dialog open={!!editingRole} onOpenChange={() => setEditingRole(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl border border-[rgba(45,41,38,0.12)] bg-white shadow-[0_20px_60px_rgba(45,41,38,0.15)] sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#2D2926]">
              编辑权限 — {editingConfig?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {PERMISSION_MODULES.map((module) => (
              <PermissionModuleRow
                key={module.id}
                module={module}
                selected={editingRole ? permissions[editingRole] : new Set()}
                onToggle={(permId, checked) => {
                  if (editingRole) handleToggle(editingRole, permId, checked);
                }}
              />
            ))}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingRole(null)}
              className="rounded-xl border-[rgba(45,41,38,0.12)] text-[#2D2926] hover:bg-[rgba(45,41,38,0.04)]"
            >
              取消
            </Button>
            <Button
              onClick={handleSave}
              className="rounded-xl bg-[#D4853C] text-white hover:bg-[#BF7532]"
            >
              保存权限
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
