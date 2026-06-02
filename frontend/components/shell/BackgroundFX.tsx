"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/** Subtle ambient background — parallax orbs + soft gradient. */
export default function BackgroundFX() {
  const a = useRef<HTMLDivElement>(null);
  const b = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(a.current, {
        x: 40,
        y: -30,
        duration: 10,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
      gsap.to(b.current, {
        x: -30,
        y: 50,
        duration: 14,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });

      // Scroll-coupled parallax on the orbs
      const onScroll = () => {
        const y = window.scrollY;
        gsap.to(a.current, { yPercent: -y * 0.04, overwrite: "auto", duration: 0.6 });
        gsap.to(b.current, { yPercent: -y * 0.07, overwrite: "auto", duration: 0.6 });
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    });
    return () => ctx.revert();
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#fff5f8_0%,#f7f8fa_40%,#eef0f3_100%)]" />
      <div
        ref={a}
        className="absolute top-[-10%] right-[-10%] w-[520px] h-[520px] rounded-full blur-[100px] opacity-50"
        style={{ background: "radial-gradient(circle, #f9a8c5 0%, transparent 60%)" }}
      />
      <div
        ref={b}
        className="absolute bottom-[-15%] left-[-5%] w-[560px] h-[560px] rounded-full blur-[120px] opacity-40"
        style={{ background: "radial-gradient(circle, #fbcfe0 0%, transparent 60%)" }}
      />
    </div>
  );
}
