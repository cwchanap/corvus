/** @type {import('tailwindcss').Config} */
import uiPreset from "../../packages/ui-components/tailwind.config.js";

export default {
  // Reuse the shared UI theme (colors, radius, etc.)
  presets: [uiPreset],
  darkMode: "class",
  content: [
    "./src/**/*.{html,js,ts,jsx,tsx}",
    "../../packages/ui-components/src/**/*.{js,ts,jsx,tsx,css}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
