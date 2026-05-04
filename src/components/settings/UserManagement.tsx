import { useState, useMemo, useEffect } from 'react';
import {
  UserPlus,
  Pencil,
  KeyRound,
  Trash2,
  Search,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

// ---- Types ----
interface AppUser {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'shop_manager' | 'staff' | 'warehouse';
  roleLabel: string;
  store: string;
  phone: string;
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin: string;
}

// ---- Mock Data ----
const ROLE_OPTIONS = [
  { value: 'admin', label: '管理员' },
  { value: 'shop_manager', label: '店长' },
  { value: 'staff', label: '店员' },
  { value: 'warehouse', label: '库管' },
];

const STORE_OPTIONS = [
  '全部门店',
  '总店',
  '王府井分店',
  '三里屯分店',
  '西单分店',
  '总店仓库',
];

const INITIAL_USERS: AppUser[] = [
  { id: '1', username: 'admin', name: '系统管理员', role: 'admin', roleLabel: '管理员', store: '全部门店', phone: '13800138001', status: 'active', createdAt: '2023-01-01', lastLogin: '2025-04-02 09:00' },
  { id: '2', username: 'manager01', name: '李明', role: 'shop_manager', roleLabel: '店长', store: '王府井分店', phone: '13800138002', status: 'active', createdAt: '2023-03-15', lastLogin: '2025-04-02 08:30' },
  { id: '3', username: 'staff01', name: '张丽', role: 'staff', roleLabel: '店员', store: '王府井分店', phone: '13800138003', status: 'active', createdAt: '2023-06-01', lastLogin: '2025-04-02 10:00' },
  { id: '4', username: 'staff02', name: '王强', role: 'staff', roleLabel: '店员', store: '西单分店', phone: '13800138004', status: 'active', createdAt: '2023-08-10', lastLogin: '2025-04-01 18:00' },
  { id: '5', username: 'warehouse01', name: '李梅', role: 'warehouse', roleLabel: '库管', store: '总店仓库', phone: '13800138005', status: 'active', createdAt: '2024-01-10', lastLogin: '2025-04-02 07:45' },
  { id: '6', username: 'manager02', name: '陈刚', role: 'shop_manager', roleLabel: '店长', store: '三里屯分店', phone: '13800138006', status: 'active', createdAt: '2024-02-20', lastLogin: '2025-04-01 20:15' },
  { id: '7', username: 'staff03', name: '赵敏', role: 'staff', roleLabel: '店员', store: '三里屯分店', phone: '13800138007', status: 'inactive', createdAt: '2024-05-10', lastLogin: '2025-03-28 16:30' },
];

const ROLE_BADGE_STYLES: Record<string, string> = {
  admin: 'bg-[rgba(212,133,60,0.12)] text-[#D4853C]',
  shop_manager: 'bg-[rgba(74,155,142,0.12)] text-[#4A9B8E]',
  staff: 'bg-[rgba(45,41,38,0.08)] text-[#6B6560]',
  warehouse: 'bg-[rgba(107,101,96,0.10)] text-[#6B6560]',
};

// ---- Components ----

function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  destructive = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  destructive?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl border border-[rgba(45,41,38,0.12)] bg-white shadow-[0_20px_60px_rgba(45,41,38,0.15)] sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-[#2D2926]">{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-[#6B6560]">{message}</p>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl border-[rgba(45,41,38,0.12)] text-[#2D2926] hover:bg-[rgba(45,41,38,0.04)]"
          >
            取消
          </Button>
          <Button
            onClick={onConfirm}
            className={cn(
              'rounded-xl',
              destructive
                ? 'bg-[#C75C3A] text-white hover:bg-[#a8492d]'
                : 'bg-[#D4853C] text-white hover:bg-[#BF7532]'
            )}
          >
            确认
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UserModal({
  open,
  onClose,
  onSave,
  user,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (user: AppUser) => void;
  user?: AppUser | null;
}) {
  const [form, setForm] = useState({
    username: '',
    name: '',
    password: '',
    confirmPassword: '',
    role: 'staff',
    store: '王府井分店',
    phone: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = !!user;

  // Populate form when editing
  useEffect(() => {
    if (user) {
      setForm({
        username: user.username,
        name: user.name,
        password: '',
        confirmPassword: '',
        role: user.role,
        store: user.store,
        phone: user.phone,
        status: user.status,
      });
    }
  }, [user]);

  const resetForm = () => {
    setForm({
      username: '',
      name: '',
      password: '',
      confirmPassword: '',
      role: 'staff',
      store: '王府井分店',
      phone: '',
      status: 'active',
    });
    setErrors({});
  };

  // Handle modal opening
  useEffect(() => {
    if (open && user) {
      setForm({
        username: user.username,
        name: user.name,
        password: '',
        confirmPassword: '',
        role: user.role,
        store: user.store,
        phone: user.phone,
        status: user.status,
      });
      setErrors({});
    } else if (open && !user) {
      resetForm();
    }
  }, [open, user]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.username.trim()) errs.username = '请输入用户名';
    if (!isEdit && !form.password) errs.password = '请输入密码';
    if (!isEdit && form.password && form.password.length < 6) errs.password = '密码至少6位';
    if (!isEdit && form.password !== form.confirmPassword) errs.confirmPassword = '两次密码不一致';
    if (!form.name.trim()) errs.name = '请输入姓名';
    if (!form.phone.trim()) errs.phone = '请输入手机号';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const roleOpt = ROLE_OPTIONS.find(r => r.value === form.role);
    onSave({
      id: user?.id || Date.now().toString(),
      username: form.username,
      name: form.name,
      role: form.role as AppUser['role'],
      roleLabel: roleOpt?.label || '店员',
      store: form.store,
      phone: form.phone,
      status: form.status,
      createdAt: user?.createdAt || new Date().toISOString().slice(0, 10),
      lastLogin: user?.lastLogin || '-',
    });
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { resetForm(); onClose(); } }}>
      <DialogContent className="rounded-2xl border border-[rgba(45,41,38,0.12)] bg-white shadow-[0_20px_60px_rgba(45,41,38,0.15)] sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#2D2926]">
            {isEdit ? '编辑用户' : '新增用户'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Username */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#2D2926]">用户名</label>
            <Input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="输入用户名"
              disabled={isEdit}
              className={cn(
                'h-11 rounded-xl border-[rgba(45,41,38,0.12)] text-sm focus:border-[#D4853C] focus:shadow-[0_0_0_3px_rgba(212,133,60,0.12)]',
                errors.username && 'border-[#C75C3A] shadow-[0_0_0_3px_rgba(199,92,58,0.10)]'
              )}
            />
            {errors.username && <p className="mt-1 text-xs text-[#C75C3A]">{errors.username}</p>}
          </div>

          {/* Name */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#2D2926]">姓名</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="输入真实姓名"
              className={cn(
                'h-11 rounded-xl border-[rgba(45,41,38,0.12)] text-sm focus:border-[#D4853C] focus:shadow-[0_0_0_3px_rgba(212,133,60,0.12)]',
                errors.name && 'border-[#C75C3A] shadow-[0_0_0_3px_rgba(199,92,58,0.10)]'
              )}
            />
            {errors.name && <p className="mt-1 text-xs text-[#C75C3A]">{errors.name}</p>}
          </div>

          {/* Password */}
          {!isEdit && (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#2D2926]">密码</label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="至少6位"
                  className={cn(
                    'h-11 rounded-xl border-[rgba(45,41,38,0.12)] text-sm focus:border-[#D4853C] focus:shadow-[0_0_0_3px_rgba(212,133,60,0.12)]',
                    errors.password && 'border-[#C75C3A] shadow-[0_0_0_3px_rgba(199,92,58,0.10)]'
                  )}
                />
                {errors.password && <p className="mt-1 text-xs text-[#C75C3A]">{errors.password}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#2D2926]">确认密码</label>
                <Input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="再次输入密码"
                  className={cn(
                    'h-11 rounded-xl border-[rgba(45,41,38,0.12)] text-sm focus:border-[#D4853C] focus:shadow-[0_0_0_3px_rgba(212,133,60,0.12)]',
                    errors.confirmPassword && 'border-[#C75C3A] shadow-[0_0_0_3px_rgba(199,92,58,0.10)]'
                  )}
                />
                {errors.confirmPassword && <p className="mt-1 text-xs text-[#C75C3A]">{errors.confirmPassword}</p>}
              </div>
            </>
          )}

          {/* Role */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#2D2926]">角色</label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
              <SelectTrigger className="h-11 rounded-xl border-[rgba(45,41,38,0.12)] text-sm focus:border-[#D4853C]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-[rgba(45,41,38,0.12)]">
                {ROLE_OPTIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value} className="text-sm">
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Store */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#2D2926]">所属门店</label>
            <Select value={form.store} onValueChange={(v) => setForm({ ...form, store: v })}>
              <SelectTrigger className="h-11 rounded-xl border-[rgba(45,41,38,0.12)] text-sm focus:border-[#D4853C]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-[rgba(45,41,38,0.12)]">
                {STORE_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s} className="text-sm">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#2D2926]">手机号</label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="输入手机号"
              className={cn(
                'h-11 rounded-xl border-[rgba(45,41,38,0.12)] text-sm focus:border-[#D4853C] focus:shadow-[0_0_0_3px_rgba(212,133,60,0.12)]',
                errors.phone && 'border-[#C75C3A] shadow-[0_0_0_3px_rgba(199,92,58,0.10)]'
              )}
            />
            {errors.phone && <p className="mt-1 text-xs text-[#C75C3A]">{errors.phone}</p>}
          </div>

          {/* Status */}
          {isEdit && (
            <div className="flex items-center justify-between rounded-xl border border-[rgba(45,41,38,0.08)] px-4 py-3">
              <span className="text-sm text-[#2D2926]">账号状态</span>
              <div className="flex items-center gap-3">
                <span className={cn('text-sm', form.status === 'active' ? 'text-[#4A9B8E]' : 'text-[#A39E99]')}>
                  {form.status === 'active' ? '启用' : '停用'}
                </span>
                <Switch
                  checked={form.status === 'active'}
                  onCheckedChange={(v) => setForm({ ...form, status: v ? 'active' : 'inactive' })}
                  className="data-[state=checked]:bg-[#D4853C]"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => { resetForm(); onClose(); }}
            className="rounded-xl border-[rgba(45,41,38,0.12)] text-[#2D2926] hover:bg-[rgba(45,41,38,0.04)]"
          >
            取消
          </Button>
          <Button
            onClick={handleSave}
            className="rounded-xl bg-[#D4853C] text-white hover:bg-[#BF7532]"
          >
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- Main Component ----
export default function UserManagement() {
  const [users, setUsers] = useState<AppUser[]>(INITIAL_USERS);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', onConfirm: () => {}, destructive: false });

  const [resetPwOpen, setResetPwOpen] = useState(false);
  const [resetPwUser, setResetPwUser] = useState<AppUser | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch = !search || u.name.includes(search) || u.username.includes(search) || u.phone.includes(search);
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchStatus = statusFilter === 'all' || u.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const openAdd = () => { setEditingUser(null); setModalOpen(true); };
  const openEdit = (u: AppUser) => { setEditingUser(u); setModalOpen(true); };

  const handleSave = (user: AppUser) => {
    if (editingUser) {
      setUsers(users.map((u) => (u.id === user.id ? user : u)));
    } else {
      setUsers([...users, user]);
    }
  };

  const toggleStatus = (u: AppUser) => {
    setUsers(users.map((user) =>
      user.id === u.id ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' } : user
    ));
  };

  const confirmDelete = (u: AppUser) => {
    setConfirmConfig({
      title: '删除用户',
      message: `确认删除用户 "${u.name}"（${u.username}）？此操作不可撤销。`,
      destructive: true,
      onConfirm: () => {
        setUsers(users.filter((user) => user.id !== u.id));
        setConfirmOpen(false);
      },
    });
    setConfirmOpen(true);
  };

  const openResetPassword = (u: AppUser) => {
    setResetPwUser(u);
    setNewPassword('');
    setResetPwOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Header + Toolbar */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#2D2926]">用户管理</h2>
        <Button
          onClick={openAdd}
          className="rounded-xl bg-[#D4853C] text-white hover:bg-[#BF7532]"
        >
          <UserPlus className="mr-1.5 h-4 w-4" />
          新建用户
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1" style={{ maxWidth: 280 }}>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A39E99]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索用户名、姓名或手机号..."
            className="h-10 rounded-xl border-[rgba(45,41,38,0.12)] pl-10 text-sm placeholder:text-[#A39E99] focus:border-[#D4853C]"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A39E99] hover:text-[#6B6560]">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="h-10 w-[140px] rounded-xl border-[rgba(45,41,38,0.12)] text-sm">
            <SelectValue placeholder="全部角色" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">全部角色</SelectItem>
            {ROLE_OPTIONS.map((r) => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-10 w-[130px] rounded-xl border-[rgba(45,41,38,0.12)] text-sm">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="active">启用</SelectItem>
            <SelectItem value="inactive">停用</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* User Table */}
      <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(45,41,38,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[rgba(45,41,38,0.08)]">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#A39E99]">用户名</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#A39E99]">姓名</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#A39E99]">角色</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#A39E99]">所属门店</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#A39E99]">手机号</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#A39E99]">状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#A39E99]">最后登录</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-[#A39E99]">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-[rgba(45,41,38,0.08)] transition-colors hover:bg-[rgba(45,41,38,0.03)]"
                >
                  <td className="px-4 py-3.5 text-sm font-medium text-[#2D2926]">{u.username}</td>
                  <td className="px-4 py-3.5 text-sm text-[#2D2926]">{u.name}</td>
                  <td className="px-4 py-3.5">
                    <span className={cn('inline-flex rounded-lg px-2.5 py-1 text-xs font-medium', ROLE_BADGE_STYLES[u.role])}>
                      {u.roleLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-[#6B6560]">{u.store}</td>
                  <td className="px-4 py-3.5 font-mono text-sm text-[#6B6560]">{u.phone}</td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => toggleStatus(u)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                        u.status === 'active'
                          ? 'bg-[rgba(74,155,142,0.10)] text-[#4A9B8E]'
                          : 'bg-[rgba(45,41,38,0.08)] text-[#A39E99]'
                      )}
                    >
                      <span className={cn('h-1.5 w-1.5 rounded-full', u.status === 'active' ? 'bg-[#4A9B8E]' : 'bg-[#A39E99]')} />
                      {u.status === 'active' ? '启用' : '停用'}
                    </button>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-[#A39E99]">{u.lastLogin}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(u)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.06)] hover:text-[#2D2926]"
                        title="编辑"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => openResetPassword(u)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.06)] hover:text-[#2D2926]"
                        title="重置密码"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => confirmDelete(u)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B6560] transition-colors hover:bg-[rgba(199,92,58,0.08)] hover:text-[#C75C3A]"
                        title="删除"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <p className="text-sm text-[#A39E99]">暂无匹配的用户</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Modal */}
      <UserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        user={editingUser}
      />

      {/* Reset Password Dialog */}
      <Dialog open={resetPwOpen} onOpenChange={setResetPwOpen}>
        <DialogContent className="rounded-2xl border border-[rgba(45,41,38,0.12)] bg-white shadow-[0_20px_60px_rgba(45,41,38,0.15)] sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#2D2926]">
              重置密码 — {resetPwUser?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <label className="mb-1.5 block text-xs font-medium text-[#2D2926]">新密码</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="至少6位"
              className="h-11 rounded-xl border-[rgba(45,41,38,0.12)] text-sm focus:border-[#D4853C]"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setResetPwOpen(false)} className="rounded-xl border-[rgba(45,41,38,0.12)]">
              取消
            </Button>
            <Button
              onClick={() => {
                if (newPassword.length >= 6) {
                  setResetPwOpen(false);
                  setNewPassword('');
                }
              }}
              className="rounded-xl bg-[#D4853C] text-white hover:bg-[#BF7532]"
            >
              确认重置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        destructive={confirmConfig.destructive}
      />
    </div>
  );
}
