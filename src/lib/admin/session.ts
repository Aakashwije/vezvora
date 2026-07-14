import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Admin session helpers (server-only).
 *
 * Sessions are stateless, signed (HMAC-SHA256) tokens with an expiry. The
 * signing secret and the login password both come from the environment — there
 * is no hardcoded credential, so an unconfigured deployment cannot be logged
 * into. For a larger system, replace DEMO_USER with a real user store and the
 * credential check with hashed passwords; the token contract stays the same.
 */

export const ADMIN_COOKIE = "vz_admin";

export type AdminUser = {
  name: string;
  email: string;
  role: "admin" | "editor";
};

/** The single demo operator. Replace with a user table in production. */
export const DEMO_USER: AdminUser = {
  name: "Aakash",
  email: "vezvoraa@gmail.com",
  role: "admin",
};

/** Configured admin password, or null when unset (auth then fails closed). */
export function adminPassword(): string | null {
  return process.env.ADMIN_PASSWORD ?? null;
}

/** Secret used to sign session tokens (falls back to the password if unset). */
function sessionSecret(): string | null {
  return process.env.ADMIN_SESSION_SECRET ?? process.env.ADMIN_PASSWORD ?? null;
}

type SessionPayload = { email: string; exp: number };

/** Create a signed `<body>.<sig>` token, or null when unconfigured. */
export function signSession(payload: SessionPayload): string | null {
  const secret = sessionSecret();
  if (!secret) return null;
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

/** Verify a token's signature and expiry; returns its payload or null. */
export function verifySession(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const secret = sessionSecret();
  if (!secret) return null;

  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  const given = Buffer.from(sig);
  const want = Buffer.from(expected);
  if (given.length !== want.length || !timingSafeEqual(given, want)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString(),
    ) as SessionPayload;
    if (typeof payload.exp !== "number" || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Resolve the current admin session (server components / actions). Verifies the
 * cookie's signature and expiry — a present-but-invalid cookie is treated as
 * unauthenticated. This is the real access check; middleware is only for UX.
 */
export async function getSession(): Promise<AdminUser | null> {
  const store = await cookies();
  const payload = verifySession(store.get(ADMIN_COOKIE)?.value);
  if (!payload) return null;
  return DEMO_USER;
}
