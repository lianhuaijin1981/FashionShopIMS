import { useState, useMemo, useEffect } from 'react';
import {
  PlusCircle, Search, Eye, CheckCircle, XCircle, PackageOpen,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { ReturnRecord, ReturnItem } from './utils';
import {
  returnStatusMap, returnReasonMap, generateReturnNo,
  fmtMoney, fmtDate, loadReturnRecords, saveReturnRecords
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
import { toast } from 'sonner';

export default function ReturnsTab() {
  const { state } = useApp();
  const [records, setRecords] = useState<ReturnRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [detailRecord, setDetailRecord] = useState<ReturnRecord | null>(null);
  const [approveRecord, setApproveRecord] = useState<ReturnRecord | null>(null);
  const [rejectRecord, setRejectRecord] = useState<ReturnRecord | null>(null);

  // Form state
  const [formOrder, setFormOrder] = useState('');
  const [formItems, setFormItems] = useState<ReturnItem[]>([]);
  const [formReason, setFormReason] = useState<ReturnRecord['reason']>('quality_issue');
  const [formDetail, setFormDetail] = useState('');
  const [formOperator, setFormOperator] = useState('');

  useEffect(() => {
    const loaded = loadReturnRecords();
    if (loaded.length === 0) {
      // Seed initial data
      const seed: ReturnRecord[] = [
        {
          id: 'r1', returnNo: 'TH20250401', orderId: 'po1', orderNo: 'CG20250401001',
          supplierId: 's1', supplierName: '上海盛泰纺织',
          items: [{ productId: 'p1', sku: 'A1001', productName: '经典款T恤', color: '黑色', size: 'M', quantity: 10, unitPrice: 120, totalPrice: 1200 }],
          totalAmount: 1200, reason: 'quality_issue', reasonDetail: '面料有瑕疵，色差严重',
          status: 'pending', date: '2025-04-01', operator: '张丽'
        },
        {
          id: 'r2', returnNo: 'TH20250328', orderId: 'po2', orderNo: 'CG20250401002',
          supplierId: 's2', supplierName: '广州锦瑟服饰',
          items: [{ productId: 'p2', sku: 'B2001', productName: '修身牛仔裤', color: '蓝色', size: 'L', quantity: 5, unitPrice: 200, totalPrice: 1000 }],
          totalAmount: 1000, reason: 'shortage', reasonDetail: '实际到货数量不足',
          status: 'approved', date: '2025-03-28', operator: '王强', approvedDate: '2025-03-29'
        }
      ];
      setRecords(seed);
      saveReturnRecords(seed);
    } else {
      setRecords(loaded);
    }
  }, []);

  function persist(newRecords: ReturnRecord[]) {
    setRecords(newRecords);
    saveReturnRecords(newRecords);
  }

  const filtered = useMemo(() => {
    return records.filter(r => {
      const matchSearch = !search || r.returnNo.toLowerCase().includes(search.toLowerCase()) || r.supplierName.includes(search);
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [records, search, statusFilter]);

  const pendingCount = records.filter(r => r.status === 'pending').length;

  // Available orders for return (received orders)
  const availableOrders = useMemo(() => {
    return state.purchaseOrders.filter(o => o.status === 'received' || o.status === 'partial');
  }, [state.purchaseOrders]);

  function selectOrderForReturn(orderId: string) {
    const order = state.purchaseOrders.find(o => o.id === orderId);
    if (!order) return;
    const items: ReturnItem[] = order.items.map(it => ({
      productId: it.productId,
      sku: it.sku,
      productName: it.productName,
      color: it.color,
      size: it.size,
      quantity: 0,
      unitPrice: it.unitPrice,
      totalPrice: 0,
    }));
    setFormItems(items);
  }

  function updateFormItem(idx: number, qty: number) {
    setFormItems(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], quantity: qty, totalPrice: qty * next[idx].unitPrice };
      return next;
    });
  }

  function handleSubmitReturn() {
    if (!formOrder) {
      toast.error('请选择原采购订单');
      return;
    }
    const items = formItems.filter(it => it.quantity > 0);
    if (items.length === 0) {
      toast.error('请至少选择一个退货商品');
      return;
    }
    const order = state.purchaseOrders.find(o => o.id === formOrder);
    const supplier = state.suppliers.find(s => s.id === order?.supplierId);
    const totalAmount = items.reduce((s, it) => s + it.totalPrice, 0);

    const newRecord: ReturnRecord = {
      id: `r${Date.now()}`,
      returnNo: generateReturnNo(),
      orderId: formOrder,
      orderNo: order?.orderNo || '',
      supplierId: supplier?.id || '',
      supplierName: supplier?.name || order?.supplierName || '未知供应商',
      items,
      totalAmount,
      reason: formReason,
      reasonDetail: formDetail,
      status: 'pending',
      date: new Date().toISOString().slice(0, 10),
      operator: formOperator || state.user?.name || '系统用户',
    };

    const newRecords = [newRecord, ...records];
    persist(newRecords);
    toast.success('退货申请已提交');
    setShowModal(false);
    resetForm();
  }

  function resetForm() {
    setFormOrder('');
    setFormItems([]);
    setFormReason('quality_issue');
    setFormDetail('');
    setFormOperator('');
  }

  function confirmApprove() {
    if (!approveRecord) return;
    const updated: ReturnRecord = {
      ...approveRecord,
      status: 'completed',
      approvedDate: new Date().toISOString().slice(0, 10),
    };
    const newRecords = records.map(r => r.id === updated.id ? updated : r);
    persist(newRecords);
    toast.success('退货申请已通过');
    setApproveRecord(null);
  }

  function confirmReject() {
    if (!rejectRecord) return;
    const updated: ReturnRecord = { ...rejectRecord, status: 'rejected' };
    const newRecords = records.map(r => r.id === updated.id ? updated : r);
    persist(newRecords);
    toast.success('退货申请已拒绝');
    setRejectRecord(null);
  }

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
            退货申请
          </Button>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A39E99]" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索退货单号、供应商..."
              className="h-10 w-56 rounded-xl border-[rgba(45,41,38,0.12)] pl-9 text-sm placeholder:text-[#A39E99] focus:border-[#D4853C] focus:ring-[#D4853C]/20"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 w-32 rounded-xl border-[rgba(45,41,38,0.12)] text-sm">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="pending">待审核</SelectItem>
              <SelectItem value="approved">已通过</SelectItem>
              <SelectItem value="completed">已退货</SelectItem>
              <SelectItem value="rejected">已拒绝</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <span className="text-xs text-[#A39E99]">待审核: <strong className="text-[#C75C3A]">{pendingCount}</strong></span>
      </div>

      {/* Returns Table */}
      <div className="overflow-hidden rounded-2xl border border-[rgba(45,41,38,0.08)] bg-white shadow-[0_1px_3px_rgba(45,41,38,0.06)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgba(45,41,38,0.08)]">
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">退货单号</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">原采购单</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">供应商</th>
              <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">金额</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">退货原因</th>
              <th className="px-4 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">状态</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">日期</th>
              <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <PackageOpen className="mx-auto h-10 w-10 text-[#A39E99] opacity-40" />
                  <p className="mt-3 text-sm text-[#6B6560]">暂无退货记录</p>
                </td>
              </tr>
            ) : (
              filtered.map(record => {
                const st = returnStatusMap[record.status];
                return (
                  <tr
                    key={record.id}
                    className="group border-b border-[rgba(45,41,38,0.08)] transition-colors last:border-0 hover:bg-[rgba(45,41,38,0.03)]"
                  >
                    <td className="px-4 py-3.5 font-mono text-sm font-medium text-[#2D2926]">{record.returnNo}</td>
                    <td className="px-4 py-3.5 font-mono text-sm text-[#6B6560]">{record.orderNo}</td>
                    <td className="px-4 py-3.5 text-sm text-[#2D2926]">{record.supplierName}</td>
                    <td className="px-4 py-3.5 text-right font-mono text-sm font-semibold text-[#2D2926]">{fmtMoney(record.totalAmount)}</td>
                    <td className="px-4 py-3.5 text-sm text-[#6B6560]">{returnReasonMap[record.reason]}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className="inline-block rounded-lg px-2.5 py-1 text-[11px] font-medium"
                        style={{ color: st.color, background: st.bg }}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-[#6B6560]">{fmtDate(record.date)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setDetailRecord(record)}
                          className="rounded-lg p-1.5 text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.04)] hover:text-[#2D2926]"
                          title="查看"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {record.status === 'pending' && (
                          <>
                            <button
                              onClick={() => setApproveRecord(record)}
                              className="rounded-lg p-1.5 text-[#4A9B8E] transition-colors hover:bg-[rgba(74,155,142,0.08)]"
                              title="通过"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setRejectRecord(record)}
                              className="rounded-lg p-1.5 text-[#C75C3A] transition-colors hover:bg-[rgba(199,92,58,0.08)]"
                              title="拒绝"
                            >
                              <XCircle className="h-4 w-4" />
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

      {/* Create Return Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl bg-white p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-xl font-semibold text-[#2D2926]">新建退货申请</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#2D2926]">原采购订单</label>
                <Select value={formOrder} onValueChange={v => { setFormOrder(v); selectOrderForReturn(v); }}>
                  <SelectTrigger className="h-11 rounded-xl border-[rgba(45,41,38,0.12)]">
                    <SelectValue placeholder="选择订单" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOrders.map(o => (
                      <SelectItem key={o.id} value={o.id}>{o.orderNo} - {o.supplierName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#2D2926]">退货原因</label>
                <Select value={formReason} onValueChange={v => setFormReason(v as ReturnRecord['reason'])}>
                  <SelectTrigger className="h-11 rounded-xl border-[rgba(45,41,38,0.12)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quality_issue">质量问题</SelectItem>
                    <SelectItem value="shortage">数量短缺</SelectItem>
                    <SelectItem value="slow_moving">滞销品</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#2D2926]">操作人</label>
                <Input
                  value={formOperator}
                  onChange={e => setFormOperator(e.target.value)}
                  placeholder="操作人姓名"
                  className="h-11 rounded-xl border-[rgba(45,41,38,0.12)]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#2D2926]">详细说明</label>
                <Input
                  value={formDetail}
                  onChange={e => setFormDetail(e.target.value)}
                  placeholder="退货原因详细说明"
                  className="h-11 rounded-xl border-[rgba(45,41,38,0.12)]"
                />
              </div>
            </div>

            {formItems.length > 0 && (
              <div>
                <label className="mb-2 block text-xs font-medium text-[#2D2926]">退货商品</label>
                <div className="overflow-hidden rounded-xl border border-[rgba(45,41,38,0.12)]">
                  <table className="w-full text-sm">
                    <thead className="bg-[#F8F5F2]">
                      <tr>
                        <th className="px-3 py-2 text-left text-[11px] font-medium text-[#A39E99]">商品</th>
                        <th className="px-3 py-2 text-left text-[11px] font-medium text-[#A39E99]">规格</th>
                        <th className="px-3 py-2 text-right text-[11px] font-medium text-[#A39E99]">可退数量</th>
                        <th className="px-3 py-2 text-right text-[11px] font-medium text-[#A39E99]">退货数量</th>
                        <th className="px-3 py-2 text-right text-[11px] font-medium text-[#A39E99]">单价</th>
                        <th className="px-3 py-2 text-right text-[11px] font-medium text-[#A39E99]">小计</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formItems.map((it, idx) => (
                        <tr key={idx} className="border-t border-[rgba(45,41,38,0.08)]">
                          <td className="px-3 py-2 text-[#2D2926]">{it.productName}</td>
                          <td className="px-3 py-2 text-xs text-[#6B6560]">{it.color}/{it.size}</td>
                          <td className="px-3 py-2 text-right font-mono text-xs">{it.quantity}</td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              min={0}
                              max={it.quantity}
                              value={it.quantity}
                              onChange={e => updateFormItem(idx, Number(e.target.value))}
                              className="h-8 w-16 rounded-lg text-right text-xs"
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-xs">{fmtMoney(it.unitPrice)}</td>
                          <td className="px-3 py-2 text-right font-mono text-xs">{fmtMoney(it.totalPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {formItems.length > 0 && (
              <div className="flex justify-end">
                <span className="text-sm text-[#6B6560]">退货金额: </span>
                <span className="ml-2 font-mono text-lg font-semibold text-[#D4853C]">
                  {fmtMoney(formItems.filter(it => it.quantity > 0).reduce((s, it) => s + it.totalPrice, 0))}
                </span>
              </div>
            )}
          </div>
          <DialogFooter className="px-6 pb-6">
            <Button variant="outline" onClick={() => { setShowModal(false); resetForm(); }} className="h-10 rounded-xl">取消</Button>
            <Button onClick={handleSubmitReturn} className="h-10 rounded-xl bg-[#D4853C] px-6 font-semibold text-white hover:bg-[#BF7532]">提交申请</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={!!approveRecord} onOpenChange={() => setApproveRecord(null)}>
        <DialogContent className="max-w-sm rounded-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#2D2926]">审核退货申请</DialogTitle>
          </DialogHeader>
          <p className="px-6 py-2 text-sm text-[#6B6560]">
            确认通过退货申请 <strong className="font-mono text-[#2D2926]">{approveRecord?.returnNo}</strong>？
          </p>
          <DialogFooter className="px-6 pb-6">
            <Button variant="outline" onClick={() => setApproveRecord(null)} className="h-10 rounded-xl">取消</Button>
            <Button onClick={confirmApprove} className="h-10 rounded-xl bg-[#4A9B8E] font-semibold text-white hover:bg-[#3d8578]">审核通过</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectRecord} onOpenChange={() => setRejectRecord(null)}>
        <DialogContent className="max-w-sm rounded-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#2D2926]">拒绝退货申请</DialogTitle>
          </DialogHeader>
          <p className="px-6 py-2 text-sm text-[#6B6560]">
            确定要拒绝退货申请 <strong className="font-mono text-[#2D2926]">{rejectRecord?.returnNo}</strong> 吗？
          </p>
          <DialogFooter className="px-6 pb-6">
            <Button variant="outline" onClick={() => setRejectRecord(null)} className="h-10 rounded-xl">取消</Button>
            <Button onClick={confirmReject} className="h-10 rounded-xl bg-[#C75C3A] font-semibold text-white hover:bg-[#a84d30]">确认拒绝</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Sheet */}
      <Sheet open={!!detailRecord} onOpenChange={() => setDetailRecord(null)}>
        <SheetContent className="w-full overflow-y-auto rounded-l-2xl bg-white sm:max-w-lg">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-xl font-semibold text-[#2D2926]">退货详情</SheetTitle>
          </SheetHeader>
          {detailRecord && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-lg font-medium text-[#2D2926]">{detailRecord.returnNo}</span>
                <span
                  className="rounded-lg px-2.5 py-1 text-xs font-medium"
                  style={{
                    color: returnStatusMap[detailRecord.status].color,
                    background: returnStatusMap[detailRecord.status].bg,
                  }}
                >
                  {returnStatusMap[detailRecord.status].label}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <p><span className="text-[#A39E99]">原采购单: </span><span className="font-mono font-medium text-[#2D2926]">{detailRecord.orderNo}</span></p>
                <p><span className="text-[#A39E99]">供应商: </span><span className="font-medium text-[#2D2926]">{detailRecord.supplierName}</span></p>
                <p><span className="text-[#A39E99]">退货原因: </span><span className="font-medium text-[#2D2926]">{returnReasonMap[detailRecord.reason]}</span></p>
                {detailRecord.reasonDetail && <p><span className="text-[#A39E99]">详细说明: </span>{detailRecord.reasonDetail}</p>}
                <p><span className="text-[#A39E99]">申请日期: </span>{fmtDate(detailRecord.date)}</p>
                {detailRecord.approvedDate && <p><span className="text-[#A39E99]">审核日期: </span>{fmtDate(detailRecord.approvedDate)}</p>}
                <p><span className="text-[#A39E99]">操作人: </span>{detailRecord.operator}</p>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold text-[#2D2926]">退货商品</h4>
                <div className="overflow-hidden rounded-xl border border-[rgba(45,41,38,0.08)]">
                  <table className="w-full text-sm">
                    <thead className="bg-[#F8F5F2]">
                      <tr>
                        <th className="px-3 py-2 text-left text-[11px] font-medium text-[#A39E99]">商品</th>
                        <th className="px-3 py-2 text-left text-[11px] font-medium text-[#A39E99]">规格</th>
                        <th className="px-3 py-2 text-right text-[11px] font-medium text-[#A39E99]">数量</th>
                        <th className="px-3 py-2 text-right text-[11px] font-medium text-[#A39E99]">金额</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailRecord.items.map((it, i) => (
                        <tr key={i} className="border-t border-[rgba(45,41,38,0.08)]">
                          <td className="px-3 py-2 text-[#2D2926]">{it.productName}</td>
                          <td className="px-3 py-2 text-xs text-[#6B6560]">{it.color}/{it.size}</td>
                          <td className="px-3 py-2 text-right font-mono text-xs">{it.quantity}</td>
                          <td className="px-3 py-2 text-right font-mono text-xs">{fmtMoney(it.totalPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 flex justify-end">
                  <span className="text-xs text-[#A39E99]">退货金额: </span>
                  <span className="ml-1 font-mono text-sm font-semibold text-[#D4853C]">{fmtMoney(detailRecord.totalAmount)}</span>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
