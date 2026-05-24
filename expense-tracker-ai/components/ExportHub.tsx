'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Expense } from '@/types/expense';
import { CATEGORIES, formatCurrency } from '@/lib/utils';
import {
  TEMPLATES, ExportTemplate, ExportEntry, ScheduleConfig, Integrations,
  filterByTemplate, doExportCSV, doExportJSON, doExportPDF,
  getHistory, pushHistory, getIntegrations, saveIntegrations,
  getSchedule, saveSchedule, clearSchedule, buildNextRun, nextRunLabel,
  generateShareId, shareUrl,
} from '@/lib/exportCloud';

// ── QR Code (deterministic SVG pattern) ──────────────────────────────────────

function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function QRCode({ data }: { data: string }) {
  const N = 21;
  const cells = Array.from({ length: N * N }, (_, i) => {
    const x = i % N, y = Math.floor(i / N);
    const inTL = x < 7 && y < 7, inTR = x >= N - 7 && y < 7, inBL = x < 7 && y >= N - 7;
    if (inTL || inTR || inBL) {
      const lx = inTR ? x - (N - 7) : x;
      const ly = inBL ? y - (N - 7) : y;
      const outer = lx === 0 || lx === 6 || ly === 0 || ly === 6;
      const inner = lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4;
      return outer || inner;
    }
    return ((hashStr(data + i) >> (i % 8)) & 1) === 1;
  });
  return (
    <svg width={N * 5} height={N * 5} viewBox={`0 0 ${N} ${N}`} className="rounded-sm">
      <rect width={N} height={N} fill="white" />
      {cells.map((on, i) => on ? <rect key={i} x={i % N} y={Math.floor(i / N)} width={1} height={1} fill="#111827" /> : null)}
    </svg>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

function Badge({ label, color }: { label: string; color: string }) {
  return <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${color}`}>{label}</span>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{children}</h3>;
}

// ── Templates panel ───────────────────────────────────────────────────────────

function TemplatesPanel({ expenses, onExported }: { expenses: Expense[]; onExported: (entry: Omit<ExportEntry,'id'|'timestamp'>) => void }) {
  const [busy, setBusy]   = useState<string | null>(null);
  const [done, setDone]   = useState<string | null>(null);

  async function handleExport(t: ExportTemplate) {
    if (busy) return;
    setBusy(t.id);
    const subset = filterByTemplate(expenses, t);
    await delay(800);
    const stem = `${t.id}-${new Date().toISOString().slice(0,10)}`;
    if (t.format === 'csv')  doExportCSV(subset, stem);
    if (t.format === 'json') doExportJSON(subset, stem);
    if (t.format === 'pdf')  doExportPDF(subset, t.name, stem);
    onExported({ templateName: t.name, templateIcon: t.icon, destination: 'Download', destinationIcon: '💾', format: t.format.toUpperCase(), recordCount: subset.length, totalAmount: subset.reduce((s,e)=>s+e.amount,0), status: 'completed' });
    setBusy(null); setDone(t.id);
    await delay(2000); setDone(null);
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Export Templates</h2>
        <p className="text-sm text-gray-500 mt-1">One-click exports pre-configured for common use cases.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TEMPLATES.map(t => {
          const subset = filterByTemplate(expenses, t);
          const isBusy = busy === t.id, isDone = done === t.id;
          return (
            <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all flex gap-3">
              <div className={`w-10 h-10 rounded-xl ${t.accent} flex items-center justify-center text-lg flex-shrink-0`}>
                {t.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{t.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5 leading-tight">{t.description}</div>
                  </div>
                  <Badge label={t.format.toUpperCase()} color="bg-gray-100 text-gray-600" />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[11px] text-gray-400">{subset.length} records · {formatCurrency(subset.reduce((s,e)=>s+e.amount,0))}</span>
                  <button
                    onClick={() => handleExport(t)}
                    disabled={!!busy}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isDone ? 'bg-emerald-50 text-emerald-700' :
                      isBusy ? 'bg-indigo-50 text-indigo-500 cursor-wait' :
                      'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40'
                    }`}
                  >
                    {isBusy ? <><span className="w-3 h-3 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />Exporting…</> :
                     isDone ? <>✓ Done</> : <>Export ↓</>}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Send & Share panel ────────────────────────────────────────────────────────

function SendSharePanel({ expenses, onExported }: { expenses: Expense[]; onExported: (entry: Omit<ExportEntry,'id'|'timestamp'>) => void }) {
  const [tab, setTab]           = useState<'email' | 'link'>('email');
  const [email, setEmail]       = useState('');
  const [templateId, setTemplate] = useState(TEMPLATES[0].id);
  const [status, setStatus]     = useState<'idle'|'sending'|'sent'>('idle');
  const [shareId]               = useState(generateShareId);
  const [expiry, setExpiry]     = useState('7d');
  const [copied, setCopied]     = useState(false);
  const [showQR, setShowQR]     = useState(false);

  const tpl = TEMPLATES.find(t => t.id === templateId)!;
  const subset = filterByTemplate(expenses, tpl);
  const link = shareUrl(shareId);

  async function sendEmail() {
    if (!email || status !== 'idle') return;
    setStatus('sending');
    await delay(1800);
    onExported({ templateName: tpl.name, templateIcon: tpl.icon, destination: email, destinationIcon: '📧', format: tpl.format.toUpperCase(), recordCount: subset.length, totalAmount: subset.reduce((s,e)=>s+e.amount,0), status: 'completed', shareId });
    setStatus('sent');
  }

  function copyLink() {
    navigator.clipboard.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Send & Share</h2>
        <p className="text-sm text-gray-500 mt-1">Email a report or create a shareable link.</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(['email','link'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab===t?'bg-white text-gray-900 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>
            {t === 'email' ? '📧 Email Report' : '🔗 Share Link'}
          </button>
        ))}
      </div>

      {tab === 'email' && (
        <div className="space-y-4 max-w-md">
          <div>
            <SectionTitle>Template</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={() => { setTemplate(t.id); setStatus('idle'); }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-sm transition-all ${templateId===t.id?'border-indigo-500 bg-indigo-50 text-indigo-900':'border-gray-200 hover:border-gray-300 text-gray-700'}`}>
                  <span>{t.icon}</span>
                  <span className="truncate text-xs font-medium">{t.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <SectionTitle>Recipient</SectionTitle>
            <input type="email" placeholder="colleague@example.com" value={email} onChange={e => { setEmail(e.target.value); setStatus('idle'); }}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 leading-relaxed border border-gray-100">
            <strong className="text-gray-700">Preview:</strong> Will send <strong>{tpl.name}</strong> ({subset.length} records,{' '}
            {formatCurrency(subset.reduce((s,e)=>s+e.amount,0))}) as a <strong>{tpl.format.toUpperCase()}</strong> attachment.
          </div>
          {status === 'sent' ? (
            <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 font-medium">
              ✓ Report sent to <strong>{email}</strong>
              <button onClick={() => setStatus('idle')} className="ml-auto text-xs text-emerald-500 hover:text-emerald-700">Send another</button>
            </div>
          ) : (
            <button onClick={sendEmail} disabled={!email || status === 'sending'}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors">
              {status === 'sending' ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending…</> : <>Send Report →</>}
            </button>
          )}
        </div>
      )}

      {tab === 'link' && (
        <div className="space-y-5 max-w-md">
          <div>
            <SectionTitle>Shareable Link</SectionTitle>
            <div className="flex gap-2">
              <input readOnly value={link}
                className="flex-1 min-w-0 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-600 font-mono" />
              <button onClick={copyLink}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${copied?'bg-emerald-500 text-white':'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                {copied ? '✓' : 'Copy'}
              </button>
            </div>
          </div>
          <div>
            <SectionTitle>Link Expiry</SectionTitle>
            <div className="flex gap-2">
              {[['1d','1 Day'],['7d','7 Days'],['30d','30 Days'],['never','No Expiry']].map(([v,l]) => (
                <button key={v} onClick={() => setExpiry(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${expiry===v?'border-indigo-500 bg-indigo-50 text-indigo-700':'border-gray-200 hover:border-gray-300 text-gray-600'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <button onClick={() => setShowQR(v => !v)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              {showQR ? '▲ Hide QR Code' : '▼ Show QR Code'}
            </button>
            {showQR && (
              <div className="mt-3 flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-xl">
                <QRCode data={link} />
                <div className="text-xs text-gray-500 space-y-1">
                  <p className="font-semibold text-gray-700">Scan to open report</p>
                  <p>Share this QR code in presentations, documents, or printed reports.</p>
                  <p className="text-[10px] font-mono text-gray-400 break-all">{link}</p>
                </div>
              </div>
            )}
          </div>
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
            🔒 This link is read-only. Recipients can view but not edit your expense data.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Integrations panel ────────────────────────────────────────────────────────

const INTEGRATIONS_META = [
  { id: 'googleSheets' as const, name: 'Google Sheets', desc: 'Sync expenses to a spreadsheet', icon: '🟢', accent: 'bg-green-50 border-green-200', fakeAccount: 'you@gmail.com' },
  { id: 'dropbox'      as const, name: 'Dropbox',       desc: 'Auto-backup CSV to your Dropbox', icon: '🔵', accent: 'bg-blue-50 border-blue-200',  fakeAccount: '/ExpenseTracker/' },
  { id: 'oneDrive'     as const, name: 'OneDrive',      desc: 'Sync to Microsoft OneDrive',      icon: '🔷', accent: 'bg-sky-50 border-sky-200',   fakeAccount: 'you@outlook.com' },
  { id: 'notion'       as const, name: 'Notion',        desc: 'Push to a Notion database',       icon: '⬜', accent: 'bg-gray-50 border-gray-200',  fakeAccount: 'My Workspace' },
];

function IntegrationsPanel({ expenses }: { expenses: Expense[] }) {
  const [integrations, setIntegrations] = useState<Integrations>(getIntegrations);
  const [connecting, setConnecting]     = useState<string | null>(null);
  const [syncing, setSyncing]           = useState<string | null>(null);

  async function connect(id: keyof Integrations, fakeAccount: string) {
    setConnecting(id);
    await delay(1800);
    const next = { ...integrations, [id]: { connected: true, account: fakeAccount, lastSync: new Date().toISOString() } };
    setIntegrations(next); saveIntegrations(next); setConnecting(null);
  }

  async function sync(id: keyof Integrations) {
    setSyncing(id);
    await delay(1200);
    const next = { ...integrations, [id]: { ...integrations[id], lastSync: new Date().toISOString() } };
    setIntegrations(next); saveIntegrations(next); setSyncing(null);
  }

  function disconnect(id: keyof Integrations) {
    const next = { ...integrations, [id]: { connected: false } };
    setIntegrations(next); saveIntegrations(next);
  }

  function timeSince(iso: string): string {
    const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (secs < 5)   return 'just now';
    if (secs < 60)  return `${secs}s ago`;
    if (secs < 3600) return `${Math.floor(secs/60)}m ago`;
    return `${Math.floor(secs/3600)}h ago`;
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Integrations</h2>
        <p className="text-sm text-gray-500 mt-1">Connect cloud services to automatically sync and backup your data.</p>
      </div>
      <div className="space-y-3">
        {INTEGRATIONS_META.map(m => {
          const state = integrations[m.id];
          const isConnecting = connecting === m.id;
          const isSyncing    = syncing === m.id;
          return (
            <div key={m.id} className={`border rounded-xl p-4 transition-all ${state.connected ? m.accent : 'border-gray-200 bg-white'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-xl shadow-sm flex-shrink-0">
                  {m.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{m.name}</span>
                    {state.connected && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />Connected
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {state.connected
                      ? <><strong className="text-gray-700">{state.account}</strong> · Synced {timeSince(state.lastSync!)}</>
                      : m.desc}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {state.connected ? (
                    <>
                      <button onClick={() => sync(m.id)} disabled={!!syncing}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
                        {isSyncing ? <><span className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />Syncing…</> : '↻ Sync'}
                      </button>
                      <button onClick={() => disconnect(m.id)}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1.5">
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button onClick={() => connect(m.id, m.fakeAccount)} disabled={!!connecting}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50">
                      {isConnecting ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Connecting…</> : 'Connect →'}
                    </button>
                  )}
                </div>
              </div>
              {state.connected && m.id === 'googleSheets' && (
                <div className="mt-3 pt-3 border-t border-green-200 flex items-center gap-3 text-xs text-gray-600">
                  <span>📄 Sheet: <strong>Expense Tracker {new Date().getFullYear()}</strong></span>
                  <span className="text-gray-300">·</span>
                  <span>{expenses.length} rows synced</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Schedule panel ────────────────────────────────────────────────────────────

function SchedulePanel({ onScheduled }: { onScheduled: () => void }) {
  const [saved, setSaved]     = useState<ScheduleConfig | null>(getSchedule);
  const [freq, setFreq]       = useState<ScheduleConfig['frequency']>('weekly');
  const [time, setTime]       = useState('09:00');
  const [format, setFormat]   = useState<ScheduleConfig['format']>('csv');
  const [templateId, setTpl]  = useState(TEMPLATES[0].id);
  const [dest, setDest]       = useState('Download');
  const [saving, setSaving]   = useState(false);

  async function save() {
    setSaving(true);
    await delay(700);
    const config: ScheduleConfig = { frequency: freq, time, format, templateId, destination: dest, enabled: true, nextRun: buildNextRun(freq, time) };
    saveSchedule(config); setSaved(config); setSaving(false); onScheduled();
  }

  function remove() { clearSchedule(); setSaved(null); }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Scheduled Exports</h2>
        <p className="text-sm text-gray-500 mt-1">Set up automatic recurring exports delivered on your schedule.</p>
      </div>

      {saved && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-full mt-1" />
              <div>
                <div className="text-sm font-semibold text-indigo-900">Active Schedule</div>
                <div className="text-xs text-indigo-600 mt-0.5">
                  {saved.frequency.charAt(0).toUpperCase()+saved.frequency.slice(1)} · {TEMPLATES.find(t=>t.id===saved.templateId)?.name} · {saved.format.toUpperCase()}
                </div>
              </div>
            </div>
            <button onClick={remove} className="text-xs text-indigo-400 hover:text-red-500 transition-colors">Delete</button>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-indigo-700 bg-white border border-indigo-100 rounded-lg px-3 py-2">
            ⏰ Next run: <strong>{nextRunLabel(saved)}</strong>
          </div>
        </div>
      )}

      <div className="space-y-4 max-w-sm">
        <div>
          <SectionTitle>Frequency</SectionTitle>
          <div className="flex gap-2">
            {(['daily','weekly','monthly'] as const).map(f => (
              <button key={f} onClick={() => setFreq(f)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold border capitalize transition-all ${freq===f?'border-indigo-500 bg-indigo-50 text-indigo-700':'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div>
          <SectionTitle>Time</SectionTitle>
          <input type="time" value={time} onChange={e => setTime(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>
        <div>
          <SectionTitle>Template</SectionTitle>
          <select value={templateId} onChange={e => setTpl(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
            {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
          </select>
        </div>
        <div>
          <SectionTitle>Format</SectionTitle>
          <div className="flex gap-2">
            {(['csv','json','pdf'] as const).map(f => (
              <button key={f} onClick={() => setFormat(f)}
                className={`px-4 py-2 rounded-lg text-xs font-bold border uppercase transition-all ${format===f?'border-indigo-500 bg-indigo-50 text-indigo-700':'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <button onClick={save} disabled={saving}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
          {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</> : '⏰ Save Schedule'}
        </button>
      </div>
    </div>
  );
}

// ── History panel ─────────────────────────────────────────────────────────────

function HistoryPanel({ history }: { history: ExportEntry[] }) {
  function timeAgo(iso: string): string {
    const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (secs < 60)  return 'just now';
    if (secs < 3600) return `${Math.floor(secs/60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs/3600)}h ago`;
    return new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric' });
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Export History</h2>
        <p className="text-sm text-gray-500 mt-1">A log of every export and send action from this device.</p>
      </div>
      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
          <span className="text-4xl">📭</span>
          <p className="text-sm">No exports yet — try a template or send a report.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map(e => (
            <div key={e.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-gray-300 transition-all">
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-base flex-shrink-0">
                {e.templateIcon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 truncate">{e.templateName}</span>
                  <Badge label={e.format} color="bg-indigo-50 text-indigo-600" />
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                  <span>{e.destinationIcon} {e.destination}</span>
                  <span>·</span>
                  <span>{e.recordCount} records</span>
                  <span>·</span>
                  <span>{formatCurrency(e.totalAmount)}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  e.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                  e.status === 'scheduled' ? 'bg-amber-50 text-amber-600' :
                  'bg-blue-50 text-blue-600'
                }`}>{e.status}</div>
                <div className="text-[10px] text-gray-400 mt-1">{timeAgo(e.timestamp)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main ExportHub ────────────────────────────────────────────────────────────

type Tab = 'templates' | 'send' | 'integrations' | 'schedule' | 'history';

const NAV: { id: Tab; label: string; icon: string; hint: string }[] = [
  { id: 'templates',    label: 'Templates',    icon: '📋', hint: 'Quick exports' },
  { id: 'send',         label: 'Send & Share', icon: '📧', hint: 'Email + links'  },
  { id: 'integrations', label: 'Integrations', icon: '🔗', hint: 'Cloud services' },
  { id: 'schedule',     label: 'Scheduled',    icon: '⏰', hint: 'Auto-exports'  },
  { id: 'history',      label: 'History',      icon: '📜', hint: 'Export log'    },
];

interface Props { expenses: Expense[]; onClose: () => void }

export default function ExportHub({ expenses, onClose }: Props) {
  const [tab, setTab]       = useState<Tab>('templates');
  const [history, setHistory] = useState<ExportEntry[]>(getHistory);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const onExported = useCallback((entry: Omit<ExportEntry,'id'|'timestamp'>) => {
    const e = pushHistory(entry);
    setHistory(prev => [e, ...prev]);
  }, []);

  const onScheduled = useCallback(() => setTab('schedule'), []);

  const historyCount = history.length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative flex flex-col bg-white shadow-2xl overflow-hidden"
           style={{ width: 'min(880px, 95vw)', height: '100vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-sm">💾</div>
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-tight">Export Hub</h2>
              <p className="text-[11px] text-gray-400">{expenses.length} expenses · {formatCurrency(expenses.reduce((s,e)=>s+e.amount,0))} total</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Close">✕</button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* Sidebar nav */}
          <nav className="w-48 flex-shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col py-3 overflow-y-auto">
            {NAV.map(n => (
              <button key={n.id} onClick={() => setTab(n.id)}
                className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-left transition-all ${
                  tab === n.id
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                }`}>
                <span className="text-base w-5 text-center">{n.icon}</span>
                <div>
                  <div className="text-sm font-medium leading-tight flex items-center gap-1.5">
                    {n.label}
                    {n.id === 'history' && historyCount > 0 && (
                      <span className="text-[10px] bg-indigo-100 text-indigo-600 font-bold px-1.5 py-0.5 rounded-full">{historyCount}</span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400">{n.hint}</div>
                </div>
              </button>
            ))}
          </nav>

          {/* Content */}
          <main className="flex-1 overflow-y-auto bg-gray-50/30">
            {tab === 'templates'    && <TemplatesPanel    expenses={expenses} onExported={onExported} />}
            {tab === 'send'         && <SendSharePanel    expenses={expenses} onExported={onExported} />}
            {tab === 'integrations' && <IntegrationsPanel expenses={expenses} />}
            {tab === 'schedule'     && <SchedulePanel     onScheduled={onScheduled} />}
            {tab === 'history'      && <HistoryPanel      history={history} />}
          </main>
        </div>
      </div>
    </div>
  );
}
