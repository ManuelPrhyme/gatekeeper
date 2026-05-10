const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Format a date string to "MMM d, yyyy" (e.g. "Jan 5, 2025")
 */
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/**
 * Format a date string to "MMM d, yyyy HH:mm"
 */
export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} ${h}:${m}`;
}
