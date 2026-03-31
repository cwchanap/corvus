import {
    createEffect,
    createMemo,
    createSignal,
    onCleanup,
    type Accessor,
} from "solid-js";
import { useCheckDuplicateUrl } from "../lib/graphql/hooks/use-wishlist";
import { isValidUrl } from "../lib/url";
import type { LinkItem } from "./useLinkManager";

interface UseDuplicateUrlCheckOptions {
    links: Accessor<LinkItem[]>;
    updateLink: (
        index: number,
        field: keyof LinkItem,
        value: string | boolean,
    ) => void;
    excludeItemId?: Accessor<string | undefined>;
}

interface DuplicateUrlCheck {
    url: string;
    index: number;
}

function normalizeUrl(url: string) {
    return url.trim();
}

export function useDuplicateUrlCheck(options: UseDuplicateUrlCheckOptions) {
    const [activeCheck, setActiveCheck] =
        createSignal<DuplicateUrlCheck | null>(null);
    const [queuedChecks, setQueuedChecks] = createSignal<DuplicateUrlCheck[]>(
        [],
    );
    const [warningsByUrl, setWarningsByUrl] = createSignal<
        Record<string, string | null>
    >({});

    const debounceTimers = new Map<number, ReturnType<typeof setTimeout>>();

    const clearDebounceTimer = (index: number) => {
        const debounceTimer = debounceTimers.get(index);
        if (debounceTimer) {
            clearTimeout(debounceTimer);
            debounceTimers.delete(index);
        }
    };

    const clearDebounceTimers = () => {
        debounceTimers.forEach((debounceTimer) => {
            clearTimeout(debounceTimer);
        });
        debounceTimers.clear();
    };

    const visibleLinks = createMemo(() =>
        options.links().filter((link) => !link.isDeleted),
    );

    const hasOtherVisibleLinkWithUrl = (
        links: LinkItem[],
        url: string,
        excludeIndex: number,
    ) =>
        links.some(
            (link, currentIndex) =>
                currentIndex !== excludeIndex &&
                !link.isDeleted &&
                normalizeUrl(link.url) === url,
        );

    const removeQueuedCheck = (index: number) => {
        setQueuedChecks((previous) =>
            previous.filter((check) => check.index !== index),
        );
    };

    const clearActiveCheck = (index: number) => {
        if (activeCheck()?.index === index) {
            setActiveCheck(null);
        }
    };

    const cleanup = () => {
        clearDebounceTimers();
        setQueuedChecks([]);
        setActiveCheck(null);
    };

    const reset = () => {
        cleanup();
        setWarningsByUrl({});
    };

    const handleUrlChange = (index: number, url: string) => {
        const previousUrl = normalizeUrl(options.links()[index]?.url ?? "");
        const normalizedUrl = normalizeUrl(url);
        options.updateLink(index, "url", url);

        if (previousUrl && previousUrl !== normalizedUrl) {
            setWarningsByUrl((previous) => {
                const nextLinks = options
                    .links()
                    .map((link, linkIndex) =>
                        linkIndex === index ? { ...link, url } : link,
                    );
                if (hasOtherVisibleLinkWithUrl(nextLinks, previousUrl, index)) {
                    return previous;
                }
                const next = { ...previous };
                delete next[previousUrl];
                return next;
            });
        }

        clearDebounceTimer(index);
        removeQueuedCheck(index);
        clearActiveCheck(index);

        if (normalizedUrl.length < 8 || !isValidUrl(normalizedUrl)) {
            return;
        }

        debounceTimers.set(
            index,
            setTimeout(() => {
                debounceTimers.delete(index);
                setQueuedChecks((previous) => [
                    ...previous.filter((check) => check.index !== index),
                    { url: normalizedUrl, index },
                ]);
            }, 400),
        );
    };

    const duplicateQuery = useCheckDuplicateUrl(
        () => activeCheck()?.url ?? "",
        options.excludeItemId,
    );

    createEffect(() => {
        const queue = queuedChecks();
        if (activeCheck() || queue.length === 0) return;

        const nextCheck = queue[0];
        if (!nextCheck) return;

        setQueuedChecks(queue.slice(1));
        setActiveCheck(nextCheck);
    });

    createEffect(() => {
        const check = activeCheck();
        const data = duplicateQuery.data;
        if (!check?.url || !data) return;

        setWarningsByUrl((previous) => ({
            ...previous,
            [check.url]:
                data.isDuplicate && data.conflictingItem
                    ? data.conflictingItem.title
                    : null,
        }));
        setActiveCheck(null);
    });

    const duplicateWarnings = createMemo<Record<number, string | null>>(() => {
        const warningsByCurrentUrl = warningsByUrl();
        const warnings: Record<number, string | null> = {};

        visibleLinks().forEach((link, index) => {
            warnings[index] =
                warningsByCurrentUrl[normalizeUrl(link.url)] ?? null;
        });

        return warnings;
    });

    onCleanup(cleanup);

    return {
        handleUrlChange,
        duplicateWarnings,
        reset,
        cleanup,
    };
}
