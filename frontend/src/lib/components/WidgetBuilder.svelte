<script lang="ts">
	import { dashboardState, dashboardActions, widgetTemplates } from '$lib/stores/dashboard'
	import { createEventDispatcher } from 'svelte'
	import { nanoid } from 'nanoid'
	import type { WidgetConfig, WidgetType, WidgetTemplate } from '$lib/types/dashboard'
	import WidgetRenderer from './WidgetRenderer.svelte'
	import { generateMockHardwareData } from '$lib/services/mock-data'

	const dispatch = createEventDispatcher()

	let activeTab = $state('templates')
	let selectedTemplate: WidgetTemplate | null = $state(null)
	let widgetConfig: Partial<WidgetConfig> = $state({})
	let previewData = $state(generateMockHardwareData())

	// Reactive preview widget
	let previewWidget = $derived(selectedTemplate ? {
		id: 'preview',
		type: selectedTemplate.type,
		title: widgetConfig.title || selectedTemplate.name,
		position: { x: 0, y: 0 },
		size: widgetConfig.size || selectedTemplate.config.size || { width: 200, height: 200 },
		config: { ...selectedTemplate.config.config, ...widgetConfig.config },
		dataSource: widgetConfig.dataSource || selectedTemplate.config.dataSource,
		thresholds: widgetConfig.thresholds || selectedTemplate.config.thresholds,
		styling: widgetConfig.styling || selectedTemplate.config.styling
	} as WidgetConfig : null);

	// Widget type categories
	const widgetCategories = {
		system: 'System Monitoring',
		performance: 'Performance',
		custom: 'Custom',
		community: 'Community'
	}

	function selectTemplate(template: WidgetTemplate) {
		selectedTemplate = template
		widgetConfig = {
			title: template.name,
			size: template.config.size || { width: 200, height: 200 },
			config: { ...template.config.config },
			dataSource: template.config.dataSource,
			thresholds: template.config.thresholds,
			styling: template.config.styling
		}
		activeTab = 'general'
	}

	function updateConfig(key: string, value: any) {
		widgetConfig = {
			...widgetConfig,
			[key]: value
		}
	}

	function updateNestedConfig(path: string, value: any) {
		const keys = path.split('.')
		const newConfig = { ...widgetConfig }
		
		let current = newConfig as any
		for (let i = 0; i < keys.length - 1; i++) {
			const key = keys[i]
			if (!current[key]) current[key] = {}
			current = current[key]
		}
		
		current[keys[keys.length - 1]] = value
		widgetConfig = newConfig
	}

	function addWidget() {
		if (!selectedTemplate || !$dashboardState.currentLayout) return

		const newWidget: WidgetConfig = {
			id: nanoid(),
			type: selectedTemplate.type,
			title: widgetConfig.title || selectedTemplate.name,
			position: { x: 100, y: 100 },
			size: widgetConfig.size || selectedTemplate.config.size || { width: 200, height: 200 },
			config: { ...selectedTemplate.config.config, ...widgetConfig.config },
			dataSource: widgetConfig.dataSource || selectedTemplate.config.dataSource,
			thresholds: widgetConfig.thresholds || selectedTemplate.config.thresholds,
			styling: widgetConfig.styling || selectedTemplate.config.styling
		}

		dashboardActions.updateWidget($dashboardState.currentLayout.id, newWidget)
		dashboardActions.closeWidgetBuilder()
		dispatch('widgetAdded', newWidget)
	}

	function closeBuilder() {
		dashboardActions.closeWidgetBuilder()
		selectedTemplate = null
		widgetConfig = {}
	}

	// Data source options
	const dataSourceOptions = [
		{ value: 'cpu.usage', label: 'CPU Usage (%)' },
		{ value: 'cpu.temperature', label: 'CPU Temperature (°C)' },
		{ value: 'cpu.frequency', label: 'CPU Frequency (GHz)' },
		{ value: 'gpu.usage', label: 'GPU Usage (%)' },
		{ value: 'gpu.temperature', label: 'GPU Temperature (°C)' },
		{ value: 'gpu.memory_usage', label: 'GPU Memory Usage (%)' },
		{ value: 'memory.usage', label: 'Memory Usage (%)' },
		{ value: 'memory.available', label: 'Available Memory (MB)' },
		{ value: 'network.bytes_sent', label: 'Network Bytes Sent' },
		{ value: 'network.bytes_recv', label: 'Network Bytes Received' }
	]

	// Color presets
	const colorPresets = [
		{ name: 'Green-Yellow-Red', colors: ['#10b981', '#f59e0b', '#ef4444'] },
		{ name: 'Blue-Purple-Pink', colors: ['#3b82f6', '#8b5cf6', '#ec4899'] },
		{ name: 'Cyan-Blue-Indigo', colors: ['#06b6d4', '#3b82f6', '#6366f1'] },
		{ name: 'Emerald-Teal-Cyan', colors: ['#10b981', '#14b8a6', '#06b6d4'] }
	]
</script>

{#if $dashboardState.widgetBuilder.isOpen}
	<div class="widget-builder-overlay fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
		<div class="widget-builder bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
			<!-- Header -->
			<div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
				<h2 class="text-xl font-semibold text-gray-900 dark:text-white">
					Widget Builder
				</h2>
				<button
					onclick={closeBuilder}
					class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
				>
					<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
					</svg>
				</button>
			</div>

			<div class="flex flex-1 overflow-hidden">
				<!-- Sidebar -->
				<div class="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
					<!-- Tab navigation -->
					<div class="flex border-b border-gray-200 dark:border-gray-700">
						<button
							class="flex-1 px-4 py-3 text-sm font-medium transition-colors"
							class:bg-blue-50={activeTab === 'templates'}
							class:text-blue-600={activeTab === 'templates'}
							class:dark:bg-blue-900={activeTab === 'templates'}
							class:dark:text-blue-400={activeTab === 'templates'}
							onclick={() => activeTab = 'templates'}
						>
							Templates
						</button>
						<button
							class="flex-1 px-4 py-3 text-sm font-medium transition-colors"
							class:bg-blue-50={activeTab === 'general'}
							class:text-blue-600={activeTab === 'general'}
							class:dark:bg-blue-900={activeTab === 'general'}
							class:dark:text-blue-400={activeTab === 'general'}
							class:opacity-50={!selectedTemplate}
							disabled={!selectedTemplate}
							onclick={() => activeTab = 'general'}
						>
							General
						</button>
						<button
							class="flex-1 px-4 py-3 text-sm font-medium transition-colors"
							class:bg-blue-50={activeTab === 'styling'}
							class:text-blue-600={activeTab === 'styling'}
							class:dark:bg-blue-900={activeTab === 'styling'}
							class:dark:text-blue-400={activeTab === 'styling'}
							class:opacity-50={!selectedTemplate}
							disabled={!selectedTemplate}
							onclick={() => activeTab = 'styling'}
						>
							Styling
						</button>
					</div>

					<!-- Tab content -->
					<div class="flex-1 overflow-y-auto p-4">
						{#if activeTab === 'templates'}
							<!-- Template selection -->
							{#each Object.entries(widgetCategories) as [category, categoryName]}
								{@const categoryTemplates = $widgetTemplates.filter(t => t.category === category)}
								{#if categoryTemplates.length > 0}
									<div class="mb-6">
										<h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
											{categoryName}
										</h3>
										<div class="grid grid-cols-1 gap-2">
											{#each categoryTemplates as template}
												<button
													class="template-card p-3 border rounded-lg text-left transition-all hover:shadow-md"
													class:border-blue-500={selectedTemplate?.id === template.id}
													class:bg-blue-50={selectedTemplate?.id === template.id}
													class:dark:bg-blue-900={selectedTemplate?.id === template.id}
													onclick={() => selectTemplate(template)}
												>
													<div class="font-medium text-sm text-gray-900 dark:text-white mb-1">
														{template.name}
													</div>
													<div class="text-xs text-gray-500 dark:text-gray-400">
														{template.description}
													</div>
												</button>
											{/each}
										</div>
									</div>
								{/if}
							{/each}

						{:else if activeTab === 'general' && selectedTemplate}
							<!-- General configuration -->
							<div class="space-y-4">
								<!-- Title -->
								<div>
									<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Title
									</label>
									<input
										type="text"
										class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
										bind:value={widgetConfig.title}
										placeholder={selectedTemplate.name}
									/>
								</div>

								<!-- Size -->
								<div class="grid grid-cols-2 gap-3">
									<div>
										<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Width
										</label>
										<input
											type="number"
											class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
											bind:value={widgetConfig.size.width}
											min="100"
											max="800"
										/>
									</div>
									<div>
										<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Height
										</label>
										<input
											type="number"
											class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
											bind:value={widgetConfig.size.height}
											min="80"
											max="600"
										/>
									</div>
								</div>

								<!-- Data Source -->
								<div>
									<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Data Source
									</label>
									<select
										class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
										bind:value={widgetConfig.dataSource}
									>
										<option value="">Select data source...</option>
										{#each dataSourceOptions as option}
											<option value={option.value}>{option.label}</option>
										{/each}
									</select>
								</div>

								<!-- Widget-specific configuration -->
								{#if selectedTemplate.type === 'circular-gauge' || selectedTemplate.type === 'linear-gauge' || selectedTemplate.type === 'speedometer'}
									<div class="grid grid-cols-2 gap-3">
										<div>
											<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
												Min Value
											</label>
											<input
												type="number"
												class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
												value={widgetConfig.config?.min || 0}
												onchange={(e) => updateNestedConfig('config.min', parseFloat((e.target as HTMLInputElement)?.value ?? '0'))}
											/>
										</div>
										<div>
											<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
												Max Value
											</label>
											<input
												type="number"
												class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
												value={widgetConfig.config?.max || 100}
												onchange={(e) => updateNestedConfig('config.max', parseFloat((e.target as HTMLInputElement)?.value ?? '100'))}
											/>
										</div>
									</div>

									<div>
										<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Unit
										</label>
										<input
											type="text"
											class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
											value={widgetConfig.config?.unit || '%'}
											onchange={(e) => updateNestedConfig('config.unit', (e.target as HTMLInputElement)?.value)}
											placeholder="%"
										/>
									</div>
								{/if}
							</div>

						{:else if activeTab === 'styling' && selectedTemplate}
							<!-- Styling configuration -->
							<div class="space-y-4">
								<!-- Color presets -->
								<div>
									<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Color Preset
									</label>
									<div class="grid grid-cols-1 gap-2">
										{#each colorPresets as preset}
											<button
												class="flex items-center gap-3 p-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
												onclick={() => updateNestedConfig('config.colors', preset.colors)}
											>
												<div class="flex gap-1">
													{#each preset.colors as color}
														<div class="w-4 h-4 rounded-full" style="background-color: {color}"></div>
													{/each}
												</div>
												<span class="text-sm text-gray-700 dark:text-gray-300">{preset.name}</span>
											</button>
										{/each}
									</div>
								</div>

								<!-- Background color -->
								<div>
									<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Background Color
									</label>
									<input
										type="color"
										class="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg"
										value={widgetConfig.styling?.backgroundColor || '#ffffff'}
										onchange={(e) => updateNestedConfig('styling.backgroundColor', (e.target as HTMLInputElement)?.value)}
									/>
								</div>

								<!-- Border -->
								<div class="grid grid-cols-2 gap-3">
									<div>
										<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Border Color
										</label>
										<input
											type="color"
											class="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg"
											value={widgetConfig.styling?.borderColor || '#e5e7eb'}
											onchange={(e) => updateNestedConfig('styling.borderColor', (e.target as HTMLInputElement)?.value)}
										/>
									</div>
									<div>
										<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Border Width
										</label>
										<input
											type="number"
											class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
											value={widgetConfig.styling?.borderWidth || 1}
											onchange={(e) => updateNestedConfig('styling.borderWidth', parseInt((e.target as HTMLInputElement)?.value ?? '1'))}
											min="0"
											max="10"
										/>
									</div>
								</div>

								<!-- Border radius -->
								<div>
									<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Border Radius
									</label>
									<input
										type="range"
										class="w-full"
										value={widgetConfig.styling?.borderRadius || 8}
										onchange={(e) => updateNestedConfig('styling.borderRadius', parseInt((e.target as HTMLInputElement)?.value ?? '8'))}
										min="0"
										max="20"
									/>
									<div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
										{widgetConfig.styling?.borderRadius || 8}px
									</div>
								</div>
							</div>
						{/if}
					</div>

					<!-- Actions -->
					{#if selectedTemplate}
						<div class="p-4 border-t border-gray-200 dark:border-gray-700">
							<button
								onclick={addWidget}
								class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
							>
								Add Widget
							</button>
						</div>
					{/if}
				</div>

				<!-- Preview -->
				<div class="flex-1 p-6 bg-gray-50 dark:bg-gray-900">
					<div class="h-full flex flex-col">
						<h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
							Preview
						</h3>
						
						{#if previewWidget}
							<div class="flex-1 flex items-center justify-center">
								<div 
									class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4"
									style="width: {previewWidget.size.width}px; height: {previewWidget.size.height}px;"
								>
									<WidgetRenderer 
										config={previewWidget}
										data={previewData}
									/>
								</div>
							</div>
						{:else}
							<div class="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
								<div class="text-center">
									<div class="text-4xl mb-4">🎨</div>
									<div>Select a template to see preview</div>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.widget-builder-overlay {
		backdrop-filter: blur(4px);
	}

	.template-card {
		transition: all 0.2s ease;
	}

	.template-card:hover {
		transform: translateY(-1px);
	}
</style>