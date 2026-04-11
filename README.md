# CleverBooks — Courier Settlement Reconciliation & Alert Engine

A MERN-stack system that ingests courier settlement data, detects discrepancies against order records, and notifies merchants via a decoupled queue-based worker.

---

## Tech Stack

- **Backend**: Node.js, Express, MongoDB, BullMQ, Redis, node-cron
- **Frontend**: React (Vite), React Router
- **Queue**: BullMQ + Redis (decoupled reconciler and notification worker)
- **Notifications**: webhook.site
- **Containerization**: Docker + docker-compose

---

## How to Run

1. Clone the repo and go into the folder
2. Run: docker-compose up --build
3. Open: http://localhost:5173
4. In a new terminal run: docker exec -it cleverbooks-backend node seed/seed.js
5. Go to Dashboard and click Trigger Reconciliation
6. Check notifications at: https://webhook.site/d9354aa7-034b-4c26-bcfe-86057b576738

---

## How to Test Without Docker

Backend:
cd backend
npm install
node seed/seed.js
npm run dev

Frontend:
cd frontend
npm install
npm run dev

Make sure MongoDB and Redis are running locally on default ports.

---

## Discrepancy Detection Rules

1. COD Short-remittance — Settled amount less than expected COD minus tolerance
2. Weight Dispute — Charged weight more than 10% over declared weight
3. Phantom RTO Charge — RTO fee charged but order status is DELIVERED
4. Overdue Remittance — Delivered 14+ days ago but no settlement date exists
5. Duplicate Settlement — Same AWB appears in more than one settlement batch

---

## Architecture

React UI → Express API → MongoDB
                ↓
     Reconciliation Job (node-cron, 2AM IST)
                ↓
         BullMQ Queue (Redis)
                ↓
     Notification Worker → webhook.site

The reconciler and notification worker are fully decoupled. The reconciler only publishes events to the queue. The worker consumes them independently with retry and exponential backoff.

---

## Design Decisions

Why BullMQ over a simple event emitter?
BullMQ persists jobs in Redis, meaning if the worker crashes mid-flight, jobs are not lost. It also provides built-in retry with exponential backoff, dead-letter queue via failed job state, and full visibility into queue state.

Why node-cron with TZ=Asia/Kolkata?
Setting TZ at the container level ensures all date operations including cron are IST-aware, avoiding UTC offset bugs.

Idempotency on batch upload:
Each batch has a unique batchId. On upload, the system checks if that batchId already exists and rejects re-uploads with HTTP 409 to prevent double-processing.

---

## Seed Data

The seed script generates:
- 50 mock orders (30 DELIVERED, 10 RTO, 10 IN_TRANSIT)
- 1 settlement batch with intentional discrepancies:
  - 5x COD Short-remittance
  - 4x Weight Dispute
  - 3x Phantom RTO Charge
  - 5x Overdue Remittance
  - 1x Duplicate Settlement

---

## Assumptions

- Tolerance for COD short-remittance is the lower of 2% of COD amount or Rs 10
- Overdue remittance threshold is 14 days from delivery date
- Weight dispute threshold is 10% over declared weight
- All times are IST (Asia/Kolkata)
- Partial batch failures are logged per-record and the job continues processing

---

## What I Would Improve With More Time

- Cursor-based pagination on settlements table for large datasets
- Idempotency key on external webhook API calls to prevent duplicate notifications
- Real email notifications via SendGrid
- Courier-level breakdown chart showing which courier has the most disputes
- JWT authentication to protect the dashboard
- Unit tests for each discrepancy detection rule

---

## Loom Walkthrough

https://www.loom.com/share/24d27494bee14252ad62d7f1138243dd

---

## Submission

Built by Priyanshu Dash for CleverBooks Founding Engineer Assignment.