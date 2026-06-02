"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type ComboItem = { value: string; label: string; sublabel?: string };

export default function Combobox({
  items,
  value,
  onChange,
  placeholder = "Select…",
  className,
}: {
  items: ComboItem[];
  value: string | null;
  onChange: (v: string | null) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const selected = items.find((i) => i.value === value);
  const filtered = query
    ? items.filter(
        (i) =>
          i.label.toLowerCase().includes(query.toLowerCase()) ||
          i.sublabel?.toLowerCase().includes(query.toLowerCase())
      )
    : items;

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="input flex items-center justify-between text-left"
      >
        <span className={cn(!selected && "text-ink-400")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={16} className="text-ink-400 shrink-0 ml-2" />
      </button>
      {open && (
        <div className="absolute z-30 top-full mt-1.5 left-0 right-0 card p-1.5 max-h-[320px] overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 px-2.5 py-1.5 border-b border-[var(--border)]">
            <Search size={14} className="text-ink-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="flex-1 text-sm outline-none bg-transparent placeholder:text-ink-400"
            />
          </div>
          <div className="overflow-y-auto mt-1 flex-1">
            {filtered.length === 0 && (
              <div className="text-sm text-ink-400 px-3 py-3 text-center">
                No results
              </div>
            )}
            {filtered.map((i) => (
              <button
                key={i.value}
                type="button"
                onClick={() => {
                  onChange(i.value);
                  setOpen(false);
                  setQuery("");
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left hover:bg-[var(--ink-100)] transition-colors",
                  value === i.value && "bg-[var(--brand-50)]"
                )}
              >
                <div>
                  <div className="text-ink-900 font-medium">{i.label}</div>
                  {i.sublabel && (
                    <div className="text-xs text-ink-500">{i.sublabel}</div>
                  )}
                </div>
                {value === i.value && (
                  <Check size={14} className="text-[var(--brand-600)]" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
