/**
 * Formats an ISO date string as a relative human-readable time
 * e.g. "just now", "3 minutes ago", "2 days ago"
 */
export function formatRelativeTime(isoString: string): string {
    const now = Date.now();
    const then = new Date(isoString).getTime();
    if (!Number.isFinite(then)) return "just now";
    const diffMs = now - then;
    if (diffMs < 0) return "just now";
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 60) return "just now";

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60)
        return diffMin === 1 ? "1 minute ago" : `${diffMin} minutes ago`;

    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return diffHr === 1 ? "1 hour ago" : `${diffHr} hours ago`;

    const diffDay = Math.floor(diffHr / 24);
    if (diffDay === 1) return "yesterday";
    if (diffDay < 30) return `${diffDay} days ago`;

    const diffMonth = Math.floor(diffDay / 30);
    if (diffMonth < 12)
        return diffMonth === 1 ? "1 month ago" : `${diffMonth} months ago`;

    const diffYear = Math.floor(diffMonth / 12);
    return diffYear === 1 ? "1 year ago" : `${diffYear} years ago`;
}
