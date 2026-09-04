"""
Merchant Policy Engine — Deterministic Pricing Rules
All pricing, discount, and validation decisions are made here.
The LLM is NEVER involved in money decisions.
"""

from typing import Tuple, List, Dict, Any
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared.models import IntentMessage, MandateMessage, OfferMessage, Product, OfferLineItem


class MerchantPolicy:
    """Deterministic merchant pricing and validation policies."""

    MAX_DISCOUNT_PCT: float = 15.0
    BULK_DISCOUNT_THRESHOLD: int = 3          # 3+ total items
    BULK_DISCOUNT_PCT: float = 10.0
    FIRST_TIME_BUYER_DISCOUNT_PCT: float = 5.0
    MIN_ORDER_PAISE: int = 5000               # ₹50
    MAX_ORDER_PAISE: int = 5000000            # ₹50,000
    OFFER_VALIDITY_MINUTES: int = 15

    @classmethod
    def validate_intent(cls, intent: IntentMessage, catalog: List[Product]) -> Tuple[bool, List[str]]:
        """
        Validate that the buyer's intent is well-formed and items exist.
        Returns (is_valid, list_of_errors).
        """
        errors = []

        if not intent.requested_items:
            errors.append("No items requested.")
            return False, errors

        catalog_map = {p.product_id: p for p in catalog}

        for item in intent.requested_items:
            if item.product_id not in catalog_map:
                errors.append(f"Product '{item.product_id}' not found in catalog.")
            elif not catalog_map[item.product_id].available:
                errors.append(f"Product '{item.product_id}' is currently unavailable.")
            elif item.quantity <= 0:
                errors.append(f"Invalid quantity {item.quantity} for '{item.product_id}'.")

        return len(errors) == 0, errors

    @classmethod
    def calculate_offer(
        cls,
        requested_items: List[Any],
        catalog: List[Product],
        is_first_time_buyer: bool = False,
    ) -> Dict[str, Any]:
        """
        Pure function: items + catalog → price + discount + justification.
        Returns dict with line_items, total_paise, discount_applied_pct, policy_justification.
        Or dict with 'error' key if constraints are violated.
        """
        catalog_map = {p.product_id: p for p in catalog}

        line_items = []
        base_total = 0
        total_quantity = 0

        for item in requested_items:
            product = catalog_map.get(item.product_id)
            if not product:
                continue  # Skip unknown products (already validated)

            line_total = product.price_paise * item.quantity
            base_total += line_total
            total_quantity += item.quantity

            line_items.append(OfferLineItem(
                product_id=product.product_id,
                name=product.name,
                quantity=item.quantity,
                unit_price_paise=product.price_paise,
                discounted_price_paise=product.price_paise,  # Will be updated below
                discount_pct=0.0,
            ))

        if not line_items:
            return {"error": "No valid items to offer."}

        # ── Calculate discount ──
        discount_pct = 0.0
        justification_parts = []

        if total_quantity >= cls.BULK_DISCOUNT_THRESHOLD:
            discount_pct += cls.BULK_DISCOUNT_PCT
            justification_parts.append(
                f"Bulk discount of {cls.BULK_DISCOUNT_PCT}% applied for {total_quantity} items (threshold: {cls.BULK_DISCOUNT_THRESHOLD})."
            )

        if is_first_time_buyer:
            discount_pct += cls.FIRST_TIME_BUYER_DISCOUNT_PCT
            justification_parts.append(
                f"First-time buyer discount of {cls.FIRST_TIME_BUYER_DISCOUNT_PCT}% applied."
            )

        if discount_pct > cls.MAX_DISCOUNT_PCT:
            discount_pct = cls.MAX_DISCOUNT_PCT
            justification_parts.append(
                f"Total discount capped at maximum allowed {cls.MAX_DISCOUNT_PCT}%."
            )

        if discount_pct == 0:
            justification_parts.append("Standard pricing applied — no discounts triggered.")

        # ── Apply discount to line items ──
        for li in line_items:
            discounted = int(li.unit_price_paise * (1 - discount_pct / 100.0))
            li.discounted_price_paise = discounted
            li.discount_pct = discount_pct

        # ── Calculate final total ──
        discount_amount = int(base_total * (discount_pct / 100.0))
        final_total = base_total - discount_amount

        # ── Enforce order limits ──
        if final_total < cls.MIN_ORDER_PAISE:
            return {
                "error": f"Order total ₹{final_total/100:.2f} is below minimum ₹{cls.MIN_ORDER_PAISE/100:.2f}."
            }

        if final_total > cls.MAX_ORDER_PAISE:
            return {
                "error": f"Order total ₹{final_total/100:.2f} exceeds maximum ₹{cls.MAX_ORDER_PAISE/100:.2f}."
            }

        justification = " | ".join(justification_parts)

        return {
            "line_items": line_items,
            "total_paise": final_total,
            "base_total_paise": base_total,
            "discount_applied_pct": discount_pct,
            "discount_amount_paise": discount_amount,
            "policy_justification": justification,
        }

    @classmethod
    def validate_mandate(
        cls, mandate: MandateMessage, original_offer: OfferMessage
    ) -> Tuple[bool, List[str]]:
        """Verify that the mandate matches the original offer."""
        errors = []
        if mandate.offer_id != original_offer.offer_id:
            errors.append(f"Offer ID mismatch: {mandate.offer_id} != {original_offer.offer_id}")
        if not mandate.buyer_authorization:
            errors.append("Buyer has not authorized this mandate.")
        return len(errors) == 0, errors
