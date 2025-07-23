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
	let valueColor = $derived(() => {
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

	// Format value for display
	let displayValue = $derived(() => {
		const val = sensorValue();
		if (val === null || val === undefined) return '—';
		if (val >= 1000) {
			return (val / 1000).toFixed(1) + 'K';
		}
		return val.toFixed(1);
	});

	// Animation state
	let mounted = $state(false);
	let animatedValue = $state(0);

	onMount(() => {
		mounted = true;
		// Animate value on mount
		const animate = () => {
			const target = sensorValue();
			if (target === null || target === undefined) return;
			const diff = target - animatedValue;
			if (Math.abs(diff) > 0.1) {
				animatedValue += diff * 0.1;
				requestAnimationFrame(animate);
			} else {
				animatedValue = target;
			}
		};
		animate();
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

	let formattedAnimatedValue = $derived(() => {
		if (animatedValue >= 1000) {
			return (animatedValue / 1000).toFixed(1) + 'K';
		}
		return animatedValue.toFixed(1);
	});

	// Get styling properties with fallbacks
	let borderRadius = $derived(() => {
		return (config as any).appearance?.borders?.radius || config.styling?.borderRadius || 8;
	});

	let fontSize = $derived(() => {
		return (config as any).appearance?.typography?.fontSize || config.styling?.fontSize || 16;
	});

	let fontWeight = $derived(() => {
		return (config as any).appearance?.typography?.fontWeight || config.styling?.fontWeight || 'bold';
	});
</script>

<div 
	class="simple-widget relative h-full w-full overflow-hidden group"
	style="border-radius: {borderRadius}px;"
>
	<!-- Animated background with gradient -->
	<div class="absolute inset-0 bg-gradient-to-br from-gray-900/60 via-gray-800/40 to-gray-900/60 backdrop-blur-sm"></div>
	
	<!-- Dynamic glow effect -->
	<div 
		class="absolute inset-0 opacity-20 transition-opacity duration-1000"
		style="background: radial-gradient(circle at center, {valueColor} 0%, transparent 70%);"
	></div>
	
	<!-- Border glow -->
	<div 
		class="absolute inset-0 rounded-lg opacity-60"
		style="border: 1px solid {valueColor}; box-shadow: 0 0 10px {valueColor}40;"
	></div>
	
	<!-- Content -->
	<div class="relative z-10 h-full flex flex-col items-center justify-center p-4 text-center">
		<!-- Title -->
		<div class="text-xs font-medium text-gray-300 mb-1 uppercase tracking-wider font-orbitron">
			{config.title}
		</div>
		
		<!-- Value -->
		<div 
			class="text-2xl font-bold transition-all duration-300 font-orbitron"
			style="color: {valueColor}; font-size: {fontSize}px; font-weight: {fontWeight};"
		>
			{formattedAnimatedValue}
		</div>
		
		<!-- Unit -->
		{#if config.config?.unit || (config as any).unit}
			<div class="text-xs text-gray-400 mt-1 font-mono">
				{config.config?.unit || (config as any).unit}
			</div>
		{/if}
	</div>

	<!-- Scanning line effect -->
	<div class="absolute inset-0 overflow-hidden rounded-lg">
		<div 
			class="absolute w-full h-px opacity-30 animate-scan"
			style="background: linear-gradient(90deg, transparent 0%, {valueColor} 50%, transparent 100%);"
		></div>
	</div>

	<!-- Corner accents -->
	<div class="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 rounded-tl-lg opacity-60" style="border-color: {valueColor};"></div>
	<div class="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 rounded-tr-lg opacity-60" style="border-color: {valueColor};"></div>
	<div class="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 rounded-bl-lg opacity-60" style="border-color: {valueColor};"></div>
	<div class="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 rounded-br-lg opacity-60" style="border-color: {valueColor};"></div>
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