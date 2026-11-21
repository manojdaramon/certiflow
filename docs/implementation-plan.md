# CertiFlow — Implementation Plan

## Project Overview

CertiFlow is a Skilling Certificate Issuance Platform designed to automate the process of creating, reviewing, approving, issuing and verifying skill certificates.

The platform supports training centres, district officers, quality teams, state administrators, candidates and employers.

The implementation will follow a phased approach, prioritizing correctness, security, reliability and a working end-to-end workflow over unnecessary features or UI complexity.

## Development Phases

### Phase 1 — Project Setup and Environment

**Objective:** Set up the repository, initialize the frontend and backend, configure infrastructure and prepare a working development environment.

**Tasks**

- Create a clean monorepo folder structure.
- Add root-level and application-specific `AGENTS.md` files.
- Organize project documentation under `docs/`.
- Initialize the React + Vite frontend using JavaScript and JSX.
- Initialize the Node.js + Express backend using TypeScript.
- Configure Yarn and package scripts.
- Install the dependencies required for the initial environment.
- Configure PostgreSQL as the primary database.
- Configure Redis for caching and background job processing.
- Set up Prisma and TypeScript configuration.
- Create Dockerfiles for the frontend and backend.
- Configure Docker Compose for the application, PostgreSQL and Redis.
- Configure environment variables and create `.env.example`.
- Create an appropriate `.gitignore`.
- Configure frontend-to-backend communication.
- Verify that the frontend, backend, PostgreSQL and Redis start successfully.
- Verify that Prisma can connect to PostgreSQL.

**Deliverable**

An organized repository with a working frontend, backend, PostgreSQL and Redis development environment. All required services should start successfully.

---

### Phase 2 — Database Design, Authentication and Demo Users

**Objective:** Design the initial database structure and implement authentication and role-based access control.

**Tasks**

- Design the database schema using Prisma.
- Define the required entities:
  - Users
  - Roles
  - Training centres
  - Batches
  - Candidates
  - Approvals
  - Certificates
  - Audit records
- Define appropriate relationships, constraints and indexes.
- Configure Prisma migrations.
- Implement secure authentication.
- Implement role-based access control (RBAC).
- Ensure users can access only the functionality permitted by their roles.
- Seed the six demo users:
  - Anika — Training Centre
  - Dev — District Officer
  - Meera — District Officer
  - Kabir — District Officer
  - Neha — Quality Team
  - Farah — State Office
- Build a basic login experience.
- Provide a convenient demo-user switching experience for demonstration.
- Ensure demo-user switching does not bypass backend authorization.
- Add basic authentication and authorization tests.

**Deliverable**

Demo users can log in and access only the functionality permitted by their roles.

---

### Phase 3 — Batch Creation and Spreadsheet Upload

**Objective:** Allow training centres to create batches, register candidates and submit batches for approval.

**Tasks**

- Build the training centre dashboard.
- Allow training centres to create new batches.
- Allow candidates to be added manually.
- Implement CSV spreadsheet upload.
- Validate uploaded files before importing candidates.
- Validate required fields, data formats and duplicate candidate records.
- Return clear row-level validation errors.
- Implement all-or-nothing import:
  - If any row is invalid, reject the import.
  - Do not leave partially imported candidates.
- Display batch details and candidate lists.
- Display the current batch status.
- Allow centres to correct invalid data and retry uploads.
- Implement batch submission for approval.
- Prevent unauthorized users from accessing or modifying another centre's batches.

**Deliverable**

Anika can create a batch, upload candidates, correct validation errors and submit a valid batch for approval.

---

### Phase 4 — Approval Workflow and Audit Trail

**Objective:** Implement the complete multi-level approval process with secure transitions, concurrency protection and traceable decisions.

**Tasks**

- Build the district officer dashboard.
- Display pending batches for district review.
- Implement the first district officer approval.
- Require approval from a second, different district officer.
- Prevent the same officer from providing both district approvals.
- Implement quality team review for large batches.
- Implement final approval by the state office.
- Implement rejection with mandatory reasons.
- Implement return-for-correction with mandatory reasons.
- Allow training centres to correct and resubmit returned batches.
- Introduce submission versioning for resubmitted batches.
- Define and implement how previous approvals are handled after resubmission.
- Prevent unauthorized workflow transitions.
- Prevent simultaneous approvals from creating duplicate transitions.
- Use appropriate database transactions and concurrency controls.
- Record every important action in an immutable audit trail, including:
  - Actor
  - Action
  - Timestamp
  - Previous state
  - New state
  - Reason, where applicable
  - Relevant submission version
- Display approval history and decision details.

**Deliverable**

The complete approval workflow works with proper role checks, distinct officer approvals, concurrency protection, submission versioning and an auditable decision history.

---

### Phase 5 — Certificate Generation and WhatsApp Delivery

**Objective:** Generate certificates after final approval and process certificate delivery reliably through background jobs.

**Tasks**

- Trigger certificate generation after successful final approval.
- Generate a unique certificate for every approved candidate.
- Prevent duplicate certificates for the same candidate and batch.
- Generate downloadable PDF certificates.
- Include certificate details and a unique verification identifier.
- Store generated certificate files securely.
- Introduce background job processing using BullMQ and Redis.
- Implement an outbox/event mechanism to prevent important events from being lost between database transactions and job processing.
- Implement a mock WhatsApp provider.
- Simulate the following provider responses:
  - Successful delivery
  - Failed delivery
  - Request timeout
- Implement retry handling for temporary failures.
- Track delivery status and retry attempts.
- Ensure job retries do not create duplicate certificates or messages.
- Make background workers restart-safe and idempotent.
- Handle worker failures without losing pending jobs.

**Deliverable**

An approved batch generates exactly one certificate per candidate. Certificate generation and mock WhatsApp delivery happen asynchronously, with reliable retry and delivery tracking.

---

### Phase 6 — Public Verification, Cancellation and Live Updates

**Objective:** Allow employers and the public to verify certificates while providing real-time workflow updates and automated escalation.

**Tasks**

- Build a public certificate verification page.
- Allow certificate verification without authentication.
- Generate a unique verification URL or token for each certificate.
- Display certificate details and current verification status.
- Clearly distinguish valid and cancelled certificates.
- Ensure public verification does not expose unnecessary candidate information.
- Allow authorized state office users to cancel certificates.
- Record certificate cancellation in the audit trail.
- Ensure cancellation is immediately reflected in public verification.
- Prevent cancelled certificates from appearing valid.
- Implement real-time dashboard updates so users do not need to refresh manually.
- Use an appropriate real-time communication mechanism.
- Implement delayed-batch detection.
- Automatically notify the appropriate senior officer when a batch remains untouched beyond the defined threshold.
- Track notification attempts and avoid duplicate escalation notifications.

**Deliverable**

Employers can verify certificates without logging in. State administrators can cancel certificates, and public verification reflects the latest status. Users receive real-time workflow updates, and delayed batches trigger escalation notifications.

---

### Phase 7 — Testing, Docker, Documentation and Submission

**Objective:** Validate the complete platform, verify critical scenarios, prepare deployment documentation and finalize the hackathon submission.

**Tasks**

**Testing**

- Test all six critical scenarios from the problem statement:
  1. Invalid spreadsheet rows produce clear errors without partially importing candidates.
  2. Two district officers approving simultaneously do not create duplicate workflow transitions.
  3. An approved batch generates exactly one certificate per candidate.
  4. A cancelled certificate is immediately shown as invalid during public verification.
  5. Untouched batches trigger automatic escalation notifications.
  6. Returned batches can be corrected and resubmitted with a deliberate and documented previous-approval policy.
- Add API tests.
- Add database and workflow tests.
- Test authentication and role-based authorization.
- Test concurrent approval requests.
- Test certificate generation and idempotency.
- Test background job retries and failure handling.
- Test public verification and certificate cancellation.
- Fix critical bugs discovered during testing.

**Infrastructure and Docker**

- Verify frontend and backend Dockerfiles.
- Verify Docker Compose configuration.
- Ensure the application starts from a fresh clone using one documented Docker Compose command.
- Verify database migrations and demo data setup.
- Verify service health checks and service dependencies.
- Confirm the application can recover from service restarts.

**Documentation**

- Prepare `README.md` containing:
  - Project overview
  - Problem understanding
  - Architecture overview
  - Technology choices and justifications
  - Key implementation decisions
  - Known limitations and assumptions
- Prepare `SETUP.md` with step-by-step instructions to run the application from a fresh clone.
- Include demo credentials and sample data instructions.
- Prepare `DEPLOYMENT.md` covering the required scale:
  - 100,000 registered users
  - 10,000 daily active users
  - 500 batches per hour
  - Approximately 30,000 certificates and messages per hour
  - Public certificate verification traffic bursts
- Document the architecture and deployment plan.
- Explain horizontal scaling and potential bottlenecks.
- Document background job backlog handling.
- Document failure handling for:
  - Worker crashes
  - Redis restarts
  - WhatsApp provider outages
  - Slow database queries
- Explain certificate storage, access control and public verification.
- Include an architecture diagram.
- Clearly distinguish implemented features from proposed production-scale deployment decisions.

**Final Submission**

- Prepare demo users and sample data.
- Verify the complete end-to-end demo flow.
- Record a demonstration video of two minutes or less.
- Upload the video to Google Drive with anyone-with-the-link access or use Loom.
- Push the complete project to a public GitHub repository.
- Include source code, Dockerfiles, Docker Compose configuration, tests and documentation.
- Verify that the repository contains everything needed to run and review the project.
- Submit all required deliverables before the hackathon deadline.

**Deliverable**

A working, tested and documented CertiFlow submission with a reproducible local setup, public GitHub repository, deployment plan and demonstration video.

---

## Technical Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Frontend Language | JavaScript / JSX |
| Backend | Node.js + Express |
| Backend Language | TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Background Jobs | BullMQ |
| Queue / Cache | Redis |
| Real-time Updates | Socket.IO or another justified mechanism |
| Containerization | Docker + Docker Compose |
| API Validation | Zod |
| Testing | Appropriate frontend and backend testing tools |

Additional dependencies should be introduced only when required by an implementation task and justified by their purpose.

## Development Guidelines

1. Follow the original hackathon problem statement as the primary source of truth.
2. Follow the root and application-specific `AGENTS.md` instructions.
3. Complete one development phase at a time.
4. Do not implement later-phase features prematurely.
5. Inspect existing code before modifying files.
6. Prefer simple, maintainable and testable implementations.
7. Prioritize correctness, authorization, data integrity and reliability over UI polish.
8. Use database transactions and appropriate constraints for critical operations.
9. Make background jobs idempotent and safe to retry.
10. Record important decisions in the audit trail.
11. Do not introduce unnecessary dependencies or overengineered abstractions.
12. Explain important technical decisions and generated code so they can be understood and defended during the hackathon review.
13. Clearly document assumptions where the problem statement does not specify implementation details.
14. Never claim that a feature is implemented or tested unless it has actually been verified.

## Important Implementation Priorities

The project should prioritize these outcomes:

- Secure role-based access and workflow enforcement.
- Reliable spreadsheet validation and all-or-nothing imports.
- Correct multi-officer approval with concurrency protection.
- Exactly one certificate per approved candidate.
- Reliable background processing and retry handling.
- Immediate invalidation of cancelled certificates.
- Complete and traceable audit history.
- Automated escalation for delayed batches.
- Reproducible local setup and documented production scaling strategy.

**The goal is not to build every possible feature. The goal is to demonstrate a reliable, secure and understandable end-to-end certification workflow that addresses the most important requirements of the problem statement.**