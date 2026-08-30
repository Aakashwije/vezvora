"use server";

import { cookies } from "next/headers";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE,
  adminPasswordConfigured,
  DEMO_USER,
  signSession,
} from "./session";
import { verifyAdminPassword } from "./password";

export type LoginState = { error?: string };

const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
/** Failed sign-ins per key. A successful sign-in clears the entry. */
const loginFailures = new Map<string, number[]>();

/** Only allow redirecting back to an internal admin path. */
function safeDestination(from: unknown): string {
  const value = typeof from === "string" ? from : "";
  return /^\/admin(\/|$|\?)/.test(value) ? value : "/admin";
}

async function loginKey(email: string): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "local";
  return `${ip}:${email.toLowerCase()}`;
}

function recentFailures(key: string): number[] {
  const now = Date.now();
  return (loginFailures.get(key) ?? []).filter((time) => now - time < LOGIN_WINDOW_MS);
}

/**
 * Throttle brute-force guessing.
 *
 * Only failures count. A correct password clears the record, so signing in
 * repeatedly — a second device, a new browser, a session that expired — is
 * never what locks an administrator out.
 */
function lockedOut(key: string): boolean {
  const recent = recentFailures(key);
  loginFailures.set(key, recent);
  return recent.length >= MAX_LOGIN_ATTEMPTS;
}

/** Server action: validate credentials and open a signed session cookie. */
export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  if (!adminPasswordConfigured()) {
    return { error: "Admin access is not configured on this server." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const throttleKey = await loginKey(email);
  if (lockedOut(throttleKey)) {
    return { error: "Too many sign-in attempts. Please try again later." };
  }

  const ok = email.toLowerCase() === DEMO_USER.email && verifyAdminPassword(password);
  if (!ok) {
    loginFailures.set(throttleKey, [...recentFailures(throttleKey), Date.now()]);
    return { error: "Invalid email or password." };
  }
  loginFailures.delete(throttleKey);

  const token = signSession({
    email: DEMO_USER.email,
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  });
  if (!token) {
    return { error: "Admin access is not configured on this server." };
  }

  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  redirect(safeDestination(formData.get("from")));
}

/** Server action: clear the session cookie and return to login. */
export async function logout() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}
