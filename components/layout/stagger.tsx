import * as React from "react";

/**
 * Layout-only passthroughs. These used to be framer-motion variant trees that
 * animated each child in — a 25-row task table meant 25 animated components,
 * each with its own subscription to the parent's orchestration, re-rendering
 * on every frame of the entrance. Elements and class names are unchanged, so
 * every caller keeps its exact layout; only the per-child animation is gone.
 */
export function Stagger({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "tbody";
}) {
  const Tag = as;
  return <Tag className={className}>{children}</Tag>;
}

type StaggerItemProps = {
  children: React.ReactNode;
  className?: string;
  /** kept for call-site compatibility; no longer changes anything */
  fade?: boolean;
  as?: "div" | "tr";
} & Omit<React.HTMLAttributes<HTMLElement>, "children" | "className">;

export function StaggerItem({
  children,
  className,
  fade: _fade,
  as = "div",
  ...props
}: StaggerItemProps) {
  const Tag = as;
  return (
    <Tag className={className} {...props}>
      {children}
    </Tag>
  );
}
