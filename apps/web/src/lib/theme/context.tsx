import {
  createContext,
  useContext,
  createSignal,
  createEffect,
  onMount,
  JSX,
} from "solid-js";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: () => Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: () => "light" | "dark";
}

const ThemeContext = createContext<ThemeContextValue>();

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

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
    localStorage.setItem("theme", newTheme);
  };

  // Reactively apply theme whenever theme or system preference changes
  createEffect(() => {
    const current = theme();
    const sys = systemTheme();
    const isDark =
      current === "dark" || (current === "system" && sys === "dark");
    const root = document.documentElement;
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");
  });

  onMount(() => {
    // Load saved theme
    const savedTheme = localStorage.getItem("theme") as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }

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
