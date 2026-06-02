"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Zap,
  Users,
  Calendar as CalIcon,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/automations", label: "Automations", icon: Zap },
  { href: "/dashboard/clients", label: "Clients & Jobs", icon: Users },
  { href: "/dashboard/calendar", label: "Calendar", icon: CalIcon },
];

export default function Sidebar({ username }: { username: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!navRef.current) return;
    gsap.from(navRef.current.querySelectorAll("[data-nav-item]"), {
      x: -10,
      opacity: 0,
      stagger: 0.05,
      duration: 0.5,
      ease: "expo.out",
    });
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const NavList = (
    <div ref={navRef} className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active =
          pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            data-nav-item
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
              active
                ? "bg-white/15 text-white shadow-inner"
                : "text-white/90 hover:text-white hover:bg-white/10"
            )}
          >
            <Icon size={18} strokeWidth={2} />
            <span>{label}</span>
            {active && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--brand-400)]" />
            )}
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 glass border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--brand-400)] to-[var(--brand-600)] flex items-center justify-center text-white font-bold text-sm">
            T
          </div>
          <div className="font-semibold tracking-tight">Tidy Home Co.</div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-xl hover:bg-[var(--ink-100)]"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="absolute left-0 top-0 bottom-0 w-72 glass-dark p-6 flex flex-col text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--brand-400)] to-[var(--brand-600)] flex items-center justify-center font-bold text-sm">
                  T
                </div>
                <div className="font-semibold tracking-tight">Tidy Home Co.</div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>
            {NavList}
            <div className="mt-auto pt-6 border-t border-white/10">
              <div className="flex items-center gap-3 px-3 py-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--brand-400)] to-[var(--brand-600)] flex items-center justify-center text-sm font-semibold">
                  {username[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium capitalize">{username}</div>
                  <div className="text-xs text-white/50">Admin</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/90 hover:text-white hover:bg-white/10"
              >
                <LogOut size={18} />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 fixed left-4 top-4 bottom-4 glass-dark rounded-[22px] p-5 text-white">
        <div className="flex items-center gap-2 px-1 pb-6 mb-2 border-b border-white/10">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[var(--brand-400)] to-[var(--brand-600)] flex items-center justify-center font-bold shadow-lg shadow-[#ec6e9b]/30">
            T
          </div>
          <div>
            <div className="font-semibold tracking-tight leading-tight">Tidy Home</div>
            <div className="text-xs text-white/50 leading-tight">Operations</div>
          </div>
        </div>

        {NavList}

        <div className="mt-auto pt-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--brand-400)] to-[var(--brand-600)] flex items-center justify-center text-sm font-semibold">
              {username[0]?.toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-medium capitalize">{username}</div>
              <div className="text-xs text-white/50">Admin</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/90 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LogOut size={18} />
            <span>Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
