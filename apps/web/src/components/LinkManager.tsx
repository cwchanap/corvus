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
}

export function LinkManager(props: LinkManagerProps) {
  const visibleLinks = () => props.links.filter((link) => !link.isDeleted);
  const hasVisibleLinks = () => visibleLinks().length > 0;

  return (
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <label class="block text-sm font-medium text-foreground">
          Links (optional)
        </label>
        <div class="flex gap-2">
          <Show when={hasVisibleLinks()}>
            <Button
              type="button"
              variant="ghost"
              onClick={props.onRemoveAllLinks}
              class="text-xs px-2 py-1 text-muted-foreground hover:text-destructive"
            >
              Remove All
            </Button>
          </Show>
          <Button
            type="button"
            variant="outline"
            onClick={props.onAddLink}
            class="text-sm px-3 py-1 border-border text-foreground hover:bg-muted"
          >
            + Add Link
          </Button>
        </div>
      </div>

      <Show
        when={hasVisibleLinks()}
        fallback={
          <div class="text-center py-8 text-muted-foreground">
            <p class="text-sm">{props.emptyMessage || "No links added yet"}</p>
            <p class="text-xs mt-1">
              {props.emptySubMessage ||
                "You can add links now or later after creating the item"}
            </p>
          </div>
        }
      >
        <div class="space-y-3">
          <Index each={visibleLinks()}>
            {(link, index) => (
              <div class="border border-border bg-muted/30 rounded-lg p-4 space-y-3">
                <div class="flex items-center justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => props.onRemoveLink(index)}
                    class="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs p-1"
                  >
                    Remove
                  </Button>
                </div>

                <Input
                  type="url"
                  value={link().url}
                  onInput={(e) =>
                    props.onUpdateLink(index, "url", e.currentTarget.value)
                  }
                  placeholder="Enter website URL"
                  class="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  required
                />

                <Input
                  value={link().description}
                  onInput={(e) =>
                    props.onUpdateLink(
                      index,
                      "description",
                      e.currentTarget.value,
                    )
                  }
                  placeholder="Link description (optional)"
                  class="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
            )}
          </Index>
        </div>
      </Show>
    </div>
  );
}
