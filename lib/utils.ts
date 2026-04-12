import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Percentages used for financial breakdown. Adjust here to change everywhere. */
export const FINANCIALS = {
  EXPENSE_RATE: 0.1, // 10% operating expenses
  TAX_RATE: 0.3, // 30% tax reserve on revenue-after-expenses
};

export function computeBreakdown(gross: number) {
  const expenses = gross * FINANCIALS.EXPENSE_RATE;
  const afterExpenses = gross - expenses;
  const taxes = afterExpenses * FINANCIALS.TAX_RATE;
  const net = afterExpenses - taxes;
  return { gross, expenses, afterExpenses, taxes, net };
}

export function formatCurrency(n: number, opts: Intl.NumberFormatOptions = {}) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    ...opts,
  }).format(n || 0);
}

/**
 * Parse an Airtable field value into a Date interpreted in the LOCAL timezone.
 *
 * Airtable date-only fields come as "YYYY-MM-DD". `new Date(str)` would parse
 * those as UTC midnight, which shifts the calendar day in any non-UTC zone
 * (e.g. a job on 2026-04-11 renders as April 10 in PT). Full ISO datetime
 * strings (Airtable datetime fields like "Job Time") already carry their own
 * offset and should be parsed normally.
 */
export function parseAirtableDate(
  value: string | Date | undefined | null
): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (m) {
    // Local midnight, not UTC midnight.
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(d: string | Date | undefined | null) {
  const date = parseAirtableDate(d);
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Chicago",
  }).format(date);
}

export function formatTime(d: string | Date | undefined | null) {
  const date = parseAirtableDate(d);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  }).format(date);
}

export function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
export function endOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
export function startOfNextMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1);
}
export function endOfNextMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() + 2, 0, 23, 59, 59, 999);
}
export function startOfPrevMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() - 1, 1);
}
export function endOfPrevMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 0, 23, 59, 59, 999);
}

export function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function isBetween(d: Date | string | null | undefined, start: Date, end: Date) {
  const date = parseAirtableDate(d);
  if (!date) return false;
  return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
}
