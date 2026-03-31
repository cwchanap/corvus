export function isValidUrl(urlString: string): boolean {
    if (urlString.trim().length === 0) {
        return false;
    }

    try {
        const parsed = new URL(urlString);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        return false;
    }
}
