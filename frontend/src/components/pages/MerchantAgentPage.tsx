import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Store, 
  Package, 
  Shield, 
  Settings, 
  CreditCard, 
  CheckCircle2, 
  Sparkles,
  TrendingUp,
  ExternalLink,
  Sliders,
  Smartphone,
  Flame,
  ArrowUpRight,
  Clock,
  Search,
  Workflow,
  RefreshCw,
  AlertTriangle,
  PauseCircle,
  Loader2,
  Activity,
  Plus
} from 'lucide-react';
import {
  Automation,
  AgentActivityEntry,
  RecoveryResult,
  SimulatedCustomer,
  Order,
  NegotiationLog,
  CompiledPolicy,
  PolicyDecisionLog
} from '../../types/commerce';
import { NegotiationsView } from '../NegotiationsView';
import { PolicyDecisionView } from '../PolicyDecisionView';

export interface MerchantChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: string;
  data?: any;
}

export interface MerchantPolicy {
  key?: string;
  label: string;
  value: string;
  discount_pct?: number;
  min_items?: number;
  editable?: boolean;
}

export interface CatalogItem {
  id?: string;
  product_id?: string;
  name: string;
  category: string;
  price_paise?: number;
  price_display?: string;
  stock?: number;
  rating?: number;
}

interface MerchantAgentPageProps {
  activeView?: string;
  messages: MerchantChatMessage[];
  policies: MerchantPolicy[];
  catalog: CatalogItem[];
  orders?: Order[];
  auditLogs?: any[];
  automations?: Automation[];
  activityEntries?: AgentActivityEntry[];
  recoveryResult?: RecoveryResult | null;
  negotiations?: NegotiationLog[];
  compiledPolicies?: CompiledPolicy[];
  policyDecisions?: PolicyDecisionLog[];
  isProcessing: boolean;
  onSendMessage: (text: string) => void;
  onTriggerEvent?: (automationId: string, customer: SimulatedCustomer, forceFailure: boolean) => void;
}

const MERCHANT_PROMPTS = [
  { label: 'Set Bulk Discount to 15% on 2+ items', prompt: 'Set bulk discount to 15% for orders with 2 or more items.' },
  { label: 'Add 5% Student Discount Policy', prompt: 'Add a 5% discount policy for student verified accounts.' },
  { label: 'Set Maximum Order Limit to ₹1,00,000', prompt: 'Increase the store maximum order limit to ₹1,00,000.' },
  { label: 'What is our top selling category?', prompt: 'What are our top performing mobile accessory categories and active policies?' },
];

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

export const MerchantAgentPage: React.FC<MerchantAgentPageProps> = ({
  activeView = 'console',
  messages,
  policies,
  catalog,
  orders = [],
  auditLogs = [],
  automations = [],
  activityEntries = [],
  recoveryResult = null,
  negotiations = [],
  compiledPolicies = [],
  policyDecisions = [],
  isProcessing,
  onSendMessage,
  onTriggerEvent,
}) => {
  const [inputText, setInputText] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedAutoId, setSelectedAutoId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (automations.length > 0 && !selectedAutoId) {
      setSelectedAutoId(automations[0].id);
    }
  }, [automations, selectedAutoId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeView === 'console') {
      scrollToBottom();
    }
  }, [messages, isProcessing, activeView]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleQuickPrompt = (prompt: string) => {
    if (isProcessing) return;
    onSendMessage(prompt);
  };

  const filteredCatalog = catalog.filter((p) =>
    p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(catalogSearch.toLowerCase())
  );

  // Sub-view: Incoming Buyer Negotiations
  if (activeView === 'negotiations') {
    return <NegotiationsView variant="merchant" negotiations={negotiations} />;
  }

  // Sub-view: Policy Decision Point (PDP)
  if (activeView === 'pdp') {
    return (
      <div className="h-full bg-[#F7F8FA] p-6 font-sans overflow-y-auto">
        <div className="max-w-6xl mx-auto pb-12">
          <PolicyDecisionView
            compiledPolicies={compiledPolicies}
            decisions={policyDecisions}
          />
        </div>
      </div>
    );
  }

  // Sub-view: Catalog Table
  if (activeView === 'catalog') {
    return (
      <div className="h-full bg-[#F7F8FA] p-6 font-sans overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6 pb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-[#1B2733] flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#1CA672]" />
                Ramana Mobile Hub Inventory
              </h1>
              <p className="text-xs text-[#5F6D7E] mt-0.5">
                Manage your 10 quick-commerce mobile accessories and live stock availability.
              </p>
            </div>
            <div className="relative w-72">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search accessories by name, category..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-[#1CA672] shadow-2xs"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-semibold text-[#8C97A4] uppercase">
                  <th className="px-6 py-3.5">Product Name</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Stock</th>
                  <th className="px-6 py-3.5 text-right">Price</th>
                  <th className="px-6 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCatalog.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4 font-semibold text-[#1B2733]">
                      {item.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 text-[#5F6D7E] text-[11px] font-medium">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#5F6D7E]">
                      {item.stock || 50} units in stock
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-[#1B2733]">
                      {item.price_display}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Available for AI Negotiation
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Sub-view: Store Orders
  if (activeView === 'orders') {
    return (
      <div className="h-full bg-[#F7F8FA] p-6 font-sans overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6 pb-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-[#1B2733] flex items-center gap-2">
                <Package className="w-5 h-5 text-[#1CA672]" />
                Ramana Mobile Hub Store Orders
              </h1>
              <p className="text-xs text-[#5F6D7E] mt-0.5">
                Incoming orders placed by Buyer Agents & Cart Recovery automations.
              </p>
            </div>
            <div className="text-xs font-semibold text-[#1CA672] bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
              {orders.length} Total Orders Received
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
            {orders.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-xs">
                <Package className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                No orders received yet. When a buyer places an order via the Buyer Portal, it will appear here instantly!
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-semibold text-[#8C97A4] uppercase">
                    <th className="px-6 py-3.5">Order ID</th>
                    <th className="px-6 py-3.5">Customer</th>
                    <th className="px-6 py-3.5">Items Purchased</th>
                    <th className="px-6 py-3.5">Total Paid</th>
                    <th className="px-6 py-3.5">Razorpay Reference</th>
                    <th className="px-6 py-3.5 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((o) => (
                    <tr key={o.order_id} className="hover:bg-gray-50/60">
                      <td className="px-6 py-4 font-mono font-semibold text-[#528FF0]">
                        {o.order_id}
                      </td>
                      <td className="px-6 py-4 font-medium text-[#1B2733]">
                        {o.customer_name}
                      </td>
                      <td className="px-6 py-4 text-[#5F6D7E] max-w-xs truncate">
                        {Array.isArray(o.items) ? o.items.map((it: any) => it.name).join(', ') : 'Mobile Accessories'}
                      </td>
                      <td className="px-6 py-4 font-bold text-[#1CA672]">
                        ₹{((o.total_paise || 0) / 100).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 font-mono text-[11px] text-[#528FF0]">
                        {o.razorpay_order_id || '—'}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-400">
                        {new Date(o.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
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
  }

  // Sub-view: Policy Audit Log
  if (activeView === 'audit') {
    return (
      <div className="h-full bg-[#F7F8FA] p-6 font-sans overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6 pb-12">
          <div>
            <h1 className="text-xl font-bold text-[#1B2733] flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#1CA672]" />
              Store Policy Decisions & Handshake Logs
            </h1>
            <p className="text-xs text-[#5F6D7E] mt-0.5">
              Every negotiation and discount decision evaluated by Store AI on behalf of Mr. Ramana.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden divide-y divide-gray-100 text-xs">
            {auditLogs.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                No policy audits recorded yet.
              </div>
            ) : (
              auditLogs.map((log, idx) => (
                <div key={idx} className="p-4 hover:bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[11px] font-bold text-[#528FF0]">{log.session_id}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700">
                        {log.step}
                      </span>
                    </div>
                    <p className="text-[#1B2733] font-medium">{log.policy_decision || 'Handshake Evaluated'}</p>
                  </div>
                  <div className="text-[11px] text-gray-400 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  const totalMerchantRevPaise = orders.reduce((sum, o) => sum + (o.total_paise || 0), 0);

  // Default Sub-view: Console (Chat + Active Policies)
  return (
    <div className="h-full bg-[#F7F8FA] p-4 lg:p-6 font-sans flex flex-col overflow-hidden">
      <div className="max-w-7xl w-full mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 overflow-hidden">
        
        {/* LEFT COLUMN (~58%): Configuration Console */}
        <div className="lg:col-span-7 flex flex-col h-full bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#1CA672] flex items-center justify-center font-bold">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-sm text-[#1B2733]">Ramana Mobile Hub Console</h2>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Manager
                  </span>
                </div>
                <p className="text-[11px] text-[#8C97A4]">Store Owner: <span className="font-medium text-[#1B2733]">Mr. Ramana</span></p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-semibold text-[#1B2733]">
                Settled Revenue: <span className="font-bold text-[#1CA672]">₹{(totalMerchantRevPaise / 100).toLocaleString('en-IN')}</span>
              </div>
              <div className="text-[10px] text-[#5F6D7E] font-medium">
                {orders.length} Store Orders · Razorpay Live
              </div>
            </div>
          </div>

          {/* Chat Stream */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#1CA672] flex items-center justify-center shadow-inner">
                  <Sliders className="w-7 h-7" />
                </div>
                <div className="max-w-md space-y-1">
                  <h3 className="font-bold text-base text-[#1B2733]">Store Configuration Console</h3>
                  <p className="text-xs text-[#5F6D7E] leading-relaxed">
                    Configure store discount rules, bulk thresholds, and pricing policies through natural conversation.
                  </p>
                </div>

                <div className="w-full max-w-md pt-3">
                  <div className="text-[11px] font-semibold text-[#8C97A4] uppercase tracking-wider mb-2 text-center">
                    Quick Policy Actions
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                    {MERCHANT_PROMPTS.map((qp, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickPrompt(qp.prompt)}
                        className="p-2.5 rounded-xl border border-gray-200 bg-gray-50/60 hover:bg-emerald-50/60 hover:border-emerald-300 text-[11px] text-[#1B2733] font-medium text-left transition-all hover:scale-[1.01]"
                      >
                        {qp.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="text-[10px] text-[#8C97A4] mb-1 px-1">
                    {msg.role === 'user' ? 'Mr. Ramana' : 'Store AI Manager'} · {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#1CA672] text-white rounded-br-none shadow-sm'
                        : 'bg-gray-50 text-[#1B2733] border border-gray-200/80 rounded-bl-none shadow-sm space-y-2'
                    }`}
                  >
                    <div>{msg.content}</div>

                    {msg.data?.updates && msg.data.updates.length > 0 && (
                      <div className="pt-2 border-t border-gray-200/60 space-y-1">
                        <div className="font-semibold text-emerald-700 text-[11px]">Applied Policy Updates:</div>
                        {msg.data.updates.map((up: any, i: number) => (
                          <div key={i} className="text-[11px] bg-white p-2 rounded-lg border border-emerald-100 flex justify-between">
                            <span className="font-medium text-[#1B2733]">{up.label}</span>
                            <span className="font-bold text-[#1CA672]">{up.new_value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {isProcessing && (
              <div className="flex flex-col items-start">
                <div className="text-[10px] text-[#8C97A4] mb-1 px-1">Store AI Manager</div>
                <div className="bg-gray-50 text-[#5F6D7E] border border-gray-200 rounded-2xl rounded-bl-none p-3.5 text-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#1CA672] animate-ping"></span>
                  Updating Ramana Mobile Hub store policies...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-gray-100 bg-white">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 focus-within:border-[#1CA672] focus-within:bg-white transition-all shadow-inner">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="e.g., Set bulk discount to 15% for orders with 2+ items"
                className="flex-1 bg-transparent text-xs text-[#1B2733] placeholder-gray-400 outline-none py-1.5"
                disabled={isProcessing}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isProcessing}
                className={`p-2 rounded-lg transition-all ${
                  inputText.trim() && !isProcessing
                    ? 'bg-[#1CA672] text-white hover:bg-emerald-600 shadow-sm'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

        </div>

        {/* RIGHT COLUMN (~42%): Store Configuration Cards */}
        <div className="lg:col-span-5 flex flex-col gap-5 overflow-y-auto">
          
          {/* Active Policies Card */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#1B2733] flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#1CA672]" />
                Active Store Policies
              </h3>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                Enforced by AI
              </span>
            </div>

            <div className="space-y-2">
              {policies.map((pol, idx) => (
                <div key={idx} className="flex justify-between items-center p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                  <span className="text-[#5F6D7E] font-medium">{pol.label}</span>
                  <span className="font-bold text-[#1B2733] bg-white px-2.5 py-1 rounded-lg border border-gray-200 shadow-2xs">
                    {pol.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Product Catalog Compact Table */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 space-y-3 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm text-[#1B2733] flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#528FF0]" />
                Ramana Mobile Hub Catalog
              </h3>
              <span className="text-[10px] text-[#8C97A4] font-mono">10 Products</span>
            </div>

            <div className="overflow-y-auto flex-1 border border-gray-100 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/80 sticky top-0 border-b border-gray-200 text-[10px] font-semibold text-[#8C97A4] uppercase">
                    <th className="p-2.5">Product</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {catalog.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/60">
                      <td className="p-2.5 font-medium text-[#1B2733] truncate max-w-[150px]">
                        {item.name}
                      </td>
                      <td className="p-2.5 text-[#5F6D7E] text-[11px]">
                        {item.category}
                      </td>
                      <td className="p-2.5 text-right font-semibold text-[#1B2733]">
                        {item.price_display}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Razorpay Status */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#528FF0] flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-[#1B2733]">Razorpay Payment Gateway</div>
                <div className="text-[11px] text-[#1CA672] flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  Live settlement enabled
                </div>
              </div>
            </div>
            <a
              href="https://dashboard.razorpay.com/app/orders"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#528FF0] hover:text-[#3A6FD8] text-xs font-semibold flex items-center gap-1"
            >
              <span>Manage</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

        </div>

      </div>
    </div>
  );
};
