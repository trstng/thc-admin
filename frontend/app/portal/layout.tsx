import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";
import LogoutButton from "@/components/shell/LogoutButton";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);

  if (!session) redirect("/login");
  if (session.role === "admin") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff5f8_0%,#f7f8fa_60%,#eef0f3_100%)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[var(--brand-400)] to-[var(--brand-600)] flex items-center justify-center text-white font-bold text-sm">
              T
            </div>
            <span className="font-semibold text-sm tracking-tight text-ink-900">
              Tidy Home Co.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-ink-500">Hi, {session.username}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8">{children}</main>
    </div>
  );
}
