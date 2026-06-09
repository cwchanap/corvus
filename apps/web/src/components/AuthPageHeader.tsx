import { CorvusMark } from "@repo/ui-components/corvus-mark";

export function AuthPageHeader() {
  return (
    <div class="mb-8 flex flex-col items-center text-center">
      <CorvusMark title="Corvus" class="mb-4 h-12 w-12 animate-rise" />
      <h1 class="font-display text-4xl font-semibold tracking-tight text-foreground animate-rise">
        Corvus
      </h1>
      <p class="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        A catalogue of desire
      </p>
    </div>
  );
}
