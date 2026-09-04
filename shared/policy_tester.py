import uuid
from shared.policy_schema import (
    CompiledPolicy, NegotiationProposal, TestScenario, TestResult, VerificationReport
)
from shared.policy_engine import evaluate_proposal, PLATFORM_MAX_DISCOUNT


class PolicyTester:
    def generate_scenarios(self, policy: CompiledPolicy) -> list[TestScenario]:
        """Auto-generate adversarial test scenarios for a compiled policy."""
        scenarios = []
        max_disc = policy.effective_max_discount
        
        # ── Boundary Tests ──
        boundary_values = [
            (max_disc - 1, "ALLOW", f"{max_disc-1}% (below ceiling)"),
            (max_disc, "ALLOW", f"{max_disc}% (exactly at ceiling)"),
            (max_disc + 0.01, "MODIFY", f"{max_disc+0.01}% (just above ceiling)"),
            (max_disc + 5, "MODIFY", f"{max_disc+5}% (above ceiling)"),
            (max_disc + 25, "MODIFY", f"{max_disc+25}% (well above ceiling)"),
            (0, "ALLOW", "0% (no discount)"),
            (1, "ALLOW", "1% (minimal discount)"),
        ]
        
        if max_disc < PLATFORM_MAX_DISCOUNT:
            boundary_values.append((PLATFORM_MAX_DISCOUNT + 1, "DENY" if PLATFORM_MAX_DISCOUNT + 1 > PLATFORM_MAX_DISCOUNT else "MODIFY", f"{PLATFORM_MAX_DISCOUNT+1}% (above platform ceiling)"))
        
        for disc, expected, desc in boundary_values:
            if disc < 0:
                continue
            subtotal = 100000  # ₹1,000
            offered = int(subtotal * (1 - disc / 100))
            scenarios.append(TestScenario(
                scenario_id=f"boundary_{uuid.uuid4().hex[:6]}",
                description=f"Boundary: {desc}",
                proposal=NegotiationProposal(
                    session_id=f"test_{uuid.uuid4().hex[:8]}",
                    requested_items=[{"product_id": "test-item", "name": "Test Product", "quantity": 1, "price_paise": subtotal}],
                    subtotal_paise=subtotal,
                    offered_paise=max(offered, 0),
                    requested_discount_pct=disc,
                ),
                expected_decision=expected,
                category="boundary"
            ))
        
        # ── Stacking Tests ──
        has_no_stacking = any(c.type == "no_discount_stacking" for c in policy.constraints)
        if has_no_stacking:
            scenarios.append(TestScenario(
                scenario_id=f"stacking_{uuid.uuid4().hex[:6]}",
                description="Stacking: existing 10% coupon + 15% discount request",
                proposal=NegotiationProposal(
                    session_id=f"test_{uuid.uuid4().hex[:8]}",
                    requested_items=[{"product_id": "test-item", "name": "Test Product", "quantity": 1, "price_paise": 100000}],
                    subtotal_paise=100000,
                    offered_paise=75000,
                    requested_discount_pct=15,
                    existing_coupon_pct=10,
                ),
                expected_decision="DENY",
                category="stacking"
            ))
            scenarios.append(TestScenario(
                scenario_id=f"stacking_{uuid.uuid4().hex[:6]}",
                description="Stacking: no existing coupon + valid discount (should pass)",
                proposal=NegotiationProposal(
                    session_id=f"test_{uuid.uuid4().hex[:8]}",
                    requested_items=[{"product_id": "test-item", "name": "Test Product", "quantity": 1, "price_paise": 100000}],
                    subtotal_paise=100000,
                    offered_paise=int(100000 * (1 - max_disc / 100)),
                    requested_discount_pct=max_disc,
                    existing_coupon_pct=0,
                ),
                expected_decision="ALLOW",
                category="stacking"
            ))
        
        # ── Eligibility Tests ──
        has_one_offer = any(c.type == "max_one_offer_per_customer" for c in policy.constraints)
        if has_one_offer:
            scenarios.append(TestScenario(
                scenario_id=f"eligibility_{uuid.uuid4().hex[:6]}",
                description="Eligibility: customer already used recovery offer (should deny)",
                proposal=NegotiationProposal(
                    session_id=f"test_{uuid.uuid4().hex[:8]}",
                    requested_items=[{"product_id": "test-item", "name": "Test Product", "quantity": 1, "price_paise": 100000}],
                    subtotal_paise=100000,
                    offered_paise=int(100000 * (1 - max_disc / 100)),
                    requested_discount_pct=max_disc,
                    customer_recovery_offers_used=1,
                ),
                expected_decision="DENY",
                category="eligibility"
            ))
            scenarios.append(TestScenario(
                scenario_id=f"eligibility_{uuid.uuid4().hex[:6]}",
                description="Eligibility: fresh customer (should allow)",
                proposal=NegotiationProposal(
                    session_id=f"test_{uuid.uuid4().hex[:8]}",
                    requested_items=[{"product_id": "test-item", "name": "Test Product", "quantity": 1, "price_paise": 100000}],
                    subtotal_paise=100000,
                    offered_paise=int(100000 * (1 - max_disc / 100)),
                    requested_discount_pct=max_disc,
                    customer_recovery_offers_used=0,
                ),
                expected_decision="ALLOW",
                category="eligibility"
            ))
        
        # ── Edge Case Tests ──
        scenarios.append(TestScenario(
            scenario_id=f"edge_{uuid.uuid4().hex[:6]}",
            description="Edge: 100% discount (free product)",
            proposal=NegotiationProposal(
                session_id=f"test_{uuid.uuid4().hex[:8]}",
                requested_items=[{"product_id": "test-item", "name": "Test Product", "quantity": 1, "price_paise": 100000}],
                subtotal_paise=100000,
                offered_paise=0,
                requested_discount_pct=100,
            ),
            expected_decision="DENY" if max_disc < 100 else "ALLOW",
            category="edge_case"
        ))
        
        return scenarios
    
    def run_verification(self, policy: CompiledPolicy, scenarios: list[TestScenario] | None = None) -> VerificationReport:
        """Run all test scenarios against the policy engine and return a report."""
        if scenarios is None:
            scenarios = self.generate_scenarios(policy)
        
        results = []
        categories = {}
        
        for scenario in scenarios:
            decision = evaluate_proposal(scenario.proposal, [policy])
            actual = decision.decision
            passed = actual == scenario.expected_decision
            
            results.append(TestResult(
                scenario_id=scenario.scenario_id,
                description=scenario.description,
                expected=scenario.expected_decision,
                actual=actual,
                passed=passed,
                detail=decision.reasoning if not passed else "OK"
            ))
            
            cat = scenario.category
            if cat not in categories:
                categories[cat] = {"passed": 0, "failed": 0}
            if passed:
                categories[cat]["passed"] += 1
            else:
                categories[cat]["failed"] += 1
        
        return VerificationReport(
            policy_id=policy.policy_id,
            total_scenarios=len(results),
            passed=sum(1 for r in results if r.passed),
            failed=sum(1 for r in results if not r.passed),
            results=results,
            categories=categories
        )
