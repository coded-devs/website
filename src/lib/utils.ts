import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// The /team grid shows three cards side by side, so a runaway bio stretches the
// whole row. Counted in words rather than characters: a character cap cuts off
// mid-word, and words are what someone writing a bio actually thinks in.
export const TEAM_BIO_MAX_WORDS = 100;

export function countWords(value: string) {
  const trimmed = value.trim();

  return trimmed ? trimmed.split(/\s+/).length : 0;
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
  function extractText(value: unknown): string {
    if (typeof value === "string") {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map(extractText).join(" ");
    }

    if (value && typeof value === "object") {
      const node = value as { text?: unknown; content?: unknown };
      const ownText = typeof node.text === "string" ? node.text : "";
      const childText = extractText(node.content);

      return `${ownText} ${childText}`.trim();
    }

    return "";
  }

  const text = extractText(content).trim();
  const wordCount = text ? text.split(/\s+/).length : 0;
  const minutes = wordCount === 0 ? 0 : Math.ceil(wordCount / 200);

  return `${minutes} min read`;
}
