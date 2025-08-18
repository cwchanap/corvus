import { Button } from "./button.js";

interface ThemeToggleProps {
  theme: () => "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
  resolvedTheme: () => "light" | "dark";
}

export function ThemeToggle(props: ThemeToggleProps) {
  const cycleTheme = () => {
    const current = props.theme();
    if (current === "light") {
      props.setTheme("dark");
    } else if (current === "dark") {
      props.setTheme("system");
    } else {
      props.setTheme("light");
    }
  };

  const getIcon = () => {
    const resolved = props.resolvedTheme();
    const current = props.theme();

    if (current === "system") {
      return resolved === "dark" ? "🌙" : "☀️";
    }
    return resolved === "dark" ? "🌙" : "☀️";
  };

  const getLabel = () => {
    const current = props.theme();
    if (current === "system") return "System";
    return current === "dark" ? "Dark" : "Light";
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={cycleTheme}
      title={`Current theme: ${getLabel()}. Click to cycle.`}
      class="w-10 h-10 p-0"
    >
      <span class="text-lg">{getIcon()}</span>
    </Button>
  );
}
