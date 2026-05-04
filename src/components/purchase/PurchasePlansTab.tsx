import { useState, useMemo } from 'react';
import {
  PlusCircle, Search, X, Eye, Pencil, Trash2,
  ArrowRightCircle, PackageOpen,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { PurchasePlan, PurchasePlanItem } from '@/types';
import {
  planStatusMap, generatePlanNo, fmtMoney, fmtDate
} from './utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const STEPS = ['未下单', '已下单', '已入库'];

function getStepProgress(status: PurchasePlan['status']) {
  switch (status) {
    case 'draft': case 'pending': case 'approved': return 0;
    case 'ordered': return 0.5;
    case 'completed': return 1;
    case 'cancelled': return -1;
    default: return 0;
  }
}

function getStepLabelIndex(status: PurchasePlan['status']) {
  switch (status) {
    case 'draft': case 'pending': case 'approved': return 0;
    case 'ordered': return 1;
    case 'completed': return 2;
    default: return 0;
  }
}

export default function PurchasePlansTab() {
  const { state, dispatch } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PurchasePlan | null>(null);
  const [detailPlan, setDetailPlan] = useState<PurchasePlan | null>(null);
  const [showConvertConfirm, setShowConvertConfirm] = useState(false);
  const [convertingPlan, setConvertingPlan] = useState<PurchasePlan | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formSupplier, setFormSupplier] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formItems, setFormItems] = useState<PurchasePlanItem[]>([]);

  const plans = state.purchasePlans;

  const filtered = useMemo(() => {
    return plans.filter(p => {
      const matchSearch = !search || p.planNo.toLowerCase().includes(search.toLowerCase()) || p.supplierName.includes(search) || p.title.includes(search);
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [plans, search, statusFilter]);

  const pendingCount = plans.filter(p => p.status !== 'completed' && p.status !== 'cancelled').length;
  const completedCount = plans.filter(p => p.status === 'completed').length;

  function resetForm() {
    setFormTitle('');
    setFormSupplier('');
    setFormDate('');
    setFormNotes('');
    setFormItems([]);
    setEditingPlan(null);
  }

  function openCreate() {
    resetForm();
    setShowModal(true);
  }

  function openEdit(plan: PurchasePlan) {
    setEditingPlan(plan);
    setFormTitle(plan.title);
    setFormSupplier(plan.supplierId);
    setFormDate(plan.expectedDate);
    setFormNotes('');
    setFormItems([...plan.items]);
    setShowModal(true);
  }

  function addItemRow() {
    setFormItems(prev => [...prev, {
      productId: '', sku: '', productName: '', color: '', size: '',
      quantity: 1, unitPrice: 0, totalPrice: 0,
    }]);
  }

  function updateItemRow(idx: number, patch: Partial<PurchasePlanItem>) {
    setFormItems(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      if (patch.quantity !== undefined || patch.unitPrice !== undefined) {
        next[idx].totalPrice = next[idx].quantity * next[idx].unitPrice;
      }
      return next;
    });
  }

  function removeItemRow(idx: number) {
    setFormItems(prev => prev.filter((_, i) => i !== idx));
  }

  function handleSubmit() {
    if (!formTitle || !formSupplier) {
      toast.error('请填写计划名称和供应商');
      return;
    }
    if (formItems.length === 0) {
      toast.error('请至少添加一个商品');
      return;
    }
    const supplier = state.suppliers.find(s => s.id === formSupplier);
    const totalAmount = formItems.reduce((sum, it) => sum + it.totalPrice, 0);
    const totalQty = formItems.reduce((sum, it) => sum + it.quantity, 0);

    if (editingPlan) {
      const updated: PurchasePlan = {
        ...editingPlan,
        title: formTitle,
        supplierId: formSupplier,
        supplierName: supplier?.name || editingPlan.supplierName,
        items: formItems,
        totalAmount,
        totalQuantity: totalQty,
        expectedDate: formDate,
      };
      dispatch({ type: 'UPDATE_PURCHASE_ORDER' as any, payload: updated as any });
      toast.success('计划已更新');
    } else {
      const newPlan: PurchasePlan = {
        id: `pp${Date.now()}`,
        planNo: generatePlanNo(),
        title: formTitle,
        supplierId: formSupplier,
        supplierName: supplier?.name || '未知供应商',
        items: formItems,
        totalAmount,
        totalQuantity: totalQty,
        status: 'draft',
        createdAt: new Date().toISOString().slice(0, 10),
        expectedDate: formDate,
        createdBy: state.user?.name || '系统用户',
      };
      dispatch({ type: 'ADD_PURCHASE_ORDER' as any, payload: newPlan as any });
      toast.success('计划已创建');
    }
    setShowModal(false);
    resetForm();
  }

  function handleDelete(plan: PurchasePlan) {
    if (!confirm('确定要删除该采购计划吗？')) return;
    const updated = { ...plan, status: 'cancelled' as const };
    dispatch({ type: 'UPDATE_PURCHASE_ORDER' as any, payload: updated as any });
    toast.success('计划已取消');
  }

  function handleConvert(plan: PurchasePlan) {
    setConvertingPlan(plan);
    setShowConvertConfirm(true);
  }

  function confirmConvert() {
    if (!convertingPlan) return;
    // Create order from plan
    const newOrder = {
      id: `po${Date.now()}`,
      orderNo: generatePlanNo().replace('JH', 'CG'),
      planId: convertingPlan.id,
      supplierId: convertingPlan.supplierId,
      supplierName: convertingPlan.supplierName,
      items: convertingPlan.items.map(it => ({
        ...it,
        receivedQuantity: 0,
      })),
      totalAmount: convertingPlan.totalAmount,
      totalQuantity: convertingPlan.totalQuantity,
      status: 'pending' as const,
      inboundStatus: 'not_started' as const,
      createdAt: new Date().toISOString().slice(0, 10),
      expectedDate: convertingPlan.expectedDate,
      createdBy: state.user?.name || '系统用户',
      notes: '',
    };
    dispatch({ type: 'ADD_PURCHASE_ORDER', payload: newOrder });
    // Update plan status
    const updatedPlan = { ...convertingPlan, status: 'ordered' as const };
    dispatch({ type: 'UPDATE_PURCHASE_ORDER' as any, payload: updatedPlan as any });
    toast.success('已转为采购订单');
    setShowConvertConfirm(false);
    setConvertingPlan(null);
  }

  function selectProductForRow(idx: number, productId: string) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    const spec = product.specs[0];
    const size = spec ? Object.keys(spec.sizes)[0] || 'M' : 'M';
    updateItemRow(idx, {
      productId: product.id,
      sku: product.sku,
      productName: product.name,
      color: spec?.color || '',
      size,
      unitPrice: product.costPrice,
      totalPrice: product.costPrice * (formItems[idx]?.quantity || 1),
    });
  }

  const formTotal = formItems.reduce((s, it) => s + it.totalPrice, 0);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            onClick={openCreate}
            className="h-10 gap-2 rounded-xl bg-[#D4853C] px-5 font-semibold text-white hover:bg-[#BF7532] hover:shadow-[0_2px_8px_rgba(212,133,60,0.30)]"
          >
            <PlusCircle className="h-4 w-4" />
            新建计划
          </Button>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A39E99]" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索计划编号、供应商..."
              className="h-10 w-64 rounded-xl border-[rgba(45,41,38,0.12)] pl-9 text-sm placeholder:text-[#A39E99] focus:border-[#D4853C] focus:ring-[#D4853C]/20"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 w-36 rounded-xl border-[rgba(45,41,38,0.12)] text-sm">
              <SelectValue placeholder="全部状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="draft">草稿</SelectItem>
              <SelectItem value="pending">待审批</SelectItem>
              <SelectItem value="approved">已批准</SelectItem>
              <SelectItem value="ordered">已下单</SelectItem>
              <SelectItem value="completed">已完成</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-4 text-xs text-[#A39E99]">
          <span>待执行: <strong className="text-[#D4853C]">{pendingCount}</strong></span>
          <span>已完成: <strong className="text-[#4A9B8E]">{completedCount}</strong></span>
        </div>
      </div>

      {/* Plans Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <PackageOpen className="h-12 w-12 text-[#A39E99] opacity-50" />
          <p className="mt-4 text-sm text-[#6B6560]">暂无采购计划</p>
          <Button onClick={openCreate} variant="outline" className="mt-3 rounded-xl">创建第一个计划</Button>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
          {filtered.map(plan => {
            const st = planStatusMap[plan.status] || planStatusMap.draft;
            const progress = getStepProgress(plan.status);
            const stepIdx = getStepLabelIndex(plan.status);
            return (
              <div
                key={plan.id}
                className="group rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(45,41,38,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(45,41,38,0.10)]"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-sm font-medium text-[#2D2926]">{plan.planNo}</span>
                    <h3 className="mt-1 text-base font-semibold text-[#2D2926]">{plan.title}</h3>
                  </div>
                  <span
                    className="rounded-lg px-2.5 py-1 text-[11px] font-medium"
                    style={{ color: st.color, background: st.bg }}
                  >
                    {st.label}
                  </span>
                </div>

                {/* Body */}
                <div className="mt-3 space-y-2">
                  <p className="text-sm text-[#6B6560]">
                    <span className="text-[#A39E99]">供应商: </span>
                    <span className="font-medium text-[#2D2926]">{plan.supplierName}</span>
                  </p>
                  <p className="text-sm text-[#6B6560]">
                    <span className="text-[#A39E99]">商品: </span>
                    {plan.items.length} 款 {plan.totalQuantity} 件
                  </p>
                  <p className="font-mono text-lg font-semibold text-[#2D2926]">
                    {fmtMoney(plan.totalAmount)}
                  </p>
                  <p className="text-xs text-[#A39E99]">
                    交货日期: {plan.expectedDate || '未设置'}
                  </p>
                </div>

                {/* Progress */}
                {progress >= 0 && (
                  <div className="mt-4">
                    <div className="h-1 overflow-hidden rounded-full bg-[#E9E6E1]">
                      <div
                        className="h-full rounded-full bg-[#D4853C] transition-all duration-700"
                        style={{ width: `${progress * 100}%` }}
                      />
                    </div>
                    <div className="mt-2 flex justify-between">
                      {STEPS.map((s, i) => (
                        <span
                          key={s}
                          className="text-[10px]"
                          style={{
                            color: i <= stepIdx ? '#D4853C' : '#A39E99',
                            fontWeight: i <= stepIdx ? 600 : 400,
                          }}
                        >
                          {i < stepIdx ? '✓ ' : ''}{s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex gap-2 border-t border-[rgba(45,41,38,0.08)] pt-3">
                  <button
                    onClick={() => setDetailPlan(plan)}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.04)] hover:text-[#2D2926]"
                  >
                    <Eye className="h-3.5 w-3.5" /> 查看
                  </button>
                  <button
                    onClick={() => openEdit(plan)}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.04)] hover:text-[#2D2926]"
                  >
                    <Pencil className="h-3.5 w-3.5" /> 编辑
                  </button>
                  {plan.status === 'draft' && (
                    <button
                      onClick={() => handleConvert(plan)}
                      className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-[#D4853C] transition-colors hover:bg-[rgba(212,133,60,0.08)]"
                    >
                      <ArrowRightCircle className="h-3.5 w-3.5" /> 转为订单
                    </button>
                  )}
                  {(plan.status === 'draft' || plan.status === 'pending') && (
                    <button
                      onClick={() => handleDelete(plan)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-[#C75C3A] transition-colors hover:bg-[rgba(199,92,58,0.08)]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl bg-white p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-xl font-semibold text-[#2D2926]">
              {editingPlan ? '编辑采购计划' : '新建采购计划'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-6 py-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#2D2926]">计划名称</label>
              <Input
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="输入计划名称"
                className="h-11 rounded-xl border-[rgba(45,41,38,0.12)] focus:border-[#D4853C] focus:ring-[#D4853C]/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#2D2926]">供应商</label>
                <Select value={formSupplier} onValueChange={setFormSupplier}>
                  <SelectTrigger className="h-11 rounded-xl border-[rgba(45,41,38,0.12)]">
                    <SelectValue placeholder="选择供应商" />
                  </SelectTrigger>
                  <SelectContent>
                    {state.suppliers.filter(s => s.status === 'active').map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#2D2926]">交货日期</label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="h-11 rounded-xl border-[rgba(45,41,38,0.12)] focus:border-[#D4853C] focus:ring-[#D4853C]/20"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#2D2926]">备注</label>
              <Textarea
                value={formNotes}
                onChange={e => setFormNotes(e.target.value)}
                placeholder="输入备注信息..."
                className="min-h-[60px] rounded-xl border-[rgba(45,41,38,0.12)] focus:border-[#D4853C] focus:ring-[#D4853C]/20"
              />
            </div>

            {/* Items Table */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-medium text-[#2D2926]">商品清单</label>
                <Button
                  onClick={addItemRow}
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 rounded-lg text-xs"
                >
                  <PlusCircle className="h-3.5 w-3.5" /> 添加商品
                </Button>
              </div>
              {formItems.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-[rgba(45,41,38,0.12)]">
                  <table className="w-full text-sm">
                    <thead className="bg-[#F8F5F2]">
                      <tr>
                        <th className="px-3 py-2 text-left text-[11px] font-medium text-[#A39E99]">商品</th>
                        <th className="px-3 py-2 text-left text-[11px] font-medium text-[#A39E99]">颜色/尺码</th>
                        <th className="px-3 py-2 text-right text-[11px] font-medium text-[#A39E99]">数量</th>
                        <th className="px-3 py-2 text-right text-[11px] font-medium text-[#A39E99]">单价</th>
                        <th className="px-3 py-2 text-right text-[11px] font-medium text-[#A39E99]">小计</th>
                        <th className="px-2 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formItems.map((it, idx) => (
                        <tr key={idx} className="border-t border-[rgba(45,41,38,0.08)]">
                          <td className="px-3 py-2">
                            <Select
                              value={it.productId}
                              onValueChange={v => selectProductForRow(idx, v)}
                            >
                              <SelectTrigger className="h-8 w-40 rounded-lg text-xs">
                                <SelectValue placeholder="选择商品" />
                              </SelectTrigger>
                              <SelectContent>
                                {state.products.filter(p => p.status === 'active').map(p => (
                                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex gap-1">
                              <Input
                                value={it.color}
                                onChange={e => updateItemRow(idx, { color: e.target.value })}
                                placeholder="颜色"
                                className="h-8 w-16 rounded-lg text-xs"
                              />
                              <Input
                                value={it.size}
                                onChange={e => updateItemRow(idx, { size: e.target.value })}
                                placeholder="尺码"
                                className="h-8 w-12 rounded-lg text-xs"
                              />
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              min={1}
                              value={it.quantity}
                              onChange={e => updateItemRow(idx, { quantity: Number(e.target.value) })}
                              className="h-8 w-16 rounded-lg text-right text-xs"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              min={0}
                              value={it.unitPrice}
                              onChange={e => updateItemRow(idx, { unitPrice: Number(e.target.value) })}
                              className="h-8 w-20 rounded-lg text-right text-xs"
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-xs">{fmtMoney(it.totalPrice)}</td>
                          <td className="px-2 py-2">
                            <button onClick={() => removeItemRow(idx)} className="text-[#A39E99] hover:text-[#C75C3A]">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[rgba(45,41,38,0.15)] py-6 text-center text-sm text-[#A39E99]">
                  点击"添加商品"按钮添加商品
                </div>
              )}
              <div className="mt-3 flex justify-end">
                <span className="text-sm text-[#6B6560]">合计: </span>
                <span className="ml-2 font-mono text-lg font-semibold text-[#D4853C]">{fmtMoney(formTotal)}</span>
              </div>
            </div>
          </div>
          <DialogFooter className="px-6 pb-6">
            <Button
              variant="outline"
              onClick={() => { setShowModal(false); resetForm(); }}
              className="h-10 rounded-xl border-[rgba(45,41,38,0.12)]"
            >
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              className="h-10 rounded-xl bg-[#D4853C] px-6 font-semibold text-white hover:bg-[#BF7532]"
            >
              保存计划
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert Confirm Dialog */}
      <Dialog open={showConvertConfirm} onOpenChange={setShowConvertConfirm}>
        <DialogContent className="max-w-sm rounded-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#2D2926]">转为采购订单</DialogTitle>
          </DialogHeader>
          <p className="px-6 py-2 text-sm text-[#6B6560]">
            确定将计划 <strong className="font-mono text-[#2D2926]">{convertingPlan?.planNo}</strong> 转为采购订单吗？<br />
            转换后计划状态将变为"已下单"。
          </p>
          <DialogFooter className="px-6 pb-6">
            <Button variant="outline" onClick={() => setShowConvertConfirm(false)} className="h-10 rounded-xl">取消</Button>
            <Button onClick={confirmConvert} className="h-10 rounded-xl bg-[#D4853C] font-semibold text-white hover:bg-[#BF7532]">确认转换</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Sheet */}
      <Sheet open={!!detailPlan} onOpenChange={() => setDetailPlan(null)}>
        <SheetContent className="w-full overflow-y-auto rounded-l-2xl bg-white sm:max-w-lg">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-xl font-semibold text-[#2D2926]">
              计划详情
            </SheetTitle>
          </SheetHeader>
          {detailPlan && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-lg font-medium text-[#2D2926]">{detailPlan.planNo}</span>
                <span
                  className="rounded-lg px-2.5 py-1 text-xs font-medium"
                  style={{
                    color: (planStatusMap[detailPlan.status] || planStatusMap.draft).color,
                    background: (planStatusMap[detailPlan.status] || planStatusMap.draft).bg,
                  }}
                >
                  {(planStatusMap[detailPlan.status] || planStatusMap.draft).label}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="text-[#A39E99]">计划名称: </span><span className="font-medium text-[#2D2926]">{detailPlan.title}</span></p>
                <p><span className="text-[#A39E99]">供应商: </span><span className="font-medium text-[#2D2926]">{detailPlan.supplierName}</span></p>
                <p><span className="text-[#A39E99]">创建日期: </span>{fmtDate(detailPlan.createdAt)}</p>
                <p><span className="text-[#A39E99]">交货日期: </span>{detailPlan.expectedDate || '未设置'}</p>
                <p><span className="text-[#A39E99]">创建人: </span>{detailPlan.createdBy}</p>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold text-[#2D2926]">商品清单</h4>
                <div className="overflow-hidden rounded-xl border border-[rgba(45,41,38,0.08)]">
                  <table className="w-full text-sm">
                    <thead className="bg-[#F8F5F2]">
                      <tr>
                        <th className="px-3 py-2 text-left text-[11px] font-medium text-[#A39E99]">商品</th>
                        <th className="px-3 py-2 text-left text-[11px] font-medium text-[#A39E99]">规格</th>
                        <th className="px-3 py-2 text-right text-[11px] font-medium text-[#A39E99]">数量</th>
                        <th className="px-3 py-2 text-right text-[11px] font-medium text-[#A39E99]">单价</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailPlan.items.map((it, i) => (
                        <tr key={i} className="border-t border-[rgba(45,41,38,0.08)]">
                          <td className="px-3 py-2 text-[#2D2926]">{it.productName}</td>
                          <td className="px-3 py-2 text-[#6B6560]">{it.color}/{it.size}</td>
                          <td className="px-3 py-2 text-right font-mono">{it.quantity}</td>
                          <td className="px-3 py-2 text-right font-mono">{fmtMoney(it.unitPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 flex justify-end">
                  <span className="text-xs text-[#A39E99]">合计: </span>
                  <span className="ml-1 font-mono text-sm font-semibold text-[#D4853C]">{fmtMoney(detailPlan.totalAmount)}</span>
                </div>
              </div>

              {getStepProgress(detailPlan.status) >= 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-[#2D2926]">进度</h4>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#E9E6E1]">
                    <div
                      className="h-full rounded-full bg-[#D4853C]"
                      style={{ width: `${getStepProgress(detailPlan.status) * 100}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between">
                    {STEPS.map((s, i) => (
                      <span
                        key={s}
                        className="text-[10px]"
                        style={{
                          color: i <= getStepLabelIndex(detailPlan.status) ? '#D4853C' : '#A39E99',
                          fontWeight: i <= getStepLabelIndex(detailPlan.status) ? 600 : 400,
                        }}
                      >
                        {i < getStepLabelIndex(detailPlan.status) ? '✓ ' : ''}{s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
