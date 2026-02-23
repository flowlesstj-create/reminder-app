export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function parseOptionalDate(
  value: unknown,
): Date | null | "invalid" | "missing" {
  if (value === undefined) {
    return "missing";
  }

  if (value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    return "invalid";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "invalid";
  }

  return date;
}
