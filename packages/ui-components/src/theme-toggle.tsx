import { Button } from "./button.tsx";

interface ThemeToggleProps {
  theme: () => "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
  resolvedTheme: () => "light" | "dark";
}

export function ThemeToggle(props: ThemeToggleProps) {
  const cycleTheme = () => {
    const resolved = props.resolvedTheme();
    if (resolved === "light") {
      props.setTheme("dark");
    } else {
      props.setTheme("light");
    }
  };

  const getIcon = () => {
    const resolved = props.resolvedTheme();
    return resolved === "dark" ? "🌙" : "☀️";
  };

  const getLabel = () => {
    const resolved = props.resolvedTheme();
    return resolved === "dark" ? "Dark" : "Light";
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
