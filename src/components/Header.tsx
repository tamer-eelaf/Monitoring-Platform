import React from 'react';
import {
  Search,
  DollarSign,
  UserCheck,
  RefreshCw,
  Compass,
  CheckCircle2,
  Briefcase
} from 'lucide-react';
import { UserProfile } from '../types';
import { CURRENT_EXCHANGE_RATE } from '../data/mockData';

interface HeaderProps {
  currentTab: string;
  tabTitle: string;
  tabDescription: string;
  currentUser: UserProfile;
  onChangeUser: (user: UserProfile) => void;
  onOpenDiscovery: () => void;
  onOpenCeoPresentation?: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  showVatIncluded: boolean;
  onToggleVat: () => void;
  isLiveSyncing: boolean;
  isLiveMode: boolean;
  onTriggerLiveSync: () => void;
  onToggleDataSource: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  tabTitle,
  tabDescription,
  currentUser,
  onOpenDiscovery,
  onOpenCeoPresentation,
  searchQuery,
  onSearchChange,
  showVatIncluded,
  onToggleVat,
  isLiveSyncing,
  onTriggerLiveSync,
}) => {
  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
      {/* Zone 1 (Right in RTL): Title & Quiet Connection Status */}
      <div className="flex items-center gap-3 min-w-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">إدارة PHY BU</span>
            <span className="text-slate-600">/</span>
            <h1 className="text-sm font-bold text-slate-100 whitespace-nowrap">{tabTitle}</h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Odoo متصل
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden xl:block truncate">
            {tabDescription}
          </p>
        </div>
      </div>

      {/* Zone 2 (Middle in RTL): Search Input */}
      <div className="hidden md:flex items-center justify-center flex-1 max-w-sm px-4">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="بحث برقم الأمر، الفاتورة، العميل..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 pr-8 pl-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Zone 3 (Left in RTL): Currency, Live Refresh & User */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Currency & Tax Pill */}
        <div className="hidden sm:flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-2 py-1 rounded-md text-[11px] font-mono">
          <span className="text-emerald-400 font-semibold">$ USD</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400">{CURRENT_EXCHANGE_RATE} ج.م</span>
          <span className="text-slate-600">·</span>
          <button
            onClick={onToggleVat}
            title="تبديل عرض المبالغ شاملة 14% أو صافية"
            className="text-[10px] text-blue-400 hover:text-blue-300 font-sans cursor-pointer underline"
          >
            {showVatIncluded ? 'شامل 14%' : 'صافي'}
          </button>
        </div>

        {/* Executive CEO Presentation Button */}
        {onOpenCeoPresentation && (
          <button
            onClick={onOpenCeoPresentation}
            title="فتح شاشة العرض التنفيذي للرئيس التنفيذي"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md ${
              currentTab === 'ceo_presentation'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-black'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>عرض الـ CEO</span>
          </button>
        )}

        {/* Live Refresh Button */}
        <button
          onClick={onTriggerLiveSync}
          disabled={isLiveSyncing}
          title="تحديث فوري من قاعدة Odoo"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLiveSyncing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">
            {isLiveSyncing ? 'جارٍ التحديث...' : 'تحديث'}
          </span>
        </button>

        {/* Discovery Tool Button */}
        <button
          onClick={onOpenDiscovery}
          title="أداة فحص Odoo والمرحلة 0"
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition-colors flex items-center gap-1"
        >
          <Compass className="w-4 h-4 text-emerald-400" />
          <span className="hidden md:inline">المرحلة 0</span>
        </button>

        {/* User Pill */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg">
          <div className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-[10px]">
            TE
          </div>
          <span className="text-xs font-semibold text-slate-200 hidden sm:inline">
            {currentUser.name}
          </span>
        </div>
      </div>
    </header>
  );
};
