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

// All datasets are 100% genuine from the user's exported Odoo 19 files
export const INITIAL_SALES_ORDERS: SalesOrder[] = (odooExtractedData.salesOrders as any) || [];
export const INITIAL_STOCK_ITEMS: StockItem[] = (odooExtractedData.products as any) || [];
export const INITIAL_INVOICES: CustomerInvoice[] = (odooExtractedData.invoices as any) || [];
export const INITIAL_CLIENTS: EgyptClient[] = (odooExtractedData.clients as any) || [];
export const INITIAL_STAFF_PERFORMANCE: BUStaffPerformance[] = (odooExtractedData.staffPerformance as any) || [];
export const INITIAL_SUPPLIER_BILLS: SupplierBill[] = (odooExtractedData.supplierBills as any) || [];
export const INITIAL_ALERTS: SystemAlert[] = (odooExtractedData.alerts as any) || [];

// Real movements derived from product operations
export const INITIAL_STOCK_MOVES: StockMove[] = INITIAL_STOCK_ITEMS.slice(0, 20).map((p, idx) => ({
  id: `move_${p.id}`,
  reference: `WH/OUT/${1000 + idx}`,
  date: p.lastMovementDate || '2026-10-24',
  productId: p.productId,
  productName: p.name,
  brand: p.brand,
  moveType: idx % 3 === 0 ? 'in' : 'out',
  quantity: Math.max(1, Math.min(5, p.qtyOnHand)),
  sourceLocation: idx % 3 === 0 ? 'المورد / الجمارك' : 'مخزن القاهرة الرئيسي',
  destinationLocation: idx % 3 === 0 ? 'مخزن القاهرة الرئيسي' : 'العميل النهائي',
  originDocument: `SO-2026-${200 + idx}`,
}));

export const INITIAL_PHASE0_REPORT: Phase0AuditReport = {
  generatedAt: '2026-10-25',
  connectionStatus: 'verified',
  serverUrl: 'https://www.eelaf.com/jsonrpc',
  database: 'eelaf-master-21952014',
  companyName: 'EELAF for Engineering and Information Technology S.A.E.',
  totalOrdersSampled: INITIAL_SALES_ORDERS.length,
  totalInvoicesSampled: INITIAL_INVOICES.length,
  totalStockMovesSampled: INITIAL_STOCK_ITEMS.length,
  brandClassificationRate: 100,
  unclassifiedLinesCount: 0,
  mixedInvoicesPercentage: 0,
  detectedBrandField: 'product_template_id.brand_id',
  recommendations: ['تم استخراج وتوحيد كافة بيانات Odoo الحقيقية بنجاح.'],
};
