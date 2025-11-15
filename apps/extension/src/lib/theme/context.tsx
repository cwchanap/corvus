import {
  createContext,
  useContext,
  createSignal,
  createEffect,
  onMount,
  JSX,
} from "solid-js";
import { applyThemeVariables } from "./init-styles";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: () => Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: () => "light" | "dark";
}

const ThemeContext = createContext<ThemeContextValue>();

interface ThemeProviderProps {
  children: JSX.Element;
  defaultTheme?: Theme;
}

export function ThemeProvider(props: ThemeProviderProps) {
  const [theme, setTheme] = createSignal<Theme>(props.defaultTheme || "system");
  const [systemTheme, setSystemTheme] = createSignal<"light" | "dark">("light");

  const resolvedTheme = () => {
    if (theme() === "system") {
      return systemTheme();
    }
    return theme() as "light" | "dark";
  };

  const updateTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    chrome.storage.local.set({ theme: newTheme });
  };

  createEffect(() => {
    const current = theme();
    const sys = systemTheme();
    const resolved =
      current === "dark" || (current === "system" && sys === "dark")
        ? "dark"
        : "light";
    const root = document.documentElement;

    // Toggle the tailwind dark class so component styles react immediately
    if (resolved === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Update CSS variables so tokens like --primary/--secondary match the
    // active theme. This keeps the extension aligned with the shared UI kit.
    applyThemeVariables(resolved);
  });

  onMount(() => {
    // Load saved theme
    chrome.storage.local.get(["theme"], (result) => {
      if (result.theme) {
        setTheme(result.theme);
      }
    });

    // Detect system theme
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemTheme(mediaQuery.matches ? "dark" : "light");

    // Listen for system theme changes
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  });

  const contextValue: ThemeContextValue = {
    theme,
    setTheme: updateTheme,
    resolvedTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {props.children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
