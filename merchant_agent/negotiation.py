"""
Handles LLM-based text generation for the merchant agent.
"""
from typing import List, Any, Dict
import structlog
from shared.llm_client import LLMClient

logger = structlog.get_logger()

async def generate_offer_text(llm_client: LLMClient, line_items: List[Any], total_paise: int, discount_pct: float, justification: str) -> str:
    """
    Generates natural language offer text using the LLM.

    Args:
        llm_client: The initialized LLM client.
        line_items: The items being offered.
        total_paise: The total offer amount in paise.
        discount_pct: The discount percentage applied.
        justification: The policy justification for the offer.

    Returns:
        A natural language string representing the offer.
    """
    try:
        if hasattr(llm_client, "phrase_offer"):
            return await llm_client.phrase_offer(line_items, total_paise, discount_pct, justification)
        else:
            return f"We can offer this for {total_paise/100} INR. {justification}"
    except Exception as e:
        logger.error(f"LLM offer generation failed: {e}")
        return f"We offer the items for a total of {total_paise/100} INR. ({justification})"

async def generate_confirmation_text(llm_client: LLMClient, payment_result: Dict[str, Any], amount_paise: int) -> str:
    """
    Generates natural language confirmation text using the LLM.

    Args:
        llm_client: The initialized LLM client.
        payment_result: The result of the payment capture.
        amount_paise: The amount paid in paise.

    Returns:
        A natural language string confirming the order.
    """
    try:
        if hasattr(llm_client, "phrase_confirmation"):
            return await llm_client.phrase_confirmation(payment_result, amount_paise)
        else:
            status = payment_result.get("status", "unknown")
            return f"Your payment of {amount_paise/100} INR is {status}."
    except Exception as e:
        logger.error(f"LLM confirmation generation failed: {e}")
        return f"Payment status: {payment_result.get('status', 'processed')}."

async def generate_rejection_text(llm_client: LLMClient, reasons: List[str]) -> str:
    """
    Generates natural language rejection text using the LLM.

    Args:
        llm_client: The initialized LLM client.
        reasons: The reasons for rejection.

    Returns:
        A natural language string rejecting the intent.
    """
    try:
        if hasattr(llm_client, "phrase_rejection"):
            return await llm_client.phrase_rejection(reasons)
        else:
            return f"Cannot process request: {', '.join(reasons)}"
    except Exception as e:
        logger.error(f"LLM rejection generation failed: {e}")
        return f"Request rejected. Reasons: {', '.join(reasons)}"
