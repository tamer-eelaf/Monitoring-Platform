export type Brand = 'Hikvision' | 'Velasea' | 'AMG' | 'Bosch';

export type UserRole = 'director' | 'sales_rep' | 'cross_rep';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatar?: string;
  isBUMember: boolean;
}

export type OrderStatus = 'draft' | 'quotation' | 'confirmed' | 'in_delivery' | 'delivered' | 'invoiced' | 'paid';

export type PaymentStatus = 'not_paid' | 'partial' | 'paid' | 'overdue';

export type PromiseStatus = 'scheduled' | 'kept' | 'broken' | 'in_followup' | 'none';

export interface OrderLineItem {
  id: string;
  productId: string;
  productName: string;
  brand: Brand | 'Other';
  sku: string;
  quantity: number;
  unitPriceUSD: number;
  taxRate: number; // 0.14 for 14% VAT
  totalUSD: number;
  totalWithTaxUSD: number;
  isBULine: boolean;
}

export interface SalesOrder {
  id: string;
  odooName: string; // e.g. SO/2026/0412
  date: string;
  creationDate?: string;
  customerId: string;
  customerName: string;
  opportunity?: string;
  salesRepId: string;
  salesRepName: string;
  isSalesRepInBU: boolean;
  status: OrderStatus;
  lines: OrderLineItem[];
  currency: 'USD' | 'EGP';
  exchangeRate: number;
  totalUSD: number;
  totalWithTaxUSD: number;
  totalEGP: number;
  deliveryDate?: string;
  deliveredStatus: 'not_delivered' | 'partial' | 'delivered';
  invoiceStatus?: string;
  deliveryStatusRaw?: string;
  upcomingPayment?: number;
  brand?: Brand;
  isDeliveredDelayed: boolean;
  isUninvoiced: boolean;
  isDeliveredNotInvoiced?: boolean;
  isMixed: boolean;
  buPortionUSD: number;
  buPercentage: number;
}

export interface CustomerInvoice {
  id: string;
  odooName: string; // e.g. INV/2026/0189
  orderId?: string;
  orderName?: string;
  date: string;
  dueDate: string;
  customerId: string;
  customerName: string;
  salesRepId: string;
  salesRepName: string;
  currency: 'USD' | 'EGP';
  exchangeRate: number;
  totalUSD: number;
  totalWithTaxUSD: number;
  amountResidualUSD: number; // المتبقي
  amountResidualEGP: number;
  paymentStatus: PaymentStatus;
  daysOverdue: number;
  agingBracket: 'current' | '1_30' | '31_60' | '61_90' | 'over_90';
  lines: OrderLineItem[];
  isMixed: boolean;
  buPortionUSD: number;
  buResidualUSD: number;
  // Platform-owned fields
  promiseDate?: string;
  promiseStatus: PromiseStatus;
  followupNotes?: string;
  assignedFollowupUser?: string;
  lastContactDate?: string;
}

export interface SupplierBill {
  id: string;
  odooName: string; // e.g. BILL/2026/0078
  purchaseOrderName?: string;
  brand: Brand;
  supplierName: string; // Hikvision MEA, Velasea Enterprise LLC, AMG Systems UK
  date: string;
  dueDate: string;
  totalUSD: number;
  amountResidualUSD: number;
  currency: 'USD' | 'EUR';
  status: PaymentStatus;
  daysToDue: number;
  isOverdue: boolean;
  plannedPaymentDate?: string;
  paymentNotes?: string;
}

export interface StockItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  brand: Brand;
  category: string;
  location: string;
  qtyOnHand: number;
  qtyReserved: number;
  qtyAvailable: number;
  unitCostUSD: number;
  totalValueUSD: number;
  firstInDate: string;
  lastMovementDate: string;
  agingDays: number; // Days since first stock in
  daysWithoutMovement: number;
  isStagnant: boolean; // > N days without movement
  minSafetyStock: number;
  isLowStock: boolean;
}

export interface StockMove {
  id: string;
  reference: string; // e.g. WH/IN/00142, WH/OUT/00388
  date: string;
  productId: string;
  productName: string;
  brand: Brand;
  moveType: 'in' | 'out';
  quantity: number;
  sourceLocation: string;
  destinationLocation: string;
  originDocument: string;
}

export interface EgyptClient {
  id: string;
  odooPartnerId: number;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  city: string; // Cairo, Giza, Alexandria, New Capital, 6th of October
  industry: string;
  assignedRepName: string;
  primaryBrand: Brand | 'Mixed';
  totalPurchasedUSD: number;
  outstandingBalanceUSD: number;
  lastOrderDate: string;
  daysSinceLastPurchase: number;
  creditRating: 'A+' | 'A' | 'B' | 'C' | 'Risk';
}

export interface BUStaffPerformance {
  id: string;
  name: string;
  role: string;
  isBU: boolean;
  avatar: string;
  totalSalesUSD: number;
  buBrandsSalesUSD: number;
  targetUSD: number;
  targetAchievementRate: number;
  collectionsUSD: number;
  outstandingARUSD: number;
  activeOrdersCount: number;
  overdueInvoicesCount: number;
}

export interface SystemAlert {
  id: string;
  type: 'broken_promise' | 'overdue_invoice' | 'supplier_due' | 'stagnant_stock' | 'undelivered_order' | 'uninvoiced_delivery';
  severity: 'high' | 'medium' | 'info';
  title: string;
  message: string;
  date: string;
  linkTab: string;
  recordId?: string;
  amountUSD?: number;
}

export interface OdooConnectionConfig {
  url: string;
  db: string;
  username: string;
  apiKey: string;
  isConnected: boolean;
  lastTestedAt?: string;
  serverVersion?: string;
  detectedBrandField?: string;
  brandTagNames: string[];
}

export interface Phase0AuditReport {
  generatedAt: string;
  connectionStatus: 'verified' | 'pending' | 'mock_mode';
  serverUrl: string;
  database: string;
  companyName: string;
  totalOrdersSampled: number;
  totalInvoicesSampled: number;
  totalStockMovesSampled: number;
  brandClassificationRate: number; // e.g. 93.4%
  unclassifiedLinesCount: number;
  mixedInvoicesPercentage: number;
  detectedBrandField: string;
  recommendations: string[];
}
