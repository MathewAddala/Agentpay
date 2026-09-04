from pydantic import BaseModel

class BuyerProfile(BaseModel):
    buyer_id: str = 'buyer-agent-001'
    total_budget_paise: int = 1000000  # ₹10,000
    max_single_purchase_paise: int = 500000  # ₹5,000
    preferred_categories: list[str] = ['api-plans', 'cloud-credits', 'dev-tools']
    risk_tolerance: str = 'medium'
    natural_language_preference: str = 'I need a scalable API plan with cloud credits for my new project. Looking for good value under ₹5,000 total.'
    spent_paise: int = 0  # Track spending

    @property
    def remaining_budget_paise(self) -> int:
        return self.total_budget_paise - self.spent_paise
    
    def can_afford(self, amount_paise: int) -> bool:
        return amount_paise <= self.remaining_budget_paise and amount_paise <= self.max_single_purchase_paise

DEFAULT_BUYER_PROFILE = BuyerProfile()

def get_buyer_profile() -> BuyerProfile:
    return DEFAULT_BUYER_PROFILE

def update_buyer_profile(profile: BuyerProfile) -> None:
    global DEFAULT_BUYER_PROFILE
    DEFAULT_BUYER_PROFILE = profile
