import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Icon, type IconName } from "./Icon";
import styles from "./Button.module.css";

type Variant = "accent" | "dark" | "outline" | "light";
type Size = "sm" | "md" | "lg";

type BaseProps = {
  variant?: Variant;
  size?: Size;
  /** Optional trailing icon. */
  icon?: IconName;
  iconSize?: number;
  block?: boolean;
  className?: string;
  children: ReactNode;
};

type AsLink = BaseProps & { href: string } & Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    keyof BaseProps | "href"
  >;

type AsButton = BaseProps & { href?: undefined } & Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    keyof BaseProps
  >;

export type ButtonProps = AsLink | AsButton;

/**
 * Polymorphic button. Renders a Next.js `Link` when an `href` is supplied
 * (external URLs fall back to a plain anchor), otherwise a native `button`.
 */
export function Button(props: ButtonProps) {
  const {
    variant = "accent",
    size = "md",
    icon,
    iconSize = 18,
    block,
    className,
    children,
    ...rest
  } = props;

  const classes = cx(
    styles.btn,
    styles[variant],
    styles[size],
    block && styles.block,
    className,
  );

  const content = (
    <>
      {children}
      {icon && <Icon name={icon} size={iconSize} className={styles.icon} />}
    </>
  );

  if ("href" in props && props.href !== undefined) {
    const { href } = props;
    const anchorRest = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
    const isInternal = href.startsWith("/");

    if (isInternal) {
      return (
        <Link href={href} className={classes} {...anchorRest}>
          {content}
        </Link>
      );
    }
    return (
      <a href={href} className={classes} {...anchorRest}>
        {content}
      </a>
    );
  }

  const buttonRest = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button className={classes} {...buttonRest}>
      {content}
    </button>
  );
}
