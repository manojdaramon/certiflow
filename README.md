# CertiFlow — Skilling Certificate Issuance Platform

> **Pragati Skills Mission**  
> Automated, tamper-proof, multi-officer batch governance, candidate ingestion, and approval platform.

---

## 1. Requirements Note & Problem Understanding

### 1.1 Context & Problem Understanding
The **Pragati Skills Mission** is a state skilling initiative training ~8,000 candidates each month across 300+ accredited private training centres. The existing operational model relies on emailing spreadsheets, ad-hoc WhatsApp approvals, and manual certificate typing into Word templates. This creates severe operational vulnerabilities:
1. **Unaccountable approvals:** Decisions cannot be traced to specific officers or exact timestamps.
2. **Fraud & edited certificates:** Employers have no unauthenticated, instant way to verify credentials.
3. **Delivery bottlenecks:** Batches take weeks to move through review tiers.
4. **Data corruption:** Broken or half-parsed spreadsheets corrupt candidate records.
5. **No audit trail:** Returned or modified batches lose their revision history.

**CertiFlow** solves these core problems with an auditable, multi-tier approval state machine and atomic spreadsheet processing system.

---

### 1.2 Interpretations & Decisions Where the Brief Was Unclear (Phases 1–4)

The problem statement outlines operational needs that require concrete engineering decisions. Below are the design choices implemented through Phase 4:

| Ambiguous Brief Item | Explicit Decision Made in CertiFlow | Justification |
|---|---|---|
| *"A district decision needs more than one officer to agree"* | **Two Distinct District Officers Required:** The state machine requires two independent approvals (`DISTRICT_FIRST` $\to$ `DISTRICT_SECOND`) from officers belonging to that batch's district. | Prevents unilateral approvals or collusion. PostgreSQL row-level locks (`SELECT ... FOR UPDATE`) prevent race conditions if both officers click approve simultaneously. |
| *"Same officer approving twice"* | **Strict Officer Deduplication:** If an officer who gave `DISTRICT_FIRST` attempts `DISTRICT_SECOND`, the request is rejected with `409 Conflict`. | Guarantees two independent pairs of eyes on every district batch. |
| *"Big batches need extra scrutiny"* | **Dynamic Routing Threshold ($> 25$ Candidates):** Batches with $> 25$ candidates automatically transition from district approval to `UNDER_QUALITY_REVIEW` (Neha). Batches with $\le 25$ candidates route directly to `UNDER_STATE_REVIEW` (Farah). | Quantifies "big batches" into a deterministic threshold while keeping smaller batches expedited. |
| *"Officer sends a batch back... what happens to approvals it already had" (Moment 6)* | **Resubmission Version Increment ($v1 \to v2$):** When an officer returns a batch, the centre must revise and resubmit. Resubmission increments `currentVersion`. Prior approvals are archived in the immutable audit log but **do not count toward the new version**; 2 fresh district approvals are strictly required. | Modifying candidate data invalidates earlier approvals. Clear audit history is preserved without compromising safety. |
| *"Someone acting at a step that is not theirs, or acting as someone else"* | **Strict Scoped RBAC:** District officers are scoped to their district (e.g. Hyderabad officers only see Hyderabad batches; Kabir in Warangal cannot view or approve Hyderabad batches). State and Quality teams have state-wide access. | Strict multi-tenancy and district boundary enforcement. |
| *"A decision that cannot be traced to who made it and when"* | **Append-Only Immutable Audit Log:** Every action (submit, approve, return, reject) is committed inside the database transaction with actor ID, IP address, timestamp, previous state, new state, version, and reason. | Zero tampering: logs cannot be altered or deleted. |

---

## 2. System Architecture (Through Phase 4)

### 2.1 Component Architecture

```text
 +-----------------------------------------------------------------------+
 |                       Client (React + Vite)                           |
 |               Enterprise Sidebar UI & CSS Modules                     |
 +-----------------------------------+-----------------------------------+
                                     |
                                     | REST API (JSON + Bearer JWT)
                                     v
 +-----------------------------------------------------------------------+
 |                     Backend API (Node.js + Express)                   |
 |              TypeScript, Zod Validation, RBAC Middleware              |
 +-------------------+-------------------------------+-------------------+
                     |                               |
    PostgreSQL Row   |                               | Session & Cache
    Locks & CRUD     v                               v
 +-----------------------------+   +-------------------------------------+
 |   PostgreSQL 16 Database    |   |               Redis 7               |
 |   (Prisma ORM + Migrations) |   |  - Session caching & rate limiting  |
 |   - Immutable Audit Logs    |   +-------------------------------------+
 |   - Batch State Machine     |
 |   - Candidates & Creds      |
 +-----------------------------+
```

### 2.2 Background Architecture Note (Redis + BullMQ Selection)
As mandated by the technical evaluation criteria, the background architecture is designed around **Redis 7** and **BullMQ**:
- **Why Redis + BullMQ:** Provides atomic job locks, deterministic deduplication (`jobId`), and built-in exponential backoff without requiring the heavy operational footprint of a dedicated Kafka or RabbitMQ cluster.

---

## 3. Key Technical Decisions & Justifications

1. **Strict Relational Integrity with PostgreSQL & Prisma (Phase 2):**
   - Batches, Candidates, Approvals, and AuditLogs are modeled with relational constraints and foreign keys.
   - Deleting or altering historical records is prevented by design.

2. **All-or-Nothing CSV Ingestion (Phase 3 — Moment 1):**
   - The CSV parser validates national IDs, 10-digit Indian phone numbers (`^[6-9]\d{9}$`), grade formats, and completion dates.
   - If a single row out of 100 is invalid, the entire operation is rolled back and HTTP 400 is returned with row-specific errors. Zero dirty or partial records are saved.

3. **Concurrency-Safe State Machine with DB Row Locks (Phase 4 — Moment 2):**
   - Dual approvals use transactional PostgreSQL `SELECT ... FOR UPDATE` locks. If two officers approve concurrently, the transactions serialize cleanly. The second officer either completes the consensus or receives an informative conflict if attempting a duplicate action.

4. **Append-Only Immutable Audit Log (Phase 4 — Rule 73):**
   - Every status transition records: `batchId`, `actorId`, `action`, `previousState`, `newState`, `version`, `reason`, `ipAddress`, and `timestamp`.
   - Audit logs cannot be updated or deleted via application APIs.

5. **Plain CSS (CSS Modules) Frontend (Phases 1–4):**
   - Adheres strictly to the problem statement and team rules: zero generic UI frameworks (no Tailwind, Bootstrap, or Material UI).
   - Bespoke enterprise government portal aesthetic with high-contrast, distraction-free persistent sidebar navigation.

---

## 4. Local Setup Guide

Follow these steps to run CertiFlow from a fresh clone with demo data.

### 4.1 Prerequisites
- **Node.js** >= 20.x
- **Yarn** (v1.22+) or **npm**
- **Docker & Docker Compose** (for PostgreSQL and Redis containers)

---

### 4.2 Step-by-Step Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/manojdaramon/certiflow.git
   cd certiflow
   ```

2. **Install dependencies:**
   ```bash
   yarn install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

4. **Start PostgreSQL & Redis backing services:**
   ```bash
   docker compose up -d postgres redis
   ```
   *Verify both containers are healthy:*
   ```bash
   docker ps
   ```

5. **Run database migrations & seed demo accounts:**
   ```bash
   cd server
   npx prisma db push
   npx tsx prisma/seed.ts
   cd ..
   ```

6. **Start frontend and backend development servers:**
   ```bash
   yarn dev
   ```
   - **Frontend App:** [http://localhost:3000](http://localhost:3000)
   - **Backend API:** [http://localhost:5000](http://localhost:5000)
   - **Health Check:** [http://localhost:5000/health](http://localhost:5000/health)

---

### 4.3 Alternative: Single-Command Docker Compose

To launch all services inside Docker:
```bash
docker compose up --build
```

---

### 4.4 Seeded Demo Identities & Credentials

All demo accounts share the password: `Password123!`

| Person | Role | District / Unit | Email | Purpose in Demo |
|---|---|---|---|---|
| **Anika** | Training Centre | Hyderabad (`TC-HYD-001`) | `anika@apexskills.org` | Creates batches, uploads candidate CSVs, resubmits returned batches. |
| **Dev** | District Officer | Hyderabad | `dev.hyderabad@skills.gov.in` | First district reviewer for Hyderabad batches. |
| **Meera** | District Officer | Hyderabad | `meera.hyderabad@skills.gov.in` | Second district reviewer (completes dual-officer consensus). |
| **Kabir** | District Officer | Warangal | `kabir.warangal@skills.gov.in` | Alternate district officer (cannot see or approve Hyderabad batches). |
| **Neha** | Quality Team | State-wide | `neha.quality@skills.gov.in` | Scrutinizes large batches (> 25 candidates). |
| **Farah** | State Office | State-wide | `farah.state@skills.gov.in` | Final approval authority for reviewed batches. |

---

## 5. AI Usage & Verification

In accordance with problem statement expectations, AI tools were utilized with strict human engineering review:

- **Where AI was used:**
  - Scaffolding TypeScript boilerplate interfaces and Zod validation schemas.
  - Generating synthetic, realistic candidate CSV records for testing valid and invalid batch edge cases.
  - Drafting initial CSS module rules and layout templates.

- **How output was checked & verified:**
  - Every line of generated code was inspected and verified against the problem statement's non-negotiable rules.
  - Verified that plain CSS modules were strictly used instead of Tailwind or utility classes.
  - Verified that database queries enforce relational integrity and that concurrent approval race conditions are mitigated with PostgreSQL row-level locks.
  - Verified that API endpoints return proper HTTP status codes (`400 Bad Request` on invalid CSV, `409 Conflict` on duplicate approval, `403 Forbidden` on role/district boundary violations).

---

## 6. Implementation Scope & Delivered Features (Phases 1–4)

### Implemented & Verified (Phases 1–4)
- **Phase 1: Project Setup & Infrastructure:** Monorepo architecture, Docker Compose, PostgreSQL 16, Redis 7, Express TypeScript, and Vite React setup.
- **Phase 2: Data Models & RBAC:** Complete schema migrations for 7 entities, JWT authentication with bcrypt password hashing, and role-based permissions scoped by district.
- **Phase 3: Batch Management & Candidate Ingestion:** Batch creation, candidate management, and strict all-or-nothing CSV parsing with row-level error reporting.
- **Phase 4: Multi-Officer Approval Workflow:** 
  - Dual-officer district consensus state machine with concurrency protection (`FOR UPDATE` row locks).
  - Dynamic routing for large batches ($> 25$ candidates) to Quality Team.
  - State Office final approval.
  - Return / Rejection handling with mandatory reasons.
  - Resubmission versioning ($v1 \to v2$) with prior approval invalidation.
  - Immutable audit trail tracking all actions, versions, and actors.
  - Realistic government enterprise portal with persistent sidebar navigation.

### Known Limitations
- Real-time client updates currently utilize reactive state polling rather than WebSockets.
- Public certificate verification (`/verify/:token`) and asynchronous PDF/WhatsApp delivery workers were deferred to focus entirely on depth and reliability of the core multi-officer governance and ingestion engine (Phases 1–4).
