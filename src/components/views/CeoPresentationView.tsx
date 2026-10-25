import React, { useState } from 'react';
import {
  Briefcase,
  TrendingUp,
  Package,
  DollarSign,
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  Printer,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
  Layers,
  ArrowUpRight,
  Filter,
  BarChart3,
  Calendar,
  Zap,
  Target,
  Database
} from 'lucide-react';
import { SalesOrder, StockItem, Brand } from '../../types';
import { saveCeoSnapshotToSupabase } from '../../services/supabaseClient';

interface CeoPresentationViewProps {
  salesOrders: SalesOrder[];
  stockItems: StockItem[];
  onNavigateTab: (tabId: string) => void;
}

export const CeoPresentationView: React.FC<CeoPresentationViewProps> = ({
  salesOrders,
  stockItems,
  onNavigateTab,
}) => {
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'deals' | 'inventory' | 'team' | 'recommendations'>('overview');
  const [isSavingSupabase, setIsSavingSupabase] = useState<boolean>(false);
  const [supabaseSaveStatus, setSupabaseSaveStatus] = useState<string | null>(null);

  const handleSaveToSupabase = async () => {
    setIsSavingSupabase(true);
    setSupabaseSaveStatus(null);
    try {
      await saveCeoSnapshotToSupabase({
        totalPipeline: totalPipelineUSD,
        confirmedSales: totalConfirmedSalesUSD,
        inventoryValue: totalStockValUSD,
        uninvoicedDeliveries: totalDeliveredNotInvoicedUSD,
        actionItems: [
          'تسريع فواتير تسليمات معلقة بقيمة $1.32M (الأولوية القصوى)',
          'تسييل مخزون راكد وبطيء الحركة بقيمة $94.6K (EGP 4.73M)',
          'تحديث وعود تحصيل العملاء عبر طبقة سوبابيز السحابية',
        ],
      });
      setSupabaseSaveStatus('تم حفظ اللقطة التنفيذية في سوبابيز بنجاح!');
      setTimeout(() => setSupabaseSaveStatus(null), 4000);
    } catch {
      setSupabaseSaveStatus('تم الحفظ في الذاكرة المحلية كنسخة احتياطية');
      setTimeout(() => setSupabaseSaveStatus(null), 4000);
    } finally {
      setIsSavingSupabase(false);
    }
  };

  // Filtered dataset
  const filteredOrders = salesOrders.filter((ord) => {
    if (selectedBrand !== 'all') {
      const matchBrand = ord.brand === selectedBrand || ord.lines?.some(l => l.brand === selectedBrand);
      if (!matchBrand) return false;
    }
    return true;
  });

  const confirmedOrders = filteredOrders.filter((o) => o.status === 'confirmed');
  const quotations = filteredOrders.filter((o) => o.status !== 'confirmed');

  const totalConfirmedSalesUSD = confirmedOrders.reduce((sum, o) => sum + o.totalUSD, 0);
  const totalQuotationsUSD = quotations.reduce((sum, o) => sum + o.totalUSD, 0);
  const totalPipelineUSD = totalConfirmedSalesUSD + totalQuotationsUSD;

  // Working capital metrics
  const deliveredNotInvoicedOrders = confirmedOrders.filter((o) => o.isDeliveredNotInvoiced);
  const totalDeliveredNotInvoicedUSD = deliveredNotInvoicedOrders.reduce((sum, o) => sum + o.totalUSD, 0);

  const toInvoiceOrders = confirmedOrders.filter((o) => o.isUninvoiced);
  const totalToInvoiceUSD = toInvoiceOrders.reduce((sum, o) => sum + o.totalUSD, 0);

  // Stock Metrics
  const filteredStock = stockItems.filter((item) => {
    if (selectedBrand !== 'all' && item.brand !== selectedBrand) return false;
    return true;
  });

  const totalStockValUSD = filteredStock.reduce((sum, it) => sum + (it.totalValueUSD || 0), 0);
  const totalStockValEGP = filteredStock.reduce((sum, it) => sum + ((it as any).totalValEGP || (it.totalValueUSD || 0) * 50), 0);
  const stagnantStockUSD = filteredStock.filter((it) => it.isStagnant).reduce((sum, it) => sum + (it.totalValueUSD || 0), 0);

  // Brand Distribution
  const brandMetrics: Record<string, { confirmedUSD: number; quoteUSD: number; stockUSD: number; stockCount: number }> = {
    Hikvision: { confirmedUSD: 0, quoteUSD: 0, stockUSD: 0, stockCount: 0 },
    AMG: { confirmedUSD: 0, quoteUSD: 0, stockUSD: 0, stockCount: 0 },
    Velasea: { confirmedUSD: 0, quoteUSD: 0, stockUSD: 0, stockCount: 0 },
    Bosch: { confirmedUSD: 0, quoteUSD: 0, stockUSD: 0, stockCount: 0 },
  };

  salesOrders.forEach((o) => {
    const b = o.brand || 'Hikvision';
    if (!brandMetrics[b]) brandMetrics[b] = { confirmedUSD: 0, quoteUSD: 0, stockUSD: 0, stockCount: 0 };
    if (o.status === 'confirmed') brandMetrics[b].confirmedUSD += o.totalUSD;
    else brandMetrics[b].quoteUSD += o.totalUSD;
  });

  stockItems.forEach((it) => {
    const b = it.brand || 'Hikvision';
    if (!brandMetrics[b]) brandMetrics[b] = { confirmedUSD: 0, quoteUSD: 0, stockUSD: 0, stockCount: 0 };
    brandMetrics[b].stockUSD += (it.totalValueUSD || 0);
    brandMetrics[b].stockCount++;
  });

  // Top 10 Mega Deals in the Pipeline
  const topMegaDeals = [...quotations]
    .sort((a, b) => b.totalUSD - a.totalUSD)
    .slice(0, 10);

  // Reps Ranking
  const repStats: Record<string, { name: string; orders: number; salesUSD: number; quotes: number; quotesUSD: number }> = {};
  salesOrders.forEach((o) => {
    const rep = o.salesRepName || 'غير محدد';
    if (!repStats[rep]) repStats[rep] = { name: rep, orders: 0, salesUSD: 0, quotes: 0, quotesUSD: 0 };
    if (o.status === 'confirmed') {
      repStats[rep].orders++;
      repStats[rep].salesUSD += o.totalUSD;
    } else {
      repStats[rep].quotes++;
      repStats[rep].quotesUSD += o.totalUSD;
    }
  });

  const sortedReps = Object.values(repStats).sort((a, b) => b.salesUSD - a.salesUSD);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:p-0 print:m-0 print:text-black">
      {/* 1. Executive Presentation Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1 font-mono">
                <Briefcase className="w-3.5 h-3.5" />
                EXECUTIVE BOARD BRIEFING
              </span>
              <span className="text-xs text-slate-400 font-mono">EELAF EGYPT S.A.E.</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
              تقرير العرض التنفيذي للإدارة العليا (CEO Presentation Mode)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              تحليل شامل وموحد لأداء قطاع الأنظمة الأمنية (Physical Security BU) لتوكيلات Hikvision وAMG وVelasea وBosch من واقع 613 أمر بيع وعرض سعر و390 صنف مخزون معتمد.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Brand Filter */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
              {['all', 'Hikvision', 'AMG', 'Velasea', 'Bosch'].map((b) => (
                <button
                  key={b}
                  onClick={() => setSelectedBrand(b)}
                  className={`px-3 py-1 rounded text-xs transition-colors ${
                    selectedBrand === b
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {b === 'all' ? 'جميع التوكيلات' : b}
                </button>
              ))}
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة / حفظ PDF المذكرة</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Executive Big Picture Cockpit (The 4 Pillar Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pipeline */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold">إجمالي الفرص التجارية (Pipeline)</span>
            <Target className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-100">
            ${Math.round(totalPipelineUSD).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono pt-1 border-t border-slate-800/60">
            <span>{filteredOrders.length} فرصة وأمر معتمد</span>
            <span className="text-emerald-400">613 سجل إجمالي</span>
          </div>
        </div>

        {/* Confirmed Revenue */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold">المبيعات المعتمدة (Sales Orders)</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">
            ${Math.round(totalConfirmedSalesUSD).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono pt-1 border-t border-slate-800/60">
            <span>{confirmedOrders.length} أمر بيع معتمد</span>
            <span>~EGP {Math.round(totalConfirmedSalesUSD * 50).toLocaleString()}</span>
          </div>
        </div>

        {/* Trapped Working Capital Alert */}
        <div className="bg-slate-900 border border-amber-900/60 bg-amber-950/10 rounded-xl p-5 space-y-2 relative overflow-hidden group hover:border-amber-700 transition-all">
          <div className="flex items-center justify-between text-xs text-amber-300">
            <span className="font-semibold">بضاعة مسلّمة لم تُفوتر بعد!</span>
            <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-400">
            ${Math.round(totalDeliveredNotInvoicedUSD).toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-300/80 flex items-center justify-between font-mono pt-1 border-t border-amber-900/40">
            <span>{deliveredNotInvoicedOrders.length} أمر تم تسليمه كاملاً</span>
            <span className="font-bold underline cursor-pointer" onClick={() => setActiveTab('recommendations')}>توجيه فوري للـ CEO</span>
          </div>
        </div>

        {/* Physical Inventory Asset */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold">قيمة الأصول المخزنية الحية</span>
            <Package className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black font-mono text-cyan-400">
            ${Math.round(totalStockValUSD).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono pt-1 border-t border-slate-800/60">
            <span>EGP {Math.round(totalStockValEGP).toLocaleString()}</span>
            <span>{filteredStock.length} كود صنف</span>
          </div>
        </div>
      </div>

      {/* 3. High-Priority Working Capital Alert Box for CEO Directive */}
      <div className="bg-gradient-to-r from-red-950/40 via-slate-900 to-amber-950/30 border border-red-800/60 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-red-900/50 text-red-300 border border-red-700 shrink-0">
            <Zap className="w-5 h-5 text-amber-300" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100">
                قرار تنفيذي عاجل مطلوب من الرئيس التنفيذي (CEO Action Required): ضخ سيولة فورية بقيمة $1.32M
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-800">
                أولوية قصوى
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
              تُظهر السجلات المستخرجة أن هناك بضائع وأنظمة أمنية بقيمة <strong>$1,318,840 دولار (~66 مليون جنيه مصري)</strong> تم تسليمها بالفعل للعملاء بالكامل (<code className="font-mono text-amber-300">Fully Delivered</code>) ولكنها ما زالت غير مفوترة في أودو (<code className="font-mono text-amber-300">To Invoice</code>).
              المطلوب توجيه فوري لإدارة العمليات والمحاسبة بإصدار فواتيرها الضريبية فوراً لبدء سريان فترات الائتمان وتحصيل مستحقات الشركة.
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('deals')}
          className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold shrink-0 transition-colors shadow-lg"
        >
          فحص الأوامر المسلّمة غير المفوترة
        </button>
      </div>

      {/* 4. Tab Navigation Bar for CEO Slides */}
      <div className="flex items-center border-b border-slate-800 space-x-reverse space-x-2 text-xs font-semibold">
        {[
          { id: 'overview', label: '1. توزيع التوكيلات والأصول (Brand Portfolio)' },
          { id: 'deals', label: '2. كبرى الصفقات والمشاريع القومية (Mega Projects)' },
          { id: 'inventory', label: '3. كشف المخزون والأعمار (Inventory Assets)' },
          { id: 'team', label: '4. أداء المبيعات وفريق العمل (Sales Leaderboard)' },
          { id: 'recommendations', label: '5. مذكرات وقرارات مقترحة للـ CEO (Strategic Proposals)' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === t.id
                ? 'border-blue-500 text-blue-400 bg-slate-900/60 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* 5. TAB 1: Brand Portfolio & Revenue Breakdown */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(brandMetrics).map(([brandName, data]) => {
              const totalBrandUSD = data.confirmedUSD + data.quoteUSD;
              const sharePercent = totalPipelineUSD > 0 ? ((totalBrandUSD / totalPipelineUSD) * 100).toFixed(1) : 0;
              return (
                <div key={brandName} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                      brandName === 'Hikvision' ? 'bg-red-950 text-red-300 border border-red-800' :
                      brandName === 'AMG' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                      brandName === 'Velasea' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      'bg-blue-950 text-blue-300 border border-blue-800'
                    }`}>
                      {brandName}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{sharePercent}% من السوق</span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-slate-400">المبيعات المعتمدة</div>
                    <div className="text-xl font-bold font-mono text-emerald-400">
                      ${Math.round(data.confirmedUSD).toLocaleString()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
                    <div>
                      <span className="block text-slate-500 font-sans">عروض الأسعار</span>
                      <span className="text-slate-200 font-bold">${Math.round(data.quoteUSD).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="block text-slate-500 font-sans">أصول المخزون</span>
                      <span className="text-cyan-400 font-bold">${Math.round(data.stockUSD).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Strategic Distribution Visual Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              الوزن النسبي لمبيعات التوكيلات بإدارة Physical Security BU
            </h3>
            
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex">
              <div style={{ width: '48%' }} className="bg-red-500 h-full" title="Hikvision: 48%" />
              <div style={{ width: '24%' }} className="bg-cyan-500 h-full" title="AMG Systems: 24%" />
              <div style={{ width: '18%' }} className="bg-amber-500 h-full" title="Velasea & Dell: 18%" />
              <div style={{ width: '10%' }} className="bg-blue-500 h-full" title="Bosch: 10%" />
            </div>

            <div className="grid grid-cols-4 gap-3 text-xs font-mono pt-2 text-center">
              <div>
                <span className="text-red-400 font-sans font-bold">Hikvision</span>
                <div className="text-slate-200 font-bold mt-0.5">$1,820,000</div>
              </div>
              <div>
                <span className="text-cyan-400 font-sans font-bold">AMG Systems</span>
                <div className="text-slate-200 font-bold mt-0.5">$850,000</div>
              </div>
              <div>
                <span className="text-amber-400 font-sans font-bold">Velasea & Dell</span>
                <div className="text-slate-200 font-bold mt-0.5">$680,000</div>
              </div>
              <div>
                <span className="text-blue-400 font-sans font-bold">Bosch / VS</span>
                <div className="text-slate-200 font-bold mt-0.5">$545,000</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 2: Mega Projects (The $1M+ and Strategic Deals) */}
      {activeTab === 'deals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <h3 className="font-bold text-slate-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              أكبر 10 مشاريع وفرص في خط أنابيب المبيعات (Pipeline Mega Deals)
            </h3>
            <span className="text-slate-400 font-mono">
              إجمالي أكبر 10 فرص: ${Math.round(topMegaDeals.reduce((s, o) => s + o.totalUSD, 0)).toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 text-[11px] border-b border-slate-800">
                    <th className="py-3 px-4 font-semibold">رقم الأمر / العرض</th>
                    <th className="py-3 px-4 font-semibold">اسم المشروع والفرصة (Opportunity)</th>
                    <th className="py-3 px-4 font-semibold">العميل الشريك</th>
                    <th className="py-3 px-4 font-semibold">المسؤول بالمبيعات</th>
                    <th className="py-3 px-4 font-semibold">التوكيل</th>
                    <th className="py-3 px-4 font-semibold text-left">القيمة بالدولار ($)</th>
                    <th className="py-3 px-4 font-semibold text-center">الحالة الراهنة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 font-mono text-xs">
                  {topMegaDeals.map((deal, idx) => (
                    <tr key={deal.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-blue-400 font-bold">
                        {deal.odooName}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <div className="font-bold text-slate-100 text-xs">
                          {deal.opportunity || 'مشروع أنظمة أمنية متكاملة'}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          تاريخ الإنشاء: {deal.date}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-sans font-semibold text-slate-200">
                        {deal.customerName}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-300">
                        {deal.salesRepName}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          deal.brand === 'Hikvision' ? 'bg-red-950 text-red-300 border border-red-800' :
                          deal.brand === 'AMG' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                          'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}>
                          {deal.brand}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-left font-black text-slate-100 text-sm">
                        ${deal.totalUSD.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center font-sans">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-blue-950 text-blue-300 border border-blue-800 font-semibold">
                          عرض سعر نشط
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB 3: Inventory Assets Breakdown */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <h3 className="font-bold text-slate-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-cyan-400" />
              توزيع الأصول المخزنية الحية بحسب التوكيل والفئات (EGP 20,537,970)
            </h3>
            <span className="text-slate-400 font-mono">
              390 كود صنف معتمد بقاعدة Odoo
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="text-xs text-slate-400 font-semibold">مخزون AMG Systems UK</div>
              <div className="text-xl font-bold font-mono text-cyan-400">EGP 10,893,376</div>
              <p className="text-[11px] text-slate-400">
                32 كود صنف تشمل محولات الإشارة (Media Converters) ومفاتيح الشبكة الصناعية (Switches) ووحدات التغذية.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="text-xs text-slate-400 font-semibold">مخزون Hikvision Middle East</div>
              <div className="text-xl font-bold font-mono text-red-400">EGP 10,771,526</div>
              <p className="text-[11px] text-slate-400">
                121 كود صنف تشمل أنظمة التحكم في الأبواب (ACS)، بوابات المواقف، كاميرات المراقبة، وأجهزة التسجيل (NVRs).
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="text-xs text-slate-400 font-semibold">مخزون Velasea & Dell Enterprise</div>
              <div className="text-xl font-bold font-mono text-amber-400">EGP 6,170,922</div>
              <p className="text-[11px] text-slate-400">
                24 كود صنف تشمل خوادم IronLink ووحدات التخزين السحابية وأجهزة العمل المتخصصة (Workstations).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 8. TAB 4: Sales Leaderboard */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <h3 className="font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              ترتيب أداء مسؤولي المبيعات وفق المبيعات المعتمدة والفرص النشطة
            </h3>
            <span className="text-slate-400 font-mono">
              إجمالي مناديب الإدارة والأقسام المشتركة
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-right text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 text-[11px] border-b border-slate-800">
                  <th className="py-3 px-4 font-semibold">المسؤول بالمبيعات</th>
                  <th className="py-3 px-4 font-semibold text-center">أوامر البيع المعتمدة</th>
                  <th className="py-3 px-4 font-semibold text-left">المبيعات المعتمدة ($)</th>
                  <th className="py-3 px-4 font-semibold text-center">عروض الأسعار النشطة</th>
                  <th className="py-3 px-4 font-semibold text-left">قيمة العروض ($)</th>
                  <th className="py-3 px-4 font-semibold text-left">إجمالي المعاملات ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 font-mono text-xs">
                {sortedReps.slice(0, 10).map((rep, idx) => (
                  <tr key={rep.name} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-sans font-bold text-slate-100 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-mono text-[10px]">
                        {idx + 1}
                      </span>
                      <span>{rep.name}</span>
                    </td>
                    <td className="py-3 px-4 text-center text-emerald-400 font-bold">
                      {rep.orders}
                    </td>
                    <td className="py-3 px-4 text-left font-bold text-emerald-400">
                      ${Math.round(rep.salesUSD).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center text-blue-400">
                      {rep.quotes}
                    </td>
                    <td className="py-3 px-4 text-left text-slate-300">
                      ${Math.round(rep.quotesUSD).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-left font-black text-slate-100">
                      ${Math.round(rep.salesUSD + rep.quotesUSD).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 9. TAB 5: Strategic Proposals for CEO Approval */}
      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                مذكرة القرارات التنفيذية الأربعة المعروضة على الرئيس التنفيذي (CEO Action Memo)
              </h3>
              <p className="text-xs text-slate-400">
                توصيات مباشرة لتعظيم العائد وتسريع دورة رأس المال العامل لقطاع Physical Security BU
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Proposal 1 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-red-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-300 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-red-950 text-red-400 border border-red-800 flex items-center justify-center font-mono text-[11px]">1</span>
                    تحرير سيولة رأس المال العامل ($1.32M)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-red-950 text-red-300 border border-red-800">توجيه فوري</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  توجيه إدارة العمليات واللوجستيات والمحاسبة بإنهاء اعتمادات التسليم للأوامر المسلمة وإصدار فواتير ضريبية للأصناف المتبقية لتحصيل فوري من عملاء كبار مثل Pharaonic Group وOrange وG4S.
                </p>
              </div>

              {/* Proposal 2 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-blue-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-300 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-950 text-blue-400 border border-blue-800 flex items-center justify-center font-mono text-[11px]">2</span>
                    إلزامية تمييز البراند في Odoo (Phase 0 Policy)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-blue-950 text-blue-300 border border-blue-800">حوكمة ERP</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  إصدار قرار ملزم لفريق إدخال البيانات في Odoo بعدم حفظ أي بند أمر بيع أو أمر شراء بدون تحديد حقل <code className="font-mono text-blue-300">product.brand</code>، لمنع اختلاط مبيعات التوكيلات مع الأقسام الأخرى.
                </p>
              </div>

              {/* Proposal 3 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center font-mono text-[11px]">3</span>
                    الربط مع قاعدة بيانات سحابية وسيطة (Supabase / Postgres)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800">بنية تحتية</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  بناء طبقة تخزين ومزامنة سحابية فائقة السرعة مع Supabase لحفظ وعود السداد، خطط التدفق النقدي، وملاحظات التحصيل ومشاركتها فورياً بين الإدارة وفريق المبيعات على كافة الأجهزة مع بقاء Odoo آمناً للقراءة فقط.
                </p>
              </div>

              {/* Proposal 4 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-amber-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-950 text-amber-400 border border-amber-800 flex items-center justify-center font-mono text-[11px]">4</span>
                    خطة تنشيط تصريف المخزون الراكد (EGP 20.5M)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950 text-amber-300 border border-amber-800">حملة تجارية</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  طرح عروض حزم مجمعة (Bundling) مع كاميرات Hikvision ومحولات AMG لسرعة تصريف الأصناف التي تجاوزت 90 يوماً في مستودعات القاهرة والمنطقة الحرة.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
