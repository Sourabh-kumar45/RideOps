/** Button with four looks. Any other <button> prop passes straight through. */
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "warning" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-strong disabled:bg-stone-300",
  secondary: "border border-line bg-white text-ink hover:bg-stone-50 disabled:text-stone-400",
  warning: "bg-amber-400 text-ink hover:bg-amber-300 disabled:bg-amber-100 disabled:text-stone-400",
  ghost: "text-ink-soft hover:bg-stone-100 hover:text-ink",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
}

export function Button({ variant = "secondary", icon, className = "", children, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}
