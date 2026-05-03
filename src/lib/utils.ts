import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getReadingTime(content: unknown): string {
  const text = JSON.stringify(content);
  const wordCount = text.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / 200);

  return `${minutes} min read`;
}
