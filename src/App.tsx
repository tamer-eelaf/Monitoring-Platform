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
import { DiscoveryView } from './components/views/DiscoveryView';
import { CeoPresentationView } from './components/views/CeoPresentationView';

import { InvoiceDetailModal } from './components/modals/InvoiceDetailModal';
import { PromiseDateModal } from './components/modals/PromiseDateModal';
import { ExportReportModal } from './components/modals/ExportReportModal';
import { SupabaseConnectionModal } from './components/modals/SupabaseConnectionModal';

import { StorageService } from './services/storageService';
import { OdooApiService } from './services/odooApi';
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

  // Live Data Stores (Pure Live Data Only)
  const [invoices, setInvoices] = useState<CustomerInvoice[]>([]);
  const [supplierBills, setSupplierBills] = useState<SupplierBill[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [stockMoves, setStockMoves] = useState<StockMove[]>([]);
  const [clients, setClients] = useState<EgyptClient[]>([]);
  const [staffPerformance, setStaffPerformance] = useState<BUStaffPerformance[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);

  // Loading & Live State
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true);
  const [isLiveSyncing, setIsLiveSyncing] = useState<boolean>(false);
  const [syncTimestamp, setSyncTimestamp] = useState<string>('');
  const [liveInfo, setLiveInfo] = useState<{
    user: string;
    uid: number;
    company: string;
    serverVersion: string;
    ordersCount: number;
    invoicesCount: number;
    billsCount: number;
    stockCount: number;
  } | null>(null);

  // Display Settings
  const [showVatIncluded, setShowVatIncluded] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals State
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] =
    useState<CustomerInvoice | null>(null);
  const [selectedInvoicePromise, setSelectedInvoicePromise] =
    useState<CustomerInvoice | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);

  // Fetch Live Odoo Data Function
  const loadLiveOdooData = async () => {
    setIsLiveSyncing(true);
    try {
      const liveData = await OdooApiService.fetchLiveData();
      if (liveData && liveData.success) {
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
          user: 'Tamer Elshafey',
          uid: 595,
          company: 'EELAF for Engineering and Information Technology S.A.E. (مصر)',
          serverVersion: '19.0+e',
          ordersCount: liveData.salesOrders.length,
          invoicesCount: liveData.invoices.length,
          billsCount: liveData.supplierBills.length,
          stockCount: liveData.stockItems.length,
        });
      }
    } catch (err) {
      console.error('Failed to load live data:', err);
    } finally {
      setIsLiveSyncing(false);
      setIsLoadingInitial(false);
    }
  };

  // On Mount: Connect directly and load live Odoo data
  useEffect(() => {
    loadLiveOdooData();
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
    discovery: {
      title: 'استكشاف Odoo وفحص جودة البيانات (المرحلة 0)',
      desc: 'فحص مسمى حقل البراند، قياس نسبة التمييز، واعتماد معيار الانتقال للمرحلة 1',
    },
  };

  // Action: Save Promise Date to Local State
  const handleSavePromise = (
    invoiceId: string,
    promiseDate: string,
    status: PromiseStatus,
    notes: string,
    assignedRep: string
  ) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId) {
          return {
            ...inv,
            promiseDate,
            promiseStatus: status,
            followupNotes: notes,
            assignedFollowupUser: assignedRep,
            lastContactDate: new Date().toISOString().split('T')[0],
          };
        }
        return inv;
      })
    );
  };

  // Action: Update Supplier Schedule
  const handleUpdateSupplierSchedule = (
    billId: string,
    plannedDate: string,
    notes: string
  ) => {
    setSupplierBills((prev) =>
      prev.map((b) => {
        if (b.id === billId) {
          return {
            ...b,
            plannedPaymentDate: plannedDate,
            paymentNotes: notes,
          };
        }
        return b;
      })
    );
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
          onOpenDiscovery={() => setCurrentTab('discovery')}
          onOpenCeoPresentation={() => setCurrentTab('ceo_presentation')}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showVatIncluded={showVatIncluded}
          onToggleVat={() => setShowVatIncluded(!showVatIncluded)}
          isLiveSyncing={isLiveSyncing}
          isLiveMode={true}
          onTriggerLiveSync={loadLiveOdooData}
          onToggleDataSource={loadLiveOdooData}
        />

        {/* Live Odoo Production Banner */}
        <div className="bg-emerald-950/70 border-b border-emerald-800/80 px-6 py-2 flex items-center justify-between text-xs text-emerald-200 shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>البيانات الحية المباشرة من Odoo مفعلة حصراً:</strong> قاعدة <code className="font-mono bg-emerald-900 px-1.5 py-0.5 rounded text-white font-semibold">eelaf-master-21952014</code> · المستخدم: <strong className="text-white">Tamer Elshafey (UID: 595)</strong> · شركة إيلاف مصر (ID: 1) · فريق <strong className="text-white">Physical Security BU</strong>
            </span>
          </div>
          <div className="hidden lg:flex items-center gap-4 font-mono text-[11px] text-emerald-300">
            {liveInfo && (
              <>
                <span>{liveInfo.ordersCount} أمر بيع</span>
                <span>·</span>
                <span>{liveInfo.invoicesCount} فاتورة</span>
                <span>·</span>
                <span>{liveInfo.stockCount} صنف مخزن</span>
                <span>·</span>
                <span>آخر تحديث: {syncTimestamp}</span>
              </>
            )}
            <button
              onClick={loadLiveOdooData}
              disabled={isLiveSyncing}
              className="px-2.5 py-1 rounded bg-emerald-800 hover:bg-emerald-700 text-white font-sans text-xs flex items-center gap-1 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLiveSyncing ? 'animate-spin' : ''}`} />
              <span>تحديث حي</span>
            </button>
          </div>
        </div>

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

                {currentTab === 'discovery' && (
                  <DiscoveryView
                    onOpenReportModal={() => setIsReportModalOpen(true)}
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

      {/* Official Phase 0 Audit Dossier Modal */}
      {isReportModalOpen && (
        <ExportReportModal
          report={OdooApiService.generatePhase0Dossier(
            StorageService.getOdooConfig()
          )}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}

      {/* Supabase Connection & Cloud Schema Modal */}
      <SupabaseConnectionModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />
    </div>
  );
}
