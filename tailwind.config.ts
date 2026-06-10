import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#C8873A",   // laranja quente — calor humano
          dark: "#A06520",      // laranja escuro — hover
          light: "#FDF6EE",     // creme — fundos suaves
          accent: "#2D6A4F",    // verde musgo — confiança, natureza
          text: "#1A1A1A",      // quase preto
          muted: "#6B6B6B",     // cinza texto secundário
          warm: "#FFF8F0",      // creme mais claro
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
      },
      fontSize: {
        "hero": ["3rem", { lineHeight: "1.15", fontWeight: "700" }],
        "hero-mobile": ["2rem", { lineHeight: "1.2", fontWeight: "700" }],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
