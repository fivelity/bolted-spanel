<script lang="ts">
	import { onMount } from 'svelte'
	import { Svg, Circle, Text } from 'layerchart'
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
		colors: ['#10b981', '#f59e0b', '#ef4444'],
		thresholds: [50, 80],
		showValue: true,
		showTitle: true,
		strokeWidth: 12,
		size: 160
	}

	// Merge config with defaults
	let gaugeConfig = $derived({ ...defaults, ...config.config })
	let displayValue = $derived(value ?? 0)
	let percentage = $derived(Math.max(0, Math.min(100, ((displayValue - gaugeConfig.min) / (gaugeConfig.max - gaugeConfig.min)) * 100)))

	// Calculate color based on thresholds
	let currentColor = $derived(() => {
		const thresholds = gaugeConfig.thresholds || []
		const colors = gaugeConfig.colors || defaults.colors
		
		for (let i = 0; i < thresholds.length; i++) {
			if (displayValue <= thresholds[i]) {
				return colors[i] || colors[0]
			}
		}
		
		return colors[colors.length - 1] || colors[0]
	})

	// SVG dimensions
	let size = $derived(Math.min(config.size.width, config.size.height) - 20)
	let center = $derived(size / 2)
	let radius = $derived((size - gaugeConfig.strokeWidth) / 2)

	// Arc calculations
	let circumference = $derived(2 * Math.PI * radius)
	let arcLength = $derived((percentage / 100) * circumference * 0.75) // 270 degrees
	let dashArray = $derived(`${arcLength} ${circumference}`)

	// Animation
	let mounted = $state(false)
	onMount(() => {
		mounted = true
	})
</script>

<div class="gauge-container relative">
	<svg width={size} height={size} class="transform -rotate-90">
		<!-- Background circle -->
		<circle
			cx={center}
			cy={center}
			r={radius}
			fill="none"
			stroke="currentColor"
			stroke-width={gaugeConfig.strokeWidth}
			class="text-gray-200 dark:text-gray-700"
		/>
		
		<!-- Progress circle -->
		<circle
			cx={center}
			cy={center}
			r={radius}
			fill="none"
			stroke={currentColor()}
			stroke-width={gaugeConfig.strokeWidth}
			stroke-linecap="round"
			stroke-dasharray={dashArray}
			stroke-dashoffset={circumference * 0.125}
			class="transition-all duration-1000 ease-out"
		/>
	</svg>
	
	<!-- Center content -->
	{#if gaugeConfig.showValue}
		<div class="absolute inset-0 flex flex-col items-center justify-center">
			<div class="text-2xl font-bold text-gray-900 dark:text-white">
				{displayValue.toFixed(1)}
			</div>
			<div class="text-xs text-gray-500 dark:text-gray-400">
				{gaugeConfig.unit}
			</div>
		</div>
	{/if}
	
	<!-- Threshold indicators -->
	{#if gaugeConfig.thresholds && gaugeConfig.thresholds.length > 0}
		<div class="flex items-center gap-2 mt-2 text-xs">
			{#each gaugeConfig.thresholds as threshold, i}
				<div class="flex items-center gap-1">
					<div
						class="w-2 h-2 rounded-full"
						style="background-color: {gaugeConfig.colors[i] || '#gray'}"
					></div>
					<span class="text-gray-600 dark:text-gray-400">
						{threshold}{gaugeConfig.unit}
					</span>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.gauge-container {
		width: fit-content;
		height: fit-content;
	}
</style>