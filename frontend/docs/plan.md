# Tidy Home Co. — Admin Dashboard (Claude Code Prompt)

## Project Overview

Build a full-stack **Next.js 14+ (App Router)** admin dashboard for **Tidy Home Co.**, a residential/commercial cleaning company in Waco, TX. This is an internal operations tool for the two owners (Tiffany and Amber) and one admin (Tristan). It aggregates data from Airtable, triggers emails via SendGrid, creates Stripe invoice drafts, and provides a calendar view of all jobs — all from a single authenticated UI deployed on **Vercel**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router, TypeScript) |
| Styling | Tailwind CSS + shadcn/ui component library |
| Charts | Recharts |
| Calendar | FullCalendar (@fullcalendar/react) or react-big-calendar |
| Auth | Simple middleware-based auth with hardcoded credentials from env vars |
| Data | Airtable REST API (via `airtable` npm package or direct fetch) |
| Email | SendGrid (`@sendgrid/mail`) |
| Payments | Stripe Node SDK (`stripe`) |
| Deployment | Vercel |
| State | React Server Components where possible, client components with `useState`/`useEffect` for interactive pieces. Use SWR or React Query for client-side data fetching with caching/revalidation. |

---

## Environment Variables (.env.local)

```env
# Auth (hardcoded credentials — 3 users)
ADMIN_USERS=tristan:password1,tiffany:password2,amber:password3
AUTH_SECRET=<random-32-char-string-for-signing-session-cookie>

# Airtable
AIRTABLE_API_KEY=<personal-access-token>
AIRTABLE_BASE_ID=appVXhTn0jQJL2dtQ

# SendGrid
SENDGRID_API_KEY=<key>
SENDGRID_FROM_EMAIL=team@tidyhomecompany.com
SENDGRID_FROM_NAME=Tidy Home Co.

# Stripe
STRIPE_SECRET_KEY=<key>

# Stripe Product IDs (for invoice line items)
STRIPE_PRODUCT_STANDARD_CLEAN=prod_U9g9Dz0scXRJ4H
STRIPE_PRODUCT_DEEP_CLEAN=prod_UDoT6ea7ohCLYA
```

---

## Airtable Schema Reference

**Base ID:** `appVXhTn0jQJL2dtQ`

### Table: Clients (`tblvyvVX9QGSZA8Gw`)

| Field | ID | Type | Options |
|---|---|---|---|
| Full Name | `fldCptKGeOVkr1zIh` | singleLineText | — |
| Email | `fld9u8RyqSElxSDfC` | email | — |
| Phone | `fldoEdMst9pqobBbE` | phoneNumber | — |
| Address | `fldpAeSp3HNMUYxvB` | singleLineText | — |
| Square Footage | `fldi0lTlCEVL7hlac` | number | — |
| Service Type | `fld7reHuNcj2VYLFX` | singleSelect | Standard Clean, Deep Clean, Move In/Out Clean, Organization, Deep Cleaning, Standard Cleaning, Move-In/Move-Out, Post-Construction |
| Frequency | `fldpLAgMpwXsoayCb` | singleSelect | One-Time, Weekly, Bi-Weekly, Monthly, Quarterly |
| Status | `fld09x6I84ydyDKdm` | singleSelect | New Lead, Quoted, Booked, Completed, Cancelled, Recurring, Active, Inactive |
| Lead Source | `fld5jj6MjHsI5lv7h` | singleSelect | Website Form, Booking Form, Referral, Ad, Website, Social Media, Flyer |
| Notes | `fld82KRfo5zKjpeti` | multilineText | — |
| Jobs (linked) | `fldHebV7hh30Si2U1` | multipleRecordLinks → Jobs | — |
| Stripe Customer ID | `fldUBDmyahVDFqk0y` | singleLineText | — |

### Table: Jobs (`tblzePYx3JTxpiUp9`)

| Field | ID | Type | Options |
|---|---|---|---|
| Job ID | `fldWiFC2MqGWngxM9` | autoNumber | — |
| Linked Client | `fldEdFLkLxQaZQhht` | multipleRecordLinks → Clients | — |
| Square Footage | `fldJ8IKfPP5VCxqV9` | number | — |
| Quoted Price | `fldelu1veNmWD8OBa` | formula (returns number) | — |
| Service Type | `fldYMcyDmrpeYRjUr` | singleSelect | Standard Clean, Deep Clean, Move In/Out Clean, Organization, House Cleaning, Office Cleaning, Carpet Cleaning, Window Washing, Move-Out Cleaning |
| Job Date | `fldmvfTohcL68uWgU` | date | — |
| Job Time | `fldntAAswNwbJZfUH` | dateTime | — |
| Job End Time | `fldI0wXTMXhnenJMR` | dateTime | — |
| Client Email | `fldvFKbU6mUaNW5LC` | lookup | — |
| Assigned To | `fldpdJriNy1C2jted` | multipleSelects | Amber, Tiffany |
| Job Status | `fldeWXMU9ft0SsKcL` | singleSelect | Scheduled, Completed, Cancelled, No Show |
| Payment Status | `fld5J2nuiVOHcBUkS` | singleSelect | Unpaid, Invoice Sent, Paid, Payment Failed, Refunded |
| Stripe Payment Link | `fldstjMJllLnPbHLf` | url | — |
| Recurring | `fldNTSTbtk0H5o0Q8` | checkbox | — |
| Recurrence Frequency | `flddG9OCXOsABwsUG` | singleSelect | Weekly, Bi-Weekly, Monthly, Biweekly |
| Next Job Date | `fldpqZPWqDFfk3QBT` | date | — |
| Notes | `fldow7RBKvXgx3PGP` | multilineText | — |
| Client Address | `fldf975fcAgyDCLp6` | lookup | — |
| Add-ons (checkboxes): | | | |
| → Inside Fridge | `flddni0OuCXTnxQwf` | checkbox | — |
| → Inside Oven | `fld0ni6GBEz5WsfI1` | checkbox | — |
| → Interior Windows | `fldPXLhvmBMlO65YR` | checkbox | — |
| → Laundry or Dishes | `fldakhbREi6SQYFln` | checkbox | — |
| → Baseboards | `fldEBWRWKxqRjIuoz` | checkbox | — |
| → Interior Cabinets | `fldBPFFa7Pbmt8JOj` | checkbox | — |
| → Post Construction | `fldcPY9h92UOStmng` | checkbox | — |
| Promo Code | `fld9mRC8GdXtdm7Tt` | singleLineText | — |

### Table: Payments (`tblQv7pAIQQPi0HFh`)

| Field | ID | Type | Options |
|---|---|---|---|
| Payment ID | `fldrxgRrLY45TMbes` | autoNumber | — |
| Linked Client | `fldbZxbvERMQQbfg8` | multipleRecordLinks → Clients | — |
| Linked Job | `fldsRHCYuL9N8yM1G` | multipleRecordLinks → Jobs | — |
| Stripe Invoice ID | `fldZ0MvznjNAlBqfZ` | singleLineText | — |
| Amount | `fldQUueofGMX60TGs` | currency | — |
| Status | `fldJ5Fm6t5quwjz3S` | singleSelect | Pending, Invoice Sent, Paid, Failed, Refunded, Void |
| Payment Date | `fldjLtwoguA4On3Il` | date | — |
| Invoice URL | `fldHP8MZ7JSSjWSGk` | url | — |

### Table: Automations Log (`tblrB0D6V1dt9U2wj`)

| Field | ID | Type | Options |
|---|---|---|---|
| Client Name | `fldSh7vLFp51j27Ee` | singleLineText | — |
| Job ID | `fldkI1BGg3kUTwIwm` | number | — |
| Automation Type | `fldYGzDSAu5nwLynd` | singleSelect | Booking Confirmation, Day-Before Reminder, Post-Job Follow-Up, Recurring Job Created, Review Request, Invoice Reminder, Payment Confirmation, Appointment Reminder, Follow-up, Survey Request |
| Channel | `fldcDGL0LJiHpUkA4` | singleSelect | Email, SMS, Phone Call |
| Status | `fldUO7cTMiw1VH7OR` | singleSelect | Sent, Failed, Success, Pending |
| Related Client (Linked) | `fldMw9fEuuM9UcFAR` | multipleRecordLinks → Clients | — |
| Related Job (Linked) | `fldm10mN3PvqReuAo` | multipleRecordLinks → Jobs | — |
| Automation Note | `fld8iovCTp4SjcZzL` | multilineText | — |

---

## App Structure

```
/app
  /login                    → Login page
  /dashboard                → Main analytics dashboard (default landing after login)
  /dashboard/automations    → Email/invoice automation control panel
  /dashboard/clients        → Client + Job entry forms
  /dashboard/calendar       → Calendar view of all jobs
  /api
    /auth/login             → POST: validate credentials, set httpOnly cookie
    /auth/logout            → POST: clear cookie
    /airtable/clients       → GET: fetch all clients
    /airtable/jobs          → GET: fetch all jobs (supports query params for filtering)
    /airtable/payments      → GET: fetch all payments
    /airtable/clients/create → POST: create new client record
    /airtable/jobs/create   → POST: create new job record
    /sendgrid/send          → POST: send templated email
    /stripe/invoice         → POST: create draft invoice
/components
  /ui                       → shadcn components
  /dashboard
    /StatsCards.tsx          → KPI cards (gross rev, net, etc.)
    /RevenueChart.tsx        → Monthly revenue bar/line chart
    /UpcomingJobs.tsx        → Next 7 days job list
    /FinancialBreakdown.tsx  → Gross → expenses → taxes → net waterfall
    /FilterBar.tsx           → Date range, service type, assigned-to toggles
  /automations
    /ClientSelector.tsx      → Dropdown populated from Airtable clients
    /ActionButtons.tsx       → Email + invoice action buttons
    /AutomationLog.tsx       → Recent automation history feed
  /clients
    /ClientForm.tsx          → New client entry form
    /JobForm.tsx             → New job entry form
  /calendar
    /JobCalendar.tsx         → FullCalendar component
/lib
  /airtable.ts              → Airtable client helper (fetch, create, list)
  /sendgrid.ts              → SendGrid send helper
  /stripe.ts                → Stripe invoice creation helper
  /auth.ts                  → Cookie/session utilities
  /utils.ts                 → Financial calc helpers (expense %, tax %, projections)
/middleware.ts              → Auth check — redirect to /login if no valid session
```

---

## Page-by-Page Specifications

### 1. Login Page (`/login`)

- Clean, centered login card with Tidy Home Co. branding (use the teal/green brand palette — `#2dd4bf` primary).
- Username + password fields.
- On submit → POST to `/api/auth/login`.
- API route checks credentials against `ADMIN_USERS` env var (format: `user:pass,user:pass`).
- On success → set a signed httpOnly cookie (use `jose` or `jsonwebtoken` with `AUTH_SECRET`) containing `{ username, role: "admin" }` and redirect to `/dashboard`.
- On failure → show inline error "Invalid credentials".
- **middleware.ts** checks for this cookie on every `/dashboard/*` route. If missing/invalid → redirect to `/login`.

### 2. Dashboard — Analytics (`/dashboard`)

This is the main landing page after login. It should feel like a **financial command center**.

#### KPI Stat Cards (top row, 4-5 cards)

All data sourced from the **Jobs** and **Payments** tables:

| Card | Calculation |
|---|---|
| **Gross Revenue (All Time)** | Sum of `Quoted Price` from all Jobs where `Job Status` = "Completed" |
| **This Month Revenue** | Same filter + `Job Date` within current calendar month |
| **Last Month Revenue** | Same filter + `Job Date` within previous calendar month |
| **Projected Next Month** | Sum of `Quoted Price` from Jobs where `Job Status` = "Scheduled" AND `Job Date` falls in next calendar month |
| **Projected Next 7 Days** | Sum of `Quoted Price` from Jobs where `Job Status` = "Scheduled" AND `Job Date` within next 7 days |

#### Financial Breakdown Panel

Show a clear waterfall or stacked breakdown:

```
Gross Revenue (selected period)
  − 10% Operating Expenses    → calculated as gross × 0.10
  = Revenue After Expenses
  − 30% Tax Reserve           → calculated as (gross − expenses) × 0.30
  = Net Take-Home
```

Display this as both a visual bar/waterfall chart AND a numeric summary card. The 10% and 30% should be displayed but can be hardcoded constants (define in a config file so they're easy to change later).

#### Revenue Over Time Chart

- Recharts bar chart showing monthly gross revenue for the last 12 months.
- Each bar = sum of `Quoted Price` for completed jobs in that month.
- Optional line overlay showing the net (after expenses + tax) for comparison.

#### Upcoming Jobs (Next 7 Days)

- Table/list showing jobs in the next 7 days.
- Columns: Job Date, Client Name (resolved from linked record), Service Type, Quoted Price, Assigned To, Job Status.
- Color-code rows by status (green = Scheduled, yellow = pending payment, etc.).

#### Filter Bar

Allow filtering ALL dashboard data by:
- **Date range** picker (affects which jobs are included in calculations)
- **Service Type** toggle/multi-select
- **Assigned To** toggle (Amber / Tiffany / Both)
- **Time period tabs**: "This Week" | "This Month" | "Last Month" | "This Quarter" | "YTD" | "All Time" (quick presets that set the date range)

When filters change, all cards, charts, and tables should reactively update.

### 3. Automations Page (`/dashboard/automations`)

This is the **operations control panel** where Tiffany and Amber manually trigger emails and create invoices for a selected client.

#### Client Selector (top of page)

- Single searchable dropdown (use a combobox from shadcn/ui).
- Populated from Airtable Clients table — show `Full Name` as label, record ID as value.
- When a client is selected, show a summary card:
  - Name, Email, Phone, Address, Service Type, Frequency, Status
  - Stripe Customer ID (if exists)
  - Count of total jobs, count of upcoming scheduled jobs
  - Link to their most recent job details

#### Email Action Buttons

Once a client is selected, show a button group. Each button sends a specific email template via SendGrid. **All buttons should show a confirmation modal before sending** with a preview of the recipient email address and template name.

| Button Label | SendGrid Action | Automation Log Entry Type |
|---|---|---|
| 📧 Upcoming Cleaning Reminder | Send "upcoming cleaning" email to client's email with their next job date, time, and address | "Appointment Reminder" |
| ✅ Successfully Booked | Send "booking confirmation" email with job details | "Booking Confirmation" |
| 🏠 Cleaning Complete | Send "cleaning complete / thank you" email | "Post-Job Follow-Up" |
| ⭐ Google Review Request | Send email requesting a Google review with a direct link | "Review Request" |

**Email implementation details:**
- Use SendGrid's `@sendgrid/mail` package.
- All emails go through a single `/api/sendgrid/send` API route.
- The API route accepts: `{ to, templateType, clientName, jobDate?, jobTime?, address? }`.
- For now, build the email body as clean, branded HTML inline (not SendGrid dynamic templates). Include the Tidy Home Co. logo/name, teal accent color, and the relevant message. Keep it simple and professional.
- After a successful send, **create a record in the Automations Log table** in Airtable with the appropriate type, channel ("Email"), status ("Sent"), linked client, and linked job (if applicable).

#### Stripe Invoice Button

| Button Label | Action |
|---|---|
| 💳 Create Invoice Draft | Create a Stripe draft invoice for the selected client's next upcoming job |

**Invoice creation flow (server-side, `/api/stripe/invoice`):**

1. Look up the client's `Stripe Customer ID` from Airtable. If none exists:
   - Create a new Stripe customer using their name + email.
   - Save the Stripe Customer ID back to the client's Airtable record.
2. Create a Stripe invoice (draft, not auto-finalized) for that customer.
3. Create a one-time Stripe Price based on the job's `Quoted Price` and `Service Type`.
4. Create an invoice item attached to the invoice using that price. **Note: the `create_invoice_item` Stripe API does NOT accept a `quantity` parameter — pass the flat calculated amount directly.**
5. Return the invoice ID and dashboard URL to the frontend.
6. Show a success toast with a link to the draft invoice in Stripe dashboard.
7. Update the job's `Payment Status` in Airtable to "Invoice Sent".

#### Recent Automation Log

Below the action buttons, show a feed/table of the last 20 entries from the Automations Log table, filtered to the selected client. Columns: Timestamp, Type, Channel, Status, Note.

### 4. Client & Job Entry Forms (`/dashboard/clients`)

Two tabbed forms on this page: **"New Client"** and **"New Job"**.

#### New Client Form

Fields (matching Airtable Clients schema):

| Field | Input Type | Required | Notes |
|---|---|---|---|
| Full Name | text | ✅ | |
| Email | email | ✅ | |
| Phone | tel | ✅ | |
| Address | text | ✅ | |
| Square Footage | number | ✅ | |
| Service Type | select dropdown | ✅ | Options: Standard Clean, Deep Clean, Move In/Out Clean, Organization, Post-Construction |
| Frequency | select dropdown | ✅ | Options: One-Time, Weekly, Bi-Weekly, Monthly, Quarterly |
| Status | select dropdown | ✅ | Default to "Active" — Options: New Lead, Quoted, Booked, Completed, Cancelled, Recurring, Active, Inactive |
| Lead Source | select dropdown | | Options: Website Form, Booking Form, Referral, Ad, Website, Social Media, Flyer |
| Notes | textarea | | |

On submit → POST to `/api/airtable/clients/create` → creates record in Airtable Clients table → show success toast with the new client name → reset form.

#### New Job Form

Fields (matching Airtable Jobs schema):

| Field | Input Type | Required | Notes |
|---|---|---|---|
| Client | searchable select dropdown | ✅ | Populated from Clients table — same combobox as automations page |
| Service Type | select dropdown | ✅ | Options: Standard Clean, Deep Clean, Move In/Out Clean, Organization |
| Square Footage | number | ✅ | Auto-fill from selected client's sq ft, but allow override |
| Job Date | date picker | ✅ | |
| Job Time | time picker | ✅ | Combined with date for `Job Time` dateTime field |
| Job End Time | time picker | | |
| Assigned To | multi-select checkboxes | ✅ | Options: Amber, Tiffany |
| Recurring | checkbox toggle | | |
| Recurrence Frequency | select dropdown | | Show only if Recurring is checked — Options: Weekly, Bi-Weekly, Monthly |
| Add-ons | checkbox group | | Inside Fridge, Inside Oven, Interior Windows, Laundry or Dishes, Baseboards, Interior Cabinets, Post Construction Clean Up |
| Promo Code | text | | |
| Notes | textarea | | |

On submit → POST to `/api/airtable/jobs/create`:
- Creates record in Airtable Jobs table.
- Link it to the selected client via `Linked Client` field.
- Set `Job Status` to "Scheduled" and `Payment Status` to "Unpaid" by default.
- Show success toast → reset form (but keep the client selected for quick multi-job entry).

### 5. Calendar View (`/dashboard/calendar`)

Full-page calendar showing all jobs from Airtable.

#### Implementation

- Use **FullCalendar** (`@fullcalendar/react` with `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/interaction`).
- Support **Month**, **Week**, and **Day** views with view toggle buttons.
- Default to **Month** view.

#### Event Mapping

Each Airtable Job record becomes a calendar event:

```typescript
{
  id: record.id,
  title: `${clientName} — ${serviceType}`,
  start: jobTime || jobDate,  // use dateTime if available, fall back to date
  end: jobEndTime || undefined,
  backgroundColor: getStatusColor(jobStatus), // Scheduled=blue, Completed=green, Cancelled=red, No Show=gray
  extendedProps: { quotedPrice, assignedTo, address, paymentStatus, jobStatus }
}
```

#### Event Click → Detail Popover/Modal

When clicking a calendar event, show a modal/popover with:
- Client name, address, service type
- Job date + time
- Quoted price
- Assigned to
- Job status + payment status
- Add-ons (list any checked ones)
- Notes
- Quick action buttons: "Send Reminder Email" and "Create Invoice" (same logic as automations page)

#### Visual Indicators

- Color-code events by `Job Status` (see above).
- Show a small icon or badge for payment status (💰 = Paid, ⏳ = Unpaid, 📄 = Invoice Sent).
- Past jobs should appear slightly faded/muted compared to upcoming ones.

#### Filters

- Toggle by Assigned To (Amber / Tiffany / Both).
- Toggle by Job Status.
- These should persist across view changes.

---

## Sidebar Navigation

Use a collapsible left sidebar (shadcn sidebar component or custom):

| Icon | Label | Route |
|---|---|---|
| 📊 | Dashboard | `/dashboard` |
| ⚡ | Automations | `/dashboard/automations` |
| 👤 | Clients & Jobs | `/dashboard/clients` |
| 📅 | Calendar | `/dashboard/calendar` |
| 🚪 | Logout | POST `/api/auth/logout` → redirect to `/login` |

Show the logged-in username at the bottom of the sidebar.

---

## Design & UX Guidelines

- **Color palette:** Teal primary (`#2dd4bf` / `#14b8a6`), dark sidebar (`#1e293b` slate), white content area, green for success states, red for errors/cancelled.
- **Typography:** Use Inter or the system font stack via Tailwind defaults.
- **Dark sidebar + light content** layout (like Linear, Vercel Dashboard, etc.).
- **Loading states:** Show skeleton loaders when fetching from Airtable. Use `Suspense` boundaries where appropriate.
- **Toast notifications:** Use shadcn `toast` / `sonner` for all success/error feedback.
- **Responsive:** Must work on tablet (Tiffany and Amber may use iPads). Desktop-first but don't break on smaller screens.
- **Empty states:** If no data exists for a section, show a friendly empty state illustration or message (not a blank page).

---

## API Route Patterns

All API routes should follow this pattern:

```typescript
// /app/api/airtable/clients/route.ts
import { NextResponse } from 'next/server';
import { getAirtableRecords } from '@/lib/airtable';

export async function GET() {
  try {
    const records = await getAirtableRecords('tblvyvVX9QGSZA8Gw');
    return NextResponse.json({ data: records });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}
```

### Airtable Helper (`/lib/airtable.ts`)

- Use the Airtable REST API directly with `fetch` (avoid the heavy `airtable` npm package if possible — just use the REST API with the PAT).
- Base URL: `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableId}`
- Include helper functions:
  - `getRecords(tableId, options?)` — list with optional filterByFormula, sort, maxRecords
  - `getRecord(tableId, recordId)` — single record
  - `createRecord(tableId, fields)` — create
  - `updateRecord(tableId, recordId, fields)` — patch update
- Handle pagination (Airtable returns max 100 records per page — use `offset` to paginate through all).

### SendGrid Helper (`/lib/sendgrid.ts`)

```typescript
type EmailTemplate = 'upcoming_reminder' | 'booking_confirmation' | 'cleaning_complete' | 'review_request';

async function sendEmail(params: {
  to: string;
  template: EmailTemplate;
  clientName: string;
  jobDate?: string;
  jobTime?: string;
  address?: string;
}): Promise<void>
```

- Build HTML email bodies inline for each template type.
- Keep them clean: Tidy Home Co. header, message body, CTA button (if applicable), footer with "Tidy Home Co. | Waco, TX".
- For the Google Review Request, include a CTA button linking to the Google Business Profile review URL (placeholder for now — use `https://g.page/TidyHomeCompany/review`).

### Stripe Helper (`/lib/stripe.ts`)

```typescript
async function createDraftInvoice(params: {
  stripeCustomerId: string;
  amount: number;        // in cents
  description: string;   // e.g. "Standard Clean — 1500 sq ft"
  clientName: string;
}): Promise<{ invoiceId: string; invoiceUrl: string }>
```

The flow:
1. `stripe.invoices.create({ customer, auto_advance: false })` — creates draft
2. `stripe.prices.create({ unit_amount, currency: 'usd', product: <product_id> })` — one-time price
3. `stripe.invoiceItems.create({ customer, invoice, price })` — attach to invoice (NO quantity param)
4. Return the invoice ID and hosted invoice URL

---

## Data Fetching Strategy

- **Dashboard analytics**: Fetch all Jobs and Payments on page load via server component, compute all metrics server-side, pass to client components as props. Consider caching with `revalidate` (ISR) set to 60 seconds so the dashboard isn't hitting Airtable on every page view.
- **Automations page**: Fetch client list on load (can be cached). Fetch client details + jobs on client selection (client-side fetch).
- **Forms**: Client list for the job form dropdown can share the same cached client data. Form submissions are client-side POST requests.
- **Calendar**: Fetch all jobs (all time or last 6 months + next 6 months) on page load. Client-side navigation between months should use already-fetched data where possible.

---

## Error Handling

- Wrap all Airtable/Stripe/SendGrid calls in try-catch.
- Show user-friendly error toasts (not raw error messages).
- For Airtable rate limits (5 requests/sec), implement a simple retry with backoff in the helper.
- Log errors to console on the server side (Vercel captures these in function logs).

---

## Deployment Notes

- Deploy to Vercel via `vercel` CLI or GitHub integration.
- All env vars must be set in Vercel project settings.
- The app has no database of its own — Airtable IS the database. No migrations needed.
- First deploy should include a `/api/health` route that returns `{ status: "ok", timestamp }` for monitoring.

---

## Build Order (Suggested)

1. **Scaffold** — `npx create-next-app@latest` with TypeScript, Tailwind, App Router. Install shadcn/ui. Set up the file structure.
2. **Auth** — Login page, middleware, cookie logic. Get this working first so every subsequent page is protected.
3. **Airtable lib** — Build the helper with `getRecords`, `createRecord`, `updateRecord`. Test by fetching clients.
4. **Dashboard analytics** — KPI cards, financial breakdown, revenue chart, upcoming jobs table, filter bar.
5. **Client & Job forms** — New Client form, New Job form with client dropdown.
6. **Automations page** — Client selector, email buttons with SendGrid integration, Stripe invoice button, automation log.
7. **Calendar** — FullCalendar integration, event mapping, click-to-detail modal, filters.
8. **Polish** — Loading states, empty states, error handling, responsive tweaks, toast feedback everywhere.

---

## Important Constraints

- **No external database** — Airtable is the single source of truth. Do not introduce Supabase, Postgres, etc.
- **No complex auth provider** — No NextAuth, Clerk, Auth0. Keep it simple: env var credentials + signed cookie.
- **Quoted Price is a formula field** in Airtable — it's read-only. When creating jobs, do NOT try to write to it. It computes automatically from Square Footage × rate.
- **Stripe `create_invoice_item` does NOT accept a `quantity` parameter** — pass the full amount as `unit_amount` on the price.
- **Airtable pagination** — Always handle the `offset` token. Never assume all records come back in one page.
- **SendGrid emails are NOT using dynamic templates** — build the HTML inline in the API route for now. This keeps it self-contained without needing to set up templates in the SendGrid UI.