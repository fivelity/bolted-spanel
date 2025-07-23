import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./src/**/*.{svelte,js,ts}"],
  theme: {
    extend: {},
  },
  plugins: [require("@skeletonlabs/skeleton")],
};
