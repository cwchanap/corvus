export function isValidUrl(urlString: string): boolean {
    const trimmed = urlString.trim();

    if (trimmed.length === 0) {
        return false;
    }

    try {
        const parsed = new URL(trimmed);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        return false;
    }
}
