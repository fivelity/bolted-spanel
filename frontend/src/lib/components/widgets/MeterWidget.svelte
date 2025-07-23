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
	let meterColor = $derived(() => {
		const value = sensorValue();
		const colors = config.appearance.colors;
		
		if (value >= 80) return colors[2] || '#ff4444';
		if (value >= 60) return colors[1] || '#ffaa00';
		return colors[0] || '#00ff88';
	});

	// Calculate percentage for meter fill
	let percentage = $derived(() => {
		return Math.min(100, Math.max(0, sensorValue()));
	});

	// Meter bar thickness
	let barThickness = $derived(() => {
		return config.appearance.chartParams.barThickness ?? 24;
	});

	// Animation state
	let mounted = $state(false);
	let animatedPercentage = $state(0);

	onMount(() => {
		mounted = true;
		// Animate percentage on mount
		const animate = () => {
			const target = percentage();
			const diff = target - animatedPercentage;
			if (Math.abs(diff) > 0.1) {
				animatedPercentage += diff * 0.1;
				requestAnimationFrame(animate);
			} else {
				animatedPercentage = target;
			}
		};
		animate();
	});

	// Update animated percentage when value changes
	$effect(() => {
		if (mounted) {
			const target = percentage();
			const animate = () => {
				const diff = target - animatedPercentage;
				if (Math.abs(diff) > 0.1) {
					animatedPercentage += diff * 0.15;
					requestAnimationFrame(animate);
				} else {
					animatedPercentage = target;
				}
			};
			animate();
		}
	});
</script>

<div 
	class="meter-widget relative h-full w-full overflow-hidden group"
	style="border-radius: {config.appearance.borders.radius}px;"
>
	<!-- Animated background -->
	<div class="absolute inset-0 bg-gradient-to-r from-gray-900/50 via-gray-800/30 to-gray-900/50 backdrop-blur-sm"></div>
	
	<!-- Glow effect -->
	<div 
		class="absolute inset-0 rounded-lg opacity-15 blur-xl transition-all duration-1000 group-hover:opacity-25"
		style="background: linear-gradient(90deg, transparent, {meterColor()}, transparent);"
	></div>

	<!-- Main content -->
	<div class="relative z-10 h-full flex flex-col justify-center p-4">
		<!-- Title and Value Row -->
		<div class="flex items-center justify-between mb-4">
			<h3 
				class="text-sm font-semibold tracking-wide uppercase opacity-90"
				style="
					font-size: {Math.max(12, config.appearance.typography.fontSize - 2)}px;
					font-weight: {config.appearance.typography.fontWeight};
					color: {config.appearance.typography.color};
					text-shadow: 0 0 8px {meterColor()}40;
				"
			>
				{config.title}
			</h3>
			<div class="flex items-center gap-2">
				<span 
					class="text-lg font-bold transition-all duration-300 digital-display font-mono numeric-display"
					style="
						color: {meterColor()};
						text-shadow: 0 0 10px {meterColor()}, 0 0 20px {meterColor()}40;
						font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace;
					"
				>
					{sensorValue().toFixed(1)}
				</span>
				<span 
					class="text-sm opacity-70 font-orbitron"
					style="color: {config.appearance.typography.color};"
				>
					{config.unit || '%'}
				</span>
			</div>
		</div>

		<!-- Enhanced Meter Bar -->
		<div class="flex-1 flex items-center relative">
			<div class="w-full relative">
				<!-- Background bar with segments -->
				<div 
					class="w-full bg-gray-800/60 rounded-full overflow-hidden border border-gray-700/50 backdrop-blur-sm relative"
					style="height: {barThickness()}px;"
				>
					<!-- Segment lines -->
					<div class="absolute inset-0 flex">
						{#each Array(10) as _, i}
							<div class="flex-1 border-r border-gray-600/30 last:border-r-0"></div>
						{/each}
					</div>

					<!-- Progress bar with gradient and glow -->
					<div 
						class="h-full transition-all duration-700 ease-out relative overflow-hidden rounded-full"
						style="
							width: {animatedPercentage}%;
							background: linear-gradient(90deg, 
								{meterColor()}80, 
								{meterColor()}, 
								{meterColor()}80
							);
							box-shadow: 
								0 0 10px {meterColor()}60,
								inset 0 1px 0 rgba(255, 255, 255, 0.2);
						"
					>
						<!-- Animated shine effect -->
						<div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine"></div>
						
						<!-- Pulse effect for high values -->
						{#if animatedPercentage > 80}
							<div 
								class="absolute inset-0 bg-current animate-pulse opacity-30"
								style="color: {meterColor()};"
							></div>
						{/if}
					</div>
				</div>

				<!-- Threshold markers -->
				{#if config.appearance.chartParams.showLabels}
					<!-- Warning threshold at 60% -->
					<div class="absolute top-0 left-3/5 w-0.5 h-full bg-yellow-400/60 rounded-full shadow-lg" style="height: {barThickness()}px;"></div>
					<!-- Critical threshold at 80% -->
					<div class="absolute top-0 left-4/5 w-0.5 h-full bg-red-400/60 rounded-full shadow-lg" style="height: {barThickness()}px;"></div>
				{/if}

				<!-- Value indicator -->
				<div 
					class="absolute top-0 w-1 h-full bg-white rounded-full shadow-lg transition-all duration-700 ease-out"
					style="
						left: {animatedPercentage}%;
						height: {barThickness()}px;
						transform: translateX(-50%);
						box-shadow: 0 0 8px {meterColor()};
					"
				></div>
			</div>
		</div>

		<!-- Labels and Status -->
		{#if config.appearance.chartParams.showLabels}
			<div class="flex justify-between items-center text-xs mt-3">
				<div class="flex justify-between w-full opacity-60">
					<span style="color: {config.appearance.typography.color};">0</span>
					<span style="color: {config.appearance.typography.color};">25</span>
					<span style="color: {config.appearance.typography.color};">50</span>
					<span style="color: {config.appearance.typography.color};">75</span>
					<span style="color: {config.appearance.typography.color};">100</span>
				</div>
			</div>
		{/if}

		<!-- Status indicator -->
		<div class="flex items-center justify-between mt-2">
			<div class="flex items-center gap-2">
				<div 
					class="w-2 h-2 rounded-full transition-all duration-300 relative"
					style="
						background-color: {meterColor()};
						box-shadow: 0 0 6px {meterColor()};
					"
				>
					{#if animatedPercentage > 80}
						<div 
							class="absolute inset-0 rounded-full animate-ping"
							style="background-color: {meterColor()};"
						></div>
					{/if}
				</div>
				<span 
					class="text-xs font-medium tracking-wider uppercase"
					style="
						color: {config.appearance.typography.color};
						opacity: 0.8;
					"
				>
					{animatedPercentage >= 80 ? 'HIGH' : animatedPercentage >= 60 ? 'WARN' : 'NORMAL'}
				</span>
			</div>

			<!-- Mini graph effect -->
			<div class="flex items-end gap-px h-4">
				{#each Array(8) as _, i}
					{@const height = Math.random() * 16 + 4}
					<div 
						class="w-1 bg-current opacity-30 transition-all duration-300 hover:opacity-60"
						style="
							height: {height}px;
							color: {meterColor()};
						"
					></div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Corner accents -->
	<div class="absolute top-2 left-2 w-3 h-3 border-l border-t opacity-30 transition-opacity group-hover:opacity-50" style="border-color: {meterColor()};"></div>
	<div class="absolute top-2 right-2 w-3 h-3 border-r border-t opacity-30 transition-opacity group-hover:opacity-50" style="border-color: {meterColor()};"></div>
	<div class="absolute bottom-2 left-2 w-3 h-3 border-l border-b opacity-30 transition-opacity group-hover:opacity-50" style="border-color: {meterColor()};"></div>
	<div class="absolute bottom-2 right-2 w-3 h-3 border-r border-b opacity-30 transition-opacity group-hover:opacity-50" style="border-color: {meterColor()};"></div>

	<!-- Data flow lines -->
	<div class="absolute left-0 top-1/2 w-full h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-20 animate-pulse" style="color: {meterColor()};"></div>
</div>

<style lang="css">
	.meter-widget {
		border: 1px solid rgba(255, 255, 255, 0.1);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;
	}

	.meter-widget::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, transparent 50%, rgba(255, 255, 255, 0.02) 100%);
		pointer-events: none;
	}

	.meter-widget:hover {
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

	@keyframes shine {
		0% { transform: translateX(-100%); }
		100% { transform: translateX(100%); }
	}

	.animate-shine {
		animation: shine 2s ease-in-out infinite;
	}

	@media (prefers-reduced-motion: reduce) {
		.animate-shine,
		.animate-pulse,
		.animate-ping {
			animation: none;
		}
	}
</style>