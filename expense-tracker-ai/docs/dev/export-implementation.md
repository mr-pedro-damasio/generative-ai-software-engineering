# Export Hub Implementation

## Overview

The Export Hub is a full-featured data-export interface for the expense tracker. It lets users
download their expenses in multiple file formats, share reports via email or link, connect cloud
storage services, configure recurring scheduled exports, and review a history of past exports.

**Feature classification:** Frontend (pure client-side — no backend, no API routes)

All state is persisted in `localStorage`. Simulated async operations (email sending, cloud
integration auth, schedule saving) use `setTimeout`-based delays to mimic network latency; no
real external service calls are made.

---

## Next.js context

- **Router:** App Router (`app/page.tsx` — the app has a single route).
- **Rendering:** Every file uses `'use client'` at the top. There are no Server Components, no
  server actions, and no `route.ts` handlers in this project.
- **Entry point:** `app/page.tsx` is the root page component. It imports `ExportHub` directly
  and conditionally renders it based on a `showHub` boolean in local state (line 17).
- **No Next.js-specific data-fetching APIs** (`fetch`, `use`, `cache`, `generateStaticParams`,
  `generateMetadata`, etc.) are used — all data comes from `localStorage` via the `useExpenses`
  hook.
- **Metadata:** Not configured for this page; layout metadata is the default from
  `app/layout.tsx`.
- **Images / fonts:** No `next/image` or `next/font` usage in this feature.
- **Tailwind CSS v4:** Utility classes only; no `tailwind.config.js` — all custom tokens are in
  `app/globals.css`.

---

## Related Files

| File | Role |
|---|---|
| `components/ExportHub.tsx` | Root drawer component; houses all five sub-panels and the sidebar nav |
| `lib/exportCloud.ts` | All export logic: template definitions, file-format exporters, history CRUD, integration state, schedule helpers, share-link generation |
| `lib/utils.ts` | Legacy `exportToCSV` helper (pre-ExportHub, still used by the old direct-download path) |
| `app/page.tsx` | Renders the `<ExportHub>` overlay; owns the `showHub` boolean; passes the full `expenses[]` array |
| `types/expense.ts` | `Expense` and `Category` types consumed throughout |

---

## Architecture / Flow

### Entry point

The **"Export Data"** button in `app/page.tsx:44` sets `showHub = true`, which mounts
`<ExportHub expenses={expenses} onClose={…} />` as a fixed full-screen overlay.

### Drawer structure

```
ExportHub (fixed overlay + drawer)
├── Header  — expense count + total
├── Sidebar nav  — 5 tabs
│   ├── Templates     → TemplatesPanel
│   ├── Send & Share  → SendSharePanel
│   ├── Integrations  → IntegrationsPanel
│   ├── Scheduled     → SchedulePanel
│   └── History       → HistoryPanel
└── Main content area (scrollable)
```

Pressing `Escape` or clicking the backdrop calls `onClose` (registered via `useEffect` on
`window.keydown`).

### Export pipeline

```
User picks template / configures export
    ↓
filterByTemplate(expenses, template)       ← lib/exportCloud.ts
    ↓
doExportCSV | doExportJSON | doExportPDF   ← lib/exportCloud.ts
    ↓
Browser download / print dialog
    ↓
pushHistory(entry)                         ← lib/exportCloud.ts → localStorage
    ↓
HistoryPanel re-renders via setHistory
```

---

## Templates

Six pre-configured templates are defined in `lib/exportCloud.ts:18` as `TEMPLATES: ExportTemplate[]`.

| Template ID | Name | Format | Date Range | Category Filter |
|---|---|---|---|---|
| `tax-report` | Tax Report | PDF | Year-to-date | All |
| `monthly-summary` | Monthly Summary | CSV | This month | All |
| `category-analysis` | Category Analysis | JSON | All time | All |
| `business-expenses` | Business Expenses | PDF | This month | Transportation, Bills, Other |
| `quarterly-review` | Quarterly Review | CSV | Last 3 months | All |
| `food-tracker` | Food & Dining | CSV | This month | Food |

`filterByTemplate` applies both the date range (computed relative to `new Date()`) and category
filter via lexicographic ISO date comparison — consistent with the rest of the app.

---

## Export Formats

### CSV (`doExportCSV`)
Columns (in order): `Date`, `Category`, `Amount`, `Description`.
Descriptions are double-quote escaped. File is downloaded via a Blob URL.

> **Note:** Column order differs from the legacy `exportToCSV` in `lib/utils.ts` (which uses
> `Date, Amount, Category, Description`). The ExportHub version is used exclusively by the Hub.

### JSON (`doExportJSON`)
Envelope shape:
```jsonc
{
  "exportedAt": "<ISO timestamp>",
  "count": 42,
  "total": 1234.56,
  "expenses": [ /* full Expense objects */ ]
}
```

### PDF (`doExportPDF`)
Generates a self-contained styled HTML document and opens it in a new tab. The page calls
`window.print()` automatically on load, so the browser print dialog appears immediately.
Includes a styled table with date, category badge, amount, and description columns, plus a
total footer. Falls back to a Blob URL if `window.open` is blocked by the browser.

---

## Send & Share

### Email tab
Fields: template selector + recipient email address. On submit, `onExported` is called (which
calls `pushHistory`) and the status transitions to `sent`. **No real email is sent** — this is
a UI-only simulation.

### Share Link tab
- `generateShareId()` produces a 10-character alphanumeric ID from two `Math.random()` calls.
- `shareUrl(id)` returns `https://expensetracker.app/shared/${id}` — a placeholder domain with
  no real backend.
- Expiry options (1d / 7d / 30d / no expiry) are purely display labels; no expiry is enforced.
- A deterministic SVG QR code is rendered client-side via the internal `QRCode` component
  (uses a djb2-style hash to fill cells; finder patterns are hardcoded). It is decorative — it
  encodes the share URL string but the URL is not live.

---

## Integrations

Four services are defined in `INTEGRATIONS_META` inside `ExportHub.tsx:256`:

| Service | ID | Simulated account |
|---|---|---|
| Google Sheets | `googleSheets` | `you@gmail.com` |
| Dropbox | `dropbox` | `/ExpenseTracker/` |
| OneDrive | `oneDrive` | `you@outlook.com` |
| Notion | `notion` | `My Workspace` |

Connect / Sync / Disconnect are all client-side simulations with a `delay()`. State is
persisted to `localStorage` under key `xp-integrations` via `saveIntegrations`.

---

## Scheduled Exports

`SchedulePanel` lets users pick frequency (daily / weekly / monthly), time, template, and
format. On save:
1. `buildNextRun(frequency, time)` computes the next trigger timestamp relative to `new Date()`.
2. The config is written to `localStorage` under key `xp-schedule` via `saveSchedule`.
3. `nextRunLabel` formats the timestamp for display.

**There is no background execution.** The schedule is a persisted config only — no service
worker, cron job, or timer fires exports automatically. A real implementation would require a
backend scheduler or a push-based mechanism.

---

## Data / Storage

All state is persisted in `localStorage`. No server, no database.

| Key | Type | Max size | Purpose |
|---|---|---|---|
| `xp-export-history` | `ExportEntry[]` | 40 entries (trimmed on write) | Export audit log |
| `xp-integrations` | `Integrations` | — | Connected cloud service states |
| `xp-schedule` | `ScheduleConfig \| null` | — | Active recurring schedule config |

### Type reference

```ts
interface ExportEntry {
  id: string;           // random base-36
  timestamp: string;    // ISO timestamp
  templateName: string;
  templateIcon: string;
  destination: string;  // email address or 'Download'
  destinationIcon: string;
  format: string;       // 'CSV' | 'JSON' | 'PDF'
  recordCount: number;
  totalAmount: number;
  status: 'completed' | 'processing' | 'scheduled';
  shareId?: string;
}

interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;         // 'HH:MM'
  format: 'csv' | 'json' | 'pdf';
  templateId: string;
  destination: string;
  enabled: boolean;
  nextRun: string;      // ISO timestamp
}

interface Integrations {
  googleSheets: Integration;
  dropbox:      Integration;
  oneDrive:     Integration;
  notion:       Integration;
}
interface Integration { connected: boolean; account?: string; lastSync?: string }
```

---

## Implementation Notes

- **Simulated latency:** All async operations call `delay(ms)` (a `Promise`-wrapped `setTimeout`)
  purely for UX feedback. Remove these if real network calls are added.
- **PDF popup blocker:** `doExportPDF` falls back to a Blob URL if `window.open` returns `null`.
  Some browsers block popups by default; users may need to allow popups for the print dialog to
  appear.
- **QR code is decorative:** The SVG QR pattern is a visual approximation using a hash function.
  It is not a compliant QR encoding and cannot be scanned by a QR reader.
- **Share URLs are non-functional:** `expensetracker.app/shared/{id}` does not exist. Implementing
  real sharing would require a backend to store and serve snapshot data.
- **Schedule is display-only:** Saved schedules compute and display a `nextRun` time but nothing
  executes automatically. A real implementation needs server-side scheduling or a service worker.
- **Legacy `exportToCSV`:** `lib/utils.ts:35` contains an older, simpler CSV export function with
  a different column order. It is not called by any current component and can be removed when
  cleaning up.

---

## Testing

No automated tests are configured for this project.

### Recommended manual verification steps

1. **Templates tab** — click each of the 6 templates and confirm the correct file type downloads
   with records matching the expected date range and category filter.
2. **CSV format** — open a downloaded CSV and verify column order: `Date, Category, Amount, Description`.
3. **JSON format** — verify the envelope contains `exportedAt`, `count`, `total`, and `expenses[]`.
4. **PDF format** — verify the print dialog opens. Test with popup blocker enabled to confirm the
   Blob URL fallback works.
5. **Send & Share / Email** — enter an email address, click "Send Report →", confirm the success
   state appears and the entry appears in History.
6. **Share Link** — copy the link, toggle expiry options, expand the QR code.
7. **Integrations** — connect each service, trigger Sync, disconnect. Reload the page and confirm
   state is restored from `localStorage`.
8. **Schedule** — save a schedule, confirm the "Active Schedule" card appears with a valid next-run
   time. Delete the schedule and confirm it clears.
9. **History** — confirm all export/send actions appear in History with correct metadata.
10. **Escape / backdrop** — confirm the drawer closes cleanly.

### Known gaps

- No unit tests for `filterByTemplate` date range logic.
- No tests for `doExportCSV` / `doExportJSON` output format.
- No tests for `buildNextRun` edge cases (e.g., scheduling at a time that has already passed today).

---

## Related Documentation

- [User guide: How to export your expenses](../user/how-to-export.md)
- [AGENTS.md](../../AGENTS.md) — project stack, architecture overview, and coding conventions
