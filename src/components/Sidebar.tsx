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
  Compass,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Briefcase
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
  currentUser,
  alertsCount,
  isOdooConnected,
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
      labelEnglish: 'CEO Board Briefing',
      icon: Briefcase,
      highlight: true,
      badge: 'عرض الإدارة',
    },
    {
      id: 'collections',
      labelArabic: 'التحصيلات',
      labelEnglish: 'AR & Promise Dates',
      icon: ReceiptText,
      badge: 'فواتير مصر',
    },
    {
      id: 'suppliers',
      labelArabic: 'مدفوعات الموردين',
      labelEnglish: 'Supplier Payables',
      icon: Building2,
      badge: '3 فواتير',
    },
    {
      id: 'orders',
      labelArabic: 'أوامر الإدارة',
      labelEnglish: 'Sales & Purchases',
      icon: PackageSearch,
    },
    {
      id: 'inventory',
      labelArabic: 'المخزون والأعمار',
      labelEnglish: 'Stock Aging & Moves',
      icon: Warehouse,
      alertDot: true,
    },
    {
      id: 'clients',
      labelArabic: 'عملاء مصر',
      labelEnglish: 'Egypt BU Accounts',
      icon: Users,
    },
    {
      id: 'team',
      labelArabic: 'لوحة الفريق',
      labelEnglish: 'Sales & Cross-BU',
      icon: TrendingUp,
    },
    {
      id: 'alerts',
      labelArabic: 'التنبيهات والمتابعة',
      labelEnglish: 'Action Queue',
      icon: BellRing,
      count: alertsCount,
      countUrgent: true,
    },
    {
      id: 'discovery',
      labelArabic: 'استكشاف Odoo (المرحلة 0)',
      labelEnglish: 'Field & API Inspector',
      icon: Compass,
      highlight: true,
      badge: 'المرحلة 0',
    },
  ];

  return (
    <aside className="w-72 bg-slate-900 border-l border-slate-800 flex flex-col h-screen shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold text-white tracking-wider text-sm shadow-sm">
              PHY
            </div>
            <div>
              <h1 className="font-bold text-slate-100 text-base leading-tight">
                إدارة PHY BU
              </h1>
              <p className="text-xs text-slate-400">شركة إيلاف — مصر</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60">
            v1.0
          </span>
        </div>

        {/* Brands Tagline */}
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300 pt-2 border-t border-slate-800/60">
          <span className="text-red-400 font-semibold">Hikvision</span>
          <span className="text-slate-600">·</span>
          <span className="text-amber-400 font-semibold">Velasea</span>
          <span className="text-slate-600">·</span>
          <span className="text-cyan-400 font-semibold">AMG</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-right ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              } ${item.highlight ? 'bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-800/30' : ''}`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive
                      ? 'text-blue-400'
                      : item.highlight
                      ? 'text-emerald-400'
                      : 'text-slate-400'
                  }`}
                />
                <div className="text-right">
                  <div className="leading-snug">{item.labelArabic}</div>
                  <div className="text-[10px] text-slate-500 font-normal">
                    {item.labelEnglish}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {item.count !== undefined && item.count > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-red-950 text-red-400 border border-red-800">
                    {item.count}
                  </span>
                )}
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      item.highlight
                        ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer Info: Odoo Read-only & User Status */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-950/60 space-y-3">
        {/* Odoo Connection Pill */}
        <div className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2">
            {isOdooConnected ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="text-slate-300 text-[11px]">
              {isOdooConnected ? 'Odoo متصل (قراءة فقط)' : 'وضع الاستكشاف (محاكاة)'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">مصر</span>
        </div>

        {/* Current Active User Profile */}
        <div className="flex items-center gap-2.5 px-2 py-1">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-blue-300">
            {currentUser.name.slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-200 truncate">
              {currentUser.name}
            </div>
            <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400 inline shrink-0" />
              <span>{currentUser.role === 'director' ? 'مدير الإدارة (كامل الصلاحيات)' : 'مندوب مبيعات الإدارة'}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
