import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7ff",
          100: "#d7ebff",
          500: "#1677ff",
          600: "#0f5ed1",
          900: "#0f2745"
        }
      },
      boxShadow: {
        panel: "0 10px 30px rgba(15, 23, 42, 0.08)"
      }
    },
  },
  plugins: [],
} satisfies Config;

