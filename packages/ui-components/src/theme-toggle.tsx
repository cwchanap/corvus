import { Button } from "./button";

interface ThemeToggleProps {
  theme: () => "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
  resolvedTheme: () => "light" | "dark";
}

export function ThemeToggle(props: ThemeToggleProps) {
  const cycleTheme = () => {
    const resolved = props.resolvedTheme();
    props.setTheme(resolved === "light" ? "dark" : "light");
  };

  const isDark = () => props.resolvedTheme() === "dark";

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={cycleTheme}
      title={`Current theme: ${isDark() ? "Dark" : "Light"}. Click to cycle.`}
      aria-label={isDark() ? "Dark theme active" : "Light theme active"}
    >
      {isDark() ? (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      )}
    </Button>
  );
}
