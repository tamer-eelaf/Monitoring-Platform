import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Search,
  Split,
  Eye,
  Edit3,
  Receipt,
  Download,
  AlertCircle,
  Phone,
  User
} from 'lucide-react';
import { CustomerInvoice, EgyptClient } from '../../types';
import { CURRENT_EXCHANGE_RATE } from '../../data/mockData';
import { Pagination } from '../common/Pagination';
import { DataGapNotice } from '../common/DataNotice';

interface CollectionsViewProps {
  invoices: CustomerInvoice[];
  clients?: EgyptClient[];
  showVatIncluded: boolean;
  onSelectInvoice: (invoice: CustomerInvoice) => void;
  onEditPromise: (invoice: CustomerInvoice) => void;
}

export const CollectionsView: React.FC<CollectionsViewProps> = ({
  invoices,
  clients = [],
  showVatIncluded,
  onSelectInvoice,
  onEditPromise,
}) => {
  if (invoices.length === 0) {
    return (
      <DataGapNotice
        title="فواتير العملاء والتحصيلات (AR Invoices)"
        why="لا يوجد في تصديرات Odoo الحالية بيان بالفواتير أو المبالغ المتبقية أو المدفوعات. ما كان يظهر سابقاً كان مفترضاً وتم إيقافه لمنع تتبع مديونيات غير حقيقية."
        needs={[
          'تصدير الفواتير (account.move): رقم الفاتورة، العميل، تاريخ الفاتورة وتاريخ الاستحقاق',
          'المبلغ الإجمالي والمتبقي (amount_residual) وحالة السداد',
          'ربط الفاتورة برقم أمر البيع'
        ]}
      />
    );
  }

  const [selectedBracket, setSelectedBracket] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [onlyMixed, setOnlyMixed] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 8;

  // Fast client lookup map
  const clientMap = useMemo(() => {
    const map = new Map<string, EgyptClient>();
    if (clients) {
      clients.forEach((c) => {
        map.set((c.name || '').toLowerCase().trim(), c);
        if (c.nameAr) map.set((c.nameAr || '').toLowerCase().trim(), c);
      });
    }
    return map;
  }, [clients]);

  const findClientForInvoice = (inv: CustomerInvoice): EgyptClient | undefined => {
    if (!clients || clients.length === 0) return undefined;
    const cName = (inv.customerName || '').toLowerCase().trim();
    const directMatch = clientMap.get(cName);
    if (directMatch) return directMatch;
    return clients.find((c) => (c.name || '').toLowerCase().includes(cName));
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    if (selectedBracket !== 'all' && inv.agingBracket !== selectedBracket) {
      return false;
    }
    if (selectedBrand !== 'all') {
      const hasBrand = inv.lines.some((l) => l.brand === selectedBrand);
      if (!hasBrand) return false;
    }
    if (onlyMixed && !inv.isMixed) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        inv.odooName.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        inv.salesRepName.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Pagination slice
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Totals
  const totalOutstandingUSD = invoices.reduce(
    (acc, inv) => acc + inv.amountResidualUSD,
    0
  );
  const totalOverdueUSD = invoices
    .filter((inv) => inv.daysOverdue > 0 && inv.amountResidualUSD > 0)
    .reduce((acc, inv) => acc + inv.amountResidualUSD, 0);

  const handleExportCSV = () => {
    const headers = [
      'رقم الفاتورة في Odoo',
      'العميل',
      'المندوب',
      'المتبقي بالدولار',
      'المتبقي بالجنيه',
      'تاريخ الاستحقاق',
      'أيام التأخير',
      'حالة السداد',
    ];
    const rows = filteredInvoices.map((i) => [
      i.odooName,
      `"${i.customerName}"`,
      i.salesRepName,
      i.amountResidualUSD,
      i.amountResidualUSD * CURRENT_EXCHANGE_RATE,
      i.dueDate,
      i.daysOverdue,
      i.paymentStatus,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PHY_BU_Invoices_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Compact Metrics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-400" />
            فواتير العملاء والتحصيلات (AR Invoices)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            فواتير شركة مصر المقيدة في Odoo مع تتبع المتبقي ووعود السداد
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 font-mono text-xs">
            <span className="text-slate-400 font-sans ml-1">إجمالي المتبقي:</span>
            <span className="font-bold text-amber-400">${totalOutstandingUSD.toLocaleString()}</span>
            <span className="text-slate-600 mx-1.5">|</span>
            <span className="text-slate-400 font-sans ml-1">المتأخر:</span>
            <span className="font-bold text-red-400">${totalOverdueUSD.toLocaleString()}</span>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Simplified, Compact Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Aging Tabs */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs font-medium">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'current', label: 'الحالي' },
              { id: '1_30', label: '1–30 يوم تأخير' },
              { id: '31_60', label: '31–60' },
              { id: 'over_90', label: '+90 يوم' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedBracket(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  selectedBracket === tab.id
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Brand Filter */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
            {['all', 'Hikvision', 'Velasea', 'AMG'].map((b) => (
              <button
                key={b}
                onClick={() => {
                  setSelectedBrand(b);
                  setCurrentPage(1);
                }}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  selectedBrand === b
                    ? 'bg-slate-800 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {b === 'all' ? 'جميع البراندات' : b}
              </button>
            ))}
          </div>

          {/* Mixed Invoices Toggle */}
          <button
            onClick={() => {
              setOnlyMixed(!onlyMixed);
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs transition-colors ${
              onlyMixed
                ? 'bg-purple-950 text-purple-300 border-purple-800 font-semibold'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            <span>فواتير مختلطة</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-56">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="بحث بالفاتورة أو العميل..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 pr-8 pl-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Paginated Invoices Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400 text-[11px] border-b border-slate-800">
                <th className="py-2.5 px-4 font-medium">رقم الفاتورة (Odoo)</th>
                <th className="py-2.5 px-4 font-medium">العميل والمندوب</th>
                <th className="py-2.5 px-4 font-medium text-left">
                  {showVatIncluded ? 'إجمالي الفاتورة' : 'الصافي'}
                </th>
                <th className="py-2.5 px-4 font-medium text-left">المتبقي للتحصيل</th>
                <th className="py-2.5 px-4 font-medium">تاريخ الاستحقاق</th>
                <th className="py-2.5 px-4 font-medium">وعد السداد المحفوظ</th>
                <th className="py-2.5 px-4 font-medium text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 font-mono text-xs">
              {paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                    لا توجد فواتير مطابقة لخيارات التصفية.
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((inv) => {
                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Odoo Invoice Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onSelectInvoice(inv)}
                            className="font-bold text-blue-400 hover:text-blue-300 hover:underline"
                          >
                            {inv.odooName}
                          </button>
                          {inv.isMixed && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-sans font-medium bg-purple-950 text-purple-300 border border-purple-800">
                              مختلطة
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {inv.date}
                        </div>
                      </td>

                      {/* Customer & Rep & Contact */}
                      <td className="py-3 px-4 font-sans">
                        {(() => {
                          const invClient = findClientForInvoice(inv);
                          return (
                            <>
                              <div className="font-semibold text-slate-200">
                                {inv.customerName}
                              </div>
                              {invClient && invClient.phone ? (
                                <div className="text-[11px] text-emerald-400 font-mono mt-0.5 flex items-center gap-1 font-bold">
                                  <Phone className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                                  <a
                                    href={`tel:${invClient.phone.replace(/\s+/g, '')}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="hover:underline dir-ltr text-emerald-300"
                                    title="اتصال مباشر بالعميل"
                                  >
                                    {invClient.phone}
                                  </a>
                                </div>
                              ) : null}
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                المندوب: {inv.salesRepName}
                              </div>
                            </>
                          );
                        })()}
                      </td>

                      {/* Total USD */}
                      <td className="py-3 px-4 text-left font-mono text-slate-300">
                        ${showVatIncluded ? inv.totalWithTaxUSD.toLocaleString() : inv.totalUSD.toLocaleString()}
                      </td>

                      {/* Residual USD */}
                      <td className="py-3 px-4 text-left font-mono">
                        <div
                          className={`font-bold ${
                            inv.amountResidualUSD > 0
                              ? 'text-emerald-400'
                              : 'text-slate-500 line-through'
                          }`}
                        >
                          ${inv.amountResidualUSD.toLocaleString()}
                        </div>
                        {inv.amountResidualUSD > 0 && (
                          <div className="text-[10px] text-slate-500">
                            {(inv.amountResidualUSD * CURRENT_EXCHANGE_RATE).toLocaleString()} ج.م
                          </div>
                        )}
                      </td>

                      {/* Due Date & Aging */}
                      <td className="py-3 px-4 font-mono">
                        <div className="text-slate-300">{inv.dueDate}</div>
                        {inv.daysOverdue > 0 && inv.amountResidualUSD > 0 ? (
                          <div className="text-[10px] text-red-400 font-sans flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 inline" />
                            تأخر {inv.daysOverdue} يوم
                          </div>
                        ) : inv.amountResidualUSD === 0 ? (
                          <div className="text-[10px] text-slate-500 font-sans">
                            مسددة بالكامل
                          </div>
                        ) : (
                          <div className="text-[10px] text-emerald-400 font-sans">
                            ساري
                          </div>
                        )}
                      </td>

                      {/* Promise Date */}
                      <td className="py-3 px-4 font-sans">
                        {inv.promiseDate ? (
                          <div className="flex items-center gap-1 text-xs font-mono font-medium text-slate-200">
                            <Calendar className="w-3 h-3 text-blue-400" />
                            <span>{inv.promiseDate}</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => onEditPromise(inv)}
                            className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
                          >
                            <Clock className="w-3 h-3" />
                            تسجيل موعد
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 font-sans">
                          <button
                            onClick={() => onEditPromise(inv)}
                            title="تعديل وعد السداد والملاحظات"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onSelectInvoice(inv)}
                            title="عرض تفاصيل الفاتورة والبنود"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredInvoices.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};
