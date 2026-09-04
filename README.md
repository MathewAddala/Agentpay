# ⚡ AgentPay — Agent-to-Agent Commerce Simulation

> Two autonomous AI agents negotiate and complete a real (test-mode) Razorpay transaction through a structured, auditable 4-step handshake protocol with deterministic guardrails and explainable AI phrasing.

![Protocol](https://img.shields.io/badge/Protocol-INTENT→OFFER→MANDATE→CONFIRMATION-0C83FD)
![Payments](https://img.shields.io/badge/Payments-Razorpay_Test_Mode-1CA672)
![Frontend](https://img.shields.io/badge/Frontend-React_18_•_TypeScript_•_Tailwind-0C2340)
![LLM](https://img.shields.io/badge/LLM-Groq_Llama_3.3_70B-F5A623)
![Python](https://img.shields.io/badge/Python-FastAPI_3.11-3776AB)

---

## 🏗️ Architecture Overview

```
┌─────────────────┐       4-Step Handshake Protocol       ┌──────────────────┐
│   🛒 Buyer      │◄─────────────────────────────────────►│   🏪 Merchant    │
│     Agent       │     INTENT  →  OFFER                  │     Agent        │
│   (FastAPI)     │     MANDATE →  CONFIRMATION           │   (FastAPI)      │
│   Port: 8002    │                                       │   Port: 8001     │
└────────┬────────┘                                       └────────┬─────────┘
         │                                                         │
         │          ┌───────────────────────────────────┐          │
         └─────────►│  ⚡ AgentPay React + TS Dashboard │◄─────────┘
                    │   (Vite • Tailwind • Lucide)      │
                    │   Port: 8080 (or 5173 for HMR)    │
                    └─────────────────┬─────────────────┘
                                      │
                                      ▼
                            ┌───────────────────┐
                            │   💳 Razorpay     │
                            │   Test Mode SDK   │
                            └───────────────────┘
```

---

## 🌟 Key Capabilities & Industry-Grade Design

### 1. Explainable & Bounded Money Actions
- **LLM as "Voice", Never the "Brain"**: Groq (Llama 3.3 70B) generates human-readable negotiation phrasing, intent parsing, and receipts.
- **Deterministic Policy Engines**: All pricing, discounts (bulk threshold, first-time buyer), anti-gouging bounds, and budget limits are hard-coded pure Python logic.
- **Fail-Safe Fallbacks**: If LLM limits or network drops occur, the protocol falls back to deterministic structured strings without interrupting commerce flow.

### 2. Autonomous Failure Simulation & Recovery
- Deliberately triggers a bank decline (`SIMULATE_PAYMENT_FAILURE=True`) on initial authorization.
- Merchant automatically issues a fresh Razorpay order for the transaction.
- Buyer re-verifies policy constraints and authorizes the new mandate.
- Payment is captured and confirmed in the immutable audit trail.

### 3. Full-Stack Modern Dashboard (React 18 + TypeScript + Tailwind)
- **High-Fidelity Razorpay Design System**: Dark navy (`#0C2340`), Razorpay Blue (`#0C83FD`), Success Emerald (`#1CA672`), Amber warnings.
- **Real-Time Live SSE Stream**: Instant live card insertion as steps execute.
- **4-Step Pipeline Tracker**: Visual progress header from INTENT to CONFIRMATION.
- **Collapsible JSON & Event Inspector**: Syntax-highlighted payloads with one-click copy.
- **Policy Breakdown & Guardrails Inspector**: Visual monitor of merchant rules & buyer budget gauge.

---

## 🚀 Quick Start

### 1. Clone and Set Up Environment
```bash
cp .env.example .env
```
Ensure your Razorpay Test keys are present in `.env`:
```env
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
GROQ_API_KEY=your_groq_api_key_here
```

### 2. Run with Docker Compose (All-in-One)
```bash
docker compose up --build
```

### 3. Local Development (Alternative)
#### Backend Services:
```bash
# Terminal 1 - Merchant Agent
uvicorn merchant_agent.main:app --port 8001 --reload

# Terminal 2 - Buyer Agent
uvicorn buyer_agent.main:app --port 8002 --reload

# Terminal 3 - Dashboard Backend
python -m dashboard.app
```

#### Frontend Development Server:
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173** (with live HMR) or **http://localhost:8080**.

---

## 📂 Project Structure

```
razorpay/
├── frontend/                     # Modern React 18 + TypeScript SPA
│   ├── src/
│   │   ├── components/           # Modular UI components
│   │   │   ├── Header.tsx        # Top status bar & demo trigger
│   │   │   ├── SidebarSessions.tsx # Session manager & KPI stats
│   │   │   ├── Timeline.tsx      # Core 4-step protocol timeline
│   │   │   ├── TimelineEntryCard.tsx # Detailed step inspector
│   │   │   ├── PolicySidebar.tsx # Guardrails & budget monitors
│   │   │   ├── JsonViewer.tsx    # Syntax-highlighted viewer
│   │   │   └── FailureRecoveryBanner.tsx # Recovery showcase
│   │   ├── services/api.ts       # Typed API client & SSE stream
│   │   ├── types/commerce.ts     # Protocol TypeScript interfaces
│   │   ├── App.tsx               # Main layout controller
│   │   └── main.tsx
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
├── merchant_agent/               # Merchant Service (FastAPI :8001)
│   ├── main.py                   # Handshake endpoints (/handshake/intent, /handshake/mandate)
│   ├── catalog.py                # Digital goods catalog
│   ├── policy_engine.py          # Deterministic discount & bounds engine
│   ├── razorpay_service.py       # Razorpay SDK client & payment simulator
│   ├── negotiation.py            # Natural language generation
│   ├── webhooks.py               # Webhook verification & processing
│   └── Dockerfile
│
├── buyer_agent/                  # Buyer Service (FastAPI :8002)
│   ├── main.py                   # Orchestrator & /start-session endpoint
│   ├── preferences.py            # Buyer profile & spending bounds
│   ├── policy_engine.py          # Anti-gouging & budget verification
│   ├── discovery.py              # Catalog discovery
│   ├── payment_client.py         # Mandate authorization client
│   └── Dockerfile
│
├── shared/                       # Shared Core Library
│   ├── config.py                 # Pydantic BaseSettings (.env loader)
│   ├── models.py                 # Protocol Pydantic schemas
│   ├── database.py               # Async SQLite database layer
│   ├── audit.py                  # Structured audit logger
│   └── llm_client.py             # Groq LLM client (Llama 3.3 70B)
│
├── dashboard/                    # Backend Host & SSE Broadcaster (:8080)
│   ├── app.py                    # Flask API + static React distributor
│   └── Dockerfile                # Multi-stage Docker build
│
├── docker-compose.yml            # 3-service orchestrated topology
└── README.md
```

---

## 🧪 Protocol Verification

To run a test handshake programmatically:
```bash
curl -X POST http://localhost:8002/start-session
```
You can inspect the entire audit trail in real-time on the dashboard at **http://localhost:8080**.
