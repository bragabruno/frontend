# Frontend — Angular 19 Analyst Dashboard Backlog

**Repo:** `frontend` (new polyrepo: `github.com/bragabruno/frontend.git`)
**Framework:** Angular 19 · Standalone Components · Angular Material · Signals + RxJS
**Language:** TypeScript 5.6+ · SCSS
**Owner:** BragDev LLC

> This backlog continues the platform tickets in `../../docs/TICKETS.md` (FRAUD-001–161),
> the ML tickets in `../../ml-service/docs/TICKETS.md` (FRAUD-162–207), and the backend
> tickets in `../../backend/docs/TICKETS.md` (FRAUD-208–236). Frontend tickets start at
> **FRAUD-237** to avoid id collisions in the same Linear workspace.
>
> This file is **self-contained**: API contract, TypeScript interfaces, state machines, auth
> spec, and SSE contract are embedded below so an implementing agent does not need to read
> other repos. The backend is built by a separate LLM instance; this instance develops
> **frontend only** using **MSW (Mock Service Worker)** for development.

---

## Summary

| Epic | Title | Tickets | Primary skills |
|---|---|---|---|
| **EPIC-37** | Project Scaffold & Design System | FRAUD-237–240 | Angular 19, Signals, Material |
| **EPIC-38** | Auth & Navigation | FRAUD-241–243 | JWT, RBAC, guards |
| **EPIC-39** | Case Queue Dashboard (SSE) | FRAUD-244–247 | SSE, real-time, Signals |
| **EPIC-40** | Case Detail & Investigation | FRAUD-248–251 | Data display, forms |
| **EPIC-41** | Admin Panel | FRAUD-252–255 | Rule config, user mgmt |
| **EPIC-42** | Polish, E2E & CI | FRAUD-256–259 | Testing, accessibility, CI |

---

## Pre-existing Architecture

The backend (separate repo, separate LLM instance) provides a Spring Boot 3.5 API at
`http://localhost:8080/api`. This frontend connects to it, but develops independently
using MSW mock handlers so work can begin before the backend is ready.

**Key architectural decisions:**
- **Angular 19 Standalone Components** — no NgModules, lazy-routed feature areas
- **Angular Material** — data-dense dashboard UI with consistent theming
- **Signals** for synchronous state, **RxJS** for async (HTTP, SSE)
- **MSW (Mock Service Worker)** — each ticket implements the MSW handler first, then the real Angular service
- **SSE (Server-Sent Events)** — real-time case queue updates (not WebSocket)
- **5 roles**: ADMIN, FRAUD_ANALYST, INVESTIGATOR, AUDITOR, SYSTEM_ACCOUNT

---

## API Contract

All endpoints prefixed `/api`. Authentication via `Authorization: Bearer <JWT>`.

### Auth Endpoints

#### `POST /api/auth/login`
```typescript
interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;   // JWT, 15min TTL
  refreshToken: string;  // JWT, 24h TTL
  role: 'ADMIN' | 'FRAUD_ANALYST' | 'INVESTIGATOR' | 'AUDITOR' | 'SYSTEM_ACCOUNT';
  userId: string;
  username: string;
}

interface ErrorResponse {
  type: string;
  title: string;
  status: number;
  detail: string;
}
```

#### `POST /api/auth/refresh`
```typescript
interface RefreshRequest { refreshToken: string; }
interface RefreshResponse { accessToken: string; refreshToken: string; }
```

#### `POST /api/auth/logout`
```typescript
interface LogoutRequest { refreshToken: string; }
// Response: 204 No Content
```

### Transaction Endpoints

#### `GET /api/transactions/{id}`
(All roles except SYSTEM_ACCOUNT)

```typescript
interface TransactionDto {
  id: string;
  userId: string;
  merchantId: string;
  deviceId: string;
  amount: number;
  currency: string;
  ipAddress: string;
  country: string;
  status: TransactionStatus;
  idempotencyKey: string;
  createdAt: string;
  latestRiskScore: RiskScoreDto | null;
}
```

#### `GET /api/transactions?page=0&size=20&status=IN_REVIEW&userId=uuid`

```typescript
interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
```

### Case Management Endpoints

#### `GET /api/cases?page=0&size=20&status=OPEN&severity=HIGH&assigneeId=uuid`

```typescript
interface CaseSummaryDto {
  id: string;
  transactionId: string;
  riskScoreId: string | null;
  assigneeId: string | null;
  status: CaseStatus;
  severity: Severity;
  openedAt: string;
  slaDueAt: string | null;
  resolvedAt: string | null;
}
```

#### `GET /api/cases/{id}`

```typescript
interface CaseDetailDto {
  id: string;
  transactionId: string;
  riskScoreId: string | null;
  assigneeId: string | null;
  status: CaseStatus;
  severity: Severity;
  openedAt: string;
  slaDueAt: string | null;
  resolvedAt: string | null;
  transaction: TransactionDto;
  riskScore: RiskScoreDto;
  notes: NoteDto[];
  labels: LabelDto[];
}
```

#### `PUT /api/cases/{id}/assign`

```typescript
interface AssignRequest { assigneeId: string | null; }
```

#### `PUT /api/cases/{id}/status`

```typescript
interface StatusTransitionRequest {
  status: CaseStatus;
  note?: string;
}
```

#### `GET /api/cases/{id}/notes`

```typescript
interface NoteDto {
  id: string;
  caseId: string;
  authorId: string;
  content: string;
  createdAt: string;
}
```

#### `POST /api/cases/{id}/notes`

```typescript
interface CreateNoteRequest { content: string; }
```

#### `POST /api/cases/{id}/labels`

```typescript
interface CreateLabelRequest {
  label: 'FRAUD' | 'LEGITIMATE';
  confidence: number;
  reason: string;
}

interface LabelDto {
  id: string;
  transactionId: string;
  caseId: string;
  analystId: string;
  label: 'FRAUD' | 'LEGITIMATE';
  confidence: number;
  reason: string;
  labeledAt: string;
}
```

### SSE Stream

#### `GET /api/cases/stream` (Server-Sent Events)

```typescript
interface CaseSseEvent {
  eventType: 'case_created' | 'case_assigned' | 'case_updated' | 'case_resolved';
  caseId: string;
  transactionId: string;
  status: CaseStatus;
  severity: Severity;
  assigneeId: string | null;
  openedAt: string;
  timestamp: string;
}
```

### Risk Score Endpoint

#### `GET /api/risk-scores/{transactionId}`

```typescript
interface RiskScoreDto {
  id: string;
  transactionId: string;
  modelVersionId: string;
  mlScore: number;
  rulesScore: number;
  aggregateScore: number;
  decision: 'APPROVE' | 'REVIEW' | 'DECLINE';
  degradedMode: boolean;
  reasonCodes: string[];
  createdAt: string;
}
```

### Admin Endpoints

#### `GET /api/admin/users?page=0&size=20` (ADMIN only)

```typescript
interface UserDto {
  id: string;
  username: string;
  email: string;
  role: Role;
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
}
```

#### `POST /api/admin/users` (ADMIN only)

```typescript
interface CreateUserRequest { username: string; email: string; password: string; role: Role; }
```

#### `GET /api/admin/rules` (ADMIN only)

```typescript
interface RuleDto {
  id: string;
  name: string;
  type: 'VELOCITY' | 'DEVICE' | 'GEO' | 'MERCHANT' | 'AMOUNT';
  enabled: boolean;
  weight: number;
  threshold: number;
  description: string;
  updatedAt: string;
}
```

#### `PUT /api/admin/rules/{id}` (ADMIN only)

```typescript
interface UpdateRuleRequest { enabled?: boolean; weight?: number; threshold?: number; }
```

### Health Endpoint

#### `GET /actuator/health`
```typescript
interface HealthResponse {
  status: 'UP' | 'DOWN';
  components: { db?: { status: string }; redis?: { status: string }; kafka?: { status: string }; };
}
```

---

## TypeScript Enums

```typescript
export type Role = 'ADMIN' | 'FRAUD_ANALYST' | 'INVESTIGATOR' | 'AUDITOR' | 'SYSTEM_ACCOUNT';
export type UserStatus = 'ACTIVE' | 'DISABLED';
export type TransactionStatus = 'RECEIVED' | 'SCORING' | 'APPROVED' | 'IN_REVIEW' | 'DECLINED';
export type Decision = 'APPROVE' | 'REVIEW' | 'DECLINE';
export type CaseStatus = 'OPEN' | 'ASSIGNED' | 'IN_REVIEW' | 'RESOLVED_FRAUD' | 'RESOLVED_LEGIT' | 'ESCALATED' | 'CLOSED';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type LabelType = 'FRAUD' | 'LEGITIMATE';
export type ModelStatus = 'REGISTERED' | 'APPROVED' | 'DEPLOYED' | 'ROLLED_BACK' | 'ARCHIVED';
export type RiskTier = 'LOW' | 'MEDIUM' | 'HIGH';
```

---

## State Machines

### FraudCase Lifecycle

```typescript
const VALID_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  OPEN: ['ASSIGNED'],
  ASSIGNED: ['IN_REVIEW'],
  IN_REVIEW: ['RESOLVED_FRAUD', 'RESOLVED_LEGIT', 'ESCALATED'],
  ESCALATED: ['IN_REVIEW', 'RESOLVED_FRAUD', 'RESOLVED_LEGIT'],
  RESOLVED_FRAUD: ['CLOSED'],
  RESOLVED_LEGIT: ['CLOSED'],
  CLOSED: [],
};

function canTransition(from: CaseStatus, to: CaseStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
```

### Transaction Status

```
RECEIVED → SCORING → APPROVED | IN_REVIEW | DECLINED
IN_REVIEW → APPROVED | DECLINED
```

---

## Auth & RBAC

### JWT Structure

```typescript
interface JwtPayload {
  sub: string;
  username: string;
  role: Role;
  iat: number;
  exp: number;
}
```

### Role → Route Access

| Route | ADMIN | FRAUD_ANALYST | INVESTIGATOR | AUDITOR |
|---|:---:|:---:|:---:|:---:|
| `/cases` (queue) | ✅ | ✅ | ✅ | ✅ (read) |
| `/cases/:id` (detail) | ✅ | ✅ | ✅ | ✅ (read) |
| `/cases/:id/assign` | ✅ | ✅ | ✅ | — |
| `/cases/:id/status` | ✅ | ✅ | ✅ | — |
| `/cases/:id/notes` | ✅ | ✅ | ✅ | — |
| `/cases/:id/labels` | ✅ | ✅ | ✅ | — |
| `/transactions` | ✅ | ✅ | ✅ | ✅ (read) |
| `/admin/users` | ✅ | — | — | — |
| `/admin/rules` | ✅ | — | — | — |
| `/audit` | ✅ | — | — | ✅ (read) |

### Token Handling

- Access token stored in memory (Signal), not localStorage
- Refresh token stored in memory; optionally in httpOnly cookie
- HTTP interceptor attaches `Authorization: Bearer <token>` to every request
- 401 → attempt refresh → if refresh fails → redirect to login
- 403 → show "Insufficient permissions" toast

---

## MSW Strategy

Each feature ticket builds MSW handlers first, then the Angular service.

```typescript
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('/api/auth/login', () => { /* mock login */ }),
  http.get('/api/cases', () => { /* mock case list */ }),
  // ... one handler per endpoint
];
```

- **Development**: MSW intercepts all HTTP calls
- **Staging/Prod**: `environment.mockApi = false` → Angular services call real backend
- **SSE**: MSW cannot easily mock SSE; use a mock `EventSource` service for dev

Mock data generators:

```typescript
// src/mocks/data/cases.mock.ts
export function generateCase(overrides?: Partial<CaseSummaryDto>): CaseSummaryDto { ... }
export function generateCases(count: number): CaseSummaryDto[] { ... }
```

---

## Project Structure (Target)

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── auth/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.guard.ts
│   │   │   │   ├── role.guard.ts
│   │   │   │   └── auth.interceptor.ts
│   │   │   ├── api/
│   │   │   │   ├── api.service.ts
│   │   │   │   └── error-handler.service.ts
│   │   │   └── sse/
│   │   │       └── sse.service.ts
│   │   ├── features/
│   │   │   ├── cases/
│   │   │   │   ├── cases-list/
│   │   │   │   ├── case-detail/
│   │   │   │   ├── services/
│   │   │   │   └── cases.routes.ts
│   │   │   ├── admin/
│   │   │   │   ├── users/
│   │   │   │   ├── rules/
│   │   │   │   ├── models/
│   │   │   │   ├── audit/
│   │   │   │   └── admin.routes.ts
│   │   │   └── auth/
│   │   │       ├── login/
│   │   │       └── auth.routes.ts
│   │   ├── shared/
│   │   │   ├── layout/
│   │   │   │   ├── shell.component.ts
│   │   │   │   ├── sidenav.component.ts
│   │   │   │   └── topbar.component.ts
│   │   │   ├── models/
│   │   │   ├── pipes/
│   │   │   └── utils/
│   │   ├── app.component.ts
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   ├── mocks/
│   │   ├── handlers.ts
│   │   ├── browser.ts
│   │   └── data/
│   ├── styles.scss
│   ├── index.html
│   └── main.ts
├── angular.json
├── package.json
├── tsconfig.json
├── .eslintrc.json
├── .prettierrc
├── .github/workflows/ci.yml
└── docs/
    └── TICKETS.md
```

---

# PHASE 11 — FRONTEND

## EPIC-37 — Project Scaffold & Design System
*Phase 11 · Lead: FE · Depends on: —*

Angular 19 project with standalone components, Material theme, shared layout, and MSW mock data layer.

### FRAUD-237 — Angular 19 project scaffold
**Type:** Infrastructure · **Epic:** EPIC-37 · **Complexity:** M · **Owner:** FE
**Description:** Create the Angular 19 project using `ng new frontend --standalone --style=scss --routing`. Configure standalone components (no NgModules), Angular Material, Signals for state, ESLint, Prettier, and proxy config for `/api` → `http://localhost:8080`. Set up `app.config.ts` with `provideHttpClient`, `provideAnimations`, and router. Pin all dependency versions in `package.json` (no `latest`).
**Business Value:** Clean, modern Angular 19 foundation with all tooling configured.
**Acceptance Criteria:**
- `ng serve` boots successfully with a blank shell page.
- `ng lint` produces zero errors.
- `ng build` produces a production bundle.
- Proxy config routes `/api` to `http://localhost:8080`.
- All deps pinned; no `latest` ranges.
**Technical Notes:** Angular 19 with `providedIn: 'root'` services. Use `signal()` for component state, `rxjs` for HTTP and SSE. TypeScript strict mode enabled.
**Dependencies:** —

### FRAUD-238 — Design system: theme, palette, typography, shared SCSS
**Type:** Story · **Epic:** EPIC-37 · **Complexity:** S · **Owner:** FE
**Description:** Define an Angular Material theme with a professional palette for a fraud operations dashboard. Create SCSS tokens: colors, spacing, typography. Build severity-specific styles (CRITICAL=red, HIGH=orange, MEDIUM=yellow, LOW=green) and decision badges (APPROVE=green, REVIEW=amber, DECLINE=red).
**Business Value:** Consistent UI that communicates severity at a glance.
**Acceptance Criteria:**
- Material theme compiles with light and dark variants.
- Severity and decision chips use standard colors.
- Exported SCSS tokens: `$_severity-*`, `$_decision-*`, `$_spacing-*`, `$_font-*`.
**Technical Notes:** `@use '@angular/material' as mat`. Define `_variables.scss` imported everywhere.
**Dependencies:** FRAUD-237

### FRAUD-239 — Shared layout shell (sidenav, topbar, breadcrumbs, user avatar)
**Type:** Story · **Epic:** EPIC-37 · **Complexity:** M · **Owner:** FE
**Description:** Build the application shell: `<app-shell>` with Material sidenav (Dashboard, Cases, Admin), topbar (title, notification bell, user avatar with role badge), and breadcrumbs. Sidenav collapses on mobile. Shows/hides nav based on auth state.
**Business Value:** Consistent navigation and chrome for every page.
**Acceptance Criteria:**
- Shell renders sidenav + topbar on desktop; hamburger on mobile.
- Nav items: Dashboard, Cases, Admin — Admin visible only to ADMIN role.
- User avatar shows initials + role badge; dropdown has Logout.
- Breadcrumbs update based on current route.
**Technical Notes:** `<mat-sidenav-container>` + `<mat-toolbar>`. Auth state from `AuthService.currentUser()` signal.
**Dependencies:** FRAUD-237, FRAUD-238

### FRAUD-240 — MSW handlers + mock data generators
**Type:** Story · **Epic:** EPIC-37 · **Complexity:** M · **Owner:** FE
**Description:** Set up MSW for development. Create mock data generators for all entity types (cases, transactions, users, risk scores, rules). Implement MSW handlers for all API endpoints. Wire into `main.ts` (enabled when `environment.mockApi === true`).
**Business Value:** Frontend develops 100% independently of the backend.
**Acceptance Criteria:**
- All contract endpoints return realistic mock data.
- Mock data is deterministic (seeded).
- Case list returns 20+ paginated mock cases with full variety of statuses and severities.
**Technical Notes:** Install `msw` as devDependency. Use `@faker-js/faker` with seed.
**Dependencies:** FRAUD-237

---

## EPIC-38 — Auth & Navigation
*Phase 11 · Lead: FE · Depends on: EPIC-37*

### FRAUD-241 — Login page + JWT auth service
**Type:** Story · **Epic:** EPIC-38 · **Complexity:** L · **Owner:** FE
**Description:** Build login page (Material form with username + password) and `AuthService`. Auth service calls `POST /api/auth/login`, stores tokens in memory (Signals), handles refresh via `POST /api/auth/refresh`, and provides `currentUser()` and `isAuthenticated()` signals. HTTP interceptor attaches Bearer header. On 401 → attempt refresh → if refresh fails → redirect to login.
**Business Value:** Secure, role-aware authentication layer.
**Acceptance Criteria:**
- Login form validates and calls the auth endpoint (MSW first).
- Access token stored in a Signal (not localStorage).
- Refresh token used to get new access token on 401.
- Failed refresh → redirect to login page with error message.
- `AuthService.currentUser()` exposes `{userId, username, role}` as a Signal.
**Technical Notes:** `JwtHelperService` from `@auth0/angular-jwt` for decode/expire check. Create `TokenInterceptor`.
**Dependencies:** FRAUD-240

### FRAUD-242 — Auth guards + role-based routing
**Type:** Story · **Epic:** EPIC-38 · **Complexity:** M · **Owner:** FE
**Description:** Implement `AuthGuard` (redirect to login if not authenticated) and `RoleGuard` (redirect to 403 if role insufficient). Define lazy-loaded route structure with route data specifying required roles.
**Business Value:** Prevents unauthorized access at the routing level.
**Acceptance Criteria:**
- Unauthenticated user → redirect to `/login`.
- Authenticated user without required role → 403 page.
- AUDITOR can see cases but cannot assign/label/transition.
- Lazy-loaded feature modules reduce initial bundle.
**Technical Notes:** `canActivate: [AuthGuard]` and `canActivate: [RoleGuard]` on feature routes.
**Dependencies:** FRAUD-241

### FRAUD-243 — Navigation + lazy-loaded feature modules
**Type:** Technical Task · **Epic:** EPIC-38 · **Complexity:** S · **Owner:** FE
**Description:** Wire root router with lazy-loaded areas: `cases` (list + detail), `admin` (users + rules + models), `audit`. Update sidenav links from router state. Add 404 catch-all.
**Business Value:** Clean URL structure and code-split bundles.
**Acceptance Criteria:**
- `/cases` loads lazily.
- `/admin/*` loads lazily (ADMIN only).
- `/audit` loads lazily (ADMIN + AUDITOR).
- Unknown routes → 404.
**Dependencies:** FRAUD-242

---

## EPIC-39 — Case Queue Dashboard (SSE)
*Phase 11 · Lead: FE · Depends on: EPIC-38*

### FRAUD-244 — Case list page + paginated data table
**Type:** Story · **Epic:** EPIC-39 · **Complexity:** M · **Owner:** FE
**Description:** Build the case queue page: Material data table with columns (ID, severity badge, status chip, assignee, openedAt, SLA countdown). Server-side pagination. Filter controls: status, severity, assignee. Default: OPEN cases sorted by severity DESC, openedAt ASC. Click row → `/cases/:id`.
**Business Value:** The primary analyst view — fast, filterable, prioritized.
**Acceptance Criteria:**
- Table renders 20 cases per page with Material paginator.
- Severity column uses colored badges (CRITICAL=red, HIGH=orange, MEDIUM=yellow, LOW=green).
- Status column uses Material chips with colors.
- Filters work: status, severity, assignee; URL reflects filter state.
- Click row navigates to case detail.
**Technical Notes:** `MatTableDataSource` with `CaseService.getCases(params)`. Filter state in query params.
**Dependencies:** FRAUD-240, FRAUD-242

### FRAUD-245 — SSE service (connect, auto-reconnect, Signal-based state)
**Type:** Story · **Epic:** EPIC-39 · **Complexity:** M · **Owner:** FE
**Description:** Implement `SseService` that connects to `GET /api/cases/stream` with auth header. Auto-reconnect with exponential backoff. Parse events into `CaseSseEvent`. Update a `signal<Map<string, CaseSummaryDto>>` (case ID → latest state) that the case list subscribes to.
**Business Value:** Real-time case queue.
**Acceptance Criteria:**
- SSE connects on app init (after login).
- Reconnects on disconnect with exponential backoff (1s → 30s max).
- Events parsed and applied to the signal map.
- Case list reacts to real-time updates within 1 second.
- Mock implementation: `MockSseService` emits test events every 5s.
**Technical Notes:** Use `fetch` with `ReadableStream` (not native `EventSource`, which doesn't support custom headers).
**Dependencies:** FRAUD-241

### FRAUD-246 — Real-time case queue updates (new cases, status changes)
**Type:** Story · **Epic:** EPIC-39 · **Complexity:** S · **Owner:** FE
**Description:** Connect the SSE signal to the Material data table so real-time updates (new cases, status changes, assignments) are reflected instantly. New cases slide in at the top (sorted by severity). Status changes update chip color in place. Pulse animation for newly arrived cases.
**Business Value:** Analysts never need to refresh — live updates.
**Acceptance Criteria:**
- New case appears at the top with a brief highlight animation.
- Status change updates the chip color in the existing row.
- After 3s, highlight fades.
- Table remains paginated; new cases respect current filter.
**Dependencies:** FRAUD-244, FRAUD-245

### FRAUD-247 — Priority sorting + severity badges + SLA countdown
**Type:** Story · **Epic:** EPIC-39 · **Complexity:** S · **Owner:** FE
**Description:** Add visual priority cues: severity badges with colors, SLA countdown timer (hours remaining), overdue SLA indicator (red). Default sort: severity DESC → openedAt ASC.
**Business Value:** Analysts instantly see which cases need attention first.
**Acceptance Criteria:**
- Severity badge: CRITICAL (red), HIGH (orange), MEDIUM (yellow), LOW (green).
- SLA countdown: "2h 30m remaining" (green), "30m remaining" (amber), "OVERDUE" (red).
- Sort can be overridden by column header click.
**Technical Notes:** Compute SLA remaining from `slaDueAt`. Update countdown every minute via `interval(60000)`.
**Dependencies:** FRAUD-244

---

## EPIC-40 — Case Detail & Investigation
*Phase 11 · Lead: FE · Depends on: EPIC-39*

### FRAUD-248 — Case detail page (summary header, transaction, risk score)
**Type:** Story · **Epic:** EPIC-40 · **Complexity:** L · **Owner:** FE
**Description:** Build case detail at `/cases/:id`. Top: case summary card (status chip, severity badge, assignee, SLA countdown). Middle: transaction details. Right: risk score breakdown (ML score gauge, rules score gauge, aggregate, decision badge, reason codes). Bottom: tabs for Notes and Labels.
**Business Value:** Analysts see everything on one page to make a decision.
**Acceptance Criteria:**
- Case detail fetched from `GET /api/cases/{id}` (MSW first).
- Summary card shows status, severity, assignee, SLA.
- Transaction section shows all fields.
- Risk score section shows gauges/progress bars.
- Decision shown as colored badge.
- Reason codes as chips.
- "Degraded mode" warning banner when `degradedMode = true`.
**Technical Notes:** `<mat-card>` for sections. Score gauges as `<mat-progress-bar>` or custom SVG. Tabs: `<mat-tab-group>`.
**Dependencies:** FRAUD-240, FRAUD-242

### FRAUD-249 — Case status transitions (assign, escalate, resolve)
**Type:** Story · **Epic:** EPIC-40 · **Complexity:** M · **Owner:** FE
**Description:** Implement action buttons for all legal transitions: "Assign to Me" (OPEN→ASSIGNED), "Start Review" (ASSIGNED→IN_REVIEW), "Escalate" (IN_REVIEW→ESCALATED), "Mark Fraud" (IN_REVIEW→RESOLVED_FRAUD), "Mark Legitimate" (IN_REVIEW→RESOLVED_LEGIT), "Close" (RESOLVED→CLOSED). Buttons shown/hidden per status and role.
**Business Value:** Analysts progress cases through the full lifecycle.
**Acceptance Criteria:**
- Only legal transitions shown (per `VALID_TRANSITIONS` map).
- Role-based: AUDITOR sees no buttons. INVESTIGATOR can escalate.
- Click calls `PUT /api/cases/{id}/status` with optional note.
- Success → refresh + success toast.
- Failure (409) → "Invalid transition" error.
**Technical Notes:** `canTransition(from, to)` utility. Confirmation dialog for destructive actions.
**Dependencies:** FRAUD-248

### FRAUD-250 — Investigation notes (list + add note form)
**Type:** Story · **Epic:** EPIC-40 · **Complexity:** S · **Owner:** FE
**Description:** Build the Notes tab: chronological list of notes (author, content, timestamp) and add-note form (textarea + submit). AUDITOR can view but not add.
**Business Value:** Analysts document investigation reasoning.
**Acceptance Criteria:**
- Notes listed chronologically (newest last).
- Add note form: textarea (required, min 10 chars) + "Add Note" button.
- `POST /api/cases/{id}/notes` on submit; note appears immediately.
- AUDITOR sees notes but no add-note form.
**Dependencies:** FRAUD-248

### FRAUD-251 — Fraud label submission (FRAUD / LEGITIMATE + confidence + reason)
**Type:** Story · **Epic:** EPIC-40 · **Complexity:** S · **Owner:** FE
**Description:** Build the Labels tab: past labels history and submission form with label radio (FRAUD / LEGITIMATE), confidence slider (0–100%), reason textarea. Confirmation dialog before submit.
**Business Value:** Closes the feedback loop — analyst labels feed retraining.
**Acceptance Criteria:**
- Labels tab shows past labels.
- Submit form: radio for label, slider for confidence, textarea for reason.
- Confirmation dialog before submit.
- After submit: case status updates, show "Case resolved" banner.
- AUDITOR cannot submit labels; ADMIN can.
**Technical Notes:** `<mat-radio-group>` for label, `<mat-slider>` for confidence.
**Dependencies:** FRAUD-248

---

## EPIC-41 — Admin Panel
*Phase 11 · Lead: FE · Depends on: EPIC-38*

### FRAUD-252 — Rule configuration page (list, edit thresholds/weights)
**Type:** Story · **Epic:** EPIC-41 · **Complexity:** M · **Owner:** FE
**Description:** Build `/admin/rules` (ADMIN only): data table listing all rules. Inline edit or dialog for weight, threshold, enabled toggle. Save calls `PUT /api/admin/rules/{id}`.
**Business Value:** Admins tune fraud detection without redeployment.
**Acceptance Criteria:**
- Table loads rules from `GET /api/admin/rules` (MSW first).
- Inline edit or dialog for weight, threshold, enabled.
- Save confirmation toast; error toast on failure.
- Route guarded to ADMIN role only.
**Dependencies:** FRAUD-240, FRAUD-242

### FRAUD-253 — User management page (list, create, edit role)
**Type:** Story · **Epic:** EPIC-41 · **Complexity:** M · **Owner:** FE
**Description:** Build `/admin/users` (ADMIN only): paginated user table. "Create User" dialog. Edit role dialog. Disable/enable toggle.
**Business Value:** Admins manage platform access.
**Acceptance Criteria:**
- Table shows all users with role badges and status indicators.
- Create User dialog validates required fields and calls POST.
- Role change shows confirmation dialog.
- Route guarded to ADMIN role only.
**Dependencies:** FRAUD-240, FRAUD-242

### FRAUD-254 — Model version dashboard
**Type:** Story · **Epic:** EPIC-41 · **Complexity:** M · **Owner:** FE
**Description:** Build `/admin/models` (ADMIN only): list of model versions (version, status chip, deployed at, metrics). Action buttons: Deploy, Rollback. Informational page with mock data for now.
**Business Value:** Admins see which model is serving.
**Acceptance Criteria:**
- Table lists model versions with status chips.
- Deploy/Rollback buttons shown contextually.
- Metrics displayed as summary.
- Route guarded to ADMIN role only.
**Technical Notes:** Mock endpoint `GET /api/admin/models` in MSW.
**Dependencies:** FRAUD-240, FRAUD-242

### FRAUD-255 — Audit trail viewer (read-only, filterable)
**Type:** Story · **Epic:** EPIC-41 · **Complexity:** S · **Owner:** FE
**Description:** Build `/audit` (ADMIN + AUDITOR only): read-only, paginated, filterable table of audit events. Filters: actor, action, target type, date range. Row expansion shows before/after JSON diff.
**Business Value:** Regulatory-grade audit trail visibility.
**Acceptance Criteria:**
- Table shows audit events paginated, sorted by timestamp DESC.
- Filters: actor, action, target type, date range.
- Row expansion shows before/after as formatted JSON.
- Route guarded to ADMIN and AUDITOR roles.
**Dependencies:** FRAUD-240, FRAUD-242

---

## EPIC-42 — Polish, E2E & CI
*Phase 11 · Lead: FE/DO · Depends on: EPIC-37–41*

### FRAUD-256 — Accessibility audit + responsive breakpoints
**Type:** Story · **Epic:** EPIC-42 · **Complexity:** M · **Owner:** FE
**Description:** Run Lighthouse accessibility audit and fix critical issues. Add ARIA labels. Ensure keyboard navigation for all flows. Responsive breakpoints: desktop (>1200px), tablet (768-1200px), mobile (<768px). Sidenav collapses to hamburger on mobile.
**Business Value:** WCAG 2.1 AA compliance; usable on any device.
**Acceptance Criteria:**
- Lighthouse accessibility score ≥ 90.
- All interactive elements have ARIA labels.
- Tab order logical; focus indicators visible.
- Responsive: desktop sidenav, mobile hamburger.
**Dependencies:** FRAUD-251

### FRAUD-257 — E2E test suite (Playwright)
**Type:** Story · **Epic:** EPIC-42 · **Complexity:** L · **Owner:** FE
**Description:** Set up Playwright and write E2E tests: (1) login flow, (2) case queue renders and paginates, (3) case detail shows all info, (4) status transitions work, (5) note creation, (6) label submission, (7) role-based access. All against MSW.
**Business Value:** Confidence that the full user journey works end to end.
**Acceptance Criteria:**
- 7+ E2E test scenarios passing in CI.
- Tests run against MSW (no backend dependency).
- CI step runs `npx playwright test`.
**Dependencies:** FRAUD-251

### FRAUD-258 — CI pipeline (lint, build, test, e2e on PR)
**Type:** Infrastructure · **Epic:** EPIC-42 · **Complexity:** M · **Owner:** DO
**Description:** GitHub Actions workflow: `ng lint`, `ng build`, `ng test`, `npx playwright test`. Fail on any violation.
**Business Value:** Visible green CI; quality gate for every PR.
**Acceptance Criteria:**
- Workflow runs on PR; failing lint/build/test/e2e blocks merge.
- Node 20, Angular 19, cached `node_modules`.
- E2E job runs after build.
- Status badges in README.
**Dependencies:** FRAUD-257

### FRAUD-259 — README + JD skill map
**Type:** Story · **Epic:** EPIC-42 · **Complexity:** S · **Owner:** FE
**Description:** Centerpiece README: architecture overview, quickstart (with MSW), screenshots, JD-skill → file map, and links to root docs.
**Business Value:** What a recruiter/interviewer reads first.
**Acceptance Criteria:**
- README links every relevant JD skill to a concrete file/dir and command.
- Quickstart works on a clean checkout with MSW.
- Architecture diagram (mermaid) showing SPA → API → SSE flow.
**Dependencies:** FRAUD-258

---

# Importing into Linear

- **Phase 11** → `phase:11` label.
- **Epic (EPIC-37…42)** → project **milestone** and `Epic`-labelled **parent issue** inside the "Fraud Detection" project.
- **Ticket (FRAUD-237…259)** → **sub-issue** of its epic's parent issue, assigned to that epic's milestone.

**Field mapping**:
- Title → `FRAUD-### — Title`
- Description / Business Value / Acceptance Criteria / Technical Notes → issue description.
- Complexity → **Estimate**: `XS=1, S=2, M=3, L=5, XL=8`.
- Type → Story→`type:story`, Technical Task→`type:tech-task`, Infrastructure→`type:infra`.
- Domain → `domain:frontend` on every ticket; plus area: `area:scaffold` (E37), `area:auth` (E38), `area:case-queue` (E39), `area:case-detail` (E40), `area:admin` (E41), `area:polish` (E42).
- Team → `team:frontend` (FE).
- `Dependencies` → add as **"blocked by"** relations.

---

*Frontend backlog — 6 epics (EPIC-37 → EPIC-42), 23 tickets (FRAUD-237 → FRAUD-259), Phase 11. Extends the platform backlog (FRAUD-001 → 161), the ML backlog (FRAUD-162 → 207), and the backend backlog (FRAUD-208 → 236).*