import { useId, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

export default function Textarea({
  label,
  error,
  id,
  className,
  ...props
}: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? props.name ?? generatedId;

  return (
    <div className="w-full">
      {label ? (
        <label
          htmlFor={textareaId}
          className="mb-2 block font-sans text-sm font-medium text-[#121F38]"
        >
          {label}
        </label>
      ) : null}
      <textarea
        id={textareaId}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={
          error && textareaId ? `${textareaId}-error` : undefined
        }
        className={cn(
          "min-h-[120px] w-full resize-y rounded-md border border-[#C4CAD6] bg-white px-4 py-3 font-sans text-sm text-[#121F38] outline-none placeholder:text-[#6B7896] focus:border-[#121F38]",
          error && "border-[#DC2626] focus:border-[#DC2626]",
          className,
        )}
        {...props}
      />
      {error ? (
        <p
          id={textareaId ? `${textareaId}-error` : undefined}
          className="mt-2 font-sans text-sm text-[#DC2626]"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
