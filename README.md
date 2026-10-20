# Office Hours Kiosk (oh-kiosk)

A modern queue management system for office hours, designed for both students and teaching assistants (TAs). Built with a monorepo architecture using pnpm workspaces.

## Architecture

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Package Manager**: pnpm workspaces
- **Data Storage**: In-memory (easily switchable to PostgreSQL)

## Quick Start

### Prerequisites

- Node.js 22 (verified by CI)
- pnpm (install with `npm install -g pnpm`)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/owanden/OH-Queue.git
cd OH-Queue
```

2. Install dependencies:
```bash
pnpm install
```

3. Copy `backend/env.example` to `backend/.env` and configure authentication:

| Variable | Required value |
|---|---|
| `ADMIN_USER` | Administrator login name |
| `ADMIN_PASS` | Administrator password |
| `JWT_SECRET` | Cryptographically random signing secret, at least 32 bytes |

The backend refuses to start if authentication configuration is missing or the signing secret is too short. Keep credentials outside Git. Restarting with a new signing secret invalidates existing tokens. Run the backend from its workspace directory so dotenv reads `backend/.env`.

Leave Twilio variables blank for local work without notifications. Notification configuration is optional; provider-backed messaging requires separate credentials and may incur provider charges. No real provider is used by the tests.

### Development

Start both frontend and backend in development mode:
```bash
pnpm dev
```

This will start:
- Backend server on http://localhost:3001
- Frontend development server on http://localhost:3000

### Production

Build and start the application:
```bash
pnpm build
pnpm start
```

## Features

### For Students
- **Join Queue**: Enter phone number and optional topic
- **Anonymous Display**: Get a fun display name (e.g., "Blue Llama")
- **SMS Notifications**: Optional text alerts when it's your turn
- **Queue Position**: See your position in real-time
- **Response Fields**: Student responses include display information and omit the internal phone number and hash fields.

### For TAs
- **TA Management**: Add/remove yourself from active TA list
- **Queue Control**: Serve next student, mark as done, or drop no-shows
- **Real-time Updates**: Live queue display with student information
- **Student Management**: View topics and SMS consent status

### Core Behavior
- **Single Kiosk Screen**: Used by both students and TAs
- **Queue Storage**: Records are in memory and do not survive a backend restart.
- **Real-time Updates**: Queue updates every 2 seconds
- **Responsive Design**: Works on desktop and mobile devices


---

## Authentication and checks

Login at `POST /api/login` returns a six-hour HS256 token. Bearer authentication is required for room creation, TA addition/removal, serving/dropping queue entries, and the development-only clear route. Public reads and joining the queue remain available without a token. The former `/api/test-whatsapp` route is removed.

```sh
pnpm --filter oh-kiosk-backend test
```

The command compiles the backend and runs loopback HTTP tests with a fake notification function. It checks missing configuration at startup, credentials, valid/invalid/expired tokens, protected mutations, unchanged state/no notifications after denied requests, authenticated operations, and absence of the removed route. CI repeats installation from the frozen lockfile, these backend checks, and the frontend production build on Node.js 22. Successful runs retain the static frontend output as the `oh-queue-frontend` artifact.

This is a shared administrator model, without per-room authorization, rate limiting, or persistent storage. Phone recipients remain in process memory for notifications; free-text topics are not scrubbed. These boundaries do not establish production readiness.

## Queue response boundaries

Join, queue-list, next-student, room-queue, and serve responses use explicit display fields: `id`, `displayName`, optional `topic`, `consentToSMS`, and `addedAt`. They omit `phoneNumber` and `phoneHash`. Internal recipient records remain available to the notification sender. Routine notification success/failure logs omit recipient values, message bodies, and raw provider errors.

Duplicate joins for the exact same phone string return 409, including concurrent requests during hashing. Admission reservations are released on hash failure, and a number may rejoin after its entry is removed. This is a single-process in-memory guarantee, without phone-format normalization, persistence, cross-instance coordination, or rate limiting. Numbers written into free-text fields are not automatically redacted.

Tests use synthetic numbers, real loopback HTTP requests, concurrent submissions, injected hash failures, and a fake message client. No real provider is initialized or called by these checks.

Verify both production builds from the workspace root with `pnpm build`. The frontend build runs TypeScript checks before Vite bundling; the backend build compiles TypeScript. These build artifacts are not a hosted deployment or an end-to-end UI validation.
