import { useState, useMemo, useEffect } from 'react';
import {
  PlusCircle, Search, Eye, CheckCircle, PackageOpen,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { PurchaseOrder } from '@/types';
import type { InboundRecord, InboundItem } from './utils';
import {
  inboundStatusMap, qualityStatusMap, generateInboundNo,
  fmtMoney, fmtDate, loadInboundRecords, saveInboundRecords
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

export default function InboundTab() {
  const { state, dispatch } = useApp();
  const [records, setRecords] = useState<InboundRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [detailRecord, setDetailRecord] = useState<InboundRecord | null>(null);

  // Receive form state
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [receiveItems, setReceiveItems] = useState<InboundItem[]>([]);
  const [operatorName, setOperatorName] = useState('');
  const [receiveNotes, setReceiveNotes] = useState('');

  // Load from localStorage
  useEffect(() => {
    setRecords(loadInboundRecords());
  }, []);

  function persist(newRecords: InboundRecord[]) {
    setRecords(newRecords);
    saveInboundRecords(newRecords);
  }

  // Orders available for receiving (pending or partial)
  const availableOrders = useMemo(() => {
    return state.purchaseOrders.filter(o => o.status === 'pending' || o.status === 'partial');
  }, [state.purchaseOrders]);

  const filtered = useMemo(() => {
    return records.filter(r => {
      const matchSearch = !search || r.inboundNo.toLowerCase().includes(search.toLowerCase()) || r.supplierName.includes(search);
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [records, search, statusFilter]);

  const thisMonthCount = records.filter(r => {
    const d = new Date(r.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  function openReceiveModal() {
    setSelectedOrderId('');
    setReceiveItems([]);
    setOperatorName(state.user?.name || '');
    setReceiveNotes('');
    setShowModal(true);
  }

  function selectOrder(orderId: string) {
    const order = state.purchaseOrders.find(o => o.id === orderId);
    if (!order) return;
    const items: InboundItem[] = order.items.map(it => ({
      productId: it.productId,
      sku: it.sku,
      productName: it.productName,
      color: it.color,
      size: it.size,
      orderedQty: it.quantity,
      receivedQty: 0,
      quality: 'pass',
      batchNo: '',
      unitPrice: it.unitPrice,
    }));
    setReceiveItems(items);
  }

  function updateReceiveItem(idx: number, patch: Partial<InboundItem>) {
    setReceiveItems(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  }

  function handleReceive() {
    if (!selectedOrderId) {
      toast.error('请选择采购订单');
      return;
    }
    const order = state.purchaseOrders.find(o => o.id === selectedOrderId);
    if (!order) {
      toast.error('订单不存在');
      return;
    }

    const totalReceived = receiveItems.reduce((s, it) => s + it.receivedQty, 0);
    if (totalReceived === 0) {
      toast.error('请填写入库数量');
      return;
    }

    const totalAmount = receiveItems.reduce((s, it) => s + it.receivedQty * it.unitPrice, 0);
    const isComplete = receiveItems.every(it => it.receivedQty >= it.orderedQty);

    const newRecord: InboundRecord = {
      id: `ib${Date.now()}`,
      inboundNo: generateInboundNo(),
      orderId: order.id,
      orderNo: order.orderNo,
      supplierId: order.supplierId,
      supplierName: order.supplierName,
      items: receiveItems,
      totalQty: totalReceived,
      totalAmount,
      date: new Date().toISOString().slice(0, 10),
      operator: operatorName || '系统用户',
      status: isComplete ? 'completed' : 'partial',
      notes: receiveNotes,
    };

    // Update order status
    const updatedOrder: PurchaseOrder = {
      ...order,
      items: order.items.map(it => {
        const ri = receiveItems.find(r => r.productId === it.productId && r.color === it.color && r.size === it.size);
        if (ri) {
          return { ...it, receivedQuantity: it.receivedQuantity + ri.receivedQty };
        }
        return it;
      }),
      status: isComplete ? 'received' : 'partial',
      inboundStatus: isComplete ? 'completed' : 'in_progress',
    };
    dispatch({ type: 'UPDATE_PURCHASE_ORDER', payload: updatedOrder });

    // Add inbound record
    const newRecords = [newRecord, ...records];
    persist(newRecords);

    toast.success(`入库完成，共 ${totalReceived} 件商品`);
    setShowModal(false);
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={openReceiveModal}
            className="h-10 gap-2 rounded-xl bg-[#D4853C] px-5 font-semibold text-white hover:bg-[#BF7532] hover:shadow-[0_2px_8px_rgba(212,133,60,0.30)]"
          >
            <PlusCircle className="h-4 w-4" />
            直接入库
          </Button>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A39E99]" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索入库单号、供应商..."
              className="h-10 w-56 rounded-xl border-[rgba(45,41,38,0.12)] pl-9 text-sm placeholder:text-[#A39E99] focus:border-[#D4853C] focus:ring-[#D4853C]/20"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 w-32 rounded-xl border-[rgba(45,41,38,0.12)] text-sm">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="completed">已完成</SelectItem>
              <SelectItem value="partial">部分入库</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <span className="text-xs text-[#A39E99]">本月: <strong className="text-[#2D2926]">{thisMonthCount}</strong> 笔</span>
      </div>

      {/* Inbound Table */}
      <div className="overflow-hidden rounded-2xl border border-[rgba(45,41,38,0.08)] bg-white shadow-[0_1px_3px_rgba(45,41,38,0.06)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgba(45,41,38,0.08)]">
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">入库单号</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">关联订单</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">供应商</th>
              <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">数量</th>
              <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">金额</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">日期</th>
              <th className="px-4 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">状态</th>
              <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-[#A39E99]">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <PackageOpen className="mx-auto h-10 w-10 text-[#A39E99] opacity-40" />
                  <p className="mt-3 text-sm text-[#6B6560]">暂无入库记录</p>
                </td>
              </tr>
            ) : (
              filtered.map(record => {
                const st = inboundStatusMap[record.status] || inboundStatusMap.completed;
                return (
                  <tr
                    key={record.id}
                    className="group border-b border-[rgba(45,41,38,0.08)] transition-colors last:border-0 hover:bg-[rgba(45,41,38,0.03)]"
                  >
                    <td className="px-4 py-3.5 font-mono text-sm font-medium text-[#2D2926]">{record.inboundNo}</td>
                    <td className="px-4 py-3.5 font-mono text-sm text-[#6B6560]">{record.orderNo}</td>
                    <td className="px-4 py-3.5 text-sm text-[#2D2926]">{record.supplierName}</td>
                    <td className="px-4 py-3.5 text-right font-mono text-sm text-[#6B6560]">{record.totalQty}</td>
                    <td className="px-4 py-3.5 text-right font-mono text-sm font-semibold text-[#2D2926]">{fmtMoney(record.totalAmount)}</td>
                    <td className="px-4 py-3.5 text-sm text-[#6B6560]">{fmtDate(record.date)}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className="inline-block rounded-lg px-2.5 py-1 text-[11px] font-medium"
                        style={{ color: st.color, background: st.bg }}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setDetailRecord(record)}
                          className="rounded-lg p-1.5 text-[#6B6560] transition-colors hover:bg-[rgba(45,41,38,0.04)] hover:text-[#2D2926]"
                          title="查看"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Receive Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl bg-white p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-xl font-semibold text-[#2D2926]">商品入库</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#2D2926]">选择采购订单</label>
                <Select value={selectedOrderId} onValueChange={v => { setSelectedOrderId(v); selectOrder(v); }}>
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
                <label className="mb-1.5 block text-xs font-medium text-[#2D2926]">操作人</label>
                <Input
                  value={operatorName}
                  onChange={e => setOperatorName(e.target.value)}
                  placeholder="操作人姓名"
                  className="h-11 rounded-xl border-[rgba(45,41,38,0.12)] focus:border-[#D4853C] focus:ring-[#D4853C]/20"
                />
              </div>
            </div>

            {receiveItems.length > 0 && (
              <div>
                <label className="mb-2 block text-xs font-medium text-[#2D2926]">入库明细</label>
                <div className="overflow-hidden rounded-xl border border-[rgba(45,41,38,0.12)]">
                  <table className="w-full text-sm">
                    <thead className="bg-[#F8F5F2]">
                      <tr>
                        <th className="px-3 py-2 text-left text-[11px] font-medium text-[#A39E99]">商品</th>
                        <th className="px-3 py-2 text-left text-[11px] font-medium text-[#A39E99]">规格</th>
                        <th className="px-3 py-2 text-right text-[11px] font-medium text-[#A39E99]">订购</th>
                        <th className="px-3 py-2 text-right text-[11px] font-medium text-[#A39E99]">实收</th>
                        <th className="px-3 py-2 text-center text-[11px] font-medium text-[#A39E99]">质检</th>
                        <th className="px-3 py-2 text-left text-[11px] font-medium text-[#A39E99]">批次号</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receiveItems.map((it, idx) => (
                        <tr key={idx} className="border-t border-[rgba(45,41,38,0.08)]">
                          <td className="px-3 py-2 text-[#2D2926]">{it.productName}</td>
                          <td className="px-3 py-2 text-xs text-[#6B6560]">{it.color}/{it.size}</td>
                          <td className="px-3 py-2 text-right font-mono text-xs">{it.orderedQty}</td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              min={0}
                              max={it.orderedQty}
                              value={it.receivedQty}
                              onChange={e => updateReceiveItem(idx, { receivedQty: Number(e.target.value) })}
                              className="h-8 w-16 rounded-lg text-right text-xs"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Select value={it.quality} onValueChange={v => updateReceiveItem(idx, { quality: v as InboundItem['quality'] })}>
                              <SelectTrigger className="h-8 w-20 rounded-lg text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pass">合格</SelectItem>
                                <SelectItem value="fail">不合格</SelectItem>
                                <SelectItem value="shortage">短缺</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              value={it.batchNo}
                              onChange={e => updateReceiveItem(idx, { batchNo: e.target.value })}
                              placeholder="批次"
                              className="h-8 w-20 rounded-lg text-xs"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {receiveItems.length > 0 && (
              <div className="rounded-xl bg-[#F8F5F2] p-3 text-xs text-[#6B6560]">
                <div className="flex justify-between">
                  <span>应收总数: {receiveItems.reduce((s, it) => s + it.orderedQty, 0)}</span>
                  <span>实收总数: {receiveItems.reduce((s, it) => s + it.receivedQty, 0)}</span>
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#2D2926]">备注</label>
              <Input
                value={receiveNotes}
                onChange={e => setReceiveNotes(e.target.value)}
                placeholder="备注信息"
                className="h-10 rounded-xl border-[rgba(45,41,38,0.12)]"
              />
            </div>
          </div>
          <DialogFooter className="px-6 pb-6">
            <Button variant="outline" onClick={() => setShowModal(false)} className="h-10 rounded-xl">取消</Button>
            <Button onClick={handleReceive} className="h-10 rounded-xl bg-[#4A9B8E] px-6 font-semibold text-white hover:bg-[#3d8578]">
              <CheckCircle className="mr-1.5 h-4 w-4" /> 确认入库
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Sheet */}
      <Sheet open={!!detailRecord} onOpenChange={() => setDetailRecord(null)}>
        <SheetContent className="w-full overflow-y-auto rounded-l-2xl bg-white sm:max-w-lg">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-xl font-semibold text-[#2D2926]">入库详情</SheetTitle>
          </SheetHeader>
          {detailRecord && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-lg font-medium text-[#2D2926]">{detailRecord.inboundNo}</span>
                <span
                  className="rounded-lg px-2.5 py-1 text-xs font-medium"
                  style={{
                    color: (inboundStatusMap[detailRecord.status] || inboundStatusMap.completed).color,
                    background: (inboundStatusMap[detailRecord.status] || inboundStatusMap.completed).bg,
                  }}
                >
                  {(inboundStatusMap[detailRecord.status] || inboundStatusMap.completed).label}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <p><span className="text-[#A39E99]">关联订单: </span><span className="font-mono font-medium text-[#2D2926]">{detailRecord.orderNo}</span></p>
                <p><span className="text-[#A39E99]">供应商: </span><span className="font-medium text-[#2D2926]">{detailRecord.supplierName}</span></p>
                <p><span className="text-[#A39E99]">入库日期: </span>{fmtDate(detailRecord.date)}</p>
                <p><span className="text-[#A39E99]">操作人: </span>{detailRecord.operator}</p>
                {detailRecord.notes && <p><span className="text-[#A39E99]">备注: </span>{detailRecord.notes}</p>}
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold text-[#2D2926]">入库商品明细</h4>
                <div className="overflow-hidden rounded-xl border border-[rgba(45,41,38,0.08)]">
                  <table className="w-full text-sm">
                    <thead className="bg-[#F8F5F2]">
                      <tr>
                        <th className="px-3 py-2 text-left text-[11px] font-medium text-[#A39E99]">商品</th>
                        <th className="px-3 py-2 text-left text-[11px] font-medium text-[#A39E99]">规格</th>
                        <th className="px-3 py-2 text-right text-[11px] font-medium text-[#A39E99]">订购</th>
                        <th className="px-3 py-2 text-right text-[11px] font-medium text-[#A39E99]">实收</th>
                        <th className="px-3 py-2 text-center text-[11px] font-medium text-[#A39E99]">质检</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailRecord.items.map((it, i) => {
                        const qs = qualityStatusMap[it.quality] || qualityStatusMap.pass;
                        return (
                          <tr key={i} className="border-t border-[rgba(45,41,38,0.08)]">
                            <td className="px-3 py-2 text-[#2D2926]">{it.productName}</td>
                            <td className="px-3 py-2 text-xs text-[#6B6560]">{it.color}/{it.size}</td>
                            <td className="px-3 py-2 text-right font-mono text-xs">{it.orderedQty}</td>
                            <td className="px-3 py-2 text-right font-mono text-xs">{it.receivedQty}</td>
                            <td className="px-3 py-2 text-center">
                              <span className="rounded-md px-1.5 py-0.5 text-[10px] font-medium" style={{ color: qs.color, background: qs.bg }}>{qs.label}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 flex justify-end">
                  <span className="text-xs text-[#A39E99]">合计: </span>
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
