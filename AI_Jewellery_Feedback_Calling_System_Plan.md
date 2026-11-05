# AI-Powered Jewellery Customer Feedback & Calling System

## Software Development Plan

**Document type:** Product and Technical Development Plan\
**Version:** 1.0\
**Status:** Proposed\
**Primary objective:** Automatically contact customers after a jewellery
purchase, collect feedback through an AI voice agent, and provide
actionable reports through an admin dashboard.

------------------------------------------------------------------------

## 1. Project Overview

The AI-Powered Jewellery Customer Feedback & Calling System is a web
application that integrates with a jewellery shop's billing software.

When a bill is generated, the billing application sends the purchase and
customer details to the AI Calling System through a secure API/webhook.
The system validates the data, creates a feedback process, and schedules
an outbound AI call for 15 minutes after the purchase.

The AI voice agent contacts the customer, conducts a short feedback
conversation, and collects customer satisfaction information. The system
stores call events, call status, transcript, rating, feedback,
sentiment, and any complaint or follow-up requirement. Administrators
can monitor the complete process and view reports from a central
dashboard.

### 1.1 Primary goals

-   Automatically receive purchase details from billing software.
-   Schedule a feedback call 15 minutes after an eligible purchase.
-   Prevent duplicate feedback processes and duplicate calls.
-   Manage call lifecycle and retry rules reliably.
-   Collect structured customer feedback through an AI voice
    conversation.
-   Display call status, ratings, feedback, and complaints in the admin
    dashboard.
-   Generate date-wise and business-level reports.
-   Respect customer consent, opt-outs, calling restrictions, and
    applicable telecom requirements.
-   Design the system so it can later support multiple branches and
    businesses.

### 1.2 Out of scope for the first release

-   Building a complete jewellery billing/POS application.
-   Managing inventory, gold rates, stock, or accounting.
-   Marketing/promotional campaigns.
-   Unrestricted repeated calling.
-   Fully automated complaint resolution.
-   Multi-tenant SaaS billing and subscription management.

These can be considered in later versions.

------------------------------------------------------------------------

## 2. Main Business Workflow

1.  A customer purchases jewellery.
2.  The billing software generates an invoice.
3.  The billing software sends the purchase information to the AI
    Calling System.
4.  The backend authenticates and validates the incoming request.
5.  The system checks whether the purchase has already been registered.
6.  The system checks customer calling consent, opt-out status, and
    calling eligibility.
7.  A purchase record and one feedback process are created.
8.  A background job is scheduled for 15 minutes after the purchase.
9.  At the scheduled time, a worker checks the latest eligibility and
    process status.
10. The worker requests an outbound call from the selected AI
    voice/telephony provider.
11. The AI agent speaks with the customer and collects feedback.
12. The calling provider sends call lifecycle events and the final call
    result to the backend through webhooks.
13. The backend validates and processes those events.
14. Feedback and call information are stored in MongoDB.
15. The admin dashboard displays updated statuses, ratings, feedback,
    complaints, and reports.

**Important:** The frontend must not be responsible for scheduling or
executing calls. The backend queue and worker are responsible for all
scheduled calling operations.

------------------------------------------------------------------------

## 3. User Roles

### 3.1 Admin

The first release can use a single Admin role.

Admin permissions:

-   Log in and log out.
-   View dashboard statistics.
-   View and search purchases.
-   View scheduled and completed calls.
-   View call attempts and call details.
-   View customer feedback and ratings.
-   Review negative feedback and complaints.
-   Mark complaints as resolved.
-   Manage customer opt-out records.
-   Configure calling and retry settings.
-   Generate and export reports.
-   View system activity and call costs where provider data is
    available.

### 3.2 Future roles

Possible future roles:

-   Branch Manager: Access data belonging to an assigned branch.
-   Support Executive: Review and resolve assigned complaints.
-   Super Admin: Manage multiple businesses, branches, and system-wide
    settings.

Role-based access must be designed so that these roles can be added
without rewriting the application.

------------------------------------------------------------------------

## 4. Functional Modules

### 4.1 Authentication and User Management

Features:

-   Admin login/logout.
-   Secure password hashing.
-   JWT-based authentication.
-   Protected frontend routes.
-   Backend authentication middleware.
-   Role-based authorization.
-   Admin profile and password update.
-   Login rate limiting and audit logging.

The login form should not accept a role selected by the user. The
backend must determine the user's permissions from the authenticated
account.

### 4.2 Billing Integration and Purchase Management

The AI system receives purchase information from the existing billing
application.

Recommended incoming purchase fields:

  -----------------------------------------------------------------------
  Field                               Description
  ----------------------------------- -----------------------------------
  externalPurchaseId                  Unique purchase ID from billing
                                      software

  invoiceNumber                       Invoice number

  customerName                        Customer name

  phoneNumber                         Customer phone number in normalized
                                      format

  purchaseDate                        Purchase date and time

  totalAmount                         Invoice total

  currency                            Currency, normally INR

  items                               Purchased product summary

  branchId                            Branch identifier, if applicable

  feedbackCallConsent                 Customer's recorded
                                      consent/eligibility information

  consentCapturedAt                   Date and time consent was captured

  source                              Billing system identifier
  -----------------------------------------------------------------------

Do not collect unnecessary sensitive customer or payment information.
The AI feedback system does not need card details, bank information, or
full payment credentials.

Purchase management features:

-   List all received purchases.
-   Search by invoice number, customer name, or phone number.
-   Filter by purchase date and branch.
-   View purchase details.
-   View linked feedback process and call attempts.
-   Identify invalid or duplicate incoming records.
-   Display integration errors for administrator review.

### 4.3 Purchase Webhook/API

Suggested endpoint:

`POST /api/v1/integrations/purchases`

Responsibilities:

-   Authenticate the billing system using a dedicated API credential or
    signed webhook.
-   Validate request schema and required fields.
-   Normalize phone numbers.
-   Validate purchase date and invoice details.
-   Check idempotency and duplicate purchase records.
-   Store the purchase.
-   Check consent and calling eligibility.
-   Create the feedback process if eligible.
-   Schedule the job for the configured delay.
-   Return a clear success, duplicate, or validation response.

Example response:

``` json
{
  "success": true,
  "message": "Purchase received",
  "purchaseId": "generated-database-id",
  "feedbackProcessCreated": true,
  "callScheduledAt": "2026-11-03T07:45:00.000Z"
}
```

The example timestamp is illustrative. Store timestamps consistently in
UTC and display them in the configured branch timezone.

### 4.4 Customer and Feedback Process Management

Each eligible purchase should have one feedback process.

The feedback process represents the complete lifecycle of feedback
collection for that purchase. It may contain more than one permitted
call attempt, but it must not create a second independent feedback
process for the same purchase.

Admin features:

-   View all feedback processes.
-   Filter by call status and feedback status.
-   Search customer and invoice details.
-   View scheduled time and attempt count.
-   View call history.
-   View feedback and AI summary.
-   View opt-out and follow-up flags.

### 4.5 AI Calling Management

The calling management page should display:

-   Customer name and phone number.
-   Invoice number.
-   Purchase amount.
-   Scheduled call time.
-   Current call status.
-   Feedback status.
-   Attempt count.
-   Last attempt time.
-   Provider call ID.
-   Call duration, when available.
-   Action to open full call details.

Admin actions:

-   View call details.
-   Cancel a scheduled call.
-   Review failed calls.
-   Reschedule an eligible call manually, with audit logging.
-   Mark a customer as do-not-call.
-   Review provider errors.

Manual actions must not bypass consent, opt-out, calling-hour,
duplicate, or attempt-limit rules.

### 4.6 AI Voice Agent

The AI agent should conduct a short, polite, natural feedback
conversation.

Suggested conversation flow:

1.  Introduce the jewellery shop and clearly identify itself as an AI
    assistant.
2.  Confirm that the customer is available for a brief feedback
    conversation.
3.  Ask about the overall shopping experience.
4.  Ask for an overall rating from 1 to 5.
5.  Ask optional questions about staff behaviour, product satisfaction,
    and billing experience.
6.  Invite the customer to share a complaint or suggestion.
7.  Confirm important feedback when necessary.
8.  Thank the customer and end the call politely.
9.  Respect requests to stop the call or not receive future calls.

The agent must:

-   Use the customer's preferred supported language where configured.
-   Avoid pressuring customers to provide a rating.
-   Avoid making promises about refunds, discounts, repairs, or
    complaint resolution.
-   Avoid asking for payment credentials or unnecessary personal
    information.
-   Handle silence, unclear speech, interruptions, and refusal politely.
-   End the call when the customer requests it.
-   Record structured feedback only when supported by the conversation.

### 4.7 Feedback and AI Analysis

Recommended feedback fields:

  Field                 Description
  --------------------- -----------------------------------------
  overallRating         Integer from 1 to 5, or null
  serviceRating         Optional service rating
  productSatisfaction   Positive, Neutral, Negative, or Unknown
  pricingSatisfaction   Positive, Neutral, Negative, or Unknown
  feedbackText          Customer's feedback
  sentiment             Positive, Neutral, Negative, or Unknown
  summary               Short AI-generated conversation summary
  complaintCategory     Categorized complaint, if any
  suggestion            Customer suggestion, if any
  requiresFollowUp      Whether human follow-up is required
  collectedAt           Feedback collection timestamp

AI-generated fields must be treated as machine-generated
interpretations, not unquestionable facts. Keep the original transcript
or source evidence where legally permitted and make corrections possible
for authorized administrators.

### 4.8 Complaint Management

Create a complaint record when a customer reports an issue or the
feedback analysis indicates that human attention is needed.

Features:

-   Complaint listing.
-   Complaint category and priority.
-   Linked purchase and feedback process.
-   Complaint description and AI summary.
-   Assignment to a support executive (future role).
-   Status: Open, In Progress, Resolved, or Closed.
-   Resolution notes.
-   Created and resolved timestamps.
-   Audit trail.

A low rating can trigger a review flag, but a low rating alone should
not automatically invent a complaint.

### 4.9 Dashboard

Dashboard KPI cards:

-   Total Purchases Received.
-   Feedback Processes Created.
-   Calls Scheduled.
-   Calls In Progress.
-   Completed Calls.
-   No Answer / Busy Calls.
-   Failed Calls.
-   Feedback Collected.
-   Average Rating.
-   Negative Feedback Requiring Attention.

Recommended dashboard sections:

1.  KPI overview cards.
2.  Call status distribution.
3.  Customer rating distribution (1--5).
4.  Positive, neutral, and negative sentiment distribution.
5.  Daily/weekly/monthly feedback trend.
6.  Recent purchases.
7.  Recent completed calls.
8.  Negative feedback and open complaints.
9.  Call cost summary, if provider cost data is available.

Dashboard data should come from backend aggregation APIs. Do not
calculate business-critical totals only in the browser.

### 4.10 Reports and Export

Report filters:

-   Date range.
-   Branch.
-   Call status.
-   Feedback status.
-   Rating.
-   Sentiment.
-   Complaint status.

Daily and monthly reports should include:

-   Total eligible purchases.
-   Feedback processes created.
-   Calls attempted.
-   Calls completed.
-   No-answer and busy outcomes.
-   Failed calls.
-   Feedback collection rate.
-   Average rating.
-   Rating distribution.
-   Sentiment distribution.
-   Common complaint categories.
-   Open and resolved complaints.
-   Calling cost, if available.

Export formats:

-   CSV/Excel.
-   PDF.

Define report metrics carefully. For example, call completion rate and
feedback collection rate are different metrics and must not be combined.

------------------------------------------------------------------------

## 5. Call Status and Feedback Status

Use separate fields for call lifecycle and feedback collection. A call
can finish without collecting feedback.

### 5.1 Call status

  Status        Meaning
  ------------- ------------------------------------------------------------
  Scheduled     Waiting for the scheduled time
  Queued        Waiting for a worker/provider
  Initiated     Provider accepted the call request
  Ringing       Provider reports that the phone is ringing
  In Progress   Customer and AI are in conversation
  Completed     Call conversation ended normally
  No Answer     Customer did not answer
  Busy          Customer line was busy
  Failed        Technical or provider failure
  Cancelled     Call was cancelled
  Skipped       Call was not made because an eligibility rule prevented it
  Exhausted     No further attempts are permitted

Use provider events to update statuses. Do not assume that a successful
API request means the customer answered.

### 5.2 Feedback status

  Status                Meaning
  --------------------- -----------------------------------------------
  Not Started           No feedback has been collected
  Partially Collected   Some feedback fields were collected
  Collected             Required feedback fields were collected
  Not Provided          Customer declined or did not provide feedback

### 5.3 Additional process fields

Maintain separate fields for:

-   `attemptCount`
-   `maxAttempts`
-   `nextAttemptAt`
-   `lastAttemptAt`
-   `completedAt`
-   `doNotCall`
-   `requiresFollowUp`

This avoids mixing call outcomes, feedback outcomes, and scheduling
state.

------------------------------------------------------------------------

## 6. Duplicate Prevention and Idempotency

This is a critical requirement.

### 6.1 One feedback process per purchase

Create a unique database index on the purchase reference:

``` js
FeedbackProcessSchema.index(
  { purchaseId: 1 },
  { unique: true }
);
```

The purchase itself should also have a unique external identifier scoped
to the billing source or tenant:

``` js
PurchaseSchema.index(
  { source: 1, externalPurchaseId: 1 },
  { unique: true }
);
```

### 6.2 Idempotent billing webhook

The billing system may retry a webhook if it does not receive a
response. Repeated requests must not create another purchase, feedback
process, or scheduled job.

Use a stable idempotency key or unique external purchase ID. Store
processed webhook event IDs where the source provides them.

### 6.3 Prevent concurrent call execution

A worker must atomically claim a due job/process before starting a call.
Use a lock or atomic state transition with a lease/timeout so two
workers cannot initiate the same attempt.

### 6.4 Provider call tracking

Store the provider's unique call ID. Process provider webhook events
idempotently using event IDs or a stable provider event key.

### 6.5 One successful feedback collection

Once valid feedback has been collected for a purchase, mark the process
complete and prevent further automated attempts for that purchase.

**Important:** A unique feedback-process record alone is not enough to
prevent duplicate outbound calls. Queue job IDs, atomic claiming,
provider request handling, and webhook deduplication must also be
implemented.

------------------------------------------------------------------------

## 7. Scheduling, Queue, and Retry Strategy

Recommended technology:

-   BullMQ for job queues.
-   Redis for queue storage.
-   Separate Node.js worker process.
-   MongoDB for durable business records.

### 7.1 Initial scheduling rule

Default delay: 15 minutes after the purchase timestamp.

The delay should be configurable by an authorized administrator.

Before executing a call, the worker must re-check:

-   Feedback process is still eligible.
-   Customer has not opted out.
-   Customer has not already completed feedback.
-   Maximum attempts have not been reached.
-   Current time is within permitted calling hours.
-   Phone number is valid.
-   No other attempt is already in progress.
-   Branch/business calling settings allow the call.

### 7.2 Retry policy for initial release

Suggested initial policy:

-   Initial attempt: 15 minutes after purchase.
-   No answer: one retry after 30 minutes, if still within permitted
    calling hours.
-   Busy: one retry after 30 minutes, if still eligible.
-   Temporary provider failure: retry according to classified error and
    provider guidance.
-   Invalid number or permanent provider error: do not retry
    automatically.
-   Customer opt-out or refusal: stop further attempts.
-   Feedback collected: stop further attempts.
-   Maximum attempts: 2 total by default.

The retry count and intervals should be configurable. Never retry
indefinitely.

### 7.3 Queue reliability

Implement:

-   Stable job IDs.
-   Retry/backoff for transient worker errors.
-   Failed-job monitoring.
-   Job retention and cleanup.
-   Worker concurrency limits.
-   Graceful shutdown.
-   Queue health monitoring.
-   Reconciliation for overdue or stuck processes.

MongoDB should remain the source of truth for the business process.
Redis/BullMQ should manage execution, not become the only place where
purchase or feedback state exists.

------------------------------------------------------------------------

## 8. AI Voice and Telephony Integration

Evaluate providers such as Retell AI, Vapi, Exotel, or Twilio based on
actual Indian outbound calling support and compliance.

Selection criteria:

-   Indian destination calling support.
-   Outbound calling permissions and number requirements.
-   Malayalam and English speech quality.
-   Natural turn-taking and interruption handling.
-   Webhook reliability.
-   Call status events.
-   Transcript and recording access.
-   API and webhook security.
-   Concurrent call limits.
-   Pricing per minute and additional AI charges.
-   Data location, retention, and privacy terms.
-   Support and service reliability.

Do not select a provider based only on a demo. Run a proof of concept
using real-world test scenarios and approved test numbers.

### 8.1 Provider adapter design

Keep provider-specific code inside a service/adapter layer.

Suggested interface:

``` js
class VoiceProvider {
  async initiateCall(payload) {}
  async getCallDetails(providerCallId) {}
  async validateWebhook(request) {}
  async normalizeWebhookEvent(request) {}
}
```

The application should not depend directly on one provider's event
format throughout the codebase. This makes provider replacement easier.

### 8.2 Webhook processing

Provider webhooks may report:

-   Call initiated.
-   Ringing.
-   Call answered.
-   Call ended.
-   No answer.
-   Busy.
-   Failed.
-   Transcript ready.
-   Recording ready.
-   Structured analysis ready.

Webhook handlers must:

1.  Verify provider signatures or authentication.
2.  Validate the event schema.
3.  Deduplicate the event.
4.  Identify the feedback process and attempt.
5.  Update only valid state transitions.
6.  Store relevant provider metadata.
7.  Return a timely acknowledgement.
8.  Process lengthy analysis asynchronously where appropriate.

------------------------------------------------------------------------

## 9. Suggested AI Agent Prompt Requirements

The AI agent's system instructions should define:

-   Business name and identity.
-   Clear disclosure that it is an AI assistant.
-   Purpose: post-purchase customer feedback.
-   Approved languages.
-   Conversation tone and maximum duration.
-   Questions to ask.
-   Optional questions.
-   Rating scale and interpretation.
-   Rules for handling complaints.
-   Rules for customer refusal and opt-out.
-   Prohibited requests and promises.
-   End-of-call behaviour.
-   Structured output schema.

The agent must not:

-   Pressure customers to give positive ratings.
-   Suggest a rating.
-   Pretend to be a human.
-   Make unsupported product, pricing, warranty, or refund claims.
-   Continue after a clear request to stop.
-   Ask for OTPs, card details, or banking credentials.

------------------------------------------------------------------------

## 10. MongoDB Data Model Plan

Recommended collections for the first production version:

### 10.1 Users

Stores admin and future staff accounts.

Key fields:

-   name
-   email (unique)
-   passwordHash
-   role
-   isActive
-   createdAt
-   updatedAt

### 10.2 Purchases

Stores data received from billing software.

Key fields:

-   source
-   externalPurchaseId
-   invoiceNumber
-   customerName
-   normalizedPhoneNumber
-   purchaseDate
-   totalAmount
-   currency
-   items
-   branchId
-   consentStatus
-   consentCapturedAt
-   createdAt
-   updatedAt

### 10.3 FeedbackProcesses

One record per eligible purchase.

Key fields:

-   purchaseId (unique)
-   callStatus
-   feedbackStatus
-   scheduledAt
-   nextAttemptAt
-   attemptCount
-   maxAttempts
-   lastAttemptAt
-   completedAt
-   doNotCall
-   requiresFollowUp
-   createdAt
-   updatedAt

### 10.4 CallAttempts

One record for every actual provider call attempt.

Key fields:

-   feedbackProcessId
-   attemptNumber
-   provider
-   providerCallId (unique where present)
-   status
-   startedAt
-   answeredAt
-   endedAt
-   durationSeconds
-   errorCode
-   errorMessage
-   createdAt
-   updatedAt

### 10.5 Feedbacks

Stores the final or partial feedback result.

Key fields:

-   feedbackProcessId
-   callAttemptId
-   overallRating
-   serviceRating
-   productSatisfaction
-   pricingSatisfaction
-   feedbackText
-   transcriptReference
-   sentiment
-   summary
-   complaintCategory
-   suggestion
-   requiresFollowUp
-   collectedAt
-   reviewedBy
-   reviewedAt

### 10.6 Complaints

Key fields:

-   purchaseId
-   feedbackProcessId
-   feedbackId
-   category
-   priority
-   description
-   status
-   assignedTo
-   resolutionNotes
-   resolvedAt
-   createdAt
-   updatedAt

### 10.7 WebhookEvents

Stores processed incoming events for idempotency and troubleshooting.

Key fields:

-   source
-   externalEventId
-   eventType
-   receivedAt
-   processedAt
-   processingStatus
-   errorDetails

### 10.8 AuditLogs

Tracks important administrative actions.

Key fields:

-   actorUserId
-   action
-   resourceType
-   resourceId
-   before
-   after
-   createdAt

Avoid storing full payment data or unnecessary sensitive personal
information.

------------------------------------------------------------------------

## 11. Recommended API Structure

Base path: `/api/v1`

### Authentication

-   `POST /auth/login`
-   `POST /auth/logout`
-   `GET /auth/me`
-   `PATCH /auth/profile`
-   `PATCH /auth/change-password`

### Billing integration

-   `POST /integrations/purchases`
-   `GET /integrations/health`

### Dashboard

-   `GET /dashboard/overview`
-   `GET /dashboard/call-statistics`
-   `GET /dashboard/feedback-statistics`
-   `GET /dashboard/recent-activity`

### Purchases

-   `GET /purchases`
-   `GET /purchases/:id`
-   `GET /purchases/:id/feedback-process`

### Feedback processes / calling

-   `GET /feedback-processes`
-   `GET /feedback-processes/:id`
-   `POST /feedback-processes/:id/cancel`
-   `POST /feedback-processes/:id/reschedule`
-   `POST /feedback-processes/:id/do-not-call`

### Call attempts

-   `GET /feedback-processes/:id/attempts`
-   `GET /call-attempts/:id`

### Provider webhooks

-   `POST /webhooks/voice-provider/events`

### Feedback

-   `GET /feedback`
-   `GET /feedback/:id`
-   `PATCH /feedback/:id/review`

### Complaints

-   `GET /complaints`
-   `GET /complaints/:id`
-   `PATCH /complaints/:id`
-   `POST /complaints/:id/resolve`

### Reports

-   `GET /reports/summary`
-   `GET /reports/calls`
-   `GET /reports/feedback`
-   `GET /reports/complaints`
-   `GET /reports/export`

All list APIs should support pagination, sorting, and validated filters.

------------------------------------------------------------------------

## 12. Frontend Application Structure

Recommended admin sidebar:

1.  Dashboard
2.  Purchases
3.  AI Calling Management
4.  Customer Feedback
5.  Complaints
6.  Reports & Analytics
7.  Settings

Recommended frontend structure:

``` text
Frontend/
└── src/
    ├── api/
    │   └── api.js
    ├── assets/
    ├── components/
    │   ├── common/
    │   ├── dashboard/
    │   ├── tables/
    │   └── feedback/
    ├── layouts/
    │   └── DashboardLayout.jsx
    ├── pages/
    │   ├── Login/
    │   ├── Dashboard/
    │   ├── Purchases/
    │   ├── CallingManagement/
    │   ├── Feedback/
    │   ├── Complaints/
    │   ├── Reports/
    │   └── Settings/
    ├── hooks/
    ├── context/
    ├── utils/
    └── App.jsx
```

### UI guidelines

-   Professional jewellery-business admin experience.
-   Clear typography and consistent spacing.
-   Responsive desktop, tablet, and mobile layouts.
-   Consistent status badges.
-   Search, filters, pagination, and empty states.
-   Loading, success, and error states.
-   Accessible forms and tables.
-   Confirmation before cancelling or rescheduling calls.
-   Customer details and feedback presented without exposing unnecessary
    sensitive data.

------------------------------------------------------------------------

## 13. Backend Application Structure

``` text
Backend/
├── config/
├── controllers/
├── models/
├── routes/
├── middleware/
├── validators/
├── services/
│   ├── billing/
│   ├── calling/
│   ├── ai/
│   ├── feedback/
│   └── reports/
├── providers/
│   └── voice/
├── queues/
├── workers/
├── webhooks/
├── jobs/
├── utils/
├── tests/
└── server.js
```

### Backend engineering standards

-   Keep controllers thin.
-   Put business rules in services.
-   Validate all incoming requests.
-   Use centralized error handling.
-   Use environment variables for secrets.
-   Use structured logs with request and correlation IDs.
-   Use database indexes for frequently queried fields.
-   Use transactions where multiple database writes must succeed
    together.
-   Use UTC for stored timestamps.
-   Implement pagination for listing endpoints.
-   Never trust frontend-supplied role, status, price, or provider event
    data.
-   Keep provider integrations isolated behind adapters.
-   Add automated tests for business-critical logic.

------------------------------------------------------------------------

## 14. Technology Stack

  -----------------------------------------------------------------------
  Layer                               Recommended technology
  ----------------------------------- -----------------------------------
  Frontend                            React + Vite

  UI styling                          CSS or Tailwind CSS

  Routing                             React Router

  Backend                             Node.js + Express

  Database                            MongoDB

  ODM                                 Mongoose

  Authentication                      JWT with secure cookie/token
                                      handling

  Queue                               BullMQ

  Queue storage                       Redis

  AI calling                          Retell AI or Vapi proof of concept

  Telephony                           Provider with approved Indian
                                      outbound calling support

  Charts                              Recharts

  Icons                               Lucide React

  Validation                          Zod or Joi

  Logging                             Pino or Winston

  Testing                             Vitest/Jest + Supertest

  Deployment                          Linux VPS, Nginx, PM2 or process
                                      manager

  Monitoring                          Application logs, queue monitoring,
                                      uptime and error alerts
  -----------------------------------------------------------------------

Provider selection and pricing must be confirmed before committing to
production architecture.

------------------------------------------------------------------------

## 15. Security, Privacy, and Compliance

Because this application initiates customer calls and may store voice
recordings and transcripts, privacy and telecom compliance are core
requirements.

Implement:

-   Explicit, appropriately recorded customer consent for feedback
    calls.
-   Clear disclosure that the caller is an AI assistant.
-   Do-not-call and opt-out handling.
-   Permitted calling hours based on applicable rules and provider
    requirements.
-   Applicable TRAI and commercial communication requirements for India.
-   Approved telecom/provider routes and calling registrations where
    required.
-   Recording consent and disclosure where recording is enabled.
-   Webhook signature verification.
-   API authentication and rate limiting.
-   Secure password hashing.
-   Least-privilege access control.
-   Encryption in transit and appropriate protection at rest.
-   Data retention and deletion policies.
-   Restricted access to recordings and transcripts.
-   Audit logs for sensitive admin actions.
-   Secret rotation and secure environment configuration.

Obtain legal/compliance review before production outbound calling. Do
not assume that a post-purchase feedback call is automatically exempt
from commercial communication rules.

------------------------------------------------------------------------

## 16. Non-Functional Requirements

### Reliability

-   Duplicate purchase requests must be safe to retry.
-   Duplicate provider events must not corrupt records.
-   A worker restart must not silently lose scheduled business
    processes.
-   Stuck jobs must be detectable and recoverable.
-   Provider failures must be visible to administrators.

### Performance

-   Paginate all large tables.
-   Index purchase ID, invoice number, phone number, scheduled time,
    statuses, and provider call ID as appropriate.
-   Use database aggregation for dashboard metrics.
-   Avoid loading transcripts and recordings in list APIs.

### Scalability

-   Run queue workers independently from the API server.
-   Support configurable worker concurrency.
-   Keep voice provider integration replaceable.
-   Scope data by business and branch before adding multi-tenant
    support.

### Observability

Track:

-   Incoming billing webhook success/failure.
-   Number of scheduled jobs.
-   Queue waiting and failed jobs.
-   Calls initiated and completed.
-   Provider errors.
-   Webhook processing delays.
-   Feedback extraction failures.
-   Average call cost and duration, where available.

------------------------------------------------------------------------

## 17. Development Roadmap

### Phase 1 --- Project Foundation

-   Create separate frontend and backend projects.
-   Configure MongoDB and environment variables.
-   Set up Express middleware and error handling.
-   Implement admin authentication.
-   Create initial database models.
-   Build dashboard layout and navigation.
-   Configure frontend API client.

**Deliverable:** Admin can log in and access the application shell.

### Phase 2 --- Billing Integration and Purchases

-   Define billing webhook contract.
-   Implement secure purchase API.
-   Add validation and phone normalization.
-   Implement idempotency.
-   Save purchase records.
-   Create one feedback process per eligible purchase.
-   Build purchase listing and detail pages.
-   Test repeated billing webhook requests.

**Deliverable:** A bill generated in the billing system appears once in
the AI system.

### Phase 3 --- Scheduling and Calling Management

-   Install and configure Redis.
-   Configure BullMQ.
-   Create scheduling service.
-   Implement 15-minute delay.
-   Build worker process.
-   Implement atomic job claiming.
-   Add call eligibility checks.
-   Add call attempt records.
-   Implement retry and cancellation rules.
-   Build calling management page.

**Deliverable:** Eligible purchases appear as scheduled calls and are
processed reliably by the worker.

### Phase 4 --- AI Voice Provider Integration

-   Compare providers using approved test numbers.
-   Select provider based on Indian calling, language, compliance, cost,
    and reliability.
-   Configure AI agent prompt.
-   Implement provider adapter.
-   Initiate outbound test calls.
-   Receive and verify provider webhooks.
-   Map provider events to internal call statuses.
-   Test no-answer, busy, failure, interruption, and opt-out scenarios.

**Deliverable:** The AI agent can conduct a real, approved test feedback
call and update the application.

### Phase 5 --- Feedback and Complaint Management

-   Define structured feedback schema.
-   Extract rating and feedback from the conversation.
-   Store transcript/recording references according to retention policy.
-   Generate AI summary and sentiment.
-   Create complaint flags where appropriate.
-   Build feedback detail page.
-   Build complaint management page.

**Deliverable:** Admin can review customer feedback and identify
complaints requiring attention.

### Phase 6 --- Dashboard and Reports

-   Implement dashboard aggregation APIs.
-   Build KPI cards and charts.
-   Add recent activity and attention-required sections.
-   Add report filters.
-   Implement CSV/Excel and PDF export.
-   Validate report calculations against database records.

**Deliverable:** Admin can monitor calling operations and customer
satisfaction.

### Phase 7 --- Production Readiness

-   Complete security review.
-   Complete telecom and privacy compliance review.
-   Test queue recovery and webhook replay.
-   Test duplicate and concurrency scenarios.
-   Configure logs and monitoring.
-   Configure backups and retention.
-   Deploy frontend, backend, Redis, and worker.
-   Perform end-to-end acceptance testing.

**Deliverable:** Production-ready system with monitoring and operational
procedures.

------------------------------------------------------------------------

## 18. Testing Strategy and Acceptance Criteria

### Billing integration tests

-   Valid purchase is accepted.
-   Missing required fields are rejected.
-   Invalid phone number is handled safely.
-   Repeated purchase webhook does not create duplicate records.
-   Invalid webhook authentication is rejected.
-   Ineligible/consent-missing purchase is not called.

### Scheduling tests

-   Eligible purchase is scheduled for 15 minutes after purchase.
-   Worker does not call before scheduled time.
-   Cancelled process is not called.
-   Opted-out customer is not called.
-   Duplicate jobs cannot initiate duplicate calls.
-   Worker restart does not lose the process.
-   Calling-hour restrictions are enforced.

### AI calling tests

-   Successful answered call.
-   No-answer outcome.
-   Busy outcome.
-   Provider technical failure.
-   Customer refuses feedback.
-   Customer asks not to be called again.
-   Customer gives a rating but no written/verbal comment.
-   Customer reports a complaint.
-   Customer speaks supported languages.
-   Webhook is delivered more than once.

### Dashboard and report tests

-   Call status matches backend state.
-   Feedback status is independent of call status.
-   Ratings are displayed correctly.
-   Average rating uses only valid ratings.
-   Date filters use the correct timezone.
-   Exported report matches filtered data.
-   Admin cannot access unauthorized resources.

### Release acceptance criteria

The first release is ready only when:

1.  A valid eligible purchase creates exactly one feedback process.
2.  The call is scheduled for the configured delay.
3.  Duplicate webhook requests do not create duplicate calls.
4.  The worker checks consent and eligibility before calling.
5.  Call attempts and provider events are stored reliably.
6.  Feedback is stored separately from call status.
7.  The dashboard displays accurate call and feedback information.
8.  Opt-out prevents further automated calls.
9.  Retry limits are enforced.
10. Reports match the underlying stored records.

------------------------------------------------------------------------

## 19. Important Product Decisions to Finalize

These decisions should be confirmed before implementation:

  -----------------------------------------------------------------------
  Decision                            Proposed default
  ----------------------------------- -----------------------------------
  Billing integration                 Existing billing software via
                                      secure webhook

  Initial call delay                  15 minutes

  Initial language                    Malayalam and English, subject to
                                      provider testing

  Voice provider                      Evaluate Retell AI and Vapi;
                                      evaluate Indian telephony
                                      separately

  Initial deployment                  One jewellery business/branch

  Maximum attempts                    2 total, configurable

  No-answer retry                     30 minutes later, subject to
                                      calling hours

  Feedback scale                      1 to 5

  Recording                           Disabled until consent, compliance,
                                      and retention are approved

  Admin role                          Single admin role for MVP

  Reports                             Dashboard + CSV/Excel + PDF
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 20. Future Enhancements

After the first production release:

-   Multi-branch management.
-   Multi-business SaaS architecture.
-   Branch-wise and employee-wise analytics.
-   More Indian languages.
-   WhatsApp/SMS feedback fallback with appropriate consent.
-   Human support assignment.
-   Complaint resolution SLA tracking.
-   Advanced AI topic and trend analysis.
-   Customer satisfaction benchmarking.
-   Call cost and provider comparison reports.
-   Configurable feedback templates.
-   CRM integrations.
-   Scheduled management reports.

------------------------------------------------------------------------

## 21. Final Architecture Recommendation

Build the application as an independent MERN-based feedback platform
integrated with the existing billing software.

Use MongoDB as the source of truth, BullMQ and Redis for delayed
background jobs, a dedicated worker for call execution, and a
replaceable voice-provider adapter for AI calling.

Keep these concepts separate in the data model:

-   Purchase status.
-   Feedback process status.
-   Individual call attempt status.
-   Feedback collection status.
-   Complaint resolution status.

This separation is essential for accurate reporting and reliable
business logic.

**Recommended implementation order:** Foundation → Billing webhook →
Purchase management → Queue and scheduling → Calling provider → Feedback
extraction → Admin dashboard → Reports → Production hardening.

The most important engineering priorities are duplicate prevention,
consent and opt-out enforcement, reliable job execution, provider
webhook verification, and accurate feedback reporting.
