<script lang="ts">
	import { onMount } from 'svelte';
	import type { WidgetConfig } from '$lib/types/dashboard';
	import type { HardwareData } from '$lib/types/hardware';
	
	// Widget components
	import CircularGauge from './widgets/CircularGauge.svelte';
	import LinearGauge from './widgets/LinearGauge.svelte';
	import Speedometer from './widgets/Speedometer.svelte';
	import KpiCard from './widgets/KpiCard.svelte';
	import SimpleWidget from './widgets/SimpleWidget.svelte';
	import ArcMeter from './widgets/ArcMeter.svelte';
	import CosmicSensorGauge from './widgets/CosmicSensorGauge.svelte';

	interface Props {
		widget: WidgetConfig;
		data: HardwareData | null;
		isPreview?: boolean;
	}

	let { widget: config, data, isPreview = false }: Props = $props();

	// Extract sensor value from data using the sensor path
	function getSensorValue(data: HardwareData | null, path: string): number | null {
		if (!data || !path) return null;

		try {
			const keys = path.split('.');
			let current: any = data;
			
			for (const key of keys) {
				if (current && typeof current === 'object' && key in current) {
					current = current[key];
				} else {
					return null;
				}
			}
			
			return typeof current === 'number' ? current : null;
		} catch (error) {
			console.warn('Failed to extract sensor value:', error);
			return null;
		}
	}

	let sensorValue = $derived(getSensorValue(data, config.dataSource || ''));
</script>

<!-- Widget Wrapper -->
<div class="widget-container w-full h-full">
	{#if config.type === 'circular-gauge'}
		<CircularGauge 
			{config} 
			value={sensorValue}
		/>
	{:else if config.type === 'linear-gauge'}
		<LinearGauge 
			{config} 
			value={sensorValue}
		/>
	{:else if config.type === 'gauge'}
		<CircularGauge 
			{config} 
			value={sensorValue}
		/>
	{:else if config.type === 'meter'}
		<LinearGauge 
			{config} 
			value={sensorValue}
		/>
	{:else if config.type === 'speedometer'}
		<Speedometer 
			{config} 
			value={sensorValue}
		/>
	{:else if config.type === 'kpi-card'}
		<KpiCard 
			{config} 
			value={sensorValue}
		/>
	{:else if config.type === 'simple'}
		<SimpleWidget 
			{config} 
			value={sensorValue}
		/>
	{:else if config.type === 'arc-meter'}
		<ArcMeter 
			{config} 
			value={sensorValue}
		/>
	{:else if config.type === 'cosmic-sensor'}
		<CosmicSensorGauge 
			{config} 
			value={sensorValue}
		/>
	{:else}
		<!-- Fallback for unknown widget types -->
		<div class="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
			<div class="text-center text-gray-500 dark:text-gray-400">
				<div class="text-2xl mb-2">⚠️</div>
				<div class="font-medium">Unknown Widget Type</div>
				<div class="text-sm">{config.type}</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.widget-container {
		position: relative;
		overflow: hidden;
	}
</style>