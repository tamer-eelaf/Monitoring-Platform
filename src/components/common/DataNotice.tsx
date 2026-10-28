import { AlertTriangle, DatabaseZap, ShieldCheck } from 'lucide-react';

/** Slim banner: tells the reader whether the numbers are a static export snapshot or a live Odoo read. */
export function DataModeBanner({ mode, date }: { mode: 'snapshot' | 'live'; date: string }) {
  if (mode === 'live') {
    return (
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-800/60 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-300">
        <ShieldCheck className="h-4 w-4" />
        <span>اتصال حي بخادم Odoo (قراءة فقط).</span>
      </div>
    );
  }
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-amber-800/60 bg-amber-950/30 px-3 py-2 text-xs text-amber-300">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span className="font-bold">لقطة بيانات من تصديرات Odoo بتاريخ {date} — وليست اتصالاً حياً.</span>
      <span className="text-amber-400/80">
        غير متاح حالياً: الفواتير والتحصيلات، فواتير الموردين، حركات المخزون وأعماره، أسطر الأوامر (العلامة والتكلفة والهامش).
      </span>
    </div>
  );
}

/** Empty state for screens whose source data is not in the exports — never show invented numbers instead. */
export function DataGapNotice({ title, needs, why }: { title: string; needs: string[]; why: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
      <DatabaseZap className="mx-auto mb-3 h-8 w-8 text-amber-400" />
      <h2 className="mb-2 text-lg font-black text-slate-100">{title}</h2>
      <p className="mx-auto mb-4 max-w-xl text-sm leading-relaxed text-slate-400">{why}</p>
      <div className="mx-auto max-w-md rounded-xl border border-slate-800 bg-slate-950 p-4 text-right text-xs text-slate-300">
        <div className="mb-2 font-bold text-slate-200">المطلوب من Odoo:</div>
        <ul className="list-disc space-y-1 pr-5">
          {needs.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
