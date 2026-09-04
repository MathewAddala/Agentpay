import React, { useState } from 'react';
import { FileText, Check, AlertTriangle, XCircle, Info, ChevronDown, ChevronUp, Search, Shield, ArrowRight } from 'lucide-react';
import { AgentActivityEntry } from '../../types/commerce';

interface AuditPageProps {
  entries: AgentActivityEntry[];
  auditLogs?: any[];
}

export const AuditPage: React.FC<AuditPageProps> = ({ entries, auditLogs = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Combine entries and auditLogs if present
  const allLogs = auditLogs.length > 0 ? auditLogs : entries;

  const filteredLogs = allLogs.filter((log) => {
    const text = JSON.stringify(log).toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  const getStepBadge = (step: string) => {
    switch (step) {
      case 'INTENT':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#528FF0] border border-blue-100">INTENT</span>;
      case 'OFFER':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100">OFFER</span>;
      case 'MANDATE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">MANDATE</span>;
      case 'CONFIRMATION':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">CONFIRMED</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-[#5F6D7E]">{step || 'EVENT'}</span>;
    }
  };

  return (
    <div className="h-full bg-[#F7F8FA] p-6 lg:p-8 font-sans overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#1B2733] flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#528FF0]" />
              AgentPay Protocol Audit Trail
            </h1>
            <p className="text-xs text-[#5F6D7E] mt-0.5">
              Cryptographically timestamped record of every agent handshake, policy evaluation, and Razorpay API call.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search audit trail by session, actor, or step..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-[#528FF0] shadow-2xs"
            />
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-xs">
              <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              No audit records matching your search. Trigger an automation or place an order in the Buyer Portal to log events.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 text-xs">
              {filteredLogs.map((log, idx) => {
                const id = log.id || idx;
                const isExpanded = expandedId === id;
                const timeStr = log.timestamp
                  ? new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : '—';

                return (
                  <div key={id} className="hover:bg-gray-50/50 transition-colors">
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : id)}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <span className="font-mono text-[11px] text-gray-400 shrink-0">{timeStr}</span>
                        {getStepBadge(log.step)}
                        <div>
                          <span className="font-semibold text-[#1B2733] mr-2">
                            {log.actor ? `[${log.actor}]` : ''} {log.message || log.policy_decision || 'Handshake evaluated'}
                          </span>
                          {log.session_id && (
                            <span className="font-mono text-[10px] text-[#528FF0] bg-blue-50 px-1.5 py-0.5 rounded">
                              {log.session_id}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          log.status === 'success' ? 'bg-emerald-50 text-emerald-700' : log.status === 'failure' || log.status === 'error' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {log.status || 'success'}
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>

                    {/* Expandable Payload */}
                    {isExpanded && (
                      <div className="px-6 pb-4 pt-1 bg-gray-50/70 border-t border-gray-100 space-y-2 font-mono text-[11px]">
                        <div className="text-[10px] font-bold text-[#8C97A4] uppercase">Raw Protocol Payload:</div>
                        <pre className="p-3 bg-[#0F1B2D] text-gray-200 rounded-xl overflow-x-auto text-[11px] leading-relaxed">
                          {JSON.stringify(log, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
