// @ts-ignore
import { writable, derived } from "svelte/store";
import { theme } from "svelte-ux"; // Corrected import

export const themeStore = writable(theme); // Central store for themes, integrate with Cosmic UI and Tailwind
export const currentTheme = derived(themeStore, $theme => $theme); // Assuming theme is the object, adjust if it's the name
