// ==========================================
// Purchase Management Page — 采购管理
// ==========================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, FileText, PackageCheck, RotateCcw } from 'lucide-react';
import PurchasePlansTab from '@/components/purchase/PurchasePlansTab';
import PurchaseOrdersTab from '@/components/purchase/PurchaseOrdersTab';
import InboundTab from '@/components/purchase/InboundTab';
import ReturnsTab from '@/components/purchase/ReturnsTab';

const TABS = [
  { key: 'plans',   label: '采购计划', icon: ClipboardList },
  { key: 'orders',  label: '采购订单', icon: FileText },
  { key: 'inbound', label: '采购入库', icon: PackageCheck },
  { key: 'returns', label: '采购退货', icon: RotateCcw },
];

const tabContentVariants = {
  initial: { opacity: 0, x: 10 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -10 },
};

export default function Purchase() {
  const [activeTab, setActiveTab] = useState('plans');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const monthTotal = '¥45,200'; // Could be computed from real data

  return (
    <div className="min-h-full bg-[#F8F5F2]">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[#2D2926]">
            采购管理
          </h1>
          <p className="mt-1 text-sm text-[#A39E99]">
            管理采购计划、订单、入库与退货流程
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-white px-4 py-2 text-sm text-[#D4853C] shadow-[0_1px_3px_rgba(45,41,38,0.06)]">
            4月采购: <strong className="font-mono">{monthTotal}</strong>
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div
          className="inline-flex rounded-t-2xl bg-white shadow-[0_1px_3px_rgba(45,41,38,0.06)]"
          style={{ borderBottom: '1px solid rgba(45,41,38,0.08)' }}
        >
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors"
                style={{
                  color: isActive ? '#2D2926' : '#A39E99',
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                <Icon className="h-4 w-4" strokeWidth={1.5} />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="purchase-tab-indicator"
                    className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[#D4853C]"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {mounted && (
          <motion.div
            key={activeTab}
            variants={tabContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
          >
            {activeTab === 'plans' && <PurchasePlansTab />}
            {activeTab === 'orders' && <PurchaseOrdersTab />}
            {activeTab === 'inbound' && <InboundTab />}
            {activeTab === 'returns' && <ReturnsTab />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
