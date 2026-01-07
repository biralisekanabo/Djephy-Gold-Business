import type { Config } from "tailwindcss";
const flowbite = require("flowbite-react/plugin");
const flowbiteReact = require("flowbite-react/plugin/tailwindcss");

const config: Config = {
  // Activer le dark mode en se basant sur la préférence système
  darkMode: 'media',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "node_modules/flowbite-react/lib/esm/**/*.js",
    ".flowbite-react\\class-list.json"
  ],
  theme: {
    colors: {
      // Palette limitée : uniquement blanc et bleu
      transparent: "transparent",
      current: "currentColor",
      white: require("tailwindcss/colors").white,
      blue: require("tailwindcss/colors").blue,
    },
  },
  plugins: [flowbite, flowbiteReact],
};
export default config;