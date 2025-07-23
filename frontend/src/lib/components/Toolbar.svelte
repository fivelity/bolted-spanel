<script lang="ts">
	import { layoutStore, isEditMode } from '$lib/stores/layoutStore';
	import { themeStore, currentTheme } from '$lib/stores/themeStore';
	import { sensorStore } from '$lib/stores/sensorStore';
	import { Settings, CreditCard as Edit3, Plus, Download, Upload, Palette, Sparkles } from 'lucide-svelte';
	import { nanoid } from 'nanoid';
	import type { WidgetConfig } from '$lib/types/widget';
	import { dashboardActions } from '$lib/stores/dashboard';

	// Derived fix
	let connectionStatus = $derived(sensorStore.status);

	// Widget presets for quick adding
	const widgetPresets = [
		{
			name: 'CPU Usage',
			type: 'gauge' as const,
			sensorPath: 'cpu.usage',
			unit: '%',
			colors: ['#22c55e', '#f59e0b', '#ef4444']
		},
		{
			name: 'GPU Usage',
			type: 'gauge' as const,
			sensorPath: 'gpu.usage',
			unit: '%',
			colors: ['#3b82f6', '#8b5cf6', '#ef4444']
		},
		{
			name: 'Memory Usage',
			type: 'meter' as const,
			sensorPath: 'memory.usage',
			unit: '%',
			colors: ['#06b6d4', '#f59e0b', '#ef4444']
		},
		{
			name: 'CPU Temp',
			type: 'simple' as const,
			sensorPath: 'cpu.temperature',
			unit: '°C',
			colors: ['#10b981', '#f59e0b', '#ef4444']
		},
		{
			name: 'GPU Temp',
			type: 'simple' as const,
			sensorPath: 'gpu.temperature',
			unit: '°C',
			colors: ['#10b981', '#f59e0b', '#ef4444']
		}
	];

	function addWidget(preset: typeof widgetPresets[0]) {
		const widget: WidgetConfig = {
			id: nanoid(),
			type: preset.type,
			position: { x: 100, y: 100 },
			size: preset.type === 'gauge' ? { w: 200, h: 200 } : 
				  preset.type === 'meter' ? { w: 300, h: 80 } : 
				  { w: 180, h: 100 },
			title: preset.name,
			sensorPath: preset.sensorPath,
			unit: preset.unit,
			appearance: {
				colors: preset.colors,
				typography: {
					fontSize: 16,
					fontWeight: '600',
					color: '#1f2937'
				},
				borders: {
					thickness: 1,
					style: 'solid',
					radius: 8
				},
				chartParams: {
					startAngle: -90,
					endAngle: 270,
					strokeWidth: 8,
					showLabels: true
				}
			},
			alerts: [],
			minSize: { w: 100, h: 80 },
			maxSize: { w: 400, h: 400 }
		};

		layoutStore.addWidget(widget);
	}

	function exportLayout() {
		const layoutData = layoutStore.exportLayout();
		const blob = new Blob([layoutData], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `sensecanvas-layout-${Date.now()}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function importLayout() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		input.onchange = (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = (e) => {
					const content = e.target?.result as string;
					if (layoutStore.importLayout(content)) {
						alert('Layout imported successfully!');
					} else {
						alert('Failed to import layout. Please check the file format.');
					}
				};
				reader.readAsText(file);
			}
		};
		input.click();
	}

	let showWidgetMenu = $state(false);
</script>

<div class="toolbar bg-gray-900/90 border-b border-gray-700/50 px-4 py-3 backdrop-blur-md">
	<div class="flex items-center justify-between">
		<!-- Left Section -->
		<div class="flex items-center gap-4">
			<!-- Logo/Title -->
			<div class="flex items-center gap-2">
				<div class="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center relative overflow-hidden">
					<span class="text-white font-bold text-sm relative z-10">SC</span>
					<div class="absolute inset-0 bg-gradient-to-br from-cyan-400/50 to-blue-500/50 animate-pulse"></div>
				</div>
				<h1 class="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
					SenseCanvas
				</h1>
			</div>

			<!-- Connection Status -->
			<div class="flex items-center gap-2 text-sm bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700/50">
				<div 
					class="w-2 h-2 rounded-full transition-colors relative"
					class:bg-success-500={connectionStatus === 'connected'}
					class:bg-warning-500={connectionStatus === 'connecting'}
					class:bg-error-500={connectionStatus === 'error' || connectionStatus === 'disconnected'}
				>
					{#if connectionStatus === 'connected'}
						<div class="absolute inset-0 bg-green-400 rounded-full animate-ping"></div>
					{/if}
				</div>
				<span class="text-gray-300 font-medium">
					{connectionStatus === 'connected' ? 'Connected' : 
					 connectionStatus === 'connecting' ? 'Connecting...' : 
					 'Disconnected'}
				</span>
			</div>
		</div>

		<!-- Center Section - Widget Controls -->
		{#if $isEditMode}
			<div class="flex items-center gap-2">
				<!-- Add Widget Dropdown -->
				<div class="relative">
					<button
						class="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-cyan-500/25"
						on:click={() => showWidgetMenu = !showWidgetMenu}
					>
						<Plus size={16} />
						<span class="font-medium">Add Widget</span>
					</button>

					{#if showWidgetMenu}
						<div class="absolute top-full left-0 mt-2 bg-gray-800/95 border border-gray-700/50 rounded-lg shadow-2xl z-50 min-w-48 backdrop-blur-md">
							{#each widgetPresets as preset}
								<button
									class="w-full px-4 py-3 text-left hover:bg-gray-700/50 transition-all duration-200 first:rounded-t-lg last:rounded-b-lg group"
									on:click={() => { addWidget(preset); showWidgetMenu = false; }}
								>
									<div class="font-medium text-white group-hover:text-cyan-300 transition-colors">{preset.name}</div>
									<div class="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">{preset.type} • {preset.sensorPath}</div>
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Layout Actions -->
				<button
					class="bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white p-2 rounded-lg transition-all duration-200 border border-gray-700/50 hover:border-gray-600/50"
					on:click={exportLayout}
					title="Export Layout"
				>
					<Download size={16} />
				</button>

				<button
					class="bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white p-2 rounded-lg transition-all duration-200 border border-gray-700/50 hover:border-gray-600/50"
					on:click={importLayout}
					title="Import Layout"
				>
					<Upload size={16} />
				</button>
			</div>
		{/if}

		<!-- Right Section -->
		<div class="flex items-center gap-2">
			<!-- Theme Toggle -->
			<button
				class="bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white px-3 py-2 rounded-lg transition-all duration-200 border border-gray-700/50 hover:border-gray-600/50 flex items-center gap-2"
				on:click={() => themeStore.toggleTheme()}
				title="Change Theme"
			>
				<Palette size={16} />
				<span class="hidden sm:inline capitalize font-medium">{$currentTheme}</span>
			</button>

			<!-- Settings -->
			<button
				class="bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white p-2 rounded-lg transition-all duration-200 border border-gray-700/50 hover:border-gray-600/50"
				title="Settings"
			>
				<Settings size={16} />
			</button>

			<!-- Edit Mode Toggle -->
			<button
				class="px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium {$isEditMode 
					? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg' 
					: 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white border border-gray-700/50 hover:border-gray-600/50'}"
				on:click={() => layoutStore.toggleEditMode()}
				style={$isEditMode ? "box-shadow: 0 10px 15px -3px rgba(249, 115, 22, 0.25), 0 4px 6px -2px rgba(249, 115, 22, 0.05);" : ""}
			>
				<Edit3 size={16} />
				<span class="hidden sm:inline">
					{$isEditMode ? 'Exit Edit' : 'Edit'}
				</span>
			</button>

			<!-- AI Layout Button -->
			<button
				class="bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-all"
				on:click={() => dashboardActions.openAILayoutModal()}
				title="AI Layout Suggestions"
			>
				<Sparkles size={16} />
				<span class="hidden sm:inline">AI Layout</span>
			</button>
		</div>
	</div>
</div>

<!-- Click outside to close widget menu -->
{#if showWidgetMenu}
	<div 
		class="fixed inset-0 z-40" 
		on:click={() => showWidgetMenu = false}
	></div>
{/if}

<style>
	.toolbar {
		backdrop-filter: blur(16px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
	}
</style>