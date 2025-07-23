<script lang="ts">
	import { onMount } from 'svelte'
	import type { WidgetConfig } from '$lib/types/dashboard'

	interface Props {
		config: WidgetConfig
		value: number | null
	}

	let { config, value }: Props = $props()

	// Default configuration
	const defaults = {
		min: 0,
		max: 100,
		unit: '%',
		dangerZone: 80,
		warningZone: 60,
		colors: {
			safe: '#10b981',
			warning: '#f59e0b',
			danger: '#ef4444',
			background: '#e5e7eb'
		},
		showValue: true,
		showTitle: true,
		showZones: true
	}

	// Speedometer configuration with fallbacks
	let speedometerConfig = $derived({ ...defaults, ...config.config });
	let displayValue = $derived(value ?? 0);

	// Speedometer state and animation
	let mounted = $state(false);
	
	onMount(() => {
		mounted = true;
	});

	// Determine current zone color
	let zoneColor = $derived(() => {
		const currentValue = displayValue;
		if (currentValue >= speedometerConfig.dangerZone) return speedometerConfig.colors.danger;
		if (currentValue >= speedometerConfig.warningZone) return speedometerConfig.colors.warning;
		return speedometerConfig.colors.safe;
	});

	// SVG dimensions
	let size = $derived(Math.min(config.size.width, config.size.height) - 20);
	let center = $derived(size / 2);
	let radius = $derived(size * 0.35);

	// Zone calculations
	// Animation
	onMount(() => {
		mounted = true
	})

	// Calculate the position for tick marks and labels
	function calculateTickPosition(angle: number, radius: number) {
		const radian = (angle * Math.PI) / 180;
		return {
			x: Math.cos(radian) * radius,
			y: Math.sin(radian) * radius
		};
	}

	// Calculate current angle based on value
	const currentAngle = $derived(() => {
		const normalizedValue = Math.max(0, Math.min(1, (displayValue - speedometerConfig.min) / (speedometerConfig.max - speedometerConfig.min)));
		return -90 + normalizedValue * 180;
	});

	// Generate tick marks
	const tickMarks = $derived(() => {
		const marks = [];
		for (let i = 0; i <= 10; i++) {
			const angle = -90 + (i / 10) * 180;
			const value = speedometerConfig.min + (i / 10) * (speedometerConfig.max - speedometerConfig.min);
			const position = calculateTickPosition(angle, radius - 10);
			
			marks.push({
				angle,
				value: Math.round(value),
				x: position.x,
				y: position.y,
				isMajor: i % 5 === 0
			});
		}
		return marks;
	});

	// Generate segments for colored backgrounds
	const segments = $derived(() => {
		if (!speedometerConfig.showZones) return [];
		
		const segmentData = [];
		const sortedZones = [speedometerConfig.warningZone, speedometerConfig.dangerZone].sort((a, b) => a - b);
		
		// First segment (min to first threshold)
		segmentData.push({
			start: -90,
			end: -90 + ((sortedZones[0] - speedometerConfig.min) / (speedometerConfig.max - speedometerConfig.min)) * 180,
			color: speedometerConfig.colors.safe
		});
		
		// Middle segments
		for (let i = 0; i < sortedZones.length - 1; i++) {
			const startVal = sortedZones[i];
			const endVal = sortedZones[i + 1];
			segmentData.push({
				start: -90 + ((startVal - speedometerConfig.min) / (speedometerConfig.max - speedometerConfig.min)) * 180,
				end: -90 + ((endVal - speedometerConfig.min) / (speedometerConfig.max - speedometerConfig.min)) * 180,
				color: speedometerConfig.colors.warning
			});
		}
		
		// Last segment (last threshold to max)
		const lastZone = sortedZones[sortedZones.length - 1];
		segmentData.push({
			start: -90 + ((lastZone - speedometerConfig.min) / (speedometerConfig.max - speedometerConfig.min)) * 180,
			end: 90,
			color: speedometerConfig.colors.danger
		});
		
		return segmentData;
	});
</script>

<div class="speedometer flex flex-col items-center justify-center h-full p-4">
	{#if speedometerConfig.showTitle}
		<h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">
			{config.title}
		</h3>
	{/if}

	<div class="speedometer-container relative">
		<svg width={size} height={size * 0.7} class="overflow-visible">
			<!-- Background arc -->
			<path
				d="M {center - radius} {center} A {radius} {radius} 0 0 1 {center + radius} {center}"
				fill="none"
				stroke={speedometerConfig.colors.background}
				stroke-width="20"
				stroke-linecap="round"
			/>

			<!-- Zone arcs -->
			{#if speedometerConfig.showZones}
				{#each segments as segment}
					<path
						d={`M ${center + segment.start * Math.PI / 180 * radius} ${center + segment.start * Math.PI / 180 * radius} A ${radius} ${radius} 0 0 1 ${center + segment.end * Math.PI / 180 * radius} ${center + segment.end * Math.PI / 180 * radius}`}
						fill="none"
						stroke={segment.color}
						stroke-width="20"
						stroke-linecap="round"
					/>
				{/each}
			{/if}

			<!-- Tick marks -->
			{#each tickMarks as mark}
				{@const angleRad = (mark.angle * Math.PI) / 180}
				{@const tickLength = mark.isMajor ? 15 : 8}
				{@const x1 = center + (radius - 30) * Math.cos(angleRad)}
				{@const y1 = center + (radius - 30) * Math.sin(angleRad)}
				{@const x2 = center + (radius - 30 + tickLength) * Math.cos(angleRad)}
				{@const y2 = center + (radius - 30 + tickLength) * Math.sin(angleRad)}
				
				<line
					x1={x1}
					y1={y1}
					x2={x2}
					y2={y2}
					stroke="currentColor"
					stroke-width={mark.isMajor ? 2 : 1}
					class="text-gray-600 dark:text-gray-400"
				/>

				<!-- Tick labels -->
				{#if mark.isMajor}
					{@const labelValue = speedometerConfig.min + (mark.value / 10) * (speedometerConfig.max - speedometerConfig.min)}
					{@const labelX = center + (radius - 45) * Math.cos(angleRad)}
					{@const labelY = center + (radius - 45) * Math.sin(angleRad)}
					
					<text
						x={labelX}
						y={labelY}
						text-anchor="middle"
						dominant-baseline="middle"
						class="text-xs fill-current text-gray-600 dark:text-gray-400"
					>
						{Math.round(labelValue)}
					</text>
				{/if}
			{/each}

			<!-- Needle -->
			<g transform="rotate({mounted ? currentAngle : -90} {center} {center})">
				<line
					x1={center}
					y1={center}
					x2={center + radius - 40}
					y2={center}
					stroke={zoneColor()}
					stroke-width="3"
					stroke-linecap="round"
					class="transition-all duration-1000 ease-out"
				/>
				<!-- Needle tip -->
				<circle
					cx={center + radius - 40}
					cy={center}
					r="3"
					fill={zoneColor()}
				/>
			</g>

			<!-- Center hub -->
			<circle
				cx={center}
				cy={center}
				r="8"
				fill="currentColor"
				class="text-gray-400 dark:text-gray-600"
			/>
			<circle
				cx={center}
				cy={center}
				r="4"
				fill={zoneColor()}
			/>
		</svg>

		<!-- Value display -->
		{#if speedometerConfig.showValue}
			<div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center">
				<div class="text-2xl font-bold text-gray-900 dark:text-white">
					{displayValue.toFixed(1)}
				</div>
				<div class="text-xs text-gray-500 dark:text-gray-400">
					{speedometerConfig.unit}
				</div>
			</div>
		{/if}
	</div>

	<!-- Zone legend -->
	{#if speedometerConfig.showZones}
		<div class="flex items-center gap-3 mt-2 text-xs">
			<div class="flex items-center gap-1">
				<div class="w-2 h-2 rounded-full" style="background-color: {speedometerConfig.colors.safe}"></div>
				<span class="text-gray-600 dark:text-gray-400">Safe</span>
			</div>
			<div class="flex items-center gap-1">
				<div class="w-2 h-2 rounded-full" style="background-color: {speedometerConfig.colors.warning}"></div>
				<span class="text-gray-600 dark:text-gray-400">Warning</span>
			</div>
			<div class="flex items-center gap-1">
				<div class="w-2 h-2 rounded-full" style="background-color: {speedometerConfig.colors.danger}"></div>
				<span class="text-gray-600 dark:text-gray-400">Danger</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.speedometer {
		user-select: none;
	}

	.speedometer-container {
		position: relative;
		display: inline-block;
	}
</style>