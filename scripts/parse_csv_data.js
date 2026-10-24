import fs from 'fs';
import path from 'path';

function parseCSV(content) {
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  const rows = [];
  for (let line of lines) {
    const row = [];
    let entry = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === ',' && !inQuotes) {
        row.push(entry.trim());
        entry = '';
      } else {
        entry += c;
      }
    }
    row.push(entry.trim());
    rows.push(row);
  }
  return rows;
}

function parseAmount(str) {
  if (!str) return 0;
  let clean = str.replace(/[$,"]/g, '').trim();
  let val = parseFloat(clean);
  return isNaN(val) ? 0 : val;
}

// 1. Parse Products
const prodRaw = fs.readFileSync('public/assets/aistudio/Product_24102026_efbde99a.csv', 'utf8');
const prodRows = parseCSV(prodRaw);

const categories = {};
let currentCategory = 'General';
let totalStockValEGP = 0;
let totalStockItems = 0;
const productsList = [];

for (let i = 1; i < prodRows.length; i++) {
  const row = prodRows[i];
  if (!row[0]) continue;
  if (row[0].startsWith('PHBU /')) {
    currentCategory = row[0];
    continue;
  }
  const name = row[0];
  const desc = row[1] || '';
  const cost = parseAmount(row[2]);
  const qtyOnHand = parseAmount(row[3]);
  const availableQty = parseAmount(row[4]);
  const forecastedQty = parseAmount(row[5]);
  const totalValEGP = parseAmount(row[7]);

  if (qtyOnHand > 0 || forecastedQty > 0 || totalValEGP > 0) {
    totalStockValEGP += totalValEGP || (cost * qtyOnHand);
    totalStockItems++;
  }

  let brand = 'AMG';
  if (currentCategory.includes('Hikvision')) brand = 'Hikvision';
  else if (currentCategory.includes('Velasea')) brand = 'Velasea';
  else if (currentCategory.includes('Bosch')) brand = 'Bosch';

  if (!categories[currentCategory]) {
    categories[currentCategory] = { count: 0, totalValEGP: 0, items: [] };
  }
  categories[currentCategory].count++;
  categories[currentCategory].totalValEGP += (totalValEGP || (cost * qtyOnHand));

  productsList.push({
    sku: name,
    name: desc || name,
    category: currentCategory,
    brand,
    costEGP: cost,
    costUSD: Math.round(cost / 50),
    qtyOnHand,
    availableQty,
    forecastedQty,
    totalValEGP: totalValEGP || (cost * qtyOnHand),
    totalValUSD: Math.round((totalValEGP || (cost * qtyOnHand)) / 50),
  });
}

console.log('--- PRODUCTS SUMMARY ---');
console.log('Total Products Parsed:', productsList.length);
console.log('Total Inventory Value EGP: EGP', totalStockValEGP.toLocaleString());
console.log('Total Inventory Value USD: $', Math.round(totalStockValEGP / 50).toLocaleString());
console.log('Categories count:', Object.keys(categories).length);

// 2. Parse Sales
const salesRaw = fs.readFileSync('public/assets/aistudio/Sales_24102026_793c5efe.csv', 'utf8');
const salesRows = parseCSV(salesRaw);

let salesCount = 0;
let salesTotalUSD = 0;
let quoteCount = 0;
let quoteTotalUSD = 0;
let toInvoiceUSD = 0;
let deliveredNotInvUSD = 0;
const salesList = [];
const repMap = {};
const custMap = {};

for (let i = 1; i < salesRows.length; i++) {
  const row = salesRows[i];
  if (!row[0] || !row[0].startsWith('S')) continue;
  const ref = row[0];
  const date = row[1];
  const cust = row[3];
  const opp = row[4];
  const rep = row[5];
  const total = parseAmount(row[6]);
  const status = row[7];
  const invStatus = row[8];
  const delStatus = row[9];
  const upcoming = parseAmount(row[10]);

  if (status === 'Sales Order') {
    salesCount++;
    salesTotalUSD += total;
    if (invStatus === 'To Invoice') {
      toInvoiceUSD += total;
    }
    if (delStatus === 'Fully Delivered' && invStatus !== 'Fully Invoiced') {
      deliveredNotInvUSD += total;
    }
  } else {
    quoteCount++;
    quoteTotalUSD += total;
  }

  if (rep) {
    if (!repMap[rep]) repMap[rep] = { ordersCount: 0, quotesCount: 0, salesUSD: 0, quotesUSD: 0 };
    if (status === 'Sales Order') {
      repMap[rep].ordersCount++;
      repMap[rep].salesUSD += total;
    } else {
      repMap[rep].quotesCount++;
      repMap[rep].quotesUSD += total;
    }
  }

  if (cust) {
    if (!custMap[cust]) custMap[cust] = { orders: 0, salesUSD: 0, quotesUSD: 0 };
    if (status === 'Sales Order') {
      custMap[cust].salesUSD += total;
      custMap[cust].orders++;
    } else {
      custMap[cust].quotesUSD += total;
    }
  }

  salesList.push({
    orderRef: ref,
    date,
    customer: cust,
    opportunity: opp,
    salesperson: rep,
    totalUSD: total,
    totalEGP: Math.round(total * 50),
    status,
    invoiceStatus: invStatus,
    deliveryStatus: delStatus,
    upcomingPayment: upcoming,
  });
}

console.log('\n--- SALES SUMMARY ---');
console.log('Confirmed Sales Orders Count:', salesCount, 'Total USD: $' + Math.round(salesTotalUSD).toLocaleString());
console.log('Active Quotations Count:', quoteCount, 'Total USD: $' + Math.round(quoteTotalUSD).toLocaleString());
console.log('Total Pipeline (Sales + Quotes): $' + Math.round(salesTotalUSD + quoteTotalUSD).toLocaleString());
console.log('Backlog To Invoice: $' + Math.round(toInvoiceUSD).toLocaleString());
console.log('Delivered but Not Invoiced: $' + Math.round(deliveredNotInvUSD).toLocaleString());

const topReps = Object.entries(repMap).sort((a,b) => b[1].salesUSD - a[1].salesUSD);
console.log('\nTop Sales Reps (Confirmed Sales):');
topReps.forEach(([r, d]) => console.log(`  ${r}: Orders: ${d.ordersCount} ($${Math.round(d.salesUSD).toLocaleString()}) | Quotes: ${d.quotesCount} ($${Math.round(d.quotesUSD).toLocaleString()})`));
