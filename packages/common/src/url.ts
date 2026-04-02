export function normalizeHttpUrl(urlString: string): string {
    const trimmed = urlString.trim();

    if (trimmed.length === 0) {
        return trimmed;
    }

    try {
        const parsed = new URL(trimmed);

        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
            return trimmed;
        }

        parsed.protocol = parsed.protocol.toLowerCase();
        parsed.hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");

        if (
            (parsed.protocol === "http:" && parsed.port === "80") ||
            (parsed.protocol === "https:" && parsed.port === "443")
        ) {
            parsed.port = "";
        }

        if (parsed.pathname.length > 1) {
            parsed.pathname = parsed.pathname.replace(/\/+$/, "");
            if (parsed.pathname.length === 0) {
                parsed.pathname = "/";
            }
        }

        if (parsed.search) {
            const entries = Array.from(parsed.searchParams.entries()).sort(
                ([leftKey, leftValue], [rightKey, rightValue]) => {
                    if (leftKey === rightKey) {
                        return leftValue.localeCompare(rightValue);
                    }
                    return leftKey.localeCompare(rightKey);
                },
            );
            parsed.search = "";
            for (const [key, value] of entries) {
                parsed.searchParams.append(key, value);
            }
        }

        const auth =
            parsed.username || parsed.password
                ? `${parsed.username}${parsed.password ? `:${parsed.password}` : ""}@`
                : "";
        const pathname = parsed.pathname === "/" ? "" : parsed.pathname;

        return `${parsed.protocol}//${auth}${parsed.host}${pathname}${parsed.search}${parsed.hash}`;
    } catch {
        return trimmed;
    }
}
