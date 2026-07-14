import { cookies } from "next/headers";

/**
 * Admin session helpers (server-only).
 *
 * NOTE: This is a lightweight cookie session for a prototype. For production,
 * swap the credential check for a real user store (hashed passwords) and sign
 * the cookie (e.g. JWT / iron-session). The route-protection contract in
 * `middleware.ts` stays the same.
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

export function adminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? "vezvora";
}

/** Reads the current admin session from the cookie (server components only). */
export async function getSession(): Promise<AdminUser | null> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  // The token simply marks an authenticated session in this prototype.
  return DEMO_USER;
}
