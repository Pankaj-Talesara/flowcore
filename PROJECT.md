# Flowcore — Product & Architecture Overview

## The problem Flowcore solves

Teams constantly need to wire one tool to another: when a Jira ticket is created, summarize it and post it to Slack; every morning, generate a standup digest; when a form is submitted, extract structured data and save it somewhere. Building each of these as a one-off script is repetitive, brittle, and hard to operate (retries, logging, secrets, scheduling). Flowcore is a self-hosted, multi-tenant platform that lets users build these event-driven automations declaratively — no code — while the platform handles ingestion, queuing, execution, retries, per-step logging, and credential storage. It's a focused, backend-heavy mini-Zapier you run yourself.

## Core concepts

- **Workspace** — a tenant. Every resource (workflows, executions, API keys, integrations) belongs to exactly one workspace, and all data is isolated per workspace. Users can be members of multiple workspaces.
- **Workflow** — an automation. It has exactly **one Trigger** and **one or more Steps**, defined as JSON through the API.
- **Trigger** — what starts a workflow. Either a `webhook` (an external service POSTs to a unique URL) or a `cron` (runs on a schedule).
- **Step** — one unit of work in a workflow. Steps run in order; each has a `type` and a config object. The output of step N is available to step N+1.
- **Execution** — a single run of a workflow. It records overall status (`succeeded`/`failed`), timing, the trigger payload, and per-step logs (input, output, duration, status).

## How a workflow runs, end to end

```
External event ──▶ API (webhook route)          Scheduler (cron, every minute)
                      │  validate, 200 OK              │  finds due workflows
                      └──────────────┬─────────────────┘
                                     ▼
                         BullMQ queue (Redis)
                                     ▼
                              Worker process
                       ┌─────────────────────────┐
                       │ 1. load workflow from DB │
                       │ 2. run each step in order│
                       │ 3. pipe output N → N+1   │
                       │ 4. save per-step logs    │
                       │ 5. mark succeeded/failed │
                       │ 6. retry w/ backoff      │
                       └─────────────────────────┘
                                     ▼
                       Execution + step logs in DB
                          (viewable in the web dashboard)
```

1. **Trigger fires.** A webhook arrives at `POST /webhooks/wf_abc123`, or the cron scheduler finds a workflow whose `next_run_at` is due.
2. **Enqueue.** The API validates the request, responds **200 OK immediately**, and pushes a job onto the `workflow-executions` queue. (Quota is checked before enqueuing — see Usage metering.)
3. **Execute.** The worker pulls the job, loads the workflow, and runs each step in sequence, resolving `{{...}}` variables against the live execution context.
4. **Log.** Each step's input, output, duration, and status are persisted. The execution is marked `succeeded` or `failed`; failures retry with exponential backoff.
5. **Observe.** Results and logs are visible in the Next.js dashboard.

### Variable interpolation

Step configs can reference earlier data with `{{...}}` tokens, resolved at run time:
```json
{ "message": "New ticket: {{trigger.issue.key}} — {{steps.0.output.summary}}" }
```
- `trigger.*` — the trigger payload (webhook body or cron context).
- `steps.N.output.*` — the output of a prior step.

## Supported trigger types

- **webhook** — each workflow gets a unique URL (`/webhooks/wf_...`). Any HTTP client (Jira, GitHub, a contact form, etc.) can POST to it. The API responds instantly and offloads execution to the queue.
- **cron** — a scheduler process runs every minute, finds workflows whose `next_run_at` is due, and enqueues them exactly like a webhook.

## Built-in step types

- **http** — makes an outbound HTTP request (method, URL, headers, body). Useful for "save to a Google Sheet" or any REST API.
- **ai_summarize** — calls the Claude API with a prompt template; returns structured/text output for downstream steps.
- **slack_post** — posts a message to a Slack incoming webhook URL.
- **jira_fetch** — fetches a Jira ticket's full details via the Atlassian REST API.

Each step type is a self-contained handler in the worker, so new types can be added without touching the engine.

## Multi-tenancy model

Every resource belongs to a **workspace**, and every database query is scoped by `workspace_id` — this is the central data-isolation guarantee. A user can belong to multiple workspaces, each with a role:
- **owner** — full control, including workspace deletion and billing-level settings.
- **admin** — manage workflows, integrations, API keys, and members.
- **member** — build and run workflows.

## Auth model

- **JWT access + refresh tokens.** Users authenticate (passwords hashed with **bcrypt**) and receive a short-lived access token plus a longer-lived refresh token. The access token authorizes API calls; the refresh token mints new access tokens.
- **API keys.** Workspaces can generate API keys to trigger workflows programmatically. Keys are **SHA-256 hashed before storage** — the plaintext is shown once at creation and never stored. Keys carry **scopes** (e.g. `trigger:run`, `workflows:read`) and are **rate limited per plan** using a Redis sliding-window counter.

## Integrations & credentials

Third-party credentials (Jira API token, Slack webhook URL, etc.) are stored **encrypted per workspace** in an integrations table. The worker loads and decrypts them at execution time. There are no OAuth flows yet — see below.

## Usage metering & plan limits

- Each workflow execution increments a **monthly counter per workspace**.
- **Free plan:** 100 executions/month. **Pro plan:** 10,000 executions/month.
- The API **checks quota before enqueuing** a run; over-quota runs are rejected.
- Counters **reset on the 1st of each month** via a cron job.

## Intentionally NOT built yet

- **OAuth2 flows** for Jira/Slack — for now, integrations use a simple API token / webhook URL.
- **Billing UI / Stripe integration** — quota logic exists, but there is no payment flow.
- **Custom code steps** — no user-defined JS/Python execution.
- **Visual workflow builder** — workflows are defined via JSON through the API, not a drag-and-drop canvas.
- **Mobile app.**
