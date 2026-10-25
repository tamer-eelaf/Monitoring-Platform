/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/views/DashboardView';
import { CollectionsView } from './components/views/CollectionsView';
import { SuppliersView } from './components/views/SuppliersView';
import { OrdersView } from './components/views/OrdersView';
import { InventoryView } from './components/views/InventoryView';
import { ClientsView } from './components/views/ClientsView';
import { TeamView } from './components/views/TeamView';
import { AlertsView } from './components/views/AlertsView';
import { SettingsView } from './components/views/SettingsView';
import { CeoPresentationView } from './components/views/CeoPresentationView';

import { InvoiceDetailModal } from './components/modals/InvoiceDetailModal';
import { PromiseDateModal } from './components/modals/PromiseDateModal';

import { StorageService } from './services/storageService';
import { OdooApiService } from './services/odooApi';
import odooExtractedData from './data/odooExtractedData.json';
import {
  CustomerInvoice,
  SupplierBill,
  SalesOrder,
  StockItem,
  StockMove,
  SystemAlert,
  UserProfile,
  PromiseStatus,
  EgyptClient,
  BUStaffPerformance
} from './types';
import { CheckCircle2, RefreshCw, Loader2, Database, ShieldCheck } from 'lucide-react';

const LIVE_USER_PROFILE: UserProfile = {
  id: 'user_595',
  name: 'Tamer Elshafey',
  email: 'tamer.elshafey@eelaf.com',
  role: 'director',
  department: 'Physical Security BU (Team 35)',
  isBUMember: true,
};

export default function App() {
  // Navigation & User Context
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [currentUser, setCurrentUser] = useState<UserProfile>(LIVE_USER_PROFILE);

  // Data Stores (Preloaded with 100% genuine extracted Odoo dataset: 613 orders, 390 products, 123 invoices, 216 clients, 30 reps)
  const [invoices, setInvoices] = useState<CustomerInvoice[]>(() => StorageService.getInvoices());
  const [supplierBills, setSupplierBills] = useState<SupplierBill[]>(() => StorageService.getSupplierBills());
  const [orders, setOrders] = useState<SalesOrder[]>(() => StorageService.getSalesOrders());
  const [stockItems, setStockItems] = useState<StockItem[]>(() => StorageService.getStockItems());
  const [stockMoves, setStockMoves] = useState<StockMove[]>([]);
  const [clients, setClients] = useState<EgyptClient[]>(() => StorageService.getClients());
  const [staffPerformance, setStaffPerformance] = useState<BUStaffPerformance[]>(() => StorageService.getStaffPerformance());
  const [alerts, setAlerts] = useState<SystemAlert[]>(() => StorageService.getAlerts());

  // Loading & Live State
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(false);
  const [isLiveSyncing, setIsLiveSyncing] = useState<boolean>(false);
  const [syncTimestamp, setSyncTimestamp] = useState<string>(() => new Date().toLocaleTimeString('ar-EG'));
  const [liveInfo, setLiveInfo] = useState<{
    ordersCount: number;
    invoicesCount: number;
    billsCount: number;
    stockCount: number;
  }>({
    ordersCount: StorageService.getSalesOrders().length,
    invoicesCount: StorageService.getInvoices().length,
    billsCount: StorageService.getSupplierBills().length,
    stockCount: StorageService.getStockItems().length,
  });

  // Display Settings
  const [showVatIncluded, setShowVatIncluded] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals State
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] =
    useState<CustomerInvoice | null>(null);
  const [selectedInvoicePromise, setSelectedInvoicePromise] =
    useState<CustomerInvoice | null>(null);

  // Fetch Live Odoo Data Function
  const loadLiveOdooData = async () => {
    setIsLiveSyncing(true);
    try {
      const liveData = await OdooApiService.fetchLiveData();
      if (liveData && liveData.success && liveData.salesOrders?.length > 0) {
        setInvoices(liveData.invoices);
        setOrders(liveData.salesOrders);
        setSupplierBills(liveData.supplierBills);
        setStockItems(liveData.stockItems);
        setStockMoves(liveData.stockMoves);
        setClients(liveData.clients);
        setStaffPerformance(liveData.staffPerformance);
        setAlerts(liveData.alerts);

        setSyncTimestamp(new Date().toLocaleTimeString('ar-EG'));
        setLiveInfo({
          ordersCount: liveData.salesOrders.length,
          invoicesCount: liveData.invoices.length,
          billsCount: liveData.supplierBills.length,
          stockCount: liveData.stockItems.length,
        });
      }
    } catch (err) {
      console.warn('Live sync fallback to extracted dataset:', err);
    } finally {
      setIsLiveSyncing(false);
      setIsLoadingInitial(false);
    }
  };

  // Pull existing saved promises & schedules from Supabase Cloud on mount
  const loadSupabaseCloudData = async () => {
    try {
      const { fetchAllPromisesFromSupabase, fetchAllSupplierSchedulesFromSupabase } = await import(
        './services/supabaseClient'
      );
      const [cloudPromises, cloudSchedules] = await Promise.all([
        fetchAllPromisesFromSupabase(),
        fetchAllSupplierSchedulesFromSupabase(),
      ]);

      if (cloudPromises && Object.keys(cloudPromises).length > 0) {
        setInvoices((prev) =>
          prev.map((inv) => {
            const p = cloudPromises[inv.id] || cloudPromises[inv.odooName];
            if (p) {
              return {
                ...inv,
                promiseDate: p.promise_date || inv.promiseDate,
                promiseStatus: (p.promise_status as any) || inv.promiseStatus,
                followupNotes: p.notes || inv.followupNotes,
                assignedFollowupUser: p.assigned_rep || inv.assignedFollowupUser,
              };
            }
            return inv;
          })
        );
      }

      if (cloudSchedules && Object.keys(cloudSchedules).length > 0) {
        setSupplierBills((prev) =>
          prev.map((b) => {
            const s = cloudSchedules[b.id] || cloudSchedules[b.odooName];
            if (s) {
              return {
                ...b,
                plannedPaymentDate: s.planned_date || b.plannedPaymentDate,
                paymentNotes: s.notes || b.paymentNotes,
              };
            }
            return b;
          })
        );
      }
    } catch (err) {
      console.warn('[Supabase Cloud Load Error]', err);
    }
  };

  // On Mount: Connect directly and load live Odoo data and Supabase cloud data
  useEffect(() => {
    loadLiveOdooData();
    loadSupabaseCloudData();
  }, []);

  // Tab metadata titles
  const tabMetadata: Record<string, { title: string; desc: string }> = {
    dashboard: {
      title: 'لوحة القيادة اليومية التنفيذية (بيانات حية)',
      desc: 'مؤشرات التحصيل والاستحقاق والأوامر والمخزون الحي لتوكيلات Hikvision / Velasea / AMG في مصر',
    },
    ceo_presentation: {
      title: 'تقرير العرض التنفيذي للإدارة العليا (CEO Board Briefing)',
      desc: 'تحليل شامل للإدارة: المبيعات المعتمدة، خط الأنابيب، الأصول المخزنية، وأولوية تحرير $1.32M رأس مال عامل',
    },
    collections: {
      title: 'التحصيلات وإدارة الديون (AR) — فواتير Odoo الحية',
      desc: 'متابعة الفواتير المفتوحة، أعمار الديون، وتواريخ وعود السداد المحفوظة بالمنصة',
    },
    suppliers: {
      title: 'مدفوعات الموردين وتواريخ الاستحقاق (AP)',
      desc: 'فواتير الموردين المعتمدة وجدولة السيولة المطلوبة لتحويلات الدولار',
    },
    orders: {
      title: 'أوامر بيع Physical Security BU (Odoo Team 35)',
      desc: 'تتبع أوامر البيع الحية المسجلة لإدارتك في شركة مصر',
    },
    inventory: {
      title: 'أرصدة المخزون الحي وأعمار الأصناف',
      desc: 'الأرصدة الفعلية في مستودعات مصر وسجل حركات الدخول والخروج',
    },
    clients: {
      title: 'قاعدة عملاء مصر المسجلين في Odoo',
      desc: 'بيانات الشركات المصرية وتاريخ مشترياتهم ومديونياتهم الحالية',
    },
    team: {
      title: 'أداء فريق Physical Security BU (Odoo)',
      desc: 'أعضاء الفريق المعتمدون في Odoo ومبيعات التوكيلات المشتركة',
    },
    alerts: {
      title: 'التنبيهات والتدخل السريع على البيانات الحية',
      desc: 'رصد تلقائي لأعمار الديون والفواتير المتأخرة وعتبات التحذير',
    },
    settings: {
      title: 'إعدادات النظام والربط السحابي',
      desc: 'إدارة اتصال ومزامنة سوبابيز، خادم Odoo، عتبات التنبيهات، والذاكرة المؤقتة',
    },
  };

  // Action: Save Promise Date to StorageService (Persists to localStorage & Supabase)
  const handleSavePromise = (
    invoiceId: string,
    promiseDate: string,
    status: PromiseStatus,
    notes: string,
    assignedRep: string
  ) => {
    const updated = StorageService.updateInvoicePromise(
      invoiceId,
      promiseDate,
      status,
      notes,
      assignedRep
    );
    setInvoices(updated);
  };

  // Action: Update Supplier Schedule (Persists to localStorage & Supabase)
  const handleUpdateSupplierSchedule = (
    billId: string,
    plannedDate: string,
    notes: string
  ) => {
    const updated = StorageService.updateSupplierPaymentSchedule(
      billId,
      plannedDate,
      notes
    );
    setSupplierBills(updated);
  };

  const handleOpenAlertRecord = (alert: SystemAlert) => {
    setCurrentTab(alert.linkTab);
    if (alert.linkTab === 'collections' && alert.recordId) {
      const target = invoices.find((i) => i.id === alert.recordId);
      if (target) setSelectedInvoiceDetail(target);
    }
  };

  const currentMeta = tabMetadata[currentTab] || tabMetadata.dashboard;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 antialiased font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currentUser={currentUser}
        alertsCount={alerts.length}
        isOdooConnected={true}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          tabTitle={currentMeta.title}
          tabDescription={currentMeta.desc}
          currentUser={currentUser}
          onChangeUser={setCurrentUser}
          onOpenSettings={() => setCurrentTab('settings')}
          onOpenCeoPresentation={() => setCurrentTab('ceo_presentation')}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showVatIncluded={showVatIncluded}
          onToggleVat={() => setShowVatIncluded(!showVatIncluded)}
          isLiveSyncing={isLiveSyncing}
          onTriggerLiveSync={loadLiveOdooData}
        />

        {/* Viewport Scroll Container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {isLoadingInitial ? (
              <div className="py-24 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                <div className="text-sm font-semibold text-slate-200">
                  جارٍ جلب البيانات الحية من خادم Odoo (eelaf-master-21952014)...
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  Connecting to https://www.eelaf.com/jsonrpc as Tamer Elshafey
                </div>
              </div>
            ) : (
              <>
                {currentTab === 'dashboard' && (
                  <DashboardView
                    invoices={invoices}
                    supplierBills={supplierBills}
                    orders={orders}
                    stockItems={stockItems}
                    alerts={alerts}
                    currentUser={currentUser}
                    showVatIncluded={showVatIncluded}
                    onNavigateTab={setCurrentTab}
                    onSelectInvoice={setSelectedInvoiceDetail}
                    onEditPromise={setSelectedInvoicePromise}
                  />
                )}

                {currentTab === 'ceo_presentation' && (
                  <CeoPresentationView
                    salesOrders={orders}
                    stockItems={stockItems}
                    onNavigateTab={setCurrentTab}
                  />
                )}

                {currentTab === 'collections' && (
                  <CollectionsView
                    invoices={invoices}
                    showVatIncluded={showVatIncluded}
                    onSelectInvoice={setSelectedInvoiceDetail}
                    onEditPromise={setSelectedInvoicePromise}
                  />
                )}

                {currentTab === 'suppliers' && (
                  <SuppliersView
                    supplierBills={supplierBills}
                    onUpdatePaymentSchedule={handleUpdateSupplierSchedule}
                  />
                )}

                {currentTab === 'orders' && (
                  <OrdersView
                    orders={orders}
                    showVatIncluded={showVatIncluded}
                  />
                )}

                {currentTab === 'inventory' && (
                  <InventoryView
                    stockItems={stockItems}
                    stockMoves={stockMoves}
                  />
                )}

                {currentTab === 'clients' && (
                  <ClientsView
                    clients={clients}
                  />
                )}

                {currentTab === 'team' && (
                  <TeamView
                    staffPerformance={staffPerformance}
                  />
                )}

                {currentTab === 'alerts' && (
                  <AlertsView
                    alerts={alerts}
                    onNavigateTab={setCurrentTab}
                    onOpenRecord={handleOpenAlertRecord}
                  />
                )}

                {currentTab === 'settings' && (
                  <SettingsView
                    invoices={invoices}
                    supplierBills={supplierBills}
                    orders={orders}
                    stockItems={stockItems}
                    clients={clients}
                    staffPerformance={staffPerformance}
                    onRefreshData={loadLiveOdooData}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Invoice Detail Modal */}
      <InvoiceDetailModal
        invoice={selectedInvoiceDetail}
        onClose={() => setSelectedInvoiceDetail(null)}
        onEditPromise={(inv) => {
          setSelectedInvoiceDetail(null);
          setSelectedInvoicePromise(inv);
        }}
      />

      {/* Promise Date & Followup Modal */}
      <PromiseDateModal
        invoice={selectedInvoicePromise}
        onClose={() => setSelectedInvoicePromise(null)}
        onSave={handleSavePromise}
      />
    </div>
  );
}
