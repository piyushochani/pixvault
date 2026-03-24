/**
 * Format an ISO date string to a readable format.
 * e.g. "2024-06-10T14:23:00Z" → "Jun 10, 2024"
 */
export function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

/**
 * Format hours_remaining into a human-readable countdown.
 * e.g. 23.5 → "23h 30m remaining"
 */
export function formatCountdown(hours) {
  if (hours <= 0) return "Expiring soon";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m remaining`;
  return `${h}h ${m}m remaining`;
}

/**
 * Truncate a string to maxLength and append ellipsis.
 */
export function truncate(str, maxLength = 80) {
  if (!str) return "";
  return str.length > maxLength ? str.slice(0, maxLength) + "…" : str;
}

/**
 * Extract a clean error message from an Axios error response.
 */
export function getErrorMessage(err) {
  return (
    err?.response?.data?.detail ||
    err?.response?.data?.message ||
    err?.message ||
    "Something went wrong. Please try again."
  );
}

/**
 * Download an image from a URL by triggering a browser download.
 */
export function downloadImage(url, filename = "image") {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}