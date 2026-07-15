"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, adminPassword, DEMO_USER, signSession } from "./session";

export type LoginState = { error?: string };

const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

/** Only allow redirecting back to an internal admin path. */
function safeDestination(from: unknown): string {
  const value = typeof from === "string" ? from : "";
  return /^\/admin(\/|$|\?)/.test(value) ? value : "/admin";
}

/** Server action: validate credentials and open a signed session cookie. */
export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const configured = adminPassword();
  if (!configured) {
    return { error: "Admin access is not configured on this server." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const ok = email.toLowerCase() === DEMO_USER.email && password === configured;
  if (!ok) {
    return { error: "Invalid email or password." };
  }

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
