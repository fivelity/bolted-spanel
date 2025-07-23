import { writable, derived } from "svelte/store";

// Theme store with default value
const initialTheme = "dark";

export const themeStore = writable(initialTheme);
export const currentTheme = derived(themeStore, ($theme) => $theme);
