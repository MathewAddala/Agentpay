from pydantic import BaseModel, Field, field_validator
from typing import Any, Optional
from datetime import datetime, timezone
from enum import Enum

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class ConstraintLevel(int, Enum):
    PLATFORM_SAFETY = 0
    MERCHANT_POLICY = 1
    AUTOMATION_RULE = 2
    CUSTOMER_ELIGIBILITY = 3
    AGENT_NEGOTIATION = 4

class PolicyCondition(BaseModel):
    """A single condition in a policy rule (e.g., order.amount >= 10000)"""
    field: str              # e.g. "order.amount", "customer.segment", "checkout.abandoned_minutes", "order.item_count"
    operator: str           # "eq", "gte", "lte", "gt", "lt", "in", "not_in"
    value: Any              # 10000, "high_value", 30, ["premium", "vip"]

    @field_validator('operator')
    @classmethod
    def validate_operator(cls, v):
        allowed = {'eq', 'neq', 'gte', 'lte', 'gt', 'lt', 'in', 'not_in'}
        if v not in allowed:
            raise ValueError(f'Operator must be one of {allowed}')
        return v

class PolicyOffer(BaseModel):
    """What discount can be offered when conditions are met"""
    discount_percent_max: float = Field(ge=0, le=100)
    discount_percent_min: float = Field(default=0, ge=0, le=100)

    @field_validator('discount_percent_max')
    @classmethod
    def validate_max(cls, v):
        if v < 0 or v > 100:
            raise ValueError(f'discount_percent_max must be 0-100, got {v}')
        return v

class PolicyRule(BaseModel):
    """A single rule: when conditions are met, this offer is allowed"""
    rule_id: str = ""
    description: str = ""
    when: list[PolicyCondition] = []
    offer: PolicyOffer

class PolicyConstraintType(str, Enum):
    NO_DISCOUNT_STACKING = "no_discount_stacking"
    MAX_ONE_OFFER = "max_one_offer_per_customer"
    MARGIN_FLOOR = "margin_floor"
    MAX_DISCOUNT_CAP = "max_discount_cap"
    MIN_ORDER_VALUE = "min_order_value"
    MAX_ORDER_VALUE = "max_order_value"

class PolicyConstraint(BaseModel):
    """A hard constraint that cannot be overridden by negotiation"""
    type: str  # PolicyConstraintType value or custom string
    value: Any = None
    description: str = ""

class CompiledPolicy(BaseModel):
    """A fully compiled, validated policy object stored in the policy store"""
    policy_id: str
    objective: str = "general"  # "cart_recovery", "bulk_wholesale", "loyalty_reward", "general"
    level: int = Field(default=1, ge=0, le=4)  # ConstraintLevel
    rules: list[PolicyRule] = []
    constraints: list[PolicyConstraint] = []
    effective_max_discount: float = Field(default=0, ge=0, le=100)
    raw_merchant_input: str = ""
    schema_valid: bool = False
    semantic_valid: bool = False
    test_passed: int = 0
    test_total: int = 0
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: utc_now().isoformat())
    updated_at: str = Field(default_factory=lambda: utc_now().isoformat())

class CapabilityToken(BaseModel):
    """Defines what an agent is authorized to do"""
    agent_id: str
    agent_name: str = ""
    permissions: list[str] = []  # ["read.customer", "read.order", "create.order", "create.payment_link"]
    limits: dict = {}  # {"max_discount_percent": 25, "max_order_amount_paise": 5000000, "max_attempts_per_customer": 1}
    created_at: str = Field(default_factory=lambda: utc_now().isoformat())
    expires_at: str = ""

class NegotiationProposal(BaseModel):
    """A formal proposal from the Buyer Agent to the Merchant Agent"""
    session_id: str
    agent_id: str = "buyer_agent"
    requested_items: list[dict] = []  # [{"product_id": ..., "name": ..., "quantity": ..., "price_paise": ...}]
    subtotal_paise: int = 0
    offered_paise: int = 0
    requested_discount_pct: float = 0
    buyer_notes: str = ""
    round_number: int = 1
    # Context fields for policy evaluation
    customer_segment: str = "standard"  # "high_value", "standard", "new"
    customer_lifetime_value_paise: int = 0
    checkout_abandoned_minutes: int = 0
    customer_recovery_offers_used: int = 0
    existing_coupon_pct: float = 0

class ConstraintResult(BaseModel):
    """Result of evaluating a single constraint"""
    constraint_name: str
    level: int = 1
    passed: bool
    detail: str = ""
    evaluated_value: Any = None
    threshold: Any = None

class PolicyDecisionResult(BaseModel):
    """The output of the Policy Decision Point"""
    decision: str  # "ALLOW", "DENY", "MODIFY"
    proposal: dict = {}  # Original proposal
    evaluated_constraints: list[ConstraintResult] = []
    effective_max_discount: float = 0
    modified_proposal: dict | None = None  # If MODIFY, the adjusted proposal
    counter_offer_paise: int = 0
    reasoning: str = ""
    policy_ids_evaluated: list[str] = []
    timestamp: str = Field(default_factory=lambda: utc_now().isoformat())

    @property
    def all_passed(self) -> bool:
        return all(c.passed for c in self.evaluated_constraints)

    @property
    def failed_constraints(self) -> list[ConstraintResult]:
        return [c for c in self.evaluated_constraints if not c.passed]

    @property
    def passed_count(self) -> int:
        return sum(1 for c in self.evaluated_constraints if c.passed)

    @property
    def total_count(self) -> int:
        return len(self.evaluated_constraints)

class GatewayResult(BaseModel):
    """Result of Tool Gateway authorization check"""
    authorized: bool
    action: str = ""
    agent_id: str = ""
    violation: str = ""
    detail: str = ""

class ValidationResult(BaseModel):
    """Result of schema or semantic validation"""
    valid: bool
    errors: list[str] = []
    warnings: list[str] = []

class TestScenario(BaseModel):
    """A single adversarial test scenario"""
    scenario_id: str = ""
    description: str = ""
    proposal: NegotiationProposal
    expected_decision: str  # "ALLOW", "DENY", "MODIFY"
    category: str = "boundary"  # "boundary", "stacking", "eligibility", "edge_case"

class TestResult(BaseModel):
    """Result of running a single test scenario"""
    scenario_id: str
    description: str = ""
    expected: str
    actual: str
    passed: bool
    detail: str = ""

class VerificationReport(BaseModel):
    """Summary of adversarial policy verification"""
    policy_id: str
    total_scenarios: int = 0
    passed: int = 0
    failed: int = 0
    results: list[TestResult] = []
    categories: dict = {}  # {"boundary": {"passed": 5, "failed": 0}, ...}
    timestamp: str = Field(default_factory=lambda: utc_now().isoformat())

    @property
    def all_passed(self) -> bool:
        return self.failed == 0
