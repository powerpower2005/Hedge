import tailwindPlugin from "tailwindcss/plugin";

/** Brand greens: #EEEEEE · #6FCF97 · #2FA084 · #1F6F5F */
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#EEEEEE",
          100: "#EEEEEE",
          200: "#c8ead9",
          300: "#6FCF97",
          400: "#6FCF97",
          500: "#2FA084",
          600: "#2FA084",
          700: "#1F6F5F",
          800: "#1F6F5F",
          900: "#1a5c50",
          950: "#153f38",
        },
      },
    },
  },
  plugins: [
    tailwindPlugin(({ addVariant }) => {
      addVariant("light", "html.light &");
    }),
  ],
};
