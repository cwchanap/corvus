import {
    createEffect,
    createMemo,
    createSignal,
    onCleanup,
    type Accessor,
} from "solid-js";
import { useCheckDuplicateUrl } from "../lib/graphql/hooks/use-wishlist";
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

export function useDuplicateUrlCheck(options: UseDuplicateUrlCheckOptions) {
    const [activeCheck, setActiveCheck] = createSignal<{
        url: string;
        index: number;
    } | null>(null);
    const [warningsByUrl, setWarningsByUrl] = createSignal<
        Record<string, string | null>
    >({});

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const clearDebounceTimer = () => {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
            debounceTimer = null;
        }
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
                link.url === url,
        );

    const cleanup = () => {
        clearDebounceTimer();
        setActiveCheck(null);
    };

    const reset = () => {
        cleanup();
        setWarningsByUrl({});
    };

    const handleUrlChange = (index: number, url: string) => {
        const previousUrl = options.links()[index]?.url ?? "";
        options.updateLink(index, "url", url);

        if (previousUrl && previousUrl !== url) {
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

        clearDebounceTimer();
        debounceTimer = setTimeout(() => {
            setActiveCheck({ url, index });
            debounceTimer = null;
        }, 400);
    };

    const duplicateQuery = useCheckDuplicateUrl(
        () => activeCheck()?.url ?? "",
        options.excludeItemId,
    );

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
    });

    const duplicateWarnings = createMemo<Record<number, string | null>>(() => {
        const warningsByCurrentUrl = warningsByUrl();
        const warnings: Record<number, string | null> = {};

        visibleLinks().forEach((link, index) => {
            warnings[index] = warningsByCurrentUrl[link.url] ?? null;
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
