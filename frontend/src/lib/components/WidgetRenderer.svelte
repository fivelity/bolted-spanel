<script lang="ts">
	import CircularGauge from './widgets/CircularGauge.svelte'
	import LinearGauge from './widgets/LinearGauge.svelte'
	import Speedometer from './widgets/Speedometer.svelte'
	// import BarChart from './widgets/BarChart.svelte'
	// import LineChart from './widgets/LineChart.svelte'
	// import AreaChart from './widgets/AreaChart.svelte'
	import KpiCard from './widgets/KpiCard.svelte'
	// import TextDisplay from './widgets/TextDisplay.svelte'
	// import SystemInfo from './widgets/SystemInfo.svelte'
	// import TemperatureGrid from './widgets/TemperatureGrid.svelte'
	// import NetworkMonitor from './widgets/NetworkMonitor.svelte'
	import type { WidgetConfig } from '$lib/types/dashboard'
	import type { HardwareData } from '$lib/types/hardware'

	interface Props {
		config: WidgetConfig
		data: HardwareData | null
	}

	let { config, data }: Props = $props()

	// Extract data value based on data source path
	function getDataValue(dataSource: string, data: HardwareData | null): any {
		if (!data || !dataSource) return null
		
		const path = dataSource.split('.')
		let value: any = data
		
		for (const key of path) {
			if (value && typeof value === 'object' && key in value) {
				value = value[key]
			} else {
				return null
			}
		}
		
		return value
	}

	// For currentValue
	let currentValue = $derived(config.dataSource ? getDataValue(config.dataSource, data) : null);

	// Comment out missing imports until created
</script>

<div class="widget-renderer h-full w-full">
	{#if config.type === 'circular-gauge'}
		<CircularGauge 
			{config}
			value={currentValue}
		/>
	{:else if config.type === 'linear-gauge'}
		<LinearGauge 
			{config}
			value={currentValue}
		/>
	{:else if config.type === 'speedometer'}
		<Speedometer 
			{config}
			value={currentValue}
		/>
	{:else if config.type === 'bar-chart'}
		<!-- TODO: Implement BarChart -->
		<div>Bar Chart (Not Implemented)</div>
	{:else if config.type === 'line-chart'}
		<!-- TODO: Implement LineChart -->
		<div>Line Chart (Not Implemented)</div>
	{:else if config.type === 'area-chart'}
		<!-- TODO: Implement AreaChart -->
		<div>Area Chart (Not Implemented)</div>
	{:else if config.type === 'kpi-card'}
		<KpiCard 
			{config}
			value={currentValue}
		/>
	{:else if config.type === 'text-display'}
		<!-- TODO: Implement TextDisplay -->
		<div>Text Display (Not Implemented)</div>
	{:else if config.type === 'system-info'}
		<!-- TODO: Implement SystemInfo -->
		<div>System Info (Not Implemented)</div>
	{:else if config.type === 'temperature-grid'}
		<!-- TODO: Implement TemperatureGrid -->
		<div>Temperature Grid (Not Implemented)</div>
	{:else if config.type === 'network-monitor'}
		<!-- TODO: Implement NetworkMonitor -->
		<div>Network Monitor (Not Implemented)</div>
	{:else}
		<div class="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
			<div class="text-center">
				<div class="text-2xl mb-2">⚠️</div>
				<div class="text-sm">Unknown widget type: {config.type}</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.widget-renderer {
		position: relative;
		overflow: hidden;
	}
</style>