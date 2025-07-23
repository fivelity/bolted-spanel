<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { dashboardState, dashboardActions, widgetTemplates } from '$lib/stores/dashboard.svelte';
	import WidgetRenderer from './WidgetRenderer.svelte'
	import { MockDataService } from '$lib/services/mock-data'
	import type { WidgetConfig, WidgetTemplate } from '$lib/types/dashboard';

	const dispatch = createEventDispatcher();
	const mockDataService = MockDataService.getInstance();

	// Widget configuration state with proper initialization
	let widgetConfig: Partial<WidgetConfig> = {
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
	};

	// Create preview widget config
	let previewWidget = $derived(() => {
		const selectedTemplateId = $dashboardState.widgetBuilder.selectedWidget;
		if (!selectedTemplateId) return null;
		
		const selectedTemplate = widgetTemplates.find(t => t.id === selectedTemplateId);
		if (!selectedTemplate) return null;
		
		return {
			id: 'preview',
			type: selectedTemplate.type,
			title: widgetConfig.title || selectedTemplate.name,
			position: { x: 0, y: 0 },
			size: widgetConfig.size || selectedTemplate.config?.size || { width: 200, height: 200 },
			config: { ...selectedTemplate.config?.config, ...(widgetConfig.config || {}) },
			dataSource: widgetConfig.dataSource || selectedTemplate.config?.dataSource || '',
			thresholds: widgetConfig.thresholds || selectedTemplate.config?.thresholds || [],
			styling: { ...selectedTemplate.config?.styling, ...(widgetConfig.styling || {}) }
		} as WidgetConfig;
	});

	// Mock data for preview
	let mockData = $derived(() => mockDataService.getCurrentData());

	// Widget categories for organization
	const widgetCategories = {
		'system': ['circular-gauge-cpu', 'gauge-gpu', 'meter-memory', 'simple-temp'],
		'performance': ['speedometer-perf', 'kpi-card-overview']
	};

	// Color presets
	const colorPresets = [
		{ name: 'Default', colors: ['#22c55e', '#f59e0b', '#ef4444'] },
		{ name: 'Blue', colors: ['#3b82f6', '#8b5cf6', '#ef4444'] },
		{ name: 'Purple', colors: ['#8b5cf6', '#ec4899', '#ef4444'] },
		{ name: 'Cyan', colors: ['#06b6d4', '#3b82f6', '#ef4444'] },
		{ name: 'Orange', colors: ['#f97316', '#eab308', '#ef4444'] }
	];

	function selectTemplate(template: WidgetTemplate) {
		// Update the dashboard state to track selected widget template
		dashboardState.update(state => ({
			...state,
			widgetBuilder: {
				...state.widgetBuilder,
				selectedWidget: template.id
			}
		}));
		
		// Initialize config with template defaults
		widgetConfig = {
			title: template.name,
			size: template.config?.size || { width: 200, height: 200 },
			config: { 
				min: 0,
				max: 100,
				unit: '%',
				colors: ['#22c55e', '#f59e0b', '#ef4444'],
				thresholds: [70, 90],
				...template.config?.config 
			},
			dataSource: template.config?.dataSource || '',
			thresholds: template.config?.thresholds || [],
			styling: { 
				backgroundColor: '#ffffff',
				borderColor: '#e5e7eb',
				borderWidth: 1,
				borderRadius: 8,
				...template.config?.styling 
			}
		};
	}

	function createWidget() {
		const preview = previewWidget();
		if (!preview) return;
		
		// Use addWidget instead of createWidget and handle the template conversion
		const selectedTemplateId = $dashboardState.widgetBuilder.selectedWidget;
		const template = widgetTemplates.find(t => t.id === selectedTemplateId);
		if (template) {
			dashboardActions.addWidget(template, preview.position);
		}
		closeBuilder();
	}

	function closeBuilder() {
		dashboardActions.closeWidgetBuilder();
	}

	function setColorPreset(preset: { colors: string[] }) {
		if (!widgetConfig.config) {
			widgetConfig.config = {};
		}
		widgetConfig.config = {
			...widgetConfig.config,
			colors: preset.colors
		};
	}

	function updateTitle(event: Event) {
		const target = event.target as HTMLInputElement;
		widgetConfig.title = target.value;
	}

	function updateUnit(event: Event) {
		const target = event.target as HTMLInputElement;
		if (!widgetConfig.config) widgetConfig.config = {};
		widgetConfig.config.unit = target.value;
	}

	function updateBackgroundColor(event: Event) {
		const target = event.target as HTMLInputElement;
		if (!widgetConfig.styling) widgetConfig.styling = {};
		widgetConfig.styling.backgroundColor = target.value;
	}

	function updateBorderColor(event: Event) {
		const target = event.target as HTMLInputElement;
		if (!widgetConfig.styling) widgetConfig.styling = {};
		widgetConfig.styling.borderColor = target.value;
	}

	function updateBorderWidth(event: Event) {
		const target = event.target as HTMLInputElement;
		if (!widgetConfig.styling) widgetConfig.styling = {};
		widgetConfig.styling.borderWidth = parseInt(target.value) || 0;
	}

	function updateBorderRadius(event: Event) {
		const target = event.target as HTMLInputElement;
		if (!widgetConfig.styling) widgetConfig.styling = {};
		widgetConfig.styling.borderRadius = parseInt(target.value) || 0;
	}
</script>

<!-- Widget Builder Modal -->
{#if $dashboardState.widgetBuilder.isOpen}
	<div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
		<div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex overflow-hidden">
			
			<!-- Header -->
			<div class="flex-none">
				<div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
					<h2 class="text-2xl font-bold text-gray-900 dark:text-white">
						Widget Builder
					</h2>
					<button
						onclick={closeBuilder}
						class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
						aria-label="Close widget builder"
					>
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
						</svg>
					</button>
				</div>
			</div>

			<div class="flex flex-1 overflow-hidden">
				
				<!-- Left Panel: Widget Templates -->
				<div class="w-80 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
					<div class="p-6">
						<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
							Choose Widget Type
						</h3>
						
						{#each Object.entries(widgetCategories) as [category, categoryName]}
							{@const categoryTemplates = widgetTemplates.filter((t: WidgetTemplate) => t.category === category)}
							{#if categoryTemplates.length > 0}
								<div class="mb-6">
									<h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
										{categoryName}
									</h4>
									<div class="space-y-2">
										{#each categoryTemplates as template}
											<button
												class="w-full p-4 text-left border rounded-lg transition-all hover:border-blue-500 dark:hover:border-blue-400
													{$dashboardState.widgetBuilder.selectedWidget === template.id 
														? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
														: 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'}"
												onclick={() => selectTemplate(template)}
											>
												<div class="flex items-center gap-3">
													<div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
														{template.type.charAt(0).toUpperCase()}
													</div>
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

				<!-- Center Panel: Configuration -->
				<div class="flex-1 overflow-y-auto">
					<div class="p-6">
						{#if $dashboardState.widgetBuilder.selectedWidget}
							<div class="space-y-6">
								
								<!-- General Settings -->
								<div>
									<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">General Settings</h3>
									<div class="grid grid-cols-1 gap-4">
										<div>
											<label for="widget-title" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
												Title
											</label>
											<input
												id="widget-title"
												type="text"
												bind:value={widgetConfig.title}
												placeholder="Widget title"
												class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
											/>
										</div>
										
										<div class="grid grid-cols-2 gap-4">
											<div>
												<label for="widget-width" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
													Width
												</label>
												<input
													id="widget-width"
													type="number"
													class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
													bind:value={widgetConfig.size.width}
													onfocus={() => {}}
													min="100"
													step="10"
												/>
											</div>
											<div>
												<label for="widget-height" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
													Height
												</label>
												<input
													id="widget-height"
													type="number"
													class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
													bind:value={widgetConfig.size.height}
													onfocus={() => {}}
													min="80"
													step="10"
												/>
											</div>
										</div>
									</div>
								</div>

								<!-- Data Source -->
								<div>
									<label for="data-source" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Data Source
									</label>
									<select
										id="data-source"
										bind:value={widgetConfig.dataSource}
										class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
									>
										<option value="">Select data source</option>
										{#each dataSources as source}
											<option value={source.value}>{source.label}</option>
										{/each}
									</select>
								</div>

								<!-- Thresholds -->
								<div>
									<h4 class="text-md font-medium text-gray-900 dark:text-white mb-3">Thresholds</h4>
									<div class="grid grid-cols-2 gap-4">
										<div>
											<label for="min-value" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
												Min Value
											</label>
											<input
												id="min-value"
												type="number"
												placeholder="0"
												class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
											/>
										</div>
										<div>
											<label for="max-value" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
												Max Value
											</label>
											<input
												id="max-value"
												type="number"
												placeholder="100"
												class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
											/>
										</div>
									</div>
									<div>
										<label for="unit" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Unit
										</label>
										<input
											id="unit"
											type="text"
											bind:value={widgetConfig.config.unit}
											placeholder="%, °C, MB/s, etc."
											class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
										/>
									</div>
								</div>

								<!-- Styling -->
								<div>
									<h4 class="text-md font-medium text-gray-900 dark:text-white mb-3">Styling</h4>
									
									<!-- Color Presets -->
									<div>
										<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Color Preset
										</label>
										<div class="grid grid-cols-1 gap-2">
											{#each colorPresets as preset}
												<button
													class="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
													onclick={() => setColorPreset(preset)}
												>
													<div class="flex gap-1">
														{#each preset.colors as color}
															<div class="w-4 h-4 rounded-full" style="background-color: {color}"></div>
														{/each}
													</div>
													<span class="text-gray-900 dark:text-white">{preset.name}</span>
												</button>
											{/each}
										</div>
									</div>

									<!-- Custom Colors -->
									<div>
										<label for="bg-color" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Background Color
										</label>
										<input
											id="bg-color"
											type="color"
											bind:value={widgetConfig.styling.backgroundColor}
											class="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg"
										/>
									</div>

									<div class="grid grid-cols-2 gap-4">
										<div>
											<label for="border-color" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
												Border Color
											</label>
											<input
												id="border-color"
												type="color"
												bind:value={widgetConfig.styling.borderColor}
												class="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg"
											/>
										</div>
										<div>
											<label for="border-width" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
												Border Width
											</label>
											<input
												id="border-width"
												type="number"
												bind:value={widgetConfig.styling.borderWidth}
												min="0"
												max="10"
												class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
											/>
										</div>
									</div>

									<div>
										<label for="border-radius" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Border Radius
										</label>
										<input
											id="border-radius"
											type="number"
											bind:value={widgetConfig.styling.borderRadius}
											min="0"
											max="50"
											class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
										/>
									</div>
								</div>
							</div>
						{:else}
							<div class="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
								<p class="text-lg">Select a widget template to begin configuration</p>
							</div>
						{/if}
					</div>
				</div>

				<!-- Right Panel: Preview -->
				<div class="w-80 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
					<div class="p-6">
						<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preview</h3>
						
						{#if previewWidget}
							<div class="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/30">
															<WidgetRenderer
								widget={previewWidget()}
								data={mockData()}
								isPreview={true}
							/>
							</div>
							
							<div class="mt-6 flex gap-3">
								<button
									class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
									onclick={createWidget}
								>
									Add Widget
								</button>
								<button
									class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
									onclick={closeBuilder}
								>
									Cancel
								</button>
							</div>
						{:else}
							<div class="flex items-center justify-center h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
								<p class="text-gray-500 dark:text-gray-400">No preview available</p>
							</div>
						{/if}
					</div>
				</div>

			</div>
		</div>
	</div>
{/if}