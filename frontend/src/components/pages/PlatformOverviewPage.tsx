import React from 'react';
import { 
  Network, 
  Package, 
  Handshake, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowUpRight, 
  Zap, 
  Store, 
  ShoppingCart
} from 'lucide-react';
import { Order, NegotiationLog } from '../../types/commerce';

interface PlatformOverviewPageProps {
  orders: Order[];
  negotiations: NegotiationLog[];
  onNavigate: (view: string) => void;
}

export const PlatformOverviewPage: React.FC<PlatformOverviewPageProps> = ({
  orders,
  negotiations,
  onNavigate,
}) => {
  const totalGmvPaise = orders.reduce((sum, o) => sum + (o.total_paise || 0), 0);
  const totalGmvDisplay = `₹${(totalGmvPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const totalTransactions = orders.length;
  const completedNegs = negotiations.filter(n => n.status === 'APPROVED' || n.status === 'COMPLETED').length;

  return (
    <div className="h-full bg-[#F7F8FA] overflow-y-auto p-6 lg:p-8 font-sans space-y-6">
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        
        {/* Network Header Banner */}
        <div className="bg-gradient-to-r from-[#0F1B2D] to-[#1B3A4B] rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#528FF0] tracking-wider uppercase">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              AgentPay Multi-Agent Protocol Engine
            </div>
            <h1 className="text-xl md:text-2xl font-black mt-1 tracking-tight">
              Autonomous Commerce Clearinghouse
            </h1>
            <p className="text-xs text-white/70 mt-1 max-w-2xl">
              Decentralized settlement protocol connecting autonomous consumer procurement agents with merchant storefronts via deterministic Policy Decision Points and Razorpay Tool Gateways.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Network Live · 3 Nodes Active
            </span>
          </div>
        </div>

        {/* 4 Protocol Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-[#8C97A4]">
              <span className="text-xs font-semibold uppercase tracking-wider">Settled Network GMV</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                ₹
              </div>
            </div>
            <div className="text-2xl font-black text-[#1B2733] tracking-tight">{totalGmvDisplay}</div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              100% Real-time Captured
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-[#8C97A4]">
              <span className="text-xs font-semibold uppercase tracking-wider">A2A Transactions</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#528FF0]">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-[#1B2733] tracking-tight">{totalTransactions} Orders</div>
            <div className="text-[11px] text-[#5F6D7E]">
              Settled across network nodes
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-[#8C97A4]">
              <span className="text-xs font-semibold uppercase tracking-wider">A2A Handshakes</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Handshake className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-[#1B2733] tracking-tight">{negotiations.length} Sessions</div>
            <div className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
              <span>{completedNegs} Settled Agreements</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-[#8C97A4]">
              <span className="text-xs font-semibold uppercase tracking-wider">Tool Gateway Auth</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-[#1B2733] tracking-tight">100% Policy Gated</div>
            <div className="text-[11px] text-[#5F6D7E]">
              Zero unverified money movement
            </div>
          </div>

        </div>

        {/* Network Nodes Topology Section */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#1B2733] flex items-center gap-2">
                <Network className="w-4 h-4 text-[#528FF0]" />
                Active Network Topology & Node Health
              </h2>
              <p className="text-xs text-[#5F6D7E] mt-0.5">
                Decentralized nodes communicating through HTTP protocol payloads and capability tokens.
              </p>
            </div>
            <button
              onClick={() => onNavigate('nodes')}
              className="text-xs font-semibold text-[#528FF0] hover:text-[#3A6FD8] flex items-center gap-1"
            >
              <span>View Full Graph</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            
            {/* Merchant Node */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold">
                    <Store className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-[#1B2733]">Merchant Node</div>
                    <div className="text-[10px] text-gray-500">Ramana Mobile Hub</div>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="space-y-1 text-[11px] text-gray-600">
                <div className="flex justify-between">
                  <span>Endpoint:</span>
                  <code className="font-mono text-gray-800">http://localhost:8001</code>
                </div>
                <div className="flex justify-between">
                  <span>Policy Engine:</span>
                  <span className="font-semibold text-emerald-600">PDP L0–L4 Active</span>
                </div>
              </div>
            </div>

            {/* Buyer Node */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#528FF0] text-white flex items-center justify-center font-bold">
                    <ShoppingCart className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-[#1B2733]">Buyer Agent Node</div>
                    <div className="text-[10px] text-gray-500">Autonomous Procurement</div>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="space-y-1 text-[11px] text-gray-600">
                <div className="flex justify-between">
                  <span>Endpoint:</span>
                  <code className="font-mono text-gray-800">http://localhost:8002</code>
                </div>
                <div className="flex justify-between">
                  <span>Mandate Triggers:</span>
                  <span className="font-semibold text-[#528FF0]">Active & Listening</span>
                </div>
              </div>
            </div>

            {/* Razorpay Gateway */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-[#1B2733]">Tool Gateway</div>
                    <div className="text-[10px] text-gray-500">Razorpay API Layer</div>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="space-y-1 text-[11px] text-gray-600">
                <div className="flex justify-between">
                  <span>Authorization:</span>
                  <span className="font-semibold text-indigo-600">Scoped Tokens</span>
                </div>
                <div className="flex justify-between">
                  <span>Environment:</span>
                  <span className="font-mono text-gray-800">Test Mode (INR)</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Recent Multi-Agent Settlement Ledger Feed */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden space-y-0">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#1B2733] flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-600" />
                Recent Network Settlements
              </h2>
              <p className="text-xs text-[#5F6D7E] mt-0.5">
                Real-time transactions settled through autonomous multi-agent handshakes.
              </p>
            </div>
            <button
              onClick={() => onNavigate('orders')}
              className="text-xs font-semibold text-[#528FF0] hover:text-[#3A6FD8] flex items-center gap-1"
            >
              <span>View All ({orders.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-400 space-y-2">
              <Package className="w-10 h-10 mx-auto text-gray-300" />
              <div>No settlements recorded yet. Once a buyer agent completes a purchase, it will appear here instantly.</div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-semibold text-[#8C97A4] uppercase">
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Order / Session</th>
                  <th className="px-6 py-3.5">Settled Amount</th>
                  <th className="px-6 py-3.5">Razorpay Order ID</th>
                  <th className="px-6 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.slice(0, 6).map((order, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono text-gray-500 whitespace-nowrap">
                      {order.created_at ? new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Just now'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#1B2733]">
                      <div className="font-mono text-xs text-gray-900">{order.order_id}</div>
                      <div className="text-[10px] text-gray-400 font-normal">Session: {order.session_id}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-[#1B2733]">
                      ₹{((order.total_paise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      {order.razorpay_order_id ? (
                        <span className="font-mono text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          {order.razorpay_order_id}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Pre-authorized</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        SETTLED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
};
