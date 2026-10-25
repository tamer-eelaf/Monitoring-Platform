import React from 'react';
import {
  Search,
  RefreshCw,
  Briefcase,
  Settings
} from 'lucide-react';
import { UserProfile } from '../types';
import { CURRENT_EXCHANGE_RATE } from '../data/mockData';

interface HeaderProps {
  currentTab: string;
  tabTitle: string;
  tabDescription: string;
  currentUser: UserProfile;
  onChangeUser: (user: UserProfile) => void;
  onOpenSettings: () => void;
  onOpenCeoPresentation?: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  showVatIncluded: boolean;
  onToggleVat: () => void;
  isLiveSyncing: boolean;
  onTriggerLiveSync: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  tabTitle,
  tabDescription,
  onOpenSettings,
  onOpenCeoPresentation,
  searchQuery,
  onSearchChange,
  showVatIncluded,
  onToggleVat,
  isLiveSyncing,
  onTriggerLiveSync,
}) => {
  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
      {/* Title & Context */}
      <div className="flex items-center gap-3 min-w-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">PHY BU</span>
            <span className="text-slate-600 hidden sm:inline">/</span>
            <h1 className="text-sm font-bold text-slate-100 whitespace-nowrap">{tabTitle}</h1>
          </div>
          <p className="text-[11px] text-slate-400 hidden lg:block truncate max-w-xl">
            {tabDescription}
          </p>
        </div>
      </div>

      {/* Middle: Clean Search Bar */}
      <div className="hidden md:flex items-center justify-center flex-1 max-w-md px-6">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="بحث بالأمر، الفاتورة، أو اسم العميل..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 pr-8 pl-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Actions: Currency, CEO Mode, Live Update, Settings */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Currency & VAT Toggle */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-md text-[11px] font-mono">
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

        {/* CEO Briefing Button */}
        {onOpenCeoPresentation && currentTab !== 'ceo_presentation' && (
          <button
            onClick={onOpenCeoPresentation}
            title="فتح تقرير العرض التنفيذي للـ CEO"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-sm"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">عرض الـ CEO</span>
          </button>
        )}

        {/* Live Refresh */}
        <button
          onClick={onTriggerLiveSync}
          disabled={isLiveSyncing}
          title="تحديث البيانات"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLiveSyncing ? 'animate-spin text-blue-400' : ''}`} />
          <span className="hidden md:inline">
            {isLiveSyncing ? 'جارٍ التحديث...' : 'تحديث'}
          </span>
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          title="الإعدادات والربط السحابي"
          className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 border ${
            currentTab === 'settings'
              ? 'bg-blue-600 text-white border-blue-500'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">الإعدادات</span>
        </button>
      </div>
    </header>
  );
};
