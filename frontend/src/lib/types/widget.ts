export interface WidgetConfig {
	id: string;
	type: 'gauge' | 'graph' | 'simple' | 'meter' | 'multi-resource';
	position: { x: number; y: number };
	size: { w: number; h: number };
	title: string;
	sensorPath: string;
	appearance: {
		colors: string[];
		typography: {
			fontSize: number;
			fontWeight: string;
			color: string;
		};
		borders: {
			thickness: number;
			style: string;
			radius: number;
		};
		chartParams: {
			barThickness?: number;
			strokeWidth?: number;
			startAngle?: number;
			endAngle?: number;
			tickCount?: number;
			showLabels?: boolean;
			showGrid?: boolean;
		};
	};
	alerts: string[]; // Alert condition IDs
	minSize: { w: number; h: number };
	maxSize: { w: number; h: number };
	unit?: string;
}

export interface WidgetPreset {
	id: string;
	name: string;
	description: string;
	category: 'cpu' | 'gpu' | 'memory' | 'storage' | 'network' | 'system';
	config: Omit<WidgetConfig, 'id' | 'position'>;
}

export interface DashboardLayout {
	id: string;
	name: string;
	description: string;
	widgets: WidgetConfig[];
	gridSize: number;
	theme: string;
	createdAt: number;
	updatedAt: number;
}