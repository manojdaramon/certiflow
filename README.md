# CertiFlow — Skilling Certificate Issuance Platform

> Pragati Skills Mission: Automated, secure, verifiable certificate issuance and tracking.

---

## 1. Project Overview & Requirements Note

The **Pragati Skills Mission** trains approximately 8,000 young people per month across 300+ private training centres. The current manual process (emailing spreadsheets, WhatsApp approvals, manual Word certificates) leads to delays, unaccountable decisions, lack of audit trails, and circulation of forged certificates.

**CertiFlow** solves this with an end-to-end event-driven certification platform:
- **Training Centres (e.g. Anika):** Upload batch spreadsheets, receive immediate row-level validation (with all-or-nothing atomicity), track review status, and resubmit returned batches with version tracking.
- **District Officers (e.g. Dev, Meera, Kabir):** Review assigned batches with mandatory dual-officer approval consensus.
- **Quality Team (e.g. Neha):** Scrutinize large batches exceeding defined thresholds.
- **State Office (e.g. Farah):** Final approval authority, oversight on delayed/stuck batches, and immediate revocation/cancellation of invalid certificates.
- **Public & Employers:** Instant unauthenticated QR/token verification with zero personal data leakage and immediate reflection of cancellations.
- **Candidates:** Direct, reliable delivery of digitally signed PDF certificates over simulated WhatsApp with retry safety and idempotency.

---

## 2. System Architecture

```text
                     +---------------------------------------+
                     |         Frontend (React + Vite)       |
                     |           Plain CSS / Modules         |
                     +-------------------+-------------------+
                                         |
                                         | REST / WebSocket
                                         v
                     +---------------------------------------+
                     |       Backend API (Express + TS)      |
                     |      Zod Validation & RBAC Middleware |
                     +---------+-------------------+---------+
                               |                   |
            Prisma ORM / SQL   |                   | Events / Jobs
                               v                   v
                     +-------------------+   +---------------+
                     |    PostgreSQL     |   | Redis (BullMQ)|
                     |  Source of Truth  |   +-------+-------+
                     +-------------------+           |
                                                     v
                                             +---------------+
                                             | Worker Service|
                                             | - PDF Gen     |
                                             | - WA Delivery |
                                             +---------------+
```

---

## 3. Technology Stack

| Layer | Technology | Justification |
|---|---|---|
| **Frontend** | React 18, Vite | Fast client rendering, zero overhead, fast HMR. |
| **Frontend Styles**| Plain CSS (CSS Modules) | Meets requirements: zero third-party UI framework bloat. |
| **Backend** | Node.js, Express, TypeScript | Type-safe, modular, predictable HTTP lifecycle. |
| **Database** | PostgreSQL 16 | ACID transactions, relational integrity, row locks for concurrent approvals. |
| **ORM & Migrations**| Prisma ORM | Strictly typed schema, declarative migrations, connection pooling. |
| **Cache & Queues** | Redis 7 + BullMQ | Reliable job queues, outbox pattern, bounded retries, worker idempotency. |
| **Containerization**| Docker & Docker Compose | Single-command local startup for all 4 services. |

---

## 4. Repository Structure

```text
certiflow/
├── client/                     # Frontend application (React + Vite)
│   ├── src/
│   │   ├── app/                # Application setup & shell
│   │   ├── components/         # Shared common and layout components
│   │   ├── features/           # Feature slices (auth, batches, approvals, etc.)
│   │   ├── services/           # Centralized API client
│   │   ├── styles/             # Plain CSS variables and global rules
│   │   ├── App.jsx             # Root component
│   │   └── main.jsx            # Entry point
│   ├── Dockerfile
│   └── package.json
├── server/                     # Backend API & Workers (Node.js + Express + TS)
│   ├── prisma/
│   │   └── schema.prisma       # Database schema & migrations
│   ├── src/
│   │   ├── app.ts              # Express application setup
│   │   ├── server.ts           # Server entry point & graceful shutdown
│   │   ├── config/             # Environment, DB, and Redis configurations
│   │   ├── middleware/         # Logging, error handling, auth & RBAC
│   │   ├── modules/            # Domain modules (auth, batches, etc.)
│   │   ├── queues/             # BullMQ queue definitions
│   │   ├── workers/            # Asynchronous background job workers
│   │   └── providers/          # Stand-in providers (e.g. WhatsApp mock)
│   ├── tests/                  # Automated integration and unit tests
│   ├── Dockerfile
│   └── package.json
├── docs/                       # Project documentation
│   ├── problem-statement.md    # Problem statement
│   └── implementation-plan.md  # Detailed implementation plan
├── docker-compose.yml          # Container configuration for all services
├── .env.example                # Example environment variables
├── AGENTS.md                   # Agent guidelines and project instructions
└── package.json                # Monorepo workspace configuration
```

---

## 5. Development Setup

### Prerequisites
- Node.js >= 20.x
- Yarn or npm
- Docker & Docker Compose (for containerized environment)

### Option A: Local Development (Host)

1. **Install dependencies:**
   ```bash
   yarn install
   # or
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

3. **Run database migrations (when PostgreSQL is active):**
   ```bash
   cd server
   npx prisma generate
   ```

4. **Start development servers:**
   ```bash
   yarn dev
   # or
   npm run dev
   ```
   - Client: `http://localhost:3000`
   - Server: `http://localhost:5000`
   - Health Check: `http://localhost:5000/health`

### Option B: Docker Compose (Single Command)

```bash
docker compose up --build
```
This starts PostgreSQL, Redis, the Node.js API server, and the Vite client application.

---

## 6. Seeded Demo Identities

| Name | Role | Primary Responsibilities |
|---|---|---|
| **Anika** | Training Centre | Batch creation, candidate CSV upload, resubmissions. |
| **Dev** | District Officer | District batch reviews, initial approval/return/reject. |
| **Meera** | District Officer | District batch reviews, secondary approval consensus. |
| **Kabir** | District Officer | Alternate district officer. |
| **Neha** | Quality Team | Specialized review of large batches. |
| **Farah** | State Office | Final issuance authorization, cancellation, escalation review. |
