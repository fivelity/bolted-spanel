<!-- Linear Gauge Widget -->
<script lang="ts">
	/* eslint-disable @typescript-eslint/no-unused-vars */
	import { onMount } from 'svelte';
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
		orientation: 'horizontal',
		colors: ['#10b981', '#f59e0b', '#ef4444'],
		thresholds: [50, 80],
		showValue: true,
		showTitle: true,
		height: 20,
		showLabels: true
	}

	let gaugeConfig = $derived({ ...defaults, ...config.config });
	let displayValue = $derived(value ?? 0);
	let percentage = $derived(Math.max(0, Math.min(100, ((displayValue - gaugeConfig.min) / (gaugeConfig.max - gaugeConfig.min)) * 100)));
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

	// Animation
	let mounted = $state(false)
	onMount(() => {
		mounted = true
	})
</script>

<div class="linear-gauge flex flex-col h-full p-4">
	{#if gaugeConfig.showTitle}
		<h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
			{config.title}
		</h3>
	{/if}

	<div class="gauge-content flex-1 flex flex-col justify-center">
		{#if gaugeConfig.orientation === 'horizontal'}
			<!-- Horizontal gauge -->
			<div class="flex items-center gap-3">
				{#if gaugeConfig.showLabels}
					<span class="text-xs text-gray-500 dark:text-gray-400 min-w-8">
						{gaugeConfig.min}
					</span>
				{/if}

				<div class="flex-1 relative">
					<!-- Background bar -->
					<div 
						class="w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
						style="height: {gaugeConfig.height}px"
					>
						<!-- Progress bar -->
						<div
							class="h-full rounded-full transition-all duration-1000 ease-out"
							style="
								width: {mounted ? percentage : 0}%;
								background-color: {currentColor};
							"
						></div>
					</div>

					<!-- Threshold markers -->
					{#if gaugeConfig.thresholds}
						{#each gaugeConfig.thresholds as threshold, i}
							{@const thresholdPercentage = ((threshold - gaugeConfig.min) / (gaugeConfig.max - gaugeConfig.min)) * 100}
							<div
								class="absolute top-0 w-0.5 bg-gray-400 dark:bg-gray-500"
								style="
									left: {thresholdPercentage}%;
									height: {gaugeConfig.height}px;
								"
							></div>
						{/each}
					{/if}
				</div>

				{#if gaugeConfig.showLabels}
					<span class="text-xs text-gray-500 dark:text-gray-400 min-w-8">
						{gaugeConfig.max}
					</span>
				{/if}
			</div>
		{:else}
			<!-- Vertical gauge -->
			<div class="flex flex-col items-center h-full">
				{#if gaugeConfig.showLabels}
					<span class="text-xs text-gray-500 dark:text-gray-400 mb-2">
						{gaugeConfig.max}
					</span>
				{/if}

				<div class="flex-1 relative flex items-end" style="width: {gaugeConfig.height}px">
					<!-- Background bar -->
					<div 
						class="w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden h-full"
					>
						<!-- Progress bar -->
						<div
							class="w-full rounded-full transition-all duration-1000 ease-out"
							style="
								height: {mounted ? percentage : 0}%;
								background-color: {currentColor};
								margin-top: auto;
							"
						></div>
					</div>

					<!-- Threshold markers -->
					{#if gaugeConfig.thresholds}
						{#each gaugeConfig.thresholds as threshold, i}
							{@const thresholdPercentage = ((threshold - gaugeConfig.min) / (gaugeConfig.max - gaugeConfig.min)) * 100}
							<div
								class="absolute left-0 h-0.5 bg-gray-400 dark:bg-gray-500 w-full"
								style="bottom: {thresholdPercentage}%"
							></div>
						{/each}
					{/if}
				</div>

				{#if gaugeConfig.showLabels}
					<span class="text-xs text-gray-500 dark:text-gray-400 mt-2">
						{gaugeConfig.min}
					</span>
				{/if}
			</div>
		{/if}

		<!-- Value display -->
		{#if gaugeConfig.showValue}
			<div class="text-center mt-3">
				<span class="text-lg font-semibold text-gray-900 dark:text-white">
					{displayValue.toFixed(1)}{gaugeConfig.unit}
				</span>
			</div>
		{/if}
	</div>

	<!-- Legend -->
	{#if gaugeConfig.thresholds && gaugeConfig.thresholds.length > 0}
		<div class="flex items-center justify-center gap-3 mt-2 text-xs">
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
	.linear-gauge {
		user-select: none;
	}
</style>