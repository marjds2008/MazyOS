import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#C8873A",
          dark:    "#A06520",
          light:   "#FDF6EE",
          warm:    "#FFF8F0",
        },
      },
    },
  },
  plugins: [],
};

export default config;
