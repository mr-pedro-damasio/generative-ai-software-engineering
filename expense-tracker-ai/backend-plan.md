# Backend Improvement Plan

## Phase 1 — Foundation (Weeks 1–2)

### 1. Build REST API Routes
- **Files:** Create `app/api/expenses/route.ts`, `app/api/expenses/[id]/route.ts`
- **Tasks:**
  - Implement `GET`, `POST`, `PUT`, `DELETE` handlers with correct HTTP status codes
  - Add server-side request validation using Zod schemas (see item 2)
  - Move ID generation to server (UUIDs via `crypto.randomUUID()`)

### 2. Add Zod Validation Schemas
- **Files:** `hooks/useExpenses.ts:35-41`, `components/ExpenseForm.tsx:23-30` → create `lib/schemas.ts`
- **Task:** Define and enforce schemas on all API routes:
  ```ts
  const ExpenseSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    amount: z.number().min(0.01),
    category: z.enum(['Food', 'Transportation', ...]),
    description: z.string().min(1).max(500).trim(),
  });
  ```
  Return `400 Bad Request` with field-level errors on validation failure.

### 3. Integrate a Database
- **Files:** Project-wide (no DB exists)
- **Task:** Add PostgreSQL + Prisma; define `Expense` model with `id`, `userId`, `date`, `amount`, `category`, `description`, `createdAt`, `updatedAt`, `deletedAt` (soft delete); add indexes on `(user_id, date)` and `(user_id, category)`.

### 4. Add Authentication
- **Files:** Project-wide (no auth exists)
- **Task:** Integrate NextAuth.js at `app/api/auth/[...nextauth].ts`; add middleware to protect all `/api/expenses` routes; attach `userId` to every expense record in the database.

---

## Phase 2 — Safety & Reliability (Weeks 3–4)

### 5. Fix CSV Injection Vulnerability
- **Files:** `lib/exportCloud.ts:118-122`, `lib/utils.ts:35-51`
- **Task:** Escape all user-controlled fields before writing to CSV. Values starting with `=`, `+`, `@`, or `-` must be prefixed or quoted:
  ```ts
  function escapeCsvField(value: string): string {
    if (/^[=+@-]/.test(value) || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
  ```

### 6. Add Pagination to API & UI
- **Files:** `hooks/useExpenses.ts:14`, `app/page.tsx:20-28`
- **Task:** API supports `GET /api/expenses?page=1&limit=50`; implement cursor-based or offset pagination; add virtual list or page controls in UI.

### 7. Implement Optimistic Updates with Rollback
- **File:** `hooks/useExpenses.ts:35-57`
- **Task:** On edit/delete, update UI immediately and roll back on API failure; use database transactions server-side for atomic operations.

### 8. Expose Error State from `useExpenses`
- **File:** `hooks/useExpenses.ts:11-18`
- **Task:** Return `{ expenses, error, isLoading, ... }` from hook; surface errors in UI with retry buttons; implement exponential backoff for failed API calls.

### 9. Fix Date Handling
- **Files:** `lib/utils.ts:27-32,72-86`, `lib/exportCloud.ts:89-96`
- **Task:** Store dates as UTC ISO 8601 strings in the database; validate format server-side; document timezone assumption; use `Date` objects for comparisons instead of string lexicography.

### 10. Add Input Sanitization
- **Files:** `components/ExpenseList.tsx:59`, `components/ExportHub.tsx:138`
- **Task:** Enforce `description: z.string().min(1).max(500).trim()` server-side; use DOMPurify if any field renders HTML.

### 11. Add Structured Logging
- **Files:** All API route handlers (once created)
- **Task:** Integrate Pino or Winston; log to stdout; include `requestId` for tracing; log all errors and slow operations (>100ms).

### 12. Add Rate Limiting
- **Files:** API middleware (once API exists)
- **Task:** 100 requests/minute per user ID; return `429 Too Many Requests` with `Retry-After` header.

---

## Phase 3 — Cloud Feature Completion (Weeks 5–6)

### 13. Implement Real Cloud Integrations
- **File:** `components/ExportHub.tsx:256-360` (currently fake `await delay()`)
- **Task:** Build OAuth2 flows at `app/api/integrations/[provider]/auth` and `.../callback`; store credentials encrypted in database (never in localStorage); implement `POST /api/integrations/[provider]/sync`.

### 14. Build Real Email Sending
- **File:** `components/ExportHub.tsx:138-144` (currently fake)
- **Task:** Create `POST /api/exports/send-email` using Resend, SendGrid, or Mailgun; validate email server-side; generate temporary signed share links stored in database; rate-limit endpoint.

### 15. Implement Scheduled Export Jobs
- **Files:** `components/ExportHub.tsx:362-451`, `lib/exportCloud.ts:214-255`
- **Task:** Store schedules in database (not localStorage); build a cron worker (Bull, AWS SQS, or Vercel Cron) that executes due exports and pushes to email/cloud destinations.

### 16. Enforce Share Link Expiry Server-Side
- **File:** `lib/exportCloud.ts:258-265` (expiry is UI-only today)
- **Task:** Store share links in database with `expiresAt`; validate expiry in `GET /api/shares/[shareId]`; return `410 Gone` when expired.

---

## Phase 4 — Polish & Observability (Weeks 7–8)

### 17. Add API Response Caching
- **Files:** `lib/exportCloud.ts:65-85`, `components/Dashboard.tsx:12-18`
- **Task:** Add `Cache-Control` headers to summary endpoints; integrate SWR or React Query on the client for automatic revalidation; cache expensive aggregations (e.g., `/api/expenses/summary?period=6months`) for 5 minutes.

### 18. Add Audit Trail
- **Files:** Project-wide
- **Task:** Add `created_at`, `updated_at`, `deleted_at` columns (soft deletes) to the Expense model; optionally add a separate audit log table; expose `GET /api/expenses/[id]/history`.

### 19. Add a Type-Safe API Client
- **File:** `hooks/useExpenses.ts` (will call API once built)
- **Task:** Use tRPC to share types between server and client, or generate TypeScript types from an OpenAPI schema — ensures API changes break at compile time, not runtime.

### 20. Add Database-Level Constraints
- **Files:** Prisma schema (once created)
- **Task:** Enforce `amount > 0`, `category IN (enum values)`, `NOT NULL` on required fields, and foreign key from `userId` to `users` table.

### 21. Fix Non-Standard QR Code Generation
- **File:** `components/ExportHub.tsx:15-40`
- **Task:** Replace custom hash-based QR implementation with `qrcode.react`; generate QR codes server-side for reproducibility.

### 22. Add Database Migration Strategy
- **Files:** Project-wide (once DB exists)
- **Task:** Use Prisma migrations; track all migrations in git under `/prisma/migrations`; document breaking schema changes in CHANGELOG.

---

## Summary Table

| Priority | Issue | File(s) | Effort |
|----------|-------|---------|--------|
| Critical | No backend API/DB | Project-wide | High |
| Critical | No server-side validation | `useExpenses.ts`, `ExpenseForm.tsx` | Medium |
| Critical | Insecure client-side ID generation | `useExpenses.ts:8` | Low |
| Critical | No authentication | Project-wide | High |
| Critical | CSV injection vulnerability | `exportCloud.ts:118`, `utils.ts:35` | Low |
| High | No atomic operations / transactions | `useExpenses.ts:35-57` | Medium |
| High | No pagination | `useExpenses.ts:14`, `page.tsx:20` | Medium |
| High | Silent error swallowing | `useExpenses.ts:11-18` | Medium |
| High | Fragile date handling | `utils.ts:27-32`, `exportCloud.ts:89` | Low |
| High | No input sanitization (XSS) | `ExpenseList.tsx:59` | Low |
| Medium | Fake cloud integrations | `ExportHub.tsx:256-360` | High |
| Medium | Fake email sending | `ExportHub.tsx:138-144` | High |
| Medium | Scheduled exports never run | `ExportHub.tsx:362-451` | High |
| Medium | No API caching | `Dashboard.tsx`, `exportCloud.ts` | Medium |
| Medium | No rate limiting | Future API routes | Low |
| Medium | No structured logging | Future API routes | Medium |
| Low | Share link expiry not enforced | `exportCloud.ts:258-265` | Low |
| Low | No audit trail | Project-wide | Medium |
| Low | No type-safe API client | `useExpenses.ts` | Medium |
| Low | Non-standard QR codes | `ExportHub.tsx:15-40` | Low |
| Low | No DB constraints | Future Prisma schema | Low |
| Low | No migration strategy | Future DB | Medium |
