"use client";

import { useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg } from "@fullcalendar/core";
import { toast } from "sonner";
import PageHeader from "@/components/shell/PageHeader";
import Modal from "@/components/ui/Modal";
import { useFetch } from "@/lib/hooks";
import { cn, formatCurrency, formatDate, formatTime, parseAirtableDate } from "@/lib/utils";
import type {
  AirtableRecord,
  ClientFields,
  JobFields,
} from "@/lib/airtable";

type JobsResp = { data: AirtableRecord<JobFields>[] };
type ClientsResp = { data: AirtableRecord<ClientFields>[] };

const STATUS_COLORS: Record<string, string> = {
  Scheduled: "#3b82f6",
  Completed: "#10b981",
  Cancelled: "#ef4444",
  "No Show": "#94a3b8",
};

const STATUSES = ["Scheduled", "Completed", "Cancelled", "No Show"];

function paymentBadge(status?: string) {
  if (!status) return "";
  if (status === "Paid") return "💰";
  if (status === "Invoice Sent") return "📄";
  return "⏳";
}

export default function CalendarPage() {
  const { data: jobsResp } = useFetch<JobsResp>("/api/airtable/jobs");
  const { data: clientsResp } = useFetch<ClientsResp>("/api/airtable/clients");

  const jobs = jobsResp?.data || [];
  const clients = clientsResp?.data || [];

  const [assigned, setAssigned] = useState<"both" | "Amber" | "Tiffany">("both");
  const [statuses, setStatuses] = useState<string[]>(STATUSES);
  const [selected, setSelected] = useState<AirtableRecord<JobFields> | null>(null);
  const [busy, setBusy] = useState(false);

  const clientMap = useMemo(() => {
    const m = new Map<string, AirtableRecord<ClientFields>>();
    for (const c of clients) m.set(c.id, c);
    return m;
  }, [clients]);

  const events = useMemo(() => {
    return jobs
      .filter((j) => {
        const st = j.fields["Job Status"] || "";
        if (!statuses.includes(st)) return false;
        if (assigned !== "both") {
          if (!(j.fields["Assigned To"] || []).includes(assigned)) return false;
        }
        return !!(j.fields["Job Date"] || j.fields["Job Time"]);
      })
      .map((j) => {
        const clientId = (j.fields["Linked Client"] || [])[0];
        const client = clientId ? clientMap.get(clientId) : undefined;
        const clientName = client?.fields["Full Name"] || "Unknown";
        const status = j.fields["Job Status"] || "Scheduled";
        const pay = paymentBadge(j.fields["Payment Status"]);
        const jobDateParsed = parseAirtableDate(j.fields["Job Date"]);
        const isPast =
          !!jobDateParsed &&
          jobDateParsed.getTime() < Date.now() - 86400000;
        return {
          id: j.id,
          title: `${pay} ${clientName} — ${j.fields["Service Type"] || ""}`.trim(),
          start: j.fields["Job Time"] || j.fields["Job Date"],
          end: j.fields["Job End Time"] || undefined,
          backgroundColor: STATUS_COLORS[status] || "#64748b",
          borderColor: STATUS_COLORS[status] || "#64748b",
          textColor: "#ffffff",
          extendedProps: {
            record: j,
            client,
          },
          classNames: isPast ? ["opacity-70"] : [],
        };
      });
  }, [jobs, clientMap, assigned, statuses]);

  function onEventClick(arg: EventClickArg) {
    const rec = (arg.event.extendedProps as { record: AirtableRecord<JobFields> })
      .record;
    setSelected(rec);
  }

  const selectedClient = selected
    ? clientMap.get((selected.fields["Linked Client"] || [])[0])
    : null;

  async function quickReminder() {
    if (!selected || !selectedClient) return;
    setBusy(true);
    try {
      const res = await fetch("/api/sendgrid/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedClient.fields.Email,
          template: "upcoming_reminder",
          clientName: selectedClient.fields["Full Name"] || "Valued Customer",
          jobDate: formatDate(selected.fields["Job Date"]),
          jobTime: formatTime(selected.fields["Job Time"]),
          address: selectedClient.fields.Address,
          quote: selected.fields["Quoted Price"]
            ? formatCurrency(Number(selected.fields["Quoted Price"]))
            : undefined,
          clientRecordId: selectedClient.id,
          jobRecordId: selected.id,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Reminder sent");
    } catch {
      toast.error("Failed to send");
    } finally {
      setBusy(false);
    }
  }

  async function quickInvoice() {
    if (!selected || !selectedClient) return;
    const amount = Number(selected.fields["Quoted Price"]) || 0;
    if (!amount) {
      toast.error("No quoted price on this job");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/stripe/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientRecordId: selectedClient.id,
          clientName: selectedClient.fields["Full Name"],
          clientEmail: selectedClient.fields.Email,
          existingStripeCustomerId: selectedClient.fields["Stripe Customer ID"],
          jobRecordId: selected.id,
          amount,
          serviceType: selected.fields["Service Type"],
          description: `${selected.fields["Service Type"] || "Cleaning"} — ${
            selected.fields["Square Footage"] || "?"
          } sq ft`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed");
      toast.success("Invoice draft created");
    } catch (e) {
      toast.error(`Failed: ${e instanceof Error ? e.message : ""}`);
    } finally {
      setBusy(false);
    }
  }

  const addons = selected
    ? [
        "Inside Fridge",
        "Inside Oven",
        "Interior Windows",
        "Laundry or Dishes",
        "Baseboards",
        "Interior Cabinets",
        "Post Construction",
      ].filter((k) => (selected.fields as Record<string, unknown>)[k] === true)
    : [];

  return (
    <div>
      <PageHeader
        eyebrow="Schedule"
        title="Calendar"
        description="All jobs, color-coded and drag-free."
      />

      {/* Filters */}
      <div className="card card-tight p-3 md:p-4 flex flex-col md:flex-row md:items-center gap-3 mb-5">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold mr-1 hidden md:inline">
            Team
          </span>
          {(["both", "Amber", "Tiffany"] as const).map((a) => (
            <button
              key={a}
              onClick={() => setAssigned(a)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all",
                assigned === a
                  ? "bg-[var(--brand-500)] text-white"
                  : "text-ink-600 hover:bg-[var(--ink-100)]"
              )}
            >
              {a === "both" ? "Both" : a}
            </button>
          ))}
        </div>
        <div className="hidden md:block h-6 w-px bg-[var(--border)]" />
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => {
            const on = statuses.includes(s);
            return (
              <button
                key={s}
                onClick={() =>
                  setStatuses(on ? statuses.filter((x) => x !== s) : [...statuses, s])
                }
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all flex items-center gap-1.5",
                  on ? "bg-[var(--ink-100)] text-ink-800" : "text-ink-400"
                )}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: STATUS_COLORS[s] }}
                />
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card p-3 md:p-5">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          timeZone="America/Chicago"
          height="auto"
          events={events}
          eventClick={onEventClick}
          dayMaxEvents={3}
          eventDisplay="block"
        />
      </div>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={
          selected
            ? `${selectedClient?.fields["Full Name"] || "Job"} — ${
                selected.fields["Service Type"] || ""
              }`
            : ""
        }
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={quickReminder}
              disabled={busy}
            >
              Send Reminder
            </button>
            <button
              className="btn btn-primary"
              onClick={quickInvoice}
              disabled={busy}
            >
              Create Invoice
            </button>
          </>
        }
      >
        {selected && (
          <div className="space-y-3 text-sm">
            <Row label="Date">
              {formatDate(selected.fields["Job Date"])}{" "}
              {selected.fields["Job Time"] &&
                `· ${formatTime(selected.fields["Job Time"])}`}
            </Row>
            <Row label="Address">{selectedClient?.fields.Address || "—"}</Row>
            <Row label="Quoted price">
              {formatCurrency(Number(selected.fields["Quoted Price"]) || 0)}
            </Row>
            <Row label="Assigned">
              {(selected.fields["Assigned To"] || []).join(", ") || "—"}
            </Row>
            <Row label="Job status">{selected.fields["Job Status"] || "—"}</Row>
            <Row label="Payment">{selected.fields["Payment Status"] || "—"}</Row>
            {addons.length > 0 && (
              <Row label="Add-ons">
                <div className="flex flex-wrap gap-1.5">
                  {addons.map((a) => (
                    <span
                      key={a}
                      className="px-2 py-0.5 rounded-md bg-[var(--brand-50)] text-[var(--brand-800)] text-xs"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </Row>
            )}
            {selected.fields.Notes && (
              <Row label="Notes">{selected.fields.Notes}</Row>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="w-[110px] text-[11px] uppercase tracking-wider text-ink-400 font-semibold pt-0.5 shrink-0">
        {label}
      </div>
      <div className="flex-1 text-ink-800">{children}</div>
    </div>
  );
}
