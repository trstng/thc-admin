import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";
import PortalCalendar from "./PortalCalendar";

export default async function PortalCalendarPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);

  if (!session || session.role !== "employee") redirect("/login");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">My Schedule</h1>
        <p className="text-sm text-ink-500 mt-1">Your upcoming cleaning jobs.</p>
      </div>
      <PortalCalendar employeeName={session.employeeName} />
    </div>
  );
}
