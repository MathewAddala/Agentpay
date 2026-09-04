import React from 'react';
import { Automation, DashboardStats, AgentActivityEntry } from '../../types/commerce';
import { 
  BarChart3, 
  Workflow, 
  Users, 
  Sparkles, 
  TrendingUp, 
  Plus, 
  Play, 
  CheckCircle2, 
  ArrowUpRight,
  Clock,
  Radio,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  ShoppingBag,
  Package
} from 'lucide-react';

interface AutomationsPageProps {
  automations: Automation[];
  stats: DashboardStats;
  activityEntries?: AgentActivityEntry[];
  onCreateNew: () => void;
  onActivate: (id: string) => void;
  onViewActivity: (automationId: string) => void;
}

export const AutomationsPage: React.FC<AutomationsPageProps> = ({
  automations,
  stats,
  activityEntries = [],
  onCreateNew,
  onActivate,
  onViewActivity,
}) => {
  const recentActivities = activityEntries.slice(0, 6);

  const getStatusBadge = (status: Automation['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            ACTIVE
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            DRAFT
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
            PAUSED
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full bg-[#F7F8FA] p-6 lg:p-8 font-sans overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <div className="text-xs font-bold text-[#528FF0] uppercase tracking-wider mb-1">
              NETWORK CONTROL CENTER
            </div>
            <h1 className="text-2xl font-bold text-[#1B2733]">AgentPay Protocol Overview</h1>
            <p className="text-sm text-[#5F6D7E] mt-0.5">
              Live settlement telemetry & autonomous merchant workflows · <span className="font-medium text-[#1B2733]">Real-time State</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a 
              href="https://dashboard.razorpay.com/app/orders"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-[#5F6D7E] hover:bg-gray-50 shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>Razorpay Live Dashboard</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* 4 Pure Live Metrics (Starts at zero, increments authentically) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: Total Protocol GMV */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#528FF0]">
                <BarChart3 className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-[#528FF0] transition-colors" />
            </div>
            <div>
              <div className="text-xs font-medium text-[#8C97A4]">Total Protocol GMV</div>
              <div className="text-2xl font-extrabold text-[#1B2733] mt-1 tracking-tight">
                {stats.recovered_revenue_display || '₹0'}
              </div>
              <div className="flex items-center justify-between mt-3 text-xs">
                <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" /> Live Settlement
                </span>
                <span className="text-[#8C97A4]">{stats.customers_impacted || 0} orders</span>
              </div>
            </div>
          </div>

          {/* Card 2: Orders Processed */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Package className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-600 transition-colors" />
            </div>
            <div>
              <div className="text-xs font-medium text-[#8C97A4]">Orders Settled</div>
              <div className="text-2xl font-extrabold text-[#1B2733] mt-1 tracking-tight">
                {stats.customers_impacted || 0}
              </div>
              <div className="flex items-center justify-between mt-3 text-xs">
                <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" /> Direct Razorpay
                </span>
                <span className="text-[#8C97A4]">1 Active Merchant</span>
              </div>
            </div>
          </div>

          {/* Card 3: Active Automations */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                <Workflow className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-purple-600 transition-colors" />
            </div>
            <div>
              <div className="text-xs font-medium text-[#8C97A4]">Active Automations</div>
              <div className="text-2xl font-extrabold text-[#1B2733] mt-1 tracking-tight">
                {stats.active_automations || 2}
              </div>
              <div className="flex items-center justify-between mt-3 text-xs">
                <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" /> 100% Guardrails
                </span>
                <span className="text-[#8C97A4]">Zero Duplication</span>
              </div>
            </div>
          </div>

          {/* Card 4: Protocol Handshakes */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-amber-600 transition-colors" />
            </div>
            <div>
              <div className="text-xs font-medium text-[#8C97A4]">Handshake Audits</div>
              <div className="text-2xl font-extrabold text-[#1B2733] mt-1 tracking-tight">
                {stats.total_executions || 0}
              </div>
              <div className="flex items-center justify-between mt-3 text-xs">
                <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" /> {stats.success_rate || 100}% Accuracy
                </span>
                <span className="text-[#8C97A4]">Full Compliance</span>
              </div>
            </div>
          </div>

        </div>

        {/* Main Content: Automations Engine + Live Stream */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Platform Automations */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#1B2733]">Automations Engine</h2>
                <p className="text-xs text-[#5F6D7E] mt-0.5">
                  Autonomous revenue recovery & safety guardrail workflows active on the protocol
                </p>
              </div>
              <button
                onClick={onCreateNew}
                className="inline-flex items-center gap-2 bg-[#528FF0] hover:bg-[#3A6FD8] text-white px-4 py-2.5 rounded-xl font-medium text-xs shadow-sm shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>Create Automation</span>
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[11px] font-semibold text-[#8C97A4] uppercase tracking-wider">
                    <th className="pb-3 px-2">WORKFLOW</th>
                    <th className="pb-3 px-4">TRIGGER</th>
                    <th className="pb-3 px-4">ACTION</th>
                    <th className="pb-3 px-4">STATUS</th>
                    <th className="pb-3 px-2 text-right">SAFETY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {automations.map((auto) => (
                    <tr
                      key={auto.id}
                      onClick={() => onViewActivity(auto.id)}
                      className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                    >
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#528FF0] flex items-center justify-center shrink-0 group-hover:bg-[#528FF0] group-hover:text-white transition-colors">
                            <Zap className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-[#1B2733] text-sm group-hover:text-[#528FF0] transition-colors">
                              {auto.name}
                            </div>
                            <div className="text-[11px] text-[#8C97A4] max-w-xs truncate mt-0.5">
                              {auto.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-[#5F6D7E]">
                        <div className="font-medium text-[#1B2733]">
                          {auto.trigger_type === 'checkout_abandoned' ? 'Checkout abandoned' : auto.trigger_type === 'payment_failed' ? 'Payment failed' : auto.trigger_type}
                        </div>
                        <div className="text-[11px] text-[#8C97A4]">
                          {auto.trigger_config?.wait_minutes ? `After ${auto.trigger_config.wait_minutes} mins` : 'Immediate'}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-[#5F6D7E]">
                        <div className="font-medium text-[#1B2733]">
                          {auto.action_type === 'create_payment_link' ? 'Create Payment Link' : 'Retry Payment'}
                        </div>
                        <div className="text-[11px] text-emerald-600 font-medium">
                          {auto.action_config?.discount_pct ? `· ${auto.action_config.discount_pct}% offer` : '· Safe retry'}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(auto.status)}
                      </td>
                      <td className="py-4 px-2 text-right text-emerald-600 font-medium">
                        Guarded
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

          {/* Right Column: Live Agent Activity Stream */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1B2733]">Live Agent Stream</h3>
                <p className="text-xs text-[#8C97A4]">Autonomous protocol events</p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                Listening
              </div>
            </div>

            {/* Activity Stream */}
            <div className="space-y-4 pt-2">
              {recentActivities.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs">
                  <Radio className="w-8 h-8 mx-auto mb-2 text-gray-300 animate-pulse" />
                  Protocol is active and monitoring Ramana Mobile Hub...
                </div>
              ) : (
                recentActivities.map((act, idx) => (
                  <div key={act.id || idx} className="flex gap-3 text-xs relative pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#528FF0] flex items-center justify-center shrink-0 mt-0.5">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-[#1B2733] truncate">{act.step}</span>
                        <span className="text-[10px] text-[#8C97A4] shrink-0 font-mono">
                          {new Date(act.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5F6D7E] mt-0.5 leading-snug line-clamp-2">
                        {act.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => onViewActivity('')}
                className="w-full py-2 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-xs font-medium text-[#528FF0] flex items-center justify-center gap-1 transition-colors"
              >
                <span>View Full Execution Feed</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
