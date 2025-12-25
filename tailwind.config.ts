import type { Config } from "tailwindcss";
const flowbite = require("flowbite-react/plugin");
const flowbiteReact = require("flowbite-react/plugin/tailwindcss");

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "node_modules/flowbite-react/lib/esm/**/*.js",
    ".flowbite-react\\class-list.json"
  ],
  theme: {
    extend: {
      colors: {
        // Couleurs personnalisées pour Djephy Glod Business
        primary: {
          50: "#eff6ff",
          600: "#2563eb",
          700: "#1d4ed8",
        },
      },
    },
  },
  plugins: [flowbite, flowbiteReact],
};
export default config;