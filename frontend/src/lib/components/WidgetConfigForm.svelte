// WidgetConfigForm.svelte
<script lang="ts">
	import { dashboardState } from '$lib/stores/dashboard.svelte';
	import type { WidgetConfig } from '$lib/types/dashboard';
	
	interface Props {
		widget: WidgetConfig;
		onSave: (config: WidgetConfig) => void;
		onCancel: () => void;
	}

	// Destructure props for future use but mark as unused for now
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let { widget: _widget, onSave: _onSave, onCancel: _onCancel }: Props = $props();
	
	let widgetConfig = $state<Partial<WidgetConfig>>({ 
		title: '', 
		size: { width: 200, height: 200 }, 
		config: { 
			min: 0, 
			max: 100, 
			unit: '%', 
			colors: ['#22c55e', '#f59e0b', '#ef4444'], 
			thresholds: [70, 90] 
		}, 
		dataSource: '', 
		thresholds: [], 
		styling: { 
			backgroundColor: '#ffffff', 
			borderColor: '#e5e7eb', 
			borderWidth: 1, 
			borderRadius: 8 
		} 
	});
</script>

<div class="flex-1 overflow-y-auto">
	<div class="p-6">
		{#if $dashboardState.widgetBuilder.selectedWidget}
			<div class="space-y-6">
				<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">General Settings</h3>
				<div class="grid grid-cols-2 gap-4">
					<!-- title input -->
					<input bind:value={widgetConfig.title} type="text" placeholder="Widget Title" />
					<!-- size inputs -->
				</div>
				<!-- Data Source select -->
				<!-- Thresholds inputs -->
				<!-- Styling: color presets, custom colors, etc. -->
			</div>
		{:else}
			<div class="flex items-center justify-center h-full text-gray-500 dark:text-gray-400"><p class="text-lg">Select a widget template to begin configuration</p></div>
		{/if}
	</div>
</div> 