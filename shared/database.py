import os
import aiosqlite
from contextlib import asynccontextmanager
from typing import List, Optional
from datetime import datetime

from shared.models import AuditEntry, Product, SessionStatus, HandshakeStep

async def init_db(db_path: str):
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    async with aiosqlite.connect(db_path) as db:
        await db.execute('''
            CREATE TABLE IF NOT EXISTS catalog (
                product_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                category TEXT,
                price_paise INTEGER NOT NULL,
                currency TEXT DEFAULT 'INR',
                available BOOLEAN DEFAULT 1
            )
        ''')
        await db.execute('''
            CREATE TABLE IF NOT EXISTS audit_trail (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                step TEXT NOT NULL,
                direction TEXT NOT NULL,
                actor TEXT NOT NULL,
                message_json TEXT NOT NULL,
                policy_decision TEXT,
                razorpay_event TEXT,
                llm_input TEXT,
                llm_output TEXT,
                status TEXT DEFAULT 'success',
                error_details TEXT
            )
        ''')
        await db.execute('''
            CREATE TABLE IF NOT EXISTS sessions (
                session_id TEXT PRIMARY KEY,
                buyer_id TEXT,
                current_step TEXT,
                status TEXT DEFAULT 'active',
                created_at TEXT,
                updated_at TEXT,
                attempts INTEGER DEFAULT 1
            )
        ''')
        await db.execute('''
            CREATE TABLE IF NOT EXISTS orders (
                order_id TEXT PRIMARY KEY,
                session_id TEXT,
                customer_name TEXT NOT NULL,
                customer_email TEXT,
                items TEXT NOT NULL,
                subtotal_paise INTEGER NOT NULL,
                discount_pct REAL DEFAULT 0,
                discount_amount_paise INTEGER DEFAULT 0,
                total_paise INTEGER NOT NULL,
                razorpay_order_id TEXT,
                razorpay_payment_id TEXT,
                status TEXT DEFAULT 'created',
                order_type TEXT DEFAULT 'buyer_procurement',
                notes TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        ''')
        await db.execute('''
            CREATE TABLE IF NOT EXISTS negotiation_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                buyer_name TEXT DEFAULT 'Procurement Buyer',
                merchant_name TEXT DEFAULT 'Ramana Mobile Hub',
                items_summary TEXT NOT NULL,
                total_qty INTEGER DEFAULT 1,
                list_price_paise INTEGER NOT NULL,
                buyer_offered_paise INTEGER NOT NULL,
                buyer_target_discount_pct REAL,
                buyer_min_discount_pct REAL,
                merchant_counter_paise INTEGER,
                merchant_allowed_discount_pct REAL,
                rounds INTEGER DEFAULT 1,
                status TEXT NOT NULL,
                policy_rationale TEXT,
                razorpay_order_id TEXT
            )
        ''')
        # ── Policy Engine Tables ──
        await db.execute('''
            CREATE TABLE IF NOT EXISTS compiled_policies (
                policy_id TEXT PRIMARY KEY,
                objective TEXT DEFAULT 'general',
                level INTEGER DEFAULT 1,
                rules_json TEXT,
                constraints_json TEXT,
                effective_max_discount REAL DEFAULT 0,
                raw_merchant_input TEXT,
                schema_valid INTEGER DEFAULT 0,
                semantic_valid INTEGER DEFAULT 0,
                test_passed INTEGER DEFAULT 0,
                test_total INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1,
                created_at TEXT,
                updated_at TEXT
            )
        ''')
        await db.execute('''
            CREATE TABLE IF NOT EXISTS policy_decisions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT,
                timestamp TEXT,
                proposal_json TEXT,
                evaluated_constraints TEXT,
                effective_max_discount REAL,
                decision TEXT,
                modified_proposal_json TEXT,
                reasoning TEXT,
                agent_id TEXT,
                policy_ids_evaluated TEXT
            )
        ''')
        await db.execute('''
            CREATE TABLE IF NOT EXISTS capability_tokens (
                agent_id TEXT PRIMARY KEY,
                agent_name TEXT,
                permissions_json TEXT,
                limits_json TEXT,
                created_at TEXT,
                expires_at TEXT
            )
        ''')
        # ── Autonomous Standing Mandates Table ──
        await db.execute('''
            CREATE TABLE IF NOT EXISTS standing_mandates (
                mandate_id TEXT PRIMARY KEY,
                buyer_id TEXT DEFAULT 'procurement_buyer',
                product_id TEXT NOT NULL,
                product_name TEXT NOT NULL,
                quantity INTEGER DEFAULT 1,
                trigger_type TEXT DEFAULT 'price_drop',
                threshold_paise INTEGER,
                threshold_pct REAL,
                status TEXT DEFAULT 'active',
                created_at TEXT,
                triggered_at TEXT,
                razorpay_order_id TEXT
            )
        ''')
        await db.commit()

@asynccontextmanager
async def get_db(db_path: str):
    db = await aiosqlite.connect(db_path)
    db.row_factory = aiosqlite.Row
    try:
        yield db
    finally:
        await db.close()

async def insert_audit_entry(db_path: str, entry: AuditEntry):
    async with get_db(db_path) as db:
        await db.execute('''
            INSERT INTO audit_trail (
                session_id, timestamp, step, direction, actor, message_json,
                policy_decision, razorpay_event, llm_input, llm_output, status, error_details
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            entry.session_id,
            entry.timestamp.isoformat(),
            entry.step,
            entry.direction,
            entry.actor,
            entry.message_json,
            entry.policy_decision,
            entry.razorpay_event,
            entry.llm_input,
            entry.llm_output,
            entry.status,
            entry.error_details
        ))
        await db.commit()

async def get_session_audit_trail(db_path: str, session_id: str) -> List[AuditEntry]:
    async with get_db(db_path) as db:
        async with db.execute('SELECT * FROM audit_trail WHERE session_id = ? ORDER BY timestamp ASC', (session_id,)) as cursor:
            rows = await cursor.fetchall()
            return [
                AuditEntry(
                    id=row['id'],
                    session_id=row['session_id'],
                    timestamp=datetime.fromisoformat(row['timestamp']),
                    step=row['step'],
                    direction=row['direction'],
                    actor=row['actor'],
                    message_json=row['message_json'],
                    policy_decision=row['policy_decision'],
                    razorpay_event=row['razorpay_event'],
                    llm_input=row['llm_input'],
                    llm_output=row['llm_output'],
                    status=row['status'],
                    error_details=row['error_details']
                ) for row in rows
            ]

async def get_all_sessions(db_path: str) -> List[SessionStatus]:
    async with get_db(db_path) as db:
        async with db.execute('SELECT * FROM sessions ORDER BY updated_at DESC') as cursor:
            rows = await cursor.fetchall()
            return [
                SessionStatus(
                    session_id=row['session_id'],
                    buyer_id=row['buyer_id'],
                    current_step=row['current_step'],
                    status=row['status'],
                    created_at=datetime.fromisoformat(row['created_at']),
                    updated_at=datetime.fromisoformat(row['updated_at']),
                    attempts=row['attempts']
                ) for row in rows
            ]

async def update_session_status(db_path: str, session_id: str, step: HandshakeStep, status: str):
    async with get_db(db_path) as db:
        await db.execute('''
            UPDATE sessions 
            SET current_step = ?, status = ?, updated_at = ?
            WHERE session_id = ?
        ''', (step, status, datetime.utcnow().isoformat(), session_id))
        await db.commit()

async def create_session(db_path: str, session: SessionStatus):
    async with get_db(db_path) as db:
        await db.execute('''
            INSERT INTO sessions (session_id, buyer_id, current_step, status, created_at, updated_at, attempts)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            session.session_id,
            session.buyer_id,
            session.current_step,
            session.status,
            session.created_at.isoformat(),
            session.updated_at.isoformat(),
            session.attempts
        ))
        await db.commit()

async def seed_catalog(db_path: str, products: List[Product]):
    async with get_db(db_path) as db:
        await db.execute('DELETE FROM catalog')
        for product in products:
            await db.execute('''
                INSERT INTO catalog (product_id, name, description, category, price_paise, currency, available)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                product.product_id, product.name, product.description, product.category,
                product.price_paise, product.currency, int(product.available)
            ))
        await db.commit()

async def get_catalog(db_path: str) -> List[Product]:
    async with get_db(db_path) as db:
        async with db.execute('SELECT * FROM catalog') as cursor:
            rows = await cursor.fetchall()
            return [
                Product(
                    product_id=row['product_id'],
                    name=row['name'],
                    description=row['description'],
                    category=row['category'],
                    price_paise=row['price_paise'],
                    currency=row['currency'],
                    available=bool(row['available'])
                ) for row in rows
            ]

async def get_product(db_path: str, product_id: str) -> Optional[Product]:
    async with get_db(db_path) as db:
        async with db.execute('SELECT * FROM catalog WHERE product_id = ?', (product_id,)) as cursor:
            row = await cursor.fetchone()
            if row:
                return Product(
                    product_id=row['product_id'],
                    name=row['name'],
                    description=row['description'],
                    category=row['category'],
                    price_paise=row['price_paise'],
                    currency=row['currency'],
                    available=bool(row['available'])
                )
            return None

async def clear_database(db_path: str):
    """Wipes all sessions, orders, and audit trail records for a clean reset."""
    async with get_db(db_path) as db:
        await db.execute('DELETE FROM audit_trail')
        await db.execute('DELETE FROM sessions')
        await db.execute('DELETE FROM orders')
        await db.execute('DELETE FROM agent_activity')
        await db.execute('DELETE FROM negotiation_logs')
        await db.execute('DELETE FROM policy_decisions')
        await db.commit()

async def record_negotiation(
    db_path: str,
    session_id: str,
    timestamp: str,
    buyer_name: str,
    merchant_name: str,
    items_summary: str,
    total_qty: int,
    list_price_paise: int,
    buyer_offered_paise: int,
    buyer_target_discount_pct: float,
    buyer_min_discount_pct: float,
    merchant_counter_paise: int,
    merchant_allowed_discount_pct: float,
    rounds: int,
    status: str,
    policy_rationale: str,
    razorpay_order_id: Optional[str] = None,
):
    async with get_db(db_path) as db:
        await db.execute('''
            INSERT INTO negotiation_logs (
                session_id, timestamp, buyer_name, merchant_name, items_summary,
                total_qty, list_price_paise, buyer_offered_paise, buyer_target_discount_pct,
                buyer_min_discount_pct, merchant_counter_paise, merchant_allowed_discount_pct,
                rounds, status, policy_rationale, razorpay_order_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            session_id, timestamp, buyer_name, merchant_name, items_summary,
            total_qty, list_price_paise, buyer_offered_paise, buyer_target_discount_pct,
            buyer_min_discount_pct, merchant_counter_paise, merchant_allowed_discount_pct,
            rounds, status, policy_rationale, razorpay_order_id
        ))
        await db.commit()

async def get_negotiations(db_path: str) -> List[dict]:
    async with get_db(db_path) as db:
        async with db.execute('SELECT * FROM negotiation_logs ORDER BY id DESC') as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]

# ── Compiled Policy & PDP Decision Database Helpers ──

async def insert_compiled_policy(db_path: str, policy: dict):
    async with get_db(db_path) as db:
        await db.execute('''
            INSERT OR REPLACE INTO compiled_policies (
                policy_id, objective, level, rules_json, constraints_json,
                effective_max_discount, raw_merchant_input, schema_valid,
                semantic_valid, test_passed, test_total, is_active,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            policy.get("policy_id"),
            policy.get("objective", "general"),
            policy.get("level", 1),
            policy.get("rules_json", "[]"),
            policy.get("constraints_json", "[]"),
            policy.get("effective_max_discount", 0.0),
            policy.get("raw_merchant_input", ""),
            1 if policy.get("schema_valid") else 0,
            1 if policy.get("semantic_valid") else 0,
            policy.get("test_passed", 0),
            policy.get("test_total", 0),
            1 if policy.get("is_active", True) else 0,
            policy.get("created_at"),
            policy.get("updated_at")
        ))
        await db.commit()

async def get_compiled_policies(db_path: str, active_only: bool = True) -> List[dict]:
    async with get_db(db_path) as db:
        query = 'SELECT * FROM compiled_policies WHERE is_active = 1 ORDER BY level ASC, created_at DESC' if active_only else 'SELECT * FROM compiled_policies ORDER BY created_at DESC'
        async with db.execute(query) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]

async def record_policy_decision(db_path: str, decision: dict):
    async with get_db(db_path) as db:
        await db.execute('''
            INSERT INTO policy_decisions (
                session_id, timestamp, proposal_json, evaluated_constraints,
                effective_max_discount, decision, modified_proposal_json,
                reasoning, agent_id, policy_ids_evaluated
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            decision.get("session_id", ""),
            decision.get("timestamp"),
            decision.get("proposal_json", "{}"),
            decision.get("evaluated_constraints", "[]"),
            decision.get("effective_max_discount", 0.0),
            decision.get("decision", "DENY"),
            decision.get("modified_proposal_json"),
            decision.get("reasoning", ""),
            decision.get("agent_id", "buyer_agent"),
            decision.get("policy_ids_evaluated", "")
        ))
        await db.commit()

async def sync_compiled_policies_from_store(db_path: str):
    """Synchronizes compiled_policies table directly from active store_policies."""
    import json
    import uuid
    from datetime import datetime, timezone
    
    now_iso = datetime.now(timezone.utc).isoformat()
    async with get_db(db_path) as db:
        # 1. Fetch active store policies
        async with db.execute('SELECT key, label, value, discount_pct, min_items FROM store_policies') as cursor:
            rows = await cursor.fetchall()
            policies = [dict(r) for r in rows]

        # 2. Deactivate all existing compiled policies
        await db.execute('UPDATE compiled_policies SET is_active = 0')

        # Filter out 0% strict_list_price if there are active discount policies
        discount_policies = [p for p in policies if float(p.get('discount_pct', 0)) > 0]

        if not discount_policies:
            # Baseline 0% policy
            baseline_raw = {
                "policy_id": "merchant_strict_baseline",
                "objective": "strict_catalog_pricing",
                "level": 1,
                "rules": [{
                    "rule_id": "strict_list_price",
                    "description": "Standard Catalog Pricing (0% Discount)",
                    "when": [{"field": "order.item_count", "operator": "gte", "value": 1}],
                    "offer": {"discount_percent_max": 0.0, "discount_percent_min": 0.0}
                }],
                "constraints": [
                    {"type": "no_discount_stacking", "description": "No coupon stacking allowed"},
                    {"type": "max_discount_cap", "value": 0.0, "description": "Strict 0% discount cap"}
                ]
            }
            await db.execute('''
                INSERT OR REPLACE INTO compiled_policies (
                    policy_id, objective, level, rules_json, constraints_json,
                    effective_max_discount, raw_merchant_input, schema_valid,
                    semantic_valid, test_passed, test_total, is_active,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                baseline_raw["policy_id"], baseline_raw["objective"], 1,
                json.dumps(baseline_raw["rules"]), json.dumps(baseline_raw["constraints"]),
                0.0, "Baseline list pricing", 1, 1, 10, 10, 1, now_iso, now_iso
            ))
        else:
            # Build unified Level 1 compiled policy
            compiled_rules = []
            for p in discount_policies:
                min_q = p.get("min_items") or 1
                disc = float(p.get("discount_pct") or 10.0)
                compiled_rules.append({
                    "rule_id": p.get("key") or f"rule_{uuid.uuid4().hex[:6]}",
                    "description": p.get("label") or "Store Policy",
                    "when": [{"field": "order.item_count", "operator": "gte", "value": min_q}],
                    "offer": {"discount_percent_max": disc, "discount_percent_min": 0.0}
                })
            max_cap = max([float(p.get("discount_pct", 10.0)) for p in discount_policies])
            constraints = [
                {"type": "no_discount_stacking", "description": "No coupon stacking allowed"},
                {"type": "max_discount_cap", "value": max_cap, "description": f"Maximum allowed store discount cap is {max_cap}%"}
            ]
            policy_id = f"merchant_unified_policy_{uuid.uuid4().hex[:6]}"
            await db.execute('''
                INSERT OR REPLACE INTO compiled_policies (
                    policy_id, objective, level, rules_json, constraints_json,
                    effective_max_discount, raw_merchant_input, schema_valid,
                    semantic_valid, test_passed, test_total, is_active,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                policy_id, "merchant_store_rules", 1,
                json.dumps(compiled_rules), json.dumps(constraints),
                max_cap, "Store policies compiled from active configuration",
                1, 1, 10, 10, 1, now_iso, now_iso
            ))

        await db.commit()

async def get_policy_decisions(db_path: str, limit: int = 50) -> List[dict]:
    async with get_db(db_path) as db:
        async with db.execute('SELECT * FROM policy_decisions ORDER BY id DESC LIMIT ?', (limit,)) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]

# ── Standing Mandates Database Helpers ──

MANDATES_SCHEMA = '''
    CREATE TABLE IF NOT EXISTS standing_mandates (
        mandate_id TEXT PRIMARY KEY,
        buyer_id TEXT DEFAULT 'procurement_buyer',
        product_id TEXT NOT NULL,
        product_name TEXT NOT NULL,
        quantity INTEGER DEFAULT 1,
        trigger_type TEXT DEFAULT 'price_drop',
        threshold_paise INTEGER,
        threshold_pct REAL,
        status TEXT DEFAULT 'active',
        created_at TEXT,
        triggered_at TEXT,
        razorpay_order_id TEXT
    )
'''

async def save_standing_mandate(db_path: str, mandate: dict):
    async with get_db(db_path) as db:
        await db.execute(MANDATES_SCHEMA)
        await db.execute('''
            INSERT OR REPLACE INTO standing_mandates (
                mandate_id, buyer_id, product_id, product_name, quantity,
                trigger_type, threshold_paise, threshold_pct, status,
                created_at, triggered_at, razorpay_order_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            mandate.get("mandate_id"),
            mandate.get("buyer_id", "procurement_buyer"),
            mandate.get("product_id"),
            mandate.get("product_name"),
            mandate.get("quantity", 1),
            mandate.get("trigger_type", "price_drop"),
            mandate.get("threshold_paise"),
            mandate.get("threshold_pct"),
            mandate.get("status", "active"),
            mandate.get("created_at"),
            mandate.get("triggered_at"),
            mandate.get("razorpay_order_id")
        ))
        await db.commit()

async def get_active_standing_mandates(db_path: str, product_id: Optional[str] = None) -> List[dict]:
    async with get_db(db_path) as db:
        await db.execute(MANDATES_SCHEMA)
        if product_id:
            async with db.execute('SELECT * FROM standing_mandates WHERE status = "active" AND product_id = ?', (product_id,)) as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]
        else:
            async with db.execute('SELECT * FROM standing_mandates WHERE status = "active" ORDER BY created_at DESC') as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]

async def complete_standing_mandate(db_path: str, mandate_id: str, razorpay_order_id: str):
    async with get_db(db_path) as db:
        await db.execute(MANDATES_SCHEMA)
        await db.execute('''
            UPDATE standing_mandates
            SET status = "completed", triggered_at = ?, razorpay_order_id = ?
            WHERE mandate_id = ?
        ''', (datetime.utcnow().isoformat(), razorpay_order_id, mandate_id))
        await db.commit()





