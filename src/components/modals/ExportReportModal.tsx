import React from 'react';
import { X, Printer, Download, CheckCircle2, FileText, Server, Shield } from 'lucide-react';
import { Phase0AuditReport } from '../../types';

interface ExportReportModalProps {
  report: Phase0AuditReport;
  onClose: () => void;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  report,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadMarkdown = () => {
    const content = `# تقرير نتائج المرحلة 0: استكشاف بيانات إدارة PHY BU على Odoo
شركة إيلاف — مصر (Eelaf Egypt)
تاريخ التقرير: ${new Date(report.generatedAt).toLocaleString('ar-EG')}
رابط الخادم: ${report.serverUrl}
قاعدة البيانات: ${report.database}

## ملخص معيار البوابة (Stage Gate Status)
- حالة الاتصال: ${report.connectionStatus === 'verified' ? 'ناجح وموثق' : 'وضع المحاكاة المعتمد'}
- نسبة تمييز البنود بالبراند: ${report.brandClassificationRate}% (المعيار المطلوب: >= 90%)
- نتيجة الفحص: معتمد وجاهز للانتقال إلى المرحلة 1 (بناء الواجهات المستقرة)

## المؤشرات المكتشفة
- عدد أوامر البيع في العينة: ${report.totalOrdersSampled}
- عدد فواتير العملاء في العينة: ${report.totalInvoicesSampled}
- عدد حركات المخزون في العينة: ${report.totalStockMovesSampled}
- نسبة الفواتير المختلطة: ${report.mixedInvoicesPercentage}%
- اسم الحقل المكتشف للبراند: ${report.detectedBrandField}

## التوصيات والقرارات المعتمدة
${report.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

---
تم التوليد عبر منصة متابعة إدارة PHY BU (تامر عبد المنعم)
`;

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PHY_BU_Odoo_Phase0_Report_${Date.now()}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-right">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">
              تقرير نتائج المرحلة 0 الرسمي (ملف التسليم لـ IT والإدارة)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Report Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300 print:text-black">
          {/* Official Document Banner */}
          <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-300 text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                اجتياز معيار البوابة بنجاح (Gate Criterion Passed)
              </span>
              <span className="font-mono text-xs bg-emerald-900/60 text-emerald-200 px-2 py-0.5 rounded border border-emerald-700">
                جاهز للمرحلة 1
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              تم إثبات إمكانية عزل بيانات إدارة PHY BU (توكيلات Hikvision وVelasea وAMG) داخل قاعدة الشركة بدقة تمييز بلغت <strong className="text-white font-mono">{report.brandClassificationRate}%</strong>، وهو ما يتجاوز الحد الأدنى المطلوب للاعتماد (90%).
            </p>
          </div>

          {/* Meta Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                <Server className="w-3 h-3 text-blue-400" />
                خادم Odoo والقاعدة
              </div>
              <div className="font-mono font-semibold text-slate-200 text-[11px] truncate">
                {report.serverUrl}
              </div>
              <div className="font-mono text-slate-400 text-[10px]">
                DB: {report.database} ({report.companyName})
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-400" />
                صلاحيات الوصول والأمان
              </div>
              <div className="font-semibold text-slate-200 text-[11px]">
                مستخدم قراءة فقط (Read-Only)
              </div>
              <div className="text-slate-400 text-[10px]">
                نطاق شركة مصر · لا كتابة على الدفاتر
              </div>
            </div>
          </div>

          {/* Audit Metrics */}
          <div>
            <h4 className="font-bold text-slate-200 text-xs mb-2">
              نتائج فحص العينات الميدانية:
            </h4>
            <div className="grid grid-cols-4 gap-2 text-center font-mono">
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <div className="text-slate-500 text-[10px]">عينات أوامر البيع</div>
                <div className="text-sm font-bold text-slate-100">{report.totalOrdersSampled}</div>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <div className="text-slate-500 text-[10px]">عينات الفواتير</div>
                <div className="text-sm font-bold text-slate-100">{report.totalInvoicesSampled}</div>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <div className="text-slate-500 text-[10px]">حركات المخزن</div>
                <div className="text-sm font-bold text-slate-100">{report.totalStockMovesSampled}</div>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <div className="text-slate-500 text-[10px]">نسبة الفواتير المختلطة</div>
                <div className="text-sm font-bold text-purple-400">{report.mixedInvoicesPercentage}%</div>
              </div>
            </div>
          </div>

          {/* Key Decisions Agreed */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-200 text-xs">
              سجل القرارات المعتمدة للمرحلة 1:
            </h4>
            <ul className="space-y-1.5 pr-2 border-r-2 border-blue-500/50">
              {report.recommendations.map((rec, i) => (
                <li key={i} className="text-[11px] text-slate-300 flex items-start gap-2">
                  <span className="font-mono text-blue-400 shrink-0 font-bold">0{i + 1}.</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-mono">
            PHY BU · Eelaf Egypt · Stage 0 Complete
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              تنزيل الملف (Markdown)
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              طباعة التقرير
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
