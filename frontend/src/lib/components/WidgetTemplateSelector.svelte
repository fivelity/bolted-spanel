// WidgetTemplateSelector.svelte
<script lang="ts">
	import { dashboardState, widgetTemplates } from '$lib/stores/dashboard.svelte';
	import type { WidgetTemplate } from '$lib/types/dashboard';
	export let onselect: (template: WidgetTemplate) => void;
	
	const widgetCategories = {
		'system': ['circular-gauge-cpu', 'gauge-gpu', 'meter-memory', 'simple-temp'],
		'performance': ['speedometer-perf', 'kpi-card-overview']
	};
</script>

<div class="w-80 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
	<div class="p-6">
		<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Choose Widget Type</h3>
		{#each Object.entries(widgetCategories) as [category, categoryName]}
			{@const categoryTemplates = widgetTemplates.filter((t: WidgetTemplate) => t.category === category)}
			{#if categoryTemplates.length > 0}
				<div class="mb-6">
					<h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{categoryName}</h4>
					<div class="space-y-2">
						{#each categoryTemplates as template}
							<button class="w-full p-4 text-left border rounded-lg transition-all hover:border-blue-500 dark:hover:border-blue-400 {typeof $dashboardState.widgetBuilder.selectedWidget === 'string' && $dashboardState.widgetBuilder.selectedWidget === template.id ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'}" onclick={() => onselect(template)}>
								<div class="flex items-center gap-3">
									<div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">{template.type.charAt(0).toUpperCase()}</div>
									<div>
										<div class="font-medium text-gray-900 dark:text-white">{template.name}</div>
										<div class="text-sm text-gray-500 dark:text-gray-400">{template.description}</div>
									</div>
								</div>
							</button>
						{/each}
					</div>
				</div>
			{/if}
		{/each}
	</div>
</div> 