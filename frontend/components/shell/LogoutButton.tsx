"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-ink-600 hover:text-ink-900 hover:bg-[var(--ink-100)] transition-colors"
    >
      <LogOut size={14} />
      <span>Log out</span>
    </button>
  );
}
