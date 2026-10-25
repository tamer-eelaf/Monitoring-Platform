import React from 'react';
import {
  Receipt,
  Building2,
  PackageCheck,
  Warehouse,
  ChevronLeft,
  Calendar,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Briefcase
} from 'lucide-react';
import {
  CustomerInvoice,
  SupplierBill,
  SalesOrder,
  StockItem,
  SystemAlert,
  UserProfile
} from '../../types';

interface DashboardViewProps {
  invoices: CustomerInvoice[];
  supplierBills: SupplierBill[];
  orders: SalesOrder[];
  stockItems: StockItem[];
  alerts: SystemAlert[];
  currentUser: UserProfile;
  showVatIncluded: boolean;
  onNavigateTab: (tabId: string) => void;
  onSelectInvoice: (invoice: CustomerInvoice) => void;
  onEditPromise: (invoice: CustomerInvoice) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  invoices,
  supplierBills,
  orders,
  stockItems,
  alerts,
  currentUser,
  showVatIncluded,
  onNavigateTab,
  onSelectInvoice,
  onEditPromise,
}) => {
  // Financial Computations
  const totalOutstandingUSD = invoices.reduce(
    (sum, inv) => sum + inv.amountResidualUSD,
    0
  );

  const overdueInvoices = invoices.filter((i) => i.daysOverdue > 0 && i.amountResidualUSD > 0);
  const totalOverdueUSD = overdueInvoices.reduce(
    (sum, i) => sum + i.amountResidualUSD,
    0
  );

  const totalSupplierDueUSD = supplierBills
    .filter((b) => b.status !== 'paid')
    .reduce((sum, b) => sum + b.amountResidualUSD, 0);

  const totalOrdersUSD = orders.reduce(
    (sum, o) => sum + (showVatIncluded ? o.totalWithTaxUSD : o.totalUSD),
    0
  );

  // Top overdue client
  const topOverdueInvoice = [...overdueInvoices].sort(
    (a, b) => b.amountResidualUSD - a.amountResidualUSD
  )[0];

  // Brand sales distribution
  let hikTotal = 0;
  let velaTotal = 0;
  let amgTotal = 0;

  orders.forEach((ord) => {
    ord.lines.forEach((l) => {
      if (l.brand === 'Hikvision') hikTotal += l.totalWithTaxUSD;
      else if (l.brand === 'Velasea') velaTotal += l.totalWithTaxUSD;
      else if (l.brand === 'AMG') amgTotal += l.totalWithTaxUSD;
      else hikTotal += l.totalWithTaxUSD; // default to BU core
    });
  });

  const grandBrandTotal = hikTotal + velaTotal + amgTotal || 1;

  // Filter urgent action items for today (Top 3 only to prevent clutter)
  const urgentActions = alerts.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* 1. Executive Status Header (Clean & Uncrowded) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl px-5 py-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span>لوحة القيادة والمؤشرات التشغيلية</span>
            <span className="text-xs font-normal text-slate-400">| Physical Security BU</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            ملخص الأداء المالي، المبيعات، ومستحقات التوريد لتوكيلات Hikvision وVelasea وAMG
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
            <span className="text-slate-500 font-sans ml-1.5">مبيعات الإدارة:</span>
            <span className="font-bold text-emerald-400">${totalOrdersUSD.toLocaleString()}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
            <span className="text-slate-500 font-sans ml-1.5">تحصيلات مفتوحة:</span>
            <span className="font-bold text-amber-400">${totalOutstandingUSD.toLocaleString()}</span>
          </div>
        </div>
      </div>



      {/* 2. Three Primary Executive Pillars (Spacious & High-Value) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pillar 1: Receivables & Collections */}
        <div
          onClick={() => onNavigateTab('collections')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 cursor-pointer transition-all space-y-3 group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">التحصيلات المتأخرة (AR)</span>
            <Receipt className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
          </div>

          <div>
            <div className="text-2xl font-bold font-mono text-red-400 tracking-tight">
              ${totalOverdueUSD.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              {overdueInvoices.length} فواتير تجاوزت تاريخ استحقاقها
            </div>
          </div>

          {topOverdueInvoice && (
            <div className="pt-2.5 border-t border-slate-800/80 text-xs">
              <span className="text-[10px] text-slate-500 block">أكبر مديونية متأخرة:</span>
              <span className="font-medium text-slate-200 truncate block mt-0.5">
                {topOverdueInvoice.customerName} (${topOverdueInvoice.amountResidualUSD.toLocaleString()})
              </span>
            </div>
          )}
        </div>

        {/* Pillar 2: Active Pipeline & Orders */}
        <div
          onClick={() => onNavigateTab('orders')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 cursor-pointer transition-all space-y-3 group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">أوامر الإدارة في Odoo</span>
            <PackageCheck className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
          </div>

          <div>
            <div className="text-2xl font-bold font-mono text-slate-100 tracking-tight">
              ${totalOrdersUSD.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              {orders.length} أوامر معتمدة ومسجلة لفريقك
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-800/80 text-xs flex items-center justify-between text-slate-400">
            <span>فريق Odoo المعتمد:</span>
            <span className="text-emerald-400 font-semibold font-mono">Team 35 (PHY BU)</span>
          </div>
        </div>

        {/* Pillar 3: Supplier Payables */}
        <div
          onClick={() => onNavigateTab('suppliers')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 cursor-pointer transition-all space-y-3 group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">مدفوعات الموردين المفتوحة (AP)</span>
            <Building2 className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>

          <div>
            <div className="text-2xl font-bold font-mono text-amber-400 tracking-tight">
              ${totalSupplierDueUSD.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              {supplierBills.length} فواتير توريد غير مسددة بالكامل
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-800/80 text-xs flex items-center justify-between text-slate-400">
            <span>أقرب استحقاق:</span>
            <span className="text-slate-200 font-mono">خلال الأسبوع الجاري</span>
          </div>
        </div>
      </div>

      {/* 3. Priority Action Queue: "ما يتطلب تدخلك اليوم" (Max 3 Clean Cards) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              أولويات التدخل السريع لمدير الإدارة اليوم
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              الملفات الحرجة التي تتطلب توجيهك أو تواصلك المباشر مع الحسابات أو المورد
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('alerts')}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
          >
            عرض القائمة الكاملة <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {urgentActions.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
            >
              <div className="space-y-0.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-100">
                    {item.title}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-800">
                    أولوية
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {item.message}
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 font-mono">
                {item.amountUSD !== undefined && (
                  <div className="text-sm font-bold text-slate-200">
                    ${item.amountUSD.toLocaleString()}
                  </div>
                )}
                <button
                  onClick={() => onNavigateTab(item.linkTab)}
                  className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
                >
                  متابعة
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Brand Distribution Strip (Clean & Uncluttered) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-200 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            توزيع مبيعات التوكيلات الثلاثة في مصر
          </span>
          <span className="font-mono text-slate-400">
            إجمالي: ${grandBrandTotal.toLocaleString()}
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${(hikTotal / grandBrandTotal) * 100}%` }}
            className="bg-red-500 h-full transition-all"
            title="Hikvision"
          />
          <div
            style={{ width: `${(amgTotal / grandBrandTotal) * 100}%` }}
            className="bg-cyan-500 h-full transition-all"
            title="AMG Systems"
          />
          <div
            style={{ width: `${(velaTotal / grandBrandTotal) * 100}%` }}
            className="bg-amber-500 h-full transition-all"
            title="Velasea"
          />
        </div>

        <div className="grid grid-cols-3 gap-3 pt-1 text-xs font-mono">
          <div className="text-right">
            <span className="text-red-400 font-sans font-semibold">Hikvision</span>
            <div className="text-sm font-bold text-slate-200 mt-0.5">${hikTotal.toLocaleString()}</div>
            <div className="text-[10px] text-slate-500">{((hikTotal / grandBrandTotal) * 100).toFixed(1)}%</div>
          </div>
          <div className="text-center">
            <span className="text-cyan-400 font-sans font-semibold">AMG Systems</span>
            <div className="text-sm font-bold text-slate-200 mt-0.5">${amgTotal.toLocaleString()}</div>
            <div className="text-[10px] text-slate-500">{((amgTotal / grandBrandTotal) * 100).toFixed(1)}%</div>
          </div>
          <div className="text-left">
            <span className="text-amber-400 font-sans font-semibold">Velasea</span>
            <div className="text-sm font-bold text-slate-200 mt-0.5">${velaTotal.toLocaleString()}</div>
            <div className="text-[10px] text-slate-500">{((velaTotal / grandBrandTotal) * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};
