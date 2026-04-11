"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { computeBreakdown, formatCurrency } from "@/lib/utils";

export default function RevenueChart({
  data,
}: {
  data: { month: string; gross: number }[];
}) {
  const withNet = data.map((d) => ({
    ...d,
    net: computeBreakdown(d.gross).net,
  }));

  return (
    <div className="card p-5 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.1em] text-ink-500 font-semibold">
            Last 12 months
          </div>
          <h3 className="text-lg font-semibold tracking-tight">Revenue over time</h3>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-[var(--brand-500)]" />
            <span className="text-ink-500">Gross</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-[var(--brand-800)]" />
            <span className="text-ink-500">Net</span>
          </div>
        </div>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={withNet} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff8787" stopOpacity={1} />
                <stop offset="100%" stopColor="#fa5252" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(15,23,42,0.06)" />
            <XAxis
              dataKey="month"
              stroke="#94a3b8"
              tickLine={false}
              axisLine={false}
              fontSize={12}
            />
            <YAxis
              stroke="#94a3b8"
              tickLine={false}
              axisLine={false}
              fontSize={12}
              tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
            />
            <Tooltip
              cursor={{ fill: "rgba(15,23,42,0.04)" }}
              contentStyle={{
                background: "rgba(255,255,255,0.95)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(15,23,42,0.08)",
                borderRadius: "12px",
                fontSize: "12px",
                fontFamily: "var(--font-inter)",
              }}
              formatter={(value, name) => [
                formatCurrency(Number(value) || 0),
                name === "gross" ? "Gross" : "Net",
              ]}
            />
            <Bar
              dataKey="gross"
              fill="url(#grossGrad)"
              radius={[8, 8, 0, 0]}
              maxBarSize={44}
            />
            <Line
              type="monotone"
              dataKey="net"
              stroke="#115e59"
              strokeWidth={2.5}
              dot={{ fill: "#115e59", r: 3 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
