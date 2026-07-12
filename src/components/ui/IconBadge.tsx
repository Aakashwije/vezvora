import { cx } from "@/lib/cx";
import { Icon, type IconName } from "./Icon";
import styles from "./IconBadge.module.css";

type IconBadgeProps = {
  name: IconName;
  /** Badge box size in px. */
  size?: number;
  iconSize?: number;
  radius?: number;
  className?: string;
};

/** Soft-gradient rounded tile housing a single icon — used throughout the UI. */
export function IconBadge({
  name,
  size = 50,
  iconSize = 26,
  radius = 14,
  className,
}: IconBadgeProps) {
  return (
    <span
      className={cx(styles.badge, className)}
      style={{ width: size, height: size, borderRadius: radius }}
    >
      <Icon name={name} size={iconSize} />
    </span>
  );
}
