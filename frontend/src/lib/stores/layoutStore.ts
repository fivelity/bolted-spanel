import type { DashboardLayout, WidgetConfig } from '$lib/types/widget';
import { writable, derived, get } from 'svelte/store';
import { nanoid } from 'nanoid';

// Default widget presets
const defaultWidgets: WidgetConfig[] = [
	{
		id: nanoid(),
		type: 'gauge',
		position: { x: 0, y: 0 },
		size: { w: 200, h: 200 },
		title: 'CPU Usage',
		sensorPath: 'cpu.usage',
		unit: '%',
		appearance: {
			colors: ['#22c55e', '#f59e0b', '#ef4444'],
			typography: {
				fontSize: 16,
				fontWeight: '600',
				color: '#1f2937'
			},
			borders: {
				thickness: 2,
				style: 'solid',
				radius: 12
			},
			chartParams: {
				startAngle: -90,
				endAngle: 270,
				strokeWidth: 8,
				showLabels: true
			}
		},
		alerts: [],
		minSize: { w: 150, h: 150 },
		maxSize: { w: 400, h: 400 }
	},
	{
		id: nanoid(),
		type: 'gauge',
		position: { x: 220, y: 0 },
		size: { w: 200, h: 200 },
		title: 'GPU Usage',
		sensorPath: 'gpu.usage',
		unit: '%',
		appearance: {
			colors: ['#3b82f6', '#8b5cf6', '#ef4444'],
			typography: {
				fontSize: 16,
				fontWeight: '600',
				color: '#1f2937'
			},
			borders: {
				thickness: 2,
				style: 'solid',
				radius: 12
			},
			chartParams: {
				startAngle: -90,
				endAngle: 270,
				strokeWidth: 8,
				showLabels: true
			}
		},
		alerts: [],
		minSize: { w: 150, h: 150 },
		maxSize: { w: 400, h: 400 }
	},
	{
		id: nanoid(),
		type: 'meter',
		position: { x: 0, y: 220 },
		size: { w: 420, h: 80 },
		title: 'Memory Usage',
		sensorPath: 'memory.usage',
		unit: '%',
		appearance: {
			colors: ['#06b6d4', '#f59e0b', '#ef4444'],
			typography: {
				fontSize: 14,
				fontWeight: '500',
				color: '#1f2937'
			},
			borders: {
				thickness: 1,
				style: 'solid',
				radius: 8
			},
			chartParams: {
				barThickness: 20,
				showLabels: true,
				showGrid: false
			}
		},
		alerts: [],
		minSize: { w: 200, h: 60 },
		maxSize: { w: 600, h: 120 }
	},
	{
		id: nanoid(),
		type: 'simple',
		position: { x: 440, y: 0 },
		size: { w: 180, h: 100 },
		title: 'CPU Temp',
		sensorPath: 'cpu.temperature',
		unit: '°C',
		appearance: {
			colors: ['#10b981', '#f59e0b', '#ef4444'],
			typography: {
				fontSize: 24,
				fontWeight: '700',
				color: '#1f2937'
			},
			borders: {
				thickness: 1,
				style: 'solid',
				radius: 8
			},
			chartParams: {}
		},
		alerts: [],
		minSize: { w: 120, h: 80 },
		maxSize: { w: 300, h: 200 }
	},
	{
		id: nanoid(),
		type: 'simple',
		position: { x: 440, y: 120 },
		size: { w: 180, h: 100 },
		title: 'GPU Temp',
		sensorPath: 'gpu.temperature',
		unit: '°C',
		appearance: {
			colors: ['#10b981', '#f59e0b', '#ef4444'],
			typography: {
				fontSize: 24,
				fontWeight: '700',
				color: '#1f2937'
			},
			borders: {
				thickness: 1,
				style: 'solid',
				radius: 8
			},
			chartParams: {}
		},
		alerts: [],
		minSize: { w: 120, h: 80 },
		maxSize: { w: 300, h: 200 }
	}
];

// Create default layout
const createDefaultLayout = (): DashboardLayout => ({
	id: 'default',
	name: 'Default Layout',
	description: 'Default sensor monitoring layout',
	widgets: [...defaultWidgets], // Create a copy to avoid reference issues
	gridSize: 20,
	theme: 'gaming',
	createdAt: Date.now(),
	updatedAt: Date.now()
});

// Svelte stores
export const currentLayout = writable<DashboardLayout | null>(null);
export const savedLayouts = writable<DashboardLayout[]>([]);
export const isEditMode = writable(false);
export const selectedWidgets = writable<string[]>([]);

export const layoutStore = {
	init() {
		// Initialize with default layout if none exists
		if (!get(currentLayout)) {
			currentLayout.set(createDefaultLayout());
		}
		
		// Load saved layouts from localStorage
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('sensecanvas-layouts');
			if (saved) {
				try {
					const layouts = JSON.parse(saved);
					savedLayouts.set(layouts);
				} catch (error) {
					console.error('Failed to load saved layouts:', error);
				}
			}

			const currentSaved = localStorage.getItem('sensecanvas-current-layout');
			if (currentSaved) {
				try {
					const layout = JSON.parse(currentSaved);
					currentLayout.set(layout);
				} catch (error) {
					console.error('Failed to load current layout:', error);
					// Fall back to default layout
					currentLayout.set(createDefaultLayout());
				}
			} else {
				// No saved layout, use default
				currentLayout.set(createDefaultLayout());
			}
		}
	},

	saveLayout(layout?: DashboardLayout) {
		const layoutToSave = layout || get(currentLayout);
		layoutToSave.updatedAt = Date.now();

		// Update in saved layouts
		savedLayouts.update(layouts => {
			const existingIndex = layouts.findIndex(l => l.id === layoutToSave.id);
			if (existingIndex >= 0) {
				layouts[existingIndex] = layoutToSave;
				return layouts;
			} else {
				return [...layouts, layoutToSave];
			}
		});

		// Save to localStorage
		if (typeof window !== 'undefined') {
			localStorage.setItem('sensecanvas-layouts', JSON.stringify(get(savedLayouts)));
			localStorage.setItem('sensecanvas-current-layout', JSON.stringify(get(currentLayout)));
		}
	},

	loadLayout(layoutId: string) {
		const layouts = get(savedLayouts);
		const layout = layouts.find(l => l.id === layoutId);
		if (layout) {
			currentLayout.set({ ...layout });
			this.saveLayout();
		}
	},

	createLayout(name: string, description: string = '') {
		const newLayout: DashboardLayout = {
			id: nanoid(),
			name,
			description,
			widgets: [],
			gridSize: 20,
			theme: get(currentLayout).theme,
			createdAt: Date.now(),
			updatedAt: Date.now()
		};

		currentLayout.set(newLayout);
		this.saveLayout();
		return newLayout;
	},

	deleteLayout(layoutId: string) {
		savedLayouts.update(layouts => layouts.filter(l => l.id !== layoutId));
		
		if (typeof window !== 'undefined') {
			localStorage.setItem('sensecanvas-layouts', JSON.stringify(get(savedLayouts)));
		}
	},

	addWidget(widget: WidgetConfig) {
		currentLayout.update(layout => ({
			...layout,
			widgets: [...layout.widgets, widget]
		}));
		this.saveLayout();
	},

	updateWidget(widgetId: string, updates: Partial<WidgetConfig>) {
		currentLayout.update(layout => ({
			...layout,
			widgets: layout.widgets.map(widget =>
				widget.id === widgetId ? { ...widget, ...updates } : widget
			)
		}));
		this.saveLayout();
	},

	removeWidget(widgetId: string) {
		currentLayout.update(layout => ({
			...layout,
			widgets: layout.widgets.filter(w => w.id !== widgetId)
		}));
		selectedWidgets.update(selected => selected.filter(id => id !== widgetId));
		this.saveLayout();
	},

	toggleEditMode() {
		isEditMode.update(mode => !mode);
		selectedWidgets.set([]);
	},

	selectWidget(widgetId: string, multiSelect = false) {
		if (multiSelect) {
			selectedWidgets.update(selected => {
				if (selected.includes(widgetId)) {
					return selected.filter(id => id !== widgetId);
				} else {
					return [...selected, widgetId];
				}
			});
		} else {
			selectedWidgets.set([widgetId]);
		}
	},

	clearSelection() {
		selectedWidgets.set([]);
	},

	exportLayout(layoutId?: string): string {
		const layout = layoutId ? get(savedLayouts).find(l => l.id === layoutId) : get(currentLayout);
		return JSON.stringify(layout, null, 2);
	},

	importLayout(jsonData: string): boolean {
		try {
			const layout: DashboardLayout = JSON.parse(jsonData);
			
			// Validate layout structure
			if (!layout.id || !layout.name || !Array.isArray(layout.widgets)) {
				throw new Error('Invalid layout format');
			}

			// Generate new ID to avoid conflicts
			layout.id = nanoid();
			layout.createdAt = Date.now();
			layout.updatedAt = Date.now();

			savedLayouts.update(layouts => [...layouts, layout]);
			this.saveLayout();
			return true;
		} catch (error) {
			console.error('Failed to import layout:', error);
			return false;
		}
	}
};