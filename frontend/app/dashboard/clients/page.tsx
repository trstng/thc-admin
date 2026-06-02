"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { UserPlus, CalendarPlus } from "lucide-react";
import PageHeader from "@/components/shell/PageHeader";
import Combobox from "@/components/ui/Combobox";
import { useFetch } from "@/lib/hooks";
import type { AirtableRecord, ClientFields } from "@/lib/airtable";
import { cn } from "@/lib/utils";

type ClientsResp = { data: AirtableRecord<ClientFields>[] };

const CLIENT_SERVICE_TYPES = [
  "Standard Clean",
  "Deep Clean",
  "Move In/Out Clean",
  "Organization",
  "Post-Construction",
];
const JOB_SERVICE_TYPES = [
  "Standard Clean",
  "Deep Clean",
  "Move In/Out Clean",
  "Organization",
];
const FREQUENCIES = ["One-Time", "Weekly", "Bi-Weekly", "Monthly", "Quarterly"];
const STATUSES = [
  "Active",
  "New Lead",
  "Quoted",
  "Booked",
  "Completed",
  "Cancelled",
  "Recurring",
  "Inactive",
];
const LEAD_SOURCES = [
  "Website Form",
  "Booking Form",
  "Referral",
  "Ad",
  "Website",
  "Social Media",
  "Flyer",
];
const ADDONS: { key: string; label: string }[] = [
  { key: "Inside Fridge", label: "Inside Fridge" },
  { key: "Inside Oven", label: "Inside Oven" },
  { key: "Interior Windows", label: "Interior Windows" },
  { key: "Laundry or Dishes", label: "Laundry or Dishes" },
  { key: "Baseboards", label: "Baseboards" },
  { key: "Interior Cabinets", label: "Interior Cabinets" },
  { key: "Post Construction", label: "Post Construction" },
];

export default function ClientsPage() {
  const [tab, setTab] = useState<"client" | "job">("client");
  const { data: clientsResp, loading } = useFetch<ClientsResp>("/api/airtable/clients");
  const clients = clientsResp?.data || [];

  return (
    <div>
      <PageHeader
        eyebrow="Data Entry"
        title="Clients & Jobs"
        description="Add a new client or create a job in seconds."
      />

      {/* Tabs */}
      <div className="card card-tight p-1.5 inline-flex mb-6">
        <TabButton active={tab === "client"} onClick={() => setTab("client")}>
          <UserPlus size={14} />
          New Client
        </TabButton>
        <TabButton active={tab === "job"} onClick={() => setTab("job")}>
          <CalendarPlus size={14} />
          New Job
        </TabButton>
      </div>

      {tab === "client" ? (
        <NewClientForm />
      ) : (
        <NewJobForm clients={clients} loading={loading} />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all",
        active
          ? "bg-[var(--ink-900)] text-white shadow-sm"
          : "text-ink-600 hover:bg-[var(--ink-100)]"
      )}
    >
      {children}
    </button>
  );
}

/* ─────────────────── Client form ─────────────────── */

function NewClientForm() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    sqft: "",
    serviceType: "Standard Clean",
    frequency: "One-Time",
    status: "Active",
    leadSource: "",
    notes: "",
  });
  const [busy, setBusy] = useState(false);

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/airtable/clients/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          "Full Name": form.fullName,
          Email: form.email,
          Phone: form.phone,
          Address: form.address,
          "Square Footage": form.sqft ? Number(form.sqft) : undefined,
          "Service Type": form.serviceType,
          Frequency: form.frequency,
          Status: form.status,
          "Lead Source": form.leadSource || undefined,
          Notes: form.notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || "Failed");
      toast.success(`Added ${form.fullName}`);
      setForm({
        fullName: "",
        email: "",
        phone: "",
        address: "",
        sqft: "",
        serviceType: "Standard Clean",
        frequency: "One-Time",
        status: "Active",
        leadSource: "",
        notes: "",
      });
    } catch (e) {
      toast.error(`Failed: ${e instanceof Error ? e.message : "error"}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card p-5 md:p-7 grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Full name" required>
        <input
          className="input"
          value={form.fullName}
          onChange={(e) => update("fullName", e.target.value)}
          required
        />
      </Field>
      <Field label="Email" required>
        <input
          type="email"
          className="input"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          required
        />
      </Field>
      <Field label="Phone" required>
        <input
          type="tel"
          className="input"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          required
        />
      </Field>
      <Field label="Address" required>
        <input
          className="input"
          value={form.address}
          onChange={(e) => update("address", e.target.value)}
          required
        />
      </Field>
      <Field label="Square footage" required>
        <input
          type="number"
          className="input"
          value={form.sqft}
          onChange={(e) => update("sqft", e.target.value)}
          required
        />
      </Field>
      <Field label="Service type" required>
        <select
          className="input"
          value={form.serviceType}
          onChange={(e) => update("serviceType", e.target.value)}
        >
          {CLIENT_SERVICE_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </Field>
      <Field label="Frequency" required>
        <select
          className="input"
          value={form.frequency}
          onChange={(e) => update("frequency", e.target.value)}
        >
          {FREQUENCIES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </Field>
      <Field label="Status" required>
        <select
          className="input"
          value={form.status}
          onChange={(e) => update("status", e.target.value)}
        >
          {STATUSES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </Field>
      <Field label="Lead source">
        <select
          className="input"
          value={form.leadSource}
          onChange={(e) => update("leadSource", e.target.value)}
        >
          <option value="">—</option>
          {LEAD_SOURCES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </Field>
      <Field label="Notes" full>
        <textarea
          className="input min-h-[90px]"
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
        />
      </Field>
      <div className="md:col-span-2 flex justify-end gap-2">
        <button type="submit" className="btn btn-primary h-11 px-5" disabled={busy}>
          {busy ? "Saving…" : "Add client"}
        </button>
      </div>
    </form>
  );
}

/* ─────────────────── Job form ─────────────────── */

function NewJobForm({
  clients,
  loading,
}: {
  clients: AirtableRecord<ClientFields>[];
  loading: boolean;
}) {
  const [clientId, setClientId] = useState<string | null>(null);
  const [form, setForm] = useState({
    serviceType: "Standard Clean",
    sqft: "",
    date: "",
    time: "",
    endTime: "",
    assigned: [] as string[],
    recurring: false,
    recurrence: "Weekly",
    addons: {} as Record<string, boolean>,
    promo: "",
    notes: "",
  });
  const [busy, setBusy] = useState(false);

  const clientItems = useMemo(
    () =>
      clients.map((c) => ({
        value: c.id,
        label: c.fields["Full Name"] || "—",
        sublabel: c.fields.Address,
      })),
    [clients]
  );

  const selected = clients.find((c) => c.id === clientId);

  // Auto-fill sqft from client
  useEffect(() => {
    if (selected?.fields["Square Footage"] && !form.sqft) {
      setForm((f) => ({ ...f, sqft: String(selected.fields["Square Footage"]) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  function toggleAssign(name: string) {
    setForm((f) => ({
      ...f,
      assigned: f.assigned.includes(name)
        ? f.assigned.filter((a) => a !== name)
        : [...f.assigned, name],
    }));
  }

  function toggleAddon(key: string) {
    setForm((f) => ({
      ...f,
      addons: { ...f.addons, [key]: !f.addons[key] },
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) {
      toast.error("Select a client");
      return;
    }
    if (!form.date) {
      toast.error("Pick a date");
      return;
    }
    setBusy(true);
    try {
      const fields: Record<string, unknown> = {
        "Linked Client": [clientId],
        "Service Type": form.serviceType,
        "Square Footage": form.sqft ? Number(form.sqft) : undefined,
        "Job Date": form.date,
        "Assigned To": form.assigned,
        Recurring: form.recurring,
        Notes: form.notes || undefined,
        "Promo Code": form.promo || undefined,
      };

      if (form.time) {
        fields["Job Time"] = `${form.date}T${form.time}:00`;
      }
      if (form.endTime) {
        fields["Job End Time"] = `${form.date}T${form.endTime}:00`;
      }
      if (form.recurring) {
        fields["Recurrence Frequency"] = form.recurrence;
      }
      for (const a of ADDONS) {
        if (form.addons[a.key]) fields[a.key] = true;
      }

      const res = await fetch("/api/airtable/jobs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || "Failed");
      toast.success("Job created");
      // Keep client selected; reset rest
      setForm({
        serviceType: "Standard Clean",
        sqft: selected?.fields["Square Footage"]
          ? String(selected.fields["Square Footage"])
          : "",
        date: "",
        time: "",
        endTime: "",
        assigned: [],
        recurring: false,
        recurrence: "Weekly",
        addons: {},
        promo: "",
        notes: "",
      });
    } catch (e) {
      toast.error(`Failed: ${e instanceof Error ? e.message : "error"}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card p-5 md:p-7 grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Client" required full>
        <Combobox
          items={clientItems}
          value={clientId}
          onChange={setClientId}
          placeholder={loading ? "Loading…" : "Select a client"}
        />
      </Field>
      <Field label="Service type" required>
        <select
          className="input"
          value={form.serviceType}
          onChange={(e) => setForm((f) => ({ ...f, serviceType: e.target.value }))}
        >
          {JOB_SERVICE_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </Field>
      <Field label="Square footage" required>
        <input
          type="number"
          className="input"
          value={form.sqft}
          onChange={(e) => setForm((f) => ({ ...f, sqft: e.target.value }))}
          required
        />
      </Field>
      <Field label="Date" required>
        <input
          type="date"
          className="input"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          required
        />
      </Field>
      <Field label="Start time">
        <input
          type="time"
          className="input"
          value={form.time}
          onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
        />
      </Field>
      <Field label="End time">
        <input
          type="time"
          className="input"
          value={form.endTime}
          onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
        />
      </Field>
      <Field label="Assigned to" required>
        <div className="flex gap-2">
          {["Amber", "Tiffany"].map((name) => {
            const on = form.assigned.includes(name);
            return (
              <button
                type="button"
                key={name}
                onClick={() => toggleAssign(name)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium border transition-all",
                  on
                    ? "bg-[var(--brand-500)] border-[var(--brand-600)] text-white"
                    : "bg-white border-[var(--border)] text-ink-600 hover:bg-[var(--ink-100)]"
                )}
              >
                {name}
              </button>
            );
          })}
        </div>
      </Field>
      <Field label="Recurring">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.recurring}
              onChange={(e) => setForm((f) => ({ ...f, recurring: e.target.checked }))}
              className="w-4 h-4 accent-[var(--brand-500)]"
            />
            Repeat
          </label>
          {form.recurring && (
            <select
              className="input !w-auto"
              value={form.recurrence}
              onChange={(e) => setForm((f) => ({ ...f, recurrence: e.target.value }))}
            >
              <option>Weekly</option>
              <option>Bi-Weekly</option>
              <option>Monthly</option>
            </select>
          )}
        </div>
      </Field>

      <Field label="Add-ons" full>
        <div className="flex flex-wrap gap-2">
          {ADDONS.map((a) => {
            const on = !!form.addons[a.key];
            return (
              <button
                type="button"
                key={a.key}
                onClick={() => toggleAddon(a.key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[13px] font-medium border transition-all",
                  on
                    ? "bg-[var(--brand-50)] border-[var(--brand-300)] text-[var(--brand-800)]"
                    : "bg-white border-[var(--border)] text-ink-600 hover:bg-[var(--ink-100)]"
                )}
              >
                {a.label}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Promo code">
        <input
          className="input"
          value={form.promo}
          onChange={(e) => setForm((f) => ({ ...f, promo: e.target.value }))}
        />
      </Field>
      <Field label="Notes" full>
        <textarea
          className="input min-h-[80px]"
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />
      </Field>

      <div className="md:col-span-2 flex justify-end gap-2">
        <button type="submit" className="btn btn-primary h-11 px-5" disabled={busy}>
          {busy ? "Creating…" : "Create job"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  full,
  children,
}: {
  label: string;
  required?: boolean;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(full && "md:col-span-2")}>
      <label className="label">
        {label}
        {required && <span className="text-[var(--danger)] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
