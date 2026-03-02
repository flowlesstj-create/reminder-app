/**
 * Normalizes an email address by trimming whitespace and converting to lowercase.
 * Does not validate email format - callers should perform additional validation.
 * @param value - The email string to normalize
 * @returns Normalized email string
 */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Parses an optional date value with explicit sentinel returns for error states.
 * @param value - The value to parse (undefined, null, empty string, or date string)
 * @returns Date object if valid, null for empty input, "invalid" for unparseable strings, "missing" for undefined
 */
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
