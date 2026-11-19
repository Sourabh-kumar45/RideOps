import type { Config } from "tailwindcss";

/**
 * Tailwind theme for the RideOps app.
 * Warm off-white background, white cards, dark ink text and one indigo accent.
 * Recommendation colours use Tailwind's emerald / amber / indigo scales.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#1f2328", soft: "#59636e", mute: "#8b949e" },
        page: "#f6f5f2",
        line: "#e8e6e1",
        accent: { DEFAULT: "#4f46e5", strong: "#4338ca", soft: "#eef2ff" },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Consolas", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(31,35,40,0.04), 0 2px 8px rgba(31,35,40,0.04)",
        pop: "0 16px 40px rgba(31,35,40,0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
