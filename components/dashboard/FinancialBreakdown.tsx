"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { computeBreakdown, FINANCIALS, formatCurrency } from "@/lib/utils";

export default function FinancialBreakdown({ gross }: { gross: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { expenses, afterExpenses, taxes, net } = computeBreakdown(gross);

  useEffect(() => {
    if (!ref.current) return;
    const bars = ref.current.querySelectorAll("[data-bar]");
    gsap.from(bars, {
      scaleX: 0,
      transformOrigin: "left center",
      duration: 0.9,
      ease: "expo.out",
      stagger: 0.08,
    });
  }, [gross]);

  const max = Math.max(gross, 1);
  const rows = [
    { label: "Gross revenue", value: gross, color: "var(--brand-500)", width: 100 },
    {
      label: `− Operating expenses (${Math.round(FINANCIALS.EXPENSE_RATE * 100)}%)`,
      value: -expenses,
      color: "#f59e0b",
      width: (expenses / max) * 100,
    },
    {
      label: "= Revenue after expenses",
      value: afterExpenses,
      color: "var(--brand-400)",
      width: (afterExpenses / max) * 100,
    },
    {
      label: `− Tax reserve (${Math.round(FINANCIALS.TAX_RATE * 100)}%)`,
      value: -taxes,
      color: "#ef4444",
      width: (taxes / max) * 100,
    },
    {
      label: "= Net take-home",
      value: net,
      color: "#e03131",
      width: (net / max) * 100,
    },
  ];

  return (
    <div ref={ref} className="card p-5 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.1em] text-ink-500 font-semibold">
            Waterfall
          </div>
          <h3 className="text-lg font-semibold tracking-tight">Financial breakdown</h3>
        </div>
        <div className="text-right">
          <div className="text-xs text-ink-500">Net take-home</div>
          <div className="text-xl font-semibold text-[var(--brand-700)]">
            {formatCurrency(net)}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <div className="w-[200px] md:w-[240px] text-ink-600 shrink-0 truncate">
              {r.label}
            </div>
            <div className="flex-1 relative h-7 bg-[var(--ink-100)] rounded-lg overflow-hidden">
              <div
                data-bar
                className="absolute left-0 top-0 bottom-0 rounded-lg"
                style={{
                  width: `${r.width}%`,
                  background: r.color,
                  opacity: r.value < 0 ? 0.5 : 1,
                }}
              />
            </div>
            <div className="w-[100px] text-right tabular-nums font-medium text-ink-800">
              {formatCurrency(r.value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
