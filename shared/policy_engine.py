import json
from typing import Any
from datetime import datetime, timezone
from shared.policy_schema import (
    CompiledPolicy, PolicyRule, PolicyCondition, PolicyOffer, PolicyConstraint,
    NegotiationProposal, ConstraintResult, PolicyDecisionResult, ValidationResult,
    ConstraintLevel
)

# ═══════════════════════════════════════════════════════════════
# 1. PLATFORM SAFETY CONSTANTS (Level 0 — HARDCODED, IMMUTABLE)
# ═══════════════════════════════════════════════════════════════
PLATFORM_MAX_DISCOUNT = 50.0  # No agent can ever exceed 50%
PLATFORM_MIN_ORDER_PAISE = 100  # ₹1 minimum
PLATFORM_MAX_ORDER_PAISE = 10_000_000  # ₹1,00,000 maximum

# ═══════════════════════════════════════════════════════════════
# 2. POLICY COMPILER
# ═══════════════════════════════════════════════════════════════
def compile_policy(raw_json: dict, raw_merchant_input: str = "") -> CompiledPolicy:
    """Converts LLM-generated structured JSON into a validated CompiledPolicy.
    
    The LLM generates raw_json, but this function:
    1. Parses it into Pydantic models
    2. Calculates effective_max_discount = MIN(all rule maxes)
    3. Returns a CompiledPolicy ready for storage
    """
    # Parse rules from raw JSON
    rules = []
    for i, r in enumerate(raw_json.get("rules", [])):
        conditions = [PolicyCondition(**c) for c in r.get("when", []) if isinstance(r.get("when"), list)] if isinstance(r.get("when"), list) else []
        # Handle when as dict (field: value pairs)
        if isinstance(r.get("when"), dict):
            for field, val in r["when"].items():
                if isinstance(val, dict):
                    for op, v in val.items():
                        conditions.append(PolicyCondition(field=field, operator=op, value=v))
                else:
                    conditions.append(PolicyCondition(field=field, operator="eq", value=val))
        
        offer_data = r.get("offer", {})
        disc_data = offer_data.get("discount_percent", offer_data)
        max_disc = disc_data.get("max", disc_data.get("discount_percent_max", 0)) if isinstance(disc_data, dict) else float(disc_data) if disc_data else 0
        min_disc = disc_data.get("min", disc_data.get("discount_percent_min", 0)) if isinstance(disc_data, dict) else 0
        
        rules.append(PolicyRule(
            rule_id=r.get("rule_id", f"rule_{i}"),
            description=r.get("description", ""),
            when=conditions,
            offer=PolicyOffer(
                discount_percent_max=min(float(max_disc), 100),
                discount_percent_min=max(float(min_disc), 0)
            )
        ))
    
    # Parse constraints
    constraints = []
    for c in raw_json.get("constraints", []):
        if isinstance(c, str):
            constraints.append(PolicyConstraint(type=c, description=c))
        elif isinstance(c, dict):
            constraints.append(PolicyConstraint(**c))
    
    # Calculate effective_max_discount = MIN(all rule maxes)
    rule_maxes = [r.offer.discount_percent_max for r in rules if r.offer.discount_percent_max > 0]
    effective_max = min(rule_maxes) if rule_maxes else 0
    # Platform cap
    effective_max = min(effective_max, PLATFORM_MAX_DISCOUNT)
    
    policy = CompiledPolicy(
        policy_id=raw_json.get("policy_id", f"policy_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"),
        objective=raw_json.get("objective", "general"),
        level=raw_json.get("level", 1),
        rules=rules,
        constraints=constraints,
        effective_max_discount=effective_max,
        raw_merchant_input=raw_merchant_input,
    )
    return policy

# ═══════════════════════════════════════════════════════════════
# 3. SCHEMA VALIDATOR
# ═══════════════════════════════════════════════════════════════
def validate_schema(policy: CompiledPolicy) -> ValidationResult:
    """Validates that a compiled policy has correct structure."""
    errors = []
    warnings = []
    
    if not policy.policy_id:
        errors.append("policy_id is required")
    if not policy.rules and not policy.constraints:
        errors.append("Policy must have at least one rule or constraint")
    if policy.level < 0 or policy.level > 4:
        errors.append(f"level must be 0-4, got {policy.level}")
    
    for i, rule in enumerate(policy.rules):
        if rule.offer.discount_percent_max < 0:
            errors.append(f"Rule {i}: discount_percent_max cannot be negative")
        if rule.offer.discount_percent_max > 100:
            errors.append(f"Rule {i}: discount_percent_max cannot exceed 100%, got {rule.offer.discount_percent_max}%")
        if rule.offer.discount_percent_min > rule.offer.discount_percent_max:
            errors.append(f"Rule {i}: discount_percent_min ({rule.offer.discount_percent_min}) > discount_percent_max ({rule.offer.discount_percent_max})")
    
    if policy.effective_max_discount > PLATFORM_MAX_DISCOUNT:
        errors.append(f"effective_max_discount ({policy.effective_max_discount}%) exceeds platform ceiling ({PLATFORM_MAX_DISCOUNT}%)")
    
    return ValidationResult(valid=len(errors) == 0, errors=errors, warnings=warnings)

# ═══════════════════════════════════════════════════════════════
# 4. SEMANTIC VALIDATOR
# ═══════════════════════════════════════════════════════════════
def validate_semantics(policy: CompiledPolicy) -> ValidationResult:
    """Validates business logic correctness of a policy."""
    errors = []
    warnings = []
    
    # Check for contradictory rules
    rule_maxes = [r.offer.discount_percent_max for r in policy.rules]
    rule_mins = [r.offer.discount_percent_min for r in policy.rules]
    
    if rule_maxes and rule_mins:
        global_min_of_maxes = min(rule_maxes)
        global_max_of_mins = max(rule_mins) if rule_mins else 0
        if global_max_of_mins > global_min_of_maxes:
            errors.append(
                f"Contradictory rules: a rule requires minimum {global_max_of_mins}% "
                f"but another caps maximum at {global_min_of_maxes}%"
            )
    
    # Check stacking constraint vs multiple rules
    has_no_stacking = any(c.type == "no_discount_stacking" for c in policy.constraints)
    if has_no_stacking and len(policy.rules) > 1:
        warnings.append(
            "Policy has no_discount_stacking constraint with multiple rules. "
            "Only the first matching rule will apply."
        )
    
    # Check margin floor feasibility
    for c in policy.constraints:
        if c.type == "margin_floor" and c.value is not None:
            margin_floor = float(c.value)
            max_disc = policy.effective_max_discount
            if max_disc > (100 - margin_floor):
                errors.append(
                    f"Margin floor of {margin_floor}% is incompatible with "
                    f"effective max discount of {max_disc}% (would leave only {100-max_disc}% margin)"
                )
    
    return ValidationResult(valid=len(errors) == 0, errors=errors, warnings=warnings)

# ═══════════════════════════════════════════════════════════════
# 5. CONDITION EVALUATOR
# ═══════════════════════════════════════════════════════════════
def evaluate_condition(condition: PolicyCondition, context: dict) -> bool:
    """Evaluates a single condition against a context dictionary."""
    field_value = context.get(condition.field)
    if field_value is None:
        return True  # If field not in context, condition is not applicable (pass)
    
    op = condition.operator
    target = condition.value
    
    try:
        if op == "eq":
            return field_value == target
        elif op == "neq":
            return field_value != target
        elif op == "gte":
            return float(field_value) >= float(target)
        elif op == "lte":
            return float(field_value) <= float(target)
        elif op == "gt":
            return float(field_value) > float(target)
        elif op == "lt":
            return float(field_value) < float(target)
        elif op == "in":
            return field_value in (target if isinstance(target, list) else [target])
        elif op == "not_in":
            return field_value not in (target if isinstance(target, list) else [target])
    except (ValueError, TypeError):
        return False
    return False

# ═══════════════════════════════════════════════════════════════
# 6. POLICY DECISION POINT (PDP) — THE CORE ENGINE
# ═══════════════════════════════════════════════════════════════
def evaluate_proposal(
    proposal: NegotiationProposal,
    policies: list[CompiledPolicy],
    context: dict | None = None
) -> PolicyDecisionResult:
    """The deterministic Policy Decision Point.
    
    Evaluates a negotiation proposal against ALL active policies,
    applying hierarchical constraint resolution (L0 → L4).
    
    Returns ALLOW, DENY, or MODIFY with full constraint evaluation chain.
    """
    constraints_evaluated = []
    policy_ids = [p.policy_id for p in policies]
    
    # Build evaluation context from proposal
    eval_context = {
        "order.amount": proposal.subtotal_paise / 100,  # in rupees
        "order.amount_paise": proposal.subtotal_paise,
        "order.item_count": sum(item.get("quantity", 1) for item in proposal.requested_items),
        "customer.segment": proposal.customer_segment,
        "customer.lifetime_value": proposal.customer_lifetime_value_paise / 100,
        "checkout.abandoned_minutes": proposal.checkout_abandoned_minutes,
        "customer.recovery_offers_used": proposal.customer_recovery_offers_used,
        "requested.discount_pct": proposal.requested_discount_pct,
        **(context or {})
    }
    
    requested_discount = proposal.requested_discount_pct
    offered_paise = proposal.offered_paise
    subtotal_paise = proposal.subtotal_paise
    if subtotal_paise > 0 and offered_paise > 0:
        effective_requested_discount = round((subtotal_paise - offered_paise) / subtotal_paise * 100, 2)
    else:
        effective_requested_discount = requested_discount
    
    # ─── LEVEL 0: Platform Safety (Hardcoded) ───
    # Check platform ceiling
    constraints_evaluated.append(ConstraintResult(
        constraint_name="Platform Discount Ceiling",
        level=0,
        passed=effective_requested_discount <= PLATFORM_MAX_DISCOUNT,
        detail=f"Requested {effective_requested_discount:.1f}% vs platform max {PLATFORM_MAX_DISCOUNT}%",
        evaluated_value=effective_requested_discount,
        threshold=PLATFORM_MAX_DISCOUNT
    ))
    
    # Check platform order bounds
    if subtotal_paise > 0:
        constraints_evaluated.append(ConstraintResult(
            constraint_name="Platform Order Minimum",
            level=0,
            passed=subtotal_paise >= PLATFORM_MIN_ORDER_PAISE,
            detail=f"Order ₹{subtotal_paise/100:.2f} vs minimum ₹{PLATFORM_MIN_ORDER_PAISE/100:.2f}",
            evaluated_value=subtotal_paise,
            threshold=PLATFORM_MIN_ORDER_PAISE
        ))
        constraints_evaluated.append(ConstraintResult(
            constraint_name="Platform Order Maximum",
            level=0,
            passed=subtotal_paise <= PLATFORM_MAX_ORDER_PAISE,
            detail=f"Order ₹{subtotal_paise/100:.2f} vs maximum ₹{PLATFORM_MAX_ORDER_PAISE/100:.2f}",
            evaluated_value=subtotal_paise,
            threshold=PLATFORM_MAX_ORDER_PAISE
        ))
    
    # ─── LEVEL 1-2: Merchant & Automation Policies ───
    # Sort policies by level (lower = higher authority)
    sorted_policies = sorted(policies, key=lambda p: p.level)
    
    # Determine allowed discount from matching rules vs hard ceiling caps
    hierarchy_hard_caps = [PLATFORM_MAX_DISCOUNT]
    matching_rule_discounts = []
    
    for policy in sorted_policies:
        if not policy.is_active:
            continue
        
        # Check each rule's conditions
        for rule in policy.rules:
            all_conditions_met = all(
                evaluate_condition(cond, eval_context) for cond in rule.when
            ) if rule.when else True
            
            if all_conditions_met:
                matching_rule_discounts.append(rule.offer.discount_percent_max)
                constraints_evaluated.append(ConstraintResult(
                    constraint_name=f"Policy Rule: {rule.description or rule.rule_id}",
                    level=policy.level,
                    passed=True,
                    detail=f"Conditions met. Max allowed: {rule.offer.discount_percent_max}%",
                    evaluated_value=effective_requested_discount,
                    threshold=rule.offer.discount_percent_max
                ))
            else:
                constraints_evaluated.append(ConstraintResult(
                    constraint_name=f"Policy Rule: {rule.description or rule.rule_id}",
                    level=policy.level,
                    passed=True,  # Rule doesn't apply, so it doesn't block
                    detail=f"Conditions not met (rule not applicable)",
                    evaluated_value=None,
                    threshold=rule.offer.discount_percent_max
                ))
        
        # Check hard constraints
        for constraint in policy.constraints:
            if constraint.type == "no_discount_stacking":
                has_existing = proposal.existing_coupon_pct > 0
                stacking_attempted = has_existing and effective_requested_discount > 0
                constraints_evaluated.append(ConstraintResult(
                    constraint_name="No Discount Stacking",
                    level=policy.level,
                    passed=not stacking_attempted,
                    detail=f"Existing coupon: {proposal.existing_coupon_pct}%, requested: {effective_requested_discount}%" if stacking_attempted else "No stacking detected",
                    evaluated_value=stacking_attempted,
                    threshold=False
                ))
            
            elif constraint.type == "max_one_offer_per_customer":
                offers_used = proposal.customer_recovery_offers_used
                constraints_evaluated.append(ConstraintResult(
                    constraint_name="Max One Offer Per Customer",
                    level=policy.level,
                    passed=offers_used < 1,
                    detail=f"Recovery offers used: {offers_used}",
                    evaluated_value=offers_used,
                    threshold=1
                ))
            
            elif constraint.type == "max_discount_cap" and constraint.value is not None:
                cap = float(constraint.value)
                hierarchy_hard_caps.append(cap)
                constraints_evaluated.append(ConstraintResult(
                    constraint_name=f"Max Discount Cap ({cap}%)",
                    level=policy.level,
                    passed=effective_requested_discount <= cap,
                    detail=f"Requested {effective_requested_discount}% vs cap {cap}%",
                    evaluated_value=effective_requested_discount,
                    threshold=cap
                ))
    
    # ─── RESOLVE HIERARCHY ───
    # The proposal earns the highest discount allowed by any matching rule,
    # subject to all hard ceiling caps (e.g. platform 50%, policy cap).
    earned_discount = max(matching_rule_discounts) if matching_rule_discounts else 0.0
    positive_caps = [c for c in hierarchy_hard_caps if c > 0]
    strict_cap = min(positive_caps) if positive_caps else PLATFORM_MAX_DISCOUNT
    effective_max = min(earned_discount, strict_cap) if earned_discount > 0 else 0.0
    
    # ─── FINAL DISCOUNT CHECK ───
    constraints_evaluated.append(ConstraintResult(
        constraint_name="Hierarchical Discount Ceiling",
        level=1,
        passed=effective_requested_discount <= effective_max,
        detail=f"Requested {effective_requested_discount:.1f}% vs effective ceiling {effective_max:.1f}% (cap: {strict_cap:.1f}%, rule earned: {earned_discount:.1f}%)",
        evaluated_value=effective_requested_discount,
        threshold=effective_max
    ))
    
    # ─── DETERMINE DECISION ───
    all_passed = all(c.passed for c in constraints_evaluated)
    
    if all_passed:
        return PolicyDecisionResult(
            decision="ALLOW",
            proposal=proposal.model_dump(),
            evaluated_constraints=constraints_evaluated,
            effective_max_discount=effective_max,
            counter_offer_paise=offered_paise,
            reasoning=f"All {len(constraints_evaluated)} constraints satisfied. Discount of {effective_requested_discount:.1f}% is within ceiling of {effective_max:.1f}%.",
            policy_ids_evaluated=policy_ids
        )
    else:
        # Can we MODIFY to make it work?
        failed = [c for c in constraints_evaluated if not c.passed]
        is_only_discount_issue = all(
            "discount" in c.constraint_name.lower() or "ceiling" in c.constraint_name.lower()
            for c in failed
        )
        
        if is_only_discount_issue and effective_max > 0:
            # MODIFY: counter-offer at the effective max discount
            counter_paise = int(subtotal_paise * (1 - effective_max / 100))
            modified = proposal.model_dump()
            modified["offered_paise"] = counter_paise
            modified["requested_discount_pct"] = effective_max
            
            return PolicyDecisionResult(
                decision="MODIFY",
                proposal=proposal.model_dump(),
                evaluated_constraints=constraints_evaluated,
                effective_max_discount=effective_max,
                modified_proposal=modified,
                counter_offer_paise=counter_paise,
                reasoning=f"Requested discount {effective_requested_discount:.1f}% exceeds ceiling {effective_max:.1f}%. Counter-offer at {effective_max:.1f}% = ₹{counter_paise/100:,.2f}.",
                policy_ids_evaluated=policy_ids
            )
        else:
            # Hard DENY
            deny_reasons = [f"{c.constraint_name}: {c.detail}" for c in failed]
            return PolicyDecisionResult(
                decision="DENY",
                proposal=proposal.model_dump(),
                evaluated_constraints=constraints_evaluated,
                effective_max_discount=effective_max,
                reasoning="Proposal violates hard constraints: " + "; ".join(deny_reasons),
                policy_ids_evaluated=policy_ids
            )

# ═══════════════════════════════════════════════════════════════
# 7. HIERARCHY RESOLVER (Standalone utility)
# ═══════════════════════════════════════════════════════════════
def resolve_hierarchy(policies: list[CompiledPolicy]) -> dict:
    """Resolves the effective constraints across all policy levels."""
    levels = {
        0: {"name": "Platform Safety", "max_discount": PLATFORM_MAX_DISCOUNT},
        1: {"name": "Merchant Policy", "max_discount": 100.0},
        2: {"name": "Automation Rule", "max_discount": 100.0},
        3: {"name": "Customer Eligibility", "max_discount": 100.0},
        4: {"name": "Agent Negotiation", "max_discount": 100.0},
    }
    
    for policy in policies:
        if not policy.is_active:
            continue
        lvl = policy.level
        if lvl in levels:
            for rule in policy.rules:
                levels[lvl]["max_discount"] = min(levels[lvl]["max_discount"], rule.offer.discount_percent_max)
    
    effective = PLATFORM_MAX_DISCOUNT
    for lvl in sorted(levels.keys()):
        effective = min(effective, levels[lvl]["max_discount"])
        levels[lvl]["effective_after_this_level"] = effective
    
    return {
        "levels": levels,
        "effective_max_discount": effective
    }
