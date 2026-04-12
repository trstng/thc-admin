"use client";

import { useMemo, useState } from "react";
import {
  Mail,
  CheckCircle2,
  Home,
  Star,
  CreditCard,
  UserRound,
  Phone,
  MapPin,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/shell/PageHeader";
import Combobox from "@/components/ui/Combobox";
import Modal from "@/components/ui/Modal";
import { useFetch } from "@/lib/hooks";
import { formatCurrency, formatDate, formatTime, parseAirtableDate } from "@/lib/utils";
import type {
  AirtableRecord,
  ClientFields,
  JobFields,
  AutomationLogFields,
} from "@/lib/airtable";
import type { EmailTemplate } from "@/lib/sendgrid";

type ClientsResp = { data: AirtableRecord<ClientFields>[] };
type JobsResp = { data: AirtableRecord<JobFields>[] };
type LogsResp = { data: AirtableRecord<AutomationLogFields>[] };

type PendingAction =
  | { kind: "email"; template: EmailTemplate; label: string }
  | { kind: "invoice" };

const EMAIL_BUTTONS: { template: EmailTemplate; label: string; sub: string; Icon: React.ComponentType<{ size?: number }> }[] = [
  {
    template: "upcoming_reminder",
    label: "Upcoming Cleaning Reminder",
    sub: "Friendly nudge the day before",
    Icon: Mail,
  },
  {
    template: "booking_confirmation",
    label: "Successfully Booked",
    sub: "Confirmation with job details",
    Icon: CheckCircle2,
  },
  {
    template: "cleaning_complete",
    label: "Cleaning Complete",
    sub: "Thank-you after the job",
    Icon: Home,
  },
  {
    template: "review_request",
    label: "Google Review Request",
    sub: "Ask for a Google review",
    Icon: Star,
  },
];

export default function AutomationsPage() {
  const { data: clientsResp } = useFetch<ClientsResp>("/api/airtable/clients");
  const { data: jobsResp } = useFetch<JobsResp>("/api/airtable/jobs");
  const { data: logsResp } = useFetch<LogsResp>("/api/airtable/automations");

  const [selected, setSelected] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [busy, setBusy] = useState(false);

  const clients = clientsResp?.data || [];
  const jobs = jobsResp?.data || [];
  const logs = logsResp?.data || [];

  const client = clients.find((c) => c.id === selected) || null;

  const clientJobs = useMemo(() => {
    if (!client) return [] as AirtableRecord<JobFields>[];
    return jobs.filter((j) =>
      (j.fields["Linked Client"] || []).includes(client.id)
    );
  }, [client, jobs]);

  const upcomingJob = useMemo(() => {
    // Compare against local midnight today so a job scheduled for today still counts.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return clientJobs
      .filter((j) => {
        if (j.fields["Job Status"] !== "Scheduled") return false;
        const d = parseAirtableDate(j.fields["Job Date"]);
        return !!d && d.getTime() >= today.getTime();
      })
      .sort((a, b) =>
        (a.fields["Job Date"] || "").localeCompare(b.fields["Job Date"] || "")
      )[0];
  }, [clientJobs]);

  const clientLogs = useMemo(() => {
    if (!client) return [];
    return logs
      .filter((l) =>
        (l.fields["Related Client (Linked)"] || []).includes(client.id)
      )
      .sort((a, b) => b.createdTime.localeCompare(a.createdTime))
      .slice(0, 20);
  }, [logs, client]);

  async function runEmail(template: EmailTemplate) {
    if (!client) return;
    setBusy(true);
    try {
      const res = await fetch("/api/sendgrid/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: client.fields.Email,
          template,
          clientName: client.fields["Full Name"] || "Valued Customer",
          jobDate: upcomingJob?.fields["Job Date"]
            ? formatDate(upcomingJob.fields["Job Date"])
            : undefined,
          jobTime: upcomingJob?.fields["Job Time"]
            ? formatTime(upcomingJob.fields["Job Time"])
            : undefined,
          address: client.fields.Address,
          quote: upcomingJob?.fields["Quoted Price"]
            ? formatCurrency(Number(upcomingJob.fields["Quoted Price"]))
            : undefined,
          clientRecordId: client.id,
          jobRecordId: upcomingJob?.id,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.error || "Failed");
      }
      toast.success("Email sent");
    } catch (e) {
      toast.error(`Email failed: ${e instanceof Error ? e.message : "error"}`);
    } finally {
      setBusy(false);
      setPending(null);
    }
  }

  async function runInvoice() {
    if (!client) return;
    if (!upcomingJob) {
      toast.error("No upcoming scheduled job to invoice");
      setPending(null);
      return;
    }
    setBusy(true);
    try {
      const amount = Number(upcomingJob.fields["Quoted Price"]) || 0;
      if (!amount) throw new Error("Job has no quoted price");
      const res = await fetch("/api/stripe/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientRecordId: client.id,
          clientName: client.fields["Full Name"],
          clientEmail: client.fields.Email,
          existingStripeCustomerId: client.fields["Stripe Customer ID"],
          jobRecordId: upcomingJob.id,
          amount,
          serviceType: upcomingJob.fields["Service Type"],
          description: `${upcomingJob.fields["Service Type"] || "Cleaning"} — ${
            upcomingJob.fields["Square Footage"] || "?"
          } sq ft`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || "Failed");
      toast.success(
        <span>
          Invoice created —{" "}
          <a
            href={data.invoiceUrl}
            target="_blank"
            rel="noreferrer"
            className="underline font-medium"
          >
            open
          </a>
        </span>
      );
    } catch (e) {
      toast.error(`Invoice failed: ${e instanceof Error ? e.message : "error"}`);
    } finally {
      setBusy(false);
      setPending(null);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Automations"
        description="Pick a client, then fire emails or create invoices in one tap."
      />

      <div className="card p-4 md:p-5 mb-6">
        <label className="label">Select a client</label>
        <Combobox
          items={clients.map((c) => ({
            value: c.id,
            label: c.fields["Full Name"] || "—",
            sublabel: c.fields.Email,
          }))}
          value={selected}
          onChange={setSelected}
          placeholder={clients.length ? "Search clients…" : "Loading clients…"}
        />
      </div>

      {client && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
          {/* Client summary */}
          <div className="card p-5 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--brand-400)] to-[var(--brand-600)] text-white flex items-center justify-center text-lg font-semibold shadow-lg shadow-[#ec6e9b]/20">
                {(client.fields["Full Name"] || "?")[0]}
              </div>
              <div>
                <div className="font-semibold text-ink-900 tracking-tight">
                  {client.fields["Full Name"]}
                </div>
                <div className="text-xs text-ink-500">
                  {client.fields.Status || "—"} · {client.fields.Frequency || "—"}
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <Row icon={<Mail size={14} />} text={client.fields.Email} />
              <Row icon={<Phone size={14} />} text={client.fields.Phone} />
              <Row icon={<MapPin size={14} />} text={client.fields.Address} />
              <Row
                icon={<Briefcase size={14} />}
                text={client.fields["Service Type"]}
              />
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--border)] grid grid-cols-2 gap-2 text-center">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-ink-400">
                  Total jobs
                </div>
                <div className="text-lg font-semibold">{clientJobs.length}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-ink-400">
                  Upcoming
                </div>
                <div className="text-lg font-semibold">
                  {
                    clientJobs.filter(
                      (j) => j.fields["Job Status"] === "Scheduled"
                    ).length
                  }
                </div>
              </div>
            </div>
            {upcomingJob && (
              <div className="mt-4 p-3 rounded-xl bg-[var(--brand-50)] border border-[var(--brand-100)]">
                <div className="text-[11px] uppercase tracking-wider text-[var(--brand-700)] font-semibold">
                  Next job
                </div>
                <div className="text-sm font-medium text-ink-900 mt-1">
                  {formatDate(upcomingJob.fields["Job Date"])} ·{" "}
                  {upcomingJob.fields["Service Type"]}
                </div>
                <div className="text-xs text-ink-500">
                  {formatCurrency(Number(upcomingJob.fields["Quoted Price"]) || 0)}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="card p-5 lg:col-span-2">
            <div className="mb-4">
              <div className="text-[11px] uppercase tracking-[0.1em] text-ink-500 font-semibold">
                Quick actions
              </div>
              <h3 className="text-lg font-semibold tracking-tight">
                Send email or create invoice
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {EMAIL_BUTTONS.map((b) => (
                <button
                  key={b.template}
                  onClick={() =>
                    setPending({ kind: "email", template: b.template, label: b.label })
                  }
                  className="group flex items-start gap-3 p-4 rounded-2xl bg-[var(--ink-50)] hover:bg-white hover:shadow-md border border-[var(--border)] transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-[var(--border)] flex items-center justify-center shrink-0 group-hover:bg-[var(--brand-50)] group-hover:border-[var(--brand-200)] transition-colors">
                    <b.Icon size={18} />
                  </div>
                  <div>
                    <div className="font-medium text-ink-900 text-sm">{b.label}</div>
                    <div className="text-xs text-ink-500 mt-0.5">{b.sub}</div>
                  </div>
                </button>
              ))}
              <button
                onClick={() => setPending({ kind: "invoice" })}
                className="group sm:col-span-2 flex items-center justify-center gap-2 p-4 rounded-2xl btn-primary"
              >
                <CreditCard size={18} />
                <span>Create Stripe Invoice Draft</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent automations */}
      {client && (
        <div className="card p-5">
          <div className="mb-4">
            <div className="text-[11px] uppercase tracking-[0.1em] text-ink-500 font-semibold">
              History
            </div>
            <h3 className="text-lg font-semibold tracking-tight">
              Recent automations
            </h3>
          </div>
          {clientLogs.length === 0 ? (
            <div className="text-sm text-ink-500 py-6 text-center">
              No automation history for this client yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-ink-400">
                    <th className="text-left font-medium py-2">When</th>
                    <th className="text-left font-medium py-2">Type</th>
                    <th className="text-left font-medium py-2 hidden md:table-cell">
                      Channel
                    </th>
                    <th className="text-left font-medium py-2">Status</th>
                    <th className="text-left font-medium py-2 hidden md:table-cell">
                      Note
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {clientLogs.map((l) => (
                    <tr key={l.id} className="border-t border-[var(--border)]">
                      <td className="py-2.5 text-ink-600">
                        {formatDate(l.createdTime)}
                      </td>
                      <td className="py-2.5 font-medium">
                        {l.fields["Automation Type"] || "—"}
                      </td>
                      <td className="py-2.5 text-ink-600 hidden md:table-cell">
                        {l.fields.Channel || "—"}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`inline-flex text-[11px] px-2 py-0.5 rounded-md font-medium ${
                            l.fields.Status === "Sent" ||
                            l.fields.Status === "Success"
                              ? "bg-emerald-50 text-emerald-700"
                              : l.fields.Status === "Failed"
                              ? "bg-red-50 text-red-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {l.fields.Status || "—"}
                        </span>
                      </td>
                      <td className="py-2.5 text-ink-500 hidden md:table-cell truncate max-w-[240px]">
                        {l.fields["Automation Note"] || ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal
        open={!!pending}
        onClose={() => setPending(null)}
        title={
          pending?.kind === "email"
            ? `Send: ${pending.label}`
            : "Create invoice draft"
        }
        footer={
          <>
            <button
              className="btn btn-ghost"
              onClick={() => setPending(null)}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              disabled={busy}
              onClick={() => {
                if (!pending) return;
                if (pending.kind === "email") runEmail(pending.template);
                else runInvoice();
              }}
            >
              {busy ? "Working…" : "Confirm"}
            </button>
          </>
        }
      >
        {pending?.kind === "email" ? (
          <p>
            Send this email to{" "}
            <span className="font-medium text-ink-900">{client?.fields.Email}</span>{" "}
            for client{" "}
            <span className="font-medium text-ink-900">
              {client?.fields["Full Name"]}
            </span>
            ?
          </p>
        ) : (
          <p>
            Create a draft Stripe invoice for{" "}
            <span className="font-medium text-ink-900">
              {client?.fields["Full Name"]}
            </span>{" "}
            based on their next scheduled job
            {upcomingJob ? (
              <>
                {" "}
                (
                <span className="font-medium">
                  {formatCurrency(
                    Number(upcomingJob.fields["Quoted Price"]) || 0
                  )}
                </span>
                )
              </>
            ) : null}
            ?
          </p>
        )}
      </Modal>
    </div>
  );
}

function Row({ icon, text }: { icon: React.ReactNode; text?: string }) {
  return (
    <div className="flex items-center gap-2 text-ink-600">
      <span className="text-ink-400">{icon}</span>
      <span className="truncate">{text || "—"}</span>
    </div>
  );
}
