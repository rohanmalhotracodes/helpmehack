export function isValidNewsletterEmail(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
