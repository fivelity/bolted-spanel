import { browser } from '$app/environment';
import { writable, get } from 'svelte/store';

type Theme = 'gaming' | 'crimson' | 'light' | 'dark';

// Svelte store
export const currentTheme = writable<Theme>('gaming');

export const themeStore = {
	init() {
		if (!browser) return;

		// Load saved theme
		const saved = localStorage.getItem('sensecanvas-theme') as Theme;
		if (saved) {
			currentTheme.set(saved);
		}

		// Apply theme to document
		this.applyTheme(get(currentTheme));
	},

	setTheme(theme: Theme) {
		currentTheme.set(theme);
		this.applyTheme(theme);
		
		if (browser) {
			localStorage.setItem('sensecanvas-theme', theme);
		}
	},

	applyTheme(theme: Theme) {
		if (!browser) return;

		// Remove existing theme classes
		document.documentElement.classList.remove('gaming', 'crimson', 'light', 'dark');
		
		// Add new theme class
		document.documentElement.classList.add(theme);
		
		// Set data attribute for Skeleton UI
		document.documentElement.setAttribute('data-theme', theme);

		// Apply custom CSS properties based on theme
		const root = document.documentElement.style;
		
		switch (theme) {
			case 'gaming':
				root.setProperty('--primary-color', '#00ff88');
				root.setProperty('--secondary-color', '#ff0080');
				root.setProperty('--accent-color', '#00d4ff');
				root.setProperty('--background-color', '#0a0a0f');
				root.setProperty('--surface-color', '#1a1a2e');
				root.setProperty('--text-color', '#ffffff');
				break;
			case 'crimson':
				root.setProperty('--primary-color', '#dc2626');
				root.setProperty('--secondary-color', '#7c2d12');
				root.setProperty('--accent-color', '#f59e0b');
				root.setProperty('--background-color', '#0f0f0f');
				root.setProperty('--surface-color', '#1f1f1f');
				root.setProperty('--text-color', '#ffffff');
				break;
			case 'light':
				root.setProperty('--primary-color', '#3b82f6');
				root.setProperty('--secondary-color', '#8b5cf6');
				root.setProperty('--accent-color', '#06b6d4');
				root.setProperty('--background-color', '#ffffff');
				root.setProperty('--surface-color', '#f8fafc');
				root.setProperty('--text-color', '#1e293b');
				break;
			case 'dark':
				root.setProperty('--primary-color', '#6366f1');
				root.setProperty('--secondary-color', '#8b5cf6');
				root.setProperty('--accent-color', '#06b6d4');
				root.setProperty('--background-color', '#0f172a');
				root.setProperty('--surface-color', '#1e293b');
				root.setProperty('--text-color', '#f8fafc');
				break;
		}
	},

	toggleTheme() {
		const themes: Theme[] = ['gaming', 'crimson', 'light', 'dark'];
		const current = get(currentTheme);
		const currentIndex = themes.indexOf(current);
		const nextIndex = (currentIndex + 1) % themes.length;
		this.setTheme(themes[nextIndex]);
	}
};