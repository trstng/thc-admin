"use client";

import { useMemo, useState } from "react";
import { DollarSign, TrendingUp, CalendarDays, Sparkles, Wallet } from "lucide-react";
import PageHeader from "@/components/shell/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import FinancialBreakdown from "@/components/dashboard/FinancialBreakdown";
import RevenueChart from "@/components/dashboard/RevenueChart";
import UpcomingJobs from "@/components/dashboard/UpcomingJobs";
import FilterBar, { type Preset, type Assigned } from "@/components/dashboard/FilterBar";
import { useFetch } from "@/lib/hooks";
import {
  addDays,
  endOfMonth,
  endOfPrevMonth,
  isBetween,
  startOfMonth,
  startOfNextMonth,
  endOfNextMonth,
  startOfPrevMonth,
} from "@/lib/utils";
import type { AirtableRecord, JobFields, ClientFields } from "@/lib/airtable";

type JobsResp = { data: AirtableRecord<JobFields>[] };
type ClientsResp = { data: AirtableRecord<ClientFields>[] };

function rangeForPreset(preset: Preset): { start: Date; end: Date } {
  const now = new Date();
  switch (preset) {
    case "week": {
      const start = new Date(now);
      start.setDate(start.getDate() - start.getDay());
      start.setHours(0, 0, 0, 0);
      const end = addDays(start, 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case "month":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case "lastMonth":
      return { start: startOfPrevMonth(now), end: endOfPrevMonth(now) };
    case "quarter": {
      const q = Math.floor(now.getMonth() / 3);
      return {
        start: new Date(now.getFullYear(), q * 3, 1),
        end: new Date(now.getFullYear(), q * 3 + 3, 0, 23, 59, 59, 999),
      };
    }
    case "ytd":
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
      };
    case "all":
    default:
      return { start: new Date(2000, 0, 1), end: new Date(2100, 0, 1) };
  }
}

export default function DashboardPage() {
  const { data: jobsResp, loading: jobsLoading } = useFetch<JobsResp>("/api/airtable/jobs");
  const { data: clientsResp } = useFetch<ClientsResp>("/api/airtable/clients");

  const [preset, setPreset] = useState<Preset>("month");
  const [assigned, setAssigned] = useState<Assigned>("both");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const jobs = jobsResp?.data || [];
  const clients = clientsResp?.data || [];
  const clientMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of clients) {
      m.set(c.id, c.fields["Full Name"] || "—");
    }
    return m;
  }, [clients]);

  const serviceTypes = useMemo(() => {
    const s = new Set<string>();
    for (const j of jobs) {
      const st = j.fields["Service Type"];
      if (st) s.add(st);
    }
    return Array.from(s);
  }, [jobs]);

  const { start, end } = rangeForPreset(preset);

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const date = j.fields["Job Date"];
      if (!date) return false;
      if (preset !== "all" && !isBetween(date, start, end)) return false;
      if (assigned !== "both") {
        const a = j.fields["Assigned To"] || [];
        const targetName = assigned === "amber" ? "Amber" : "Tiffany";
        if (!a.includes(targetName)) return false;
      }
      if (selectedServices.length > 0) {
        if (!selectedServices.includes(j.fields["Service Type"] || "")) return false;
      }
      return true;
    });
  }, [jobs, preset, start, end, assigned, selectedServices]);

  // Metrics
  const completed = filteredJobs.filter((j) => j.fields["Job Status"] === "Completed");
  const grossRevenue = completed.reduce(
    (acc, j) => acc + (Number(j.fields["Quoted Price"]) || 0),
    0
  );

  // All-time stable stats (not affected by filter)
  const now = new Date();
  const thisMonthRange = { start: startOfMonth(now), end: endOfMonth(now) };
  const lastMonthRange = { start: startOfPrevMonth(now), end: endOfPrevMonth(now) };
  const nextMonthRange = { start: startOfNextMonth(now), end: endOfNextMonth(now) };
  const next7 = { start: now, end: addDays(now, 7) };

  const sumCompleted = (r: { start: Date; end: Date }) =>
    jobs
      .filter(
        (j) =>
          j.fields["Job Status"] === "Completed" &&
          isBetween(j.fields["Job Date"], r.start, r.end)
      )
      .reduce((acc, j) => acc + (Number(j.fields["Quoted Price"]) || 0), 0);

  const sumScheduled = (r: { start: Date; end: Date }) =>
    jobs
      .filter(
        (j) =>
          j.fields["Job Status"] === "Scheduled" &&
          isBetween(j.fields["Job Date"], r.start, r.end)
      )
      .reduce((acc, j) => acc + (Number(j.fields["Quoted Price"]) || 0), 0);

  const thisMonth = sumCompleted(thisMonthRange);
  const lastMonth = sumCompleted(lastMonthRange);
  const projectedNextMonth = sumScheduled(nextMonthRange);
  const projectedNext7 = sumScheduled(next7);

  // Monthly chart — last 12 months
  const monthly = useMemo(() => {
    const now = new Date();
    const rows: { month: string; gross: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const e = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      const gross = jobs
        .filter(
          (j) =>
            j.fields["Job Status"] === "Completed" &&
            isBetween(j.fields["Job Date"], d, e)
        )
        .reduce((acc, j) => acc + (Number(j.fields["Quoted Price"]) || 0), 0);
      rows.push({
        month: d.toLocaleString("en-US", { month: "short" }),
        gross,
      });
    }
    return rows;
  }, [jobs]);

  // Upcoming jobs (next 7 days, scheduled)
  const upcomingJobs = useMemo(() => {
    return jobs
      .filter(
        (j) =>
          j.fields["Job Status"] === "Scheduled" &&
          isBetween(j.fields["Job Date"], now, addDays(now, 7))
      )
      .sort((a, b) =>
        (a.fields["Job Date"] || "").localeCompare(b.fields["Job Date"] || "")
      )
      .slice(0, 10)
      .map((j) => ({
        id: j.id,
        date: j.fields["Job Date"] || "",
        time: j.fields["Job Time"],
        clientName:
          (j.fields["Linked Client"] || [])
            .map((id) => clientMap.get(id))
            .filter(Boolean)
            .join(", ") || "—",
        service: j.fields["Service Type"] || "—",
        price: Number(j.fields["Quoted Price"]) || 0,
        assigned: j.fields["Assigned To"] || [],
        status: j.fields["Job Status"] || "—",
        paymentStatus: j.fields["Payment Status"] || "—",
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs, clientMap]);

  return (
    <div>
      <PageHeader
        eyebrow="Command Center"
        title="Dashboard"
        description="A real-time look at jobs, revenue, and what's next for Tidy Home Co."
      />

      <FilterBar
        preset={preset}
        setPreset={setPreset}
        assigned={assigned}
        setAssigned={setAssigned}
        serviceTypes={serviceTypes}
        selectedServices={selectedServices}
        setSelectedServices={setSelectedServices}
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-6">
        <StatCard
          label="Gross (filtered)"
          value={grossRevenue}
          sub={
            preset === "all"
              ? "All-time completed jobs"
              : `Completed in ${preset.replace(/([A-Z])/g, " $1")}`
          }
          accent="brand"
          icon={<DollarSign size={14} />}
        />
        <StatCard
          label="This Month"
          value={thisMonth}
          sub="Completed jobs"
          accent="brand"
          delay={0.05}
          icon={<CalendarDays size={14} />}
        />
        <StatCard
          label="Last Month"
          value={lastMonth}
          sub="Completed jobs"
          accent="slate"
          delay={0.1}
          icon={<Wallet size={14} />}
        />
        <StatCard
          label="Projected Next Month"
          value={projectedNextMonth}
          sub="Scheduled jobs"
          accent="brand"
          delay={0.15}
          icon={<TrendingUp size={14} />}
        />
        <StatCard
          label="Next 7 Days"
          value={projectedNext7}
          sub="Scheduled jobs"
          accent="amber"
          delay={0.2}
          icon={<Sparkles size={14} />}
        />
      </div>

      {/* Breakdown + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
        <FinancialBreakdown gross={grossRevenue} />
        <RevenueChart data={monthly} />
      </div>

      {/* Upcoming */}
      <UpcomingJobs jobs={upcomingJobs} />

      {jobsLoading && (
        <div className="text-center text-xs text-ink-400 mt-6">Syncing with Airtable…</div>
      )}
    </div>
  );
}
