import {
  OdooConnectionConfig,
  Phase0AuditReport,
  CustomerInvoice,
  SalesOrder,
  SupplierBill,
  StockItem,
  StockMove,
  EgyptClient,
  BUStaffPerformance,
  SystemAlert
} from '../types';

export interface FieldInspectionResult {
  model: string;
  modelNameArabic: string;
  totalFieldsScanned: number;
  candidateFields: {
    fieldName: string;
    fieldLabel: string;
    fieldType: string;
    status: 'match_found' | 'candidate' | 'empty';
    sampleValue: string;
    notes: string;
  }[];
}

export interface LiveStatusResult {
  authenticated: boolean;
  uid?: number;
  user?: string;
  company?: string;
  companyId?: number;
  serverVersion?: string;
  db?: string;
  teamId?: number;
  teamName?: string;
  message?: string;
  discoveredFields?: {
    brandModel: string;
    brandIdField: string;
    categoryField: string;
    targetBrandIds: Record<string, number>;
    targetCategoryPrefix: string;
  };
}

export class OdooApiService {
  static async checkLiveStatus(): Promise<LiveStatusResult> {
    try {
      const res = await fetch('/api/odoo/live-status');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('Failed to check live status:', e);
    }
    return {
      authenticated: false,
      message: 'تعذر الاتصال بخادم الويب المحلي.',
    };
  }

  static async fetchLiveData(): Promise<{
    success: boolean;
    invoices: CustomerInvoice[];
    salesOrders: SalesOrder[];
    supplierBills: SupplierBill[];
    stockItems: StockItem[];
    stockMoves: StockMove[];
    clients: EgyptClient[];
    staffPerformance: BUStaffPerformance[];
    alerts: SystemAlert[];
  } | null> {
    try {
      const res = await fetch('/api/odoo/live-data');
      if (!res.ok) return null;

      const data = await res.json();
      if (!data.success) return null;

      const invoices: CustomerInvoice[] = data.invoices || [];
      const salesOrders: SalesOrder[] = data.salesOrders || [];
      const supplierBills: SupplierBill[] = data.supplierBills || [];
      const stockItems: StockItem[] = data.stockItems || [];
      const stockMoves: StockMove[] = data.stockMoves || [];
      const clients: EgyptClient[] = data.clients || [];
      const staffPerformance: BUStaffPerformance[] = data.staffPerformance || [];

      // Generate dynamic live alerts based on real data
      const alerts: SystemAlert[] = [];

      // 1. Overdue invoices alerts
      invoices
        .filter((inv) => inv.paymentStatus === 'overdue' && inv.amountResidualUSD > 500)
        .slice(0, 3)
        .forEach((inv) => {
          alerts.push({
            id: `alt_inv_${inv.id}`,
            type: 'overdue_invoice',
            severity: 'high',
            title: `تأخر سداد فاتورة عميل: ${inv.customerName}`,
            message: `الفاتورة ${inv.odooName} بقيمة متبقية $${inv.amountResidualUSD.toLocaleString()} متأخرة عن موعد استحقاقها (${inv.dueDate}) بـ ${inv.daysOverdue} يوماً.`,
            date: inv.date,
            linkTab: 'collections',
            recordId: inv.id,
            amountUSD: inv.amountResidualUSD,
          });
        });

      // 2. Uninvoiced confirmed orders alerts
      salesOrders
        .filter((ord) => ord.status === 'confirmed')
        .slice(0, 2)
        .forEach((ord) => {
          alerts.push({
            id: `alt_so_${ord.id}`,
            type: 'uninvoiced_delivery',
            severity: 'medium',
            title: `أمر بيع معتمد قيد التسليم: ${ord.customerName}`,
            message: `الأمر ${ord.odooName} بمبلغ $${ord.totalWithTaxUSD.toLocaleString()} معتمد في Odoo وبحاجة لمتابعة حركة التسليم والفوترة.`,
            date: ord.date,
            linkTab: 'orders',
            recordId: ord.id,
            amountUSD: ord.totalWithTaxUSD,
          });
        });

      // 3. Supplier payables alert
      supplierBills
        .filter((b) => b.status === 'not_paid')
        .slice(0, 2)
        .forEach((b) => {
          alerts.push({
            id: `alt_bill_${b.id}`,
            type: 'supplier_due',
            severity: 'high',
            title: `استحقاق سداد مورد: ${b.supplierName}`,
            message: `فاتورة المورد ${b.odooName} بمبلغ $${b.amountResidualUSD.toLocaleString()} مستحقة في ${b.dueDate}.`,
            date: b.date,
            linkTab: 'suppliers',
            recordId: b.id,
            amountUSD: b.amountResidualUSD,
          });
        });

      // 4. Stagnant stock alert
      stockItems
        .filter((s) => s.isStagnant)
        .slice(0, 2)
        .forEach((s) => {
          alerts.push({
            id: `alt_stk_${s.id}`,
            type: 'stagnant_stock',
            severity: 'medium',
            title: `مخزون راكد في المستودع: ${s.name}`,
            message: `الصنف ${s.sku} بالمستودع (${s.location}) لم يتحرك منذ ${s.daysWithoutMovement} يوماً، بقيمة إجمالية $${s.totalValueUSD.toLocaleString()}.`,
            date: s.lastMovementDate,
            linkTab: 'inventory',
            recordId: s.id,
            amountUSD: s.totalValueUSD,
          });
        });

      return {
        success: true,
        invoices,
        salesOrders,
        supplierBills,
        stockItems,
        stockMoves,
        clients,
        staffPerformance,
        alerts,
      };
    } catch (e) {
      console.warn('Live Odoo feed unavailable (static mode) — using bundled export:', (e as Error)?.message);
      return null;
    }
  }

  static async testConnection(config?: OdooConnectionConfig) {
    const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    try {
      const res = await fetch('/api/odoo/live-status');
      if (res.ok) {
        const data = await res.json();
        const ok = !!data.authenticated;
        return {
          success: ok,
          message: ok ? 'تم التحقق من الاتصال بخادم Odoo.' : data.message || 'فشل الاتصال',
          serverVersion: data.serverVersion || '',
          authenticatedUid: data.uid || 0,
          companyName: data.company || '',
          diagnostics: {
            xmlRpcJsonRpcEnabled: ok,
            readPermissionsVerified: ok,
            egyptCompanyFiltered: ok,
            latencyMs: Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0),
          },
        };
      }
    } catch (e) {
      console.error('Test connection error:', e);
    }

    // No server reachable (e.g. static hosting): report the truth instead of a fabricated success.
    return {
      success: false,
      message: 'تعذّر الاتصال بخادم Odoo. التطبيق يعمل على لقطة بيانات ثابتة من التصديرات.',
      serverVersion: '',
      authenticatedUid: 0,
      companyName: '',
      diagnostics: {
        xmlRpcJsonRpcEnabled: false,
        readPermissionsVerified: false,
        egyptCompanyFiltered: false,
        latencyMs: 0,
      },
    };
  }

  /** Field discovery requires a live Odoo connection; returns nothing until that is implemented. */
  static async inspectBrandFields(_config: OdooConnectionConfig): Promise<FieldInspectionResult[]> {
    return [];
  }

  static generatePhase0Dossier(
    _config: OdooConnectionConfig,
    _classificationRate: number = 0,
    _mixedRate: number = 0
  ): Phase0AuditReport {
    return {
      generatedAt: new Date().toISOString(),
      connectionStatus: 'pending',
      serverUrl: '',
      database: '',
      companyName: 'EELAF for Engineering and Information Technology S.A.E.',
      totalOrdersSampled: 0,
      totalInvoicesSampled: 0,
      totalStockMovesSampled: 0,
      brandClassificationRate: 0,
      unclassifiedLinesCount: 0,
      mixedInvoicesPercentage: 0,
      detectedBrandField: 'not inspected',
      recommendations: ['لم يُنفَّذ فحص حي لقاعدة Odoo. هذه القيم ليست نتيجة فحص.'],
    };
  }
}
