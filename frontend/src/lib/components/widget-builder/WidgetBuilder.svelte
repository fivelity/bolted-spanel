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

	// Default widget config for the form
	let defaultWidget: WidgetConfig = {
		id: '',
		type: 'gauge',
		title: 'New Widget',
		position: { x: 0, y: 0 },
		size: { width: 200, height: 200 },
		config: {}
	};

	function handleSaveConfig(config: WidgetConfig) {
		// Update preview widget or store config
		console.log('Widget config saved:', config);
	}

	function handleCancelConfig() {
		// Reset or close config form
		console.log('Widget config cancelled');
	}

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
		<div class="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
			<div class="flex justify-between items-center mb-6">
				<h2 class="text-xl font-bold text-white">Widget Builder</h2>
				<button 
					on:click={closeBuilder}
					class="text-gray-400 hover:text-white transition-colors"
				>
					✕
				</button>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<!-- Template Selection -->
				<div class="space-y-4">
					<h3 class="text-lg font-semibold text-white">Select Widget Type</h3>
					<WidgetTemplateSelector 
						templates={widgetTemplates}
						selectedId={$dashboardState.widgetBuilder.selectedWidget}
						onSelect={selectTemplate}
					/>
				</div>

				<!-- Configuration -->
				<div class="space-y-4">
					<h3 class="text-lg font-semibold text-white">Configure Widget</h3>
					<WidgetConfigForm 
						widget={defaultWidget}
						onSave={handleSaveConfig}
						onCancel={handleCancelConfig}
					/>
				</div>
			</div>

			<!-- Preview -->
			{#if previewWidget}
				<div class="mt-6 pt-6 border-t border-gray-700">
					<h3 class="text-lg font-semibold text-white mb-4">Preview</h3>
					<WidgetPreview widget={previewWidget} />
				</div>
			{/if}

			<!-- Actions -->
			<div class="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-700">
				<button 
					on:click={closeBuilder}
					class="px-4 py-2 text-gray-400 hover:text-white transition-colors"
				>
					Cancel
				</button>
				<button 
					on:click={createWidget}
					class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
				>
					Create Widget
				</button>
			</div>
		</div>
	</div>
{/if}
