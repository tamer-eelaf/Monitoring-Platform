import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Server,
  X,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  checkSupabaseConnection,
  SUPABASE_URL,
  SUPABASE_SETUP_SQL,
  SupabaseHealth
} from '../../services/supabaseClient';

interface SupabaseConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConnectionModal: React.FC<SupabaseConnectionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [health, setHealth] = useState<SupabaseHealth | null>(null);
  const [testing, setTesting] = useState(false);
  const [copied, setCopied] = useState(false);

  const testConnection = async () => {
    setTesting(true);
    try {
      const res = await checkSupabaseConnection();
      setHealth(res);
    } catch (err: any) {
      setHealth({
        connected: false,
        url: SUPABASE_URL,
        message: err?.message || 'فشل الاتصال',
      });
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      testConnection();
    }
  }, [isOpen]);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">اتصال سوبابيز (Supabase Cloud)</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                  v2 Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                مستودع البيانات السحابي السريع وطبقة التعاون والمتابعة التنفيذية
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Status Box */}
          <div className="p-4 rounded-xl border bg-slate-950/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-slate-800">
            <div className="flex items-start gap-3">
              {testing ? (
                <RefreshCw className="w-6 h-6 text-blue-400 animate-spin mt-0.5" />
              ) : health?.connected ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mt-0.5 shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-400 mt-0.5 shrink-0" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">
                    {testing
                      ? 'جارٍ فحص استجابة سوبابيز...'
                      : health?.connected
                      ? 'تم الاتصال بنجاح بقاعدة البيانات'
                      : 'فشل الاتصال بسوبابيز'}
                  </span>
                  {health?.latencyMs !== undefined && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {health.latencyMs}ms
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5 break-all font-mono">
                  {SUPABASE_URL}
                </p>
                {health?.message && (
                  <p className="text-xs text-emerald-400 mt-1 font-medium">
                    {health.message}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={testConnection}
              disabled={testing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              <span>فحص مجدداً</span>
            </button>
          </div>

          {/* Architecture harmony */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-900/40">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-xs mb-1.5">
                <Server className="w-4 h-4" />
                <span>Odoo ERP (Read-Only)</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                مصدر الحقيقة المالي: الفواتير الرسمية، أوامر البيع المسجلة، كميات المخزن المتاحة. الاتصال به للقراءة فقط للحفاظ على نزاهة الحسابات.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-900/40">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1.5">
                <Database className="w-4 h-4" />
                <span>Supabase Cloud (Fast R/W)</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                طبقة التعاون السحابية: مواعيد وعود التحصيل، جدولة مستحقات الموردين، ملاحظات المندوبين، ولقطات التقارير التنفيذية للـ CEO.
              </p>
            </div>
          </div>

          {/* Cloud Tables & SQL Migration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-slate-200">
                  كود تهيئة الجداول في سوبابيز (SQL Schema)
                </h4>
              </div>
              <button
                onClick={handleCopySql}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم النسخ!' : 'نسخ كود الـ SQL'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-400">
              يمكنك لصق هذا الكود في <span className="text-slate-200 font-semibold">SQL Editor</span> داخل لوحة تحكم سوبابيز الخاصة بك لإنشاء الجداول فوراً بنقرة واحدة (التطبيق يحفظ محلياً أيضاً كنسخة احتياطية):
            </p>

            <div className="relative">
              <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-[11px] text-slate-300 font-mono overflow-x-auto max-h-44 text-left leading-relaxed">
                {SUPABASE_SETUP_SQL}
              </pre>
            </div>
          </div>

          {/* Quick link to Supabase */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium underline"
            >
              <span>فتح لوحة تحكم سوبابيز (SQL Editor)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-[11px] text-slate-500">
              المفتاح المعلن: sb_publishable_...SbrHdQiM
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
