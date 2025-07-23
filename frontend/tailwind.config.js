import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
	darkMode: 'class',
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		'./node_modules/@layerchart/**/*.{html,js,svelte,ts}'
	],
	theme: {
		extend: {
			colors: {
				// Sensor-specific color schemes for SenseCanvas
				thermal: {
					50: '#f0f9ff',
					100: '#e0f2fe',
					200: '#bae6fd',
					300: '#7dd3fc',
					400: '#38bdf8',
					500: '#0ea5e9',
					600: '#0284c7',
					700: '#0369a1',
					800: '#075985',
					900: '#0c4a6e'
				},
				performance: {
					50: '#f0fdf4',
					100: '#dcfce7',
					200: '#bbf7d0',
					300: '#86efac',
					400: '#4ade80',
					500: '#22c55e',
					600: '#16a34a',
					700: '#15803d',
					800: '#166534',
					900: '#14532d'
				},
				danger: {
					50: '#fef2f2',
					100: '#fee2e2',
					200: '#fecaca',
					300: '#fca5a5',
					400: '#f87171',
					500: '#ef4444',
					600: '#dc2626',
					700: '#b91c1c',
					800: '#991b1b',
					900: '#7f1d1d'
				},
				// Gaming/Tech theme colors
				gaming: {
					50: '#f0fff4',
					100: '#dcfce7',
					200: '#bbf7d0',
					300: '#86efac',
					400: '#4ade80',
					500: '#22c55e',
					600: '#16a34a',
					700: '#15803d',
					800: '#166534',
					900: '#14532d'
				}
			},
			animation: {
				'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'bounce-subtle': 'bounce 2s infinite',
				'glow': 'glow 2s ease-in-out infinite alternate',
				'scan': 'scan 2s linear infinite'
			},
			keyframes: {
				glow: {
					'0%': { boxShadow: '0 0 5px rgba(59, 130, 246, 0.5)' },
					'100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)' }
				},
				scan: {
					'0%': { transform: 'translateX(-100%)' },
					'100%': { transform: 'translateX(100%)' }
				}
			},
			fontFamily: {
				'mono': ['JetBrains Mono', 'Consolas', 'monospace'],
				'tech': ['Orbitron', 'system-ui', 'sans-serif']
			}
		}
	},
	plugins: [
		forms,
		typography
	]
};