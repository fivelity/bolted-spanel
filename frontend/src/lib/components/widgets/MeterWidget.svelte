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

	// Calculate color based on value
	let meterColor = $derived(() => {
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

	// Calculate percentage for progress bar
	let percentage = $derived(() => {
		const maxValue = config.config?.max || 100;
		return Math.min(100, Math.max(0, (animatedValue / maxValue) * 100));
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
	class="meter-widget relative h-full w-full overflow-hidden bg-gray-900/90 rounded-lg"
	style="border-radius: {borderRadius}px;"
>
	<!-- Background gradient -->
	<div class="absolute inset-0 bg-gradient-to-br from-gray-900/50 via-gray-800/30 to-gray-900/50"></div>
	
	<!-- Content -->
	<div class="relative z-10 h-full flex flex-col justify-center p-4">
		<!-- Title and Value Row -->
		<div class="flex items-center justify-between mb-3">
			<h3 class="text-sm font-bold tracking-wide uppercase text-gray-300">
				{config.title}
			</h3>
			<div class="flex items-baseline gap-1">
				<span 
					class="text-lg font-bold font-mono"
					style="color: {meterColor()};"
				>
					{formattedValue()}
				</span>
				<span class="text-xs text-gray-400">
					{unit}
				</span>
			</div>
		</div>

		<!-- Progress Bar -->
		<div class="relative">
			<!-- Background bar -->
			<div class="w-full h-3 bg-gray-700/50 rounded-full overflow-hidden">
				<!-- Progress fill -->
				<div 
					class="h-full transition-all duration-300 rounded-full"
					style="
						width: {percentage()}%;
						background: linear-gradient(90deg, {meterColor()}, {meterColor()}dd);
						box-shadow: 0 0 8px {meterColor()}40;
					"
				></div>
			</div>

			<!-- Glow effect -->
			<div 
				class="absolute inset-0 h-3 rounded-full opacity-30 blur-sm"
				style="
					background: linear-gradient(90deg, 
						transparent 0%, 
						{meterColor()}40 {percentage()}%, 
						transparent {percentage() + 5}%
					);
				"
			></div>
		</div>

		<!-- Status indicator -->
		<div class="flex items-center justify-between mt-3">
			<div class="flex items-center gap-2">
				<div 
					class="w-2 h-2 rounded-full"
					style="background-color: {meterColor()}; box-shadow: 0 0 4px {meterColor()};"
				></div>
				<span class="text-xs font-medium uppercase text-gray-400">
					{(sensorValue() || 0) >= 80 ? 'HIGH' : (sensorValue() || 0) >= 60 ? 'WARN' : 'NORMAL'}
				</span>
			</div>
			<span class="text-xs text-gray-500">
				{percentage().toFixed(0)}%
			</span>
		</div>
	</div>
</div>