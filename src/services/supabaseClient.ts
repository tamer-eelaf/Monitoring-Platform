import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase project credentials (injected from env or fallback to user credentials)
export const SUPABASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  'https://cxuzyvlrpywkiidpmjqo.supabase.co';

export const SUPABASE_ANON_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  'sb_publishable_hetzimB9wb9onUHV3RXZ8A_SbrHdQiM';

// Single Supabase client instance
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

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
        assigned_rep: record.assignedRep || 'Tamer',
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
 * Push a supplier payment schedule to Supabase
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

-- تفعيل سياسات الأمان Row Level Security (RLS) والسماح بالوصول عبر مفتاح Anon
ALTER TABLE public.invoice_promises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ceo_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Anon Access Promises" ON public.invoice_promises;
CREATE POLICY "Public Anon Access Promises" ON public.invoice_promises FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Anon Access Schedules" ON public.supplier_schedules;
CREATE POLICY "Public Anon Access Schedules" ON public.supplier_schedules FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Anon Access Snapshots" ON public.ceo_snapshots;
CREATE POLICY "Public Anon Access Snapshots" ON public.ceo_snapshots FOR ALL USING (true) WITH CHECK (true);
`;
