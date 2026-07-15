import { cx } from "@/lib/cx";
import styles from "./admin.module.css";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

type AvatarProps = {
  name: string;
  color?: string;
  size?: number;
  className?: string;
};

export function Avatar({ name, color = "#28b85f", size = 32, className }: AvatarProps) {
  return (
    <span
      className={cx(styles.avatar, className)}
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
      title={name}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
