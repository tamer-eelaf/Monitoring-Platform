import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  Server,
  Bell,
  Shield,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ExternalLink,
  Save,
  Trash2,
  Sliders
} from 'lucide-react';
import {
  checkSupabaseConnection,
  syncEntireDatasetToSupabase,
  SUPABASE_URL,
  SUPABASE_SETUP_SQL,
  SupabaseHealth
} from '../../services/supabaseClient';
import { StorageService, AlertThresholds, DEFAULT_THRESHOLDS } from '../../services/storageService';
import { CustomerInvoice, SupplierBill } from '../../types';
import { CURRENT_EXCHANGE_RATE } from '../../data/mockData';

interface SettingsViewProps {
  invoices: CustomerInvoice[];
  supplierBills: SupplierBill[];
  onRefreshData?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  invoices,
  supplierBills,
  onRefreshData,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'supabase' | 'odoo' | 'thresholds' | 'system'>('supabase');

  // Supabase State
  const [health, setHealth] = useState<SupabaseHealth | null>(null);
  const [testingSupabase, setTestingSupabase] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Thresholds State
  const [thresholds, setThresholds] = useState<AlertThresholds>(() => StorageService.getThresholds());
  const [thresholdSaved, setThresholdSaved] = useState(false);

  // Check Supabase on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setTestingSupabase(true);
    try {
      const res = await checkSupabaseConnection();
      setHealth(res);
    } catch {
      setHealth({
        connected: false,
        url: SUPABASE_URL,
        message: 'فشل الاتصال بقاعدة البيانات',
      });
    } finally {
      setTestingSupabase(false);
    }
  };

  const handleSyncAll = async () => {
    setSyncingAll(true);
    setSyncResult(null);
    try {
      const res = await syncEntireDatasetToSupabase({
        invoices,
        bills: supplierBills,
      });
      setSyncResult(res);
      if (res.success) {
        checkConnection();
      }
    } catch (e: any) {
      setSyncResult({ success: false, message: e?.message || 'فشلت المزامنة' });
    } finally {
      setSyncingAll(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleSaveThresholds = () => {
    StorageService.saveThresholds(thresholds);
    setThresholdSaved(true);
    setTimeout(() => setThresholdSaved(false), 2500);
  };

  const handleResetStorage = () => {
    if (window.confirm('هل أنت متأكد من إعادة ضبط التخزين المؤقت المحلي للمتصفح؟')) {
      StorageService.resetToDefault();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl px-5 py-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            <span>إعدادات النظام والربط السحابي</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            إدارة اتصال سوبابيز، فحص خادم Odoo، عتبات التنبيهات، والتخزين الداخلي للمنصة
          </p>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs font-medium">
          {[
            { id: 'supabase', label: 'سوبابيز (Supabase)', icon: Database },
            { id: 'odoo', label: 'خادم Odoo', icon: Server },
            { id: 'thresholds', label: 'عتبات التنبيه', icon: Bell },
            { id: 'system', label: 'النظام والذاكرة', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                  activeSubTab === tab.id
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 1: Supabase Cloud Data Warehouse */}
      {activeSubTab === 'supabase' && (
        <div className="space-y-4 animate-fade-in">
          {/* Status Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                {testingSupabase ? (
                  <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
                ) : health?.connected ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      {testingSupabase
                        ? 'جارٍ فحص استجابة قاعدة البيانات...'
                        : health?.connected
                        ? 'مستودع سوبابيز السحابي متصل ويعمل بكفاءة'
                        : 'غير متصل بسوبابيز'}
                    </span>
                    {health?.latencyMs !== undefined && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                        {health.latencyMs}ms
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5 break-all">
                    {SUPABASE_URL}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={checkConnection}
                  disabled={testingSupabase}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingSupabase ? 'animate-spin' : ''}`} />
                  <span>إعادة الفحص</span>
                </button>

                <a
                  href="https://supabase.com/dashboard/project/cxuzyvlrpywkiidpmjqo/editor"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold border border-blue-500/30 transition-colors"
                >
                  <span>فتح سوبابيز</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Quick Sync Action */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">
                    مزامنة وتحديث البيانات السحابية (Sync Dataset)
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    رفع وحفظ كافة فواتير العملاء ومستحقات الموردين ولقطة الـ CEO في الجداول السحابية
                  </p>
                </div>

                <button
                  onClick={handleSyncAll}
                  disabled={syncingAll}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingAll ? 'animate-spin' : ''}`} />
                  <span>{syncingAll ? 'جارٍ المزامنة السحابية...' : 'مزامنة كافة الجداول الآن'}</span>
                </button>
              </div>

              {syncResult && (
                <div
                  className={`p-3 rounded-lg border text-xs flex items-center gap-2 animate-fade-in ${
                    syncResult.success
                      ? 'bg-emerald-950/60 border-emerald-700 text-emerald-200'
                      : 'bg-amber-950/60 border-amber-700 text-amber-200'
                  }`}
                >
                  {syncResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <span>{syncResult.message}</span>
                </div>
              )}
            </div>

            {/* Tables Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 font-mono">الجدول 1</span>
                <div className="font-bold text-slate-200 text-xs font-mono mt-0.5">ceo_snapshots</div>
                <p className="text-[10px] text-slate-400 mt-1">لقطات وتقارير الإدارة العليا</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 font-mono">الجدول 2</span>
                <div className="font-bold text-slate-200 text-xs font-mono mt-0.5">invoice_promises</div>
                <p className="text-[10px] text-slate-400 mt-1">وعود تحصيل فواتير العملاء</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 font-mono">الجدول 3</span>
                <div className="font-bold text-slate-200 text-xs font-mono mt-0.5">supplier_schedules</div>
                <p className="text-[10px] text-slate-400 mt-1">جدولة مواعيد سداد الموردين</p>
              </div>
            </div>
          </div>

          {/* Schema Migration (Collapsible/Quiet) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">
                كود هيكل الجداول (SQL Schema Backup)
              </span>
              <button
                onClick={handleCopySql}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'تم النسخ!' : 'نسخ كود SQL'}</span>
              </button>
            </div>
            <pre className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-[10px] text-slate-400 font-mono overflow-x-auto max-h-24 text-left leading-relaxed">
              {SUPABASE_SETUP_SQL}
            </pre>
          </div>
        </div>
      )}

      {/* SECTION 2: Odoo ERP Connection */}
      {activeSubTab === 'odoo' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-100">اتصال خادم Odoo ERP (شركة إيلاف مصر)</h3>
              <p className="text-xs text-slate-400">مصدر الحقيقة المالي — متصل بوضع القراءة فقط للحفاظ على سلامة القيود</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              قراءة فقط (Read-Only)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-500 font-sans block text-[11px]">رابط خادم Odoo:</span>
              <span className="text-slate-200 font-semibold">https://www.eelaf.com/odoo</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-500 font-sans block text-[11px]">قاعدة البيانات:</span>
              <span className="text-slate-200 font-semibold">eelaf-master-21952014</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-500 font-sans block text-[11px]">حساب الاتصال المعتمد:</span>
              <span className="text-slate-200 font-semibold">tamereelaf@gmail.com</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-500 font-sans block text-[11px]">توكيلات الإدارة:</span>
              <span className="text-emerald-400 font-sans font-semibold">Hikvision, Velasea, AMG</span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: Alert Thresholds */}
      {activeSubTab === 'thresholds' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-100">عتبات التنبيهات والرقابة التشغيلية</h3>
              <p className="text-xs text-slate-400">تحديد عدد الأيام المسموح بها قبل إطلاق التحذيرات للإدارة</p>
            </div>
            <button
              onClick={handleSaveThresholds}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{thresholdSaved ? 'تم الحفظ!' : 'حفظ التعديلات'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                حد اعتبار المخزون راكداً (أيام بلا حركة):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={thresholds.stagnantDays}
                  onChange={(e) => setThresholds({ ...thresholds, stagnantDays: Number(e.target.value) })}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 w-24 focus:outline-none focus:border-blue-500"
                />
                <span className="text-xs text-slate-400">يوماً (الافتراضي: 90 يوماً)</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                تنبيه بضاعة مسلّمة غير مفوترة بعد:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={thresholds.uninvoicedDays}
                  onChange={(e) => setThresholds({ ...thresholds, uninvoicedDays: Number(e.target.value) })}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 w-24 focus:outline-none focus:border-blue-500"
                />
                <span className="text-xs text-slate-400">يوماً من تاريخ التسليم</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                تنبيه استحقاق فواتير الموردين مسبقاً:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={thresholds.supplierDueAlertDays}
                  onChange={(e) => setThresholds({ ...thresholds, supplierDueAlertDays: Number(e.target.value) })}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 w-24 focus:outline-none focus:border-blue-500"
                />
                <span className="text-xs text-slate-400">يوماً قبل موعد الاستحقاق</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                فترة سماح فواتير العملاء بعد الاستحقاق:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={thresholds.overdueGraceDays}
                  onChange={(e) => setThresholds({ ...thresholds, overdueGraceDays: Number(e.target.value) })}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 w-24 focus:outline-none focus:border-blue-500"
                />
                <span className="text-xs text-slate-400">يوماً</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: System & Cache */}
      {activeSubTab === 'system' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 animate-fade-in">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-100">إدارة الجلسة والتخزين المحلي</h3>
            <p className="text-xs text-slate-400">معلومات الحساب النشط وسعر الصرف وإعادة ضبط التخزين المؤقت</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[11px]">المستخدم النشط:</span>
              <span className="text-slate-200 font-semibold font-mono">Tamer Elshafey (Director PHY BU)</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[11px]">سعر الصرف المعتمد:</span>
              <span className="text-slate-200 font-semibold font-mono">1 USD = {CURRENT_EXCHANGE_RATE} EGP</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <div>
              <div className="text-xs font-bold text-rose-300">إعادة ضبط الذاكرة المؤقتة (Clear Local Cache)</div>
              <p className="text-[11px] text-slate-500">حذف التخزين المؤقت للمتصفح وإعادة التحميل النظيف للملفات</p>
            </div>
            <button
              onClick={handleResetStorage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800 text-rose-300 text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>إعادة الضبط</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
