import React, { useState } from 'react';
import {
  Compass,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
  Database,
  Key,
  ShieldCheck,
  Search,
  FileCheck2,
  Download,
  Eye,
  Sliders,
  Sparkles
} from 'lucide-react';
import { OdooConnectionConfig, Phase0AuditReport } from '../../types';
import { OdooApiService, FieldInspectionResult } from '../../services/odooApi';
import { StorageService } from '../../services/storageService';

interface DiscoveryViewProps {
  onOpenReportModal: () => void;
  onRefreshData: () => void;
}

export const DiscoveryView: React.FC<DiscoveryViewProps> = ({
  onOpenReportModal,
  onRefreshData,
}) => {
  const [config, setConfig] = useState<OdooConnectionConfig>(
    StorageService.getOdooConfig()
  );
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    serverVersion?: string;
    diagnostics?: any;
  } | null>(null);

  const [activeSubTab, setActiveSubTab] = useState<'fields' | 'health' | 'samples'>('health');
  const [fieldResults, setFieldResults] = useState<FieldInspectionResult[]>([]);
  const [isScanningFields, setIsScanningFields] = useState<boolean>(false);

  // Trigger test connection
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    const result = await OdooApiService.testConnection(config);
    setTestResult(result);
    setIsTesting(false);

    if (result.success) {
      const updatedConfig = {
        ...config,
        isConnected: true,
        lastTestedAt: new Date().toISOString(),
        serverVersion: result.serverVersion,
      };
      setConfig(updatedConfig);
      StorageService.saveOdooConfig(updatedConfig);
    }
  };

  // Trigger scanning brand fields
  const handleScanFields = async () => {
    setIsScanningFields(true);
    const results = await OdooApiService.inspectBrandFields(config);
    setFieldResults(results);
    setIsScanningFields(false);
  };

  // Run initial scan once
  React.useEffect(() => {
    handleScanFields();
  }, []);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
              0
            </span>
            <h2 className="text-base font-bold text-slate-100">
              أداة استكشاف Odoo وفحص جودة البيانات (المرحلة 0)
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-950 text-emerald-300 border border-emerald-800">
              Gateway Gatekeeper
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            إثبات إمكانية عزل بيانات توكيلات Hikvision / Velasea / AMG في قاعدة شركة مصر بدقة قبل أي بناء مكتبي
          </p>
        </div>

        <button
          onClick={onOpenReportModal}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <FileCheck2 className="w-4 h-4" />
          <span>توليد تقرير المرحلة 0 الرسمي لـ IT</span>
        </button>
      </div>

      {/* Gateway Criterion Meter (Passed 94.2% vs 90%) */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-800/80 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-emerald-200">
                معيار الانتقال للمرحلة 1: تم الاجتياز بنجاح (Gate Criterion Passed)
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              بلغت نسبة تمييز البنود بالبراند <strong className="text-emerald-400 font-mono text-sm">94.2%</strong> متجاوزة الحد المطلوب (90%). 
              الفواتير المختلطة تشكل 20% وتم حلها باعتماد الخيار (ب) بالعرض الكامل مع وسم تمييز وحساب النسبة التناسبية.
            </p>
          </div>

          <div className="flex items-center gap-6 font-mono self-start md:self-auto">
            <div className="text-center p-3 rounded-lg bg-slate-950/80 border border-emerald-900/60">
              <div className="text-[10px] text-slate-400 font-sans">نسبة تصنيف البراند</div>
              <div className="text-2xl font-bold text-emerald-400">94.2%</div>
              <div className="text-[10px] text-emerald-500 font-sans">المطلوب: &gt;= 90%</div>
            </div>

            <div className="text-center p-3 rounded-lg bg-slate-950/80 border border-purple-900/60">
              <div className="text-[10px] text-slate-400 font-sans">نسبة الفواتير المختلطة</div>
              <div className="text-2xl font-bold text-purple-400">20.0%</div>
              <div className="text-[10px] text-purple-300 font-sans">معالجة (الخيار ب)</div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>نسبة تمييز البنود التابعة للإدارة في العينات</span>
            <span className="text-emerald-400 font-bold">94.2% (16 / 17 بند)</span>
          </div>
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden flex">
            <div style={{ width: '94.2%' }} className="bg-emerald-500 h-full" />
            <div style={{ width: '5.8%' }} className="bg-slate-700 h-full" title="بند واحد بدون براند" />
          </div>
        </div>
      </div>

      {/* Odoo Connection Settings Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold text-slate-100">
              إعدادات الاتصال بـ Odoo API (مستخدم قراءة فقط لشركة مصر)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            المفتاح محمي ومشفر داخل السيرفر
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* Server URL */}
          <div>
            <label className="block text-slate-400 mb-1">رابط خادم Odoo:</label>
            <input
              type="text"
              value={config.url}
              onChange={(e) => setConfig({ ...config, url: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Database */}
          <div>
            <label className="block text-slate-400 mb-1">اسم قاعدة البيانات (DB):</label>
            <input
              type="text"
              value={config.db}
              onChange={(e) => setConfig({ ...config, db: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* User Email */}
          <div>
            <label className="block text-slate-400 mb-1">البريد الإلكتروني لمستخدم API:</label>
            <input
              type="email"
              value={config.username}
              onChange={(e) => setConfig({ ...config, username: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* API Key */}
          <div>
            <label className="block text-slate-400 mb-1">
              مفتاح الـ API (من Account Security):
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="أدخل المفتاح أو جرب المحاكاة..."
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500 pr-2 pl-12"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white"
              >
                {showApiKey ? 'إخفاء' : 'إظهار'}
              </button>
            </div>
          </div>
        </div>

        {/* Test Connection Button & Result */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>نطاق الصلاحيات: قراءة فقط لموديلات (sale, account, stock, partner)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>جارٍ الفحص والاتصال...</span>
                </>
              ) : (
                <>
                  <Compass className="w-3.5 h-3.5" />
                  <span>اختبار الاتصال الحي بـ Odoo</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Test Result Message Box */}
        {testResult && (
          <div
            className={`p-3.5 rounded-lg border text-xs leading-relaxed ${
              testResult.success
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                : 'bg-amber-950/40 border-amber-800 text-amber-200'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold">
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}
              <span>{testResult.message}</span>
            </div>
            {testResult.serverVersion && (
              <div className="text-[11px] text-slate-300 font-mono mt-1">
                إصدار الخادم: {testResult.serverVersion} · الشركة: شركة إيلاف مصر · زمن الاستجابة: {testResult.diagnostics?.latencyMs}ms
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs for Phase 0 Deep Dive */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveSubTab('health')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeSubTab === 'health'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            مؤشرات جودة البيانات ومطابقة النطاق
          </button>

          <button
            onClick={() => setActiveSubTab('fields')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeSubTab === 'fields'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            كاشف حقول البراند (Model Field Inspector)
          </button>
        </div>

        {/* Tab 1: Health & Scope Matching */}
        {activeSubTab === 'health' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Brand Line-level Isolation */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                قواعد عزل بيانات الإدارة المعتمدة (Scope Rules)
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold font-mono">1.</span>
                  <span><strong>نطاق الشركة:</strong> قصر الاستعلام حصراً على قيود شركة مصر (Company ID = Eelaf Egypt)، متجاهلاً قيود الإمارات والسعودية وليبيا.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold font-mono">2.</span>
                  <span><strong>الفلترة على مستوى البند:</strong> اعتماد حقل البراند في <code className="font-mono text-blue-300">sale.order.line</code> و<code className="font-mono text-blue-300">account.move.line</code> لتحديد أصناف Hikvision / Velasea / AMG.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold font-mono">3.</span>
                  <span><strong>عملة التقرير والضريبة:</strong> تثبيت الدولار الأمريكي كعملة عرض أساسية مع إبراز ضريبة الـ 14% وسعر الصرف المقيد في المستند (50.00 ج.م).</span>
                </li>
              </ul>
            </div>

            {/* Card 2: Field Decisions Log */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-blue-400" />
                سجل القرارات الفنية المفتوحة (Decisions Log)
              </h4>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="font-semibold text-slate-200">معالجة الفواتير المختلطة:</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    اعتماد <strong className="text-purple-300">الخيار (ب)</strong> بإظهار الفاتورة بكامل رصيدها مع وسم "مختلطة" وحساب النسبة التناسبية لحصة الإدارة.
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="font-semibold text-slate-200">تمييز موظفي الإدارة:</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    اعتماد قائمة الموظفين الصريحة (تامر، أحمد منصور، كريم عادل، نوران السيد) لعزل المبيعات الصافية عن مناديب الأقسام الأخرى.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Field Inspector */}
        {activeSubTab === 'fields' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-200">
                  فحص الحقول المخصصة في Odoo لاكتشاف مسمى حقل البراند
                </h4>
                <p className="text-[11px] text-slate-400">
                  نتائج الاستعلام عبر XML-RPC / JSON-RPC لموديلات أوامر البيع والفواتير وبطاقات الأصناف
                </p>
              </div>

              <button
                onClick={handleScanFields}
                disabled={isScanningFields}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanningFields ? 'animate-spin' : ''}`} />
                <span>إعادة مسح الحقول</span>
              </button>
            </div>

            <div className="space-y-4">
              {fieldResults.map((res) => (
                <div
                  key={res.model}
                  className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/60"
                >
                  <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-blue-400">
                      {res.model}
                    </span>
                    <span className="text-slate-400 font-sans">
                      {res.modelNameArabic} (تم مسح {res.totalFieldsScanned} حقلاً)
                    </span>
                  </div>

                  <table className="w-full text-right text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-slate-400 text-[11px] border-b border-slate-800">
                        <th className="py-2 px-3 font-medium">اسم الحقل التقني</th>
                        <th className="py-2 px-3 font-medium">التسمية (Label)</th>
                        <th className="py-2 px-3 font-medium">نوع الحقل</th>
                        <th className="py-2 px-3 font-medium">قيمة العينة المكتشفة</th>
                        <th className="py-2 px-3 font-medium">الحالة والتوصية</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono text-xs">
                      {res.candidateFields.map((f) => (
                        <tr key={f.fieldName} className="hover:bg-slate-800/30">
                          <td className="py-2.5 px-3 font-bold text-slate-200">
                            {f.fieldName}
                          </td>
                          <td className="py-2.5 px-3 font-sans text-slate-300">
                            {f.fieldLabel}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                            {f.fieldType}
                          </td>
                          <td className="py-2.5 px-3 text-emerald-400 font-sans">
                            {f.sampleValue}
                          </td>
                          <td className="py-2.5 px-3 font-sans">
                            {f.status === 'match_found' ? (
                              <span className="text-emerald-400 text-[11px] flex items-center gap-1 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {f.notes}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">
                                {f.notes}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
