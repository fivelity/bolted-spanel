import { writable, derived } from 'svelte/store'
import { nanoid } from 'nanoid'
import type { 
	DashboardLayout, 
	WidgetConfig, 
	DashboardState, 
	WidgetTemplate,
	Theme,
	Position,
	Size,
	LayoutSuggestion
} from '../types/dashboard'
import type { LayoutSuggestion } from '../types/ai';

// Create initial dashboard state
const initialState: DashboardState = {
	currentLayout: null,
	layouts: [],
	selectedWidgets: [],
	dragState: {
		isDragging: false,
		draggedWidget: null,
		dragOffset: { x: 0, y: 0 },
		snapToGrid: true,
		gridSize: 20
	},
	resizeState: {
		isResizing: false,
		resizedWidget: null,
		resizeHandle: null
	},
	widgetBuilder: {
		isOpen: false,
		mode: 'create',
		selectedWidget: null,
		previewData: null,
		activeTab: 'general'
	},
	isGridVisible: true,
	zoom: 1,
	history: [],
	historyIndex: -1,
	aiLayout: {
		isOpen: false,
		suggestions: []
	}
}

// Main dashboard store
export const dashboardState = writable<DashboardState>(initialState)

// Derived stores for easier access
export const currentLayout = derived(dashboardState, $state => $state.currentLayout)
export const selectedWidgets = derived(dashboardState, $state => $state.selectedWidgets)
export const dragState = derived(dashboardState, $state => $state.dragState)
export const widgetBuilder = derived(dashboardState, $state => $state.widgetBuilder)

// Widget templates store
export const widgetTemplates = writable<WidgetTemplate[]>([
	{
		id: 'cpu-gauge',
		name: 'CPU Usage Gauge',
		description: 'Circular gauge showing CPU usage percentage',
		type: 'circular-gauge',
		preview: '/templates/cpu-gauge.png',
		config: {
			type: 'circular-gauge',
			title: 'CPU Usage',
			size: { width: 200, height: 200 },
			config: {
				min: 0,
				max: 100,
				unit: '%',
				dataSource: 'cpu.usage',
				colors: ['#10b981', '#f59e0b', '#ef4444'],
				thresholds: [50, 80]
			}
		},
		category: 'system'
	},
	{
		id: 'gpu-temp-speedometer',
		name: 'GPU Temperature',
		description: 'Speedometer-style gauge for GPU temperature',
		type: 'speedometer',
		preview: '/templates/gpu-temp.png',
		config: {
			type: 'speedometer',
			title: 'GPU Temperature',
			size: { width: 250, height: 180 },
			config: {
				min: 0,
				max: 100,
				unit: '°C',
				dataSource: 'gpu.temperature',
				dangerZone: 85
			}
		},
		category: 'system'
	},
	{
		id: 'memory-linear',
		name: 'Memory Usage Bar',
		description: 'Linear gauge showing memory usage',
		type: 'linear-gauge',
		preview: '/templates/memory-bar.png',
		config: {
			type: 'linear-gauge',
			title: 'Memory Usage',
			size: { width: 300, height: 80 },
			config: {
				min: 0,
				max: 100,
				unit: '%',
				dataSource: 'memory.usage',
				orientation: 'horizontal'
			}
		},
		category: 'system'
	},
	{
		id: 'performance-chart',
		name: 'Performance Chart',
		description: 'Multi-line chart showing system performance over time',
		type: 'line-chart',
		preview: '/templates/performance-chart.png',
		config: {
			type: 'line-chart',
			title: 'System Performance',
			size: { width: 400, height: 250 },
			config: {
				dataSources: ['cpu.usage', 'memory.usage', 'gpu.usage'],
				timeRange: '5m',
				showLegend: true
			}
		},
		category: 'performance'
	}
])

// Themes store
export const themes = writable<Theme[]>([
	{
		id: 'dark-gaming',
		name: 'Dark Gaming',
		isDark: true,
		colors: {
			primary: '#8b5cf6',
			secondary: '#06b6d4',
			accent: '#f59e0b',
			background: '#0f172a',
			surface: '#1e293b',
			text: '#f8fafc',
			textSecondary: '#cbd5e1',
			border: '#334155',
			success: '#10b981',
			warning: '#f59e0b',
			error: '#ef4444',
			info: '#06b6d4'
		}
	},
	{
		id: 'light-minimal',
		name: 'Light Minimal',
		isDark: false,
		colors: {
			primary: '#6366f1',
			secondary: '#8b5cf6',
			accent: '#06b6d4',
			background: '#ffffff',
			surface: '#f8fafc',
			text: '#1e293b',
			textSecondary: '#64748b',
			border: '#e2e8f0',
			success: '#10b981',
			warning: '#f59e0b',
			error: '#ef4444',
			info: '#06b6d4'
		}
	},
	{
		id: 'neon-cyber',
		name: 'Neon Cyber',
		isDark: true,
		colors: {
			primary: '#00ff88',
			secondary: '#ff0080',
			accent: '#00d4ff',
			background: '#000011',
			surface: '#1a1a2e',
			text: '#ffffff',
			textSecondary: '#cccccc',
			border: '#333366',
			success: '#00ff88',
			warning: '#ffaa00',
			error: '#ff0080',
			info: '#00d4ff'
		}
	}
])

export const currentTheme = writable<Theme | null>(null)

// Dashboard actions
export const dashboardActions = {
	// Layout management
	createLayout: (name: string, description?: string) => {
		const newLayout: DashboardLayout = {
			id: nanoid(),
			name,
			description,
			widgets: [],
			gridSize: 20,
			snapToGrid: true,
			theme: 'dark-gaming',
			createdAt: new Date(),
			updatedAt: new Date()
		}
		
		dashboardState.update(state => ({
			...state,
			layouts: [...state.layouts, newLayout],
			currentLayout: newLayout
		}))
		
		return newLayout
	},

	loadLayout: (layout: DashboardLayout) => {
		dashboardState.update(state => ({
			...state,
			currentLayout: layout
		}))
	},

	saveLayout: () => {
		dashboardState.update(state => {
			if (!state.currentLayout) return state
			
			const updatedLayout = {
				...state.currentLayout,
				updatedAt: new Date()
			}
			
			const layouts = state.layouts.map(layout => 
				layout.id === updatedLayout.id ? updatedLayout : layout
			)
			
			return {
				...state,
				layouts,
				currentLayout: updatedLayout
			}
		})
	},

	// Widget management
	addWidget: (template: WidgetTemplate, position?: Position) => {
		const widget: WidgetConfig = {
			id: nanoid(),
			...template.config,
			position: position || { x: 100, y: 100 },
			size: template.config.size || { width: 200, height: 200 }
		} as WidgetConfig
		
		dashboardState.update(state => {
			if (!state.currentLayout) return state
			
			return {
				...state,
				currentLayout: {
					...state.currentLayout,
					widgets: [...state.currentLayout.widgets, widget]
				}
			}
		})
		
		return widget
	},

	updateWidget: (widgetId: string, updates: Partial<WidgetConfig>) => {
		dashboardState.update(state => {
			if (!state.currentLayout) return state
			
			return {
				...state,
				currentLayout: {
					...state.currentLayout,
					widgets: state.currentLayout.widgets.map(widget =>
						widget.id === widgetId ? { ...widget, ...updates } : widget
					)
				}
			}
		})
	},

	removeWidget: (widgetId: string) => {
		dashboardState.update(state => {
			if (!state.currentLayout) return state
			
			return {
				...state,
				currentLayout: {
					...state.currentLayout,
					widgets: state.currentLayout.widgets.filter(widget => widget.id !== widgetId)
				}
			}
		})
	},

	// Selection management
	selectWidget: (widgetId: string, multiSelect = false) => {
		dashboardState.update(state => ({
			...state,
			selectedWidgets: multiSelect 
				? [...state.selectedWidgets, widgetId]
				: [widgetId]
		}))
	},

	deselectWidget: (widgetId: string) => {
		dashboardState.update(state => ({
			...state,
			selectedWidgets: state.selectedWidgets.filter(id => id !== widgetId)
		}))
	},

	clearSelection: () => {
		dashboardState.update(state => ({
			...state,
			selectedWidgets: []
		}))
	},

	// Drag and drop
	startDrag: (widgetId: string, offset: Position) => {
		dashboardState.update(state => ({
			...state,
			dragState: {
				...state.dragState,
				isDragging: true,
				draggedWidget: widgetId,
				dragOffset: offset
			}
		}))
	},

	updateDrag: (position: Position) => {
		dashboardState.update(state => {
			if (!state.dragState.draggedWidget) return state
			
			const snappedPosition = state.dragState.snapToGrid
				? {
					x: Math.round(position.x / state.dragState.gridSize) * state.dragState.gridSize,
					y: Math.round(position.y / state.dragState.gridSize) * state.dragState.gridSize
				}
				: position
			
			return {
				...state,
				currentLayout: state.currentLayout ? {
					...state.currentLayout,
					widgets: state.currentLayout.widgets.map(widget =>
						widget.id === state.dragState.draggedWidget
							? { ...widget, position: snappedPosition }
							: widget
					)
				} : null
			}
		})
	},

	endDrag: () => {
		dashboardState.update(state => ({
			...state,
			dragState: {
				...state.dragState,
				isDragging: false,
				draggedWidget: null,
				dragOffset: { x: 0, y: 0 }
			}
		}))
	},

	// Widget builder
	openWidgetBuilder: (mode: 'create' | 'edit', widget?: WidgetConfig) => {
		dashboardState.update(state => ({
			...state,
			widgetBuilder: {
				...state.widgetBuilder,
				isOpen: true,
				mode,
				selectedWidget: widget || null,
				activeTab: 'general'
			}
		}))
	},

	closeWidgetBuilder: () => {
		dashboardState.update(state => ({
			...state,
			widgetBuilder: {
				...state.widgetBuilder,
				isOpen: false,
				selectedWidget: null
			}
		}))
	},

	// Grid and zoom
	toggleGrid: () => {
		dashboardState.update(state => ({
			...state,
			isGridVisible: !state.isGridVisible
		}))
	},

	setZoom: (zoom: number) => {
		dashboardState.update(state => ({
			...state,
			zoom: Math.max(0.25, Math.min(2, zoom))
		}))
	},

	// History (undo/redo)
	saveToHistory: () => {
		dashboardState.update(state => {
			if (!state.currentLayout) return state
			
			const newHistory = state.history.slice(0, state.historyIndex + 1)
			newHistory.push(JSON.parse(JSON.stringify(state.currentLayout)))
			
			return {
				...state,
				history: newHistory.slice(-50), // Keep last 50 states
				historyIndex: Math.min(newHistory.length - 1, 49)
			}
		})
	},

	undo: () => {
		dashboardState.update(state => {
			if (state.historyIndex <= 0) return state
			
			const previousLayout = state.history[state.historyIndex - 1]
			
			return {
				...state,
				currentLayout: JSON.parse(JSON.stringify(previousLayout)),
				historyIndex: state.historyIndex - 1
			}
		})
	},

	redo: () => {
		dashboardState.update(state => {
			if (state.historyIndex >= state.history.length - 1) return state
			
			const nextLayout = state.history[state.historyIndex + 1]
			
			return {
				...state,
				currentLayout: JSON.parse(JSON.stringify(nextLayout)),
				historyIndex: state.historyIndex + 1
			}
		})
	},

	// AI Layout
	openAILayoutModal: () => {
		dashboardState.update(state => ({
			...state,
			aiLayout: { ...state.aiLayout, isOpen: true }
		}));
	},

	closeAILayoutModal: () => {
		dashboardState.update(state => ({
			...state,
			aiLayout: { ...state.aiLayout, isOpen: false }
		}));
	},

	applyLayoutSuggestion: (suggestion: LayoutSuggestion) => {
		dashboardState.update(state => {
			if (!state.currentLayout) return state;
			
			return {
				...state,
				currentLayout: {
					...state.currentLayout,
					widgets: suggestion.widgets
				}
			};
		});
	}
}

// Initialize with default layout
dashboardActions.createLayout('Default Dashboard', 'Your main hardware monitoring dashboard')