import { splitProps, type ComponentProps } from "solid-js";
import { cn } from "./utils";

interface CorvusMarkProps extends ComponentProps<"svg"> {
  /** Accessible name. If omitted, the mark is treated as decorative. */
  title?: string;
}

/**
 * The Corvus constellation (the Crow): four principal stars
 * (Gienah, Algorab, Kraz, Minkar) connected as a quadrilateral.
 */
export function CorvusMark(props: CorvusMarkProps) {
  const [local, others] = splitProps(props, ["title", "class"]);
  const decorative = () => local.title == null;

  return (
    <svg
      viewBox="0 0 64 56"
      fill="none"
      stroke="currentColor"
      stroke-width="1.25"
      stroke-linecap="round"
      stroke-linejoin="round"
      role={decorative() ? undefined : "img"}
      aria-hidden={decorative() ? "true" : undefined}
      aria-label={local.title}
      class={cn("text-primary", local.class)}
      {...others}
    >
      {/* edges of the quadrilateral */}
      <path d="M10 14 L46 8 L54 34 L20 46 Z" opacity="0.5" />
      {/* stars */}
      <circle cx="10" cy="14" r="2.4" fill="currentColor" stroke="none" />
      <circle cx="46" cy="8" r="3" fill="currentColor" stroke="none" />
      <circle cx="54" cy="34" r="2.2" fill="currentColor" stroke="none" />
      <circle cx="20" cy="46" r="2.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** A fine decorative feather rule, used in empty states and footers. */
export function FeatherMark(props: ComponentProps<"svg">) {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <svg
      viewBox="0 0 24 48"
      fill="none"
      stroke="currentColor"
      stroke-width="1.25"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      class={cn("text-muted-foreground", local.class)}
      {...others}
    >
      <path d="M12 2 C18 10 18 28 12 46" />
      <path
        d="M12 8 L6 12 M12 14 L5 19 M12 20 L5 26 M12 26 L6 32 M12 32 L8 37"
        opacity="0.7"
      />
      <path
        d="M12 8 L18 12 M12 14 L19 19 M12 20 L19 26 M12 26 L18 32 M12 32 L16 37"
        opacity="0.7"
      />
    </svg>
  );
}
