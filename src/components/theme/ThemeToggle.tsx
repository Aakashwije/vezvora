"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme, type Theme } from "./ThemeProvider";
import styles from "./ThemeToggle.module.css";

const options: Array<{ value: Theme; label: string; Icon: typeof Sun }> = [
  { value: "light", label: "Use light mode", Icon: Sun },
  { value: "dark", label: "Use dark mode", Icon: Moon },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className={styles.toggle} role="group" aria-label="Color theme">
      {options.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            className={styles.option}
            aria-label={label}
            aria-pressed={active}
            title={label}
            onClick={() => setTheme(value)}
          >
            <Icon size={16} strokeWidth={2.2} aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
