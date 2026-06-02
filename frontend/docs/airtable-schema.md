# Tidy Home Co — Airtable Schema Reference

> **Purpose:** Single source of truth for all Airtable tables, fields, and relationships.
> Drop this file in your repo root or `/docs` so Claude Code can reference it during implementation.
>
> **Last updated:** March 15, 2026

---

## Base: Tidy Home Co

5 tables total (4 existing + 1 new for Stripe integration).

---

## 1. Clients

Stores customer information and tracks their service history.

| Field Name | Type | Details |
|---|---|---|
| Full Name | Single line text | **Primary field** |
| Email | Single line text | |
| Phone | Phone number | |
| Address | Single line text | |
| Square Footage | Number (integer) | |
| Service Type | Single select | Options: `Standard Clean`, `Deep Clean`, `Move In/Out Clean`, `Organization`, `Deep Cleaning`, `Standard Cleaning`, `Move-In/Move-Out`, `Post-Construction` |
| Frequency | Single select | Options: `One-Time`, `Weekly`, `Bi-Weekly`, `Monthly`, `Quarterly` |
| Status | Single select | Options: `New Lead`, `Quoted`, `Booked`, `Completed`, `Cancelled`, `Recurring`, `Active`, `Inactive` |
| Lead Source | Single select | Options: `Website Form`, `Booking Form`, `Referral`, `Ad`, `Website`, `Social Media`, `Flyer` |
| Notes | Long text | |
| Date Created | Date (formula) | `CREATED_TIME()` |
| Jobs | Linked record → Jobs | |
| Total Jobs (Count) | Count | Count of linked Jobs |
| Automations Log | Linked record → Automations Log | |
| Leads | Linked record → Leads | |
| **Stripe Customer ID** | **Single line text** | **🆕 Added for Stripe integration.** Stores `cus_xxxxx`. Written by Vercel API route on first invoice/subscription creation. |
| **Payments** | **Linked record → Payments** | **🆕 Links to the new Payments table.** |

---

## 2. Jobs

Tracks individual cleaning appointments and job details.

| Field Name | Type | Details |
|---|---|---|
| Job ID | Autonumber | **Primary field** (auto-generated) |
| Linked Client | Linked record → Clients | |
| Service Type | Single select | Options: `Standard Clean`, `Deep Clean`, `Move In/Out Clean`, `Organization`, `House Cleaning`, `Office Cleaning`, `Carpet Cleaning`, `Window Washing`, `Move-Out Cleaning` |
| Job Date | Date | |
| Job Time | Date | |
| Square Footage | Number (integer) | |
| Quoted Price | Number (formula) | Calculated from service type, square footage, and add-ons |
| Assigned To | Multiple select | Options: `Amber`, `Tiffany` |
| Job Status | Single select | Options: `Scheduled`, `Completed`, `Cancelled`, `No Show` |
| Payment Status | Single select | Options: `Unpaid`, `Invoice Sent`, `Paid`, `Payment Failed`, `Refunded` |
| Stripe Payment Link | Single line text | Legacy field — keep for backward compat but new flow uses Payments table |
| Recurring | Checkbox | |
| Recurrence Frequency | Single select | Options: `Weekly`, `Bi-Weekly`, `Monthly`, `Biweekly` |
| Next Job Date | Date | |
| Notes | Long text | |
| Created Time | Date (formula) | `CREATED_TIME()` |
| Last Modified Time | Date (formula) | `LAST_MODIFIED_TIME()` |
| Is Today's Job? | Number (formula) | Returns `1` if job is today |
| Days Until Job | Number (formula) | Days until Job Date |
| Job Completion Timestamp | Date (formula) | Last modified time |
| Automations Log | Linked record → Automations Log | |
| Client Address | Lookup → Clients.Address | |
| Client Email | Lookup → Clients.Email | |
| **Payments** | **Linked record → Payments** | **🆕 Links to the new Payments table.** |

### Add-on Services (all Checkbox)

| Field Name | Type |
|---|---|
| Inside Fridge | Checkbox |
| Inside Oven | Checkbox |
| Interior Windows | Checkbox |
| Laundry or Dishes | Checkbox |
| Baseboards | Checkbox |
| Interior Cabinets | Checkbox |
| Post Construction Clean Up | Checkbox |

| Field Name | Type | Details |
|---|---|---|
| Job End Time | Date | |

---

## 3. Automations Log

Tracks automated communications sent to clients.

| Field Name | Type | Details |
|---|---|---|
| Id | Autonumber | **Primary field** (auto-generated) |
| Client Name | Single line text | |
| Job ID | Number (integer) | |
| Automation Type | Single select | Options: `Booking Confirmation`, `Day-Before Reminder`, `Post-Job Follow-Up`, `Recurring Job Created`, `Review Request`, `Invoice Reminder`, `Payment Confirmation`, `Appointment Reminder`, `Follow-up`, `Survey Request` |
| Channel | Single select | Options: `Email`, `SMS`, `Phone Call` |
| Status | Single select | Options: `Sent`, `Failed`, `Success`, `Pending` |
| Related Client (Linked) | Linked record → Clients | |
| Related Job (Linked) | Linked record → Jobs | |
| Automation Note | Long text | |
| Timestamp | Date (formula) | `CREATED_TIME()` |

---

## 4. Leads

Tracks prospective customers before they become clients.

| Field Name | Type | Details |
|---|---|---|
| First Name | Single line text | **Primary field** |
| Last Name | Single line text | |
| Email | Single line text | |
| Phone | Phone number | |
| Clean Type | Single select | Options: `Office Cleaning`, `Organizational Services` |
| Description | Long text | |
| Status | Single select | Options: `New`, `Contacted`, `Quoted`, `Won`, `Lost` |
| Source | Single select | Options: `Website`, `Phone`, `Referral`, `Other` |
| Submitted At | Date | |
| Notes | Long text | |
| Quoted Amount | Number (currency, $) | |
| Linked Client | Linked record → Clients | |

---

## 5. Payments 🆕

**New table for Stripe integration.** Acts as the financial ledger — every invoice, subscription event, and payment maps to a record here. Vercel API routes create and update these records; n8n reads them for email triggers.

| Field Name | Type | Details |
|---|---|---|
| Payment ID | Autonumber | **Primary field** (auto-generated) |
| Linked Client | Linked record → Clients | |
| Linked Job | Linked record → Jobs | For one-time payments. Null for standalone subscription events. |
| Stripe Invoice ID | Single line text | `in_xxxxx` — the Stripe Invoice object ID |
| Stripe Payment Intent ID | Single line text | `pi_xxxxx` — useful for refund lookups |
| Stripe Subscription ID | Single line text | `sub_xxxxx` — populated for recurring payment records |
| Payment Type | Single select | Options: `One-Time`, `Recurring`, `Refund` |
| Amount | Number (currency, $) | Amount in dollars (converted from Stripe cents) |
| Discount Applied | Single line text | Coupon or promo code used, e.g. `FIRST20` |
| Discount Amount | Number (currency, $) | Dollar value of the discount |
| Status | Single select | Options: `Pending`, `Invoice Sent`, `Paid`, `Failed`, `Refunded`, `Void` |
| Stripe Event ID | Single line text | `evt_xxxxx` — for idempotency (prevents duplicate webhook processing) |
| Invoice URL | URL | Stripe-hosted invoice link (sendable to customer) |
| Payment Date | Date | When payment was completed |
| Created Time | Date (formula) | `CREATED_TIME()` |
| Notes | Long text | System notes — failure reasons, retry info, etc. |
| Automations Log | Linked record → Automations Log | Track emails sent about this payment |

---

## Table Relationships Summary

```
Clients ──┬── Jobs           (one-to-many)
           ├── Payments       (one-to-many)  🆕
           ├── Automations Log(one-to-many)
           └── Leads          (one-to-many)

Jobs ──────┬── Payments       (one-to-many)  🆕
           └── Automations Log(one-to-many)

Payments ──┬── Automations Log(one-to-many)  🆕
```

---

## Stripe Field Mapping Quick Reference

Use this when building Vercel API routes:

| Stripe Concept | Where It Lives in Airtable | Written By |
|---|---|---|
| Customer ID (`cus_`) | `Clients.Stripe Customer ID` | `/api/stripe/create-customer` |
| Subscription ID (`sub_`) | `Payments.Stripe Subscription ID` | `/api/stripe/create-subscription` |
| Invoice ID (`in_`) | `Payments.Stripe Invoice ID` | `/api/stripe/create-invoice` or webhook |
| Payment Intent (`pi_`) | `Payments.Stripe Payment Intent ID` | Stripe webhook handler |
| Payment status | `Payments.Status` + `Jobs.Payment Status` | Stripe webhook handler (updates both) |
| Coupon/promo code | `Payments.Discount Applied` | `/api/stripe/create-invoice` or `/api/stripe/create-subscription` |
| Invoice URL | `Payments.Invoice URL` | Stripe webhook or invoice creation route |
| Event ID (`evt_`) | `Payments.Stripe Event ID` | Stripe webhook handler (idempotency key) |

---

## Notes for Implementation

1. **Stripe Customer ID** lives on the Client record, not the Payment record, because one customer has many payments. Always check if `Stripe Customer ID` exists before creating a new Stripe customer.

2. **Jobs.Payment Status** is kept in sync with `Payments.Status` for the linked payment record. This is a denormalized convenience field so Amber and Tiffany can see payment status in the Jobs view without navigating to the Payments table.

3. **Stripe Event ID** on the Payments table is critical — before processing any Stripe webhook, query Payments for a matching `Stripe Event ID`. If it exists, skip (idempotent). If not, process and write the event ID.

4. **Discount fields** are simple text/number. We don't need a separate Coupons table because Stripe is the source of truth for coupon definitions. We just log what was applied.

5. **Payment Type = "Refund"** creates a new Payment record with a negative amount, linked to the same Job and Client. This keeps the ledger clean.
