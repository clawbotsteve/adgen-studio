/**
 * Safely extract a displayable image URL from output_url.
 * Handles cases where output_url might be a JSON object string
 * like '{"url":"https://...","width":512,"height":512}'
 * instead of a plain URL string.
 */
export function parseOutputUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  // If it's already a valid URL, return as-is
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  // Try parsing as JSON object with a url field
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.url === "string") return parsed.url;
  } catch {
    // not JSON
  }
  return raw;
}
