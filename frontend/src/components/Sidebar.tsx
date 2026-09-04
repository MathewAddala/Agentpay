import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Store,
  Zap,
  FileText,
  Package,
  Sliders,
  TrendingUp,
  Shield,
  Smartphone,
  Receipt,
  Workflow,
  Network,
  Handshake,
  ShieldCheck
} from 'lucide-react';

type SidebarVariant = 'dashboard' | 'buyer' | 'merchant';

interface SidebarProps {
  variant: SidebarVariant;
  activeItem?: string;
  onNavigate?: (item: string) => void;
}

const DASHBOARD_NAV = [
  { id: 'overview', label: 'Network Overview', icon: LayoutDashboard },
  { id: 'orders', label: 'Settlement Ledger', icon: Package },
  { id: 'negotiations', label: 'A2A Negotiations', icon: Handshake },
  { id: 'audit', label: 'Protocol Audit Trail', icon: FileText },
  { id: 'nodes', label: 'Network Topology', icon: Network },
];

const MERCHANT_NAV = [
  { id: 'console', label: 'Store Console', icon: Sliders },
  { id: 'pdp', label: 'Policy Engine (PDP)', icon: ShieldCheck },
  { id: 'negotiations', label: 'Buyer Negotiations', icon: Handshake },
  { id: 'catalog', label: 'Catalog & Stock', icon: Smartphone },
  { id: 'orders', label: 'Store Orders', icon: Package },
];

const BUYER_NAV = [
  { id: 'procurement', label: 'Procurement Assistant', icon: ShoppingCart },
  { id: 'negotiations', label: 'A2A Negotiations', icon: Handshake },
  { id: 'orders', label: 'My Orders & Receipts', icon: Receipt },
];

export const Sidebar: React.FC<SidebarProps> = ({ variant, activeItem, onNavigate }) => {
  const navItems = variant === 'dashboard' ? DASHBOARD_NAV
    : variant === 'buyer' ? BUYER_NAV
    : MERCHANT_NAV;

  const brandName = variant === 'dashboard' ? 'AgentPay'
    : variant === 'buyer' ? 'AgentPay'
    : 'Ramana Mobile Hub';

  const subtitle = variant === 'dashboard' ? 'Platform Provider Studio'
    : variant === 'buyer' ? 'Buyer Procurement Agent'
    : 'Store Management Console';

  const brandColor = variant === 'merchant' ? 'bg-[#1CA672]' : variant === 'buyer' ? 'bg-[#528FF0]' : 'bg-[#1B2733] border border-white/20';

  return (
    <aside className="w-[230px] bg-[#0F1B2D] flex flex-col h-full shrink-0 select-none border-r border-white/5">
      
      {/* Brand Header */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 ${brandColor} rounded-xl flex items-center justify-center shadow-sm shrink-0`}>
            {variant === 'merchant' ? (
              <Store className="w-4 h-4 text-white" />
            ) : variant === 'buyer' ? (
              <ShoppingCart className="w-4 h-4 text-white" />
            ) : (
              <Zap className="w-4 h-4 text-[#528FF0]" />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-bold text-white leading-tight truncate">{brandName}</div>
            <div className="text-[10px] text-[#8899AA] leading-tight mt-0.5 truncate">{subtitle}</div>
          </div>
        </div>
      </div>

      {/* Main Navigation (Self-contained for this specific portal) */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate?.(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#528FF0]/20 text-[#528FF0] shadow-sm shadow-blue-500/10'
                  : 'text-[#8899AA] hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Connection Status */}
      <div className="px-4 py-3.5 border-t border-white/8 bg-black/20">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold text-[#6B7A8D]">Status</span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Razorpay Live
          </span>
        </div>
      </div>

    </aside>
  );
};
