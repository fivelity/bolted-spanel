import type { WidgetConfig } from './dashboard';

export interface LayoutSuggestion {
	id: string;
	name: string;
	description: string;
	widgets: WidgetConfig[];
	reasoning: string;
	confidence: number;
}

export interface AILayoutRequest {
	currentWidgets: WidgetConfig[];
	dashboardSize: { width: number; height: number };
	preferences: {
		priority: 'performance' | 'aesthetics' | 'functionality';
		theme: 'light' | 'dark';
		density: 'compact' | 'spacious';
	};
}

export interface AIContext {
	systemSpecs: {
		cpu: string;
		gpu: string;
		memory: string;
		storage: string[];
	};
	currentMetrics: {
		cpuUsage: number;
		gpuUsage: number;
		memoryUsage: number;
		temperatures: Record<string, number>;
	};
	userBehavior: {
		mostViewedMetrics: string[];
		preferredWidgetTypes: string[];
		sessionDuration: number;
	};
}