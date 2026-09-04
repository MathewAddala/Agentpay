"""
Handles LLM-based text generation for the buyer agent.
"""
import json
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

async def generate_intent_text(llm_client: Any, preference_text: str, selected_items: List[Dict[str, Any]]) -> str:
    """
    Generates natural language intent text using the LLM.

    Args:
        llm_client: The initialized LLM client.
        preference_text: The user's preferences.
        selected_items: The items selected for purchase.

    Returns:
        A natural language string expressing intent.
    """
    if not llm_client:
        return f"I would like to purchase the following based on my preference '{preference_text}': " + ", ".join([item.get('id', '') for item in selected_items])
    
    prompt = f"Given the buyer's preference: '{preference_text}' and the selected items: {json.dumps(selected_items)}, write a short natural language message expressing the intent to buy these items."
    try:
        if hasattr(llm_client, "generate_text"):
            response = await llm_client.generate_text(prompt)
            return response
        return f"I would like to purchase the following based on my preference '{preference_text}': " + ", ".join([item.get('id', '') for item in selected_items])
    except Exception as e:
        logger.error(f"LLM intent generation failed: {e}")
        return f"I would like to purchase these items based on my needs: {', '.join([i.get('id', '') for i in selected_items])}"

async def generate_mandate_text(llm_client: Any, offer_summary: str, approved: bool, reasons: List[str]) -> str:
    """
    Generates natural language mandate text using the LLM.

    Args:
        llm_client: The initialized LLM client.
        offer_summary: Summary of the evaluated offer.
        approved: Whether the mandate was approved.
        reasons: Reasons for approval or rejection.

    Returns:
        A natural language string representing the mandate decision.
    """
    try:
        if hasattr(llm_client, "phrase_mandate"):
            return await llm_client.phrase_mandate(offer_summary, approved, reasons)
        
        # Fallback if method doesn't exist
        prompt = f"The buyer agent has evaluated an offer. Offer summary: {offer_summary}. Approved: {approved}. Reasons: {reasons}. Write a short message authorizing or declining the payment based on this."
        if hasattr(llm_client, "generate_text"):
            return await llm_client.generate_text(prompt)
        return f"Mandate {'approved' if approved else 'rejected'}: {', '.join(reasons)}"
    except Exception as e:
        logger.error(f"LLM mandate text generation failed: {e}")
        return f"Mandate {'approved' if approved else 'rejected'}: {', '.join(reasons)}"

async def generate_rejection_text(llm_client: Any, reasons: List[str], counter_suggestion: Optional[str] = None) -> str:
    """
    Generates natural language rejection text using the LLM.

    Args:
        llm_client: The initialized LLM client.
        reasons: Reasons for rejecting the offer.
        counter_suggestion: An optional counter suggestion.

    Returns:
        A natural language string rejecting the offer.
    """
    try:
        if hasattr(llm_client, "phrase_rejection"):
            return await llm_client.phrase_rejection(reasons, 0)
            
        prompt = f"The buyer agent is rejecting an offer. Reasons: {reasons}. Counter suggestion: {counter_suggestion}. Write a polite rejection message, including the suggestion if present."
        if hasattr(llm_client, "generate_text"):
            return await llm_client.generate_text(prompt)
        return f"Offer rejected: {', '.join(reasons)}."
    except Exception as e:
        logger.error(f"LLM rejection generation failed: {e}")
        return f"Offer rejected: {', '.join(reasons)}."
