import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Store,
  Receipt,
  Bell,
  Ruler,
  Save,
  Plus,
  Trash2,
  Pencil,
  ImagePlus,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

// ---- Types ----
interface StoreSettings {
  storeName: string;
  address: string;
  manager: string;
  phone: string;
  storeType: string;
  businessHours: string;
}

interface ReceiptSettings {
  header: string;
  subHeader: string;
  footer: string;
  showLogo: boolean;
  autoPrint: boolean;
  fontSize: string;
}

interface AlertSettings {
  lowStockThreshold: number;
  overstockDays: number;
  notifySystem: boolean;
  notifySound: boolean;
}

interface SizeGroup {
  id: string;
  name: string;
  sizes: string[];
  isDefault: boolean;
}

// ---- Components ----

function SectionCard({
  icon: Icon,
  iconColor,
  title,
  children,
}: {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(45,41,38,0.06)]">
      <div className="mb-5 flex items-center gap-2">
        <Icon className={cn('h-5 w-5', iconColor)} />
        <h3 className="text-base font-semibold text-[#2D2926]">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function FormField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="block text-xs font-medium text-[#2D2926]">{label}</label>
      {children}
    </div>
  );
}

// ---- Main Component ----
export default function BasicSettings() {
  // ---- Store Settings ----
  const [store, setStore] = useState<StoreSettings>({
    storeName: '王府井分店',
    address: '北京市东城区王府井大街255号',
    manager: '李明',
    phone: '010-8888-1002',
    storeType: 'direct',
    businessHours: '09:00 - 22:00',
  });

  // ---- Receipt Settings ----
  const [receipt, setReceipt] = useState<ReceiptSettings>({
    header: 'StyleStock',
    subHeader: '欢迎光临',
    footer: '谢谢惠顾，欢迎下次光临',
    showLogo: true,
    autoPrint: false,
    fontSize: 'medium',
  });

  // ---- Alert Settings ----
  const [alert, setAlert] = useState<AlertSettings>({
    lowStockThreshold: 5,
    overstockDays: 30,
    notifySystem: true,
    notifySound: true,
  });

  // ---- Size Groups ----
  const [sizeGroups, setSizeGroups] = useState<SizeGroup[]>([
    { id: 'sg1', name: '标准成人码', sizes: ['S', 'M', 'L', 'XL', 'XXL'], isDefault: true },
    { id: 'sg2', name: '欧码', sizes: ['XS', 'S', 'M', 'L', 'XL'], isDefault: false },
    { id: 'sg3', name: '童装码', sizes: ['90', '100', '110', '120', '130'], isDefault: false },
    { id: 'sg4', name: '大码', sizes: ['XL', 'XXL', 'XXXL', '4XL'], isDefault: false },
  ]);

  const [sizeModalOpen, setSizeModalOpen] = useState(false);
  const [editingSizeGroup, setEditingSizeGroup] = useState<SizeGroup | null>(null);
  const [sizeForm, setSizeForm] = useState({ name: '', sizes: '', isDefault: false });
  const [sizeErrors, setSizeErrors] = useState<Record<string, string>>({});

  const [savedToast, setSavedToast] = useState(false);

  const openAddSizeGroup = () => {
    setEditingSizeGroup(null);
    setSizeForm({ name: '', sizes: '', isDefault: false });
    setSizeErrors({});
    setSizeModalOpen(true);
  };

  const openEditSizeGroup = (group: SizeGroup) => {
    setEditingSizeGroup(group);
    setSizeForm({ name: group.name, sizes: group.sizes.join('/'), isDefault: group.isDefault });
    setSizeErrors({});
    setSizeModalOpen(true);
  };

  const validateSizeForm = () => {
    const errs: Record<string, string> = {};
    if (!sizeForm.name.trim()) errs.name = '请输入尺码组名称';
    if (!sizeForm.sizes.trim()) errs.sizes = '请输入尺码，用 / 分隔';
    setSizeErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveSizeGroup = () => {
    if (!validateSizeForm()) return;
    const sizes = sizeForm.sizes.split('/').map((s) => s.trim()).filter(Boolean);
    if (editingSizeGroup) {
      setSizeGroups(sizeGroups.map((g) =>
        g.id === editingSizeGroup.id ? { ...g, name: sizeForm.name, sizes, isDefault: sizeForm.isDefault } : g
      ));
    } else {
      setSizeGroups([...sizeGroups, {
        id: `sg_${Date.now()}`,
        name: sizeForm.name,
        sizes,
        isDefault: sizeForm.isDefault,
      }]);
    }
    setSizeModalOpen(false);
  };

  const handleDeleteSizeGroup = (id: string) => {
    setSizeGroups(sizeGroups.filter((g) => g.id !== id));
  };

  const handleSaveAll = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#2D2926]">基础设置</h2>
        <Button
          onClick={handleSaveAll}
          className="rounded-xl bg-[#D4853C] text-white hover:bg-[#BF7532]"
        >
          <Save className="mr-1.5 h-4 w-4" />
          保存设置
        </Button>
      </div>

      {/* Store Settings */}
      <SectionCard icon={Store} iconColor="text-[#4A9B8E]" title="门店信息">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="门店名称">
            <Input
              value={store.storeName}
              onChange={(e) => setStore({ ...store, storeName: e.target.value })}
              className="h-11 rounded-xl border-[rgba(45,41,38,0.12)] text-sm focus:border-[#D4853C]"
            />
          </FormField>
          <FormField label="门店类型">
            <Select value={store.storeType} onValueChange={(v) => setStore({ ...store, storeType: v })}>
              <SelectTrigger className="h-11 rounded-xl border-[rgba(45,41,38,0.12)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="direct">直营店</SelectItem>
                <SelectItem value="franchise">加盟店</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="门店地址" className="sm:col-span-2">
            <Input
              value={store.address}
              onChange={(e) => setStore({ ...store, address: e.target.value })}
              className="h-11 rounded-xl border-[rgba(45,41,38,0.12)] text-sm focus:border-[#D4853C]"
            />
          </FormField>
          <FormField label="负责人">
            <Input
              value={store.manager}
              onChange={(e) => setStore({ ...store, manager: e.target.value })}
              className="h-11 rounded-xl border-[rgba(45,41,38,0.12)] text-sm focus:border-[#D4853C]"
            />
          </FormField>
          <FormField label="联系电话">
            <Input
              value={store.phone}
              onChange={(e) => setStore({ ...store, phone: e.target.value })}
              className="h-11 rounded-xl border-[rgba(45,41,38,0.12)] text-sm focus:border-[#D4853C]"
            />
          </FormField>
          <FormField label="营业时间" className="sm:col-span-2">
            <Input
              value={store.businessHours}
              onChange={(e) => setStore({ ...store, businessHours: e.target.value })}
              placeholder="如 09:00 - 22:00"
              className="h-11 rounded-xl border-[rgba(45,41,38,0.12)] text-sm focus:border-[#D4853C]"
            />
          </FormField>
          <FormField label="门店LOGO" className="sm:col-span-2">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-[rgba(45,41,38,0.12)] bg-[#FAFAF8]">
                <ImagePlus className="h-6 w-6 text-[#A39E99]" />
              </div>
              <Button
                variant="outline"
                className="rounded-xl border-[rgba(45,41,38,0.12)] text-sm text-[#2D2926] hover:bg-[rgba(45,41,38,0.04)]"
              >
                上传LOGO
              </Button>
            </div>
          </FormField>
        </div>
      </SectionCard>

      {/* Receipt Settings */}
      <SectionCard icon={Receipt} iconColor="text-[#D4853C]" title="小票设置">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="小票标题">
            <Input
              value={receipt.header}
              onChange={(e) => setReceipt({ ...receipt, header: e.target.value })}
              className="h-11 rounded-xl border-[rgba(45,41,38,0.12)] text-sm focus:border-[#D4853C]"
            />
          </FormField>
          <FormField label="小票副标题">
            <Input
              value={receipt.subHeader}
              onChange={(e) => setReceipt({ ...receipt, subHeader: e.target.value })}
              placeholder="欢迎光临"
              className="h-11 rounded-xl border-[rgba(45,41,38,0.12)] text-sm focus:border-[#D4853C]"
            />
          </FormField>
          <FormField label="底部留言" className="sm:col-span-2">
            <Input
              value={receipt.footer}
              onChange={(e) => setReceipt({ ...receipt, footer: e.target.value })}
              className="h-11 rounded-xl border-[rgba(45,41,38,0.12)] text-sm focus:border-[#D4853C]"
            />
          </FormField>
          <FormField label="字体大小">
            <Select value={receipt.fontSize} onValueChange={(v) => setReceipt({ ...receipt, fontSize: v })}>
              <SelectTrigger className="h-11 rounded-xl border-[rgba(45,41,38,0.12)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="small">小</SelectItem>
                <SelectItem value="medium">中</SelectItem>
                <SelectItem value="large">大</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <div className="flex items-end gap-6 pb-1">
            <div className="flex items-center gap-3">
              <Switch
                checked={receipt.showLogo}
                onCheckedChange={(v) => setReceipt({ ...receipt, showLogo: v })}
                className="data-[state=checked]:bg-[#D4853C]"
              />
              <span className="text-sm text-[#2D2926]">打印LOGO</span>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={receipt.autoPrint}
                onCheckedChange={(v) => setReceipt({ ...receipt, autoPrint: v })}
                className="data-[state=checked]:bg-[#D4853C]"
              />
              <span className="text-sm text-[#2D2926]">自动打印</span>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Alert Settings */}
      <SectionCard icon={Bell} iconColor="text-[#C75C3A]" title="预警设置">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="库存预警阈值">
            <Input
              type="number"
              value={alert.lowStockThreshold}
              onChange={(e) => setAlert({ ...alert, lowStockThreshold: Number(e.target.value) })}
              className="h-11 rounded-xl border-[rgba(45,41,38,0.12)] text-sm focus:border-[#D4853C]"
            />
          </FormField>
          <FormField label="滞销判定天数">
            <Input
              type="number"
              value={alert.overstockDays}
              onChange={(e) => setAlert({ ...alert, overstockDays: Number(e.target.value) })}
              className="h-11 rounded-xl border-[rgba(45,41,38,0.12)] text-sm focus:border-[#D4853C]"
            />
          </FormField>
          <div className="flex items-end gap-6 pb-1 sm:col-span-2">
            <div className="flex items-center gap-3">
              <Switch
                checked={alert.notifySystem}
                onCheckedChange={(v) => setAlert({ ...alert, notifySystem: v })}
                className="data-[state=checked]:bg-[#D4853C]"
              />
              <span className="text-sm text-[#2D2926]">系统消息</span>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={alert.notifySound}
                onCheckedChange={(v) => setAlert({ ...alert, notifySound: v })}
                className="data-[state=checked]:bg-[#D4853C]"
              />
              <span className="text-sm text-[#2D2926]">声音提醒</span>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Size System Settings */}
      <SectionCard icon={Ruler} iconColor="text-[#6B6560]" title="尺码体系">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-[#6B6560]">管理商品尺码分组，支持为不同品类设置不同尺码标准</p>
          <Button
            onClick={openAddSizeGroup}
            className="rounded-xl bg-[#D4853C] text-white hover:bg-[#BF7532]"
            size="sm"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            新增尺码组
          </Button>
        </div>

        <div className="space-y-3">
          {sizeGroups.map((group) => (
            <div
              key={group.id}
              className="flex items-center gap-4 rounded-xl border border-[rgba(45,41,38,0.08)] bg-[#FAFAF8] px-4 py-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#2D2926]">{group.name}</span>
                  {group.isDefault && (
                    <span className="rounded-md bg-[rgba(212,133,60,0.12)] px-1.5 py-0.5 text-[10px] font-medium text-[#D4853C]">
                      默认
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {group.sizes.map((size) => (
                    <span
                      key={size}
                      className="inline-flex items-center rounded-md border border-[rgba(45,41,38,0.10)] bg-white px-2 py-0.5 text-xs text-[#6B6560]"
                    >
                      {size}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditSizeGroup(group)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.06)] hover:text-[#2D2926]"
                  title="编辑"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteSizeGroup(group.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B6560] transition-colors hover:bg-[rgba(199,92,58,0.08)] hover:text-[#C75C3A]"
                  title="删除"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Size Group Modal */}
      <Dialog open={sizeModalOpen} onOpenChange={setSizeModalOpen}>
        <DialogContent className="rounded-2xl border border-[rgba(45,41,38,0.12)] bg-white shadow-[0_20px_60px_rgba(45,41,38,0.15)] sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#2D2926]">
              {editingSizeGroup ? '编辑尺码组' : '新增尺码组'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#2D2926]">尺码组名称</label>
              <Input
                value={sizeForm.name}
                onChange={(e) => setSizeForm({ ...sizeForm, name: e.target.value })}
                placeholder="如：标准成人码"
                className={cn(
                  'h-11 rounded-xl border-[rgba(45,41,38,0.12)] text-sm focus:border-[#D4853C]',
                  sizeErrors.name && 'border-[#C75C3A]'
                )}
              />
              {sizeErrors.name && <p className="mt-1 text-xs text-[#C75C3A]">{sizeErrors.name}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#2D2926]">尺码列表</label>
              <Input
                value={sizeForm.sizes}
                onChange={(e) => setSizeForm({ ...sizeForm, sizes: e.target.value })}
                placeholder="用 / 分隔，如：S/M/L/XL/XXL"
                className={cn(
                  'h-11 rounded-xl border-[rgba(45,41,38,0.12)] text-sm focus:border-[#D4853C]',
                  sizeErrors.sizes && 'border-[#C75C3A]'
                )}
              />
              {sizeErrors.sizes && <p className="mt-1 text-xs text-[#C75C3A]">{sizeErrors.sizes}</p>}
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-[rgba(45,41,38,0.08)] px-4 py-3">
              <Switch
                checked={sizeForm.isDefault}
                onCheckedChange={(v) => setSizeForm({ ...sizeForm, isDefault: v })}
                className="data-[state=checked]:bg-[#D4853C]"
              />
              <span className="text-sm text-[#2D2926]">设为默认尺码组</span>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSizeModalOpen(false)}
              className="rounded-xl border-[rgba(45,41,38,0.12)]"
            >
              取消
            </Button>
            <Button
              onClick={handleSaveSizeGroup}
              className="rounded-xl bg-[#D4853C] text-white hover:bg-[#BF7532]"
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Toast */}
      {savedToast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed right-6 bottom-6 z-50 flex items-center gap-2 rounded-xl bg-[#4A9B8E] px-4 py-3 text-sm font-medium text-white shadow-[0_8px_24px_rgba(45,41,38,0.15)]"
        >
          <Check className="h-4 w-4" />
          设置已保存
        </motion.div>
      )}
    </div>
  );
}
