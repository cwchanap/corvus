// Design token values shared with the UI package. We reuse these so the
// extension can update CSS variables when the resolved theme changes.
const lightTheme = {
  "--background": "0 0% 100%",
  "--foreground": "222.2 84% 4.9%",
  "--primary": "210 40% 98%",
  "--primary-foreground": "222.2 47.4% 11.2%",
  "--secondary": "210 40% 96%",
  "--secondary-foreground": "222.2 47.4% 11.2%",
  "--accent": "210 40% 96%",
  "--accent-foreground": "222.2 47.4% 11.2%",
  "--destructive": "0 84.2% 60.2%",
  "--destructive-foreground": "210 40% 98%",
  "--muted": "210 40% 96%",
  "--muted-foreground": "215.4 16.3% 46.9%",
  "--card": "0 0% 100%",
  "--card-foreground": "222.2 84% 4.9%",
  "--popover": "0 0% 100%",
  "--popover-foreground": "222.2 84% 4.9%",
  "--border": "214.3 31.8% 91.4%",
  "--input": "214.3 31.8% 91.4%",
  "--ring": "222.2 84% 4.9%",
  "--radius": "0.5rem",
} as const;

const darkTheme = {
  "--background": "222.2 84% 4.9%",
  "--foreground": "210 40% 98%",
  "--primary": "222.2 47.4% 11.2%",
  "--primary-foreground": "210 40% 98%",
  "--secondary": "217.2 32.6% 17.5%",
  "--secondary-foreground": "210 40% 98%",
  "--accent": "217.2 32.6% 17.5%",
  "--accent-foreground": "210 40% 98%",
  "--destructive": "0 62.8% 30.6%",
  "--destructive-foreground": "210 40% 98%",
  "--muted": "217.2 32.6% 17.5%",
  "--muted-foreground": "215 20.2% 65.1%",
  "--card": "222.2 84% 4.9%",
  "--card-foreground": "210 40% 98%",
  "--popover": "222.2 84% 4.9%",
  "--popover-foreground": "210 40% 98%",
  "--border": "217.2 32.6% 17.5%",
  "--input": "217.2 32.6% 17.5%",
  "--ring": "212.7 26.8% 83.9%",
} as const;

export type ThemeTokensMode = "light" | "dark";

export const applyThemeVariables = (mode: ThemeTokensMode) => {
  const root = document.documentElement;
  const values = mode === "dark" ? darkTheme : lightTheme;

  Object.entries(values).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
};

// Initialize CSS variables so the popup has a consistent baseline before
// Solid mounts. The reactive theme effect will update these later.
applyThemeVariables("light");
