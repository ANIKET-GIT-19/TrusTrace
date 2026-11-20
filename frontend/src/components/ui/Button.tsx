import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[#161A18] text-[#FAF8F4] hover:bg-[#29302C] hover:-translate-y-px active:bg-[#0D100E] active:translate-y-0 shadow-[0_8px_20px_-6px_rgba(22,26,24,0.28)]",
  secondary:
    "bg-[rgba(255,255,255,0.74)] text-[#161A18] border border-[rgba(22,26,24,0.09)] backdrop-blur-md hover:bg-[rgba(255,255,255,0.92)] shadow-[0_4px_16px_-2px_rgba(22,26,24,0.06),inset_0_1px_0_rgba(255,255,255,0.85)]",
  ghost:
    "bg-transparent text-[#4A524D] hover:text-[#161A18] hover:bg-[rgba(22,26,24,0.04)]",
};

const sizeClasses: Record<ButtonSize, string> = {
  md: "h-11 px-5 text-[14px] rounded-full",
  lg: "h-12 px-6 text-[15px] rounded-full",
  icon: "h-11 w-11 p-0 rounded-full",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
