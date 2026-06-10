// Design token values shared with the UI package. We reuse these so the
// extension can update CSS variables when the resolved theme changes.
// Keep in sync with packages/ui-components/src/styles.css
const lightTheme = {
    "--background": "40 33% 94%",
    "--foreground": "30 10% 12%",
    "--primary": "14 60% 32%",
    "--primary-foreground": "42 44% 97%",
    "--secondary": "38 22% 88%",
    "--secondary-foreground": "30 10% 18%",
    "--accent": "38 26% 86%",
    "--accent-foreground": "30 10% 14%",
    "--destructive": "4 56% 38%",
    "--destructive-foreground": "42 44% 97%",
    "--muted": "38 22% 90%",
    "--muted-foreground": "33 10% 40%",
    "--card": "42 44% 97%",
    "--card-foreground": "30 10% 12%",
    "--popover": "42 44% 97%",
    "--popover-foreground": "30 10% 12%",
    "--border": "36 18% 82%",
    "--input": "36 18% 78%",
    "--ring": "14 60% 32%",
    "--radius": "0.125rem",
} as const;

const darkTheme = {
    "--background": "30 12% 8%",
    "--foreground": "40 30% 90%",
    "--primary": "14 65% 52%",
    "--primary-foreground": "30 12% 8%",
    "--secondary": "30 8% 18%",
    "--secondary-foreground": "40 30% 90%",
    "--accent": "30 8% 20%",
    "--accent-foreground": "40 30% 92%",
    "--destructive": "4 60% 50%",
    "--destructive-foreground": "40 30% 92%",
    "--muted": "30 8% 16%",
    "--muted-foreground": "36 12% 60%",
    "--card": "30 10% 11%",
    "--card-foreground": "40 30% 90%",
    "--popover": "30 10% 11%",
    "--popover-foreground": "40 30% 90%",
    "--border": "30 8% 22%",
    "--input": "30 8% 26%",
    "--ring": "14 65% 52%",
    "--radius": "0.125rem",
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
