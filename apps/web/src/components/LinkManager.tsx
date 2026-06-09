import { Index, Show } from "solid-js";
import { Button } from "@repo/ui-components/button";
import { Input } from "@repo/ui-components/input";

export interface LinkItem {
  id?: string;
  url: string;
  description: string;
  isPrimary: boolean;
  isNew?: boolean;
  isDeleted?: boolean;
}

interface VisibleLinkItem {
  link: LinkItem;
  originalIndex: number;
}

interface LinkManagerProps {
  links: LinkItem[];
  onAddLink: () => void;
  onUpdateLink: (
    index: number,
    field: keyof LinkItem,
    value: string | boolean,
  ) => void;
  onRemoveLink: (index: number) => void;
  onRemoveAllLinks: () => void;
  emptyMessage?: string;
  emptySubMessage?: string;
  /** Map of visible link index → duplicate warning (conflicting item title) or null */
  duplicateWarnings?: Record<number, string | null>;
}

export function LinkManager(props: LinkManagerProps) {
  const visibleLinks = (): VisibleLinkItem[] =>
    props.links.flatMap((link, originalIndex) =>
      link.isDeleted ? [] : [{ link, originalIndex }],
    );
  const hasVisibleLinks = () => visibleLinks().length > 0;

  return (
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <label class="block font-mono text-xs uppercase tracking-wide text-muted-foreground">
          Links (optional)
        </label>
        <div class="flex gap-2">
          <Show when={hasVisibleLinks()}>
            <Button
              type="button"
              variant="ghost"
              onClick={props.onRemoveAllLinks}
              aria-label="Remove all links"
              class="font-mono text-xs uppercase tracking-wide text-muted-foreground hover:text-destructive px-2 py-1"
            >
              Remove All
            </Button>
          </Show>
          <Button
            type="button"
            variant="outline"
            onClick={props.onAddLink}
            aria-label="Add link"
            class="flex items-center gap-1.5 text-sm px-3 py-1"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              class="h-3.5 w-3.5"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Link
          </Button>
        </div>
      </div>

      <Show
        when={hasVisibleLinks()}
        fallback={
          <div class="text-center py-8 text-muted-foreground">
            <p class="font-serif text-sm">
              {props.emptyMessage || "No links added yet"}
            </p>
            <p class="font-mono text-xs mt-1">
              {props.emptySubMessage ||
                "You can add links now or later after creating the item"}
            </p>
          </div>
        }
      >
        <div class="space-y-3">
          <Index each={visibleLinks()}>
            {(visibleLink, index) => (
              <div class="border border-border bg-accent/20 rounded-sm p-4 space-y-3">
                <div class="flex items-center justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      props.onRemoveLink(visibleLink().originalIndex)
                    }
                    aria-label="Remove link"
                    class="text-destructive hover:text-destructive hover:bg-destructive/10 p-1"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                      class="h-4 w-4"
                    >
                      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6" />
                    </svg>
                  </Button>
                </div>

                <Input
                  type="url"
                  value={visibleLink().link.url}
                  onInput={(e) =>
                    props.onUpdateLink(
                      visibleLink().originalIndex,
                      "url",
                      e.currentTarget.value,
                    )
                  }
                  placeholder="Enter website URL"
                  class="w-full"
                  required
                />
                <Show when={props.duplicateWarnings?.[index]}>
                  {(title) => (
                    <p class="font-mono text-xs text-amber-600 dark:text-amber-400 mt-1">
                      This URL is already saved under &ldquo;{title()}&rdquo;.
                      You may still save it as a duplicate.
                    </p>
                  )}
                </Show>

                <Input
                  value={visibleLink().link.description}
                  onInput={(e) =>
                    props.onUpdateLink(
                      visibleLink().originalIndex,
                      "description",
                      e.currentTarget.value,
                    )
                  }
                  placeholder="Link description (optional)"
                  class="w-full"
                />
              </div>
            )}
          </Index>
        </div>
      </Show>
    </div>
  );
}
