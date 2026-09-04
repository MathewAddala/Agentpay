import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, Lock, Cpu, Sparkles, ChevronRight, ChevronDown, RefreshCw } from 'lucide-react';
import { CompiledPolicy, PolicyDecisionLog, ConstraintResult } from '../types/commerce';

interface PolicyDecisionViewProps {
  compiledPolicies: CompiledPolicy[];
  decisions: PolicyDecisionLog[];
  onRefresh?: () => void;
}

export const PolicyDecisionView: React.FC<PolicyDecisionViewProps> = ({
  compiledPolicies,
  decisions,
  onRefresh,
}) => {
  const [selectedDecisionId, setSelectedDecisionId] = useState<number | null>(null);

  const totalDecisions = decisions.length;
  const allowCount = decisions.filter(d => d.decision === 'ALLOW').length;
  const modifyCount = decisions.filter(d => d.decision === 'MODIFY').length;
  const denyCount = decisions.filter(d => d.decision === 'DENY').length;

  return (
    <div className="space-y-6">
      {/* ── Banner: Core Protocol Axiom ── */}
      <div className="bg-gradient-to-r from-[#1B3A4B] to-[#2C5282] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              Store Policy & Pricing Guardrails
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
              Automated Store Rules & Pricing Protection
            </h1>
            <p className="text-blue-100 text-sm italic font-medium max-w-2xl">
              "Agents are allowed to negotiate, but they are never allowed to negotiate the rules."
            </p>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Engine
            </button>
          )}
        </div>
      </div>

      {/* ── Metrics Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Policy Checks</div>
          <div className="text-2xl font-bold text-gray-900">{totalDecisions}</div>
          <div className="text-xs text-gray-400 mt-1">Verified against store & platform rules</div>
        </div>
        <div className="bg-white rounded-xl border border-emerald-200 bg-emerald-50/20 p-5 shadow-sm">
          <div className="text-xs font-medium text-emerald-700 uppercase tracking-wider mb-1">Approved Deals</div>
          <div className="text-2xl font-bold text-emerald-600">{allowCount}</div>
          <div className="text-xs text-emerald-600 mt-1">Within store discount limits</div>
        </div>
        <div className="bg-white rounded-xl border border-amber-200 bg-amber-50/20 p-5 shadow-sm">
          <div className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-1">Counter-Offers</div>
          <div className="text-2xl font-bold text-amber-600">{modifyCount}</div>
          <div className="text-xs text-amber-600 mt-1">Protected by store discount ceiling</div>
        </div>
        <div className="bg-white rounded-xl border border-rose-200 bg-rose-50/20 p-5 shadow-sm">
          <div className="text-xs font-medium text-rose-700 uppercase tracking-wider mb-1">Orders Halted</div>
          <div className="text-2xl font-bold text-rose-600">{denyCount}</div>
          <div className="text-xs text-rose-600 mt-1">Prevented store margin loss</div>
        </div>
      </div>

      {/* ── Active Compiled Policies & Adversarial Verification (100% Live from DB) ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-semibold text-gray-900">Active Store Policies & Safety Verification</h2>
          </div>
          <span className="text-xs text-gray-400">{compiledPolicies.length} compiled policies active</span>
        </div>

        {compiledPolicies.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No compiled policies currently active. Enter a policy directive in the Store Console to compile one!
          </div>
        ) : (
          <div className="space-y-4">
            {compiledPolicies.map((pol) => (
              <div key={pol.policy_id} className="border border-gray-200 rounded-xl p-4 bg-gray-50/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{pol.policy_id}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
                        Level {pol.level} ({pol.objective})
                      </span>
                    </div>
                    {pol.raw_merchant_input && (
                      <p className="text-xs text-gray-600 mt-1 italic">
                        "{pol.raw_merchant_input}"
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Effective Ceiling</div>
                      <div className="text-sm font-bold text-blue-600">{pol.effective_max_discount}% MAX</div>
                    </div>
                    <div className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {pol.test_passed}/{pol.test_total || pol.test_passed} Verified
                    </div>
                  </div>
                </div>

                {/* Rules breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div className="bg-white rounded-lg border border-gray-200 p-3 text-xs">
                    <div className="font-semibold text-gray-800 mb-2">Formal Rules:</div>
                    <ul className="space-y-1.5 text-gray-600">
                      {pol.rules?.map((r, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-blue-500 font-bold">•</span>
                          <span>
                            <strong>{r.description || r.rule_id}:</strong> Max discount{' '}
                            <strong>{r.offer?.discount_percent_max}%</strong>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-3 text-xs">
                    <div className="font-semibold text-gray-800 mb-2">Hard Constraints:</div>
                    <ul className="space-y-1.5 text-gray-600">
                      {pol.constraints?.map((c, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span>
                            <code>{c.type}</code>: {c.description || (c.value !== undefined ? `Limit ${c.value}` : 'Active')}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Real-Time PDP Decision Audit Trail ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-900">Real-Time Decision Audit Chain</h2>
          </div>
          <span className="text-xs text-gray-400">Deterministic check results</span>
        </div>

        {decisions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No PDP evaluations recorded yet. Run a negotiation in the Buyer or Merchant portal to generate live decisions!
          </div>
        ) : (
          <div className="space-y-3">
            {decisions.map((dec) => {
              const isSelected = selectedDecisionId === dec.id;
              const isAllow = dec.decision === 'ALLOW';
              const isModify = dec.decision === 'MODIFY';
              const isDeny = dec.decision === 'DENY';

              return (
                <div
                  key={dec.id}
                  className={`border rounded-xl transition-all ${
                    isAllow
                      ? 'border-emerald-200 bg-emerald-50/10'
                      : isModify
                      ? 'border-amber-200 bg-amber-50/10'
                      : 'border-rose-200 bg-rose-50/10'
                  }`}
                >
                  <div
                    onClick={() => setSelectedDecisionId(isSelected ? null : dec.id)}
                    className="p-4 cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                          isAllow
                            ? 'bg-emerald-100 text-emerald-800'
                            : isModify
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {dec.decision}
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <span>Session: {dec.session_id}</span>
                          <span className="text-xs text-gray-400 font-normal">by {dec.agent_id}</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-0.5 line-clamp-1">{dec.reasoning}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right text-xs">
                        <div className="text-gray-400">Effective Ceiling</div>
                        <div className="font-bold text-gray-800">{dec.effective_max_discount}%</div>
                      </div>
                      {isSelected ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Constraint Evaluation Checklist */}
                  {isSelected && (
                    <div className="border-t border-gray-200 p-4 bg-white rounded-b-xl space-y-3">
                      <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Evaluated Constraint Checklist:
                      </div>
                      <div className="space-y-2">
                        {dec.evaluated_constraints?.map((c: ConstraintResult, cIdx: number) => (
                          <div
                            key={cIdx}
                            className={`flex items-start gap-2 text-xs p-2.5 rounded-lg border ${
                              c.passed
                                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                                : 'bg-rose-50/60 border-rose-200 text-rose-900'
                            }`}
                          >
                            {c.passed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <div className="font-semibold">{c.constraint_name}</div>
                              <div className="text-gray-600 mt-0.5">{c.detail}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Tool Gateway Token verification */}
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs space-y-1">
                        <div className="font-semibold text-gray-800 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-blue-600" />
                          Tool Gateway Capability Token Authorization:
                        </div>
                        <div className="text-gray-600">
                          Status:{' '}
                          <span className="font-bold text-emerald-600">
                            {isAllow ? 'AUTHORIZED (Capability bounds satisfied)' : isModify ? 'BLOCKED UNTIL CONFIRMATION' : 'DENIED (403 Policy Violation)'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
