import React, { useState } from 'react';
import {
  Warehouse,
  History,
  AlertTriangle,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Search,
  Package,
  Layers
} from 'lucide-react';
import { StockItem, StockMove } from '../../types';
import { Pagination } from '../common/Pagination';
import { DataGapNotice } from '../common/DataNotice';

interface InventoryViewProps {
  stockItems: StockItem[];
  stockMoves?: StockMove[];
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  stockItems,
  stockMoves = [],
}) => {
  const [activeTab, setActiveTab] = useState<'items' | 'moves'>('items');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [onlyStagnant, setOnlyStagnant] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  
  // Separate pagination for items and moves
  const [itemsPage, setItemsPage] = useState<number>(1);
  const [movesPage, setMovesPage] = useState<number>(1);
  const PAGE_SIZE = 8;

  const filteredItems = stockItems.filter((item) => {
    if (selectedBrand !== 'all' && item.brand !== selectedBrand) return false;
    if (onlyStagnant && !item.isStagnant) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const paginatedItems = filteredItems.slice(
    (itemsPage - 1) * PAGE_SIZE,
    itemsPage * PAGE_SIZE
  );

  const filteredMoves = stockMoves.filter((m) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        m.reference.toLowerCase().includes(q) ||
        m.productName.toLowerCase().includes(q) ||
        m.originDocument.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const paginatedMoves = filteredMoves.slice(
    (movesPage - 1) * PAGE_SIZE,
    movesPage * PAGE_SIZE
  );

  const agingKnown = stockItems.some((it) => it.agingDays !== null && it.agingDays !== undefined);
  const costMissingCount = stockItems.filter((it) => it.costMissing).length;
  const totalStockValueUSD = stockItems.reduce(
    (acc, it) => acc + it.totalValueUSD,
    0
  );
  const stagnantStockValueUSD = stockItems
    .filter((it) => it.isStagnant)
    .reduce((acc, it) => acc + it.totalValueUSD, 0);

  return (
    <div className="space-y-4">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-cyan-400" />
            المخزون وأعمار الأصناف في مصر (Stock Aging & FIFO)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            تتبع كميات Hikvision وVelasea وAMG وأعمارها في مستودعات مصر المقيدة في Odoo
          </p>
        </div>

        {/* Stock Value Stats */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300">
            <span className="text-slate-500 font-sans ml-1">إجمالي المخزون:</span>
            <span className="font-bold text-cyan-400">${totalStockValueUSD.toLocaleString()}</span>
          </div>
          <div className="bg-slate-900 border border-red-950 rounded-lg px-3 py-1.5 text-slate-300">
            <span className="text-slate-500 font-sans ml-1">الراكد (&gt;90 يوم):</span>
            {agingKnown ? (
              <span className="font-bold text-red-400">${stagnantStockValueUSD.toLocaleString()}</span>
            ) : (
              <span className="font-sans text-amber-400">غير متاح — يحتاج تصدير حركات المخزون</span>
            )}
          </div>
          <div className="bg-slate-900 border border-amber-950 rounded-lg px-3 py-1.5 text-slate-300">
            <span className="text-slate-500 font-sans ml-1">أصناف بلا تكلفة:</span>
            <span className="font-bold text-amber-400">{costMissingCount}</span>
          </div>
        </div>
      </div>

      {/* Sub Tabs & Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* View Tab Switcher */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setActiveTab('items')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-colors ${
                activeTab === 'items'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>الأرصدة ({stockItems.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('moves')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-colors ${
                activeTab === 'moves'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>سجل الحركات ({stockMoves.length})</span>
            </button>
          </div>

          {activeTab === 'items' && (
            <>
              {/* Brand Selector */}
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
                {['all', 'Hikvision', 'Velasea', 'AMG'].map((b) => (
                  <button
                    key={b}
                    onClick={() => {
                      setSelectedBrand(b);
                      setItemsPage(1);
                    }}
                    className={`px-2.5 py-1 rounded text-xs transition-colors ${
                      selectedBrand === b
                        ? 'bg-slate-800 text-white font-medium'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {b === 'all' ? 'الكل' : b}
                  </button>
                ))}
              </div>

              {/* Stagnant Toggle */}
              <button
                onClick={() => {
                  setOnlyStagnant(!onlyStagnant);
                  setItemsPage(1);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border transition-colors ${
                  onlyStagnant
                    ? 'bg-red-950 text-red-300 border-red-800 font-medium'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <AlertTriangle className="w-3 h-3 text-red-400" />
                <span>راكد فقط</span>
              </button>
            </>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-56">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setItemsPage(1);
              setMovesPage(1);
            }}
            placeholder={activeTab === 'items' ? 'بحث بالاسم، الكود، الموقع...' : 'بحث بالإذن أو الصنف...'}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 pr-8 pl-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Tab Content: Items Table */}
      {activeTab === 'items' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 text-[11px] border-b border-slate-800">
                  <th className="py-2.5 px-4 font-medium">البراند</th>
                  <th className="py-2.5 px-4 font-medium">الصنف والكود (SKU)</th>
                  <th className="py-2.5 px-4 font-medium">موقع المخزن</th>
                  <th className="py-2.5 px-4 font-medium text-center">المتوفر / المحجوز</th>
                  <th className="py-2.5 px-4 font-medium text-left">التكلفة الإجمالية ($)</th>
                  <th className="py-2.5 px-4 font-medium">عمر الصنف (FIFO)</th>
                  <th className="py-2.5 px-4 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                      لا توجد أصناف مخزون مطابقة.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        item.isStagnant ? 'bg-red-950/10' : ''
                      }`}
                    >
                      <td className="py-2.5 px-4 font-sans">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            item.brand === 'Hikvision'
                              ? 'bg-red-950 text-red-300 border border-red-800'
                              : item.brand === 'Velasea'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                          }`}
                        >
                          {item.brand}
                        </span>
                      </td>

                      <td className="py-2.5 px-4 font-sans">
                        <div className="font-semibold text-slate-200">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          SKU: {item.sku}
                        </div>
                      </td>

                      <td className="py-2.5 px-4 font-sans text-slate-300">
                        {item.location || '—'}
                      </td>

                      <td className="py-2.5 px-4 text-center">
                        <span className="font-bold text-slate-100 text-sm">
                          {item.qtyOnHand}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          (متاح: {item.qtyAvailable} · محجوز: {item.qtyReserved})
                        </span>
                      </td>

                      <td className="py-2.5 px-4 text-left">
                        <div className="font-bold text-cyan-400">
                          ${item.totalValueUSD.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {item.costMissing ? (
                            <span className="text-amber-400 font-sans">التكلفة غير مسجلة في Odoo</span>
                          ) : (
                            <>سعر: ${item.unitCostUSD.toLocaleString()}</>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-1 text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-blue-400" />
                          <span>{item.agingDays === null ? 'غير متاح' : `${item.agingDays} يوماً`}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {item.firstInDate || '—'}
                        </div>
                      </td>

                      <td className="py-2.5 px-4 font-sans">
                        {item.daysWithoutMovement === null ? (
                          <span className="text-[10px] text-slate-500">لا توجد بيانات حركة</span>
                        ) : item.isStagnant ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-950 text-red-300 border border-red-800 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" />
                            راكد ({item.daysWithoutMovement} يوم)
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-400 font-medium">
                            دوران طبيعي ({item.daysWithoutMovement} يوم)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={itemsPage}
            totalItems={filteredItems.length}
            pageSize={PAGE_SIZE}
            onPageChange={setItemsPage}
          />
        </div>
      ) : stockMoves.length === 0 ? (
        <DataGapNotice
          title="سجل حركات المخزون (Stock Moves Ledger)"
          why="حركات المخزون غير متوفرة في تصدير الأرصدة الحالي، ويتطلب حساب أعمار الأصناف بدقة FIFO تصدير حركات المخازن من Odoo."
          needs={[
            'تصدير حركات المخزون (stock.move): تاريخ الحركة، نوع الحركة (وارد/منصرف)',
            'الصنف والكمية المنقولة',
            'موقع المصدر وموقع الوجهة والمستند المرتبط (WH/IN, WH/OUT)'
          ]}
        />
      ) : (
        /* Tab Content: Stock Moves Ledger */
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs border-collapse font-mono">
              <thead>
                <tr className="bg-slate-950 text-slate-400 text-[11px] border-b border-slate-800">
                  <th className="py-2.5 px-4 font-medium">إذن الحركة (Reference)</th>
                  <th className="py-2.5 px-4 font-medium">التاريخ</th>
                  <th className="py-2.5 px-4 font-medium">نوع الحركة</th>
                  <th className="py-2.5 px-4 font-medium font-sans">الصنف</th>
                  <th className="py-2.5 px-4 font-medium text-center">الكمية</th>
                  <th className="py-2.5 px-4 font-medium font-sans">من موقع</th>
                  <th className="py-2.5 px-4 font-medium font-sans">إلى موقع</th>
                  <th className="py-2.5 px-4 font-medium">المستند المرتبط</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {paginatedMoves.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                      لا توجد حركات مخزون مسجلة.
                    </td>
                  </tr>
                ) : (
                  paginatedMoves.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-bold text-blue-400">
                        {m.reference}
                      </td>
                      <td className="py-2.5 px-4 text-slate-300">{m.date}</td>
                      <td className="py-2.5 px-4 font-sans">
                        {m.moveType === 'in' ? (
                          <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            وارد (دخول)
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-rose-400 font-semibold text-[11px]">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            منصرف (خروج)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-sans text-slate-200">
                        {m.productName}
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-slate-100">
                        {m.quantity}
                      </td>
                      <td className="py-2.5 px-4 font-sans text-slate-400 text-[11px]">
                        {m.sourceLocation}
                      </td>
                      <td className="py-2.5 px-4 font-sans text-slate-300 text-[11px]">
                        {m.destinationLocation}
                      </td>
                      <td className="py-2.5 px-4 text-slate-400 font-bold">
                        {m.originDocument}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={movesPage}
            totalItems={filteredMoves.length}
            pageSize={PAGE_SIZE}
            onPageChange={setMovesPage}
          />
        </div>
      )}
    </div>
  );
};
