import React from "react";
import { cn } from "@/lib/utils";

export interface TimelineItem {
  id: string | number;
  date: string;
  label: string;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className={cn("flex flex-col", className)}>
      {items.map((item, i) => (
        <div key={item.id} className="relative flex gap-4 md:gap-8 min-h-[5rem]">
          {/* Date */}
          <div className="w-24 md:w-32 shrink-0 text-right py-4">
            <span className="font-mono text-sm text-[#121F38]">
              {item.date}
            </span>
          </div>

          {/* Node */}
          <div className="relative flex flex-col items-center">
            {/* Top half line */}
            <div
              className={cn(
                "w-[1px] h-6",
                i === 0 ? "bg-transparent" : "bg-[#C4CAD6]"
              )}
            />

            {/* Dot */}
            <div className="h-2 w-2 shrink-0 rounded-full bg-[#121F38]" />

            {/* Bottom half line */}
            <div
              className={cn(
                "w-[1px] grow min-h-[1.5rem]",
                i === items.length - 1 ? "bg-transparent" : "bg-[#C4CAD6]"
              )}
            />
          </div>

          {/* Label */}
          <div className="flex-1 py-4">
            <p className="text-base text-[#2C3A52] leading-[1.7]">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
