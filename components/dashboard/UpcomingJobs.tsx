"use client";

import { formatCurrency, formatDate, formatTime } from "@/lib/utils";

type Job = {
  id: string;
  date: string;
  time?: string;
  clientName: string;
  service: string;
  price: number;
  assigned: string[];
  status: string;
  paymentStatus: string;
};

const STATUS_STYLES: Record<string, string> = {
  Scheduled: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
  Completed: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  Cancelled: "bg-red-50 text-red-700 ring-1 ring-red-100",
  "No Show": "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
};

export default function UpcomingJobs({ jobs }: { jobs: Job[] }) {
  return (
    <div className="card p-5 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.1em] text-ink-500 font-semibold">
            Next 7 days
          </div>
          <h3 className="text-lg font-semibold tracking-tight">Upcoming jobs</h3>
        </div>
        <div className="text-sm text-ink-500">{jobs.length} scheduled</div>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-10 text-ink-500 text-sm">
          No upcoming jobs in the next 7 days.
        </div>
      ) : (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-ink-400">
                <th className="text-left font-medium py-2 px-2">When</th>
                <th className="text-left font-medium py-2 px-2">Client</th>
                <th className="text-left font-medium py-2 px-2 hidden md:table-cell">
                  Service
                </th>
                <th className="text-left font-medium py-2 px-2 hidden md:table-cell">
                  Team
                </th>
                <th className="text-right font-medium py-2 px-2">Price</th>
                <th className="text-right font-medium py-2 px-2 hidden sm:table-cell">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr
                  key={j.id}
                  className="border-t border-[var(--border)] hover:bg-[var(--ink-50)]/60 transition-colors"
                >
                  <td className="py-3 px-2">
                    <div className="font-medium text-ink-900">{formatDate(j.date)}</div>
                    {j.time && (
                      <div className="text-xs text-ink-500">{formatTime(j.time)}</div>
                    )}
                  </td>
                  <td className="py-3 px-2 font-medium text-ink-900">{j.clientName}</td>
                  <td className="py-3 px-2 text-ink-600 hidden md:table-cell">{j.service}</td>
                  <td className="py-3 px-2 text-ink-600 hidden md:table-cell">
                    {j.assigned.join(", ")}
                  </td>
                  <td className="py-3 px-2 text-right font-medium tabular-nums">
                    {formatCurrency(j.price)}
                  </td>
                  <td className="py-3 px-2 text-right hidden sm:table-cell">
                    <span
                      className={`inline-flex text-[11px] px-2 py-1 rounded-md font-medium ${
                        STATUS_STYLES[j.status] || "bg-slate-50 text-slate-600"
                      }`}
                    >
                      {j.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
