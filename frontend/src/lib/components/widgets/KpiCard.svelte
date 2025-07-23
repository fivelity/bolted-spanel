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
		unit: '',
		precision: 1,
		showTrend: true,
		showIcon: true,
		icon: '📊',
		thresholds: [],
		colors: {
			normal: '#6b7280',
			good: '#10b981',
			warning: '#f59e0b',
			critical: '#ef4444'
		},
		showChange: false,
		changeValue: 0,
		changeUnit: '%'
	}

	// Merge config with defaults
	let kpiConfig = $derived({ ...defaults, ...config.config });
	let displayValue = $derived(value ?? 0);

	// Determine status color based on thresholds
	let statusColor = $derived(() => {
		if (!kpiConfig.thresholds || kpiConfig.thresholds.length === 0) {
			return kpiConfig.colors.normal
		}

		// Assuming thresholds are in ascending order
		const thresholds = kpiConfig.thresholds
		if (displayValue >= thresholds[2]) return kpiConfig.colors.critical
		if (displayValue >= thresholds[1]) return kpiConfig.colors.warning
		if (displayValue >= thresholds[0]) return kpiConfig.colors.good
		return kpiConfig.colors.normal
	})

	// Format large numbers
	function formatValue(val: number): string {
		if (Math.abs(val) >= 1e9) {
			return (val / 1e9).toFixed(kpiConfig.precision) + 'B'
		}
		if (Math.abs(val) >= 1e6) {
			return (val / 1e6).toFixed(kpiConfig.precision) + 'M'
		}
		if (Math.abs(val) >= 1e3) {
			return (val / 1e3).toFixed(kpiConfig.precision) + 'K'
		}
		return val.toFixed(kpiConfig.precision)
	}

	// Animation
	let mounted = $state(false)
	let animatedValue = $state(0)

	onMount(() => {
		mounted = true
		// Animate the value
		const duration = 1000
		const startTime = Date.now()
		const startValue = 0
		const endValue = displayValue

		function animate() {
			const elapsed = Date.now() - startTime
			const progress = Math.min(elapsed / duration, 1)
			
			// Easing function
			const easeOut = 1 - Math.pow(1 - progress, 3)
			animatedValue = startValue + (endValue - startValue) * easeOut

			if (progress < 1) {
				requestAnimationFrame(animate)
			}
		}

		animate()
	})

	// Update animated value when displayValue changes
	$effect(() => {
		if (mounted && displayValue !== animatedValue) {
			const duration = 500;
			const startTime = Date.now();
			const startValue = animatedValue;
			const endValue = displayValue;

			function animate() {
				const elapsed = Date.now() - startTime;
				const progress = Math.min(elapsed / duration, 1);
				const easeOut = 1 - Math.pow(1 - progress, 3);
				animatedValue = startValue + (endValue - startValue) * easeOut;

				if (progress < 1) {
					requestAnimationFrame(animate);
				}
			}

			animate();
		}
	});
</script>

<div class="kpi-card h-full p-4 flex flex-col justify-between">
	<!-- Header -->
	<div class="flex items-start justify-between mb-2">
		<div class="flex items-center gap-2">
			{#if kpiConfig.showIcon}
				<span class="text-lg">{kpiConfig.icon}</span>
			{/if}
			<h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
				{config.title}
			</h3>
		</div>
		
		{#if kpiConfig.showTrend}
			<div class="flex items-center gap-1">
				<!-- Status indicator -->
				<div 
					class="w-2 h-2 rounded-full"
					style="background-color: {statusColor}"
				></div>
			</div>
		{/if}
	</div>

	<!-- Main value -->
	<div class="flex-1 flex items-center justify-center">
		<div class="text-center">
			<div 
				class="text-3xl font-bold transition-colors duration-300"
				style="color: {statusColor}"
			>
				{formatValue(animatedValue)}
				<span class="text-lg font-normal text-gray-500 dark:text-gray-400">
					{kpiConfig.unit}
				</span>
			</div>
		</div>
	</div>

	<!-- Footer with change indicator -->
	{#if kpiConfig.showChange}
		<div class="flex items-center justify-center mt-2">
			<div class="flex items-center gap-1 text-sm">
				{#if kpiConfig.changeValue > 0}
					<svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
					</svg>
					<span class="text-green-600 dark:text-green-400">
						+{kpiConfig.changeValue.toFixed(1)}{kpiConfig.changeUnit}
					</span>
				{:else if kpiConfig.changeValue < 0}
					<svg class="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
					</svg>
					<span class="text-red-600 dark:text-red-400">
						{kpiConfig.changeValue.toFixed(1)}{kpiConfig.changeUnit}
					</span>
				{:else}
					<svg class="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
					</svg>
					<span class="text-gray-600 dark:text-gray-400">
						0{kpiConfig.changeUnit}
					</span>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Threshold indicators -->
	{#if kpiConfig.thresholds && kpiConfig.thresholds.length > 0}
		<div class="mt-2 flex justify-center">
			<div class="flex items-center gap-1">
				{#each kpiConfig.thresholds as threshold, i}
					<div 
						class="w-1 h-1 rounded-full opacity-50"
						class:opacity-100={displayValue >= threshold}
						style="background-color: {
							i === 0 ? kpiConfig.colors.good :
							i === 1 ? kpiConfig.colors.warning :
							kpiConfig.colors.critical
						}"
					></div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.kpi-card {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		user-select: none;
	}

	:global(.dark) .kpi-card {
		background: linear-gradient(135deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.1) 100%);
		border: 1px solid rgba(255, 255, 255, 0.05);
	}
</style>