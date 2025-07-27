import { splitProps, type ComponentProps } from "solid-js";
import { cn } from "./utils.js";

export type SelectProps = ComponentProps<"select">;

export function Select(props: SelectProps) {
  const [local, others] = splitProps(props, ["class"]);

  return (
    <select
      class={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        local.class,
      )}
      {...others}
    />
  );
}

export type SelectOptionProps = ComponentProps<"option">;

export function SelectOption(props: SelectOptionProps) {
  return <option {...props} />;
}
