import {
  Automation,
  DashboardStats,
  AgentActivityEntry,
  SimulatedCustomer,
  SimulationResult,
  RecoveryResult,
} from '../types/commerce';

const API_BASE = '';

export const api = {
  // ── Automations ──
  async getAutomations(): Promise<Automation[]> {
    try {
      const res = await fetch(`${API_BASE}/api/automations`);
      if (!res.ok) throw new Error('Failed to fetch automations');
      return await res.json();
    } catch (err) {
      console.warn('Failed to load automations:', err);
      return [];
    }
  },

  async createAutomation(description: string): Promise<Automation> {
    const res = await fetch(`${API_BASE}/api/automations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to create automation: ${errText}`);
    }
    return await res.json();
  },

  async activateAutomation(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/api/automations/${id}/activate`, {
        method: 'POST',
      });
      return res.ok;
    } catch (err) {
      console.error('Failed to activate automation:', err);
      return false;
    }
  },

  // ── Event Trigger ──
  async triggerEvent(
    automationId: string,
    customer: SimulatedCustomer,
    forceFailure: boolean
  ): Promise<SimulationResult> {
    const res = await fetch(`${API_BASE}/api/trigger-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        automation_id: automationId,
        customer_name: customer.name,
        customer_email: customer.email,
        cart_value_paise: customer.cart_value_paise,
        items: customer.items,
        force_failure: forceFailure,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Event trigger failed: ${errText}`);
    }
    return await res.json();
  },

  // ── Agent Activity ──
  async getAgentActivity(eventId?: string): Promise<AgentActivityEntry[]> {
    try {
      const url = eventId
        ? `${API_BASE}/api/agent-activity?event_id=${eventId}`
        : `${API_BASE}/api/agent-activity`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch agent activity');
      return await res.json();
    } catch (err) {
      console.warn('Failed to load agent activity:', err);
      return [];
    }
  },

  // ── Stats ──
  async getStats(): Promise<DashboardStats> {
    try {
      const res = await fetch(`${API_BASE}/api/stats`);
      if (!res.ok) throw new Error('Failed to fetch stats');
      return await res.json();
    } catch (err) {
      return {
        active_automations: 0,
        total_executions: 0,
        recovered_revenue_paise: 0,
        recovered_revenue_display: '₹0',
        abandoned_checkouts: 12,
        recoverable_amount_paise: 1845000,
        recoverable_amount_display: '₹18,450',
        success_rate: 0,
      };
    }
  },

  // ── Orders ──
  async getOrders(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/api/orders`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  // ── Catalog ──
  async getCatalog(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/catalog`);
      if (!res.ok) return { products: [] };
      return await res.json();
    } catch {
      return { products: [] };
    }
  },

  // ── Audit Trail ──
  async getAuditTrail(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/api/audit-trail`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  // ── Database Reset ──
  async resetDatabase(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/api/reset-db`, { method: 'POST' });
      return res.ok;
    } catch (err) {
      console.error('Failed to reset database:', err);
      return false;
    }
  },

  // ── Buyer Agent Chat ──
  async buyerAgentChat(message: string, history?: any[], sessionId?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/buyer-agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history: history || [], session_id: sessionId }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Buyer agent error: ${errText}`);
    }
    return await res.json();
  },

  // ── Merchant Agent Chat ──
  async merchantAgentChat(message: string, history?: any[]): Promise<any> {
    const res = await fetch(`${API_BASE}/api/merchant-agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history: history || [] }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Merchant agent error: ${errText}`);
    }
    return await res.json();
  },

  // ── Merchant Policies ──
  async getMerchantPolicies(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/api/merchant-agent/policies`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  // ── A2A Negotiations ──
  async getNegotiations(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/api/negotiations`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  // ── Policy Engine & PDP Decisions ──
  async getCompiledPolicies(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/api/policies/compiled`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.policies || [];
    } catch {
      return [];
    }
  },

  async getPolicyDecisions(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/api/policies/decisions`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.decisions || [];
    } catch {
      return [];
    }
  },
};

