"use client";

import {
  cloneElement,
  isValidElement,
  type ButtonHTMLAttributes,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonChildProps = {
  className?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  tabIndex?: number;
  "aria-disabled"?: boolean;
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  asChild?: boolean;
  children: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-[#121F38] text-white hover:bg-[#1A2D4F]",
  secondary: "border border-[#C4CAD6] text-[#121F38] hover:bg-[#F4F5F8]",
  ghost: "text-[#121F38] hover:bg-[#F4F5F8]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  asChild = false,
  disabled,
  className,
  children,
  type = "button",
  onClick,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-md font-medium outline-none disabled:cursor-not-allowed disabled:opacity-60",
    "aria-disabled:cursor-not-allowed aria-disabled:opacity-60",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

  if (asChild && isValidElement<ButtonChildProps>(children)) {
    const child = children as ReactElement<ButtonChildProps>;

    return cloneElement(child, {
      className: cn(classes, child.props.className),
      "aria-disabled": isDisabled || undefined,
      tabIndex: isDisabled ? -1 : child.props.tabIndex,
      onClick: (event: MouseEvent<HTMLElement>) => {
        if (isDisabled) {
          event.preventDefault();
          return;
        }

        onClick?.(event as MouseEvent<HTMLButtonElement>);
        child.props.onClick?.(event);
      },
    });
  }

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={isLoading || undefined}
      className={classes}
      onClick={onClick}
      {...props}
    >
      {isLoading ? "Loading..." : children}
    </button>
  );
}
