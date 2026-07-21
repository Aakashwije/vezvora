import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import styles from "./login.module.css";

export const metadata: Metadata = {
  title: "Sign in · Console",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className={styles.screen}>
      <div className={styles.blob} aria-hidden />
      <div className={styles.blob2} aria-hidden />
      <div className={styles.card}>
        <div className={styles.brand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.webp" alt="" className={styles.brandMark} width={34} height={27} />
          <div>
            <div className={styles.brandName}>VEZVORA</div>
            <div className={styles.brandTag}>Console</div>
          </div>
        </div>

        <h1 className={styles.heading}>Welcome back</h1>
        <p className={styles.sub}>Sign in to manage leads, content, and settings.</p>

        <Suspense>
          <LoginForm />
        </Suspense>

        <p className={styles.hint}>Authorized personnel only.</p>
        <p className={styles.back}>
          <Link href="/">← Back to site</Link>
        </p>
      </div>
    </div>
  );
}
