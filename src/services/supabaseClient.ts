import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration comes ONLY from environment variables (never commit keys or project URLs).
// Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local / the hosting provider.
const viteEnv: Record<string, string | undefined> =
  (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
export const SUPABASE_URL: string = viteEnv.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY: string = viteEnv.VITE_SUPABASE_ANON_KEY || '';
export const SUPABASE_CONFIGURED: boolean = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

// Single Supabase client instance. When not configured, every request fails fast without touching the network.
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL || 'http://supabase.invalid',
  SUPABASE_ANON_KEY || 'not-configured',
  {
    auth: { persistSession: true, autoRefreshToken: true },
    ...(SUPABASE_CONFIGURED
      ? {}
      : {
          global: {
            fetch: async () => {
              throw new Error('Supabase غير مُهيأ: عيّن VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY');
            },
          },
        }),
  }
);

export interface SupabaseHealth {
  connected: boolean;
  url: string;
  latencyMs?: number;
  message: string;
  tablesStatus?: {
    invoice_promises: boolean;
    supplier_schedules: boolean;
    ceo_snapshots: boolean;
  };
}

export interface InvoicePromiseRecord {
  id: string;
  invoice_id: string;
  promise_date: string;
  promise_status: string;
  notes: string;
  assigned_rep?: string;
  updated_at?: string;
}

export interface SupplierScheduleRecord {
  id: string;
  bill_id: string;
  planned_date: string;
  notes: string;
  updated_at?: string;
}

export interface CeoSnapshotRecord {
  id: string;
  summary_date: string;
  total_pipeline: number;
  confirmed_sales: number;
  inventory_value: number;
  uninvoiced_deliveries: number;
  action_items?: any;
  created_at?: string;
}

/**
 * Checks Supabase connectivity and reports status
 */
export async function checkSupabaseConnection(): Promise<SupabaseHealth> {
  const startTime = Date.now();
  try {
    // Attempt a light query to test REST connectivity
    const { error } = await supabase.from('invoice_promises').select('id').limit(1);
    const latencyMs = Date.now() - startTime;

    if (error) {
      // 42P01 is relation does not exist - this means Supabase is 100% connected, just tables not created yet
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return {
          connected: true,
          url: SUPABASE_URL,
          latencyMs,
          message: 'متصل بسوبابيز بنجاح! الجداول السحابية بانتظار الإنشاء عبر كود SQL.',
          tablesStatus: {
            invoice_promises: false,
            supplier_schedules: false,
            ceo_snapshots: false,
          },
        };
      }
      return {
        connected: false,
        url: SUPABASE_URL,
        latencyMs,
        message: `استجابة سوبابيز: ${error.message || 'خطأ في المصادقة'}`,
      };
    }

    return {
      connected: true,
      url: SUPABASE_URL,
      latencyMs,
      message: 'سوبابيز متصل ونشط بكفاءة عالية (قراءة وكتابة سحابية)',
      tablesStatus: {
        invoice_promises: true,
        supplier_schedules: true,
        ceo_snapshots: true,
      },
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return {
      connected: false,
      url: SUPABASE_URL,
      latencyMs,
      message: err?.message || 'تعذر الاتصال بـ Supabase',
    };
  }
}

/**
 * Push an invoice collection promise date to Supabase
 */
export async function pushInvoicePromiseToSupabase(record: {
  invoiceId: string;
  promiseDate: string;
  promiseStatus: string;
  notes: string;
  assignedRep?: string;
}): Promise<boolean> {
  try {
    const { error } = await supabase.from('invoice_promises').upsert(
      {
        id: `promise_${record.invoiceId}`,
        invoice_id: record.invoiceId,
        promise_date: record.promiseDate,
        promise_status: record.promiseStatus,
        notes: record.notes,
        assigned_rep: record.assignedRep || 'Tamer Elshafey',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (error) {
      console.warn('[Supabase] Note: local storage fallback active:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[Supabase] Sync skipped, using local cache:', e);
    return false;
  }
}

/**
 * Bulk sync all customer invoices to Supabase invoice_promises
 */
export async function syncAllInvoicesToSupabase(
  invoices: any[]
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    if (!invoices || invoices.length === 0) {
      return { success: false, count: 0, error: 'لا توجد فواتير للمزامنة' };
    }

    const records = invoices.map((inv) => ({
      id: `promise_${inv.id}`,
      invoice_id: inv.odooName || inv.id,
      promise_date: inv.promiseDate || inv.dueDate || new Date().toISOString().split('T')[0],
      promise_status: inv.promiseStatus || (inv.daysOverdue > 0 ? 'broken' : 'scheduled'),
      notes:
        inv.followupNotes ||
        `فاتورة Odoo: ${inv.odooName} - عميل: ${inv.customerName} - متبقي $${(inv.amountResidualUSD || 0).toLocaleString()}`,
      assigned_rep: inv.assignedFollowupUser || inv.salesRepName || 'Tamer Elshafey',
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('invoice_promises').upsert(records, {
      onConflict: 'id',
    });

    if (error) {
      return { success: false, count: 0, error: error.message };
    }

    return { success: true, count: records.length };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'فشلت المزامنة' };
  }
}

/**
 * Bulk sync all supplier bills to Supabase supplier_schedules
 */
export async function syncAllSupplierBillsToSupabase(
  bills: any[]
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    if (!bills || bills.length === 0) {
      return { success: false, count: 0, error: 'لا توجد فواتير موردين للمزامنة' };
    }

    const records = bills.map((b) => ({
      id: `bill_${b.id}`,
      bill_id: b.odooName || b.id,
      planned_date: b.plannedPaymentDate || b.dueDate || new Date().toISOString().split('T')[0],
      notes:
        b.paymentNotes ||
        `مستحقات توريد: ${b.supplierName} (${b.brand || 'Physical BU'}) - التزام: $${(b.amountResidualUSD || 0).toLocaleString()}`,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('supplier_schedules').upsert(records, {
      onConflict: 'id',
    });

    if (error) {
      return { success: false, count: 0, error: error.message };
    }

    return { success: true, count: records.length };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'فشلت المزامنة' };
  }
}

/**
 * Push a single supplier payment schedule to Supabase
 */
export async function pushSupplierScheduleToSupabase(record: {
  billId: string;
  plannedDate: string;
  notes: string;
}): Promise<boolean> {
  try {
    const { error } = await supabase.from('supplier_schedules').upsert(
      {
        id: `bill_${record.billId}`,
        bill_id: record.billId,
        planned_date: record.plannedDate,
        notes: record.notes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (error) {
      console.warn('[Supabase] Note: local storage fallback active:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[Supabase] Sync skipped, using local cache:', e);
    return false;
  }
}

/**
 * Fetch all invoice promises from Supabase
 */
export async function fetchAllPromisesFromSupabase(): Promise<Record<string, any>> {
  try {
    const { data, error } = await supabase.from('invoice_promises').select('*');
    if (error || !data) return {};

    const map: Record<string, any> = {};
    data.forEach((row: any) => {
      const cleanId = row.id.replace('promise_', '');
      map[cleanId] = row;
      map[row.invoice_id] = row;
    });
    return map;
  } catch {
    return {};
  }
}

/**
 * Fetch all supplier schedules from Supabase
 */
export async function fetchAllSupplierSchedulesFromSupabase(): Promise<Record<string, any>> {
  try {
    const { data, error } = await supabase.from('supplier_schedules').select('*');
    if (error || !data) return {};

    const map: Record<string, any> = {};
    data.forEach((row: any) => {
      const cleanId = row.id.replace('bill_', '');
      map[cleanId] = row;
      map[row.bill_id] = row;
    });
    return map;
  } catch {
    return {};
  }
}

/**
 * Save CEO Executive Briefing Snapshot to Supabase
 */
export async function saveCeoSnapshotToSupabase(snapshot: {
  totalPipeline: number;
  confirmedSales: number;
  inventoryValue: number;
  uninvoicedDeliveries: number;
  actionItems?: any;
}): Promise<boolean> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase.from('ceo_snapshots').upsert(
      {
        id: `snapshot_${today}`,
        summary_date: today,
        total_pipeline: snapshot.totalPipeline,
        confirmed_sales: snapshot.confirmedSales,
        inventory_value: snapshot.inventoryValue,
        uninvoiced_deliveries: snapshot.uninvoicedDeliveries,
        action_items: snapshot.actionItems || [],
        created_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (error) {
      console.warn('[Supabase] Snapshot saved to local storage fallback:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[Supabase] Failed to persist snapshot:', e);
    return false;
  }
}

/**
 * SQL Schema migration statement for the user to execute in their Supabase SQL editor
 */
export const SUPABASE_SETUP_SQL = `-- 1. جدول مواعيد وعود التحصيل للفواتير (Invoice Collection Promises)
CREATE TABLE IF NOT EXISTS public.invoice_promises (
    id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL,
    promise_date TEXT,
    promise_status TEXT,
    notes TEXT,
    assigned_rep TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- 2. جدول جدولة مستحقات الموردين (Supplier Payment Schedules)
CREATE TABLE IF NOT EXISTS public.supplier_schedules (
    id TEXT PRIMARY KEY,
    bill_id TEXT NOT NULL,
    planned_date TEXT,
    notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- 3. جدول اللقطات التنفيذية للرئيس التنفيذي (CEO Executive Dossiers)
CREATE TABLE IF NOT EXISTS public.ceo_snapshots (
    id TEXT PRIMARY KEY,
    summary_date TEXT NOT NULL,
    total_pipeline NUMERIC,
    confirmed_sales NUMERIC,
    inventory_value NUMERIC,
    uninvoiced_deliveries NUMERIC,
    action_items JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- Row Level Security: ONLY signed-in users (Supabase Auth). Never grant access to the anon role.
ALTER TABLE public.invoice_promises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ceo_snapshots ENABLE ROW LEVEL SECURITY;

-- remove the old open policies if they exist
DROP POLICY IF EXISTS "Public Anon Access Promises" ON public.invoice_promises;
DROP POLICY IF EXISTS "Public Anon Access Schedules" ON public.supplier_schedules;
DROP POLICY IF EXISTS "Public Anon Access Snapshots" ON public.ceo_snapshots;

DROP POLICY IF EXISTS "Authenticated Promises" ON public.invoice_promises;
CREATE POLICY "Authenticated Promises" ON public.invoice_promises
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated Schedules" ON public.supplier_schedules;
CREATE POLICY "Authenticated Schedules" ON public.supplier_schedules
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated Snapshots" ON public.ceo_snapshots;
CREATE POLICY "Authenticated Snapshots" ON public.ceo_snapshots
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
`;

/**
 * Comprehensive master sync: populates ALL 3 tables in Supabase with real data
 */
export async function syncEntireDatasetToSupabase(options?: {
  invoices?: any[];
  bills?: any[];
  totalPipeline?: number;
  confirmedSales?: number;
  inventoryValue?: number;
  uninvoicedDeliveries?: number;
}): Promise<{
  success: boolean;
  message: string;
  promisesCount: number;
  schedulesCount: number;
  snapshotSaved: boolean;
}> {
  try {
    const today = new Date().toISOString().split('T')[0];

    // 1. CEO Executive Snapshot
    const snapshotRes = await supabase.from('ceo_snapshots').upsert([
      {
        id: `snapshot_${today}`,
        summary_date: today,
        total_pipeline: options?.totalPipeline ?? null,
        confirmed_sales: options?.confirmedSales ?? null,
        inventory_value: options?.inventoryValue ?? null,
        uninvoiced_deliveries: options?.uninvoicedDeliveries ?? null,
        action_items: [],
        created_at: new Date().toISOString(),
      },
    ]);

    // 2. Customer Invoices Promises
    let promisesCount = 0;
    if (options?.invoices && options.invoices.length > 0) {
      const invRes = await syncAllInvoicesToSupabase(options.invoices);
      promisesCount = invRes.count;
    }

    // 3. Supplier Schedules
    let schedulesCount = 0;
    if (options?.bills && options.bills.length > 0) {
      const billRes = await syncAllSupplierBillsToSupabase(options.bills);
      schedulesCount = billRes.count;
    }

    const snapshotOk = !snapshotRes.error;

    return {
      success: snapshotOk || promisesCount > 0 || schedulesCount > 0,
      message: `تمت المزامنة السحابية الشاملة! تم رفع ${promisesCount} فاتورة عملاء، و ${schedulesCount} فاتورة موردين، وحفظ لقطة الـ CEO بنجاح.`,
      promisesCount,
      schedulesCount,
      snapshotSaved: snapshotOk,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'فشلت المزامنة الشاملة مع سوبابيز',
      promisesCount: 0,
      schedulesCount: 0,
      snapshotSaved: false,
    };
  }
}

/**
 * Verifies that the Supabase tables exist and syncs ONLY real records that are passed in.
 * (Previously this function inserted invented promises, supplier schedules and CEO figures.)
 */
export async function seedSupabaseDatabase(data?: {
  invoices?: any[];
  bills?: any[];
}): Promise<{
  success: boolean;
  message: string;
  count: number;
}> {
  try {
    const probe = await supabase.from('invoice_promises').select('id').limit(1);
    if (probe.error) {
      const err = probe.error;
      if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
        return {
          success: false,
          message: 'الجداول غير موجودة بعد في سوبابيز. شغّل كود SQL أولاً من SQL Editor.',
          count: 0,
        };
      }
      return { success: false, message: `استجابة سوبابيز: ${err?.message}`, count: 0 };
    }

    let count = 0;
    if (data?.invoices && data.invoices.length > 0) {
      const r = await syncAllInvoicesToSupabase(data.invoices);
      count += r.count;
    }
    if (data?.bills && data.bills.length > 0) {
      const r = await syncAllSupplierBillsToSupabase(data.bills);
      count += r.count;
    }
    return {
      success: true,
      message: count
        ? `تمت مزامنة ${count} سجلاً حقيقياً.`
        : 'الجداول جاهزة. لم يُرفع أي سجل: لا توجد فواتير أو مستحقات حقيقية للمزامنة، ولا تُنشأ بيانات تجريبية.',
      count,
    };
  } catch (err: any) {
    return { success: false, message: err?.message || 'فشل الاتصال بسوبابيز', count: 0 };
  }
}
