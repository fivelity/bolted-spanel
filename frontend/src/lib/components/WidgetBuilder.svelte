<script lang="ts">
	import { dashboardState, dashboardActions, widgetTemplates } from '$lib/stores/dashboard.svelte';
	import WidgetTemplateSelector from './WidgetTemplateSelector.svelte';
	import WidgetConfigForm from './WidgetConfigForm.svelte';
	import WidgetPreview from './WidgetPreview.svelte';
	import type { WidgetTemplate, WidgetConfig } from '$lib/types/dashboard';
	
	function closeBuilder() {
		dashboardActions.closeWidgetBuilder();
	}

	function selectTemplate(template: WidgetTemplate) {
		// Update state locally or call dashboardActions if exists
		dashboardState.update(state => ({ ...state, widgetBuilder: { ...state.widgetBuilder, selectedWidget: template.id } }));
		// Initialize config
	}

	let previewWidget = $derived(null as WidgetConfig | null); // TODO: implement logic from original to create preview

	function createWidget() {
		// Logic from original
		const selectedId = $dashboardState.widgetBuilder.selectedWidget;
		const template = widgetTemplates.find(t => t.id === selectedId);
		if (template) dashboardActions.addWidget(template, { x: 0, y: 0 });
		closeBuilder();
	}
</script>

{#if $dashboardState.widgetBuilder.isOpen}
	<div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
		<div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex overflow-hidden">
			<!-- Header -->
			<div class="flex-none">
				<div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
					<h2 class="text-2xl font-bold text-gray-900 dark:text-white">Widget Builder</h2>
					<button onclick={closeBuilder} class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" aria-label="Close widget builder">
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
						</svg>
					</button>
				</div>
			</div>

			<div class="flex flex-1 overflow-hidden">
				<WidgetTemplateSelector onselect={selectTemplate} />
				<WidgetConfigForm />
				<WidgetPreview previewWidget={previewWidget} onadd={createWidget} onclose={closeBuilder} />
			</div>
		</div>
	</div>
{/if}