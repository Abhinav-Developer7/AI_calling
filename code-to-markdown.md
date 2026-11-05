```markdown
from pathlib import Path

content = r"""# AI Calling Agent — Project Rules

> **Project:** Jewellery Customer Feedback AI Calling System  
> **Purpose:** Automatically call a customer after a jewellery purchase, collect feedback, and make the results available to administrators.

These rules are the source of truth for AI-assisted development in this repository. Follow them before creating, editing, or refactoring code.

---

## 1. Product Goal and Scope

Build an admin-managed AI calling system for jewellery stores.

1. A purchase/bill is completed in the jewellery billing system.
2. The purchase and customer details are received by this application through a secured API or integration.
3. The system schedules a feedback call for **15 minutes after the purchase**.
4. The AI voice agent calls the customer, asks about their shopping experience, and collects a rating and optional comments.
5. The system stores the call result and displays it in the admin dashboard.

The system is for post-purchase feedback. Do not turn it into a sales, marketing, debt-collection, or promotional calling system unless the product requirements are explicitly changed.

## 2. Core Non-Negotiable Calling Rules

- **One purchase must never result in more than one successful feedback conversation.**
- Use a persistent call status and server-side duplicate prevention. Never rely only on frontend checks.
- Enforce a unique purchase identifier (`purchaseId`) and an appropriate database uniqueness constraint.
- Schedule the first call for 15 minutes after the purchase event.
- Do not call when the customer has not provided the required permission/consent, has opted out, or has an invalid/unusable phone number.
- Respect configured calling hours, local time zone, applicable telecom rules, and store policy. Do not hard-code assumptions about legal calling hours.
- Limit the system to **a maximum of two call attempts per purchase**, including retries. A retry must not create a second completed feedback conversation.
- Retry only eligible temporary failures. Do not retry opt-outs, invalid numbers, consent failures, or completed calls.
- Before every call attempt, re-check consent, opt-out, attempt count, call status, and calling-hour eligibility.
- Prevent concurrent workers from calling the same purchase. Use atomic database updates/locking or an equivalent reliable mechanism.
- If a customer asks not to be called again, immediately mark the relevant contact/purchase as opted out and stop future attempts.
- Never claim a call was completed unless a provider webhook or verified provider response confirms its outcome.

### Suggested call statuses

Use a consistent enum (or an equivalent documented state model):

- `pending` — purchase received; not yet scheduled/processed
- `scheduled` — waiting for the call time
- `queued` — eligible and waiting for a worker
- `calling` — a call attempt is in progress
- `completed` — feedback conversation completed
- `no_answer` — customer did not answer
- `busy` — line was busy
- `failed` — provider or system failure
- `retry_scheduled` — eligible for the final permitted attempt
- `skipped` — not called due to a rule or eligibility check
- `opted_out` — customer requested no further calls

Document every status transition. Do not allow arbitrary status changes from the client.

## 3. Technology and Architecture

Use the agreed MERN architecture unless the repository already contains an approved alternative:

- **Frontend:** React with Vite
- **Backend:** Node.js and Express
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT-based admin authentication
- **Background scheduling:** BullMQ with Redis, or another durable queue approved for this project
- **Voice provider:** Integrate through a provider adapter. Retell AI, Vapi, or an appropriate Indian telephony provider such as Exotel may be evaluated; do not assume a provider is selected until configuration or project documentation confirms it.

Keep frontend and backend responsibilities separate. The backend owns scheduling, eligibility, call attempts, provider communication, webhooks, and final call status. The frontend must never directly initiate provider calls or expose provider credentials.

Use environment variables for provider keys, database credentials, JWT secrets, Redis credentials, and external integration secrets. Never commit secrets.

## 4. Suggested Backend Modules

Keep code modular and consistent with the existing repository:

- `models/` — Admin/User, Purchase, Call, Feedback, and related schemas
- `controllers/` — request handling and response formatting
- `routes/` — versioned API route definitions
- `services/` — business logic, scheduling, eligibility, provider integration, and feedback processing
- `workers/` — queue processors and scheduled call execution
- `webhooks/` or webhook routes — provider event handling
- `middleware/` — authentication, authorization, validation, and error handling
- `utils/` — shared helpers and constants
- `config/` — database, queue, and provider configuration

Do not put business logic, provider calls, or scheduling logic directly inside React components or Express route handlers.

## 5. Purchase Ingestion and Data Integrity

- Accept purchase events only through an authenticated, validated integration endpoint.
- Validate required fields before saving: unique `purchaseId`, customer name where available, phone number, purchase timestamp, store/branch reference where applicable, and consent/permission evidence.
- Normalize phone numbers to a consistent international format before calling. Preserve the original value only when there is a valid operational reason.
- Make purchase ingestion idempotent. Repeated delivery of the same purchase event must not create duplicate purchases, jobs, or calls.
- Store timestamps in UTC and convert to the customer's/store's configured time zone for display and calling-hour checks.
- Keep purchase data separate from call-attempt data and feedback data where this improves traceability.
- Record the source system and event timestamp so that integration problems can be investigated.

## 6. AI Voice Agent Behaviour

The voice agent must sound polite, natural, concise, and respectful—not robotic or overly scripted.

### Language support

- Support Malayalam, English, and Manglish (Malayalam spoken using English words/letters) where the selected voice provider supports them.
- Prefer natural Kerala Malayalam when the customer speaks Malayalam.
- Detect the customer's preferred language from the conversation and continue in that language.
- Allow the customer to switch languages at any time.
- Do not claim perfect Malayalam recognition or speech quality without testing the selected provider with real Malayalam conversations.
- If speech is unclear, ask the customer to repeat once or twice politely. If it remains unclear, end the call respectfully and record the outcome accurately.

### Conversation flow

1. Introduce the AI assistant and the jewellery store clearly.
2. Confirm that the customer is available for a brief feedback conversation.
3. Explain that the call is about the customer's recent purchase.
4. Ask for an overall shopping-experience rating on a **1–5 scale**.
5. Ask one short optional follow-up question about the experience.
6. If the customer reports a problem, ask a brief clarifying question and capture the issue without arguing or making promises.
7. Thank the customer and end the call politely.

### Conversation safeguards

- Keep the call short and focused on feedback.
- Do not ask for OTPs, passwords, PINs, card details, bank details, or unnecessary sensitive personal information.
- Do not pressure the customer to give a positive rating.
- Do not argue, blame staff, or make unsupported claims.
- Do not promise refunds, discounts, repairs, replacements, or resolution timelines. Record the concern for store staff to review.
- If the customer is busy, ask whether they would prefer the permitted retry or politely end the call according to the retry policy.
- If the customer refuses, asks to stop, or expresses discomfort, end the call and record the opt-out/refusal correctly.
- Be transparent that the caller is an AI assistant when asked, and do not impersonate a human employee.

## 7. Feedback Data

Capture structured information whenever it is available:

- `purchaseId`
- `callId` and provider call ID
- call status and attempt number
- call start/end timestamps and duration
- language used
- rating from 1 to 5, or `null` if not provided
- customer comments/transcript summary
- sentiment label (for example: positive, neutral, negative, or unknown)
- complaint category and complaint summary, if applicable
- opt-out/refusal indicator
- provider outcome and failure reason
- timestamps for creation and updates

Validate AI-extracted values on the backend. A transcript or model response is untrusted input; never save an invalid rating or arbitrary status. Keep the original provider event or a safe, access-controlled reference when needed for troubleshooting.

## 8. Admin Dashboard Requirements

The admin interface should make the calling process easy to monitor.

Include, as applicable:

- Overview cards: total purchases received, calls scheduled, calls completed, pending calls, failed/no-answer calls, average rating, and complaints
- Call/feedback history with search, filters, sorting, and pagination
- Purchase/customer details needed for support
- Rating, sentiment, language, call status, attempt count, and call date
- Complaint details and a clear review state for staff follow-up
- Call detail view with safe transcript/summary access
- Date range and branch/store filters when those fields exist

Use clear loading, empty, success, and error states. Do not display fake production metrics. Any demo data must be clearly identified as demo data.

## 9. Security and Privacy

- Protect every admin API with authentication and role-based authorization.
- Apply least-privilege access. Only authorized users may view customer details, transcripts, or call recordings.
- Validate and sanitize all incoming data on the server.
- Use rate limiting and appropriate request-size limits on public/integration endpoints.
- Verify provider webhook signatures or use the provider's documented authentication mechanism.
- Make webhook processing idempotent; providers may send duplicate or out-of-order events.
- Do not expose API keys, JWT secrets, raw provider credentials, or internal stack traces to the frontend.
- Avoid logging full phone numbers, transcripts, or other personal data. Mask sensitive values in application logs.
- Define retention and deletion rules for recordings, transcripts, and customer data with the project owner. Do not retain recordings by default without an approved need and policy.
- Record consent source, timestamp, and relevant evidence. Support opt-out and suppression checks across future eligible calls.
- Follow applicable Indian privacy, telecom, and customer-consent requirements. Escalate uncertain compliance questions to the project owner; do not invent legal assurances.

## 10. API and Error-Handling Rules

- Use consistent REST API naming and response structures.
- Keep request validation at the API boundary.
- Use appropriate HTTP status codes.
- Return safe, useful error messages to the frontend; log technical details securely on the backend.
- Never trust client-supplied roles, call statuses, attempt counts, ratings, or provider outcomes.
- Protect ingestion and webhook routes separately from admin routes.
- Add pagination to potentially large history endpoints.
- Document endpoint method, path, authentication requirement, request body, and response shape.

## 11. Frontend and UI Rules

- Build a clean, professional admin dashboard suitable for a jewellery business.
- Prioritize readability, clear status labels, and fast access to feedback and complaints.
- Use reusable components for tables, filters, status badges, metric cards, forms, dialogs, and loading states.
- Keep API calls in a dedicated API/service layer, not scattered throughout components.
- Keep state and side effects predictable. Avoid unnecessary global state.
- Make the dashboard responsive for desktop, tablet, and mobile.
- Use accessible labels, keyboard-friendly controls, and clear confirmation for destructive actions.
- Do not add UI controls that imply functionality not implemented by the backend.

## 12. Testing Requirements

Add tests for critical business rules before considering the feature complete.

At minimum, test:

- A purchase event received twice creates only one purchase and one scheduled call.
- A purchase cannot be called twice after a completed conversation.
- Two workers cannot start calls for the same purchase concurrently.
- The first call is scheduled for 15 minutes after purchase.
- A maximum of two attempts is enforced.
- A retry is scheduled only for eligible outcomes.
- Opted-out, non-consenting, invalid-number, and out-of-hours purchases are not called.
- Provider webhooks are authenticated and idempotent.
- Duplicate/out-of-order webhook events do not corrupt call status.
- Invalid AI-extracted ratings and statuses are rejected.
- Unauthorized admins cannot access protected customer or call data.
- Malayalam, English, and Manglish flows are tested with the actual selected voice provider before release.

Use unit tests for business rules, integration tests for APIs/database/queue/webhooks, and end-to-end tests for important admin workflows.

## 13. Development Workflow for AI Coding Tools

Before changing code:

1. Inspect the existing folder structure and relevant files.
2. Read the existing implementation before replacing anything.
3. Identify the exact files that need to change.
4. Preserve working functionality and existing conventions.
5. Explain any necessary schema or API changes before applying broad changes.

While coding:

- Work in small, logically grouped changes.
- Reuse existing components, utilities, and patterns where appropriate.
- Do not create duplicate files, routes, models, or API clients.
- Do not rewrite the whole project to implement a small feature.
- Do not silently remove existing functionality.
- Keep names consistent and code readable.
- Add validation, error handling, and tests with the feature.
- Do not hard-code credentials, provider IDs, phone numbers, or environment-specific URLs.
- Do not install a new dependency unless it is needed; explain why it is required.
- Do not mark a task complete until the relevant checks have been run.

After coding:

1. Run the relevant frontend/backend tests.
2. Run linting and build checks when configured.
3. Report changed files and important implementation decisions.
4. List commands/checks run and their results.
5. Clearly disclose anything not implemented, not tested, or dependent on provider configuration.

## 14. Git and Environment Rules

- Keep secrets and local environment files out of Git. Commit `.env.example` with variable names and safe placeholders only.
- Use separate development and production configuration.
- Never point development testing at production customer data.
- Do not deploy, run database migrations against production, or modify production infrastructure without explicit approval.
- Use focused commits with descriptive messages.
- Review the diff before committing or merging.
- Keep generated logs, build output, recordings, and temporary files out of version control unless explicitly required.

## 15. Definition of Done

A feature is complete only when:

- Its acceptance criteria are met.
- Backend validation and authorization are implemented.
- Duplicate processing and relevant failure cases are handled.
- Frontend loading, empty, success, and error states are covered where applicable.
- Critical tests pass.
- No secrets or sensitive customer data are exposed.
- The implementation is documented sufficiently for another developer to maintain.
- Any provider-specific limitations or manual setup steps are clearly reported.

---

## Important Instruction

**Reliability, consent, privacy, and duplicate-call prevention are more important than call volume or automation speed.** When requirements conflict, do not weaken these safeguards. Ask for clarification rather than inventing business rules.
"""

path = Path("/mnt/data/AI_CALLING_AGENT_RULES.md")
path.write_text(content, encoding="utf-8")
print(f"Created: {path}")
```
