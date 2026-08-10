/**
 * Post and product dates render in six places across the public site and admin.
 * They all want the same string, and client components receive the value
 * already serialised to a string by the server/client boundary — so this
 * accepts both shapes rather than making every caller normalise first.
 */
export function formatDate(
  value: Date | string | null | undefined,
  fallback = "Unscheduled",
): string {
  if (!value) {
    return fallback;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  // UTC, to match toDateTimeAttribute's toISOString below. Without it this
  // formats in the runtime zone, so the server and the reader's browser can
  // disagree across a date boundary — a visible hydration mismatch, and a
  // <time dateTime> that contradicts its own label.
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** Machine-readable value for <time dateTime="…">. */
export function toDateTimeAttribute(
  value: Date | string | null | undefined,
): string | undefined {
  if (!value) {
    return undefined;
  }

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime())
    ? undefined
    : date.toISOString().slice(0, 10);
}
