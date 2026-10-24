import React from 'react';
import { X, ExternalLink, Calendar, Clock, DollarSign, Split } from 'lucide-react';
import { CustomerInvoice } from '../../types';
import { CURRENT_EXCHANGE_RATE } from '../../data/mockData';

interface InvoiceDetailModalProps {
  invoice: CustomerInvoice | null;
  onClose: () => void;
  onEditPromise: (invoice: CustomerInvoice) => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  onClose,
  onEditPromise,
}) => {
  if (!invoice) return null;

  const totalLines = invoice.lines.length;
  const buLines = invoice.lines.filter((l) => l.isBULine);
  const nonBuLines = invoice.lines.filter((l) => !l.isBULine);

  const buLinesTotalUSD = buLines.reduce((acc, l) => acc + l.totalWithTaxUSD, 0);
  const totalWithTaxUSD = invoice.totalWithTaxUSD;
  const buRatioPercent = totalWithTaxUSD > 0 ? (buLinesTotalUSD / totalWithTaxUSD) * 100 : 100;
  const proportionalResidualUSD = (invoice.amountResidualUSD * buRatioPercent) / 100;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-right">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold text-blue-400">
                {invoice.odooName}
              </span>
              {invoice.isMixed && (
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-950 text-purple-300 border border-purple-800 flex items-center gap-1">
                  <Split className="w-3 h-3" />
                  فاتورة مختلطة (Multi-Brand)
                </span>
              )}
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                  invoice.paymentStatus === 'paid'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : invoice.paymentStatus === 'overdue'
                    ? 'bg-red-950 text-red-300 border border-red-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}
              >
                {invoice.paymentStatus === 'overdue'
                  ? `متأخرة (${invoice.daysOverdue} يوم)`
                  : invoice.paymentStatus === 'paid'
                  ? 'مسددة'
                  : 'مفتوحة للاستحقاق'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              العميل: <span className="font-semibold">{invoice.customerName}</span> · مندوب المبيعات: {invoice.salesRepName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Mixed Invoice Diagnostic Alert Banner (Option B Implementation) */}
          {invoice.isMixed && (
            <div className="p-3.5 rounded-lg bg-purple-950/30 border border-purple-800/60 space-y-2">
              <div className="flex items-center justify-between text-purple-200 font-semibold text-xs">
                <span className="flex items-center gap-1.5">
                  <Split className="w-4 h-4 text-purple-400" />
                  معالجة الفاتورة المختلطة (مبدأ التصميم - الخيار ب)
                </span>
                <span className="font-mono text-purple-300">
                  حصة إدارة PHY BU: {buRatioPercent.toFixed(1)}%
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                تحتوي هذه الفاتورة على بنود خاصة بإدارتك ({buLines.length} صنف براند) بجانب بنود تابعة لأقسام أخرى ({nonBuLines.length} صنف). 
                وفقاً للقرار المعتمد، تُعرض الفاتورة بكامل رصيدها المسجل في Odoo ($ {invoice.amountResidualUSD.toLocaleString()}) لضمان تتبع المستند، بينما تبلغ الحصة التناسبية المحسوبة لإدارتك حوالي <strong className="text-emerald-400 font-mono">${proportionalResidualUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>.
              </p>
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[11px] text-slate-400">إجمالي الفاتورة (شامل 14%)</div>
              <div className="text-base font-bold font-mono text-slate-100 mt-0.5">
                ${invoice.totalWithTaxUSD.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                صافي: ${invoice.totalUSD.toLocaleString()}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[11px] text-slate-400">المبلغ المتبقي للتحصيل</div>
              <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                ${invoice.amountResidualUSD.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {(invoice.amountResidualUSD * CURRENT_EXCHANGE_RATE).toLocaleString()} ج.م
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[11px] text-slate-400">تاريخ الاستحقاق</div>
              <div className="text-sm font-semibold font-mono text-slate-200 mt-0.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                {invoice.dueDate}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                صدرت في: {invoice.date}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[11px] text-slate-400">حالة وعد السداد</div>
              <div className="text-xs font-semibold text-slate-200 mt-0.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                {invoice.promiseDate ? invoice.promiseDate : 'لم يُسجل وعد'}
              </div>
              <button
                onClick={() => onEditPromise(invoice)}
                className="text-[10px] text-blue-400 hover:underline mt-0.5 block"
              >
                تعديل موعد الوعد والمتابعة
              </button>
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-slate-200 text-xs">
                بنود الفاتورة المفصلة على مستوى الصنف ({totalLines} بنود)
              </h4>
              <span className="text-[10px] text-slate-400">
                الفلترة والاحتساب على مستوى البند (Line-level Filtering)
              </span>
            </div>

            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 text-[11px] border-b border-slate-800">
                    <th className="py-2 px-3 font-medium">البراند والانتماء</th>
                    <th className="py-2 px-3 font-medium">الصنف والكود (SKU)</th>
                    <th className="py-2 px-3 font-medium text-center">الكمية</th>
                    <th className="py-2 px-3 font-medium text-left">سعر الوحدة ($)</th>
                    <th className="py-2 px-3 font-medium text-left">الإجمالي شامل 14%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {invoice.lines.map((line) => (
                    <tr
                      key={line.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        !line.isBULine ? 'bg-slate-950/40 opacity-75' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5 font-sans">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              line.brand === 'Hikvision'
                                ? 'bg-red-950/80 text-red-300 border border-red-800/60'
                                : line.brand === 'Velasea'
                                ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                                : line.brand === 'AMG'
                                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {line.brand}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {line.isBULine ? 'إدارة PHY' : 'قسم خارجي'}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-sans text-xs text-slate-200">
                          {line.productName}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          SKU: {line.sku}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-300">
                        {line.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-left text-slate-300">
                        ${line.unitPriceUSD.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-left font-bold text-slate-100">
                        ${line.totalWithTaxUSD.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Follow-up Log History */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">
                سجل المتابعة والملاحظات المحفوظة بالمنصة:
              </span>
              {invoice.lastContactDate && (
                <span className="text-[10px] text-slate-500 font-mono">
                  آخر تواصل: {invoice.lastContactDate}
                </span>
              )}
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              {invoice.followupNotes || 'لا توجد ملاحظات مسجلة بعد. انقر على تعديل الوعد لإضافة تفاصيل المتابعة.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-2">
            <span>مرجع Odoo: account.move (out_invoice)</span>
            <span>·</span>
            <span>القاعدة: eelaf-master-21952014</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEditPromise(invoice)}
              className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
            >
              تعديل وعد السداد
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
