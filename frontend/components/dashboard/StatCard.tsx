"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { formatCurrency } from "@/lib/utils";

export default function StatCard({
  label,
  value,
  sub,
  accent,
  delay = 0,
  icon,
}: {
  label: string;
  value: number;
  sub?: string;
  accent?: "brand" | "amber" | "slate";
  delay?: number;
  icon?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from(ref.current, {
        y: 20,
        opacity: 0,
        duration: 0.7,
        ease: "expo.out",
        delay,
      });
      // Counter animation
      const obj = { v: 0 };
      gsap.to(obj, {
        v: value,
        duration: 1.2,
        ease: "expo.out",
        delay: delay + 0.1,
        onUpdate: () => {
          if (numRef.current) {
            numRef.current.textContent = formatCurrency(obj.v);
          }
        },
      });
    });
    return () => ctx.revert();
  }, [value, delay]);

  const accentColors: Record<string, string> = {
    brand: "from-[var(--brand-400)] to-[var(--brand-600)]",
    amber: "from-amber-400 to-amber-600",
    slate: "from-slate-500 to-slate-700",
  };

  return (
    <div ref={ref} className="card p-5 md:p-6 relative overflow-hidden">
      <div
        className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 bg-gradient-to-br ${
          accentColors[accent || "brand"]
        }`}
      />
      <div className="flex items-center gap-2 text-[12px] font-medium text-ink-500 uppercase tracking-[0.08em]">
        {icon}
        <span>{label}</span>
      </div>
      <div
        ref={numRef}
        className="mt-2 text-[28px] md:text-[32px] font-semibold tracking-[-0.02em] text-ink-900 tabular-nums"
      >
        {formatCurrency(0)}
      </div>
      {sub && <div className="text-[13px] text-ink-500 mt-1">{sub}</div>}
    </div>
  );
}
