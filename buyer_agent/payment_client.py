"""
Handles outgoing payment communication with the merchant agent.
"""
import httpx
import logging
from typing import Dict, Any, Optional
from shared.models import MandateMessage, ConfirmationMessage

logger = logging.getLogger(__name__)

async def authorize_payment(merchant_url: str, mandate: MandateMessage) -> Dict[str, Any]:
    """
    Sends the payment authorization mandate to the merchant.

    Args:
        merchant_url: The base URL of the merchant agent.
        mandate: The mandate message to send.

    Returns:
        The merchant's response dictionary.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{merchant_url.rstrip('/')}/handshake/mandate",
                json=mandate.model_dump(),
                timeout=15.0
            )
            response.raise_for_status()
            return response.json()
    except Exception as e:
        logger.error(f"Payment authorization failed: {e}")
        return {"error": str(e)}

async def handle_payment_failure(failure_response: Dict[str, Any], session_id: str, attempt: int) -> Dict[str, Any]:
    """
    Handles a payment failure scenario.

    Args:
        failure_response: The failure details from the merchant.
        session_id: The session ID.
        attempt: The retry attempt number.

    Returns:
        A dictionary with retry context.
    """
    logger.warning(f"Payment failed for session {session_id}, attempt {attempt}. Response: {failure_response}")
    # Return context for retry
    return {
        "retry_allowed": True,
        "reason": failure_response.get("error", "Unknown error")
    }

async def handle_payment_success(confirmation: ConfirmationMessage, profile: Any) -> None:
    """
    Handles a successful payment scenario.

    Args:
        confirmation: The confirmation message from the merchant.
        profile: The buyer's profile object to update.
    """
    # update spent_paise on profile
    amount = confirmation.amount_settled_paise if hasattr(confirmation, 'amount_settled_paise') else 0
    if not amount and getattr(confirmation, 'razorpay_payment_id', None):
        amount = 0 # fallback
    
    profile.spent_paise += amount
    logger.info(f"Payment successful, spent updated. Total spent: {profile.spent_paise}")
