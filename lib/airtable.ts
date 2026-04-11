/**
 * Airtable REST helper — lightweight, no SDK.
 * Handles pagination + a small retry on 429.
 */

export const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || "appVXhTn0jQJL2dtQ";
// env uses AIRTABLE_TOKEN; fall back to AIRTABLE_API_KEY for compatibility.
const AIRTABLE_TOKEN =
  process.env.AIRTABLE_TOKEN || process.env.AIRTABLE_API_KEY || "";

export const TABLES = {
  CLIENTS: "tblvyvVX9QGSZA8Gw",
  JOBS: "tblzePYx3JTxpiUp9",
  PAYMENTS: "tblQv7pAIQQPi0HFh",
  AUTOMATIONS_LOG: "tblrB0D6V1dt9U2wj",
} as const;

export type AirtableRecord<T = Record<string, unknown>> = {
  id: string;
  createdTime: string;
  fields: T;
};

type ListOptions = {
  filterByFormula?: string;
  sort?: { field: string; direction?: "asc" | "desc" }[];
  maxRecords?: number;
  pageSize?: number;
  fields?: string[];
  view?: string;
};

const BASE_URL = "https://api.airtable.com/v0";

function headers() {
  if (!AIRTABLE_TOKEN) {
    throw new Error("AIRTABLE_TOKEN (or AIRTABLE_API_KEY) is not set");
  }
  return {
    Authorization: `Bearer ${AIRTABLE_TOKEN}`,
    "Content-Type": "application/json",
  };
}

async function fetchWithRetry(url: string, init: RequestInit, retries = 2): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, init);
    if (res.status !== 429 && res.status < 500) return res;
    if (attempt === retries) return res;
    await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
  }
  // unreachable
  return fetch(url, init);
}

export async function getRecords<T = Record<string, unknown>>(
  tableId: string,
  options: ListOptions = {}
): Promise<AirtableRecord<T>[]> {
  const params = new URLSearchParams();
  if (options.filterByFormula) params.set("filterByFormula", options.filterByFormula);
  if (options.maxRecords) params.set("maxRecords", String(options.maxRecords));
  if (options.pageSize) params.set("pageSize", String(options.pageSize));
  if (options.view) params.set("view", options.view);
  if (options.fields) {
    for (const f of options.fields) params.append("fields[]", f);
  }
  if (options.sort) {
    options.sort.forEach((s, i) => {
      params.set(`sort[${i}][field]`, s.field);
      if (s.direction) params.set(`sort[${i}][direction]`, s.direction);
    });
  }

  const all: AirtableRecord<T>[] = [];
  let offset: string | undefined;
  do {
    const qs = new URLSearchParams(params);
    if (offset) qs.set("offset", offset);
    const url = `${BASE_URL}/${AIRTABLE_BASE_ID}/${tableId}?${qs.toString()}`;
    const res = await fetchWithRetry(url, { headers: headers(), cache: "no-store" });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Airtable list ${tableId} failed: ${res.status} ${txt}`);
    }
    const data: { records: AirtableRecord<T>[]; offset?: string } = await res.json();
    all.push(...(data.records || []));
    offset = data.offset;
    if (options.maxRecords && all.length >= options.maxRecords) break;
  } while (offset);

  return all;
}

export async function getRecord<T = Record<string, unknown>>(
  tableId: string,
  recordId: string
): Promise<AirtableRecord<T>> {
  const url = `${BASE_URL}/${AIRTABLE_BASE_ID}/${tableId}/${recordId}`;
  const res = await fetchWithRetry(url, { headers: headers(), cache: "no-store" });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Airtable get ${tableId}/${recordId} failed: ${res.status} ${txt}`);
  }
  return res.json();
}

export async function createRecord<T = Record<string, unknown>>(
  tableId: string,
  fields: Record<string, unknown>
): Promise<AirtableRecord<T>> {
  const url = `${BASE_URL}/${AIRTABLE_BASE_ID}/${tableId}`;
  const res = await fetchWithRetry(url, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ fields, typecast: true }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Airtable create ${tableId} failed: ${res.status} ${txt}`);
  }
  return res.json();
}

export async function updateRecord<T = Record<string, unknown>>(
  tableId: string,
  recordId: string,
  fields: Record<string, unknown>
): Promise<AirtableRecord<T>> {
  const url = `${BASE_URL}/${AIRTABLE_BASE_ID}/${tableId}/${recordId}`;
  const res = await fetchWithRetry(url, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ fields, typecast: true }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Airtable update ${tableId}/${recordId} failed: ${res.status} ${txt}`);
  }
  return res.json();
}

/* ─────── Typed shapes for our tables ─────── */

export type ClientFields = {
  "Full Name"?: string;
  Email?: string;
  Phone?: string;
  Address?: string;
  "Square Footage"?: number;
  "Service Type"?: string;
  Frequency?: string;
  Status?: string;
  "Lead Source"?: string;
  Notes?: string;
  Jobs?: string[];
  "Stripe Customer ID"?: string;
};

export type JobFields = {
  "Job ID"?: number;
  "Linked Client"?: string[];
  "Square Footage"?: number;
  "Quoted Price"?: number;
  "Service Type"?: string;
  "Job Date"?: string;
  "Job Time"?: string;
  "Job End Time"?: string;
  "Client Email"?: string[] | string;
  "Assigned To"?: string[];
  "Job Status"?: string;
  "Payment Status"?: string;
  "Stripe Payment Link"?: string;
  Recurring?: boolean;
  "Recurrence Frequency"?: string;
  "Next Job Date"?: string;
  Notes?: string;
  "Client Address"?: string[] | string;
  "Inside Fridge"?: boolean;
  "Inside Oven"?: boolean;
  "Interior Windows"?: boolean;
  "Laundry or Dishes"?: boolean;
  Baseboards?: boolean;
  "Interior Cabinets"?: boolean;
  "Post Construction"?: boolean;
  "Promo Code"?: string;
};

export type PaymentFields = {
  "Payment ID"?: number;
  "Linked Client"?: string[];
  "Linked Job"?: string[];
  "Stripe Invoice ID"?: string;
  Amount?: number;
  Status?: string;
  "Payment Date"?: string;
  "Invoice URL"?: string;
};

export type AutomationLogFields = {
  "Client Name"?: string;
  "Job ID"?: number;
  "Automation Type"?: string;
  Channel?: string;
  Status?: string;
  "Related Client (Linked)"?: string[];
  "Related Job (Linked)"?: string[];
  "Automation Note"?: string;
};
