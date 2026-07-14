"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, adminPassword, DEMO_USER } from "./session";

export type LoginState = { error?: string };

const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

/** Server action: validate credentials and open a session cookie. */
export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const ok = email.toLowerCase() === DEMO_USER.email && password === adminPassword();
  if (!ok) {
    return { error: "Invalid email or password." };
  }

  const store = await cookies();
  store.set(ADMIN_COOKIE, Buffer.from(`${email}:${Date.now()}`).toString("base64"), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  redirect("/admin");
}

/** Server action: clear the session cookie and return to login. */
export async function logout() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}
