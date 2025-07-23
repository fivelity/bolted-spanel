<script lang="ts">
	import type { WidgetConfig } from '$lib/types/widget';
	import { sensorStore } from '$lib/stores/sensorStore';
	import { onMount } from 'svelte';

	interface Props {
		config: WidgetConfig;
	}

	let { config }: Props = $props();

	// Get sensor value reactively
	let sensorValue = $derived(() => {
		return sensorStore.getSensorValue(config.sensorPath);
	});

	// Calculate color based on value
	let valueColor = $derived(() => {
		const value = sensorValue();
		const colors = config.appearance.colors;
		
		// Temperature-based coloring for temperature sensors
		if (config.sensorPath.includes('temperature')) {
			if (value >= 80) return colors[2] || '#ff4444'; // Hot
			if (value >= 60) return colors[1] || '#ffaa00'; // Warm
			return colors[0] || '#00ff88'; // Cool
		}
		
		// Usage-based coloring for other sensors
		if (value >= 80) return colors[2] || '#ff4444';
		if (value >= 60) return colors[1] || '#ffaa00';
		return colors[0] || '#00ff88';
	});

	// Format value for display
	let displayValue = $derived(() => {
		const value = sensorValue();
		if (value >= 1000) {
			return (value / 1000).toFixed(1) + 'K';
		}
		return value.toFixed(1);
	});

	// Animation state
	let mounted = $state(false);
	let animatedValue = $state(0);

	onMount(() => {
		mounted = true;
		// Animate value on mount
		const animate = () => {
			const target = sensorValue();
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
</script>

<div 
	class="simple-widget relative h-full w-full overflow-hidden group"
	style="border-radius: {config.appearance.borders.radius}px;"
>
	<!-- Animated background with gradient -->
	<div class="absolute inset-0 bg-gradient-to-br from-gray-900/60 via-gray-800/40 to-gray-900/60 backdrop-blur-sm"></div>
	
	<!-- Dynamic glow effect -->
	<div 
		class="absolute inset-0 rounded-lg opacity-20 blur-xl transition-all duration-1000 group-hover:opacity-30"
		style="background: radial-gradient(circle at center, {valueColor()}, transparent 70%);"
	></div>

	<!-- Scan line effect -->
	<div class="absolute inset-0 overflow-hidden rounded-lg">
		<div 
			class="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-scan"
			style="background: linear-gradient(90deg, transparent, {valueColor()}, transparent);"
		></div>
	</div>

	<!-- Main content -->
	<div class="relative z-10 h-full flex flex-col items-center justify-center p-4">
		<!-- Title with holographic effect -->
		<h3 
			class="text-xs font-semibold mb-3 text-center tracking-wider uppercase opacity-90 holographic-text"
			style="
				font-size: {Math.max(10, config.appearance.typography.fontSize - 6)}px;
				color: {config.appearance.typography.color};
				text-shadow: 0 0 8px {valueColor()}60;
			"
		>
			{config.title}
		</h3>

		<!-- Value Display with enhanced styling -->
		<div class="flex-1 flex items-center justify-center">
			<div class="text-center relative">
				<!-- Background glow for value -->
				<div 
					class="absolute inset-0 blur-lg opacity-50 transition-all duration-300"
					style="color: {valueColor()};"
				>
					<div 
						class="font-bold"
						style="
							font-size: {config.appearance.typography.fontSize * 1.2}px;
							font-weight: {config.appearance.typography.fontWeight};
						"
					>
						{formattedAnimatedValue()}
					</div>
				</div>

				<!-- Main value -->
				<div 
					class="relative font-bold transition-all duration-300 digital-display group-hover:scale-105 font-mono numeric-display"
					style="
						font-size: {config.appearance.typography.fontSize * 1.2}px;
						font-weight: {config.appearance.typography.fontWeight};
						color: {valueColor()};
						text-shadow: 0 0 12px {valueColor()}, 0 0 24px {valueColor()}40;
						font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace;
					"
				>
					{formattedAnimatedValue()}
				</div>

				<!-- Unit with subtle glow -->
				<div 
					class="text-sm opacity-80 mt-1 tracking-widest font-orbitron"
					style="
						color: {config.appearance.typography.color};
						text-shadow: 0 0 6px {valueColor()}30;
					"
				>
					{config.unit || ''}
				</div>
			</div>
		</div>

		<!-- Enhanced status bar with segments -->
		<div class="w-full mt-3">
			<div class="flex justify-between text-xs opacity-60 mb-1">
				<span>0</span>
				<span>50</span>
				<span>100</span>
			</div>
			<div class="w-full h-2 bg-gray-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-gray-700/50">
				<!-- Segmented progress bar -->
				<div class="h-full flex">
					{#each Array(20) as _, i}
						{@const segmentValue = (i + 1) * 5}
						{@const isActive = animatedValue >= segmentValue - 2.5}
						<div 
							class="flex-1 transition-all duration-300 mx-px first:ml-0 last:mr-0"
							style="
								background-color: {isActive ? valueColor() : 'transparent'};
								opacity: {isActive ? (segmentValue <= animatedValue ? 1 : 0.5) : 0.1};
								box-shadow: {isActive ? `0 0 4px ${valueColor()}` : 'none'};
							"
						></div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Status indicator with pulse -->
		<div class="flex items-center gap-2 mt-2">
			<div 
				class="w-2 h-2 rounded-full transition-all duration-300 relative"
				style="
					background-color: {valueColor()};
					box-shadow: 0 0 8px {valueColor()};
				"
			>
				{#if animatedValue > 80}
					<div 
						class="absolute inset-0 rounded-full animate-ping"
						style="background-color: {valueColor()};"
					></div>
				{/if}
			</div>
			<span 
				class="text-xs font-medium tracking-wider uppercase"
				style="
					color: {config.appearance.typography.color};
					text-shadow: 0 0 4px {valueColor()}30;
				"
			>
				{animatedValue >= 80 ? 'CRITICAL' : animatedValue >= 60 ? 'WARNING' : 'OPTIMAL'}
			</span>
		</div>
	</div>

	<!-- Corner brackets for sci-fi look -->
	<div class="absolute top-1 left-1 w-3 h-3 border-l border-t opacity-40 transition-opacity group-hover:opacity-60" style="border-color: {valueColor()};"></div>
	<div class="absolute top-1 right-1 w-3 h-3 border-r border-t opacity-40 transition-opacity group-hover:opacity-60" style="border-color: {valueColor()};"></div>
	<div class="absolute bottom-1 left-1 w-3 h-3 border-l border-b opacity-40 transition-opacity group-hover:opacity-60" style="border-color: {valueColor()};"></div>
	<div class="absolute bottom-1 right-1 w-3 h-3 border-r border-b opacity-40 transition-opacity group-hover:opacity-60" style="border-color: {valueColor()};"></div>

	<!-- Data stream effect -->
	<div class="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-transparent via-current to-transparent opacity-20 animate-pulse" style="color: {valueColor()};"></div>
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

	.digital-display {
		letter-spacing: 0.1em;
		font-variant-numeric: tabular-nums;
	}

	.holographic-text {
		background: linear-gradient(45deg, currentColor, transparent, currentColor);
		background-clip: text;
		-webkit-background-clip: text;
	}

	@keyframes scan {
		0% { transform: translateY(-100%); }
		100% { transform: translateY(calc(100vh + 100%)); }
	}

	.animate-scan {
		animation: scan 3s linear infinite;
	}

	@media (prefers-reduced-motion: reduce) {
		.animate-scan,
		.animate-ping {
			animation: none;
		}
	}
</style>