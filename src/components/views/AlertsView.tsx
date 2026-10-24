import React, { useState } from 'react';
import {
  BellRing,
  AlertTriangle,
  Clock,
  Sliders,
  CheckCircle2,
  Receipt,
  Warehouse,
  PackageSearch,
  Building2,
  ChevronLeft,
  Save
} from 'lucide-react';
import { SystemAlert } from '../../types';
import { AlertThresholds, StorageService } from '../../services/storageService';
import { Pagination } from '../common/Pagination';

interface AlertsViewProps {
  alerts: SystemAlert[];
  onNavigateTab: (tabId: string) => void;
  onOpenRecord: (alert: SystemAlert) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  onNavigateTab,
  onOpenRecord,
}) => {
  const [thresholds, setThresholds] = useState<AlertThresholds>(
    StorageService.getThresholds()
  );
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 6;

  const handleSaveThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveThresholds(thresholds);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity !== 'all' && a.severity !== filterSeverity) return false;
    return true;
  });

  const paginatedAlerts = filteredAlerts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const getAlertIcon = (type: SystemAlert['type']) => {
    switch (type) {
      case 'broken_promise':
      case 'overdue_invoice':
        return <Receipt className="w-4 h-4 text-red-400" />;
      case 'supplier_due':
        return <Building2 className="w-4 h-4 text-amber-400" />;
      case 'stagnant_stock':
        return <Warehouse className="w-4 h-4 text-cyan-400" />;
      case 'undelivered_order':
      case 'uninvoiced_delivery':
        return <PackageSearch className="w-4 h-4 text-blue-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <BellRing className="w-5 h-5 text-red-400" />
            التنبيهات ومؤشرات التدخل السريع (Smart Alerts & Action Queue)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            رصد تلقائي لأعمار الديون والوعود المنقضية وأوامر التوريد والمخزون الراكد
          </p>
        </div>

        {/* Filter by severity */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
          {['all', 'high', 'medium'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                filterSeverity === sev
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sev === 'all' ? 'جميع التنبيهات' : sev === 'high' ? 'عالية الأهمية' : 'متوسطة'}
            </button>
          ))}
        </div>
      </div>

      {/* Threshold Configuration Drawer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold text-slate-100">
              ضبط عتبات التنبيه وقواعد التحذير (Alert Thresholds)
            </h3>
          </div>
          {savedSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              تم حفظ العتبات بنجاح
            </span>
          )}
        </div>

        <form onSubmit={handleSaveThresholds} className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">
              أيام ركود المخزون (Stagnant Stock):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="30"
                max="365"
                value={thresholds.stagnantDays}
                onChange={(e) =>
                  setThresholds({ ...thresholds, stagnantDays: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
              />
              <span className="text-slate-500 font-mono">يوم</span>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">
              تنبيه استحقاق المورد قبل:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="30"
                value={thresholds.supplierDueAlertDays}
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    supplierDueAlertDays: Number(e.target.value),
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
              />
              <span className="text-slate-500 font-mono">أيام</span>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">
              تأخر فوترة التسليم (Uninvoiced):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="14"
                value={thresholds.uninvoicedDays}
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    uninvoicedDays: Number(e.target.value),
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
              />
              <span className="text-slate-500 font-mono">أيام</span>
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              حفظ العتبات
            </button>
          </div>
        </form>
      </div>

      {/* Active Alerts List */}
      <div className="space-y-3">
        {paginatedAlerts.length === 0 ? (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-500 text-xs">
            لا توجد تنبيهات مطابقة لهذا التصنيف.
          </div>
        ) : (
          paginatedAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-slate-900 border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                alert.severity === 'high'
                  ? 'border-red-900/60 bg-red-950/15'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    alert.severity === 'high'
                      ? 'bg-red-950 text-red-400 border border-red-800'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {getAlertIcon(alert.type)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-100">
                      {alert.title}
                    </h4>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                        alert.severity === 'high'
                          ? 'bg-red-900/70 text-red-200'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {alert.severity === 'high' ? 'أولوية قصوى' : 'متوسط'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                    {alert.message}
                  </p>
                  <div className="text-[10px] text-slate-500 font-mono">
                    تاريخ الرصد: {alert.date}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                {alert.amountUSD !== undefined && (
                  <div className="text-left font-mono">
                    <div className="text-[10px] text-slate-500">القيمة المرتبطة</div>
                    <div className="text-sm font-bold text-slate-100">
                      ${alert.amountUSD.toLocaleString()}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => onOpenRecord(alert)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
                >
                  <span>الانتقال للسجل</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalItems={filteredAlerts.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};
