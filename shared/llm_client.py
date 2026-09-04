import json
import structlog
from typing import List, Dict, Optional
from openai import AsyncOpenAI
from shared.config import settings

logger = structlog.get_logger(__name__)

class LLMClient:
    def __init__(self, api_key: str, model: str, base_url: str):
        self.api_key = api_key
        self.model = model
        self.base_url = base_url
        if self.api_key:
            self.client = AsyncOpenAI(api_key=self.api_key, base_url=self.base_url)
        else:
            self.client = None

    async def _call(self, system_prompt: str, user_prompt: str, temperature: float = 0.3, max_tokens: int = 500) -> str:
        if not self.client:
            logger.warning("LLM client not initialized (missing API key). Returning fallback.")
            return "Fallback LLM response due to missing configuration."

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=temperature,
                max_tokens=max_tokens
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            logger.error("LLM call failed", error=str(e))
            return f"Fallback LLM response due to error: {str(e)}"

    async def parse_intent(self, raw_text: str) -> List[Dict]:
        if not self.client:
            return []
            
        system_prompt = '''You are a helpful assistant. Parse the user's shopping intent and output ONLY a JSON array of objects. 
Each object MUST have:
- product_id (string)
- quantity (integer)
- max_price_paise (integer, optional)
Do not output any markdown formatting or extra text. Output ONLY valid JSON array.'''
        
        try:
            response = await self._call(system_prompt, raw_text, temperature=0.1)
            # Remove possible markdown backticks
            cleaned = response.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
                
            return json.loads(cleaned.strip())
        except Exception as e:
            logger.error("Failed to parse intent", error=str(e))
            return []

    async def phrase_offer(self, line_items: List[Dict], total_paise: int, discount_pct: float, policy_justification: str) -> str:
        system = "You are a merchant making an offer to a buyer. Keep it concise, polite, and strictly business."
        prompt = f"Offer details: {line_items}, Total: {total_paise} paise, Discount: {discount_pct}%. Policy info: {policy_justification}. Phrase this offer naturally."
        return await self._call(system, prompt, temperature=0.7)

    async def phrase_mandate(self, offer_summary: Dict, approved: bool, reasons: List[str]) -> str:
        system = "You are a buyer evaluating a merchant's offer. Keep it concise and polite."
        prompt = f"Offer: {offer_summary}. Approved: {approved}. Reasons: {reasons}. Phrase your authorization or rejection naturally."
        return await self._call(system, prompt, temperature=0.7)

    async def phrase_confirmation(self, payment_result: str, amount_paise: int) -> str:
        system = "You are a merchant confirming a payment settlement. Be professional and concise."
        prompt = f"Payment status: {payment_result}, Amount: {amount_paise} paise. Phrase the confirmation."
        return await self._call(system, prompt, temperature=0.7)

    async def phrase_rejection(self, reasons: List[str], counter_amount_paise: Optional[int] = None) -> str:
        system = "You are a merchant rejecting an offer or proposing a counter-offer. Be polite and professional."
        prompt = f"Reasons: {reasons}. Counter amount (paise, if any): {counter_amount_paise}. Phrase the rejection/counter-offer."
        return await self._call(system, prompt, temperature=0.7)

def get_llm_client() -> LLMClient:
    return LLMClient(
        api_key=settings.GROQ_API_KEY,
        model=settings.GROQ_MODEL,
        base_url=settings.GROQ_BASE_URL
    )
