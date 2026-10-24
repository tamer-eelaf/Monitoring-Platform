import React, { useState } from 'react';
import {
  PackageSearch,
  CheckCircle2,
  Clock,
  Receipt,
  Split,
  ChevronDown,
  ChevronUp,
  Search
} from 'lucide-react';
import { SalesOrder, OrderStatus } from '../../types';
import { CURRENT_EXCHANGE_RATE } from '../../data/mockData';
import { Pagination } from '../common/Pagination';

interface OrdersViewProps {
  orders: SalesOrder[];
  showVatIncluded: boolean;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  showVatIncluded,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [filterDelayed, setFilterDelayed] = useState<boolean>(false);
  const [filterUninvoiced, setFilterUninvoiced] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 8;

  const filteredOrders = orders.filter((ord) => {
    if (selectedStatus !== 'all' && ord.status !== selectedStatus) return false;
    if (filterDelayed && !ord.isDeliveredDelayed) return false;
    if (filterUninvoiced && !ord.isUninvoiced) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        ord.odooName.toLowerCase().includes(q) ||
        ord.customerName.toLowerCase().includes(q) ||
        ord.salesRepName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const toggleExpand = (id: string) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-950 text-blue-300 border border-blue-800">
            أمر معتمد
          </span>
        );
      case 'delivered':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-950 text-amber-300 border border-amber-800">
            تم التسليم
          </span>
        );
      case 'invoiced':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950 text-emerald-300 border border-emerald-800">
            مفوتر في Odoo
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300">
            عرض سعر
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <PackageSearch className="w-5 h-5 text-blue-400" />
            أوامر بيع إدارة Physical Security BU (Team 35)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            تتبع أوامر البيع المسجلة لفريقك من التعميد إلى التسليم والفوترة
          </p>
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="بحث برقم الأمر أو العميل..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 pr-8 pl-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Orders List with Pagination */}
      <div className="space-y-3">
        {paginatedOrders.length === 0 ? (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-500 text-xs">
            لا توجد أوامر بيع مطابقة.
          </div>
        ) : (
          paginatedOrders.map((ord) => {
            const isExpanded = expandedOrderId === ord.id;
            const displayTotalUSD = showVatIncluded
              ? ord.totalWithTaxUSD
              : ord.totalUSD;

            return (
              <div
                key={ord.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-750 rounded-xl overflow-hidden transition-all"
              >
                {/* Order Summary Row */}
                <div
                  onClick={() => toggleExpand(ord.id)}
                  className="p-4 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-blue-400">
                        {ord.odooName}
                      </span>
                      {getStatusBadge(ord.status)}
                      {ord.isMixed && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-950 text-purple-300 border border-purple-800">
                          مختلط
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-slate-200">
                      {ord.customerName}
                    </h3>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span>تاريخ: <span className="font-mono">{ord.date}</span></span>
                      <span>·</span>
                      <span>المندوب: <strong className="text-slate-200">{ord.salesRepName}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 font-mono">
                    <div className="text-left">
                      <div className="text-[11px] text-slate-400 font-sans">
                        إجمالي الأمر
                      </div>
                      <div className="text-base font-bold text-slate-100">
                        ${displayTotalUSD.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {(displayTotalUSD * CURRENT_EXCHANGE_RATE).toLocaleString()} ج.م
                      </div>
                    </div>

                    <div className="p-1 text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && ord.lines.length > 0 && (
                  <div className="border-t border-slate-800 p-4 bg-slate-950/70 space-y-3 text-xs">
                    <h4 className="font-semibold text-slate-300">بنود الأمر المسجلة ({ord.lines.length} صنف):</h4>
                    <div className="border border-slate-800 rounded-lg overflow-hidden">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="bg-slate-900 text-slate-400 text-[11px] border-b border-slate-800">
                            <th className="py-2 px-3 font-medium">البراند</th>
                            <th className="py-2 px-3 font-medium">الصنف والكود</th>
                            <th className="py-2 px-3 font-medium text-center">الكمية</th>
                            <th className="py-2 px-3 font-medium text-left">سعر الوحدة</th>
                            <th className="py-2 px-3 font-medium text-left">الإجمالي ($)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 font-mono text-xs">
                          {ord.lines.map((l) => (
                            <tr key={l.id}>
                              <td className="py-2 px-3 font-sans">
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                                  {l.brand}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-sans text-slate-200">
                                {l.productName}
                              </td>
                              <td className="py-2 px-3 text-center text-slate-300 font-bold">
                                {l.quantity}
                              </td>
                              <td className="py-2 px-3 text-left text-slate-300">
                                ${l.unitPriceUSD.toLocaleString()}
                              </td>
                              <td className="py-2 px-3 text-left font-bold text-slate-100">
                                ${l.totalWithTaxUSD.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
        totalItems={filteredOrders.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};
