import tailwindPlugin from "tailwindcss/plugin";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {},
  },
  plugins: [
    tailwindPlugin(({ addVariant }) => {
      addVariant("light", "html.light &");
    }),
  ],
};
