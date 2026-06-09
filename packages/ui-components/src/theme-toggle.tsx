import { Button } from "./button";

type Theme = "light" | "dark" | "system";

interface ThemeToggleProps {
  theme: () => Theme;
  setTheme: (theme: Theme) => void;
}

export function ThemeToggle(props: ThemeToggleProps) {
  const cycleTheme = () => {
    const current = props.theme();
    if (current === "system") props.setTheme("light");
    else if (current === "light") props.setTheme("dark");
    else props.setTheme("system");
  };

  const label = (): string => {
    const t = props.theme();
    if (t === "system") return "System theme active";
    if (t === "dark") return "Dark theme active";
    return "Light theme active";
  };

  const titleText = (): string => {
    const t = props.theme();
    const name = t === "system" ? "System" : t === "dark" ? "Dark" : "Light";
    return `Current theme: ${name}. Click to cycle.`;
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={cycleTheme}
      title={titleText()}
      aria-label={label()}
    >
      <ShowIcon theme={props.theme} />
    </Button>
  );
}

function ShowIcon(props: { theme: () => Theme }) {
  return (
    <>
      {/* Moon — dark theme */}
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
        class={props.theme() === "dark" ? "" : "hidden"}
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
      {/* Sun — light theme */}
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
        class={props.theme() === "light" ? "" : "hidden"}
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
      {/* Monitor — system theme */}
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
        class={props.theme() === "system" ? "" : "hidden"}
      >
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    </>
  );
}
