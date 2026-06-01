"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import gsap from "gsap";
import { toast } from "sonner";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/dashboard";

  const cardRef = useRef<HTMLDivElement>(null);
  const orbARef = useRef<HTMLDivElement>(null);
  const orbBRef = useRef<HTMLDivElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(wordmarkRef.current, {
        y: -18,
        opacity: 0,
        duration: 0.8,
        ease: "expo.out",
      });
      gsap.from(cardRef.current, {
        y: 24,
        opacity: 0,
        duration: 0.9,
        delay: 0.15,
        ease: "expo.out",
      });
      gsap.from(".field-row", {
        y: 12,
        opacity: 0,
        stagger: 0.08,
        duration: 0.6,
        delay: 0.4,
        ease: "expo.out",
      });
      // Orb parallax loop
      gsap.to(orbARef.current, {
        x: 40,
        y: -30,
        duration: 8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
      gsap.to(orbBRef.current, {
        x: -30,
        y: 40,
        duration: 10,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    });
    return () => ctx.revert();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Invalid credentials");
        gsap.fromTo(
          cardRef.current,
          { x: -8 },
          { x: 0, duration: 0.5, ease: "elastic.out(1,0.3)" }
        );
        return;
      }
      const data = await res.json();
      toast.success("Welcome back");
      const redirect = data.role === "employee" ? "/portal/calendar" : next;
      router.push(redirect);
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center px-4 py-10">
      {/* Ambient gradient */}
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,#fff5f8_0%,#f7f8fa_60%,#eef0f3_100%)]" />
      {/* Orbs */}
      <div
        ref={orbARef}
        className="absolute -z-10 top-[-10%] left-[-5%] w-[420px] h-[420px] rounded-full blur-3xl opacity-60"
        style={{ background: "radial-gradient(circle, #f9a8c5 0%, transparent 60%)" }}
      />
      <div
        ref={orbBRef}
        className="absolute -z-10 bottom-[-15%] right-[-10%] w-[520px] h-[520px] rounded-full blur-3xl opacity-50"
        style={{ background: "radial-gradient(circle, #f48ab2 0%, transparent 60%)" }}
      />

      <div className="w-full max-w-md">
        <div ref={wordmarkRef} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[var(--brand-400)] to-[var(--brand-600)] shadow-lg shadow-[#ec6e9b]/30 flex items-center justify-center text-white font-bold">
              T
            </div>
            <div className="font-semibold text-lg tracking-tight text-ink-900">
              Tidy Home Co.
            </div>
          </div>
          <h1 className="text-[34px] leading-[1.1] font-semibold tracking-tight text-ink-900">
            Welcome back
          </h1>
          <p className="text-ink-500 mt-2 text-[15px]">
            Sign in to your operations dashboard.
          </p>
        </div>

        <div ref={cardRef} className="glass card p-7 md:p-8">
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="field-row">
              <label className="label">Username</label>
              <input
                className="input"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="amber, tiffany, or tristan"
                autoFocus
              />
            </div>
            <div className="field-row">
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {error && (
              <div className="field-row text-[13px] text-[var(--danger)] bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary h-11 mt-2 field-row"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-ink-400 mt-6">
          Tidy Home Co. · Waco, TX
        </p>
      </div>
    </div>
  );
}
