import {
  CustomerInvoice,
  SupplierBill,
  SalesOrder,
  StockItem,
  SystemAlert,
  OdooConnectionConfig,
  UserProfile,
  Phase0AuditReport
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
  INITIAL_ALERTS,
  INITIAL_USER_PROFILES,
  INITIAL_PHASE0_REPORT
} from '../data/mockData';

const KEYS = {
  INVOICES: 'phy_bu_invoices_v1',
  SUPPLIERS: 'phy_bu_suppliers_v1',
  ORDERS: 'phy_bu_orders_v1',
  STOCK: 'phy_bu_stock_v1',
  ALERTS: 'phy_bu_alerts_v1',
  ODOO_CONFIG: 'phy_bu_odoo_config_v1',
  CURRENT_USER_ID: 'phy_bu_current_user_v1',
  AUDIT_REPORT: 'phy_bu_audit_report_v1',
  THRESHOLDS: 'phy_bu_thresholds_v1',
};

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
  url: 'https://www.eelaf.com/odoo',
  db: 'eelaf-master-21952014',
  username: 'tamereelaf@gmail.com',
  apiKey: '',
  isConnected: false,
  brandTagNames: ['Hikvision', 'Velasea', 'AMG'],
};

export class StorageService {
  static getInvoices(): CustomerInvoice[] {
    try {
      const data = localStorage.getItem(KEYS.INVOICES);
      return data ? JSON.parse(data) : INITIAL_INVOICES;
    } catch {
      return INITIAL_INVOICES;
    }
  }

  static saveInvoices(invoices: CustomerInvoice[]): void {
    localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices));
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
      return data ? JSON.parse(data) : INITIAL_SUPPLIER_BILLS;
    } catch {
      return INITIAL_SUPPLIER_BILLS;
    }
  }

  static saveSupplierBills(bills: SupplierBill[]): void {
    localStorage.setItem(KEYS.SUPPLIERS, JSON.stringify(bills));
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
      return data ? JSON.parse(data) : INITIAL_SALES_ORDERS;
    } catch {
      return INITIAL_SALES_ORDERS;
    }
  }

  static getStockItems(): StockItem[] {
    try {
      const data = localStorage.getItem(KEYS.STOCK);
      return data ? JSON.parse(data) : INITIAL_STOCK_ITEMS;
    } catch {
      return INITIAL_STOCK_ITEMS;
    }
  }

  static getAlerts(): SystemAlert[] {
    try {
      const data = localStorage.getItem(KEYS.ALERTS);
      return data ? JSON.parse(data) : INITIAL_ALERTS;
    } catch {
      return INITIAL_ALERTS;
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
      const id = localStorage.getItem(KEYS.CURRENT_USER_ID) || 'user_tamer';
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

  static resetToDefault(): void {
    localStorage.clear();
  }
}
