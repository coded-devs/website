import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export default function Input({
  label,
  error,
  id,
  className,
  ...props
}: InputProps) {
  const inputId = id ?? props.name;

  return (
    <div className="w-full">
      {label ? (
        <label
          htmlFor={inputId}
          className="mb-2 block font-sans text-sm font-medium text-[#121F38]"
        >
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error && inputId ? `${inputId}-error` : undefined}
        className={cn(
          "w-full rounded-md border border-[#C4CAD6] bg-white px-4 py-3 font-sans text-sm text-[#121F38] outline-none placeholder:text-[#6B7896] focus:border-[#121F38]",
          error && "border-[#DC2626] focus:border-[#DC2626]",
          className,
        )}
        {...props}
      />
      {error ? (
        <p
          id={inputId ? `${inputId}-error` : undefined}
          className="mt-2 font-sans text-sm text-[#DC2626]"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
