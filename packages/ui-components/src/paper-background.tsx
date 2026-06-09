import { splitProps, type ComponentProps } from "solid-js";
import { cn } from "./utils";

/**
 * Full-bleed warm-paper backdrop with a faint grain overlay.
 * Render once near the root of a page; place page content in a higher
 * stacking context (e.g. a `relative` wrapper).
 */
export function PaperBackground(props: ComponentProps<"div">) {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <div
      aria-hidden="true"
      class={cn(
        "pointer-events-none fixed inset-0 -z-10 bg-background",
        local.class,
      )}
      {...others}
    >
      <div class="paper-grain absolute inset-0" />
    </div>
  );
}
