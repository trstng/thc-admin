"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function PageHeader({
  eyebrow,
  title,
  description,
  right,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  right?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    gsap.from(ref.current.querySelectorAll("[data-hero-item]"), {
      y: 14,
      opacity: 0,
      stagger: 0.06,
      duration: 0.7,
      ease: "expo.out",
    });
  }, []);
  return (
    <div
      ref={ref}
      className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6 md:mb-8"
    >
      <div>
        {eyebrow && (
          <div
            data-hero-item
            className="text-[11px] uppercase tracking-[0.12em] text-[var(--brand-800)] font-semibold mb-1.5"
          >
            {eyebrow}
          </div>
        )}
        <h1
          data-hero-item
          className="text-[28px] md:text-[36px] leading-[1.05] font-semibold tracking-[-0.02em] text-ink-900"
        >
          {title}
        </h1>
        {description && (
          <p data-hero-item className="text-ink-500 mt-2 text-[15px] max-w-xl">
            {description}
          </p>
        )}
      </div>
      {right && <div data-hero-item>{right}</div>}
    </div>
  );
}
