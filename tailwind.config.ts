import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f4fcf7",
          100: "#e6f8ed",
          200: "#caeed9",
          300: "#a6dfbf",
          400: "#7fcd9f",
          500: "#58b67e",
          600: "#3f9f68",
          700: "#338353",
          800: "#2f6c47",
          900: "#28563a"
        }
      },
      boxShadow: {
        soft: "0 6px 18px rgba(63, 159, 104, 0.07)",
        panel: "0 3px 10px rgba(63, 159, 104, 0.05)"
      },
      backgroundImage: {
        "hero-glow":
          "linear-gradient(180deg, rgba(88,182,126,0.08) 0%, rgba(255,255,255,0) 24%)"
      }
    }
  },
  plugins: []
};

export default config;
