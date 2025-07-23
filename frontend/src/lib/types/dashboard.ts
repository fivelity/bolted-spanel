export interface Position {
	x: number
	y: number
}

export interface Size {
	width: number
	height: number
}

export interface WidgetConfig {
	id: string
	type: WidgetType
	title: string
	position: Position
	size: Size
	config: Record<string, any>
	dataSource?: string
	thresholds?: Threshold[]
	styling?: WidgetStyling
	zIndex?: number
}

export interface Threshold {
	id: string
	value: number
	color: string
	label?: string
	comparison: 'greater' | 'less' | 'equal'
}

export interface WidgetStyling {
	backgroundColor?: string
	borderColor?: string
	borderWidth?: number
	borderRadius?: number
	textColor?: string
	fontSize?: number
	fontWeight?: string
	opacity?: number
	shadow?: boolean
	gradient?: {
		from: string
		to: string
		direction: string
	}
}

export type WidgetType = 
	| 'gauge' 
	| 'meter' 
	| 'simple' 
	| 'circular-gauge' 
	| 'linear-gauge' 
	| 'speedometer' 
	| 'kpi-card'
	| 'arc-meter'
	| 'cosmic-sensor'

export interface DashboardLayout {
	id: string
	name: string
	description?: string
	widgets: WidgetConfig[]
	gridSize: number
	snapToGrid: boolean
	theme: string
	createdAt: Date
	updatedAt: Date
	isPublic?: boolean
	tags?: string[]
}

export interface WidgetTemplate {
	id: string
	name: string
	description: string
	type: WidgetType
	preview: string
	config: Partial<WidgetConfig>
	category: 'system' | 'performance' | 'custom' | 'community'
	author?: string
	downloads?: number
	rating?: number
}

export interface Theme {
	id: string
	name: string
	colors: {
		primary: string
		secondary: string
		accent: string
		background: string
		surface: string
		text: string
		textSecondary: string
		border: string
		success: string
		warning: string
		error: string
		info: string
	}
	isDark: boolean
	customProperties?: Record<string, string>
}

export interface DragState {
	isDragging: boolean
	draggedWidget: string | null
	dragOffset: Position
	snapToGrid: boolean
	gridSize: number
}

export interface ResizeState {
	isResizing: boolean
	resizedWidget: string | null
	resizeHandle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null
}

export interface WidgetBuilderState {
	isOpen: boolean
	mode: 'create' | 'edit'
	selectedWidget: WidgetConfig | null
	previewData: any
	activeTab: 'general' | 'styling' | 'data' | 'thresholds'
}

export interface DashboardState {
	currentLayout: DashboardLayout | null
	layouts: DashboardLayout[]
	selectedWidgets: string[]
	dragState: DragState
	resizeState: ResizeState
	widgetBuilder: WidgetBuilderState
	isGridVisible: boolean
	zoom: number
	history: DashboardLayout[]
	historyIndex: number
	aiLayout: {
		isOpen: boolean;
		suggestions: any[]; // Remove the direct LayoutSuggestion dependency
	}
}

export interface ShareConfig {
	id: string
	type: 'widget' | 'dashboard'
	name: string
	description: string
	data: WidgetConfig | DashboardLayout
	author: string
	isPublic: boolean
	tags: string[]
	createdAt: Date
}

export interface ExportOptions {
	format: 'png' | 'json' | 'svg'
	quality?: number
	width?: number
	height?: number
	includeData?: boolean
}