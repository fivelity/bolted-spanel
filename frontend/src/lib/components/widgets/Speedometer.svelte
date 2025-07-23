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

	// Merge config with defaults
	let speedometerConfig = $derived({ ...defaults, ...config.config });
	let displayValue = $derived(value ?? 0);
	let percentage = $derived(Math.max(0, Math.min(100, ((displayValue - speedometerConfig.min) / (speedometerConfig.max - speedometerConfig.min)) * 100)));

	// Calculate needle angle (180 degrees total, from -90 to +90)
	let needleAngle = $derived(-90 + (percentage / 100) * 180);

	// Determine current zone color
	let currentZoneColor = $derived(() => {
		if (displayValue >= speedometerConfig.dangerZone) return speedometerConfig.colors.danger
		if (displayValue >= speedometerConfig.warningZone) return speedometerConfig.colors.warning
		return speedometerConfig.colors.safe
	})

	// SVG dimensions
	let size = $derived(Math.min(config.size.width, config.size.height) - 20);
	let center = $derived(size / 2);
	let radius = $derived(size * 0.35);

	// Zone calculations
	let warningAngle = $derived(-90 + ((speedometerConfig.warningZone - speedometerConfig.min) / (speedometerConfig.max - speedometerConfig.min)) * 180);
	let dangerAngle = $derived(-90 + ((speedometerConfig.dangerZone - speedometerConfig.min) / (speedometerConfig.max - speedometerConfig.min)) * 180);

	// Animation
	let mounted = $state(false)
	onMount(() => {
		mounted = true
	})

	// Helper function to create arc path
	function createArcPath(startAngle: number, endAngle: number, radius: number, strokeWidth: number) {
		const startAngleRad = (startAngle * Math.PI) / 180
		const endAngleRad = (endAngle * Math.PI) / 180
		
		const innerRadius = radius - strokeWidth / 2
		const outerRadius = radius + strokeWidth / 2
		
		const x1 = center + innerRadius * Math.cos(startAngleRad)
		const y1 = center + innerRadius * Math.sin(startAngleRad)
		const x2 = center + innerRadius * Math.cos(endAngleRad)
		const y2 = center + innerRadius * Math.sin(endAngleRad)
		
		const x3 = center + outerRadius * Math.cos(endAngleRad)
		const y3 = center + outerRadius * Math.sin(endAngleRad)
		const x4 = center + outerRadius * Math.cos(startAngleRad)
		const y4 = center + outerRadius * Math.sin(startAngleRad)
		
		const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0
		
		return `M ${x1} ${y1} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`
	}
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
				<!-- Safe zone -->
				<path
					d="M {center - radius} {center} A {radius} {radius} 0 0 1 {center + radius * Math.cos((warningAngle * Math.PI) / 180)} {center + radius * Math.sin((warningAngle * Math.PI) / 180)}"
					fill="none"
					stroke={speedometerConfig.colors.safe}
					stroke-width="20"
					stroke-linecap="round"
				/>

				<!-- Warning zone -->
				<path
					d="M {center + radius * Math.cos((warningAngle * Math.PI) / 180)} {center + radius * Math.sin((warningAngle * Math.PI) / 180)} A {radius} {radius} 0 0 1 {center + radius * Math.cos((dangerAngle * Math.PI) / 180)} {center + radius * Math.sin((dangerAngle * Math.PI) / 180)}"
					fill="none"
					stroke={speedometerConfig.colors.warning}
					stroke-width="20"
					stroke-linecap="round"
				/>

				<!-- Danger zone -->
				<path
					d="M {center + radius * Math.cos((dangerAngle * Math.PI) / 180)} {center + radius * Math.sin((dangerAngle * Math.PI) / 180)} A {radius} {radius} 0 0 1 {center + radius} {center}"
					fill="none"
					stroke={speedometerConfig.colors.danger}
					stroke-width="20"
					stroke-linecap="round"
				/>
			{/if}

			<!-- Tick marks -->
			{#each Array(11) as _, i}
				{@const angle = -90 + (i * 18)}
				{@const angleRad = (angle * Math.PI) / 180}
				{@const tickLength = i % 5 === 0 ? 15 : 8}
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
					stroke-width={i % 5 === 0 ? 2 : 1}
					class="text-gray-600 dark:text-gray-400"
				/>

				<!-- Tick labels -->
				{#if i % 5 === 0}
					{@const labelValue = speedometerConfig.min + (i / 10) * (speedometerConfig.max - speedometerConfig.min)}
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
			<g transform="rotate({mounted ? needleAngle : -90} {center} {center})">
				<line
					x1={center}
					y1={center}
					x2={center + radius - 40}
					y2={center}
					stroke={currentZoneColor()}
					stroke-width="3"
					stroke-linecap="round"
					class="transition-all duration-1000 ease-out"
				/>
				<!-- Needle tip -->
				<circle
					cx={center + radius - 40}
					cy={center}
					r="3"
					fill={currentZoneColor()}
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
				fill={currentZoneColor()}
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