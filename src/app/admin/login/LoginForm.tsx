"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { login, type LoginState } from "@/lib/admin/auth-actions";
import styles from "./login.module.css";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);
  const from = useSearchParams().get("from") ?? "/admin";

  return (
    <form className={styles.form} action={formAction}>
      <input type="hidden" name="from" value={from} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className={styles.input}
          placeholder="you@vezvora.com"
          autoComplete="username"
          required
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className={styles.input}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </div>

      {state.error && (
        <div className={styles.error} role="alert">
          <TriangleAlert size={16} />
          {state.error}
        </div>
      )}

      <button type="submit" className={styles.submit} disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
        {!pending && <ArrowRight size={18} />}
      </button>
    </form>
  );
}
