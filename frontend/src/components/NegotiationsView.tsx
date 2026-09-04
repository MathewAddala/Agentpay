import React, { useState } from 'react';
import { 
  Handshake, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Shield, 
  TrendingDown, 
  Clock, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  ShoppingBag
} from 'lucide-react';
import { NegotiationLog } from '../types/commerce';

interface NegotiationsViewProps {
  negotiations: NegotiationLog[];
  variant: 'buyer' | 'merchant' | 'dashboard';
  title?: string;
  subtitle?: string;
}

export const NegotiationsView: React.FC<NegotiationsViewProps> = ({
  negotiations,
  variant,
  title,
  subtitle
}) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const defaultTitle = variant === 'buyer' 
    ? 'A2A Procurement Negotiations' 
    : variant === 'merchant' 
    ? 'Incoming Buyer Negotiations' 
    : 'Network A2A Negotiation Registry';

  const defaultSubtitle = variant === 'buyer'
    ? 'Live audit trail of your autonomous agent negotiating pricing and discount floors with Ramana Mobile Hub'
    : variant === 'merchant'
    ? 'Live record of wholesale proposals received and evaluated against Mr. Ramana store policies'
    : 'Decentralized multi-agent negotiation logs and cryptographic handshake records across the network';

  // Metrics
  const totalNegs = negotiations.length;
  const approvedCount = negotiations.filter(n => n.status === 'APPROVED' || n.status === 'COMPLETED').length;
  const haltedCount = negotiations.filter(n => n.status === 'HALTED' || n.status === 'REJECTED').length;

  return (
    <div className="h-full flex flex-col bg-[#F7F8FA] overflow-y-auto p-6 space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-[#528FF0]">
              <Handshake className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#1B2733]">{title || defaultTitle}</h1>
              <p className="text-xs text-[#5F6D7E] mt-0.5">{subtitle || defaultSubtitle}</p>
            </div>
          </div>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-6">
          <div className="text-center md:text-left">
            <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Total Handshakes</div>
            <div className="text-base font-extrabold text-[#1B2733]">{totalNegs}</div>
          </div>
          <div className="h-7 w-px bg-gray-200" />
          <div className="text-center md:text-left">
            <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-600">Settled Deals</div>
            <div className="text-base font-extrabold text-emerald-600">{approvedCount}</div>
          </div>
          <div className="h-7 w-px bg-gray-200" />
          <div className="text-center md:text-left">
            <div className="text-[10px] uppercase font-bold tracking-wider text-amber-600">Budget Protected</div>
            <div className="text-base font-extrabold text-amber-600">{haltedCount}</div>
          </div>
        </div>
      </div>

      {/* Negotiation Logs List */}
      <div className="space-y-4">
        {negotiations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-[#528FF0] mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#1B2733]">No negotiations recorded yet</h3>
            <p className="text-xs text-[#5F6D7E] max-w-sm mx-auto mt-1">
              When a buyer requests a wholesale or custom discount, the autonomous agents will negotiate over HTTP and log each handshake here.
            </p>
          </div>
        ) : (
          negotiations.map((neg) => {
            const isCompleted = neg.status === 'COMPLETED' || neg.status === 'APPROVED';
            const isHalted = neg.status === 'HALTED' || neg.status === 'REJECTED';
            const isExpanded = expandedId === neg.id;

            const listPrice = neg.list_price_paise / 100;
            const buyerOffer = neg.buyer_offered_paise / 100;
            const counterPrice = (neg.merchant_counter_paise || neg.buyer_offered_paise) / 100;
            const savings = isCompleted ? Math.max(listPrice - counterPrice, 0) : 0;

            return (
              <div 
                key={neg.id} 
                className={`bg-white rounded-2xl border transition-all shadow-sm overflow-hidden ${
                  isCompleted 
                    ? 'border-emerald-200/80 hover:border-emerald-300' 
                    : isHalted 
                    ? 'border-amber-200/80 hover:border-amber-300' 
                    : 'border-blue-200/80 hover:border-blue-300'
                }`}
              >
                {/* Header Row */}
                <div 
                  onClick={() => toggleExpand(neg.id)}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-gray-50/50 transition-colors select-none"
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isCompleted 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' 
                        : isHalted 
                        ? 'bg-amber-50 text-amber-600 border border-amber-200/60' 
                        : 'bg-blue-50 text-blue-600 border border-blue-200/60'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : isHalted ? <Shield className="w-5 h-5" /> : <Handshake className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[#1B2733]">{neg.items_summary}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-gray-100 text-gray-600 font-semibold">
                          {neg.session_id}
                        </span>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          isCompleted 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : isHalted 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {neg.status === 'COMPLETED' 
                            ? (variant === 'merchant' ? 'Store Revenue Captured' : 'Settled & Verified') 
                            : neg.status === 'APPROVED' 
                            ? (variant === 'merchant' ? 'Proposal Accepted' : 'Approved') 
                            : neg.status === 'HALTED' 
                            ? (variant === 'merchant' ? 'Below Margin Floor' : 'Halted (Protected Budget)') 
                            : (variant === 'merchant' ? 'Counter-Offer Sent' : 'Counter-Offer Received')}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-[#5F6D7E] mt-1.5 flex-wrap">
                        <span>Round {neg.rounds || 1}</span>
                        <span>•</span>
                        {variant === 'merchant' ? (
                          <span>From Buyer: <strong className="text-gray-700">{neg.buyer_name}</strong></span>
                        ) : variant === 'buyer' ? (
                          <span>Seller: <strong className="text-gray-700">{neg.merchant_name}</strong></span>
                        ) : (
                          <>
                            <span>Buyer: <strong className="text-gray-700">{neg.buyer_name}</strong></span>
                            <span>➔</span>
                            <span>Merchant: <strong className="text-gray-700">{neg.merchant_name}</strong></span>
                          </>
                        )}
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono text-gray-500">
                          <Clock className="w-3 h-3" />
                          {new Date(neg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Summary Widget */}
                  <div className="flex items-center gap-4 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-gray-400">
                        {isCompleted 
                          ? (variant === 'merchant' ? 'Settled Store Revenue' : 'Final Settled Price') 
                          : 'List Value'}
                      </div>
                      <div className="text-sm font-extrabold text-[#1B2733]">
                        ₹{(isCompleted ? counterPrice : listPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    {isCompleted && savings > 0 && (
                      <div className="text-right bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-lg">
                        <div className="text-[9px] uppercase font-bold text-emerald-700">
                          {variant === 'merchant' ? 'Discount Granted' : 'You Saved'}
                        </div>
                        <div className="text-xs font-bold text-emerald-600">
                          -₹{savings.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                        </div>
                      </div>
                    )}

                    <button className="text-gray-400 hover:text-gray-600 p-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-5 space-y-4 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {variant === 'buyer' ? (
                        <>
                          {/* Step 1: Buyer Request */}
                          <div className="bg-white p-3.5 rounded-xl border border-gray-200/70 shadow-2xs">
                            <div className="text-[10px] uppercase font-bold text-blue-600 mb-1 flex items-center gap-1">
                              <ShoppingBag className="w-3 h-3" /> 1. Your Purchase Request
                            </div>
                            <div className="text-[#1B2733] font-semibold text-xs mt-1">
                              Offered: ₹{buyerOffer.toLocaleString('en-IN')}
                            </div>
                            <div className="text-[11px] text-gray-500 mt-0.5">
                              List Price: ₹{listPrice.toLocaleString('en-IN')}
                              {neg.buyer_target_discount_pct ? ` (Target: ${neg.buyer_target_discount_pct}% OFF)` : ''}
                            </div>
                            {neg.buyer_min_discount_pct ? (
                              <div className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-2 inline-block font-semibold">
                                Floor Preference: Min {neg.buyer_min_discount_pct}% OFF
                              </div>
                            ) : null}
                          </div>

                          {/* Step 2: Merchant Response */}
                          <div className="bg-white p-3.5 rounded-xl border border-gray-200/70 shadow-2xs">
                            <div className="text-[10px] uppercase font-bold text-emerald-600 mb-1 flex items-center justify-between">
                              <span className="flex items-center gap-1"><Handshake className="w-3 h-3" /> 2. Seller Offer & Terms</span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700">
                                {isCompleted ? 'Agreed' : 'Countered'}
                              </span>
                            </div>
                            <div className="text-[#1B2733] font-semibold text-xs mt-1">
                              {isCompleted ? `Settled Price: ₹${counterPrice.toLocaleString('en-IN')}` : `Merchant Counter: ₹${counterPrice.toLocaleString('en-IN')}`}
                            </div>
                            <div className="text-[11px] text-gray-500 mt-0.5">
                              {neg.merchant_allowed_discount_pct && neg.merchant_allowed_discount_pct > 0 
                                ? `Discount Granted: ${neg.merchant_allowed_discount_pct}% OFF` 
                                : 'Catalog Standard Rate (0% OFF)'}
                            </div>
                            <div className="text-[10px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded mt-2 inline-block truncate max-w-full">
                              {neg.policy_rationale || 'Ramana Mobile Hub rate confirmed'}
                            </div>
                          </div>

                          {/* Step 3: Receipt & Settlement */}
                          <div className={`p-3.5 rounded-xl border shadow-2xs ${
                            isCompleted 
                              ? 'bg-emerald-50/60 border-emerald-200/80 text-emerald-950' 
                              : 'bg-amber-50/60 border-amber-200/80 text-amber-950'
                          }`}>
                            <div className="text-[10px] uppercase font-bold mb-1 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> 3. Payment & Settlement
                            </div>
                            <div className="font-bold text-xs mt-1">
                              {isCompleted ? `Payment Confirmed: ₹${counterPrice.toLocaleString('en-IN')}` : 'Transaction Paused (Zero money moved)'}
                            </div>
                            {neg.razorpay_order_id ? (
                              <div className="mt-2 flex items-center gap-1.5 font-mono text-[10px] text-emerald-700 bg-white/80 px-2 py-1 rounded border border-emerald-200">
                                <span>Razorpay ID:</span>
                                <strong className="select-all">{neg.razorpay_order_id}</strong>
                              </div>
                            ) : (
                              <div className="text-[11px] text-amber-800 mt-1">
                                Buyer agent protected your budget. No payment link authorized.
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Step 1: Buyer Request (Merchant / Provider View) */}
                          <div className="bg-white p-3.5 rounded-xl border border-gray-200/70 shadow-2xs">
                            <div className="text-[10px] uppercase font-bold text-blue-600 mb-1 flex items-center gap-1">
                              <Zap className="w-3 h-3" /> 1. Buyer Offer Proposal
                            </div>
                            <div className="text-[#1B2733] font-semibold text-xs mt-1">
                              Proposed ₹{buyerOffer.toLocaleString('en-IN')}
                            </div>
                            <div className="text-[11px] text-gray-500 mt-0.5">
                              List Price: ₹{listPrice.toLocaleString('en-IN')}
                              {neg.buyer_target_discount_pct ? ` (Target: ${neg.buyer_target_discount_pct}% OFF)` : ''}
                            </div>
                            {neg.buyer_min_discount_pct ? (
                              <div className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-2 inline-block font-semibold">
                                Floor Constraint: Min {neg.buyer_min_discount_pct}% OFF
                              </div>
                            ) : null}
                          </div>

                          {/* Step 2: Policy Decision Point (PDP) */}
                          <div className="bg-white p-3.5 rounded-xl border border-gray-200/70 shadow-2xs">
                            <div className="text-[10px] uppercase font-bold text-indigo-600 mb-1 flex items-center justify-between">
                              <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> 2. Policy Decision Point (PDP)</span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700">L0–L4 Evaluated</span>
                            </div>
                            <div className="text-[#1B2733] font-semibold text-xs mt-1">
                              {neg.merchant_counter_paise ? `Counter: ₹${counterPrice.toLocaleString('en-IN')}` : (isCompleted ? 'Direct Approval (ALLOW)' : 'Capped (MODIFY/DENY)')}
                            </div>
                            <div className="text-[11px] text-gray-500 mt-0.5">
                              {neg.merchant_allowed_discount_pct ? `Authorized Ceiling: ${neg.merchant_allowed_discount_pct}% OFF` : 'Evaluated active pricing rules'}
                            </div>
                            <div className="text-[10px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded mt-2 inline-block truncate max-w-full">
                              {neg.policy_rationale || 'Ramana Mobile Hub policy engine verified'}
                            </div>
                          </div>

                          {/* Step 3: Outcome & Razorpay Order */}
                          <div className={`p-3.5 rounded-xl border shadow-2xs ${
                            isCompleted 
                              ? 'bg-emerald-50/60 border-emerald-200/80 text-emerald-950' 
                              : 'bg-amber-50/60 border-amber-200/80 text-amber-950'
                          }`}>
                            <div className="text-[10px] uppercase font-bold mb-1 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> 3. Protocol Settlement
                            </div>
                            <div className="font-bold text-xs mt-1">
                              {isCompleted ? `Verified at ₹${counterPrice.toLocaleString('en-IN')}` : 'Deal Halted (Zero money moved)'}
                            </div>
                            {neg.razorpay_order_id ? (
                              <div className="mt-2 flex items-center gap-1.5 font-mono text-[10px] text-emerald-700 bg-white/80 px-2 py-1 rounded border border-emerald-200">
                                <span>Razorpay ID:</span>
                                <strong className="select-all">{neg.razorpay_order_id}</strong>
                              </div>
                            ) : (
                              <div className="text-[11px] text-amber-800 mt-1">
                                Buyer agent protected budget because merchant counter was below floor constraint.
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
