"""
Handles discovery of the merchant agent catalog and properties.
"""
import httpx
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

async def discover_catalog(merchant_url: str) -> List[Dict[str, Any]]:
    """
    Fetches the merchant catalog.

    Args:
        merchant_url: The base URL of the merchant agent.

    Returns:
        A list of product dictionaries.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{merchant_url.rstrip('/')}/catalog", timeout=10.0)
            response.raise_for_status()
            data = response.json()
            return data.get('products', []) if isinstance(data, dict) else data
    except Exception as e:
        logger.error(f"Failed to discover catalog: {e}")
        return []

async def discover_agent_card(merchant_url: str) -> Dict[str, Any]:
    """
    Fetches the merchant agent card for capabilities discovery.

    Args:
        merchant_url: The base URL of the merchant agent.

    Returns:
        A dictionary with the agent card information.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{merchant_url.rstrip('/')}/.well-known/agent-card.json", timeout=10.0)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        logger.error(f"Failed to discover agent card: {e}")
        return {}

def build_catalog_price_map(products: List[Dict[str, Any]]) -> Dict[str, int]:
    """
    Builds a map from product IDs to their prices.

    Args:
        products: The list of product dictionaries.

    Returns:
        A dictionary mapping product ID to price in paise.
    """
    price_map = {}
    for p in products:
        if 'id' in p and 'price_paise' in p:
            price_map[p['id']] = p['price_paise']
    return price_map
