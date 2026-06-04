---
name: flowcore
description: Technical context for Flowcore — a multi-tenant, queue-based workflow automation platform (Turborepo monorepo). Read this before working on any part of the codebase.
---

# Flowcore — Technical Context

## What Flowcore is

Flowcore is a self-hosted, multi-tenant workflow automation platform (a focused, backend-heavy mini-Zapier). Users build event-driven automations — without writing code — by defining a **Workflow** that has one **Trigger** (what starts it) and an ordered list of **Steps** (what it does). Triggers fire from inbound webhooks or a cron scheduler; a separate worker process pulls each run off a queue and executes its steps in order, passing each step's output into the next. Multiple teams (workspaces) share one running instance with fully isolated data.

## Monorepo structure

Turborepo + pnpm workspaces.

```
flowcore/
  apps/
    api/      Fastify HTTP server — all REST routes + webhook ingestion
    worker/   BullMQ consumer — runs the execution engine (standalone process)
    web/      Next.js + Tailwind dashboard for managing workflows and viewing logs
  packages/
    db/       Prisma schema, migrations, exported Prisma client
    types/    Shared TypeScript interfaces (Workflow, Step, Execution, Job shapes)
    utils/    Shared helpers: logger, crypto (encrypt/decrypt), date utils
    queue/    BullMQ queue definitions, job type definitions, producer helper
```

The `api` and `worker` apps both depend on `db`, `types`, `utils`, and `queue`. The `web` app depends primarily on `types`.

## Tech stack (per app)

| Concern    | Choice                                          |
|------------|-------------------------------------------------|
| Monorepo   | Turborepo + pnpm workspaces                     |
| API        | Node.js + Fastify + TypeScript                  |
| Worker     | Node.js + TypeScript (standalone process)       |
| Web        | Next.js + Tailwind (minimal dashboard)          |
| Database   | PostgreSQL + Prisma ORM                         |
| Queue      | BullMQ + Redis                                  |
| AI         | Anthropic Claude API (`claude-sonnet-4-20250514`) |
| Validation | Zod                                             |
| Logging    | pino                                            |
| Auth       | JWT (access + refresh) + bcrypt                 |

## Key architectural concepts

**Webhook ingestion.** Each workflow with a webhook trigger gets a unique URL: `POST /webhooks/wf_abc123`. External services POST to it. The API validates the request, **immediately responds 200 OK**, and pushes a job onto the BullMQ queue. The API never executes the workflow inline — this keeps it fast and reliable regardless of how long the workflow takes.

**Cron triggers.** A scheduler runs every minute, queries workflows whose `next_run_at` is due, and enqueues them exactly like webhooks.

**Queue-based execution.** All runs go through Redis-backed BullMQ. The API/scheduler are producers; the worker is the sole consumer. Failures retry automatically with exponential backoff.

**Execution engine (the worker).** For each job the worker:
1. Loads the workflow definition from the database.
2. Runs each step in order.
3. Passes the output of step N as input to step N+1.
4. Saves per-step logs (input, output, duration, status).
5. Marks the execution `succeeded` or `failed`.
6. Retries on failure with exponential backoff.

Steps are modular, self-contained handlers keyed by `type`:
- `http` → makes an outbound HTTP request
- `ai_summarize` → calls the Claude API with a prompt template
- `slack_post` → posts a message to a Slack webhook URL
- `jira_fetch` → fetches a Jira ticket via the Atlassian REST API

Step inputs support variable interpolation. `{{...}}` tokens are resolved against the live execution context at run time:
```json
{ "message": "New ticket: {{trigger.issue.key}} — {{steps.0.output.summary}}" }
```
`trigger.*` is the trigger payload; `steps.N.output.*` is a prior step's output.

**Multi-tenancy.** Every resource (workflow, execution, api key, integration) belongs to a workspace. **All DB queries are scoped by `workspace_id`** — this is the core data-isolation invariant. Users can belong to multiple workspaces with role-based access (`owner`, `admin`, `member`).

## Database (Postgres + Prisma)

- Schema lives in `packages/db` (`schema.prisma`).
- The package exports a single configured Prisma client; apps import it rather than instantiating their own.
- Migrations are managed with Prisma Migrate (`prisma migrate dev` in development, `prisma migrate deploy` in production), run from within `packages/db`.
- Multi-tenancy is enforced at the query layer — always filter by `workspace_id`.

## Queue setup (BullMQ + Redis)

Defined in `packages/queue`. Queue names and job shapes are centralized there so producers (API, scheduler) and the consumer (worker) share one contract.

- **`workflow-executions`** — the main queue. A job represents one workflow run.

Job payload (shape, see `packages/types` for the canonical definition):
```ts
{
  workspaceId: string
  workflowId: string
  triggerType: "webhook" | "cron"
  triggerPayload: Record<string, unknown>   // inbound webhook body or cron context
}
```
Jobs are configured with automatic retries and exponential backoff. `packages/queue` exposes a producer helper used by the API and scheduler to enqueue runs.

## Shared packages — what each exports

- **`@repo/db`** — the Prisma schema, migrations, and a ready-to-use Prisma client instance.
- **`@repo/types`** — shared TypeScript interfaces: `Workflow`, `Step`, `Trigger`, `Execution`, queue job shapes, and API request/response envelopes. Single source of truth shared by frontend and backend.
- **`@repo/utils`** — `logger` (pino), `crypto` (`encrypt`/`decrypt` for integration credentials), and date utilities.
- **`@repo/queue`** — BullMQ queue definitions, job type definitions, and the producer helper.

## Environment variables (per app)

**api**
- `DATABASE_URL` — Postgres connection string
- `REDIS_URL` — Redis connection string
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — token signing secrets
- `ENCRYPTION_KEY` — key for encrypting/decrypting integration credentials
- `PORT` — HTTP listen port

**worker**
- `DATABASE_URL`
- `REDIS_URL`
- `ENCRYPTION_KEY` — to decrypt integration credentials at execution time
- `ANTHROPIC_API_KEY` — for the `ai_summarize` step

**web**
- `NEXT_PUBLIC_API_URL` — base URL of the API server

## Running locally

1. Start Postgres and Redis (e.g. via Docker).
2. Copy `.env.example` to `.env` in each app and fill in the values above.
3. `pnpm install` at the repo root.
4. Run Prisma migrations from `packages/db` (`pnpm prisma migrate dev`).
5. `pnpm dev` at the root — Turborepo starts the API, worker, and web app together.

## Coding conventions

- **TypeScript strict mode.** No `any` types — ever. Use `unknown` plus a Zod parse at boundaries.
- **Zod** for all input validation (HTTP bodies, webhook payloads, env parsing, job payloads).
- **pino** for structured logging via `@repo/utils` — no `console.log` in app code.
- Shared contracts live in `@repo/types`; do not redefine domain shapes locally.
- All DB access goes through `@repo/db` and is scoped by `workspace_id`.
- Credentials are always stored encrypted (`@repo/utils` crypto); plaintext secrets are never persisted.
