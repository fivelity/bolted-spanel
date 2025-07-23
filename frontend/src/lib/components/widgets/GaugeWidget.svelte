<script lang="ts">
	import type { WidgetConfig } from '$lib/types/dashboard';
	import { sensorStore } from '$lib/stores/sensorStore';
	import { onMount } from 'svelte';

	interface Props {
		config: WidgetConfig;
		value?: number | null;
	}

	let { config, value }: Props = $props();

	// Get sensor value reactively (fallback if no value provided)
	let sensorValue = $derived(() => {
		if (value !== undefined) return value;
		
		// Legacy compatibility: try dataSource first, then sensorPath
		const dataPath = config.dataSource || (config as any).sensorPath;
		return dataPath ? sensorStore.getSensorValue(dataPath) : null;
	});

	// Calculate color based on value and thresholds
	let gaugeColor = $derived(() => {
		const val = sensorValue();
		// Try new config structure first, then legacy
		const colors = config.config?.colors || (config as any).appearance?.colors || ['#22c55e', '#f59e0b', '#ef4444'];
		const thresholds = config.thresholds || (config as any).appearance?.thresholds || [70, 90];

		if (val === null || val === undefined) return colors[0];

		if (thresholds.length >= 2) {
			if (val >= thresholds[1]) return colors[2] || '#ef4444';
			if (val >= thresholds[0]) return colors[1] || '#f59e0b';
		}
		return colors[0] || '#22c55e';
	});

	// Animation state
	let mounted = $state(false);
	let animatedValue = $state(0);

	onMount(() => {
		mounted = true;
	});

	// Update animated value when sensor value changes
	$effect(() => {
		if (mounted) {
			const target = sensorValue();
			if (target === null || target === undefined) return;
			
			const animate = () => {
				const diff = target - animatedValue;
				if (Math.abs(diff) > 0.1) {
					animatedValue += diff * 0.15;
					requestAnimationFrame(animate);
				} else {
					animatedValue = target;
				}
			};
			animate();
		}
	});

	// Simple calculations
	let size = 200;
	let center = size / 2;
	let radius = 70;
	let strokeWidth = 8;
	
	// Calculate rotation based on value (0-100% maps to -135deg to +135deg)
	let rotation = $derived(() => {
		const maxValue = config.config?.max || 100;
		const percentage = Math.min(100, Math.max(0, (animatedValue / maxValue) * 100));
		return -135 + (percentage * 2.7); // 270 degrees total range
	});

	// Format value for display
	let formattedValue = $derived(() => {
		const val = sensorValue();
		if (val === null || val === undefined) return '—';
		return val.toFixed(1);
	});

	// Styling properties
	let borderRadius = 8;
	let titleColor = '#ffffff';
	let unit = config.config?.unit || (config as any).unit || '%';
</script>

<div 
	class="gauge-widget relative h-full w-full overflow-hidden bg-gray-900/90 rounded-lg"
	style="border-radius: {borderRadius}px;"
>
	<!-- Background gradient -->
	<div class="absolute inset-0 bg-gradient-to-br from-gray-900/50 via-gray-800/30 to-gray-900/50"></div>
	
	<!-- Content -->
	<div class="relative z-10 h-full flex flex-col items-center justify-center p-4">
		<!-- Title -->
		<h3 class="text-sm font-bold mb-4 text-center tracking-wide uppercase text-gray-300">
			{config.title}
		</h3>

		<!-- SVG Gauge -->
		<div class="relative">
			<svg width={size} height={size} viewBox="0 0 {size} {size}">
				<!-- Background arc -->
				<path
					d="M 30 170 A 70 70 0 1 1 170 30"
					fill="none"
					stroke="#374151"
					stroke-width={strokeWidth}
					stroke-linecap="round"
				/>

				<!-- Value arc -->
				<path
					d="M 30 170 A 70 70 0 {rotation() > 0 ? 1 : 0} 1 {100 + 70 * Math.cos((rotation() + 90) * Math.PI / 180)} {100 + 70 * Math.sin((rotation() + 90) * Math.PI / 180)}"
					fill="none"
					stroke={gaugeColor()}
					stroke-width={strokeWidth}
					stroke-linecap="round"
					style="filter: drop-shadow(0 0 6px {gaugeColor()});"
				/>

				<!-- Center circle -->
				<circle
					cx={center}
					cy={center}
					r="4"
					fill={gaugeColor()}
				/>

				<!-- Value text -->
				<text
					x={center}
					y={center - 10}
					text-anchor="middle"
					class="text-2xl font-bold font-mono"
					fill={gaugeColor()}
				>
					{formattedValue()}
				</text>

				<!-- Unit text -->
				<text
					x={center}
					y={center + 10}
					text-anchor="middle"
					class="text-xs opacity-80"
					fill={titleColor}
				>
					{unit}
				</text>
			</svg>
		</div>

		<!-- Status -->
		<div class="flex items-center gap-2 mt-2">
			<div 
				class="w-2 h-2 rounded-full"
				style="background-color: {gaugeColor()}; box-shadow: 0 0 6px {gaugeColor()};"
			></div>
			<span class="text-xs font-medium uppercase text-gray-400">
				{(sensorValue() || 0) >= 80 ? 'HIGH' : (sensorValue() || 0) >= 60 ? 'WARN' : 'NORMAL'}
			</span>
		</div>
	</div>
</div>