import { NextResponse } from "next/server";
import { signSession, validateCredentials, SESSION_COOKIE } from "@/lib/auth";

const EMPLOYEE_USERS = [
  { username: "gracie", password: "tidy01", employeeName: "Gracie" },
];

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    // Check employee credentials first
    const employeeUser = EMPLOYEE_USERS.find(
      (u) => u.username === username.toLowerCase() && u.password === password
    );
    if (employeeUser) {
      const token = await signSession({
        username: employeeUser.username,
        role: "employee",
        employeeName: employeeUser.employeeName,
      });
      const res = NextResponse.json({ ok: true, username: employeeUser.username, role: "employee" });
      res.cookies.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      return res;
    }

    // Check admin credentials
    if (!validateCredentials(username, password)) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    const token = await signSession({ username, role: "admin" });
    const res = NextResponse.json({ ok: true, username, role: "admin" });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
