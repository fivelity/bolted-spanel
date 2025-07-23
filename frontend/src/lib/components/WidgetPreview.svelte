// WidgetPreview.svelte
<script lang="ts">
	import WidgetRenderer from './WidgetRenderer.svelte';
	import { MockDataService } from '$lib/services/mock-data';
	import type { WidgetConfig } from '$lib/types/dashboard';
	const mockDataService = MockDataService.getInstance();
	let mockData = $derived(() => mockDataService.getCurrentData());
	let { previewWidget, onadd, onclose } = $props<{ previewWidget: WidgetConfig | null, onadd: () => void, onclose: () => void }>();
</script>

<div class="w-80 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
	<div class="p-6">
		<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preview</h3>
		<div class="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/30">
			{#if previewWidget !== null}
				<WidgetRenderer widget={previewWidget} data={mockData()} isPreview={true} />
			{/if}
		</div>
		<div class="mt-6 flex gap-3">
			<button class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors" onclick={onadd}>Add Widget</button>
			<button class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors" onclick={onclose}>Cancel</button>
		</div>
	</div>
</div> 