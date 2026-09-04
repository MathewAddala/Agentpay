import React, { useEffect, useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { AutomationsPage } from './components/pages/AutomationsPage';
import { PlatformOverviewPage } from './components/pages/PlatformOverviewPage';
import { AuditPage } from './components/pages/AuditPage';
import { OrdersPage } from './components/pages/OrdersPage';
import { BuyerAgentPage, ChatMessage, OrderStatus } from './components/pages/BuyerAgentPage';
import { MerchantAgentPage, MerchantChatMessage, MerchantPolicy, CatalogItem } from './components/pages/MerchantAgentPage';
import { NegotiationsView } from './components/NegotiationsView';
import { PolicyDecisionView } from './components/PolicyDecisionView';
import { api } from './services/api';
import {
  Automation,
  AgentActivityEntry,
  DashboardStats,
  RecoveryResult,
  SimulatedCustomer,
  Order,
  NegotiationLog,
  CompiledPolicy,
  PolicyDecisionLog,
} from './types/commerce';
import { Search, Bell, Store, ShoppingCart, RefreshCw, Layers, Network, Server, ShieldCheck, CheckCircle2, ArrowUpRight } from 'lucide-react';

// ── Top Bar Component ────────────────────────────────────────
const TopBar: React.FC<{
  greeting: string;
  subtitle: string;
  badge?: string;
  onResetDb?: () => void;
}> = ({ greeting, subtitle, badge, onResetDb }) => (
  <div className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0 select-none">
    <div className="flex items-center gap-3">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-[15px] font-bold text-[#1B2733] leading-tight">{greeting}</h1>
          {badge && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
              {badge}
            </span>
          )}
        </div>
        <p className="text-[11px] text-[#8C97A4]">{subtitle}</p>
      </div>
    </div>

    <div className="flex items-center gap-2.5">
      <div className="hidden sm:flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-1.5 w-64 border border-gray-100">
        <Search className="w-3.5 h-3.5 text-[#8C97A4]" />
        <input
          type="text"
          placeholder="Search network ledger..."
          className="bg-transparent text-xs text-[#1B2733] placeholder-[#8C97A4] outline-none flex-1"
        />
        <span className="text-[9px] text-[#8C97A4] bg-white border border-gray-200 px-1 py-0.5 rounded font-mono">⌘K</span>
      </div>

      {onResetDb && (
        <button
          onClick={onResetDb}
          title="Reset & Flush Database"
          className="px-2.5 py-1.5 bg-gray-50 hover:bg-red-50 text-[#5F6D7E] hover:text-red-600 border border-gray-200 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
        >
          <RefreshCw className="w-3 h-3" />
          <span className="hidden md:inline">Flush DB</span>
        </button>
      )}

      <button className="w-8 h-8 rounded-lg hover:bg-gray-50 flex items-center justify-center text-[#5F6D7E] transition-colors relative">
        <Bell className="w-4 h-4" />
        <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#528FF0] rounded-full"></span>
      </button>

      <div className="w-8 h-8 bg-[#528FF0] rounded-xl flex items-center justify-center text-white text-xs font-bold ml-1 shadow-sm">
        AP
      </div>
    </div>
  </div>
);

// ── Standalone Buyer Portal (/buyer or Port 8002) ────────────
const BuyerStandalone: React.FC = () => {
  const [activeItem, setActiveItem] = useState('procurement');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [buyerSessionId, setBuyerSessionId] = useState<string>(() => 'sess-' + Math.random().toString(36).substring(2, 10));
  const [currentOrder, setCurrentOrder] = useState<OrderStatus | null>(null);
  const [orderHistory, setOrderHistory] = useState<OrderStatus[]>([]);
  const [negotiations, setNegotiations] = useState<NegotiationLog[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadBuyerOrders = useCallback(async () => {
    const [ords, negs] = await Promise.all([
      api.getOrders(),
      api.getNegotiations(),
    ]);
    if (ords && ords.length > 0) {
      const mapped: OrderStatus[] = ords.map((o: any) => ({
        session_id: o.session_id || o.order_id,
        status: o.status === 'completed' || o.status === 'paid' ? 'completed' : 'processing',
        items: Array.isArray(o.items) ? o.items : [],
        subtotal_paise: o.subtotal_paise,
        discount_pct: o.discount_pct,
        total_paise: o.total_paise,
        razorpay_order_id: o.razorpay_order_id,
      }));
      setOrderHistory(mapped);
    }
    if (negs) setNegotiations(negs);
  }, []);

  useEffect(() => {
    loadBuyerOrders();
    const interval = setInterval(loadBuyerOrders, 5000);
    return () => clearInterval(interval);
  }, [loadBuyerOrders]);

  const handleSend = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`, role: 'user', content: text, timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);
    setCurrentOrder({ session_id: buyerSessionId, status: 'processing', current_step: 'Negotiating with Ramana Mobile Hub...' });

    try {
      const historyPayload = messages.map((m) => ({ role: m.role, content: m.content }));
      const result = await api.buyerAgentChat(text, historyPayload, buyerSessionId);
      if (result.session_id) setBuyerSessionId(result.session_id);
      setMessages((prev) => [...prev, {
        id: `msg-${Date.now()}-agent`,
        role: 'agent',
        content: result.agent_response,
        timestamp: new Date().toISOString(),
        data: result.items?.length ? { items: result.items, total_paise: result.total_paise } : undefined,
      }]);

      if (result.items?.length > 0) {
        const orderStatus: OrderStatus = {
          session_id: result.session_id || '',
          razorpay_order_id: result.razorpay_order_id,
          status: result.razorpay_order_id ? 'completed' : 'negotiating',
          items: result.items.map((i: any) => ({
            name: i.name,
            quantity: i.quantity || 1,
            price_paise: i.price_paise,
            discounted_price_paise: i.discounted_price_paise || i.price_paise,
          })),
          subtotal_paise: result.subtotal_paise,
          discount_pct: result.discount_pct,
          total_paise: result.total_paise,
          current_step: result.razorpay_order_id ? 'Confirmed' : 'Negotiating',
        };
        setCurrentOrder(orderStatus);
        if (result.razorpay_order_id) {
          setOrderHistory((prev) => [orderStatus, ...prev]);
        }
      }
      await loadBuyerOrders();
    } catch (err: any) {
      setMessages((prev) => [...prev, {
        id: `msg-${Date.now()}-err`, role: 'agent', content: `Error: ${err.message}`, timestamp: new Date().toISOString(),
      }]);
      setCurrentOrder(null);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#F7F8FA] overflow-hidden font-sans">
      <Sidebar variant="buyer" activeItem={activeItem} onNavigate={setActiveItem} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          greeting="Buyer Procurement Assistant"
          subtitle="Shop, compare and auto-negotiate mobile accessories with Ramana Mobile Hub"
          badge="Direct Consumer App"
        />
        <main className="flex-1 overflow-hidden">
          <BuyerAgentPage
            activeView={activeItem}
            messages={messages}
            currentOrder={currentOrder}
            orderHistory={orderHistory}
            negotiations={negotiations}
            isProcessing={isProcessing}
            onSendMessage={handleSend}
          />
        </main>
      </div>
    </div>
  );
};

// ── Standalone Merchant Portal (/merchant or Port 8001) ───────
const MerchantStandalone: React.FC = () => {
  const [activeItem, setActiveItem] = useState('console');
  const [messages, setMessages] = useState<MerchantChatMessage[]>([]);
  const [policies, setPolicies] = useState<MerchantPolicy[]>([
    { label: 'Bulk Discount', value: '10% on 2+ items' },
    { label: 'First-Time Buyer', value: '5% off' },
    { label: 'Maximum Discount Cap', value: '20%' },
    { label: 'Minimum Order', value: '₹200' },
    { label: 'Maximum Order', value: '₹50,000' },
  ]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [activityEntries, setActivityEntries] = useState<AgentActivityEntry[]>([]);
  const [negotiations, setNegotiations] = useState<NegotiationLog[]>([]);
  const [compiledPolicies, setCompiledPolicies] = useState<CompiledPolicy[]>([]);
  const [policyDecisions, setPolicyDecisions] = useState<PolicyDecisionLog[]>([]);
  const [recoveryResult, setRecoveryResult] = useState<RecoveryResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadMerchantData = useCallback(async () => {
    const [catRes, pols, ords, audits, autos, acts, negs, compPols, pDecs] = await Promise.all([
      api.getCatalog(),
      api.getMerchantPolicies(),
      api.getOrders(),
      api.getAuditTrail(),
      api.getAutomations(),
      api.getAgentActivity(),
      api.getNegotiations(),
      api.getCompiledPolicies(),
      api.getPolicyDecisions(),
    ]);
    if (catRes?.products) setCatalog(catRes.products);
    if (pols?.length) setPolicies(pols);
    if (ords) setOrders(ords);
    if (audits) setAuditLogs(audits);
    if (autos?.length) setAutomations(autos);
    if (acts) setActivityEntries(acts);
    if (negs) setNegotiations(negs);
    if (compPols) setCompiledPolicies(compPols);
    if (pDecs) setPolicyDecisions(pDecs);
  }, []);

  useEffect(() => {
    loadMerchantData();
    const interval = setInterval(loadMerchantData, 5000);
    return () => clearInterval(interval);
  }, [loadMerchantData]);

  const handleSend = async (text: string) => {
    setMessages((prev) => [...prev, {
      id: `msg-${Date.now()}`, role: 'user', content: text, timestamp: new Date().toISOString(),
    }]);
    setIsProcessing(true);

    try {
      const historyPayload = messages.map((m) => ({ role: m.role, content: m.content }));
      const result = await api.merchantAgentChat(text, historyPayload);
      setMessages((prev) => [...prev, {
        id: `msg-${Date.now()}-agent`, role: 'agent', content: result.agent_response,
        timestamp: new Date().toISOString(),
        data: result.policy_updates?.length ? { updates: result.policy_updates } : undefined,
      }]);
      if (result.current_policies?.length) {
        setPolicies(result.current_policies);
      }
      await loadMerchantData();
    } catch (err: any) {
      setMessages((prev) => [...prev, {
        id: `msg-${Date.now()}-err`, role: 'agent', content: `Error: ${err.message}`, timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTriggerRecovery = async (automationId: string, customer: SimulatedCustomer, forceFailure: boolean) => {
    setIsProcessing(true);
    setRecoveryResult(null);
    try {
      const result = await api.triggerEvent(automationId, customer, forceFailure);
      if (result.activity) setActivityEntries(result.activity);
      if (result.outcome) {
        setRecoveryResult({
          customer_name: customer.name,
          cart_value_paise: customer.cart_value_paise,
          offer_text: result.outcome.success ? '10% OFF' : '',
          razorpay_order_id: result.outcome.razorpay_entity_id,
          reason: result.outcome.success ? 'Customer abandoned a qualifying cart. Recovery action executed.' : '',
          failed: !result.outcome.success,
          failure_reason: result.outcome.failure_reason,
          agent_refusal_reason: result.outcome.agent_reasoning,
        });
      }
      await loadMerchantData();
    } catch (err) {
      console.error('Recovery failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#F7F8FA] overflow-hidden font-sans">
      <Sidebar variant="merchant" activeItem={activeItem} onNavigate={setActiveItem} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          greeting="Ramana Mobile Hub Console"
          subtitle="Configure discount rules, manage recovery automations, and review live stock"
          badge="Mr. Ramana Store App"
        />
        <main className="flex-1 overflow-hidden">
          <MerchantAgentPage
            activeView={activeItem}
            messages={messages}
            policies={policies}
            catalog={catalog}
            orders={orders}
            auditLogs={auditLogs}
            automations={automations}
            activityEntries={activityEntries}
            recoveryResult={recoveryResult}
            negotiations={negotiations}
            compiledPolicies={compiledPolicies}
            policyDecisions={policyDecisions}
            isProcessing={isProcessing}
            onSendMessage={handleSend}
            onTriggerEvent={handleTriggerRecovery}
          />
        </main>
      </div>
    </div>
  );
};

// ── Network Topology Sub-View for Platform Dashboard ─────────
const NetworkTopologyView: React.FC = () => (
  <div className="h-full bg-[#F7F8FA] p-6 lg:p-8 font-sans overflow-y-auto">
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#1B2733] flex items-center gap-2">
          <Network className="w-5 h-5 text-[#528FF0]" />
          AgentPay Protocol Topology & Node Health
        </h1>
        <p className="text-xs text-[#5F6D7E] mt-0.5">
          Decentralized network nodes participating in autonomous commerce handshakes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Node 1: Merchant Node */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <span className="w-10 h-10 rounded-xl bg-emerald-50 text-[#1CA672] flex items-center justify-center font-bold">
              <Store className="w-5 h-5" />
            </span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              ONLINE
            </span>
          </div>
          <div>
            <div className="font-bold text-sm text-[#1B2733]">Merchant Node</div>
            <div className="text-xs text-[#5F6D7E]">Ramana Mobile Hub</div>
            <div className="font-mono text-[11px] text-[#528FF0] mt-2">http://localhost:8001</div>
          </div>
          <div className="pt-2 border-t border-gray-100 text-[11px] text-[#8C97A4] space-y-1">
            <div className="flex justify-between"><span>Protocol:</span><span className="font-mono text-[#1B2733]">A2A Handshake/v1</span></div>
            <div className="flex justify-between"><span>Catalog:</span><span className="font-medium text-[#1B2733]">10 Mobile Accessories</span></div>
            <div className="flex justify-between"><span>Policies:</span><span className="font-medium text-emerald-600">Dynamic Negotiation</span></div>
          </div>
        </div>

        {/* Node 2: Buyer Node */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <span className="w-10 h-10 rounded-xl bg-blue-50 text-[#528FF0] flex items-center justify-center font-bold">
              <ShoppingCart className="w-5 h-5" />
            </span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              ONLINE
            </span>
          </div>
          <div>
            <div className="font-bold text-sm text-[#1B2733]">Buyer Agent Node</div>
            <div className="text-xs text-[#5F6D7E]">Procurement Assistant</div>
            <div className="font-mono text-[11px] text-[#528FF0] mt-2">http://localhost:8002</div>
          </div>
          <div className="pt-2 border-t border-gray-100 text-[11px] text-[#8C97A4] space-y-1">
            <div className="flex justify-between"><span>Engine:</span><span className="font-mono text-[#1B2733]">Groq LLaMA 3.3 70B</span></div>
            <div className="flex justify-between"><span>Mode:</span><span className="font-medium text-[#1B2733]">Autonomous Buyer</span></div>
            <div className="flex justify-between"><span>Handshake:</span><span className="font-medium text-blue-600">Automated</span></div>
          </div>
        </div>

        {/* Node 3: Settlement Gateway */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <span className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              CONNECTED
            </span>
          </div>
          <div>
            <div className="font-bold text-sm text-[#1B2733]">Settlement Gateway</div>
            <div className="text-xs text-[#5F6D7E]">Razorpay Live Orders API</div>
            <div className="font-mono text-[11px] text-purple-600 mt-2">api.razorpay.com</div>
          </div>
          <div className="pt-2 border-t border-gray-100 text-[11px] text-[#8C97A4] space-y-1">
            <div className="flex justify-between"><span>Mode:</span><span className="font-mono text-[#1B2733]">Live Test Keys</span></div>
            <div className="flex justify-between"><span>Orders API:</span><span className="font-medium text-emerald-600">Operational</span></div>
            <div className="flex justify-between"><span>Currency:</span><span className="font-medium text-[#1B2733]">INR (Paise)</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ── Platform Provider Dashboard (Port 8080) ───────────────────
const Dashboard: React.FC = () => {
  const [activeItem, setActiveItem] = useState('overview');
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [activityEntries, setActivityEntries] = useState<AgentActivityEntry[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [negotiations, setNegotiations] = useState<NegotiationLog[]>([]);
  const [compiledPolicies, setCompiledPolicies] = useState<CompiledPolicy[]>([]);
  const [policyDecisions, setPolicyDecisions] = useState<PolicyDecisionLog[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    active_automations: 2, total_executions: 0, recovered_revenue_paise: 0,
    recovered_revenue_display: '₹0', abandoned_checkouts: 0, recoverable_amount_paise: 0,
    recoverable_amount_display: '₹0', customers_impacted: 0, potential_revenue_display: '₹0', success_rate: 100,
  });

  const loadData = useCallback(async () => {
    const [autos, st, acts, ords, audits, negs, compPols, pDecs] = await Promise.all([
      api.getAutomations(),
      api.getStats(),
      api.getAgentActivity(),
      api.getOrders(),
      api.getAuditTrail(),
      api.getNegotiations(),
      api.getCompiledPolicies(),
      api.getPolicyDecisions(),
    ]);
    if (autos?.length) setAutomations(autos);
    if (st) setStats(st);
    if (acts) setActivityEntries(acts);
    if (ords) setOrders(ords);
    if (audits) setAuditLogs(audits);
    if (negs) setNegotiations(negs);
    if (compPols) setCompiledPolicies(compPols);
    if (pDecs) setPolicyDecisions(pDecs);
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleResetDb = async () => {
    if (window.confirm('Flush all demo orders and reset metrics to clean state?')) {
      await api.resetDatabase();
      await loadData();
      alert('Database flushed and reset to clean state!');
    }
  };

  const renderContent = () => {
    switch (activeItem) {
      case 'overview':
        return (
          <PlatformOverviewPage
            orders={orders}
            negotiations={negotiations}
            onNavigate={setActiveItem}
          />
        );
      case 'orders':
        return <OrdersPage orders={orders} onRefresh={loadData} />;
      case 'negotiations':
        return <NegotiationsView variant="dashboard" negotiations={negotiations} />;
      case 'audit':
        return <AuditPage entries={activityEntries} auditLogs={auditLogs} />;
      case 'nodes':
        return <NetworkTopologyView />;
      default:
        return (
          <PlatformOverviewPage
            orders={orders}
            negotiations={negotiations}
            onNavigate={setActiveItem}
          />
        );
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#F7F8FA] overflow-hidden font-sans">
      <Sidebar variant="dashboard" activeItem={activeItem} onNavigate={setActiveItem} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          greeting="AgentPay Platform Dashboard"
          subtitle="Real-time Merchant Revenue Agent & Automated Settlement Network"
          badge="Platform Provider Studio"
          onResetDb={handleResetDb}
        />
        <main className="flex-1 overflow-hidden">{renderContent()}</main>
      </div>
    </div>
  );
};

// ── App Router (Detects dedicated service port or URL path) ──
export const App: React.FC = () => {
  const port = window.location.port;
  const path = window.location.pathname;

  // Dedicated Port 8001 -> Merchant Store Portal
  if (port === '8001' || path === '/merchant') {
    return <MerchantStandalone />;
  }

  // Dedicated Port 8002 -> Consumer Buyer Portal
  if (port === '8002' || path === '/buyer') {
    return <BuyerStandalone />;
  }

  // Dedicated Port 8080 -> Platform Provider Dashboard
  return <Dashboard />;
};
