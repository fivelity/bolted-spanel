import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    alias: {
      "~icons": "@iconify-json",
    },
  },
  optimizeDeps: {
    include: [
      "@iconify-json/lucide",
      "@iconify-json/heroicons", 
      "@iconify-json/material-symbols",
      "@iconify-json/ri",
      "@iconify-json/mdi"
    ],
  },
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 4173,
    host: true,
  },
});
