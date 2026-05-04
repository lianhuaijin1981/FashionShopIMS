import { useState, useMemo } from 'react';
import {
  PlusCircle, Search, X, Eye, CheckCircle, Trash2,
  Truck, ClipboardCheck, PackageOpen
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { PurchaseOrder, PurchaseOrderItem } from '@/types';
import {
  orderStatusMap, generateOrderNo, fmtMoney, fmtDate
} from './utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function PurchaseOrdersTab() {
  const { state, dispatch } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [detailOrder, setDetailOrder] = useState<PurchaseOrder | null>(null);
  const [approveOrder, setApproveOrder] = useState<PurchaseOrder | null>(null);
  const [cancelOrder, setCancelOrder] = useState<PurchaseOrder | null>(null);

  // Form state
  const [formSupplier, setFormSupplier] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formItems, setFormItems] = useState<PurchaseOrderItem[]>([]);

  const orders = state.purchaseOrders;

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const matchSearch = !search || o.orderNo.toLowerCase().includes(search.toLowerCase()) || o.supplierName.includes(search);
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchSupplier = supplierFilter === 'all' || o.supplierId === supplierFilter;
      return matchSearch && matchStatus && matchSupplier;
    });
  }, [orders, search, statusFilter, supplierFilter]);

  function resetForm() {
    setFormSupplier('');
    setFormDate('');
    setFormNotes('');
    setFormItems([]);
  }

  function addItemRow() {
    setFormItems(prev => [...prev, {
      productId: '', sku: '', productName: '', color: '', size: '',
      quantity: 1, receivedQuantity: 0, unitPrice: 0, totalPrice: 0,
    }]);
  }

  function updateItemRow(idx: number, patch: Partial<PurchaseOrderItem>) {
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

  function handleCreateOrder() {
    if (!formSupplier) {
      toast.error('请选择供应商');
      return;
    }
    if (formItems.length === 0) {
      toast.error('请至少添加一个商品');
      return;
    }
    const supplier = state.suppliers.find(s => s.id === formSupplier);
    const totalAmount = formItems.reduce((s, it) => s + it.totalPrice, 0);
    const totalQty = formItems.reduce((s, it) => s + it.quantity, 0);

    const newOrder: PurchaseOrder = {
      id: `po${Date.now()}`,
      orderNo: generateOrderNo(),
      supplierId: formSupplier,
      supplierName: supplier?.name || '未知供应商',
      items: formItems,
      totalAmount,
      totalQuantity: totalQty,
      status: 'pending',
      inboundStatus: 'not_started',
      createdAt: new Date().toISOString().slice(0, 10),
      expectedDate: formDate,
      createdBy: state.user?.name || '系统用户',
      notes: formNotes,
    };
    dispatch({ type: 'ADD_PURCHASE_ORDER', payload: newOrder });
    toast.success('采购订单已创建');
    setShowModal(false);
    resetForm();
  }

  function handleApprove(order: PurchaseOrder) {
    setApproveOrder(order);
  }

  function confirmApprove() {
    if (!approveOrder) return;
    const updated: PurchaseOrder = {
      ...approveOrder,
      status: approveOrder.status === 'pending' ? 'partial' : 'received',
      inboundStatus: approveOrder.status === 'pending' ? 'in_progress' : 'completed',
    };
    dispatch({ type: 'UPDATE_PURCHASE_ORDER', payload: updated });
    toast.success('订单已审核通过');
    setApproveOrder(null);
  }

  function handleCancel(order: PurchaseOrder) {
    setCancelOrder(order);
  }

  function confirmCancel() {
    if (!cancelOrder) return;
    const updated: PurchaseOrder = { ...cancelOrder, status: 'cancelled' as const };
    dispatch({ type: 'UPDATE_PURCHASE_ORDER', payload: updated });
    toast.success('订单已取消');
    setCancelOrder(null);
  }

  function getTimelineSteps(status: string) {
    const steps = [
      { key: 'created', label: '创建', icon: ClipboardCheck },
      { key: 'reviewed', label: '审核', icon: CheckCircle },
      { key: 'shipped', label: '发货', icon: Truck },
      { key: 'received', label: '收货', icon: PackageOpen },
    ];
    let activeIdx = 0;
    if (status === 'pending') activeIdx = 0;
    else if (status === 'partial') activeIdx = 1;
    else if (status === 'received') activeIdx = 3;
    else if (status === 'cancelled') activeIdx = -1;
    return { steps, activeIdx };
  }

  const formTotal = formItems.reduce((s, it) => s + it.totalPrice, 0);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="h-10 gap-2 rounded-xl bg-[#D4853C] px-5 font-semibold text-white hover:bg-[#BF7532] hover:shadow-[0_2px_8px_rgba(212,133,60,0.30)]"
          >
            <PlusCircle className="h-4 w-4" />
            新建订单
          </Button>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A39E99]" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索订单号、供应商..."
              className="h-10 w-56 rounded-xl border-[rgba(45,41,38,0.12)] pl-9 text-sm placeholder:text-[#A39E99] focus:border-[#D4853C] focus:ring-[#D4853C]/20"
            />
          </div>
          <Select value={supplierFilter} onValueChange={setSupplierFilter}>
            <SelectTrigger className="h-10 w-36 rounded-xl border-[rgba(45,41,38,0.12)] text-sm">
              <SelectValue placeholder="供应商" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部供应商</SelectItem>
              {state.suppliers.filter(s => s.status === 'active').map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 w-32 rounded-xl border-[rgba(45,41,38,0.12)] text-sm">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="pending">待审核</SelectItem>
              <SelectItem value="partial">已审核</SelectItem>
              <SelectItem value="received">已收货</SelectItem>
              <SelectItem value="cancelled">已取消</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <span className="text-xs text-[#A39E99]">共 <strong className="text-[#2D2926]">{filtered.length}</strong> 单</span>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-2xl border border-[rgba(45,41,38,0.08)] bg-white shadow-[0_1px_3px_rgba(45,41,38,0.06)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgba(45,41,38,0.08)]">
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">订单号</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">供应商</th>
              <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">数量</th>
              <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">金额</th>
              <th className="px-4 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">状态</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">交货日期</th>
              <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <PackageOpen className="mx-auto h-10 w-10 text-[#A39E99] opacity-40" />
                  <p className="mt-3 text-sm text-[#6B6560]">暂无采购订单</p>
                </td>
              </tr>
            ) : (
              filtered.map(order => {
                const st = orderStatusMap[order.status] || orderStatusMap.pending_review;
                return (
                  <tr
                    key={order.id}
                    className="group border-b border-[rgba(45,41,38,0.08)] transition-colors last:border-0 hover:bg-[rgba(45,41,38,0.03)]"
                  >
                    <td className="px-4 py-3.5 font-mono text-sm font-medium text-[#2D2926]">{order.orderNo}</td>
                    <td className="px-4 py-3.5 text-sm text-[#2D2926]">{order.supplierName}</td>
                    <td className="px-4 py-3.5 text-right font-mono text-sm text-[#6B6560]">{order.totalQuantity}</td>
                    <td className="px-4 py-3.5 text-right font-mono text-sm font-semibold text-[#2D2926]">{fmtMoney(order.totalAmount)}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className="inline-block rounded-lg px-2.5 py-1 text-[11px] font-medium"
                        style={{ color: st.color, background: st.bg }}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-[#6B6560]">{fmtDate(order.expectedDate)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setDetailOrder(order)}
                          className="rounded-lg p-1.5 text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.04)] hover:text-[#2D2926]"
                          title="查看"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {order.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(order)}
                              className="rounded-lg p-1.5 text-[#4A9B8E] transition-colors hover:bg-[rgba(74,155,142,0.08)]"
                              title="审核"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleCancel(order)}
                              className="rounded-lg p-1.5 text-[#C75C3A] transition-colors hover:bg-[rgba(199,92,58,0.08)]"
                              title="取消"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Order Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl bg-white p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-xl font-semibold text-[#2D2926]">新建采购订单</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-6 py-4">
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
                className="min-h-[60px] rounded-xl border-[rgba(45,41,38,0.12)]"
              />
            </div>

            {/* Items */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-medium text-[#2D2926]">商品清单</label>
                <Button onClick={addItemRow} variant="outline" size="sm" className="h-8 gap-1 rounded-lg text-xs">
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
                            <Select value={it.productId} onValueChange={v => selectProductForRow(idx, v)}>
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
                              <Input value={it.color} onChange={e => updateItemRow(idx, { color: e.target.value })} placeholder="颜色" className="h-8 w-16 rounded-lg text-xs" />
                              <Input value={it.size} onChange={e => updateItemRow(idx, { size: e.target.value })} placeholder="尺码" className="h-8 w-12 rounded-lg text-xs" />
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <Input type="number" min={1} value={it.quantity} onChange={e => updateItemRow(idx, { quantity: Number(e.target.value) })} className="h-8 w-16 rounded-lg text-right text-xs" />
                          </td>
                          <td className="px-3 py-2">
                            <Input type="number" min={0} value={it.unitPrice} onChange={e => updateItemRow(idx, { unitPrice: Number(e.target.value) })} className="h-8 w-20 rounded-lg text-right text-xs" />
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-xs">{fmtMoney(it.totalPrice)}</td>
                          <td className="px-2 py-2">
                            <button onClick={() => removeItemRow(idx)} className="text-[#A39E99] hover:text-[#C75C3A]"><X className="h-3.5 w-3.5" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[rgba(45,41,38,0.15)] py-6 text-center text-sm text-[#A39E99]">点击"添加商品"按钮添加商品</div>
              )}
              <div className="mt-3 flex justify-end">
                <span className="text-sm text-[#6B6560]">合计: </span>
                <span className="ml-2 font-mono text-lg font-semibold text-[#D4853C]">{fmtMoney(formTotal)}</span>
              </div>
            </div>
          </div>
          <DialogFooter className="px-6 pb-6">
            <Button variant="outline" onClick={() => { setShowModal(false); resetForm(); }} className="h-10 rounded-xl">取消</Button>
            <Button onClick={handleCreateOrder} className="h-10 rounded-xl bg-[#D4853C] px-6 font-semibold text-white hover:bg-[#BF7532]">创建订单</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={!!approveOrder} onOpenChange={() => setApproveOrder(null)}>
        <DialogContent className="max-w-sm rounded-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#2D2926]">审核订单</DialogTitle>
          </DialogHeader>
          <p className="px-6 py-2 text-sm text-[#6B6560]">
            确认审核通过订单 <strong className="font-mono text-[#2D2926]">{approveOrder?.orderNo}</strong>？
          </p>
          <DialogFooter className="px-6 pb-6">
            <Button variant="outline" onClick={() => setApproveOrder(null)} className="h-10 rounded-xl">取消</Button>
            <Button onClick={confirmApprove} className="h-10 rounded-xl bg-[#4A9B8E] font-semibold text-white hover:bg-[#3d8578]">确认审核</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={!!cancelOrder} onOpenChange={() => setCancelOrder(null)}>
        <DialogContent className="max-w-sm rounded-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#2D2926]">取消订单</DialogTitle>
          </DialogHeader>
          <p className="px-6 py-2 text-sm text-[#6B6560]">
            确定要取消订单 <strong className="font-mono text-[#2D2926]">{cancelOrder?.orderNo}</strong> 吗？<br />
            取消后不可恢复。
          </p>
          <DialogFooter className="px-6 pb-6">
            <Button variant="outline" onClick={() => setCancelOrder(null)} className="h-10 rounded-xl">取消</Button>
            <Button onClick={confirmCancel} className="h-10 rounded-xl bg-[#C75C3A] font-semibold text-white hover:bg-[#a84d30]">确认取消</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Sheet */}
      <Sheet open={!!detailOrder} onOpenChange={() => setDetailOrder(null)}>
        <SheetContent className="w-full overflow-y-auto rounded-l-2xl bg-white sm:max-w-lg">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-xl font-semibold text-[#2D2926]">订单详情</SheetTitle>
          </SheetHeader>
          {detailOrder && (
            <div className="space-y-5">
              {/* Header info */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-lg font-medium text-[#2D2926]">{detailOrder.orderNo}</span>
                <span
                  className="rounded-lg px-2.5 py-1 text-xs font-medium"
                  style={{
                    color: (orderStatusMap[detailOrder.status] || orderStatusMap.pending_review).color,
                    background: (orderStatusMap[detailOrder.status] || orderStatusMap.pending_review).bg,
                  }}
                >
                  {(orderStatusMap[detailOrder.status] || orderStatusMap.pending_review).label}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <p><span className="text-[#A39E99]">供应商: </span><span className="font-medium text-[#2D2926]">{detailOrder.supplierName}</span></p>
                <p><span className="text-[#A39E99]">创建日期: </span>{fmtDate(detailOrder.createdAt)}</p>
                <p><span className="text-[#A39E99]">交货日期: </span>{fmtDate(detailOrder.expectedDate)}</p>
                <p><span className="text-[#A39E99]">创建人: </span>{detailOrder.createdBy}</p>
                {detailOrder.notes && <p><span className="text-[#A39E99]">备注: </span>{detailOrder.notes}</p>}
              </div>

              {/* Items */}
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
                      {detailOrder.items.map((it, i) => (
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
                  <span className="ml-1 font-mono text-sm font-semibold text-[#D4853C]">{fmtMoney(detailOrder.totalAmount)}</span>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h4 className="mb-3 text-sm font-semibold text-[#2D2926]">订单进度</h4>
                <div className="flex items-center justify-between">
                  {(() => {
                    const { steps, activeIdx } = getTimelineSteps(detailOrder.status);
                    return steps.map((step, i) => {
                      const Icon = step.icon;
                      const isActive = i <= activeIdx;
                      const isCurrent = i === activeIdx;
                      return (
                        <div key={step.key} className="flex flex-1 flex-col items-center">
                          <div
                            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
                            style={{
                              background: isActive ? (isCurrent ? '#D4853C' : '#4A9B8E') : '#E9E6E1',
                              color: isActive ? '#fff' : '#A39E99',
                            }}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <span
                            className="mt-1.5 text-[10px] font-medium"
                            style={{ color: isActive ? '#2D2926' : '#A39E99' }}
                          >
                            {step.label}
                          </span>
                          {i < steps.length - 1 && (
                            <div
                              className="absolute h-0.5 w-full"
                              style={{
                                background: i < activeIdx ? '#4A9B8E' : '#E9E6E1',
                                left: '50%',
                                top: '18px',
                              }}
                            />
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
                {/* Simple line version */}
                <div className="mt-4 flex items-center">
                  {(() => {
                    const { steps, activeIdx } = getTimelineSteps(detailOrder.status);
                    return steps.map((step, i) => {
                      const isActive = i <= activeIdx;
                      const isCurrent = i === activeIdx;
                      return (
                        <div key={step.key} className="flex flex-1 items-center">
                          <div className="flex flex-col items-center">
                            <div
                              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                              style={{
                                background: isActive ? (isCurrent ? '#D4853C' : '#4A9B8E') : '#E9E6E1',
                                color: isActive ? '#fff' : '#A39E99',
                              }}
                            >
                              {i + 1}
                            </div>
                            <span className="mt-1 text-[10px]" style={{ color: isActive ? '#2D2926' : '#A39E99' }}>{step.label}</span>
                          </div>
                          {i < steps.length - 1 && (
                            <div className="relative top-[-8px] mx-1 h-0.5 flex-1" style={{ background: i < activeIdx ? '#4A9B8E' : '#E9E6E1' }} />
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Actions */}
              {detailOrder.status === 'pending' && (
                <div className="flex gap-3 pt-2">
                  <Button onClick={() => { setDetailOrder(null); handleApprove(detailOrder); }} className="h-10 flex-1 rounded-xl bg-[#4A9B8E] font-semibold text-white hover:bg-[#3d8578]">
                    <CheckCircle className="mr-1.5 h-4 w-4" /> 审核通过
                  </Button>
                  <Button onClick={() => { setDetailOrder(null); handleCancel(detailOrder); }} variant="outline" className="h-10 flex-1 rounded-xl border-[#C75C3A] text-[#C75C3A] hover:bg-[rgba(199,92,58,0.08)]">
                    <Trash2 className="mr-1.5 h-4 w-4" /> 取消订单
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
