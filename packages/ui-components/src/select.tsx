import { splitProps, JSX, For } from "solid-js";
import { cn } from "./utils.js";

export interface SelectProps
  extends JSX.SelectHTMLAttributes<HTMLSelectElement> {
  class?: string;
  options?: Array<{ value: string; label: string }>;
}

export function Select(props: SelectProps) {
  const [local, others] = splitProps(props, ["class", "options", "children"]);

  return (
    <select
      class={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        local.class,
      )}
      {...others}
    >
      {local.children}
      <For each={local.options}>
        {(option) => <option value={option.value}>{option.label}</option>}
      </For>
    </select>
  );
}
