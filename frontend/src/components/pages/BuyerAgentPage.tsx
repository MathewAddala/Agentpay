import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  ShoppingCart, 
  Package, 
  CheckCircle2, 
  ArrowRight,
  Clock,
  Sparkles,
  Zap,
  ExternalLink,
  Shield,
  ShoppingBag,
  ArrowUpRight,
  Flame,
  Receipt
} from 'lucide-react';
import { Order } from '../../types/commerce';

import { NegotiationLog } from '../../types/commerce';
import { NegotiationsView } from '../NegotiationsView';

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: string;
  data?: any;
}

export interface OrderStatus {
  session_id: string;
  status: 'processing' | 'negotiating' | 'payment_pending' | 'completed' | 'failed';
  items?: Array<{name: string; quantity: number; price_paise: number; discounted_price_paise?: number}>;
  subtotal_paise?: number;
  discount_pct?: number;
  total_paise?: number;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  current_step?: string;
  error?: string;
}

interface BuyerAgentPageProps {
  activeView?: string;
  messages: ChatMessage[];
  currentOrder: OrderStatus | null;
  orderHistory: OrderStatus[];
  negotiations?: NegotiationLog[];
  isProcessing: boolean;
  onSendMessage: (text: string) => void;
}

const QUICK_PROMPTS = [
  { label: '65W Fast Charger + 100W Cable', prompt: 'I want a 65W GaN dual-port charger and a braided 100W Type-C cable.' },
  { label: 'Case + Tempered Glass Combo', prompt: 'I need a military-grade shockproof armor case and 9H tempered glass pack.' },
  { label: '10,000mAh MagSafe Powerbank', prompt: 'Can you get me a 10,000mAh magnetic wireless power bank under ₹2,000?' },
  { label: 'Pro ANC Wireless Earbuds', prompt: 'I want the Pro ANC wireless earbuds with active noise cancellation.' },
];

export const BuyerAgentPage: React.FC<BuyerAgentPageProps> = ({
  activeView = 'procurement',
  messages,
  currentOrder,
  orderHistory,
  negotiations = [],
  isProcessing,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeView === 'procurement') {
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

  // Sub-view: A2A Negotiations & Handshakes
  if (activeView === 'negotiations') {
    return <NegotiationsView variant="buyer" negotiations={negotiations} />;
  }

  // Sub-view: My Orders & Receipts
  if (activeView === 'orders') {
    return (
      <div className="h-full bg-[#F7F8FA] p-6 font-sans overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-xl font-bold text-[#1B2733] flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#528FF0]" />
              My Orders & Payment Receipts
            </h1>
            <p className="text-xs text-[#5F6D7E] mt-0.5">
              Verified purchases negotiated through your Procurement Assistant with Ramana Mobile Hub.
            </p>
          </div>

          <div className="space-y-4">
            {orderHistory.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center text-gray-400 text-xs">
                <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                No purchases made yet. Tell your Procurement Agent what accessories you need to place your first order!
              </div>
            ) : (
              orderHistory.map((order, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-2">
                    <div>
                      <div className="text-[10px] font-semibold text-[#8C97A4] uppercase">Order Reference</div>
                      <div className="font-mono font-bold text-[#528FF0] text-sm">{order.session_id}</div>
                    </div>
                    {order.razorpay_order_id && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono bg-blue-50 text-[#528FF0] px-2.5 py-1 rounded-lg border border-blue-100">
                          {order.razorpay_order_id}
                        </span>
                        <a
                          href={`https://dashboard.razorpay.com/app/orders/${order.razorpay_order_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#528FF0] hover:text-[#3A6FD8] text-xs font-semibold flex items-center gap-0.5"
                        >
                          <span>Razorpay Order</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Line items */}
                  <div className="space-y-2 text-xs">
                    {order.items?.map((it, i) => (
                      <div key={i} className="flex justify-between items-center text-xs">
                        <span className="font-medium text-[#1B2733]">{it.name} (x{it.quantity || 1})</span>
                        <span className="font-bold text-[#1B2733]">
                          ₹{((it.discounted_price_paise || it.price_paise) / 100).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <CheckCircle2 className="w-3 h-3" />
                        Settlement Confirmed
                      </span>
                      {order.discount_pct ? (
                        <span className="text-[11px] font-semibold text-emerald-600">
                          {order.discount_pct}% Store Discount Applied
                        </span>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-[#8C97A4] mr-2">Paid:</span>
                      <span className="text-base font-extrabold text-[#528FF0]">
                        ₹{((order.total_paise || 0) / 100).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default Sub-view: Procurement Chat + Live Tracker
  return (
    <div className="h-full bg-[#F7F8FA] p-4 lg:p-6 font-sans flex flex-col overflow-hidden">
      <div className="max-w-7xl w-full mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 overflow-hidden">
        
        {/* LEFT COLUMN (~58%): Chat Interface */}
        <div className="lg:col-span-7 flex flex-col h-full bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#528FF0] flex items-center justify-center font-bold">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-sm text-[#1B2733]">Procurement Assistant</h2>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Online
                  </span>
                </div>
                <p className="text-[11px] text-[#8C97A4]">Shopping at: <span className="font-medium text-[#1B2733]">Ramana Mobile Hub</span></p>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-[#528FF0] text-xs font-semibold border border-blue-100/80">
                <Shield className="w-3.5 h-3.5" />
                <span>Auto-Negotiation</span>
              </div>
              <div className="text-[10px] text-[#5F6D7E] mt-0.5">
                {orderHistory.length} orders settled · Razorpay Live
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#528FF0] flex items-center justify-center shadow-inner">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div className="max-w-md space-y-1">
                  <h3 className="font-bold text-base text-[#1B2733]">How can I help you shop today?</h3>
                  <p className="text-xs text-[#5F6D7E] leading-relaxed">
                    Ask me for any mobile accessories from Ramana Mobile Hub. I will check store policies, negotiate the best discount, and place your order securely through Razorpay.
                  </p>
                </div>

                {/* Suggested Prompts */}
                <div className="w-full max-w-md pt-3">
                  <div className="text-[11px] font-semibold text-[#8C97A4] uppercase tracking-wider mb-2 flex items-center justify-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    Popular Inquiries
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                    {QUICK_PROMPTS.map((qp, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickPrompt(qp.prompt)}
                        className="p-2.5 rounded-xl border border-gray-200 bg-gray-50/60 hover:bg-blue-50/60 hover:border-[#528FF0]/40 text-[11px] text-[#1B2733] font-medium text-left transition-all hover:scale-[1.01]"
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
                    {msg.role === 'user' ? 'You' : 'Procurement Agent'} · {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#528FF0] text-white rounded-br-none shadow-sm'
                        : 'bg-gray-50 text-[#1B2733] border border-gray-200/80 rounded-bl-none shadow-sm space-y-3'
                    }`}
                  >
                    <div>{msg.content}</div>

                    {msg.data?.items && msg.data.items.length > 0 && (
                      <div className="pt-2 border-t border-gray-200/60 space-y-1.5">
                        <div className="font-semibold text-[#1B2733] text-[11px]">Items in Order:</div>
                        {msg.data.items.map((it: any, i: number) => (
                          <div key={i} className="flex justify-between items-center text-[11px] bg-white p-2 rounded-lg border border-gray-100">
                            <span className="font-medium text-[#1B2733]">{it.name} (x{it.quantity || 1})</span>
                            <span className="font-semibold text-[#1CA672]">
                              ₹{((it.discounted_price_paise || it.price_paise) / 100).toLocaleString('en-IN')}
                            </span>
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
                <div className="text-[10px] text-[#8C97A4] mb-1 px-1">Procurement Agent</div>
                <div className="bg-gray-50 text-[#5F6D7E] border border-gray-200 rounded-2xl rounded-bl-none p-3.5 text-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#528FF0] animate-ping"></span>
                  Checking Ramana Mobile Hub inventory & negotiating discounts...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-gray-100 bg-white">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 focus-within:border-[#528FF0] focus-within:bg-white transition-all shadow-inner">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="e.g., I need a 65W GaN charger and 2m braided cable under ₹2,000"
                className="flex-1 bg-transparent text-xs text-[#1B2733] placeholder-gray-400 outline-none py-1.5"
                disabled={isProcessing}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isProcessing}
                className={`p-2 rounded-lg transition-all ${
                  inputText.trim() && !isProcessing
                    ? 'bg-[#528FF0] text-white hover:bg-[#3A6FD8] shadow-sm'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

        </div>

        {/* RIGHT COLUMN (~42%): Live Multi-Step Order Tracker */}
        <div className="lg:col-span-5 flex flex-col gap-5 overflow-y-auto">
          
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#1B2733] flex items-center gap-2">
                <Package className="w-4 h-4 text-[#528FF0]" />
                Current Procurement Order
              </h3>
              {currentOrder?.status && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                  currentOrder.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700'
                }`}>
                  {currentOrder.status}
                </span>
              )}
            </div>

            {!currentOrder || (!currentOrder.items?.length && !currentOrder.razorpay_order_id) ? (
              <div className="p-8 text-center bg-gray-50/70 rounded-xl border border-dashed border-gray-200">
                <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs font-medium text-[#1B2733]">No active order in progress</p>
                <p className="text-[11px] text-[#8C97A4] mt-0.5">
                  Send a procurement request in chat to start an automated order handshake.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 3 Step Visual Progress */}
                <div className="grid grid-cols-3 gap-2 text-center text-[10px] pt-1">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px]">✓</div>
                    <span className="font-medium text-[#1B2733]">1. Intent</span>
                  </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px]">✓</div>
                      <span className="font-medium text-[#1B2733]">2. Handshake</span>
                    </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      currentOrder.razorpay_order_id ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white animate-pulse'
                    }`}>
                      {currentOrder.razorpay_order_id ? '✓' : '3'}
                    </div>
                    <span className="font-medium text-[#1B2733]">3. Razorpay</span>
                  </div>
                </div>

                {/* Items */}
                <div className="bg-gray-50 p-3.5 rounded-xl space-y-2 text-xs">
                  <div className="font-semibold text-[#1B2733] text-[11px] flex items-center justify-between">
                    <span>Selected Accessories</span>
                    {currentOrder.discount_pct && (
                      <span className="text-emerald-600 font-bold">-{currentOrder.discount_pct}% Discount Applied</span>
                    )}
                  </div>
                  {currentOrder.items?.map((it, i) => (
                    <div key={i} className="flex justify-between items-center text-[11px] border-b border-gray-100 last:border-0 pb-1">
                      <span className="text-[#5F6D7E] truncate max-w-[200px]">{it.name}</span>
                      <span className="font-medium text-[#1B2733]">
                        ₹{((it.discounted_price_paise || it.price_paise) / 100).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-200 flex justify-between font-bold text-xs text-[#1B2733]">
                    <span>Total Settlement</span>
                    <span className="text-[#528FF0]">
                      ₹{((currentOrder.total_paise || 0) / 100).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Razorpay Reference */}
                {currentOrder.razorpay_order_id && (
                  <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[10px] text-[#528FF0] font-semibold uppercase">Razorpay Order ID</div>
                      <div className="font-mono font-bold text-[#1B2733] text-xs">{currentOrder.razorpay_order_id}</div>
                    </div>
                    <a
                      href={`https://dashboard.razorpay.com/app/orders/${currentOrder.razorpay_order_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#528FF0] hover:text-[#3A6FD8] p-1.5 rounded-lg hover:bg-blue-100/50 transition-colors flex items-center gap-1"
                    >
                      <span className="text-[11px] font-semibold">View</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick History Card */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 space-y-3 flex-1 overflow-y-auto">
            <h3 className="font-bold text-sm text-[#1B2733] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#8C97A4]" />
              Recent Procurement Orders
            </h3>

            {orderHistory.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-400">
                No past orders in this session yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {orderHistory.map((hist, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[11px] font-semibold text-[#528FF0]">{hist.razorpay_order_id || hist.session_id}</span>
                      <span className="font-bold text-[#1B2733]">₹{((hist.total_paise || 0) / 100).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="text-[11px] text-[#5F6D7E] truncate">
                      {hist.items?.map((i) => i.name).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
