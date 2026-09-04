from shared.policy_schema import CapabilityToken, GatewayResult, PolicyDecisionResult

# Default capability tokens for each agent
DEFAULT_TOKENS = {
    "merchant_agent": CapabilityToken(
        agent_id="merchant_agent",
        agent_name="Ramana Mobile Hub Merchant Agent",
        permissions=["read.customer", "read.order", "read.catalog", "create.order", "create.payment_link", "update.policy"],
        limits={
            "max_discount_percent": 50,  # Platform ceiling
            "max_order_amount_paise": 10_000_000,  # ₹1,00,000
            "max_attempts_per_customer": 3,
        }
    ),
    "buyer_agent": CapabilityToken(
        agent_id="buyer_agent",
        agent_name="Buyer Procurement Agent",
        permissions=["read.catalog", "read.order", "create.order", "negotiate.price"],
        limits={
            "max_discount_percent": 50,  # Can request up to platform ceiling
            "max_order_amount_paise": 10_000_000,
            "max_attempts_per_customer": 5,
        }
    ),
}

class ToolGateway:
    def __init__(self, tokens: dict[str, CapabilityToken] | None = None):
        self.tokens = tokens or DEFAULT_TOKENS
    
    def get_token(self, agent_id: str) -> CapabilityToken | None:
        return self.tokens.get(agent_id)
    
    def authorize_action(
        self,
        agent_id: str,
        action: str,  # "create.order", "create.payment_link", "negotiate.price"
        params: dict,  # {"discount_percent": 25, "amount_paise": 500000}
        policy_decision: PolicyDecisionResult | None = None,
    ) -> GatewayResult:
        """Check if an agent has permission and capability to perform an action."""
        token = self.get_token(agent_id)
        if not token:
            return GatewayResult(
                authorized=False,
                action=action,
                agent_id=agent_id,
                violation="UNKNOWN_AGENT",
                detail=f"No capability token found for agent '{agent_id}'"
            )
        
        # 1. Permission check
        if action not in token.permissions:
            return GatewayResult(
                authorized=False,
                action=action,
                agent_id=agent_id,
                violation="PERMISSION_DENIED",
                detail=f"Agent '{agent_id}' lacks permission '{action}'. Has: {token.permissions}"
            )
        
        # 2. Discount limit check
        requested_discount = params.get("discount_percent", 0)
        max_discount = token.limits.get("max_discount_percent", 100)
        if requested_discount > max_discount:
            return GatewayResult(
                authorized=False,
                action=action,
                agent_id=agent_id,
                violation="DISCOUNT_CEILING_EXCEEDED",
                detail=f"Requested discount: {requested_discount}%. Authorized maximum: {max_discount}%."
            )
        
        # 3. Amount limit check
        amount_paise = params.get("amount_paise", 0)
        max_amount = token.limits.get("max_order_amount_paise", float('inf'))
        if amount_paise > max_amount:
            return GatewayResult(
                authorized=False,
                action=action,
                agent_id=agent_id,
                violation="AMOUNT_LIMIT_EXCEEDED",
                detail=f"Order amount: ₹{amount_paise/100:,.2f}. Authorized maximum: ₹{max_amount/100:,.2f}."
            )
        
        # 4. Policy Decision Point check (if provided)
        if policy_decision and policy_decision.decision == "DENY":
            return GatewayResult(
                authorized=False,
                action=action,
                agent_id=agent_id,
                violation="POLICY_DECISION_DENY",
                detail=f"Policy engine denied this action: {policy_decision.reasoning}"
            )
        
        return GatewayResult(
            authorized=True,
            action=action,
            agent_id=agent_id,
            detail=f"Authorized. Agent '{agent_id}' has permission '{action}' within limits."
        )
