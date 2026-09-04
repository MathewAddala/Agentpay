import React, { useState } from 'react';
import { Automation, AgentActivityEntry, SimulatedCustomer, RecoveryResult } from '../../types/commerce';
import { CheckCircle2, ArrowRight, AlertTriangle, XCircle, ExternalLink, RefreshCw, PauseCircle, Activity, Loader2 } from 'lucide-react';

interface ActivityPageProps {
  automations: Automation[];
  activityEntries: AgentActivityEntry[];
  recoveryResult: RecoveryResult | null;
  isSimulating: boolean;
  onSimulate: (automationId: string, customer: SimulatedCustomer, forceFailure: boolean) => void;
}

const customer1: SimulatedCustomer = {
  name: 'Rahul Sharma',
  email: 'rahul.sharma@example.com',
  cart_value_paise: 189800,
  items: ['65W GaN Dual-Port Fast Charger', '2m Braided 100W PD Cable'],
};

const customer2: SimulatedCustomer = {
  name: 'Priya Patel',
  email: 'priya.patel@example.com',
  cart_value_paise: 249800,
  items: ['10,000mAh MagSafe Power Bank', 'Military Shockproof Armor Case'],
};

export const ActivityPage: React.FC<ActivityPageProps> = ({
  automations,
  activityEntries,
  recoveryResult,
  isSimulating,
  onSimulate,
}) => {
  const activeAutomations = automations.filter((a) => a.status === 'active');
  const [selectedAutomationId, setSelectedAutomationId] = useState<string>(
    activeAutomations.length > 0 ? activeAutomations[0].id : ''
  );

  const getStatusIcon = (status: AgentActivityEntry['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 bg-white" />;
      case 'pending':
        return <ArrowRight className="w-4 h-4 text-blue-500 bg-white" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500 bg-white" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500 bg-white" />;
    }
  };

  const getEntryClass = (status: AgentActivityEntry['status']) => {
    switch (status) {
      case 'error':
        return 'bg-red-50 text-red-700';
      case 'warning':
        return 'bg-amber-50 text-amber-700';
      default:
        return 'text-[#1B2733]';
    }
  };

  return (
    <div className="h-full w-full bg-[#F7F8FA] overflow-y-auto p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN (~58%): Agent Activity Feed & Recovery Result */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6">
              <h2 className="text-base font-bold text-[#1B2733] flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-[#528FF0]" />
                Store Recovery Activity Feed
              </h2>

              {activityEntries.length === 0 ? (
                <div className="text-center py-10 text-xs text-[#8C97A4]">
                  Revenue Agent is listening for cart abandonment events...
                </div>
              ) : (
                <div className="relative border-l border-gray-200 ml-3 space-y-3">
                  {activityEntries.map((entry, idx) => (
                    <div key={idx} className={`relative flex items-start pl-5 p-2 rounded-lg text-xs ${getEntryClass(entry.status)}`}>
                      <div className="absolute -left-[9px] top-2">
                        {getStatusIcon(entry.status)}
                      </div>
                      <div className="flex gap-3 items-start w-full">
                        <span className="font-mono text-[11px] text-[#8C97A4] shrink-0 mt-0.5">
                          {new Date(entry.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <p className="text-xs leading-relaxed font-medium">
                          {entry.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recovery Action Result */}
            {recoveryResult && (
              <div
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden text-xs ${
                  recoveryResult.failed ? 'border-red-200' : 'border-emerald-200'
                }`}
              >
                {!recoveryResult.failed ? (
                  <div className="p-6 relative border-l-4 border-emerald-500 space-y-4">
                    <h3 className="text-xs font-bold tracking-wider text-[#8C97A4] uppercase">Recovery Action Completed</h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between border-b border-gray-100 pb-1.5">
                        <span className="text-[#5F6D7E]">Customer</span>
                        <span className="font-semibold text-[#1B2733]">{recoveryResult.customer_name}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-1.5">
                        <span className="text-[#5F6D7E]">Cart Value</span>
                        <span className="font-semibold text-[#1B2733]">₹{(recoveryResult.cart_value_paise / 100).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-1.5">
                        <span className="text-[#5F6D7E]">Offer Applied</span>
                        <span className="font-bold text-emerald-600">{recoveryResult.offer_text}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-1.5">
                        <span className="text-[#5F6D7E]">Razorpay Order</span>
                        <span className="font-mono font-bold text-[#528FF0]">{recoveryResult.razorpay_order_id || 'N/A'}</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[11px] font-medium text-[#5F6D7E] mb-1">Reasoning</h4>
                      <p className="text-[#1B2733] text-xs leading-relaxed bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                        {recoveryResult.reason}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 relative border-l-4 border-red-500 space-y-3">
                    <h3 className="text-xs font-bold tracking-wider text-red-600 uppercase flex items-center gap-1.5">
                      <PauseCircle className="w-4 h-4" />
                      Automation Paused (Safety Guardrail)
                    </h3>
                    <p className="text-[#1B2733] font-medium text-xs">I could not create the payment link due to a Razorpay gateway error.</p>
                    <p className="text-[#5F6D7E] text-xs font-medium">The agent did NOT retry because:</p>
                    <ul className="list-disc pl-5 text-xs text-[#5F6D7E] space-y-1">
                      <li>Payment action could be duplicated</li>
                      <li>Maximum retry policy = 1</li>
                      <li>Zero money was moved</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN (~42%): Event Trigger Panel */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-5">
              <div className="flex items-baseline justify-between border-b border-gray-100 pb-3">
                <h2 className="text-sm font-bold text-[#1B2733]">Trigger Recovery Event</h2>
                <span className="text-[10px] font-semibold text-[#8C97A4] uppercase tracking-wider">Abandoned Checkouts</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5F6D7E] mb-1.5">Target Automation Rule</label>
                <select
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-[#1B2733] focus:outline-none focus:border-[#528FF0] shadow-2xs"
                  value={selectedAutomationId}
                  onChange={(e) => setSelectedAutomationId(e.target.value)}
                  disabled={activeAutomations.length === 0}
                >
                  {activeAutomations.length === 0 ? (
                    <option value="">No active automations</option>
                  ) : (
                    activeAutomations.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-4">
                {/* Card 1 */}
                <div className="border border-gray-200/80 rounded-2xl p-4 hover:border-blue-300 transition-all bg-gray-50/40 text-xs space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[#5F6D7E]">Customer:</span>
                      <span className="text-[#1B2733] font-semibold">{customer1.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5F6D7E]">Cart Value:</span>
                      <span className="text-[#1B2733] font-bold">₹{(customer1.cart_value_paise / 100).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5F6D7E]">Items:</span>
                      <span className="text-[#1B2733] text-right max-w-[65%] truncate">{customer1.items.join(', ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5F6D7E]">Status:</span>
                      <span className="text-amber-600 font-semibold">Checkout abandoned</span>
                    </div>
                  </div>
                  <button
                    className="w-full flex items-center justify-center gap-1.5 bg-[#528FF0] hover:bg-[#3A6FD8] text-white font-semibold py-2 px-3 rounded-xl transition-all text-xs disabled:opacity-50 shadow-sm"
                    onClick={() => onSimulate(selectedAutomationId, customer1, false)}
                    disabled={!selectedAutomationId || isSimulating}
                  >
                    {isSimulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    <span>Trigger Recovery (Success Path)</span>
                  </button>
                </div>

                {/* Card 2 */}
                <div className="border border-gray-200/80 rounded-2xl p-4 hover:border-red-300 transition-all bg-gray-50/40 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-100">
                      Triggers API Failure Scenario
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[#5F6D7E]">Customer:</span>
                      <span className="text-[#1B2733] font-semibold">{customer2.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5F6D7E]">Cart Value:</span>
                      <span className="text-[#1B2733] font-bold">₹{(customer2.cart_value_paise / 100).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5F6D7E]">Items:</span>
                      <span className="text-[#1B2733] text-right max-w-[65%] truncate">{customer2.items.join(', ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5F6D7E]">Status:</span>
                      <span className="text-amber-600 font-semibold">Checkout abandoned</span>
                    </div>
                  </div>
                  <button
                    className="w-full flex items-center justify-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-[#1B2733] font-semibold py-2 px-3 rounded-xl transition-all text-xs disabled:opacity-50"
                    onClick={() => onSimulate(selectedAutomationId, customer2, true)}
                    disabled={!selectedAutomationId || isSimulating}
                  >
                    {isSimulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                    <span>Trigger Recovery (Failed Path)</span>
                  </button>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
