#!/usr/bin/env node
/**
 * build_dataset.mjs — builds src/data/odooExtractedData.json from the raw Odoo exports.
 *
 * WHY THIS EXISTS
 *  The previous JSON was produced by hand/AI and contained invented data (invoices, supplier bills,
 *  contact details, credit ratings, targets, stock aging) and a currency error (plain numbers were
 *  treated as EGP and divided by 50). This script produces ONLY what the exports contain, and marks
 *  everything else as unavailable. Run `npm run verify:data` after it.
 *
 * CONVENTIONS (confirmed by Tamer, 25-Oct-2026)
 *  - Every amount in the Sales export is USD INCLUDING 14% VAT, whatever its number format
 *    ("$ 1,234.00" for quotations, "1234.00" for orders — formatting differs, currency does not).
 *  - EGP figures are ex-VAT:  EGP = USD / 1.14 * 50   (reporting method used for the CEO report).
 *  - Product exports are already in EGP (cost, value).
 *
 * USAGE   node scripts/build_dataset.mjs [rawDir]      (default rawDir = data/private)
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const RAW_DIR = process.argv[2] || process.env.RAW_DIR || 'data/private';
const OUT = 'src/data/odooExtractedData.json';
const FX = 50; // EGP per USD
const VAT = 1.14;
const DAY = 86400000;

// ---------- Business-unit membership (TO CONFIRM — not present in the exports) ----------
const BU_MEMBERS = [
  'Tamer Elshafey', 'Nada Hisham', 'Rehaf Elterkawi', 'Marwan Ibrahim',
  'Ibrahim Diab', 'Amr Mesallam', 'Nevine Benyamin', 'Mohamed Rifaat',
];

// ---------- CSV (RFC-4180 style: quoted fields may contain commas, quotes and NEWLINES) ----------
export function parseCsv(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false;
      } else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      rows.push(row); row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const num = (s) => {
  const v = parseFloat(String(s ?? '').replace(/[^\d.\-]/g, ''));
  return Number.isFinite(v) ? v : 0;
};
const r2 = (x) => Math.round(x * 100) / 100;
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9؀-ۿ]+/g, '_').replace(/^_+|_+$/g, '');

function latest(prefix) {
  const files = fs.readdirSync(RAW_DIR).filter((f) => f.startsWith(prefix) && f.endsWith('.csv')).sort();
  if (!files.length) throw new Error(`No ${prefix}*.csv in ${RAW_DIR}`);
  return files[files.length - 1];
}

const salesFile = latest('Sales_');
const productFile = latest('Product_');
const dm = salesFile.match(/(\d{2})(\d{2})(\d{4})/);
const REPORT_DATE = dm ? `${dm[3]}-${dm[2]}-${dm[1]}` : new Date().toISOString().slice(0, 10);
const REPORT_TS = Date.parse(REPORT_DATE + 'T00:00:00Z');

// ---------- Brand tagging by opportunity text (orders carry no product lines) ----------
function tagBrand(text) {
  const t = String(text || '').toLowerCase();
  if (/velasea|ironlink|iron link/.test(t)) return 'Velasea';
  if (/\bamg\b|amg[-_ ]/.test(t)) return 'AMG';
  if (/bosch/.test(t)) return 'Bosch';
  if (/hik/.test(t)) return 'Hikvision';
  return undefined;
}

// =============================== SALES ===============================
const srows = parseCsv(fs.readFileSync(path.join(RAW_DIR, salesFile), 'utf8'));
const sh = srows[0].map((h) => h.trim());
const col = (name) => {
  const i = sh.findIndex((h) => h.toLowerCase() === name.toLowerCase());
  if (i < 0) throw new Error(`Column "${name}" missing in ${salesFile}`);
  return i;
};
const C = {
  ref: col('Order Reference'), date: col('Order Date'), created: col('Creation Date'),
  cust: col('Customer'), opp: col('Opportunity'), rep: col('Salesperson'), total: col('Total'),
  status: col('Status'), inv: col('Invoice Status'), del: col('Delivery Status'),
  upc: col('Up coming Payment'),
};

const STATUS = {
  'Sales Order': 'confirmed', Quotation: 'quotation', Draft: 'draft',
  Submitted: 'submitted', 'Waiting Sales Administrator': 'waiting_admin',
};

const salesOrders = [];
for (const r of srows.slice(1)) {
  const ref = (r[C.ref] || '').trim();
  if (!/^S\d+/.test(ref)) continue;
  const raw = (r[C.status] || '').trim();
  const amt = num(r[C.total]);               // USD incl. VAT (all rows)
  const untaxed = amt / VAT;
  const [d, tm] = (r[C.date] || '').trim().split(' ');
  const delRaw = (r[C.del] || '').trim();
  const invRaw = (r[C.inv] || '').trim();
  const status = STATUS[raw] || raw.toLowerCase();
  const confirmed = status === 'confirmed';
  const delivered = delRaw === 'Fully Delivered' ? 'delivered'
    : (delRaw === 'Partially Delivered' || delRaw === 'Started') ? 'partial' : 'not_delivered';
  const ageDays = Math.floor((REPORT_TS - Date.parse((d || '') + 'T00:00:00Z')) / DAY);
  const rep = (r[C.rep] || '').trim();
  const opp = (r[C.opp] || '').trim();
  const inBU = BU_MEMBERS.includes(rep);
  salesOrders.push({
    id: `so_${ref}`, odooName: ref, date: d, orderTime: tm || '',
    creationDate: ((r[C.created] || '').split(' ')[0]) || d,
    customerId: `cli_${slug(r[C.cust] || 'unknown')}`, customerName: (r[C.cust] || '').trim(),
    opportunity: opp, salesRepId: `rep_${slug(rep)}`, salesRepName: rep, isSalesRepInBU: inBU,
    currency: 'USD', exchangeRate: FX,
    originalAmount: r2(amt),
    totalUSD: r2(amt),                 // incl. VAT, as exported
    totalWithTaxUSD: r2(amt),
    untaxedUSD: r2(untaxed),
    totalEGP: r2(untaxed * FX),        // ex-VAT EGP (reporting convention)
    status, rawStatus: raw, invoiceStatus: invRaw, deliveryStatus: delRaw, deliveredStatus: delivered,
    upcomingPayment: num(r[C.upc]),
    brand: tagBrand(opp),
    isDeliveredDelayed: confirmed && delivered !== 'delivered' && ageDays > 30,
    isUninvoiced: confirmed && invRaw === 'To Invoice',
    isDeliveredNotInvoiced: confirmed && delRaw === 'Fully Delivered' && invRaw !== 'Fully Invoiced',
    isMixed: false,
    buPortionUSD: inBU ? r2(amt) : 0,  // no order lines in export → whole order for BU reps, 0 otherwise (UNKNOWN)
    buPercentage: inBU ? 100 : 0,
    ageDays,
    lines: [],                          // order lines are NOT in the export
  });
}

// =============================== PRODUCTS ===============================
const prows = parseCsv(fs.readFileSync(path.join(RAW_DIR, productFile), 'utf8'));
const products = [];
let section = null;
for (const r of prows.slice(1)) {
  const first = (r[0] || '').trim();
  if (first.startsWith('PHBU /')) { section = first; continue; }
  if (!first || !section) continue;           // subtotal / blank lines
  const parts = section.split('/').map((s) => s.trim());
  const brandRaw = parts[1];
  const brand = brandRaw.startsWith('AMG') ? 'AMG' : brandRaw;
  const category = brand === 'Bosch' ? 'VS' : (parts[parts.length - 1] || '').replace(/\s*\(\d+\)\s*$/, '');
  const desc = (r[1] || '').trim();
  const cost = num(r[2]), onHand = num(r[3]), avail = num(r[4]), fc = num(r[5]);
  const valEGP = num(r[7]);                   // value column as exported
  products.push({
    id: `prod_${products.length + 1}`, productId: first, sku: first,
    name: (desc.split('\n')[0] || first).slice(0, 140), description: desc,
    brand, category, location: '',
    qtyOnHand: onHand, qtyReserved: Math.max(onHand - avail, 0), qtyAvailable: avail, forecastedQty: fc,
    unitCostUSD: r2(cost / FX), totalValueUSD: r2(valEGP / FX),
    costEGP: cost, costUSD: r2(cost / FX), totalValEGP: valEGP, totalValUSD: r2(valEGP / FX),
    costMissing: cost === 0,
    firstInDate: '', lastMovementDate: '',        // not in export → unknown
    agingDays: null, daysWithoutMovement: null,   // requires stock-move export
    isStagnant: false, minSafetyStock: 0, isLowStock: false,
  });
}

// =============================== STATS ===============================
const YTD_FROM = `${REPORT_DATE.slice(0, 4)}-01-01`;
const sum = (a, f) => a.reduce((s, x) => s + f(x), 0);
const conf = salesOrders.filter((o) => o.status === 'confirmed');
const ytd = (o) => o.date >= YTD_FROM;
const confY = conf.filter(ytd);
const quotY = salesOrders.filter((o) => o.status === 'quotation' && ytd(o));
const dni = confY.filter((o) => o.isDeliveredNotInvoiced);
const toInv = confY.filter((o) => o.invoiceStatus === 'To Invoice');
const fully = confY.filter((o) => o.invoiceStatus === 'Fully Invoiced');
const q90 = quotY.filter((o) => o.ageDays > 90);
const stockVal = sum(products, (p) => p.totalValEGP);

const stats = {
  reportDate: REPORT_DATE,
  dataThrough: salesOrders.map((o) => o.date).sort().pop(),
  ytd: {
    from: YTD_FROM,
    confirmedCount: confY.length,
    confirmedUSD: r2(sum(confY, (o) => o.totalUSD)),
    confirmedEGPexVAT: r2(sum(confY, (o) => o.totalEGP)),
    fullyInvoicedEGPexVAT: r2(sum(fully, (o) => o.totalEGP)),
    deliveredNotInvoicedCount: dni.length,
    deliveredNotInvoicedUSD: r2(sum(dni, (o) => o.totalUSD)),
    toInvoiceUSD: r2(sum(toInv, (o) => o.totalUSD)),
    openQuotesCount: quotY.length,
    openQuotesUSD: r2(sum(quotY, (o) => o.totalUSD)),
    openQuotesOver90Count: q90.length,
    openQuotesOver90USD: r2(sum(q90, (o) => o.totalUSD)),
    awaitingConfirmationCount: salesOrders.filter((o) => ['draft', 'submitted', 'waiting_admin'].includes(o.status) && ytd(o)).length,
  },
  allTime: { rows: salesOrders.length, confirmedCount: conf.length, confirmedUSD: r2(sum(conf, (o) => o.totalUSD)) },
  inventory: {
    skuCount: products.length,
    skusInStock: products.filter((p) => p.qtyOnHand > 0).length,
    valueEGP: r2(stockVal), valueUSD: r2(stockVal / FX),
    zeroCostSkus: products.filter((p) => p.costMissing).length,
    zeroCostSkusInStock: products.filter((p) => p.costMissing && p.qtyOnHand > 0).length,
    reservedValueEGP: r2(sum(products, (p) => p.qtyReserved * p.costEGP)),
  },
};
// legacy keys (kept so older code paths keep working) — now correct and year-to-date
Object.assign(stats, {
  totalProductsCount: stats.inventory.skuCount,
  totalStockValUSD: stats.inventory.valueUSD,
  totalStockValEGP: stats.inventory.valueEGP,
  confirmedSalesCount: stats.ytd.confirmedCount,
  confirmedSalesUSD: stats.ytd.confirmedUSD,
  quotationCount: stats.ytd.openQuotesCount,
  quotationUSD: stats.ytd.openQuotesUSD,
  deliveredNotInvoicedUSD: stats.ytd.deliveredNotInvoicedUSD,
  toInvoiceUSD: stats.ytd.toInvoiceUSD,
});

// =============================== STAFF & CLIENTS (derived from sales only) ===============================
const byRep = new Map();
for (const o of salesOrders.filter(ytd)) {
  const k = o.salesRepName || '—';
  if (!byRep.has(k)) byRep.set(k, []);
  byRep.get(k).push(o);
}
const staffPerformance = [...byRep.entries()].map(([name, os]) => {
  const c = os.filter((o) => o.status === 'confirmed');
  const inBU = BU_MEMBERS.includes(name);
  const total = sum(c, (o) => o.totalUSD);
  return {
    id: `rep_${slug(name)}`, name, role: inBU ? 'وحدة Physical Security' : 'مندوب مبيعات (خارج الوحدة — يحتاج تأكيد)',
    isBU: inBU, avatar: name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase(),
    totalSalesUSD: r2(total), buBrandsSalesUSD: inBU ? r2(total) : 0,
    targetUSD: 0, targetAchievementRate: 0,            // targets are NOT in any export
    collectionsUSD: 0, outstandingARUSD: 0,           // requires Odoo invoices export
    activeOrdersCount: c.filter((o) => o.deliveredStatus !== 'delivered' || o.invoiceStatus !== 'Fully Invoiced').length,
    overdueInvoicesCount: 0,
    openQuotesCount: os.filter((o) => o.status === 'quotation').length,
    openQuotesUSD: r2(sum(os.filter((o) => o.status === 'quotation'), (o) => o.totalUSD)),
  };
}).sort((a, b) => b.totalSalesUSD - a.totalSalesUSD);

const byCust = new Map();
for (const o of salesOrders) {
  if (!o.customerName) continue;
  if (!byCust.has(o.customerName)) byCust.set(o.customerName, []);
  byCust.get(o.customerName).push(o);
}
const topOf = (arr) => {
  const m = new Map();
  arr.forEach((x) => m.set(x, (m.get(x) || 0) + 1));
  return [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
};
const clients = [...byCust.entries()].map(([name, os], i) => {
  const c = os.filter((o) => o.status === 'confirmed');
  const last = os.map((o) => o.date).sort().pop();
  const brands = os.map((o) => o.brand).filter(Boolean);
  return {
    id: `cli_${slug(name)}`, odooPartnerId: 0, name, contactPerson: '', phone: '', email: '', city: '', industry: '',
    assignedRepName: topOf(os.map((o) => o.salesRepName)) || '',
    primaryBrand: brands.length ? topOf(brands) : 'Mixed',
    totalPurchasedUSD: r2(sum(c, (o) => o.totalUSD)),
    outstandingBalanceUSD: 0,                         // requires Odoo invoices export
    lastOrderDate: last, daysSinceLastPurchase: Math.floor((REPORT_TS - Date.parse(last + 'T00:00:00Z')) / DAY),
    creditRating: 'N/A', ordersCount: c.length,
    projects: [...new Set(os.map((o) => o.opportunity).filter(Boolean))].slice(0, 25),
    associatedContractors: [], notes: '',
  };
}).sort((a, b) => b.totalPurchasedUSD - a.totalPurchasedUSD);

// =============================== ALERTS (derived, factual) ===============================
const fmtUSD = (x) => '$' + Math.round(x).toLocaleString('en-US');
const alerts = [];
const topDni = [...dni].sort((a, b) => b.totalUSD - a.totalUSD).slice(0, 5);
topDni.forEach((o) => alerts.push({
  id: `alt_dni_${o.odooName}`, type: 'uninvoiced_delivery', severity: 'high',
  title: `مسلَّم بالكامل وغير مفوتر (${fmtUSD(o.totalUSD)})`,
  message: `الأمر ${o.odooName} — ${o.customerName} (${o.opportunity || '—'}) بتاريخ ${o.date}: التسليم ${o.deliveryStatus}، حالة الفوترة ${o.invoiceStatus}.`,
  linkTab: 'orders', recordId: o.id, amountUSD: o.totalUSD, date: REPORT_DATE, dateCreated: REPORT_DATE,
}));
const stuck = confY.filter((o) => o.isDeliveredDelayed).sort((a, b) => b.totalUSD - a.totalUSD).slice(0, 5);
stuck.forEach((o) => alerts.push({
  id: `alt_stuck_${o.odooName}`, type: 'undelivered_order', severity: 'medium',
  title: `أمر مؤكد لم يكتمل تسليمه منذ ${o.ageDays} يوماً (${fmtUSD(o.totalUSD)})`,
  message: `الأمر ${o.odooName} — ${o.customerName} (${o.opportunity || '—'}): حالة التسليم ${o.deliveryStatus || 'غير محددة'}.`,
  linkTab: 'orders', recordId: o.id, amountUSD: o.totalUSD, date: REPORT_DATE, dateCreated: REPORT_DATE,
}));
alerts.push({
  id: 'alt_stale_quotes', type: 'stale_quotes', severity: 'high',
  title: `${q90.length} عرض سعر مفتوح أقدم من 90 يوماً (${fmtUSD(stats.ytd.openQuotesOver90USD)})`,
  message: `من إجمالي ${quotY.length} عرضاً مفتوحاً بقيمة ${fmtUSD(stats.ytd.openQuotesUSD)}. أغلب هذه العروض ليست فرصاً حقيقية — راجعها وأغلق الميت منها.`,
  linkTab: 'orders', amountUSD: stats.ytd.openQuotesOver90USD, date: REPORT_DATE, dateCreated: REPORT_DATE,
});
alerts.push({
  id: 'alt_cost_missing', type: 'cost_missing', severity: 'medium',
  title: `${stats.inventory.zeroCostSkus} صنفاً بتكلفة صفر في Odoo`,
  message: `منها ${stats.inventory.zeroCostSkusInStock} في المخزون (قيمتها غير محسوبة). أي هامش يُحسب على هذه الأصناف سيظهر 100% — حدّث التكلفة قبل أي تقرير ربحية.`,
  linkTab: 'inventory', date: REPORT_DATE, dateCreated: REPORT_DATE,
});
const top3 = [...products].sort((a, b) => b.totalValEGP - a.totalValEGP).slice(0, 3);
const top3Share = sum(top3, (p) => p.totalValEGP) / (stockVal || 1);
alerts.push({
  id: 'alt_stock_concentration', type: 'stock_concentration', severity: top3Share > 0.25 ? 'medium' : 'info',
  title: `أكبر 3 أصناف = ${(top3Share * 100).toFixed(0)}% من قيمة المخزون`,
  message: top3.map((p) => `${p.sku} (${Math.round(p.qtyOnHand)} وحدة)`).join('، '),
  linkTab: 'inventory', date: REPORT_DATE, dateCreated: REPORT_DATE,
});

// =============================== OUTPUT ===============================
const body = {
  meta: {
    generatedBy: 'scripts/build_dataset.mjs',
    sources: { sales: salesFile, products: productFile },
    provenance: {
      salesOrders: 'odoo_export', products: 'odoo_export',
      clients: 'derived_from_sales (no contact data in export)',
      staffPerformance: 'derived_from_sales (no targets/collections in export)',
      alerts: 'derived',
      invoices: 'UNAVAILABLE — needs Odoo invoices export (amount_residual, due dates)',
      supplierBills: 'UNAVAILABLE — needs Odoo vendor bills export',
      stockMoves: 'UNAVAILABLE — needs stock moves export (dates) → aging / stagnant / turnover',
      orderLines: 'UNAVAILABLE — needs sale.order.line export (brand, SKU, qty, cost/margin)',
    },
    conventions: [
      'Sales amounts are USD incl. 14% VAT (all rows). EGP = USD / 1.14 * 50 (ex-VAT).',
      'Product cost/value are EGP as exported; USD shown = EGP / 50.',
      'Brand on orders is a tag from the opportunity name only; unmatched orders have no brand.',
    ],
    assumptions: [
      'BU membership list is hard-coded in build_dataset.mjs (BU_MEMBERS) — confirm.',
      'isDeliveredDelayed = confirmed AND not fully delivered AND order older than 30 days.',
      'buPortionUSD = whole order for BU reps, 0 for others (no order lines to split).',
    ],
    brandTaggedOrders: salesOrders.filter((o) => o.brand).length,
    totalOrders: salesOrders.length,
  },
  extractedDate: REPORT_DATE,
  stats,
  products,
  salesOrders,
  invoices: [],
  clients,
  staffPerformance,
  supplierBills: [],
  alerts,
};
const datasetVersion = crypto.createHash('sha1').update(JSON.stringify(body)).digest('hex').slice(0, 10);
body.meta.datasetVersion = datasetVersion;
fs.writeFileSync(OUT, JSON.stringify(body, null, 1));

console.log(`✔ ${OUT}  (version ${datasetVersion})`);
console.log(`  orders: ${salesOrders.length} (confirmed ${conf.length}; ${YTD_FROM}.. confirmed ${confY.length}, EGP ex-VAT ${Math.round(stats.ytd.confirmedEGPexVAT).toLocaleString()})`);
console.log(`  open quotes ${YTD_FROM}..: ${quotY.length}, ${fmtUSD(stats.ytd.openQuotesUSD)} (>90d: ${q90.length})`);
console.log(`  products: ${products.length}, stock value EGP ${Math.round(stockVal).toLocaleString()}`);
console.log(`  clients (derived): ${clients.length}, staff (derived): ${staffPerformance.length}, alerts: ${alerts.length}`);
