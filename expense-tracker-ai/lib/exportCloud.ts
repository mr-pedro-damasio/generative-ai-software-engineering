import { Expense, Category } from '@/types/expense';
import { formatCurrency, formatDate } from '@/lib/utils';

// ── Templates ────────────────────────────────────────────────────────────────

export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  accent: string;       // tailwind bg colour class
  format: 'csv' | 'json' | 'pdf';
  dateRange: 'all' | 'this-month' | 'last-month' | 'ytd' | 'last-3-months';
  categories: Category[] | 'all';
  useCase: string;
}

export const TEMPLATES: ExportTemplate[] = [
  {
    id: 'tax-report',
    name: 'Tax Report',
    description: 'Year-to-date expenses formatted for filing',
    icon: '🧾',
    accent: 'bg-emerald-500',
    format: 'pdf',
    dateRange: 'ytd',
    categories: 'all',
    useCase: 'Send to accountant',
  },
  {
    id: 'monthly-summary',
    name: 'Monthly Summary',
    description: 'This month\'s full spending overview',
    icon: '📅',
    accent: 'bg-indigo-500',
    format: 'csv',
    dateRange: 'this-month',
    categories: 'all',
    useCase: 'Budget tracking',
  },
  {
    id: 'category-analysis',
    name: 'Category Analysis',
    description: 'All-time spending grouped by category',
    icon: '📊',
    accent: 'bg-amber-500',
    format: 'json',
    dateRange: 'all',
    categories: 'all',
    useCase: 'Spending patterns',
  },
  {
    id: 'business-expenses',
    name: 'Business Expenses',
    description: 'Work-related costs for reimbursement',
    icon: '💼',
    accent: 'bg-blue-500',
    format: 'pdf',
    dateRange: 'this-month',
    categories: ['Transportation', 'Bills', 'Other'],
    useCase: 'Expense claim',
  },
  {
    id: 'quarterly-review',
    name: 'Quarterly Review',
    description: 'Last 3 months for executive reporting',
    icon: '📈',
    accent: 'bg-purple-500',
    format: 'csv',
    dateRange: 'last-3-months',
    categories: 'all',
    useCase: 'Quarterly planning',
  },
  {
    id: 'food-tracker',
    name: 'Food & Dining',
    description: 'Food expenses for dietary budgeting',
    icon: '🍽️',
    accent: 'bg-rose-500',
    format: 'csv',
    dateRange: 'this-month',
    categories: ['Food'],
    useCase: 'Health tracking',
  },
];

export function filterByTemplate(expenses: Expense[], template: ExportTemplate): Expense[] {
  const now = new Date();
  const pad = (d: Date) => d.toISOString().slice(0, 10);

  const ranges: Record<ExportTemplate['dateRange'], { from: string; to: string }> = {
    all:           { from: '', to: '' },
    'this-month':  { from: pad(new Date(now.getFullYear(), now.getMonth(), 1)),       to: pad(now) },
    'last-month':  { from: pad(new Date(now.getFullYear(), now.getMonth() - 1, 1)),   to: pad(new Date(now.getFullYear(), now.getMonth(), 0)) },
    ytd:           { from: pad(new Date(now.getFullYear(), 0, 1)),                    to: pad(now) },
    'last-3-months': { from: pad(new Date(now.getFullYear(), now.getMonth() - 3, 1)), to: pad(now) },
  };

  const { from, to } = ranges[template.dateRange];
  return expenses.filter(e => {
    if (template.categories !== 'all' && !(template.categories as Category[]).includes(e.category)) return false;
    if (from && e.date < from) return false;
    if (to   && e.date > to)   return false;
    return true;
  });
}

// ── Download helpers ──────────────────────────────────────────────────────────

function downloadBlob(content: string, filename: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  Object.assign(document.createElement('a'), { href: url, download: filename }).click();
  URL.revokeObjectURL(url);
}

export function doExportCSV(expenses: Expense[], filename: string): void {
  const header = ['Date', 'Category', 'Amount', 'Description'];
  const rows = expenses.map(e => [
    e.date, e.category, e.amount.toFixed(2),
    `"${e.description.replace(/"/g, '""')}"`,
  ]);
  downloadBlob([header, ...rows].map(r => r.join(',')).join('\n'), `${filename}.csv`, 'text/csv');
}

export function doExportJSON(expenses: Expense[], filename: string): void {
  downloadBlob(
    JSON.stringify({ exportedAt: new Date().toISOString(), count: expenses.length, total: expenses.reduce((s, e) => s + e.amount, 0), expenses }, null, 2),
    `${filename}.json`, 'application/json',
  );
}

export function doExportPDF(expenses: Expense[], title: string, filename: string): void {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const rows = expenses.map(e => `<tr>
    <td>${formatDate(e.date)}</td>
    <td><span class="badge">${e.category}</span></td>
    <td class="amt">${formatCurrency(e.amount)}</td>
    <td class="muted">${e.description.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</td>
  </tr>`).join('');

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${title}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,sans-serif;padding:48px;color:#111827;font-size:13px}
.hdr{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:28px;border-bottom:2px solid #6366f1;padding-bottom:14px}
h1{font-size:20px;font-weight:700}.meta{font-size:11px;color:#6b7280;margin-top:3px}
.tv{font-size:20px;font-weight:700;color:#6366f1;text-align:right}.tl{font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.06em}
table{width:100%;border-collapse:collapse}th{background:#f9fafb;text-align:left;padding:9px 12px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;border-bottom:1px solid #e5e7eb}
td{padding:9px 12px;border-bottom:1px solid #f3f4f6;vertical-align:middle}.amt{text-align:right;font-weight:600}.muted{color:#6b7280}
.badge{display:inline-block;padding:1px 7px;border-radius:9999px;background:#e0e7ff;color:#3730a3;font-size:10px;font-weight:600}
.foot{margin-top:16px;display:flex;justify-content:space-between;border-top:1px solid #e5e7eb;padding-top:10px;font-size:11px;color:#6b7280}
@media print{body{padding:24px}}</style></head><body>
<div class="hdr"><div><h1>${title}</h1><div class="meta">Generated ${new Date().toLocaleDateString('en-US',{dateStyle:'long'})} · ${expenses.length} records</div></div>
<div><div class="tl">Total</div><div class="tv">${formatCurrency(total)}</div></div></div>
<table><thead><tr><th>Date</th><th>Category</th><th style="text-align:right">Amount</th><th>Description</th></tr></thead>
<tbody>${rows}</tbody></table>
<div class="foot"><span>${expenses.length} record${expenses.length!==1?'s':''}</span><span>Total: ${formatCurrency(total)}</span></div>
<script>window.onload=()=>window.print();</script></body></html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) { window.open(URL.createObjectURL(new Blob([html],{type:'text/html'})),'_blank'); return; }
  win.document.write(html);
  win.document.close();
}

// ── Export history ────────────────────────────────────────────────────────────

export interface ExportEntry {
  id: string;
  timestamp: string;
  templateName: string;
  templateIcon: string;
  destination: string;
  destinationIcon: string;
  format: string;
  recordCount: number;
  totalAmount: number;
  status: 'completed' | 'processing' | 'scheduled';
  shareId?: string;
}

const HISTORY_KEY = 'xp-export-history';

export function getHistory(): ExportEntry[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}

export function pushHistory(entry: Omit<ExportEntry, 'id' | 'timestamp'>): ExportEntry {
  const e: ExportEntry = { ...entry, id: Math.random().toString(36).slice(2), timestamp: new Date().toISOString() };
  localStorage.setItem(HISTORY_KEY, JSON.stringify([e, ...getHistory()].slice(0, 40)));
  return e;
}

// ── Integration state ─────────────────────────────────────────────────────────

export interface Integration { connected: boolean; account?: string; lastSync?: string }
export interface Integrations {
  googleSheets: Integration;
  dropbox:      Integration;
  oneDrive:     Integration;
  notion:       Integration;
}

const INTEGRATIONS_KEY = 'xp-integrations';
const blank = (): Integrations => ({ googleSheets:{connected:false}, dropbox:{connected:false}, oneDrive:{connected:false}, notion:{connected:false} });

export function getIntegrations(): Integrations {
  try { return JSON.parse(localStorage.getItem(INTEGRATIONS_KEY) || 'null') ?? blank(); } catch { return blank(); }
}

export function saveIntegrations(s: Integrations): void {
  localStorage.setItem(INTEGRATIONS_KEY, JSON.stringify(s));
}

// ── Schedule ──────────────────────────────────────────────────────────────────

export interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  format: 'csv' | 'json' | 'pdf';
  templateId: string;
  destination: string;
  enabled: boolean;
  nextRun: string;
}

const SCHEDULE_KEY = 'xp-schedule';

export function getSchedule(): ScheduleConfig | null {
  try { return JSON.parse(localStorage.getItem(SCHEDULE_KEY) || 'null'); } catch { return null; }
}

export function saveSchedule(c: ScheduleConfig): void {
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(c));
}

export function clearSchedule(): void {
  localStorage.removeItem(SCHEDULE_KEY);
}

export function nextRunLabel(c: ScheduleConfig): string {
  const d = new Date(c.nextRun);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
    ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function buildNextRun(frequency: ScheduleConfig['frequency'], time: string): string {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  if (d <= new Date()) {
    if (frequency === 'daily')   d.setDate(d.getDate() + 1);
    if (frequency === 'weekly')  d.setDate(d.getDate() + 7);
    if (frequency === 'monthly') d.setMonth(d.getMonth() + 1);
  }
  return d.toISOString();
}

// ── Share links ───────────────────────────────────────────────────────────────

export function generateShareId(): string {
  return [Math.random(), Math.random()].map(n => n.toString(36).slice(2, 7)).join('');
}

export function shareUrl(id: string): string {
  return `https://expensetracker.app/shared/${id}`;
}
