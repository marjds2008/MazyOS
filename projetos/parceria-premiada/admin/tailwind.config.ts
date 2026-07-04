import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#F59E0B",
          dark:    "#D97706",
          light:   "#FFFBEB",
          warm:    "#FFF8F0",
        },
      },
    },
  },
  plugins: [],
};

export default config;
