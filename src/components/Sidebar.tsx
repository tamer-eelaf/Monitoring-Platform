import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  Building2,
  PackageSearch,
  Warehouse,
  Users,
  TrendingUp,
  BellRing,
  Briefcase,
  Settings,
  ShieldCheck
} from 'lucide-react';
import { UserProfile } from '../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: UserProfile;
  alertsCount: number;
  isOdooConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  alertsCount,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      labelArabic: 'اللوحة اليومية',
      labelEnglish: 'Command Center',
      icon: LayoutDashboard,
    },
    {
      id: 'ceo_presentation',
      labelArabic: 'عرض الـ CEO التنفيذي',
      labelEnglish: 'Executive Dossier',
      icon: Briefcase,
      highlight: true,
    },
    {
      id: 'collections',
      labelArabic: 'التحصيلات ووعود السداد',
      labelEnglish: 'AR & Promises',
      icon: ReceiptText,
    },
    {
      id: 'suppliers',
      labelArabic: 'مدفوعات الموردين',
      labelEnglish: 'Supplier Payables',
      icon: Building2,
    },
    {
      id: 'orders',
      labelArabic: 'أوامر البيع والمشاريع',
      labelEnglish: 'Sales Orders',
      icon: PackageSearch,
    },
    {
      id: 'inventory',
      labelArabic: 'المخزون والأعمار',
      labelEnglish: 'Inventory & Aging',
      icon: Warehouse,
    },
    {
      id: 'clients',
      labelArabic: 'عملاء مصر',
      labelEnglish: 'Client Accounts',
      icon: Users,
    },
    {
      id: 'team',
      labelArabic: 'أداء الفريق',
      labelEnglish: 'Sales Leaderboard',
      icon: TrendingUp,
    },
    {
      id: 'alerts',
      labelArabic: 'التنبيهات والمتابعة',
      labelEnglish: 'Action Queue',
      icon: BellRing,
      count: alertsCount,
    },
    {
      id: 'settings',
      labelArabic: 'الإعدادات والربط السحابي',
      labelEnglish: 'Settings & Integrations',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-l border-slate-800 flex flex-col h-screen shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-xs tracking-wider shadow-sm">
            PHY
          </div>
          <div>
            <h1 className="font-bold text-slate-100 text-sm leading-tight">
              Physical Security BU
            </h1>
            <p className="text-[11px] text-slate-400">شركة إيلاف — مصر</p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-2.5 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-right ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30'
                  : item.highlight
                  ? 'text-amber-300 hover:bg-slate-800/60 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive
                      ? 'text-blue-400'
                      : item.highlight
                      ? 'text-amber-400'
                      : 'text-slate-400'
                  }`}
                />
                <div className="text-right">
                  <div className="leading-snug">{item.labelArabic}</div>
                  <div className="text-[9px] text-slate-500 font-normal">
                    {item.labelEnglish}
                  </div>
                </div>
              </div>

              {item.count !== undefined && item.count > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full bg-red-950 text-red-400 border border-red-800">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info: Clean & Minimal */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>إدارة القطاع · مصر</span>
        </div>
        <span className="font-mono text-[10px] text-slate-500">v2.1</span>
      </div>
    </aside>
  );
};
