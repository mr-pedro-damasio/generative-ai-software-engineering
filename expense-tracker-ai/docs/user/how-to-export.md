# How to Export Your Expenses

## What this does

The **Export Hub** lets you save your expense data as a file, email a report to someone, or
connect cloud storage services like Google Sheets or Dropbox. You can also set up automatic
recurring exports so your data is always backed up on your schedule.

This feature is useful for anyone who wants to:
- Back up their expense data
- Share a spending summary with an accountant, manager, or partner
- Import data into a spreadsheet or accounting tool
- File taxes or submit a reimbursement claim

---

## Before you begin

- All your expenses are stored in your browser. No account or login is required.
- Exports are generated from the data currently saved in this browser. If you use a different
  device or browser, you will see different data.
- No files or emails sent via this feature are stored on a server — exports download directly
  to your device and email sending is simulated.

---

## Opening the Export Hub

1. From any screen in ExpenseTracker, look at the top-right corner of the page.
2. Click the **Export Data** button.
3. The Export Hub drawer opens from the right side of the screen.

![Screenshot placeholder: Export Data button in the header](/docs/export/export-entry.png)
*The "Export Data" button appears in the top-right header on every screen.*
<!-- Capture: full-page header area, highlighting the "Export Data" button at the top right -->

To close the Export Hub, click the **✕** button in the top-right corner of the drawer, click
anywhere outside it, or press the **Escape** key.

---

## Using Export Templates

Templates are the fastest way to export. Each template is pre-configured with a date range,
category filter, and file format for a common use case.

1. In the Export Hub sidebar, click **Templates**.
2. Browse the available templates:

   | Template | What it includes | Format |
   |---|---|---|
   | Tax Report | All expenses year-to-date | PDF |
   | Monthly Summary | All expenses this month | CSV |
   | Category Analysis | All-time spending by category | JSON |
   | Business Expenses | Transportation, Bills, and Other — this month | PDF |
   | Quarterly Review | Last 3 months, all categories | CSV |
   | Food & Dining | Food expenses this month | CSV |

3. Each template card shows how many records it will include and the total amount.
4. Click **Export ↓** on the template you want.
5. The button shows "Exporting…" briefly, then your file downloads automatically (or the print
   dialog opens for PDF exports).

![Screenshot placeholder: Templates panel with export buttons](/docs/export/export-templates.png)
*Each template card shows the record count, total, and file format before you download.*
<!-- Capture: Export Hub open on the Templates tab, showing all 6 template cards -->

**For PDF exports:** Your browser will open a new tab and show a print dialog. Choose "Save as
PDF" in the print dialog to save the file. If the dialog does not appear, check that your
browser allows pop-ups for this site.

---

## Emailing a Report

1. In the Export Hub sidebar, click **Send & Share**.
2. Make sure the **Email Report** tab is selected.
3. Choose a template from the grid (this sets what data is included).
4. Enter the recipient's email address in the **Recipient** field.
5. Review the preview text to confirm the template, record count, total, and format look correct.
6. Click **Send Report →**.
7. Once sent, a confirmation banner appears. Click **Send another** to send to a different address.

![Screenshot placeholder: Send & Share email tab](/docs/export/export-send-email.png)
*Enter a recipient address and pick a template before sending.*
<!-- Capture: Send & Share panel with the Email Report sub-tab active, email field filled in -->

---

## Creating a Shareable Link

1. In the **Send & Share** panel, click the **Share Link** tab.
2. A unique link is already generated. Click **Copy** to copy it to your clipboard.
3. Optionally set a link expiry: **1 Day**, **7 Days**, **30 Days**, or **No Expiry**.
4. Optionally click **Show QR Code** to display a QR code you can include in documents or
   presentations.

![Screenshot placeholder: Share Link tab with QR code expanded](/docs/export/export-share-link.png)
*Copy the link or show a QR code to share it in presentations or printed reports.*
<!-- Capture: Share Link sub-tab with QR code section visible below the link field -->

> **Note:** The link is read-only. Anyone with the link can view the report but cannot edit
> your data.

---

## Connecting Cloud Services

Connect Google Sheets, Dropbox, OneDrive, or Notion to automatically back up your data.

1. In the Export Hub sidebar, click **Integrations**.
2. Find the service you want to connect and click **Connect →**.
3. After a moment the card shows a green "Connected" badge and the associated account.
4. To push an update immediately, click **↻ Sync** on the connected service.
5. To disconnect a service, click **Disconnect**.

![Screenshot placeholder: Integrations panel with one service connected](/docs/export/export-integrations.png)
*Connected services show a green badge, the linked account, and the last sync time.*
<!-- Capture: Integrations tab with one service (e.g. Google Sheets) showing the "Connected" green badge -->

Your connection preferences are saved in this browser and will still be there when you return.

---

## Setting Up Scheduled Exports

Scheduled exports automatically deliver your data on a recurring basis.

1. In the Export Hub sidebar, click **Scheduled**.
2. Choose a **Frequency**: Daily, Weekly, or Monthly.
3. Set the **Time** you want the export to run.
4. Choose a **Template** from the dropdown.
5. Choose the **Format**: CSV, JSON, or PDF.
6. Click **Save Schedule**.
7. An "Active Schedule" card appears showing the frequency, template, and the next scheduled run time.

To remove the schedule, click **Delete** on the Active Schedule card.

![Screenshot placeholder: Schedule panel with an active schedule](/docs/export/export-schedule.png)
*The active schedule card shows the next run date and time.*
<!-- Capture: Scheduled tab with the "Active Schedule" indigo card visible, showing frequency and next run -->

---

## Viewing Export History

Every export, email send, and cloud sync is recorded in the History tab.

1. In the Export Hub sidebar, click **History**.
2. Each row shows the template name, file format, destination, record count, total amount, and
   how long ago it was exported.

![Screenshot placeholder: History panel with a list of past exports](/docs/export/export-history.png)
*The History tab logs every export action from this device.*
<!-- Capture: History tab with several export rows visible, showing template name, format badge, and timestamp -->

History is stored in your browser and is limited to the 40 most recent exports.

---

## Troubleshooting

**The print dialog didn't open for a PDF export.**
Your browser may have blocked the pop-up. Look for a blocked pop-up notification in the
address bar and choose "Always allow pop-ups from this site," then try the export again.

**My exported CSV has fewer rows than expected.**
Templates filter by date range and category. Check the record count shown on the template card
before exporting to confirm how many rows are included.

**I copied the share link but it doesn't open anything.**
The shareable link feature is a preview. The link is generated for demonstration purposes and
does not point to a live page.

**I connected Google Sheets but my spreadsheet wasn't updated.**
Cloud service integrations are a preview feature. Connections are saved to your browser, but
no data is transferred to external services at this time.

**I saved a schedule but the export didn't run automatically.**
Scheduled exports display the next planned run time but do not execute automatically in this
version of the app. Use a template export to download data manually in the meantime.

**The Export Hub closed unexpectedly.**
Pressing the **Escape** key or clicking outside the drawer closes it. Reopen it with the
**Export Data** button in the header — no data is lost.

---

## Learn more

- [Developer reference: Export Hub implementation](../dev/export-implementation.md) — for
  technical readers who want to understand how the feature works under the hood
