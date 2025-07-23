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

	// Calculate color based on value and thresholds
	let gaugeColor = $derived(() => {
		const value = sensorValue();
		const colors = config.appearance.colors;
		
		if (value >= 80) return colors[2] || '#ff4444';
		if (value >= 60) return colors[1] || '#ffaa00';
		return colors[0] || '#00ff88';
	});

	// Arc configuration for 270-degree gauge
	let startAngle = $derived(() => config.appearance.chartParams.startAngle ?? -135);
	let endAngle = $derived(() => config.appearance.chartParams.endAngle ?? 135);
	let strokeWidth = $derived(() => config.appearance.chartParams.strokeWidth ?? 12);

	// Calculate arc path
	let normalizedValue = $derived(() => Math.min(100, Math.max(0, sensorValue())));
	let angle = $derived(() => startAngle() + ((endAngle() - startAngle()) * normalizedValue() / 100));

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

	// SVG path calculations
	function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
		const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
		return {
			x: centerX + (radius * Math.cos(angleInRadians)),
			y: centerY + (radius * Math.sin(angleInRadians))
		};
	}

	function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
		const start = polarToCartesian(x, y, radius, endAngle);
		const end = polarToCartesian(x, y, radius, startAngle);
		const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
		return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
	}

	let size = $derived(() => Math.min(config.size.w, config.size.h) - 20);
	let center = $derived(() => size() / 2);
	let radius = $derived(() => size() * 0.35);

	let backgroundPath = $derived(() => describeArc(center(), center(), radius(), startAngle(), endAngle()));
	let valuePath = $derived(() => describeArc(center(), center(), radius(), startAngle(), angle()));
</script>

<div 
	class="gauge-widget relative h-full w-full overflow-hidden"
	style="border-radius: {config.appearance.borders.radius}px;"
>
	<!-- Animated background -->
	<div class="absolute inset-0 bg-gradient-to-br from-gray-900/50 via-gray-800/30 to-gray-900/50 backdrop-blur-sm"></div>
	
	<!-- Glow effect -->
	<div 
		class="absolute inset-0 rounded-lg opacity-20 blur-xl transition-all duration-1000"
		style="background: radial-gradient(circle at center, {gaugeColor()}, transparent 70%);"
	></div>

	<!-- Main content -->
	<div class="relative z-10 h-full flex flex-col items-center justify-center p-4">
		<!-- Title with glow -->
		<h3 
			class="text-sm font-semibold mb-4 text-center tracking-wide uppercase opacity-90 text-shadow-glow"
			style="
				font-size: {Math.max(10, config.appearance.typography.fontSize - 6)}px;
				color: {config.appearance.typography.color};
				text-shadow: 0 0 10px {gaugeColor()}40;
			"
		>
			{config.title}
		</h3>

		<!-- SVG Gauge -->
		<div class="relative flex-1 flex items-center justify-center">
			<svg 
				width={size()} 
				height={size()} 
				viewBox="0 0 {size()} {size()}"
				class="transform transition-transform duration-300 hover:scale-105"
			>
				<!-- Outer glow ring -->
				<circle
					cx={center()}
					cy={center()}
					r={radius() + 8}
					fill="none"
					stroke={gaugeColor()}
					stroke-width="1"
					opacity="0.3"
					class="animate-pulse"
				/>

				<!-- Background arc -->
				<path
					d={backgroundPath()}
					fill="none"
					stroke="rgba(255, 255, 255, 0.1)"
					stroke-width={strokeWidth()}
					stroke-linecap="round"
				/>

				<!-- Value arc with gradient -->
				<defs>
					<linearGradient id="gaugeGradient-{config.id}" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" style="stop-color:{gaugeColor()};stop-opacity:0.8" />
						<stop offset="100%" style="stop-color:{gaugeColor()};stop-opacity:1" />
					</linearGradient>
					<filter id="glow-{config.id}">
						<feGaussianBlur stdDeviation="3" result="coloredBlur"/>
						<feMerge> 
							<feMergeNode in="coloredBlur"/>
							<feMergeNode in="SourceGraphic"/>
						</feMerge>
					</filter>
				</defs>

				<path
					d={valuePath()}
					fill="none"
					stroke="url(#gaugeGradient-{config.id})"
					stroke-width={strokeWidth()}
					stroke-linecap="round"
					filter="url(#glow-{config.id})"
					class="transition-all duration-700 ease-out"
				/>

				<!-- Tick marks -->
				{#each Array(9) as _, i}
					{@const tickAngle = startAngle() + ((endAngle() - startAngle()) * i / 8)}
					{@const tickStart = polarToCartesian(center(), center(), radius() - strokeWidth() - 5, tickAngle)}
					{@const tickEnd = polarToCartesian(center(), center(), radius() - strokeWidth() - 15, tickAngle)}
					<line
						x1={tickStart.x}
						y1={tickStart.y}
						x2={tickEnd.x}
						y2={tickEnd.y}
						stroke="rgba(255, 255, 255, 0.4)"
						stroke-width="2"
						stroke-linecap="round"
					/>
				{/each}

				<!-- Center value display -->
				<text
					x={center()}
					y={center() - 8}
					text-anchor="middle"
					dominant-baseline="middle"
					class="font-bold text-shadow-glow transition-all duration-300 font-mono"
					style="
						font-size: {size() * 0.12}px;
						fill: {gaugeColor()};
						text-shadow: 0 0 10px {gaugeColor()};
						font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace;
					"
				>
					{Math.round(animatedValue)}
				</text>

				<!-- Unit text -->
				<text
					x={center()}
					y={center() + 15}
					text-anchor="middle"
					dominant-baseline="middle"
					class="opacity-70 text-xs font-orbitron"
					style="
						font-size: {size() * 0.08}px;
						fill: {config.appearance.typography.color};
					"
				>
					{config.unit || '%'}
				</text>
			</svg>

			<!-- Pulse effect for high values -->
			{#if normalizedValue() > 80}
				<div 
					class="absolute inset-0 rounded-full animate-ping opacity-20"
					style="background: radial-gradient(circle, {gaugeColor()}, transparent 70%);"
				></div>
			{/if}
		</div>

		<!-- Status indicator -->
		<div class="flex items-center gap-2 mt-2">
			<div 
				class="w-2 h-2 rounded-full transition-all duration-300 shadow-lg"
				style="
					background-color: {gaugeColor()};
					box-shadow: 0 0 8px {gaugeColor()};
				"
			></div>
			<span 
				class="text-xs font-medium tracking-wide"
				style="color: {config.appearance.typography.color};"
			>
				{normalizedValue() >= 80 ? 'HIGH' : normalizedValue() >= 60 ? 'WARN' : 'NORMAL'}
			</span>
		</div>
	</div>

	<!-- Corner accents -->
	<div class="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-current opacity-30" style="color: {gaugeColor()};"></div>
	<div class="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-current opacity-30" style="color: {gaugeColor()};"></div>
	<div class="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-current opacity-30" style="color: {gaugeColor()};"></div>
	<div class="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-current opacity-30" style="color: {gaugeColor()};"></div>
</div>

<style lang="css">
	.gauge-widget {
		border: 1px solid rgba(255, 255, 255, 0.1);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;
	}

	.gauge-widget::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(255, 255, 255, 0.05) 100%);
		pointer-events: none;
	}

	.gauge-widget:hover {
		transform: translateY(-2px);
		border-color: rgba(255, 255, 255, 0.2);
		box-shadow: 
			0 8px 32px rgba(0, 0, 0, 0.3),
			0 0 20px rgba(var(--color-primary-500), 0.2);
	}

	.text-shadow-glow {
		filter: drop-shadow(0 0 4px currentColor);
	}

	@keyframes pulse-glow {
		0%, 100% { opacity: 0.3; }
		50% { opacity: 0.6; }
	}

	.animate-pulse {
		animation: pulse-glow 2s ease-in-out infinite;
	}
</style>