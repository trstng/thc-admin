import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "thc_session";
const DEFAULT_SECRET = "dev-thc-admin-secret-change-me-please-32ch!!";

function getSecret(): Uint8Array {
  const raw = process.env.AUTH_SECRET || DEFAULT_SECRET;
  return new TextEncoder().encode(raw);
}

export type Session =
  | { username: string; role: "admin"; employeeName?: undefined }
  | { username: string; role: "employee"; employeeName: string };

export async function signSession(session: Session): Promise<string> {
  const payload: Record<string, unknown> = {
    username: session.username,
    role: session.role,
  };
  if (session.role === "employee") payload.employeeName = session.employeeName;
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.username !== "string") return null;
    if (payload.role === "employee" && typeof payload.employeeName === "string") {
      return { username: payload.username, role: "employee", employeeName: payload.employeeName };
    }
    return { username: payload.username, role: "admin" };
  } catch {
    return null;
  }
}

/** Parse ADMIN_USERS env: "user:pass,user:pass" into a Map. */
export function getAdminUsers(): Map<string, string> {
  const raw =
    process.env.ADMIN_USERS ||
    "tristan:tidy2026,tiffany:tidy2026,amber:tidy2026";
  const map = new Map<string, string>();
  for (const pair of raw.split(",")) {
    const [u, p] = pair.split(":").map((s) => s.trim());
    if (u && p) map.set(u.toLowerCase(), p);
  }
  return map;
}

export function validateCredentials(username: string, password: string): boolean {
  const users = getAdminUsers();
  const expected = users.get(username.toLowerCase());
  return !!expected && expected === password;
}

export const SESSION_COOKIE = COOKIE_NAME;
