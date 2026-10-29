import {
  CustomerInvoice,
  SupplierBill,
  SalesOrder,
  StockItem,
  SystemAlert,
  OdooConnectionConfig,
  UserProfile,
  Phase0AuditReport,
  EgyptClient,
  BUStaffPerformance,
  AnnualSalesTargets,
  TargetBasis
} from '../types';
import {
  pushInvoicePromiseToSupabase,
  pushSupplierScheduleToSupabase,
} from './supabaseClient';
import {
  INITIAL_INVOICES,
  INITIAL_SUPPLIER_BILLS,
  INITIAL_SALES_ORDERS,
  INITIAL_STOCK_ITEMS,
  INITIAL_CLIENTS,
  INITIAL_STAFF_PERFORMANCE,
  INITIAL_ALERTS,
  INITIAL_USER_PROFILES,
  INITIAL_PHASE0_REPORT,
  DATA_META,
} from '../data/mockData';

// V2 Storage Keys (migrated away from any v1 dummy data)
const KEYS = {
  INVOICES: 'phy_bu_invoices_v2',
  SUPPLIERS: 'phy_bu_suppliers_v2',
  ORDERS: 'phy_bu_orders_v3',
  STOCK: 'phy_bu_stock_v2',
  CLIENTS: 'phy_bu_clients_v4',
  STAFF: 'phy_bu_staff_v2',
  ALERTS: 'phy_bu_alerts_v2',
  ODOO_CONFIG: 'phy_bu_odoo_config_v2',
  CURRENT_USER_ID: 'phy_bu_current_user_v2',
  AUDIT_REPORT: 'phy_bu_audit_report_v2',
  THRESHOLDS: 'phy_bu_thresholds_v2',
};

// Purge any stale legacy v1 mock keys from localStorage on script load
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const legacyKeys = [
      'phy_bu_invoices_v1',
      'phy_bu_suppliers_v1',
      'phy_bu_orders_v1',
      'phy_bu_stock_v1',
      'phy_bu_alerts_v1',
      'phy_bu_current_user_v1',
    ];
    legacyKeys.forEach((k) => window.localStorage.removeItem(k));
  } catch (e) {
    // Ignore storage errors in private browsing
  }
}

// When the generated dataset changes, cached copies in the browser are dropped so stale (or previously
// invented) numbers can never survive in localStorage. Manually edited client contact fields are carried
// over only when the previous cache already belongs to this versioned mechanism.
const DATASET_VERSION_KEY = 'phy_bu_dataset_version';
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const version: string = (DATA_META && DATA_META.datasetVersion) || '';
    const stored = window.localStorage.getItem(DATASET_VERSION_KEY);
    if (version && stored !== version) {
      let oldClients: EgyptClient[] = [];
      if (stored) {
        try {
          oldClients = JSON.parse(window.localStorage.getItem(KEYS.CLIENTS) || '[]');
        } catch {
          oldClients = [];
        }
      }
      [KEYS.INVOICES, KEYS.SUPPLIERS, KEYS.ORDERS, KEYS.STOCK, KEYS.CLIENTS, KEYS.STAFF, KEYS.ALERTS, KEYS.AUDIT_REPORT].forEach(
        (k) => window.localStorage.removeItem(k)
      );
      if (oldClients.length > 0) {
        const byId = new Map(oldClients.map((c) => [c.id, c]));
        const merged = INITIAL_CLIENTS.map((c) => {
          const o = byId.get(c.id);
          return o
            ? {
                ...c,
                phone: o.phone || c.phone,
                email: o.email || c.email,
                contactPerson: o.contactPerson || c.contactPerson,
                city: o.city || c.city,
                industry: o.industry || c.industry,
                notes: o.notes || c.notes,
                nameAr: o.nameAr || c.nameAr,
              }
            : c;
        });
        window.localStorage.setItem(KEYS.CLIENTS, JSON.stringify(merged));
      }
      window.localStorage.setItem(DATASET_VERSION_KEY, version);
    }
  } catch {
    // storage unavailable — ignore
  }
}

export interface AlertThresholds {
  stagnantDays: number; // default 90
  uninvoicedDays: number; // default 3
  undeliveredDays: number; // default 5
  supplierDueAlertDays: number; // default 7
  overdueGraceDays: number; // default 0
}

export const DEFAULT_THRESHOLDS: AlertThresholds = {
  stagnantDays: 90,
  uninvoicedDays: 3,
  undeliveredDays: 5,
  supplierDueAlertDays: 7,
  overdueGraceDays: 0,
};

export const DEFAULT_ODOO_CONFIG: OdooConnectionConfig = {
  url: '',
  db: '',
  username: '',
  apiKey: '',
  isConnected: false,
  brandTagNames: ['Hikvision', 'Velasea', 'AMG'],
};

export const DEFAULT_ANNUAL_TARGETS: AnnualSalesTargets = {
  year: 2026,
  basis: 'gross_vat_included',
  totalBUTargetUSD: null,
  hikvisionTargetUSD: null,
  velaseaTargetUSD: null,
  amgTargetUSD: null,
  altriTargetUSD: null,
};

export class StorageService {
  static getInvoices(): CustomerInvoice[] {
    try {
      const data = localStorage.getItem(KEYS.INVOICES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_INVOICES;
    } catch {
      return INITIAL_INVOICES;
    }
  }

  static saveInvoices(invoices: CustomerInvoice[]): void {
    try {
      localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices));
    } catch (e) {
      console.warn('Storage quota exceeded for invoices', e);
    }
  }

  static updateInvoicePromise(
    invoiceId: string,
    promiseDate: string,
    status: CustomerInvoice['promiseStatus'],
    notes: string,
    assignedRep?: string
  ): CustomerInvoice[] {
    const list = this.getInvoices();
    const updated = list.map((inv) => {
      if (inv.id === invoiceId) {
        return {
          ...inv,
          promiseDate,
          promiseStatus: status,
          followupNotes: notes,
          assignedFollowupUser: assignedRep || inv.assignedFollowupUser,
          lastContactDate: new Date().toISOString().split('T')[0],
        };
      }
      return inv;
    });
    this.saveInvoices(updated);
    // Asynchronously synchronize with Supabase cloud warehouse
    pushInvoicePromiseToSupabase({
      invoiceId,
      promiseDate,
      promiseStatus: status || 'Pending',
      notes,
      assignedRep,
    }).catch((err) => console.warn('[Supabase Promise Sync Error]', err));
    return updated;
  }

  static getSupplierBills(): SupplierBill[] {
    try {
      const data = localStorage.getItem(KEYS.SUPPLIERS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_SUPPLIER_BILLS;
    } catch {
      return INITIAL_SUPPLIER_BILLS;
    }
  }

  static saveSupplierBills(bills: SupplierBill[]): void {
    try {
      localStorage.setItem(KEYS.SUPPLIERS, JSON.stringify(bills));
    } catch (e) {
      console.warn('Storage quota exceeded for supplier bills', e);
    }
  }

  static updateSupplierPaymentSchedule(
    billId: string,
    plannedDate: string,
    notes: string
  ): SupplierBill[] {
    const list = this.getSupplierBills();
    const updated = list.map((b) => {
      if (b.id === billId) {
        return {
          ...b,
          plannedPaymentDate: plannedDate,
          paymentNotes: notes,
        };
      }
      return b;
    });
    this.saveSupplierBills(updated);
    // Asynchronously synchronize with Supabase cloud warehouse
    pushSupplierScheduleToSupabase({
      billId,
      plannedDate,
      notes,
    }).catch((err) => console.warn('[Supabase Supplier Sync Error]', err));
    return updated;
  }

  static getSalesOrders(): SalesOrder[] {
    try {
      const data = localStorage.getItem(KEYS.ORDERS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_SALES_ORDERS;
    } catch {
      return INITIAL_SALES_ORDERS;
    }
  }

  static saveSalesOrders(orders: SalesOrder[]): void {
    try {
      localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
    } catch (e) {
      console.warn('Storage quota exceeded for orders', e);
    }
  }

  static getStockItems(): StockItem[] {
    try {
      const data = localStorage.getItem(KEYS.STOCK);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_STOCK_ITEMS;
    } catch {
      return INITIAL_STOCK_ITEMS;
    }
  }

  static saveStockItems(stock: StockItem[]): void {
    try {
      localStorage.setItem(KEYS.STOCK, JSON.stringify(stock));
    } catch (e) {
      console.warn('Storage quota exceeded for stock', e);
    }
  }

  static getClients(): EgyptClient[] {
    try {
      const data = localStorage.getItem(KEYS.CLIENTS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasPalmHills = parsed.some((c: EgyptClient) => (c.name || '').toLowerCase().includes('palm'));
          const hasRealPhones = parsed.some((c: EgyptClient) => c.phone && !c.phone.includes('000 0000'));
          if (hasPalmHills && hasRealPhones && parsed.length >= 220) {
            return parsed;
          }
        }
      }
      StorageService.saveClients(INITIAL_CLIENTS);
      return INITIAL_CLIENTS;
    } catch {
      return INITIAL_CLIENTS;
    }
  }

  static saveClients(clients: EgyptClient[]): void {
    try {
      localStorage.setItem(KEYS.CLIENTS, JSON.stringify(clients));
    } catch (e) {
      console.warn('Storage quota exceeded for clients', e);
    }
  }

  static getStaffPerformance(): BUStaffPerformance[] {
    try {
      const data = localStorage.getItem(KEYS.STAFF);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_STAFF_PERFORMANCE;
    } catch {
      return INITIAL_STAFF_PERFORMANCE;
    }
  }

  static saveStaffPerformance(staff: BUStaffPerformance[]): void {
    try {
      localStorage.setItem(KEYS.STAFF, JSON.stringify(staff));
    } catch (e) {
      console.warn('Storage quota exceeded for staff', e);
    }
  }

  static getAlerts(): SystemAlert[] {
    try {
      const data = localStorage.getItem(KEYS.ALERTS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_ALERTS;
    } catch {
      return INITIAL_ALERTS;
    }
  }

  static saveAlerts(alerts: SystemAlert[]): void {
    try {
      localStorage.setItem(KEYS.ALERTS, JSON.stringify(alerts));
    } catch (e) {
      console.warn('Storage quota exceeded for alerts', e);
    }
  }

  static getOdooConfig(): OdooConnectionConfig {
    try {
      const data = localStorage.getItem(KEYS.ODOO_CONFIG);
      return data ? JSON.parse(data) : DEFAULT_ODOO_CONFIG;
    } catch {
      return DEFAULT_ODOO_CONFIG;
    }
  }

  static saveOdooConfig(config: OdooConnectionConfig): void {
    localStorage.setItem(KEYS.ODOO_CONFIG, JSON.stringify(config));
  }

  static getCurrentUser(): UserProfile {
    try {
      const id = localStorage.getItem(KEYS.CURRENT_USER_ID) || 'user_595';
      return (
        INITIAL_USER_PROFILES.find((u) => u.id === id) ||
        INITIAL_USER_PROFILES[0]
      );
    } catch {
      return INITIAL_USER_PROFILES[0];
    }
  }

  static setCurrentUser(id: string): void {
    localStorage.setItem(KEYS.CURRENT_USER_ID, id);
  }

  static getAuditReport(): Phase0AuditReport {
    try {
      const data = localStorage.getItem(KEYS.AUDIT_REPORT);
      return data ? JSON.parse(data) : INITIAL_PHASE0_REPORT;
    } catch {
      return INITIAL_PHASE0_REPORT;
    }
  }

  static saveAuditReport(report: Phase0AuditReport): void {
    localStorage.setItem(KEYS.AUDIT_REPORT, JSON.stringify(report));
  }

  static getThresholds(): AlertThresholds {
    try {
      const data = localStorage.getItem(KEYS.THRESHOLDS);
      return data ? JSON.parse(data) : DEFAULT_THRESHOLDS;
    } catch {
      return DEFAULT_THRESHOLDS;
    }
  }

  static saveThresholds(thresholds: AlertThresholds): void {
    localStorage.setItem(KEYS.THRESHOLDS, JSON.stringify(thresholds));
  }

  static getAnnualTargets(year: number = 2026): AnnualSalesTargets {
    try {
      const key = `phy_bu_annual_targets_${year}_v1`;
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          year,
          basis: parsed.basis === 'net_untaxed' ? 'net_untaxed' : 'gross_vat_included',
          totalBUTargetUSD: typeof parsed.totalBUTargetUSD === 'number' && !isNaN(parsed.totalBUTargetUSD) ? parsed.totalBUTargetUSD : null,
          hikvisionTargetUSD: typeof parsed.hikvisionTargetUSD === 'number' && !isNaN(parsed.hikvisionTargetUSD) ? parsed.hikvisionTargetUSD : null,
          velaseaTargetUSD: typeof parsed.velaseaTargetUSD === 'number' && !isNaN(parsed.velaseaTargetUSD) ? parsed.velaseaTargetUSD : null,
          amgTargetUSD: typeof parsed.amgTargetUSD === 'number' && !isNaN(parsed.amgTargetUSD) ? parsed.amgTargetUSD : null,
          altriTargetUSD: typeof parsed.altriTargetUSD === 'number' && !isNaN(parsed.altriTargetUSD) ? parsed.altriTargetUSD : null,
        };
      }
      return { ...DEFAULT_ANNUAL_TARGETS, year };
    } catch {
      return { ...DEFAULT_ANNUAL_TARGETS, year };
    }
  }

  static saveAnnualTargets(targets: AnnualSalesTargets): boolean {
    try {
      const key = `phy_bu_annual_targets_${targets.year || 2026}_v1`;
      localStorage.setItem(key, JSON.stringify(targets));
      return true;
    } catch (e) {
      console.warn('Error saving annual targets', e);
      return false;
    }
  }

  static clearAnnualTargets(year: number = 2026): boolean {
    try {
      const key = `phy_bu_annual_targets_${year}_v1`;
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn('Error clearing annual targets', e);
      return false;
    }
  }

  static resetToDefault(): void {
    try {
      Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Error clearing storage', e);
    }
  }
}
