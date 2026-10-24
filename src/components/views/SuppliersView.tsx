import React, { useState } from 'react';
import {
  Building2,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  DollarSign,
  Search,
  Save,
  CreditCard
} from 'lucide-react';
import { SupplierBill } from '../../types';
import { Pagination } from '../common/Pagination';

interface SuppliersViewProps {
  supplierBills: SupplierBill[];
  onUpdatePaymentSchedule: (
    billId: string,
    plannedDate: string,
    notes: string
  ) => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  supplierBills,
  onUpdatePaymentSchedule,
}) => {
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 8;

  const totalPayablesUSD = supplierBills.reduce(
    (sum, b) => sum + b.amountResidualUSD,
    0
  );

  const overduePayablesUSD = supplierBills
    .filter((b) => b.isOverdue)
    .reduce((sum, b) => sum + b.amountResidualUSD, 0);

  const startEditing = (bill: SupplierBill) => {
    setSelectedBillId(bill.id);
    setEditDate(bill.plannedPaymentDate || bill.dueDate);
    setEditNotes(bill.paymentNotes || '');
  };

  const handleSave = (billId: string) => {
    onUpdatePaymentSchedule(billId, editDate, editNotes);
    setSelectedBillId(null);
  };

  // Filter bills
  const filteredBills = supplierBills.filter((bill) => {
    if (selectedBrand !== 'all' && bill.brand !== selectedBrand) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        bill.odooName.toLowerCase().includes(q) ||
        bill.supplierName.toLowerCase().includes(q) ||
        (bill.purchaseOrderName && bill.purchaseOrderName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const paginatedBills = filteredBills.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Group into dynamic due buckets for cash flow clarity
  const overdueBucket = supplierBills.filter((b) => b.isOverdue);
  const due7DaysBucket = supplierBills.filter((b) => !b.isOverdue && b.daysToDue <= 7);
  const due30DaysBucket = supplierBills.filter((b) => !b.isOverdue && b.daysToDue > 7 && b.daysToDue <= 30);
  const dueLaterBucket = supplierBills.filter((b) => !b.isOverdue && b.daysToDue > 30);

  return (
    <div className="space-y-4">
      {/* View Header & Quick Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            مدفوعات الموردين وتواريخ الاستحقاق (Supplier Payables)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            متابعة فواتير التوريد لـ Hikvision وVelasea وAMG وجدولة السيولة المطلوبة
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300">
            <span className="text-slate-500 font-sans ml-1">إجمالي الالتزامات:</span>
            <span className="font-bold text-amber-400">${totalPayablesUSD.toLocaleString()}</span>
          </div>
          <div className="bg-slate-900 border border-red-950 rounded-lg px-3 py-1.5 text-slate-300">
            <span className="text-slate-500 font-sans ml-1">المتأخر:</span>
            <span className="font-bold text-red-400">${overduePayablesUSD.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Dynamic 4-Bucket Cash Flow Projection */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <h3 className="font-bold text-slate-200 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-blue-400" />
            توقع تدفقات السداد والسيولة النقدية المطلوبة (USD)
          </h3>
          <span className="text-slate-500 font-mono text-[11px]">
            محسوبة تلقائياً من تواريخ استحقاق الفواتير
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3 rounded-lg bg-slate-950 border border-red-950/60">
            <div className="text-[11px] text-slate-400 font-sans">فواتير متأخرة</div>
            <div className="text-base font-bold text-red-400 mt-1">
              ${overdueBucket.reduce((s, b) => s + b.amountResidualUSD, 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 font-sans mt-0.5">
              {overdueBucket.length} فاتورة بحاجة لتسوية فورية
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-amber-950/60">
            <div className="text-[11px] text-slate-400 font-sans">خلال 7 أيام</div>
            <div className="text-base font-bold text-amber-400 mt-1">
              ${due7DaysBucket.reduce((s, b) => s + b.amountResidualUSD, 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 font-sans mt-0.5">
              {due7DaysBucket.length} استحقاق وشيك
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-sans">خلال 30 يوماً</div>
            <div className="text-base font-bold text-blue-400 mt-1">
              ${due30DaysBucket.reduce((s, b) => s + b.amountResidualUSD, 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 font-sans mt-0.5">
              {due30DaysBucket.length} فواتير توريد
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-sans">أكثر من 30 يوماً</div>
            <div className="text-base font-bold text-emerald-400 mt-1">
              ${dueLaterBucket.reduce((s, b) => s + b.amountResidualUSD, 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 font-sans mt-0.5">
              {dueLaterBucket.length} التزامات مستقبلية
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
          {['all', 'Hikvision', 'Velasea', 'AMG'].map((b) => (
            <button
              key={b}
              onClick={() => {
                setSelectedBrand(b);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                selectedBrand === b
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {b === 'all' ? 'جميع الموردين' : b}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="بحث برقم الفاتورة أو المورد..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 pr-8 pl-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Supplier Bills List */}
      <div className="space-y-3">
        {paginatedBills.length === 0 ? (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-500 text-xs">
            لا توجد فواتير موردين مطابقة.
          </div>
        ) : (
          paginatedBills.map((bill) => {
            const isEditing = selectedBillId === bill.id;
            return (
              <div
                key={bill.id}
                className={`bg-slate-900 border rounded-xl p-4 transition-all ${
                  bill.isOverdue
                    ? 'border-red-900/60 bg-red-950/10'
                    : 'border-slate-800 hover:border-slate-750'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Brand & Supplier Info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          bill.brand === 'Hikvision'
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : bill.brand === 'Velasea'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                        }`}
                      >
                        {bill.brand}
                      </span>
                      <span className="font-mono font-bold text-slate-100 text-sm">
                        {bill.odooName}
                      </span>
                      {bill.purchaseOrderName && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          (PO: {bill.purchaseOrderName})
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-semibold text-slate-200">
                      {bill.supplierName}
                    </h4>
                  </div>

                  {/* Amount & Due Date */}
                  <div className="flex items-center gap-6 font-mono text-xs">
                    <div>
                      <div className="text-[10px] text-slate-500 font-sans">
                        المتبقي للسداد
                      </div>
                      <div className="text-base font-bold text-slate-100">
                        ${bill.amountResidualUSD.toLocaleString()}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-500 font-sans">
                        تاريخ الاستحقاق
                      </div>
                      <div
                        className={`text-xs font-semibold ${
                          bill.isOverdue ? 'text-red-400' : 'text-slate-200'
                        }`}
                      >
                        {bill.dueDate}
                      </div>
                      <div className="text-[10px] font-sans">
                        {bill.isOverdue ? (
                          <span className="text-red-400 font-semibold">متأخر</span>
                        ) : (
                          <span className="text-slate-400">متبقي {bill.daysToDue} يوم</span>
                        )}
                      </div>
                    </div>

                    {/* Planned Payment Schedule Info */}
                    <div className="min-w-[120px] text-right font-sans">
                      <div className="text-[10px] text-slate-500">الجدولة المخططة</div>
                      <div className="text-xs font-semibold text-blue-300 font-mono flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-400" />
                        {bill.plannedPaymentDate || 'غير مجدول'}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div>
                      <button
                        onClick={() => (isEditing ? setSelectedBillId(null) : startEditing(bill))}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                      >
                        {isEditing ? 'إغلاق' : 'جدولة السداد'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Notes row */}
                {bill.paymentNotes && !isEditing && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded-lg">
                    <span className="text-slate-500 font-medium">ملاحظة التدفق النقدي: </span>
                    {bill.paymentNotes}
                  </div>
                )}

                {/* Edit Schedule Form */}
                {isEditing && (
                  <div className="mt-4 pt-4 border-t border-slate-800 bg-slate-950 p-4 rounded-xl space-y-3 text-xs">
                    <div className="font-semibold text-slate-200">
                      تحديث جدولة سداد الفاتورة {bill.odooName} (حفظ محلي في المنصة):
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1">
                          تاريخ السداد المخطط:
                        </label>
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-md p-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">
                          ملاحظات التنسيق البنكي والاعتماد:
                        </label>
                        <input
                          type="text"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="مثال: جاهز للتحويل من حساب الدولار ببنك CIB..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-md p-2 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        onClick={() => setSelectedBillId(null)}
                        className="px-3 py-1.5 rounded-md bg-slate-800 text-slate-300 text-xs"
                      >
                        إلغاء
                      </button>
                      <button
                        onClick={() => handleSave(bill.id)}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
                      >
                        <Save className="w-3.5 h-3.5" />
                        حفظ الجدولة
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredBills.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};
