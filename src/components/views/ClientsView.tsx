import React, { useState } from 'react';
import {
  Users,
  Search,
  Phone,
  Building,
  CreditCard,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { EgyptClient } from '../../types';
import { Pagination } from '../common/Pagination';

interface ClientsViewProps {
  clients: EgyptClient[];
}

export const ClientsView: React.FC<ClientsViewProps> = ({ clients }) => {
  const [search, setSearch] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 8;

  const filteredClients = clients.filter((c) => {
    if (selectedBrand !== 'all' && c.primaryBrand !== selectedBrand) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.contactPerson.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.assignedRepName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="space-y-4">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            قاعدة عملاء مصر لتوكيلات الإدارة (Egypt BU Customers)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            دليل الشركات المصرية التي اشترت منتجات Hikvision وVelasea وAMG من واقع Odoo
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono">
          <span className="text-slate-500 font-sans ml-1">إجمالي العملاء:</span>
          <span className="font-bold text-slate-100">{clients.length} عميل</span>
        </div>
      </div>

      {/* Brand Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5">
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
              {b === 'all' ? 'جميع البراندات' : b}
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
            placeholder="بحث بالاسم، الهاتف، المدينة..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 pr-8 pl-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Clients Cards Grid */}
      {paginatedClients.length === 0 ? (
        <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-500 text-xs">
          لا يوجد عملاء مطابقون للبحث.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {paginatedClients.map((client) => {
            return (
              <div
                key={client.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-750 rounded-xl p-4 transition-all space-y-3"
              >
                {/* Client Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          client.primaryBrand === 'Hikvision'
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : client.primaryBrand === 'Velasea'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                        }`}
                      >
                        {client.primaryBrand}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        ID: {client.odooPartnerId}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-100">
                      {client.name}
                    </h3>
                    <div className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-500" />
                      <span>{client.industry || 'قطاع الأعمال'}</span>
                    </div>
                  </div>

                  <div className="text-left font-mono">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold ${
                        client.creditRating.startsWith('A')
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : client.creditRating === 'B'
                          ? 'bg-blue-950 text-blue-300 border border-blue-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      تصنيف: {client.creditRating}
                    </span>
                  </div>
                </div>

                {/* Financial Snapshot */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-xs">
                  <div>
                    <div className="text-[10px] text-slate-500 font-sans">
                      إجمالي المشتريات
                    </div>
                    <div className="text-sm font-bold text-slate-200 mt-0.5">
                      ${client.totalPurchasedUSD.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-sans">
                      المديونية المتبقية
                    </div>
                    <div
                      className={`text-sm font-bold mt-0.5 ${
                        client.outstandingBalanceUSD > 0
                          ? 'text-red-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      ${client.outstandingBalanceUSD.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Contact Information & Rep */}
                <div className="space-y-1 text-xs text-slate-300 border-t border-slate-800/70 pt-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">مسؤول الاتصال:</span>
                    <span className="font-medium text-slate-200">
                      {client.contactPerson}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-blue-400" />
                      الهاتف:
                    </span>
                    <a
                      href={`tel:${client.phone}`}
                      className="font-mono text-blue-400 hover:underline"
                    >
                      {client.phone}
                    </a>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">المندوب بالإدارة:</span>
                    <span className="font-semibold text-emerald-400">
                      {client.assignedRepName}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredClients.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};
