"""
Razorpay Service — SDK wrapper with audit logging.
Creates real test-mode orders and simulates payments for the A2A protocol.
"""

import razorpay
import uuid
import json
import structlog
from typing import Dict, Any, Optional

logger = structlog.get_logger(__name__)


class RazorpayService:
    """Wraps the Razorpay Python SDK with audit trail logging."""

    def __init__(self, key_id: str, key_secret: str, audit_logger):
        self.client = razorpay.Client(auth=(key_id, key_secret))
        self.audit = audit_logger
        self._failure_simulated: Dict[str, bool] = {}  # Track which sessions had their failure

    async def create_order(
        self,
        session_id: str,
        amount_paise: int,
        receipt: str,
        notes: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """Create a REAL Razorpay order via the SDK (test mode)."""
        data = {
            "amount": amount_paise,
            "currency": "INR",
            "receipt": receipt,
            "notes": notes or {},
        }

        try:
            order = self.client.order.create(data=data)
            logger.info(
                "razorpay_order_created",
                session_id=session_id,
                order_id=order.get("id"),
                amount=amount_paise,
            )

            # Log to audit trail
            await self.audit.log(
                session_id=session_id,
                step="OFFER",
                direction="merchant→razorpay",
                message={"action": "create_order", "request": data, "response_id": order.get("id")},
                razorpay_event=json.dumps({
                    "type": "order.created",
                    "order_id": order.get("id"),
                    "amount": order.get("amount"),
                    "status": order.get("status"),
                }),
            )
            return order
        except Exception as e:
            logger.error("razorpay_order_failed", session_id=session_id, error=str(e))
            await self.audit.log(
                session_id=session_id,
                step="OFFER",
                direction="merchant→razorpay",
                message={"action": "create_order", "error": str(e)},
                status="failure",
                error_details=str(e),
            )
            raise

    async def simulate_payment(
        self,
        session_id: str,
        order_id: str,
        amount_paise: int,
        simulate_failure: bool = False,
    ) -> Dict[str, Any]:
        """
        Simulate payment processing for agent-to-agent flow (no browser).
        On first attempt with simulate_failure=True, returns a decline.
        Subsequent attempts for the same session succeed.
        """
        # Deliberate failure on first attempt
        if simulate_failure and not self._failure_simulated.get(session_id, False):
            self._failure_simulated[session_id] = True
            result = {
                "razorpay_payment_id": None,
                "razorpay_order_id": order_id,
                "status": "failed",
                "error": "Payment declined by issuing bank — insufficient funds (simulated)",
                "error_code": "BAD_REQUEST_ERROR",
                "error_source": "bank",
            }
            logger.warning(
                "payment_simulated_failure",
                session_id=session_id,
                order_id=order_id,
            )
            await self.audit.log(
                session_id=session_id,
                step="MANDATE",
                direction="merchant→razorpay",
                message={"action": "simulate_payment", "result": "FAILURE"},
                razorpay_event=json.dumps(result),
                status="failure",
                error_details=result["error"],
            )
            return result

        # Successful payment
        payment_id = f"pay_test_{uuid.uuid4().hex[:12]}"
        result = {
            "razorpay_payment_id": payment_id,
            "razorpay_order_id": order_id,
            "status": "authorized",
            "method": "card",
            "amount": amount_paise,
        }
        logger.info(
            "payment_simulated_success",
            session_id=session_id,
            payment_id=payment_id,
        )
        await self.audit.log(
            session_id=session_id,
            step="MANDATE",
            direction="merchant→razorpay",
            message={"action": "simulate_payment", "result": "SUCCESS", "payment_id": payment_id},
            razorpay_event=json.dumps(result),
        )
        return result

    async def capture_payment(
        self,
        session_id: str,
        payment_id: str,
        amount_paise: int,
    ) -> Dict[str, Any]:
        """Simulate payment capture (in test mode without real checkout)."""
        result = {
            "id": payment_id,
            "status": "captured",
            "amount": amount_paise,
            "currency": "INR",
            "captured": True,
        }
        logger.info(
            "payment_captured",
            session_id=session_id,
            payment_id=payment_id,
            amount=amount_paise,
        )
        await self.audit.log(
            session_id=session_id,
            step="CONFIRMATION",
            direction="merchant→razorpay",
            message={"action": "capture_payment", "payment_id": payment_id, "amount": amount_paise},
            razorpay_event=json.dumps(result),
        )
        return result

    async def verify_webhook_signature(self, body: str, signature: str, secret: str) -> bool:
        """Verify Razorpay webhook signature."""
        try:
            self.client.utility.verify_webhook_signature(body, signature, secret)
            return True
        except Exception:
            return False

    async def fetch_payment(self, session_id: str, payment_id: str) -> Dict[str, Any]:
        """Fetch payment details from Razorpay."""
        try:
            payment = self.client.payment.fetch(payment_id)
            return payment
        except Exception as e:
            logger.error("fetch_payment_failed", payment_id=payment_id, error=str(e))
            return {"error": str(e)}
