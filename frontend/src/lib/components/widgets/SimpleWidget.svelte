<script lang="ts">
	import { sensorStore } from '$lib/stores/sensorStore';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	
	interface Props {
		config: {
			min?: number;
			max?: number;
			unit?: string;
			colors?: string[];
			thresholds?: number[];
			[key: string]: unknown;
		};
		value: number | null;
	}

	let { config, value }: Props = $props();

	// Widget configuration with defaults
	const widgetConfig = {
		min: config.min ?? 0,
		max: config.max ?? 100,
		unit: config.unit ?? '%',
		colors: config.colors ?? ['#22c55e', '#f59e0b', '#ef4444'],
		thresholds: config.thresholds ?? [70, 90],
		...config as Record<string, unknown>
	};

	// Get sensor value reactively (fallback if no value provided)
	const sensorValue = $derived(() => {
		return value ?? get(sensorStore.data)?.cpu?.usage ?? 0;
	});

	// Color based on current value and thresholds
	const currentColor = $derived(() => {
		const val = sensorValue();
		const colors = widgetConfig.colors;
		const thresholds = widgetConfig.thresholds;

		if (val === null || val === undefined) return colors[0];
		
		for (let i = thresholds.length - 1; i >= 0; i--) {
			if (val >= thresholds[i]) {
				return colors[i + 1] || colors[colors.length - 1];
			}
		}
		return colors[0] || '#22c55e';
	});

	// Animation state
	onMount(() => {
		// Widget initialization if needed
	});

	// Dynamic styling
	const dynamicStyle = $derived(() => {
		const baseStyle = widgetConfig as Record<string, unknown>;
		return {
			backgroundColor: (baseStyle.backgroundColor as string) || '#ffffff',
			borderColor: (baseStyle.borderColor as string) || '#e5e7eb',
			borderWidth: (baseStyle.borderWidth as number) || 1,
			borderRadius: (baseStyle.borderRadius as number) || 8,
			fontSize: (baseStyle.fontSize as string) || '14px',
			fontWeight: (baseStyle.fontWeight as string) || 'normal',
		};
	});
</script>

<!-- Simple Widget Layout -->
<div 
	class="simple-widget relative h-full w-full overflow-hidden group"
	style="border-radius: {dynamicStyle().borderRadius}px;"
>
	<!-- Animated background with gradient -->
	<div class="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"></div>
	
	<!-- Pulse effect background -->
	<div 
		class="absolute inset-0 opacity-20 transition-opacity duration-1000"
		style="background: radial-gradient(circle at center, {currentColor()} 0%, transparent 70%);"
	></div>
	
	<!-- Border glow -->
	<div 
		class="absolute inset-0 rounded-lg opacity-60"
		style="border: {dynamicStyle().borderWidth}px solid {currentColor()}; box-shadow: 0 0 10px {currentColor()}40;"
	></div>
	
	<!-- Main content -->
	<div class="relative z-10 h-full flex flex-col items-center justify-center p-4 text-center">
		<!-- Value display -->
		<div 
			class="text-2xl font-bold transition-all duration-300 font-orbitron"
			style="color: {currentColor()}; font-size: {dynamicStyle().fontSize}; font-weight: {dynamicStyle().fontWeight};"
		>
			{sensorValue}
		</div>
		
		<!-- Unit display -->
		<div class="text-sm text-gray-400 font-medium uppercase tracking-wider mt-1">
			{widgetConfig.unit}
		</div>
		
		<!-- Scan line effect -->
		<div 
			class="absolute w-full h-px opacity-30 animate-scan"
			style="background: linear-gradient(90deg, transparent 0%, {currentColor()} 50%, transparent 100%);"
		></div>
	</div>

	<!-- Corner accents -->
	<div class="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 rounded-tl-lg opacity-60" style="border-color: {currentColor()};"></div>
	<div class="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 rounded-tr-lg opacity-60" style="border-color: {currentColor()};"></div>
	<div class="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 rounded-bl-lg opacity-60" style="border-color: {currentColor()};"></div>
	<div class="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 rounded-br-lg opacity-60" style="border-color: {currentColor()};"></div>
</div>

<style lang="css">
	.simple-widget {
		border: 1px solid rgba(255, 255, 255, 0.1);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;
	}

	.simple-widget::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, transparent 50%, rgba(255, 255, 255, 0.02) 100%);
		pointer-events: none;
	}

	.simple-widget:hover {
		transform: translateY(-1px);
		border-color: rgba(255, 255, 255, 0.2);
		box-shadow: 
			0 4px 20px rgba(0, 0, 0, 0.3),
			0 0 15px rgba(var(--color-primary-500), 0.2);
	}



	@keyframes scan {
		0% { transform: translateY(-100%); }
		100% { transform: translateY(calc(100vh + 100%)); }
	}

	.animate-scan {
		animation: scan 3s linear infinite;
	}

	@media (prefers-reduced-motion: reduce) {
		.animate-scan {
			animation: none;
		}
	}
</style>