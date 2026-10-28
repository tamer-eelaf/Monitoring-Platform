import {
  SalesOrder,
  CustomerInvoice,
  SupplierBill,
  StockItem,
  StockMove,
  EgyptClient,
  BUStaffPerformance,
  SystemAlert,
  UserProfile,
  Phase0AuditReport
} from '../types';
import odooExtractedData from './odooExtractedData.json';

export const CURRENT_EXCHANGE_RATE = 50.0; // EGP per USD
export const VAT_RATE = 0.14; // 14% Egypt VAT

// Real profiles derived directly from Odoo Physical Security BU (Team 35)
export const INITIAL_USER_PROFILES: UserProfile[] = [
  {
    id: 'user_595',
    name: 'Tamer Elshafey',
    email: 'tamer.elshafey@eelaf.com',
    role: 'director',
    department: 'Physical Security BU (Team 35)',
    isBUMember: true,
  },
  {
    id: 'user_638',
    name: 'Rehaf Elterkawi',
    email: 'rehaf.elterkawi@eelaf.com',
    role: 'sales_rep',
    department: 'Physical Security BU - HikCentral & Access',
    isBUMember: true,
  },
  {
    id: 'user_704',
    name: 'Amr Mesallam',
    email: 'amr.mesallam@eelaf.com',
    role: 'sales_rep',
    department: 'Physical Security BU - Solutions & Hardware',
    isBUMember: true,
  },
];

// Datasets come from scripts/build_dataset.mjs (Odoo exports). Anything the exports do not contain is EMPTY — see meta.provenance.
export const DATA_META: any = (odooExtractedData as any).meta || {};
export const DATA_REPORT_DATE: string = (odooExtractedData as any).extractedDate || '';
export const INITIAL_SALES_ORDERS: SalesOrder[] = (odooExtractedData.salesOrders as any) || [];
export const INITIAL_STOCK_ITEMS: StockItem[] = (odooExtractedData.products as any) || [];
export const INITIAL_INVOICES: CustomerInvoice[] = (odooExtractedData.invoices as any) || [];
export const INITIAL_CLIENTS: EgyptClient[] = (odooExtractedData.clients as any) || [];
export const INITIAL_STAFF_PERFORMANCE: BUStaffPerformance[] = (odooExtractedData.staffPerformance as any) || [];
export const INITIAL_SUPPLIER_BILLS: SupplierBill[] = (odooExtractedData.supplierBills as any) || [];
export const INITIAL_ALERTS: SystemAlert[] = (odooExtractedData.alerts as any) || [];

// Stock movements are NOT in the exports (needs Odoo stock.move export). Never fabricate them.
export const INITIAL_STOCK_MOVES: StockMove[] = [];

export const INITIAL_PHASE0_REPORT: Phase0AuditReport = {
  generatedAt: DATA_REPORT_DATE,
  connectionStatus: 'mock_mode', // static snapshot of Odoo CSV exports — not a live connection
  serverUrl: '',
  database: '',
  companyName: 'EELAF for Engineering and Information Technology S.A.E.',
  totalOrdersSampled: INITIAL_SALES_ORDERS.length,
  totalInvoicesSampled: INITIAL_INVOICES.length,
  totalStockMovesSampled: 0,
  brandClassificationRate: INITIAL_SALES_ORDERS.length
    ? Math.round((INITIAL_SALES_ORDERS.filter((o) => o.brand).length / INITIAL_SALES_ORDERS.length) * 1000) / 10
    : 0,
  unclassifiedLinesCount: INITIAL_SALES_ORDERS.filter((o) => !o.brand).length,
  mixedInvoicesPercentage: 0,
  detectedBrandField: 'opportunity name keywords only (no order lines in export)',
  recommendations: [
    'البيانات لقطة من تصديرات Odoo بتاريخ ' + DATA_REPORT_DATE + ' وليست اتصالاً حياً.',
    'غير متاح حالياً: الفواتير، فواتير الموردين، حركات المخزون، أسطر الأوامر (العلامة والتكلفة).',
    'ربط الأوامر بالتوكيل يتم من اسم الفرصة فقط، فنسبة التصنيف أعلاه جزئية.',
  ],
};
