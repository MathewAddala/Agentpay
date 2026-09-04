import React, { useState } from 'react';
import { Package, Search, ExternalLink, Filter, ArrowUpRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Order } from '../../types/commerce';

interface OrdersPageProps {
  orders: Order[];
  onRefresh?: () => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ orders, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'created' | 'failed'>('all');

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.razorpay_order_id && order.razorpay_order_id.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = orders.reduce((acc, o) => acc + (o.total_paise || 0), 0);
  const avgOrderValue = orders.length ? totalRevenue / orders.length : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Paid / Confirmed
          </span>
        );
      case 'created':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3.5 h-3.5" />
            Payment Link Sent
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
            <AlertCircle className="w-3.5 h-3.5" />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="h-full bg-[#F7F8FA] p-6 lg:p-8 font-sans overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#1B2733] flex items-center gap-2">
              <Package className="w-6 h-6 text-[#528FF0]" />
              Store Orders & Settlements
            </h1>
            <p className="text-sm text-[#5F6D7E] mt-0.5">
              Live orders processed across Ramana Mobile Hub by Buyer Agent & Cart Recovery workflows.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://dashboard.razorpay.com/app/orders"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-[#1B2733] hover:bg-gray-50 shadow-sm transition-all"
            >
              <span>Razorpay Merchant Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            </a>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="text-xs font-semibold text-[#8C97A4] uppercase tracking-wider">Total Orders</div>
            <div className="text-2xl font-bold text-[#1B2733] mt-1">{orders.length}</div>
            <div className="text-xs text-[#1CA672] font-medium mt-1">● Synced with Razorpay</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="text-xs font-semibold text-[#8C97A4] uppercase tracking-wider">Gross Merchandise Value</div>
            <div className="text-2xl font-bold text-[#1B2733] mt-1">₹{(totalRevenue / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
            <div className="text-xs text-[#5F6D7E] mt-1">Across all agent handshakes</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="text-xs font-semibold text-[#8C97A4] uppercase tracking-wider">Average Order Value</div>
            <div className="text-2xl font-bold text-[#1B2733] mt-1">₹{(avgOrderValue / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
            <div className="text-xs text-[#528FF0] mt-1">With automated store discounts</div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by order ID, customer, or Razorpay ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-[#1B2733] placeholder-gray-400 focus:bg-white focus:outline-none focus:border-[#528FF0] transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            {(['all', 'completed', 'created'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-[#528FF0] text-white shadow-sm'
                    : 'bg-gray-100 text-[#5F6D7E] hover:bg-gray-200'
                }`}
              >
                {st === 'all' ? 'All Orders' : st === 'completed' ? 'Paid' : 'Link Sent'}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-base font-medium text-[#1B2733]">No orders found</p>
              <p className="text-sm text-[#5F6D7E] mt-1">
                Orders created via Buyer Agent or Cart Recovery automations will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-semibold text-[#8C97A4] uppercase tracking-wider">
                    <th className="px-6 py-3.5">Order ID</th>
                    <th className="px-6 py-3.5">Customer</th>
                    <th className="px-6 py-3.5">Items & Details</th>
                    <th className="px-6 py-3.5">Amount</th>
                    <th className="px-6 py-3.5">Razorpay Reference</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredOrders.map((order) => {
                    const items = Array.isArray(order.items) ? order.items : [];
                    const itemsSummary = items.map((it: any) => `${it.name}${it.quantity > 1 ? ` (x${it.quantity})` : ''}`).join(', ');
                    const dateFormatted = new Date(order.created_at).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <tr key={order.order_id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs font-semibold text-[#528FF0]">
                          {order.order_id}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-[#1B2733]">{order.customer_name}</div>
                          {order.customer_email && (
                            <div className="text-xs text-gray-400">{order.customer_email}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <div className="text-xs text-[#1B2733] truncate font-medium">
                            {itemsSummary || 'Ramana Mobile Hub Accessories'}
                          </div>
                          {order.discount_pct > 0 && (
                            <span className="text-[11px] text-[#1CA672] font-medium">
                              {order.discount_pct}% Store Discount Applied
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-[#1B2733]">
                            ₹{((order.total_paise || 0) / 100).toLocaleString('en-IN')}
                          </div>
                          {order.subtotal_paise > order.total_paise && (
                            <div className="text-[11px] text-gray-400 line-through">
                              ₹{(order.subtotal_paise / 100).toLocaleString('en-IN')}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {order.razorpay_order_id ? (
                            <a
                              href={`https://dashboard.razorpay.com/app/orders/${order.razorpay_order_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-xs text-[#528FF0] hover:underline flex items-center gap-1"
                            >
                              <span>{order.razorpay_order_id}</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="px-6 py-4 text-right text-xs text-gray-400 whitespace-nowrap">
                          {dateFormatted}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
