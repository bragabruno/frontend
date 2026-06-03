# Fraud Prevention System — Frontend

Angular 19 Analyst Dashboard for the Fraud Prevention Platform.

## Architecture

```
SPA (Angular 19) → REST API (Spring Boot) → SSE (Real-time)
        ↓                    ↓
   MSW Mocks            PostgreSQL
```

- **Angular 19** — Standalone components, Signals for state, RxJS for async
- **Angular Material** — Data-dense dashboard UI with custom theming
- **MSW (Mock Service Worker)** — Independent frontend development
- **SSE (Server-Sent Events)** — Real-time case queue updates

## Quickstart

```bash
# Install dependencies
npm install

# Start development server (with MSW mocks)
npm start

# Open http://localhost:4200
# Login: admin / password
```

No backend required — MSW intercepts all API calls.

## Secrets Management (Doppler)

All secrets are managed via [Doppler](https://www.doppler.com/) — never commit `.env` files with real credentials.

```bash
# 1. Install Doppler CLI
brew install dopplerhq/tap/doppler

# 2. Login
doppler login

# 3. Setup project (from repo root)
doppler setup --project fraud-prevention --config dev_main

# 4. Run with secrets injected
make start          # or: doppler run -- ng serve
```

For Docker Compose (from repo root):
```bash
doppler run -- docker compose up -d
```

## Scripts

| Command | Description |
|---|---|
| `npm start` | Dev server with MSW mocks |
| `npm run build` | Production build |
| `npm run lint` | ESLint + Prettier check |
| `npm run format` | Auto-format code |
| `npm run test` | Unit tests (Karma) |
| `npx playwright test` | E2E tests |

## Project Structure

```
src/
├── app/
│   ├── core/              # Auth, interceptors, SSE
│   │   ├── auth/          # AuthService, guards, interceptor
│   │   └── sse/           # SSE service + mock
│   ├── features/          # Lazy-loaded feature areas
│   │   ├── cases/         # Case queue + detail
│   │   ├── admin/         # Users, rules, models, audit
│   │   └── auth/          # Login page
│   └── shared/            # Layout, models, pipes, utils
├── mocks/                 # MSW handlers + mock data
├── styles/                # SCSS tokens, mixins, utilities
└── environments/          # Environment configs
```

## Features

- **Case Queue** — Real-time SSE-powered case list with severity badges, SLA countdown
- **Case Detail** — Transaction info, risk score breakdown, notes, labels
- **Admin Panel** — User management, rule configuration, model versions, audit trail
- **Auth** — JWT authentication with role-based access (5 roles)
- **Responsive** — Desktop, tablet, mobile layouts

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 19.2 |
| UI | Angular Material 19.2 |
| State | Signals + RxJS |
| Mock | MSW 2.x |
| Lint | ESLint + Prettier |
| E2E | Playwright |
| CI | GitHub Actions |

## Roles

| Role | Access |
|---|---|
| ADMIN | Full access (cases, admin, audit) |
| FRAUD_ANALYST | Cases queue + detail |
| INVESTIGATOR | Cases queue + detail + escalate |
| AUDITOR | Read-only cases + audit trail |
| SYSTEM_ACCOUNT | Backend only (no UI) |

## Backend API

The frontend connects to a Spring Boot API at `http://localhost:8080/api`. See `docs/TICKETS.md` for the full API contract.

Proxy config routes `/api` to the backend during development.

## License

BragDev LLC
