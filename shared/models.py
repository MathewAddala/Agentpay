from typing import List, Optional, Literal
from datetime import datetime, timezone
from pydantic import BaseModel, Field

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class RequestedItem(BaseModel):
    product_id: str
    quantity: int
    max_price_paise: Optional[int] = None

class OfferLineItem(BaseModel):
    product_id: str
    name: str
    quantity: int
    unit_price_paise: int
    discounted_price_paise: int
    discount_pct: float

HandshakeStep = Literal['INTENT', 'OFFER', 'MANDATE', 'CONFIRMATION']

class IntentMessage(BaseModel):
    step: Literal['INTENT'] = 'INTENT'
    session_id: str
    buyer_id: str
    requested_items: List[RequestedItem]
    max_budget_paise: int
    natural_language_intent: str
    timestamp: datetime = Field(default_factory=utc_now)

class OfferMessage(BaseModel):
    step: Literal['OFFER'] = 'OFFER'
    session_id: str
    offer_id: str
    line_items: List[OfferLineItem]
    total_paise: int
    discount_applied_pct: float
    policy_justification: str
    razorpay_order_id: str
    valid_until: datetime
    natural_language_offer: str
    timestamp: datetime = Field(default_factory=utc_now)

class MandateMessage(BaseModel):
    step: Literal['MANDATE'] = 'MANDATE'
    session_id: str
    offer_id: str
    buyer_authorization: bool
    budget_check_passed: bool
    razorpay_payment_id: Optional[str] = None
    payment_status: str
    failure_reason: Optional[str] = None
    natural_language_mandate: str
    timestamp: datetime = Field(default_factory=utc_now)

class ConfirmationMessage(BaseModel):
    step: Literal['CONFIRMATION'] = 'CONFIRMATION'
    session_id: str
    offer_id: str
    payment_captured: bool
    razorpay_payment_id: str
    amount_settled_paise: int
    receipt_url: Optional[str] = None
    natural_language_confirmation: str
    timestamp: datetime = Field(default_factory=utc_now)

class PolicyDecision(BaseModel):
    decision: Literal['APPROVE', 'REJECT', 'COUNTER']
    reasons: List[str]
    adjusted_amount_paise: Optional[int] = None

class AuditEntry(BaseModel):
    id: Optional[int] = None
    session_id: str
    timestamp: datetime = Field(default_factory=utc_now)
    step: HandshakeStep
    direction: str
    actor: str
    message_json: str
    policy_decision: Optional[str] = None
    razorpay_event: Optional[str] = None
    llm_input: Optional[str] = None
    llm_output: Optional[str] = None
    status: str = 'success'
    error_details: Optional[str] = None

class Product(BaseModel):
    product_id: str
    name: str
    description: str
    category: str
    price_paise: int
    currency: str = 'INR'
    available: bool = True

class SessionStatus(BaseModel):
    session_id: str
    buyer_id: str
    current_step: HandshakeStep
    status: str
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
    attempts: int = 1
