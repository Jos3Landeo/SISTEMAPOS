import { ButtonHTMLAttributes, PropsWithChildren } from "react";
import clsx from "clsx";

type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & {
  variant?: "primary" | "secondary" | "danger";
  fullWidth?: boolean;
};

export function Button({
  children,
  className,
  variant = "primary",
  fullWidth = false,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        {
          "bg-brand-500 text-white hover:bg-brand-600": variant === "primary",
          "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50": variant === "secondary",
          "bg-rose-600 text-white hover:bg-rose-700": variant === "danger",
          "w-full": fullWidth,
        },
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

