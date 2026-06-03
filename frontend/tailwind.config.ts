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
        background: "var(--background)",
        foreground: "var(--foreground)",
        cyber: {
          bg: "#050608",
          dark: "#0b0e14",
          card: "rgba(16, 22, 34, 0.4)",
          border: "rgba(0, 240, 255, 0.15)",
          cyan: "#00f0ff",
          pink: "#ff007f",
          green: "#39ff14",
          yellow: "#ffea00",
          purple: "#9d4edd",
          glow: "rgba(0, 240, 255, 0.4)",
        }
      },
      boxShadow: {
        "neon-cyan": "0 0 10px rgba(0, 240, 255, 0.3), 0 0 20px rgba(0, 240, 255, 0.1)",
        "neon-pink": "0 0 10px rgba(255, 0, 127, 0.3), 0 0 20px rgba(255, 0, 127, 0.1)",
        "neon-glow": "0 0 15px var(--glow-color)",
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "sans-serif"],
        mono: ["Courier New", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
