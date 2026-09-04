from enum import Enum
from datetime import datetime, timezone
from pydantic import BaseModel
from shared.models import OfferMessage

class DecisionType(str, Enum):
    APPROVE = "APPROVE"
    REJECT = "REJECT"
    COUNTER = "COUNTER"

class PolicyDecision(BaseModel):
    decision: DecisionType
    reasons: list[str]

class BuyerPolicy:
    MAX_PRICE_MARKUP_PCT = 20.0  # Reject if price > 120% of catalog
    SUSPICIOUS_DISCOUNT_PCT = 30.0  # Flag if discount > 30%
    MAX_RETRY_ATTEMPTS = 3
    OFFER_EXPIRY_BUFFER_SECONDS = 60  # Reject if < 60s until expiry

    @classmethod
    def evaluate_offer(cls, offer: OfferMessage, profile, catalog_prices: dict) -> PolicyDecision:
        reasons = []
        decision = DecisionType.APPROVE
        
        # Check 1: Is total within budget?
        if offer.total_amount_paise > profile.remaining_budget_paise:
            reasons.append(f"Total amount {offer.total_amount_paise} exceeds remaining budget {profile.remaining_budget_paise}")
            decision = DecisionType.REJECT
            
        # Check 2: Is total within single purchase limit?
        if offer.total_amount_paise > profile.max_single_purchase_paise:
            reasons.append(f"Total amount {offer.total_amount_paise} exceeds max single purchase limit {profile.max_single_purchase_paise}")
            decision = DecisionType.REJECT

        # Check 3 & 4: per-item price and discounts
        for item in offer.items:
            cat_price = catalog_prices.get(item.product_id)
            if cat_price:
                max_allowed = cat_price * (1 + cls.MAX_PRICE_MARKUP_PCT / 100.0)
                if item.price_paise > max_allowed:
                    reasons.append(f"Item {item.product_id} price {item.price_paise} exceeds max allowed markup ({max_allowed})")
                    decision = DecisionType.REJECT
                    
                discount_pct = ((cat_price - item.price_paise) / cat_price) * 100 if cat_price > 0 else 0
                if discount_pct > cls.SUSPICIOUS_DISCOUNT_PCT:
                    reasons.append(f"Warning: Item {item.product_id} discount {discount_pct}% is suspiciously high")

        # Check 5: Is offer still valid (not expired with buffer)?
        if offer.expires_at:
            if isinstance(offer.expires_at, str):
                try:
                    expiry = datetime.fromisoformat(offer.expires_at.replace("Z", "+00:00"))
                except:
                    expiry = None
            else:
                expiry = offer.expires_at
                
            if expiry:
                now = datetime.now(timezone.utc)
                if (expiry - now).total_seconds() < cls.OFFER_EXPIRY_BUFFER_SECONDS:
                    reasons.append("Offer expires too soon or is already expired")
                    decision = DecisionType.REJECT
                    
        if decision == DecisionType.APPROVE and not reasons:
            reasons.append("Offer meets all policy criteria")
            
        return PolicyDecision(decision=decision, reasons=reasons)

    @classmethod
    def should_retry(cls, attempts: int, failure_reason: str) -> bool:
        if attempts >= cls.MAX_RETRY_ATTEMPTS:
            return False
        # Allow retry if not a fraud reason
        if "fraud" in failure_reason.lower() or "suspicious" in failure_reason.lower():
            return False
        return True
