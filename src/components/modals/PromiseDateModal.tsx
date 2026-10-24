import React, { useState } from 'react';
import { X, Calendar, MessageSquare, User, Check, Clock, AlertCircle } from 'lucide-react';
import { CustomerInvoice, PromiseStatus } from '../../types';

interface PromiseDateModalProps {
  invoice: CustomerInvoice | null;
  onClose: () => void;
  onSave: (
    invoiceId: string,
    promiseDate: string,
    status: PromiseStatus,
    notes: string,
    assignedRep: string
  ) => void;
}

export const PromiseDateModal: React.FC<PromiseDateModalProps> = ({
  invoice,
  onClose,
  onSave,
}) => {
  if (!invoice) return null;

  const [promiseDate, setPromiseDate] = useState(
    invoice.promiseDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [promiseStatus, setPromiseStatus] = useState<PromiseStatus>(
    invoice.promiseStatus === 'none' ? 'scheduled' : invoice.promiseStatus
  );
  const [notes, setNotes] = useState(invoice.followupNotes || '');
  const [assignedRep, setAssignedRep] = useState(
    invoice.assignedFollowupUser || invoice.salesRepName
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(invoice.id, promiseDate, promiseStatus, notes, assignedRep);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl text-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              تسجيل موعد وعد السداد وملاحظات المتابعة
            </h3>
            <p className="text-[11px] text-slate-400">
              فاتورة Odoo: <span className="font-mono text-blue-400 font-semibold">{invoice.odooName}</span> · {invoice.customerName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Invoice Summary Box */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3 flex items-center justify-between">
            <div>
              <span className="text-slate-400">المبلغ المتبقي للتحصيل:</span>
              <div className="text-base font-bold font-mono text-emerald-400">
                ${invoice.amountResidualUSD.toLocaleString()}
              </div>
            </div>
            <div className="text-left">
              <span className="text-slate-400">تاريخ استحقاق Odoo:</span>
              <div className="text-slate-300 font-mono">{invoice.dueDate}</div>
              {invoice.daysOverdue > 0 && (
                <span className="text-[10px] text-red-400 font-medium">
                  متأخرة بـ {invoice.daysOverdue} يوم
                </span>
              )}
            </div>
          </div>

          {/* Promise Date Input */}
          <div>
            <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              تاريخ وعد العميل بالدفع (Promise Date):
            </label>
            <input
              type="date"
              value={promiseDate}
              onChange={(e) => setPromiseDate(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              * هذا التاريخ يُحفظ محلياً في المنصة للمتابعة ولا يُعدل في قيود Odoo المحاسبية.
            </p>
          </div>

          {/* Promise Status Selector */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              حالة الوعد:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'scheduled', label: 'مجدول (Scheduled)', icon: Clock, color: 'text-blue-400 border-blue-800' },
                { id: 'in_followup', label: 'قيد التواصل والمتابعة', icon: AlertCircle, color: 'text-amber-400 border-amber-800' },
                { id: 'broken', label: 'أخلَف الوعد (Broken)', icon: AlertCircle, color: 'text-red-400 border-red-800' },
                { id: 'kept', label: 'تم الوفاء والسداد', icon: Check, color: 'text-emerald-400 border-emerald-800' },
              ].map((s) => {
                const Icon = s.icon;
                const isSelected = promiseStatus === s.id;
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => setPromiseStatus(s.id as PromiseStatus)}
                    className={`flex items-center gap-2 p-2 rounded-md border text-right transition-colors ${
                      isSelected
                        ? `bg-slate-800 ${s.color} font-medium`
                        : 'border-slate-800 text-slate-400 hover:bg-slate-800/40'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Assigned Followup Person */}
          <div>
            <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-400" />
              المسؤول عن المتابعة من الإدارة:
            </label>
            <input
              type="text"
              value={assignedRep}
              onChange={(e) => setAssignedRep(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              تفاصيل الاتصال والملاحظات:
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: تم التواصل هاتفياً مع المدير المالي، الشيك جاهز للتوقيع والتسليم الأسبوع القادم..."
              className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-slate-200 text-xs focus:outline-none focus:border-blue-500 resize-none placeholder-slate-600"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-sm transition-colors"
            >
              حفظ الوعد والمتابعة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
