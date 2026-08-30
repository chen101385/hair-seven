/**
 * Placeholders ship visible on purpose — nothing here guesses at a real price,
 * address, or claim. But a placeholder must never become a broken link or a
 * bogus entry in structured data, so anything that would be *used* rather than
 * *read* gets checked first.
 */
export function isPlaceholder(value: string | null | undefined): boolean {
  return !value || value.includes("PLACEHOLDER") || value.includes("VERIFY");
}

/** The value if it's real, otherwise undefined — for JSON-LD and link hrefs. */
export function realOrUndefined(value: string): string | undefined {
  return isPlaceholder(value) ? undefined : value;
}
