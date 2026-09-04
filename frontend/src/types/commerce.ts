/**
 * Type definitions for Razorpay Revenue Agent
 */

// ── Navigation ──
export type ActiveTab = 'automations' | 'activity' | 'audit' | 'buyer_agent' | 'merchant_agent';

// ── Automations ──
export type AutomationStatus = 'draft' | 'active' | 'paused';

export interface AutomationGuardrail {
  label: string;
  value: string;
}

export interface Automation {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  trigger_config: {
    event: string;
    condition: string;
    threshold_paise?: number;
    wait_minutes?: number;
  };
  action_type: string;
  action_config: {
    action: string;
    discount_pct?: number;
    max_amount_paise?: number;
  };
  guardrails: AutomationGuardrail[];
  status: AutomationStatus;
  created_at: string;
  updated_at: string;
  executions?: number;
  recovered_amount_paise?: number;
}

// ── Agent Activity ──
export type ActivityStatus = 'info' | 'success' | 'warning' | 'error' | 'pending';

export interface AgentActivityEntry {
  id: number;
  automation_id: string;
  event_id: string;
  timestamp: string;
  step: string;
  message: string;
  status: ActivityStatus;
  details?: any;
}

// ── Simulated Events ──
export interface SimulatedCustomer {
  name: string;
  email: string;
  cart_value_paise: number;
  items: string[];
}

export interface SimulationResult {
  event_id: string;
  customer: SimulatedCustomer;
  automation_id: string;
  activity: AgentActivityEntry[];
  outcome: {
    success: boolean;
    action_taken: string;
    razorpay_entity_id?: string;
    razorpay_entity_type?: string;
    failure_reason?: string;
    agent_reasoning?: string;
  };
}

// ── Recovery Action Result ──
export interface RecoveryResult {
  customer_name: string;
  cart_value_paise: number;
  offer_text: string;
  payment_link_id?: string;
  payment_link_url?: string;
  razorpay_order_id?: string;
  reason: string;
  failed: boolean;
  failure_reason?: string;
  agent_refusal_reason?: string;
}

// ── Audit Trail ──
export interface AuditEntry {
  id: number;
  timestamp: string;
  event_type: string;
  actor: string;
  description: string;
  details?: any;
  automation_id?: string;
  status: 'success' | 'failure' | 'info';
}

// ── Orders ──
export interface OrderItem {
  product_id?: string;
  name: string;
  quantity: number;
  price_paise?: number;
  discounted_price_paise?: number;
}

export interface Order {
  order_id: string;
  session_id: string;
  customer_name: string;
  customer_email?: string;
  items: OrderItem[];
  subtotal_paise: number;
  discount_pct: number;
  discount_amount_paise: number;
  total_paise: number;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  status: 'created' | 'paid' | 'completed' | 'failed' | 'processing';
  order_type: 'buyer_procurement' | 'cart_recovery' | 'direct';
  notes?: any;
  created_at: string;
  updated_at?: string;
}

// ── Dashboard Stats ──
export interface DashboardStats {
  active_automations: number;
  total_executions: number;
  recovered_revenue_paise: number;
  recovered_revenue_display: string;
  abandoned_checkouts: number;
  recoverable_amount_paise: number;
  recoverable_amount_display: string;
  customers_impacted?: number;
  potential_revenue_display?: string;
  success_rate: number;
}

// ── Legacy types (still used by backend) ──
export interface Session {
  session_id: string;
  buyer_id: string;
  current_step: string;
  status: string;
  created_at: string;
  updated_at: string;
  attempts: number;
  event_count?: number;
}

export interface Product {
  product_id: string;
  name: string;
  description: string;
  category: string;
  price_paise: number;
  currency?: string;
  available?: boolean;
}

// ── A2A Negotiation Logs ──
export interface NegotiationLog {
  id: number;
  session_id: string;
  timestamp: string;
  buyer_name: string;
  merchant_name: string;
  items_summary: string;
  total_qty: number;
  list_price_paise: number;
  buyer_offered_paise: number;
  buyer_target_discount_pct?: number;
  buyer_min_discount_pct?: number;
  merchant_counter_paise?: number;
  merchant_allowed_discount_pct?: number;
  rounds: number;
  status: 'APPROVED' | 'COUNTER_OFFER' | 'HALTED' | 'COMPLETED' | 'REJECTED';
  policy_rationale?: string;
  razorpay_order_id?: string;
  evaluated_constraints?: ConstraintResult[];
}

// ── Policy Engine & PDP Types ──
export interface ConstraintResult {
  constraint_name: string;
  level: number;
  passed: boolean;
  detail: string;
  evaluated_value?: any;
  threshold?: any;
}

export interface PolicyDecisionLog {
  id: number;
  session_id: string;
  timestamp: string;
  proposal?: any;
  evaluated_constraints?: ConstraintResult[];
  effective_max_discount: number;
  decision: 'ALLOW' | 'MODIFY' | 'DENY';
  modified_proposal?: any;
  reasoning: string;
  agent_id: string;
  policy_ids_evaluated?: string;
}

export interface PolicyRuleCondition {
  field: string;
  operator: string;
  value: any;
}

export interface PolicyRuleItem {
  rule_id?: string;
  description: string;
  when: PolicyRuleCondition[];
  offer: {
    discount_percent_max: number;
    discount_percent_min?: number;
  };
}

export interface CompiledPolicy {
  policy_id: string;
  objective: string;
  level: number;
  rules: PolicyRuleItem[];
  constraints: Array<{ type: string; value?: any; description: string }>;
  effective_max_discount: number;
  raw_merchant_input: string;
  schema_valid: boolean;
  semantic_valid: boolean;
  test_passed: number;
  test_total: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}


