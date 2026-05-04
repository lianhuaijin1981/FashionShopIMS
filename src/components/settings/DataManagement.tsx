import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Download,
  RotateCcw,
  Trash2,
  AlertTriangle,
  Database,
  FileJson,
  Upload,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
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

// ---- Types ----
interface BackupRecord {
  id: string;
  date: string;
  size: string;
  status: 'completed' | 'failed';
}

// ---- Mock Data ----
const INITIAL_BACKUPS: BackupRecord[] = [
  { id: 'b1', date: '2025-04-02 03:00', size: '156MB', status: 'completed' },
  { id: 'b2', date: '2025-04-01 03:00', size: '154MB', status: 'completed' },
  { id: 'b3', date: '2025-03-31 03:00', size: '153MB', status: 'completed' },
  { id: 'b4', date: '2025-03-30 03:00', size: '152MB', status: 'completed' },
  { id: 'b5', date: '2025-03-29 03:00', size: '150MB', status: 'completed' },
  { id: 'b6', date: '2025-03-28 03:00', size: '148MB', status: 'completed' },
];

const EASE_SMOOTH = [0.25, 0.1, 0.25, 1] as [number, number, number, number];

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
      <DialogContent className="rounded-2xl border border-[rgba(45,41,38,0.12)] bg-white shadow-[0_20px_60px_rgba(45,41,38,0.15)] sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-[#2D2926]">
            {destructive && <AlertTriangle className="h-5 w-5 text-[#C75C3A]" />}
            {title}
          </DialogTitle>
        </DialogHeader>
        <p className="whitespace-pre-line text-sm leading-relaxed text-[#6B6560]">{message}</p>
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

// ---- Main Component ----
export default function DataManagement() {
  const [backups, setBackups] = useState<BackupRecord[]>(INITIAL_BACKUPS);
  const [autoBackup, setAutoBackup] = useState(true);
  const [backingUp, setBackingUp] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    title: '',
    message: '',
    destructive: false,
    onConfirm: () => {},
  });

  const [cleanupRange, setCleanupRange] = useState('1year');
  const [cleanupType, setCleanupType] = useState('sales');

  const lastBackup = backups[0]?.date || '-';

  const handleBackup = () => {
    setBackingUp(true);
    setTimeout(() => {
      const newBackup: BackupRecord = {
        id: `b${Date.now()}`,
        date: new Date().toLocaleString('zh-CN', {
          year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
        }).replace(/\//g, '-'),
        size: `${155 + Math.floor(Math.random() * 10)}MB`,
        status: 'completed',
      };
      setBackups((prev) => [newBackup, ...prev]);
      setBackingUp(false);
    }, 1500);
  };

  const handleRestore = (backup: BackupRecord) => {
    setConfirmConfig({
      title: '恢复数据',
      message: `确认恢复到备份 "${backup.date}"？\n\n⚠ 当前数据将被覆盖，此操作不可撤销！`,
      destructive: true,
      onConfirm: () => {
        setConfirmOpen(false);
        // Simulate restore
      },
    });
    setConfirmOpen(true);
  };

  const handleDeleteBackup = (backup: BackupRecord) => {
    setConfirmConfig({
      title: '删除备份',
      message: `确认删除 "${backup.date}" 的备份？`,
      destructive: true,
      onConfirm: () => {
        setBackups(backups.filter((b) => b.id !== backup.id));
        setConfirmOpen(false);
      },
    });
    setConfirmOpen(true);
  };

  const handleExport = () => {
    const allData = {
      exportTime: new Date().toISOString(),
      version: '1.0',
      note: 'StyleStock 数据导出',
    };
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stylestock_export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCleanup = () => {
    const rangeText = cleanupRange === '1year' ? '1年前' : cleanupRange === '3year' ? '3年前' : '全部';
    const typeText = cleanupType === 'sales' ? '销售记录' : cleanupType === 'logs' ? '操作日志' : '备份文件';
    setConfirmConfig({
      title: '数据清理',
      message: `确认清理 ${rangeText} 的 ${typeText}？\n\n⚠ 此操作不可撤销，请确保已备份重要数据！`,
      destructive: true,
      onConfirm: () => {
        setConfirmOpen(false);
      },
    });
    setConfirmOpen(true);
  };

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-[#2D2926]">数据管理</h2>

      {/* Data Backup Card */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(45,41,38,0.06)]">
        <div className="mb-5 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[#4A9B8E]" />
          <h3 className="text-base font-semibold text-[#2D2926]">数据备份</h3>
        </div>

        {/* Auto backup toggle + last backup */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-[#FAFAF8] p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Switch
                checked={autoBackup}
                onCheckedChange={setAutoBackup}
                className="data-[state=checked]:bg-[#D4853C]"
              />
              <div>
                <p className="text-sm font-medium text-[#2D2926]">每日自动备份</p>
                <p className="text-xs text-[#A39E99]">每日凌晨 3:00 自动备份</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#A39E99]">
            <Clock className="h-3.5 w-3.5" />
            上次备份: <span className="font-mono text-[#6B6560]">{lastBackup}</span>
          </div>
        </div>

        {/* Manual backup button */}
        <div className="mb-5">
          <Button
            variant="outline"
            onClick={handleBackup}
            disabled={backingUp}
            className="rounded-xl border-[rgba(45,41,38,0.12)] text-[#2D2926] hover:bg-[rgba(45,41,38,0.04)]"
          >
            {backingUp ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="mr-2 h-4 w-4 border-2 border-[#6B6560] border-t-transparent rounded-full"
                />
                备份中...
              </>
            ) : (
              <>
                <Database className="mr-1.5 h-4 w-4" />
                立即备份
              </>
            )}
          </Button>
        </div>

        {/* Backup List */}
        <div className="overflow-hidden rounded-xl border border-[rgba(45,41,38,0.08)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(45,41,38,0.08)] bg-[#FAFAF8]">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-[#A39E99]">备份时间</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-[#A39E99]">大小</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-[#A39E99]">状态</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-[#A39E99]">操作</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((b, i) => (
                <motion.tr
                  key={b.id}
                  initial={i === 0 && backingUp === false ? { opacity: 0, y: -10 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: EASE_SMOOTH }}
                  className="border-b border-[rgba(45,41,38,0.06)] transition-colors hover:bg-[rgba(45,41,38,0.02)]"
                >
                  <td className="px-4 py-3 font-mono text-sm text-[#2D2926]">{b.date}</td>
                  <td className="px-4 py-3 text-sm text-[#6B6560]">{b.size}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-[rgba(74,155,142,0.10)] px-2 py-0.5 text-xs font-medium text-[#4A9B8E]">
                      <CheckCircle2 className="h-3 w-3" />
                      完成
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleRestore(b)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.06)] hover:text-[#2D2926]"
                        title="恢复"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBackup(b)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B6560] transition-colors hover:bg-[rgba(199,92,58,0.08)] hover:text-[#C75C3A]"
                        title="删除"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {backups.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-[#A39E99]">
                    暂无备份记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Recovery Card */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(45,41,38,0.06)]">
        <div className="mb-4 flex items-center gap-2">
          <RotateCcw className="h-5 w-5 text-[#D4853C]" />
          <h3 className="text-base font-semibold text-[#2D2926]">数据恢复</h3>
        </div>
        <p className="mb-4 text-sm text-[#6B6560]">
          从备份文件中恢复数据。恢复操作将覆盖当前数据，请谨慎操作。
        </p>

        {/* Upload area */}
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[rgba(45,41,38,0.12)] bg-[#FAFAF8] px-6 py-10 transition-colors hover:border-[#D4853C]">
          <Upload className="mb-3 h-10 w-10 text-[#A39E99]" />
          <p className="text-sm font-medium text-[#2D2926]">拖拽备份文件到此处</p>
          <p className="mt-1 text-xs text-[#A39E99]">或点击选择文件，支持 .json / .sql 格式</p>
          <Button
            variant="outline"
            className="mt-4 rounded-xl border-[rgba(45,41,38,0.12)] text-sm text-[#2D2926] hover:bg-[rgba(45,41,38,0.04)]"
          >
            选择文件
          </Button>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-lg bg-[rgba(199,92,58,0.06)] px-3 py-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#C75C3A]" />
          <p className="text-xs leading-relaxed text-[#C75C3A]">
            恢复数据将覆盖当前数据，请在操作前确保已备份重要信息。
          </p>
        </div>
      </div>

      {/* Data Export Card */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(45,41,38,0.06)]">
        <div className="mb-4 flex items-center gap-2">
          <FileJson className="h-5 w-5 text-[#4A9B8E]" />
          <h3 className="text-base font-semibold text-[#2D2926]">数据导出</h3>
        </div>
        <p className="mb-4 text-sm text-[#6B6560]">
          导出系统所有数据为 JSON 格式，可作为本地备份使用。
        </p>
        <Button
          onClick={handleExport}
          className="rounded-xl bg-[#D4853C] text-white hover:bg-[#BF7532]"
        >
          <Download className="mr-1.5 h-4 w-4" />
          导出全部数据
        </Button>
      </div>

      {/* Data Cleanup Card */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(45,41,38,0.06)]">
        <div className="mb-4 flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-[#C75C3A]" />
          <h3 className="text-base font-semibold text-[#2D2926]">数据清理</h3>
        </div>
        <p className="mb-4 text-sm text-[#6B6560]">
          清理过期数据可释放存储空间。此操作不可撤销。
        </p>

        <div className="mb-4 flex flex-wrap gap-3">
          <Select value={cleanupType} onValueChange={setCleanupType}>
            <SelectTrigger className="h-11 w-[180px] rounded-xl border-[rgba(45,41,38,0.12)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="sales">销售记录</SelectItem>
              <SelectItem value="logs">操作日志</SelectItem>
              <SelectItem value="backups">备份文件</SelectItem>
            </SelectContent>
          </Select>

          <Select value={cleanupRange} onValueChange={setCleanupRange}>
            <SelectTrigger className="h-11 w-[180px] rounded-xl border-[rgba(45,41,38,0.12)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="1year">清理1年前数据</SelectItem>
              <SelectItem value="3year">清理3年前数据</SelectItem>
              <SelectItem value="all">清理所有数据</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mb-4 flex items-start gap-2 rounded-lg bg-[rgba(199,92,58,0.06)] px-3 py-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#C75C3A]" />
          <p className="text-xs leading-relaxed text-[#C75C3A]">
            数据清理将永久删除选定的数据，请在操作前确保已备份重要信息。
          </p>
        </div>

        <Button
          onClick={handleCleanup}
          className="rounded-xl bg-[#C75C3A] text-white hover:bg-[#a8492d]"
        >
          <Trash2 className="mr-1.5 h-4 w-4" />
          开始清理
        </Button>
      </div>

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
