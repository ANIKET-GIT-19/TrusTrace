import type { HTMLAttributes, ReactNode } from "react";

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  subtle?: boolean;
  compact?: boolean;
  children: ReactNode;
}

export function GlassCard({
  subtle = false,
  compact = false,
  className = "",
  children,
  ...rest
}: GlassCardProps) {
  return (
    <div
      className={`${subtle ? "glass-card-subtle" : "glass-card"} ${
        compact ? "rounded-2xl p-4 sm:p-[18px]" : "rounded-[20px] p-[18px] sm:p-6"
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
