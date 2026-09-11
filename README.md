# Persistent Email Scheduler

## Overview

Persistent Email Scheduler is a full-stack SaaS-style email automation application built for the Outbox Labs internship assignment. It allows authenticated users to schedule emails for future delivery, track them across statuses, and operate in a resilient architecture using PostgreSQL, Redis, BullMQ, and a separate worker process.

The system persists scheduled emails durably in PostgreSQL while using Redis and BullMQ for queue-backed delayed delivery. A dedicated worker handles email transmission with Nodemailer and Ethereal Email, allowing reliable scheduling even when the API server restarts.

## Features

- User registration and login with JWT authentication
- Secure password hashing with bcryptjs
- PostgreSQL-backed persistence for all email records
- Redis + BullMQ delayed job scheduling
- Dedicated worker process for sending emails
- Startup reconciliation to restore lost delayed jobs
- Concurrency and rate limiting for processing
- Retry and backoff for failed jobs
- Swagger UI for API documentation
- Dashboard with stats and filters
- Frontend for login, register, schedule, and email management
- Docker Compose setup for database and Redis infrastructure
- Graceful shutdown and health checks

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router, Axios
- Backend: Node.js, Express.js, TypeScript
- Database: PostgreSQL, Prisma ORM
- Queue: Redis, BullMQ
- Mail: Nodemailer, Ethereal Email
- Auth: JWT, bcryptjs
- Validation: Zod
- Docs: Swagger/OpenAPI
- Infra: Docker, Docker Compose

## Architecture

The project is implemented as a monorepo with a backend API and a frontend dashboard sharing a single workspace. The backend is responsible for authentication, persistence, queue orchestration, and worker coordination. The frontend communicates with the API using JWT-based auth and displays the scheduling lifecycle.

## Architecture Diagram

```mermaid
flowchart LR
A[React Frontend] --> B[Express API]
B --> C[(PostgreSQL)]
B --> D[BullMQ Queue]
D --> E[(Redis)]
E --> F[BullMQ Worker]
F --> C
F --> G[Nodemailer]
G --> H[Ethereal SMTP]
```

## Repository Structure

```text
email_scheduler/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── worker.ts
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── queues/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   └── validators/
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── docker-compose.yml
├── README.md
├── .gitignore
└── package.json
```

## How Email Scheduling Works

1. User logs in and calls the scheduling API.
2. The backend validates the request with Zod.
3. A `ScheduledEmail` record is created in PostgreSQL with `status = SCHEDULED`.
4. The backend calculates the delay using the target time minus current time.
5. A BullMQ delayed job is created using the email ID as the payload.
6. The job ID is saved back to the database for tracking.
7. A separate worker consumes the job and re-fetches the latest record from PostgreSQL.
8. The worker updates the status to `PROCESSING`, sends the email via Nodemailer, and marks `SENT` or `FAILED`.

## BullMQ + Redis Design

Redis is used as the queue backend for delayed jobs and rate-limiting primitives. BullMQ creates a dedicated queue named `email-scheduler`. Jobs are stored in Redis and processed asynchronously. PostgreSQL remains the durable source of truth, while Redis handles execution scheduling and state transitions for queue operations.

## Persistence on Restart

Persistence across backend restarts is a mandatory requirement. The system ensures scheduled emails remain safe even if the Express application restarts.

- Scheduled email data lives in PostgreSQL.
- Delayed job metadata is stored in Redis.
- On startup, the API checks records where `status = SCHEDULED`.
- For each scheduled email, it verifies whether its job still exists in Redis.
- Missing jobs are recreated automatically with the remaining delay.
- If the scheduled time has already passed, the job is queued immediately.

This gives the app robust recovery without losing future email sends.

## Startup Reconciliation

Startup reconciliation is implemented in the backend boot sequence. It runs after the database connection is active and before the API begins full request handling. This ensures jobs are restored and the queue state matches PostgreSQL.

## Worker Concurrency

The worker supports a configurable concurrency value via `WORKER_CONCURRENCY`.

- Concurrency determines how many jobs the worker can process at the same time.
- It is different from rate limiting.
- Rate limiting constrains how many emails can be sent in a time window, while concurrency defines processing parallelism.

## Rate Limiting

The worker implements a Redis-backed email delivery rate limiter using configuration values:

- `EMAIL_RATE_LIMIT_MAX=5`
- `EMAIL_RATE_LIMIT_DURATION=1000`

This means no more than 5 emails are sent per 1000 ms window.

## Retry Strategy

BullMQ jobs are configured with retries and exponential backoff. If a send attempt fails, the worker retries according to the configured pattern. After all retries are exhausted, the email is stored with `status = FAILED` and a meaningful `failureReason`.

## Database Schema

The application uses Prisma with the following core models:

- `User`: `id`, `name`, `email`, `passwordHash`, `createdAt`, `updatedAt`
- `ScheduledEmail`: `id`, `userId`, `recipient`, `subject`, `body`, `scheduledAt`, `status`, `jobId`, `sentAt`, `failureReason`, `createdAt`, `updatedAt`

Status enum:

- `SCHEDULED`
- `PROCESSING`
- `SENT`
- `FAILED`
- `CANCELLED`

## API Endpoints

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Email management

- `POST /api/emails`
- `GET /api/emails`
- `GET /api/emails/scheduled`
- `GET /api/emails/sent`
- `GET /api/emails/failed`
- `GET /api/emails/:id`
- `DELETE /api/emails/:id`

### Dashboard

- `GET /api/dashboard/stats`

### Health

- `GET /health`

### Documentation

- `GET /api/docs`

## Backend Setup

1. Copy `backend/.env.example` to `backend/.env`.
2. Update the database and Redis variables.
3. Install dependencies with `npm install` at the repo root.
4. Start PostgreSQL and Redis with `docker compose up -d`.
5. Run Prisma migrations: `npm --workspace backend run prisma:migrate`.
6. Start the backend server: `npm run dev:backend`
7. Start the worker: `npm run dev:worker`

## Frontend Setup

1. Copy `frontend/.env.example` to `frontend/.env`.
2. Install frontend dependencies from the root workspace.
3. Run the frontend: `npm run dev:frontend`
4. Access the app at `http://localhost:5173`

## PostgreSQL Setup

The app expects PostgreSQL on `localhost:5432` by default when running outside Docker. Docker Compose provisions the instance automatically with the following credentials:

- username: `postgres`
- password: `postgres`
- database: `email_scheduler`

## Redis Setup

Redis is started with Docker Compose and is expected at `localhost:6379`.

## BullMQ Worker Setup

The worker is run as a separate long-lived Node process. It subscribes to the Redis queue and processes jobs independently from the HTTP server. This separation helps maintain reliability and makes the architecture closer to production.

## Ethereal Email Setup

Use Ethereal Email only for testing. Create an account at Ethereal and copy the SMTP credentials into the backend `.env` file. The worker logs the preview URL returned by `nodemailer.getTestMessageUrl(info)` after delivery.

## Environment Variables

### Backend

```env
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/email_scheduler"
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
JWT_SECRET=change_this_secret
JWT_EXPIRES_IN=7d
ETHEREAL_HOST=smtp.ethereal.email
ETHEREAL_PORT=587
ETHEREAL_USER=
ETHEREAL_PASS=
WORKER_CONCURRENCY=3
EMAIL_RATE_LIMIT_MAX=5
EMAIL_RATE_LIMIT_DURATION=1000
FRONTEND_URL=http://localhost:5173
```

### Frontend

```env
VITE_API_URL=http://localhost:5000/api
```

## Docker Setup

To launch infrastructure locally:

```bash
docker compose up -d
```

This starts PostgreSQL and Redis with persistent Docker volumes.

## Running the Application

```bash
npm install
npm run docker:up
npm --workspace backend run prisma:migrate
npm run dev:backend
npm run dev:worker
npm run dev:frontend
```

## Demo Credentials

A demo account can be created in the register page. Sample values:

- Name: Demo User
- Email: demo@example.com
- Password: password123

## Swagger Documentation

After the backend is running, visit:

- `http://localhost:5000/api/docs`

The Swagger UI documents the authentication, scheduling, list, cancellation, and stats endpoints.

## Deployment

This project is prepared for deployment using a conventional three-part setup:

- **Frontend**: Vercel (monorepo root or `frontend` workspace)
- **Backend**: Render / Railway / any Node host
- **Database**: Neon / PostgreSQL
- **Redis**: Upstash / Redis Cloud

### Vercel Deployment Instructions

1. Import your GitHub repository into Vercel.
2. The root [`vercel.json`](file:///c:/Users/well/Documents/email_scheduler/vercel.json) and [`frontend/vercel.json`](file:///c:/Users/well/Documents/email_scheduler/frontend/vercel.json) are pre-configured to automatically build Vite output and route client-side paths (`/scheduled`, `/sent`, `/failed`, etc.) without `404 NOT_FOUND` errors.
3. In Vercel Project Settings -> Environment Variables, add:
   - `VITE_API_URL`: Your backend API URL (e.g. `https://email-scheduler-api.onrender.com/api`)

The BullMQ worker must run as a separate long-lived service (via Render / Railway / Docker). It should not be deployed as a serverless-only function.

## Assignment Requirement Mapping

### Backend

- [x] Email scheduling
- [x] Express backend
- [x] Redis
- [x] BullMQ delayed jobs
- [x] Separate BullMQ worker
- [x] PostgreSQL persistence
- [x] Persistence across server restart
- [x] Startup reconciliation
- [x] Rate limiting
- [x] Worker concurrency
- [x] Retry/backoff
- [x] Ethereal Email

### Frontend

- [x] Login
- [x] Registration
- [x] Dashboard
- [x] Compose page
- [x] Scheduled emails table
- [x] Sent emails table
- [x] Failed emails display
- [x] Dashboard statistics
- [x] Responsive UI

## Assumptions

- PostgreSQL is the durable source of truth.
- Redis/BullMQ is used for execution scheduling and queue state.
- Docker volumes keep Redis and Postgres data locally persisted.
- Startup reconciliation recreates missing delayed jobs.
- `SENT` emails are not sent again.
- Ethereal is only for testing and previewing.
- The worker is kept separate from Express.
- Rate limiting applies globally to worker delivery.
- UTC is used internally; frontend may convert to local time.

## Trade-offs

- Redis is intentionally used only for queue scheduling and not as the durable data store.
- API workers are intentionally separated to increase reliability and align with production systems.
- Ethereal is chosen because it does not require real email credentials for development.

## Known Limitations

- Ethereal preview links are meant for testing and are not production email delivery.
- Real-world deployments will require proper SMTP or transactional email infrastructure.
- The app is designed for a single-tenant assignment environment rather than very large-scale high-volume sending.

## Future Improvements

- Add scheduled email editing and rescheduling UI.
- Add per-user rate limiting and audit logs.
- Add email provider abstraction for SendGrid or AWS SES.
- Add observability, metrics, and Sentry tracing.
- Add queue dashboards and dead-letter handling.

## Disclaimer

This repository is prepared for educational and assignment use. It demonstrates a production-style architecture while keeping the setup practical for local testing.
