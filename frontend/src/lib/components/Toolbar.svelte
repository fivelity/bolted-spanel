<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { WidgetConfig } from '$lib/types/dashboard';
	import { dashboardActions, dashboardState, currentLayout } from '$lib/stores/dashboard.svelte';
	import { themeStore } from '$lib/stores/themeStore';
	import { connectionStatus } from '$lib/services/websocket';
	import { nanoid } from 'nanoid';

	const dispatch = createEventDispatcher();

	// Local state
	let showWidgetMenu = $state(false);
	let isEditMode = $state(true); // For now, always in edit mode

	// Widget presets with proper type structure
	const widgetPresets: WidgetConfig[] = [
		{
			id: nanoid(),
			type: 'gauge',
			title: 'CPU Usage',
			position: { x: 20, y: 20 },
			size: { width: 200, height: 200 },
			config: {
				dataSource: 'cpu.usage',
				unit: '%',
				colors: ['#22c55e', '#f59e0b', '#ef4444'],
				thresholds: [70, 90]
			}
		},
		{
			id: nanoid(),
			type: 'gauge',
			title: 'GPU Usage', 
			position: { x: 240, y: 20 },
			size: { width: 200, height: 200 },
			config: {
				dataSource: 'gpu.usage',
				unit: '%',
				colors: ['#3b82f6', '#8b5cf6', '#ef4444'],
				thresholds: [75, 90]
			}
		},
		{
			id: nanoid(),
			type: 'meter',
			title: 'Memory Usage',
			position: { x: 20, y: 240 },
			size: { width: 420, height: 80 },
			config: {
				dataSource: 'memory.usage',
				unit: '%',
				colors: ['#06b6d4', '#f59e0b', '#ef4444'],
				thresholds: [80, 95]
			}
		},
		{
			id: nanoid(),
			type: 'simple',
			title: 'CPU Temperature',
			position: { x: 460, y: 20 },
			size: { width: 150, height: 100 },
			config: {
				dataSource: 'cpu.temperature',
				unit: '°C'
			}
		}
	];

	function addWidget(preset: WidgetConfig) {
		const widget: WidgetConfig = {
			...preset,
			id: nanoid(), // Generate new ID
			position: { x: Math.random() * 100, y: Math.random() * 100 } // Random position
		};
		
		// Add widget using dashboard actions
		if ($currentLayout) {
			dashboardActions.updateWidget($currentLayout.id, {
				...$currentLayout,
				widgets: [...$currentLayout.widgets, widget]
			} as any);
		}
	}

	function exportLayout() {
		try {
			if (!$currentLayout) return;
			const layoutData = JSON.stringify($currentLayout, null, 2);
			const blob = new Blob([layoutData], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${$currentLayout.name || 'layout'}.json`;
			a.click();
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Failed to export layout:', error);
		}
	}

	function importLayout() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		input.onchange = (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) return;

			const reader = new FileReader();
			reader.onload = (e) => {
				try {
					const content = e.target?.result as string;
					const layoutData = JSON.parse(content);
					dashboardActions.loadLayout(layoutData);
				} catch (error) {
					console.error('Failed to import layout:', error);
				}
			};
			reader.readAsText(file);
		};
		input.click();
	}

	function toggleEditMode() {
		isEditMode = !isEditMode;
	}
</script>

<div class="toolbar flex items-center justify-between w-full px-6 py-3 bg-gradient-to-r from-gray-900/95 to-gray-800/95 backdrop-blur-sm border-b border-gray-700/50">
	<!-- Left Section: Logo & Status -->
	<div class="flex items-center gap-6">
		<div class="flex items-center gap-3">
			<div class="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
				<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
					<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
				</svg>
			</div>
			<div>
				<h1 class="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
					SenseCanvas
				</h1>
				<p class="text-xs text-gray-400">Real-time Monitoring</p>
			</div>
		</div>

		<!-- Connection Status -->
		<div class="flex items-center gap-2">
			<div 
				class="w-2 h-2 rounded-full transition-colors relative"
				class:bg-success-500={$connectionStatus === 'connected'}
				class:bg-warning-500={$connectionStatus === 'connecting'}
				class:bg-error-500={$connectionStatus === 'error' || $connectionStatus === 'disconnected'}
			>
				{#if $connectionStatus === 'connected'}
					<div class="absolute inset-0 bg-green-400 rounded-full animate-ping"></div>
				{/if}
			</div>
			<span class="text-gray-300 font-medium">
				{$connectionStatus === 'connected' ? 'Connected' :
				 $connectionStatus === 'connecting' ? 'Connecting...' :
				 'Disconnected'}
			</span>
		</div>
	</div>

	<!-- Center Section: Widget Tools -->
	<div class="flex items-center gap-3">
		{#if isEditMode}
			<!-- Add Widget Menu -->
			<div class="relative">
				<button
					class="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-cyan-500/25"
					onclick={() => showWidgetMenu = !showWidgetMenu}
				>
					<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"></path>
					</svg>
					Add Widget
				</button>

				{#if showWidgetMenu}
					<div class="absolute top-full left-0 mt-2 w-64 bg-gray-800/95 backdrop-blur-sm border border-gray-700/50 rounded-lg shadow-xl z-50">
						{#each widgetPresets as preset}
							<button
								class="w-full px-4 py-3 text-left hover:bg-gray-700/50 transition-all duration-200 first:rounded-t-lg last:rounded-b-lg group"
								onclick={() => { addWidget(preset); showWidgetMenu = false; }}
							>
								<div class="flex items-center gap-3">
									<div class="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
										{preset.type.charAt(0).toUpperCase()}
									</div>
									<div>
										<div class="text-white font-medium">{preset.title}</div>
										<div class="text-gray-400 text-sm">{preset.type} widget</div>
									</div>
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Export/Import -->
						<button
					class="bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white p-2 rounded-lg transition-all duration-200 border border-gray-700/50 hover:border-gray-600/50"
					onclick={exportLayout}
					title="Export Layout"
					aria-label="Export Layout"
				>
			<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
				<path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"></path>
			</svg>
		</button>

						<button
					class="bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white p-2 rounded-lg transition-all duration-200 border border-gray-700/50 hover:border-gray-600/50"
					onclick={importLayout}
					title="Import Layout"
					aria-label="Import Layout"
				>
			<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
				<path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
			</svg>
		</button>
	</div>

	<!-- Right Section: Settings & Controls -->
	<div class="flex items-center gap-3">
		<!-- Theme Toggle -->
						<button
					class="bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white px-3 py-2 rounded-lg transition-all duration-200 border border-gray-700/50 hover:border-gray-600/50 flex items-center gap-2"
					onclick={() => themeStore.toggleTheme()}
					title="Change Theme"
					aria-label="Change Theme"
				>
			<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
				<path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"></path>
			</svg>
		</button>

		<!-- Edit Mode Toggle -->
		<button
			class="px-3 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 font-medium
				{isEditMode 
					? 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white border border-orange-400/50' 
					: 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white border border-gray-700/50 hover:border-gray-600/50'}"
			onclick={toggleEditMode}
			style={isEditMode ? "box-shadow: 0 10px 15px -3px rgba(249, 115, 22, 0.25), 0 4px 6px -2px rgba(249, 115, 22, 0.05);" : ""}
		>
			<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
				<path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
			</svg>
			{isEditMode ? 'Exit Edit' : 'Edit Mode'}
		</button>

		<!-- AI Layout Suggestions -->
		<button
			class="bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-all"
			onclick={() => dashboardActions.openAILayoutModal()}
			title="AI Layout Suggestions"
		>
			<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
				<path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"></path>
			</svg>
			AI Layouts
		</button>
	</div>
</div>

{#if showWidgetMenu}
	<div
		class="fixed inset-0 z-40"
		onclick={() => showWidgetMenu = false}
		role="button"
		tabindex="0"
		onkeydown={(e) => { if (e.key === 'Escape') showWidgetMenu = false; }}
		aria-label="Close menu"
	></div>
{/if}

<style>
	.toolbar {
		backdrop-filter: blur(16px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
	}
</style>