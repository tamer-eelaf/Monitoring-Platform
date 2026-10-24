import React from 'react';
import {
  TrendingUp,
  Award,
  Users,
  Target,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Briefcase,
  ShieldCheck
} from 'lucide-react';
import { BUStaffPerformance } from '../../types';

interface TeamViewProps {
  staffPerformance?: BUStaffPerformance[];
}

export const TeamView: React.FC<TeamViewProps> = ({ staffPerformance = [] }) => {
  const buMembers = staffPerformance.filter((s) => s.isBU);
  const outsideBUMembers = staffPerformance.filter((s) => !s.isBU);

  const totalBUSales = buMembers.reduce((sum, s) => sum + s.buBrandsSalesUSD, 0);
  const totalCrossSales = outsideBUMembers.reduce((sum, s) => sum + s.buBrandsSalesUSD, 0);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            فريق مبيعات إدارة Physical Security BU في Odoo (Team ID: 35)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            فصل مبيعات مناديب الإدارة المعتمدين في Odoo عن مبيعات مناديب باقي أقسام شركة مصر
          </p>
        </div>

        {/* Aggregate Sales Split */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2">
            <div className="text-[10px] text-slate-400">مبيعات مناديب الإدارة:</div>
            <div className="text-base font-bold font-mono text-emerald-400">
              ${totalBUSales.toLocaleString()}
            </div>
          </div>
          <div className="bg-slate-900 border border-purple-900/60 rounded-xl px-3.5 py-2">
            <div className="text-[10px] text-purple-300">مبيعات الأقسام الخارجية لتوكيلاتك:</div>
            <div className="text-base font-bold font-mono text-purple-400">
              ${totalCrossSales.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Real Team Verified Banner */}
      <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-xs text-slate-200 leading-relaxed flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>تم التحقق من ربط الفريق المعتمد:</strong> فريق <strong>Physical Security BU (ID: 35)</strong> المسجل في <code className="font-mono text-emerald-300">crm.team</code> بقاعدة Odoo، برئاسة <strong className="text-white">Tamer Elshafey</strong>.
          </span>
        </div>
        <span className="text-[11px] font-mono text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700">
          قاعدة حية: eelaf-master-21952014
        </span>
      </div>

      {/* Section 1: BU Core Team */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Award className="w-4 h-4 text-emerald-400" />
          أعضاء فريق Physical Security BU الحقيقيون ({buMembers.length} أعضاء)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {buMembers.map((member) => (
            <div
              key={member.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-sm">
                    {member.avatar}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">
                      {member.name}
                    </h4>
                    <p className="text-xs text-slate-400">{member.role}</p>
                  </div>
                </div>

                <div className="text-left font-mono">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {member.targetAchievementRate}% إنجاز
                  </span>
                </div>
              </div>

              {/* Progress to Target */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>المحقق من المستهدف:</span>
                  <span className="font-mono text-slate-200">
                    ${member.buBrandsSalesUSD.toLocaleString()} / ${member.targetUSD.toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(member.targetAchievementRate, 100)}%` }}
                    className="h-full bg-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* Collections & Outstanding AR */}
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-center text-xs">
                <div>
                  <div className="text-[10px] text-slate-500 font-sans">المحصل فعلياً</div>
                  <div className="text-xs font-bold text-emerald-400 mt-0.5">
                    ${member.collectionsUSD.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-sans">مديونية جارية</div>
                  <div className="text-xs font-bold text-amber-400 mt-0.5">
                    ${member.outstandingARUSD.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-sans">أوامر نشطة</div>
                  <div className="text-xs font-bold text-blue-400 mt-0.5">
                    {member.activeOrdersCount}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Cross-BU Sales */}
      {outsideBUMembers.length > 0 && (
        <div className="space-y-3 pt-3">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-purple-400" />
            مبيعات مناديب باقي أقسام الشركة لتوكيلاتك (Cross-BU Activity)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {outsideBUMembers.map((member) => (
              <div
                key={member.id}
                className="bg-slate-900 border border-purple-900/40 rounded-xl p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-950 text-purple-300 border border-purple-800 flex items-center justify-center font-bold text-sm">
                      {member.avatar}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">
                        {member.name}
                      </h4>
                      <p className="text-xs text-purple-300">{member.role}</p>
                    </div>
                  </div>

                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                    قسم خارجي
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between font-mono text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400 font-sans">
                      قيمة توكيلات PHY BU المبيعة في صفقته:
                    </div>
                    <div className="text-base font-bold text-purple-400 mt-0.5">
                      ${member.buBrandsSalesUSD.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] text-slate-500 font-sans">إجمالي صفقته</div>
                    <div className="text-xs text-slate-400">
                      ${member.totalSalesUSD.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
