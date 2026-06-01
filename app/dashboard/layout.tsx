import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";
import Sidebar from "@/components/shell/Sidebar";
import BackgroundFX from "@/components/shell/BackgroundFX";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);

  if (!session) redirect("/login");
  if (session.role === "employee") redirect("/portal/calendar");

  return (
    <div className="relative min-h-screen">
      <BackgroundFX />
      <Sidebar username={session.username} />
      <main className="md:ml-[272px] px-4 md:px-10 py-6 md:py-10 max-w-[1400px]">
        {children}
      </main>
    </div>
  );
}
