#!/usr/bin/env node
/**
 * verify_dataset.mjs — reconciliation test.
 * Compares src/data/odooExtractedData.json with reference figures computed INDEPENDENTLY
 * (Python/pandas + the Excel status workbook of 24-Oct-2026) stored in data/golden/*.json.
 * Fails (exit 1) when the app's numbers drift from Odoo's. Run: npm run verify:data
 */
import fs from 'node:fs';

const data = JSON.parse(fs.readFileSync('src/data/odooExtractedData.json', 'utf8'));
const golden = JSON.parse(fs.readFileSync('data/golden/reference_2026-10-24.json', 'utf8'));
const { stats, salesOrders, products } = data;
let failed = 0;

function check(name, actual, expected, tol = 0.01) {
  const ok = Math.abs(actual - expected) <= tol;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}: app=${actual}  reference=${expected}${ok ? '' : `  (tolerance ${tol})`}`);
}
function assert(name, cond, detail = '') {
  if (!cond) failed++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
}

// --- sales ---
check('all-time rows', stats.allTime.rows, golden.allTimeRows, 0);
check('all-time confirmed count', stats.allTime.confirmedCount, golden.allTimeConfirmedCount, 0);
check('all-time confirmed USD', stats.allTime.confirmedUSD, golden.allTimeConfirmedUSD, 1);
check('YTD confirmed count', stats.ytd.confirmedCount, golden.ytdConfirmedCount, 0);
check('YTD confirmed USD', stats.ytd.confirmedUSD, golden.ytdConfirmedUSD, 1);
check('YTD confirmed EGP ex-VAT', stats.ytd.confirmedEGPexVAT, golden.ytdConfirmedEGPexVAT, 10);
check('YTD fully-invoiced EGP ex-VAT', stats.ytd.fullyInvoicedEGPexVAT, golden.ytdFullyInvoicedEGPexVAT, 10);
check('YTD delivered-not-invoiced count', stats.ytd.deliveredNotInvoicedCount, golden.ytdDeliveredNotInvoicedCount, 0);
check('YTD delivered-not-invoiced USD', stats.ytd.deliveredNotInvoicedUSD, golden.ytdDeliveredNotInvoicedUSD, 1);
check('YTD open quotes count', stats.ytd.openQuotesCount, golden.ytdOpenQuotesCount, 0);
check('YTD open quotes USD', stats.ytd.openQuotesUSD, golden.ytdOpenQuotesUSD, 1);
check('YTD open quotes >90d count', stats.ytd.openQuotesOver90Count, golden.ytdOpenQuotesOver90Count, 0);
check('YTD open quotes >90d USD', stats.ytd.openQuotesOver90USD, golden.ytdOpenQuotesOver90USD, 1);

// per-order integrity: the order list and the stats must agree (the old app disagreed by 50x)
const listSum = salesOrders.filter((o) => o.status === 'confirmed' && o.date >= stats.ytd.from).reduce((s, o) => s + o.totalUSD, 0);
check('order-list sum == stats (confirmed YTD USD)', Math.round(listSum), Math.round(stats.ytd.confirmedUSD), 2);
assert('no order labelled EGP (all amounts are USD incl. VAT)', salesOrders.every((o) => o.currency === 'USD'));
assert('totalEGP == untaxedUSD x 50 for every order', salesOrders.every((o) => Math.abs(o.totalEGP - o.untaxedUSD * 50) < 1));
assert('untaxed = total / 1.14 for every order', salesOrders.every((o) => Math.abs(o.untaxedUSD - o.totalUSD / 1.14) < 0.02));
assert('order refs are unique', new Set(salesOrders.map((o) => o.odooName)).size === salesOrders.length);

// --- inventory ---
check('product SKU count (multi-line descriptions must not create rows)', products.length, golden.productSkuCount, 0);
check('inventory value EGP', stats.inventory.valueEGP, golden.inventoryValueEGP, 5);
check('SKUs with zero cost', stats.inventory.zeroCostSkus, golden.productsWithZeroCost, 0);
assert('SKUs are unique', new Set(products.map((p) => p.sku)).size === products.length);
assert('no SKU looks like a description fragment', products.every((p) => !/[,;]\s*$/.test(p.sku) && p.sku.length < 60));

// --- no invented data ---
assert('invoices are empty (no source export)', data.invoices.length === 0);
assert('supplierBills are empty (no source export)', data.supplierBills.length === 0);
assert('no client has a phone/email (none in exports)', data.clients.every((c) => !c.phone && !c.email));
assert('no stock aging invented', products.every((p) => p.agingDays === null && p.firstInDate === ''));
assert('no staff targets invented', data.staffPerformance.every((s) => s.targetUSD === 0));
assert('dataset has version + provenance', !!data.meta?.datasetVersion && !!data.meta?.provenance);

console.log(failed ? `\n${failed} CHECK(S) FAILED` : '\nALL CHECKS PASSED');
process.exit(failed ? 1 : 0);
