import { cva, type VariantProps } from "class-variance-authority";
import { splitProps, type ComponentProps } from "solid-js";
import { cn } from "./utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-primary/30 bg-primary/10 text-primary",
        secondary: "border-border bg-secondary text-secondary-foreground",
        destructive: "border-destructive/30 bg-destructive/10 text-destructive",
        outline: "border-border text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends ComponentProps<"div">,
    VariantProps<typeof badgeVariants> {}

export function Badge(props: BadgeProps) {
  const [local, others] = splitProps(props, ["variant", "class"]);

  return (
    <div
      class={cn(badgeVariants({ variant: local.variant }), local.class)}
      {...others}
    />
  );
}
