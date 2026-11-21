# CertiFlow Backend — AGENTS.md

## 1. Project context and non-negotiable requirements

CertiFlow is a skilling certificate issuance platform. Training centres submit candidate batches; district officers review them; large batches receive additional quality review; the state office gives final approval; certificates are generated and delivered through a simulated WhatsApp provider; and the public can verify certificates without logging in.

Follow the hackathon problem statement as the source of truth. The required stack is:

- Node.js + Express + TypeScript for the backend.
- PostgreSQL for persistent data.
- Prisma for schema management, queries, and migrations.
- Redis for queue infrastructure and caching where useful.
- BullMQ for background jobs and event-driven processing.
- Docker and Docker Compose for local execution.
- Automated tests for critical scenarios and invariants.

Do not replace these technologies with MongoDB, Mongoose, Next.js, or another framework. Do not introduce extra infrastructure merely to tick a box. Keep the implementation understandable and explainable.

The project must support the six seeded demo identities: Anika (training centre), Dev and Meera (district officers), Neha (quality team), and Farah (state office). Public certificate verification must not require authentication.

## 2. Engineering principles

- Correctness and data integrity take priority over feature count and visual polish.
- Treat every request, uploaded file, and external provider response as untrusted.
- Enforce authorization and business rules on the server; never rely on frontend role checks.
- Keep HTTP handlers thin. Put business rules in services/use-cases and persistence access in focused modules.
- Use database constraints and transactions for invariants that must hold under concurrency.
- Make asynchronous work durable, retryable, observable, and idempotent.
- Preserve audit history. Do not hard-delete approval decisions or issued/cancelled certificate records.
- Fail explicitly. Never silently swallow errors or report success before work is persisted.
- Prefer the smallest implementation that reliably demonstrates the required behaviour.

## 3. Backend structure

Keep backend application code under `server/src/` and Prisma schema/migrations under `server/prisma/`. Use a modular monolith; API and worker processes may be separate processes from the same codebase.

Recommended structure (adapt only when there is a clear reason):

```text
server/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── config/
│   ├── middleware/
│   ├── modules/
│   │   ├── auth/
│   │   ├── batches/
│   │   ├── candidates/
│   │   ├── approvals/
│   │   ├── certificates/
│   │   ├── verification/
│   │   └── audit/
│   ├── queues/
│   ├── workers/
│   ├── providers/
│   │   └── whatsapp/
│   ├── services/
│   ├── utils/
│   └── types/
├── tests/
├── Dockerfile
├── package.json
└── tsconfig.json
```

Within a module, use a consistent pattern such as `*.routes.ts`, `*.controller.ts`, `*.service.ts`, `*.schema.ts`, and `*.types.ts`. Avoid creating empty abstraction layers or files that merely re-export one function.

## 4. TypeScript, imports, and naming

- Use TypeScript for all backend source files.
- Use ES modules and `import`/`export`; do not mix CommonJS `require` into application code.
- Prefix Node.js built-in imports with `node:` (for example, `node:crypto`, `node:path`, `node:fs/promises`).
- Use `camelCase` for variables and functions, `PascalCase` for types/classes, and `UPPER_SNAKE_CASE` for true global constants.
- Use kebab-case for directories and filenames unless an established module convention requires otherwise.
- Prefer explicit types for public function inputs/outputs and API contracts. Avoid `any`; use `unknown` and narrow it.
- Use `import type` for type-only imports.
- Use 4-space indentation and double quotes, consistent with the project.
- Do not add path aliases or subpath imports unless they are configured and genuinely improve readability.

## 5. API and validation standards

- Version or namespace API routes consistently (for example, `/api/...`).
- Validate `params`, `query`, and `body` at the API boundary with Zod (or the project's established validation library).
- Validate uploaded CSV files for expected headers, row limits, required values, data types, duplicate candidate identifiers, and valid phone numbers.
- CSV import must be all-or-nothing: validate the complete file first; if any row is invalid, return row-level errors and persist none of that upload.
- Enforce file size/type limits. Do not trust a filename or MIME type alone.
- Use a consistent JSON response shape, for example:
  - Success: `{ success: true, message: string, data?: ... }`
  - Error: `{ success: false, message: string, errors?: ... }`
- Use appropriate HTTP status codes: 400 validation, 401 unauthenticated, 403 forbidden, 404 missing, 409 conflict/state conflict, and 500 unexpected server error.
- Add pagination and bounded page sizes to list endpoints.
- Do not expose stack traces, secrets, password hashes, private candidate data, or internal provider credentials in production responses.
- Put centralized error middleware after routes. Log unexpected errors with useful request context, without logging secrets or unnecessary personal data.

## 6. Authentication and authorization

- Use the authenticated server-side identity for every protected action. Never accept an actor/user ID from the request body as proof of identity.
- Implement role-based access control for the roles: `TRAINING_CENTRE`, `DISTRICT_OFFICER`, `QUALITY_TEAM`, and `STATE_OFFICE`.
- Enforce resource scope as well as role: a training centre may access only its own batches; district officers may act only within their assigned district.
- Public verification is the intentional unauthenticated exception. Return only the minimum information needed to establish authenticity.
- Prevent IDOR by checking access to the specific batch, candidate, or certificate on every operation.
- For demo login, make the identity-switching mechanism clearly development/demo-only. Do not present an insecure demo shortcut as production authentication.
- Keep secrets in environment variables. Commit only a sanitized `.env.example`.

## 7. Workflow and data-integrity rules

Model the batch lifecycle explicitly. Use named statuses and a controlled transition function; do not allow arbitrary status updates.

The intended high-level flow is:

1. A training centre creates a batch, uploads candidates, and submits it.
2. Two distinct district officers must approve the same submission before it advances.
3. A large batch receives quality-team review. The exact threshold is not specified in the brief; make it a documented configurable constant rather than scattering a magic number.
4. The state office gives final approval.
5. Final approval triggers certificate issuance asynchronously.
6. Officers may reject or return a batch with a reason. A returned batch can be corrected and resubmitted.
7. On resubmission, use a new submission/version number. Preserve earlier decisions in history and require approvals for the current version; never accidentally count stale approvals toward the new version.
8. The state office can cancel an issued certificate. Keep the record and audit trail; public verification must immediately report it as invalid.

For every state-changing action:
- Check the current status and actor permission on the server.
- Validate the transition and required reason.
- Persist the state change and audit record transactionally.
- Use optimistic concurrency or a conditional update/row lock so simultaneous requests cannot advance a batch twice.
- Enforce one approval per officer, stage, batch, and submission version with a database unique constraint.
- Record actor, action, timestamp, relevant reason, and submission version.

Never trust a status value sent by the client.

## 8. PostgreSQL and Prisma

- PostgreSQL is the source of truth for users, batches, candidates, submission versions, approvals, certificates, delivery records, audit logs, and outbox events.
- Use Prisma schema models, explicit relations, enums where appropriate, indexes for actual query patterns, and migrations committed to source control.
- Do not use `prisma db push` as a substitute for committed migrations in the submitted project.
- Use database-level unique constraints for certificate numbers, verification tokens, and other uniqueness invariants.
- A candidate must not receive more than one certificate for the same certification outcome. Design the unique key to reflect the domain rule and enforce it in PostgreSQL.
- Use Prisma `$transaction` for multi-record state changes. Keep transactions short; do not call WhatsApp, generate PDFs, or perform other slow external work inside a database transaction.
- Handle Prisma unique-constraint and transaction-conflict errors deliberately; convert expected conflicts into clear 409 responses.
- Store timestamps consistently (UTC in the database; format for display at the boundary).
- Avoid N+1 queries and fetch only fields needed by the caller.

## 9. Event-driven jobs, Redis, and BullMQ

Use BullMQ with Redis for work that should not block an HTTP request, especially certificate PDF generation, WhatsApp delivery, and delayed-batch escalation.

- API requests should persist the business change and enqueue durable work through an outbox pattern where practical. Do not rely on an in-memory event emitter for critical work.
- The outbox record must be committed in the same PostgreSQL transaction as the business change. A dispatcher publishes pending outbox records to BullMQ and marks them published only after successful enqueueing.
- Make workers idempotent. A retried job must not create a second certificate or duplicate a successful delivery.
- Use stable job IDs/idempotency keys based on the business operation, candidate/certificate, and submission version.
- Configure bounded retries with exponential backoff and retain failed jobs for inspection. Do not retry permanent validation errors indefinitely.
- Track job/delivery states in PostgreSQL; Redis is not the source of truth for certificate validity or approval state.
- Workers must tolerate restarts and process jobs safely more than once.
- Keep provider calls outside database transactions. Record each WhatsApp attempt and its outcome.
- The WhatsApp integration is a stand-in provider. Implement it behind a provider interface and simulate success, failure, and timeout deterministically for tests/demo. Do not claim a real WhatsApp account is connected.
- A WhatsApp failure must not delete or regenerate an already-issued certificate.
- A worker crash or Redis restart must not lose the underlying business event; pending outbox records and persisted job state must allow recovery.

## 10. Certificate generation and public verification

- Generate one certificate per eligible candidate only after final state approval.
- Use a database uniqueness constraint and idempotent issuance operation to prevent duplicates.
- Generate an unpredictable verification token using a cryptographically secure random source; do not expose sequential database IDs as verification secrets.
- Store certificate metadata and a private file-storage key/path in PostgreSQL. For local development, use a clearly isolated local volume; document private object storage for production.
- Do not expose filesystem paths or allow arbitrary file-path input from a request.
- Public verification must read the current certificate status from PostgreSQL (or use a cache with safe invalidation); a cancelled certificate must never be reported as valid due to stale cache.
- Return minimal candidate information. Do not reveal phone numbers, addresses, or unrelated personal details.
- Protect certificate downloads so candidates can access only their own certificates through an authenticated or securely tokenized flow.
- Treat cancellation as a status change with actor, reason, timestamp, and audit event; never delete the certificate record.

## 11. Auditability, observability, and delayed work

- Record every meaningful action: batch creation/submission/resubmission, approval, rejection, return, state approval, certificate issuance/cancellation, and delivery attempts.
- Audit entries must identify the actor, action, target, timestamp, and relevant metadata/reason. Do not allow ordinary users to edit or delete audit history.
- Provide health/readiness endpoints that check required dependencies appropriately.
- Use structured logs with request IDs and job IDs so a batch can be traced through API, outbox, queue, worker, certificate, and delivery.
- Avoid logging credentials, access tokens, full CSV contents, or unnecessary candidate personal data.
- Implement delayed-batch detection as scheduled/background work. The time threshold should be configurable and documented. Escalate/flag without blocking the officer's request.

## 12. Testing requirements

Write automated tests for business rules, not only happy-path HTTP responses. At minimum, cover:

1. CSV with invalid rows reports row-level errors and saves no candidates from that upload.
2. Two distinct district officers are required; the same officer cannot approve twice.
3. Concurrent approval requests cause only one valid state transition.
4. A 60-candidate approved batch results in exactly one certificate per candidate.
5. Retried certificate-generation and WhatsApp jobs do not create duplicate certificates or duplicate successful deliveries.
6. WhatsApp failure/timeout is recorded and retried without losing the certificate.
7. A cancelled certificate is immediately reported as invalid by public verification.
8. Unauthorized roles and out-of-scope users cannot perform actions.
9. Resubmission creates a new version and stale approvals do not count.
10. Audit history is created for important decisions.

Use the project's test runner and test database. Tests must not depend on a real WhatsApp service or external network. Include a practical command to run them.

## 13. Docker, configuration, and operational behaviour

- The complete local system must start with Docker Compose and include the frontend, API, PostgreSQL, Redis, and worker as appropriate.
- Add health checks and service dependencies that wait for readiness, not merely container start order.
- Persist PostgreSQL data with a named volume. Use a Redis volume only if needed by the chosen persistence strategy; correctness must not depend on Redis retaining transient cache data.
- Provide Dockerfiles and a documented first-run migration/seed process.
- Include `.env.example` with descriptions or safe placeholders. Never commit `.env`.
- Handle SIGTERM/SIGINT gracefully: stop accepting new work, finish/close resources where practical, and disconnect Prisma/Redis cleanly.
- Provide `/health` and, where useful, `/ready` endpoints. Do not report ready if required dependencies are unavailable.

## 14. Code quality and collaboration rules

- Keep functions focused and avoid premature abstraction.
- Use early returns where they improve clarity.
- Add comments for non-obvious business rules and concurrency decisions, not for every line.
- Document exported service functions and complex contracts with concise JSDoc.
- Do not suppress TypeScript errors with `any`, `@ts-ignore`, or unsafe casts to make code compile. Fix the underlying type issue or explain a justified narrow exception.
- Do not add dependencies without a clear need.
- Do not modify unrelated files or perform broad refactors without first explaining the reason.
- Before changing an existing implementation, inspect the relevant files and follow their established conventions.
- Keep README requirements/assumptions and known limitations accurate. Never claim a feature or test works unless it has been run.

## 15. Definition of done

A backend feature is not complete until:
- Its role and resource authorization are enforced server-side.
- Inputs are validated.
- Database constraints/transactions protect relevant invariants.
- Errors are handled consistently.
- Important actions are audited.
- Relevant automated tests pass.
- The feature works with the local Docker Compose setup.
