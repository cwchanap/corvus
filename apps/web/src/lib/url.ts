import { normalizeHttpUrl } from "@repo/common/url";

export function isValidUrl(urlString: string): boolean {
    const normalized = normalizeHttpUrl(urlString);

    if (normalized.length === 0) {
        return false;
    }

    try {
        const parsed = new URL(normalized);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        return false;
    }
}

export { normalizeHttpUrl };
