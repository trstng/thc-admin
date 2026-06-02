"use client";

import { cn } from "@/lib/utils";

export type Preset = "week" | "month" | "lastMonth" | "quarter" | "ytd" | "all";
export type Assigned = "both" | "amber" | "tiffany";

const PRESETS: { key: Preset; label: string }[] = [
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "lastMonth", label: "Last Month" },
  { key: "quarter", label: "This Quarter" },
  { key: "ytd", label: "YTD" },
  { key: "all", label: "All Time" },
];

const ASSIGNEES: { key: Assigned; label: string }[] = [
  { key: "both", label: "Both" },
  { key: "amber", label: "Amber" },
  { key: "tiffany", label: "Tiffany" },
];

export default function FilterBar({
  preset,
  setPreset,
  assigned,
  setAssigned,
  serviceTypes,
  selectedServices,
  setSelectedServices,
}: {
  preset: Preset;
  setPreset: (p: Preset) => void;
  assigned: Assigned;
  setAssigned: (a: Assigned) => void;
  serviceTypes: string[];
  selectedServices: string[];
  setSelectedServices: (s: string[]) => void;
}) {
  return (
    <div className="card card-tight p-3 md:p-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-6">
      {/* Presets */}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPreset(p.key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all",
              preset === p.key
                ? "bg-[var(--ink-900)] text-white shadow-sm"
                : "text-ink-600 hover:bg-[var(--ink-100)]"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="hidden md:block h-6 w-px bg-[var(--border)]" />

      {/* Assigned */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold mr-1 hidden md:inline">
          Team
        </span>
        {ASSIGNEES.map((a) => (
          <button
            key={a.key}
            onClick={() => setAssigned(a.key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all",
              assigned === a.key
                ? "bg-[var(--brand-500)] text-white"
                : "text-ink-600 hover:bg-[var(--ink-100)]"
            )}
          >
            {a.label}
          </button>
        ))}
      </div>

      {serviceTypes.length > 0 && (
        <>
          <div className="hidden md:block h-6 w-px bg-[var(--border)]" />
          <div className="flex flex-wrap gap-1.5 md:ml-auto">
            {serviceTypes.map((svc) => {
              const active = selectedServices.includes(svc);
              return (
                <button
                  key={svc}
                  onClick={() => {
                    if (active) setSelectedServices(selectedServices.filter((s) => s !== svc));
                    else setSelectedServices([...selectedServices, svc]);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all",
                    active
                      ? "bg-[var(--brand-100)] text-[var(--brand-800)]"
                      : "text-ink-500 hover:bg-[var(--ink-100)]"
                  )}
                >
                  {svc}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
