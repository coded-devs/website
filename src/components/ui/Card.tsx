import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type CardProps = HTMLAttributes<HTMLElement> & {
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

export default function Card({
  header,
  children,
  footer,
  className,
  ...props
}: CardProps) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-lg border border-[#C4CAD6] bg-[#F4F5F8] shadow-sm",
        className,
      )}
      {...props}
    >
      {header ? <div className="border-b border-[#C4CAD6] p-5">{header}</div> : null}
      {/* flex-1 + flex-col so a stretched card passes its spare height down to
          the body. Without it the body is auto-height and any `mt-auto` inside
          has no room to push against. */}
      <div className="flex flex-1 flex-col p-5">{children}</div>
      {footer ? <div className="border-t border-[#C4CAD6] p-5">{footer}</div> : null}
    </section>
  );
}
