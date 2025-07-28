<script lang="ts">
	import { onMount } from 'svelte';
	import { currentLayout, dashboardState, dashboardActions, widgetTemplates } from '$lib/stores/dashboard.svelte';
	import { sensorStore } from '$lib/stores/sensorStore';
	import { currentTheme } from '$lib/stores/themeStore';
	import { alertStore, alertHistory } from '$lib/stores/alertStore';
	import { injectCosmicTheme } from '$lib/components/cosmic/theme';
	import { CosmicToolbar } from '$lib/components/cosmic';
	import DashboardCanvas from './DashboardCanvas.svelte';
	import AILayoutModal from './AILayoutModal.svelte';

	// Enhanced toolbar functionality
	let showWidgetMenu = false;
	let showLayoutMenu = false;

	const handleAddWidget = () => {
		showWidgetMenu = !showWidgetMenu;
	};

	const handleAddSpecificWidget = (templateId: string) => {
		const template = widgetTemplates.find(t => t.id === templateId);
		if (template) {
			dashboardActions.addWidget(template, { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 });
		}
		showWidgetMenu = false;
	};

	const handleLayoutMenu = () => {
		showLayoutMenu = !showLayoutMenu;
	};

	const handleCreateNewLayout = () => {
		const layoutName = prompt('Enter layout name:');
		if (layoutName) {
			dashboardActions.createLayout(layoutName, 'Custom dashboard layout');
		}
		showLayoutMenu = false;
	};

	const handleLoadDefaultLayout = () => {
		dashboardActions.createDefaultLayout();
		showLayoutMenu = false;
	};

	const handleToggleGrid = () => {
		dashboardActions.toggleGrid();
	};

	const handleSaveLayout = () => {
		dashboardActions.saveLayout();
		// Show a brief success message (could be enhanced with a toast notification)
		console.log('Layout saved successfully!');
	};

	onMount(() => {
		(async () => {
			await alertStore.init();
		})();

		// Initialize Cosmic UI theme
		injectCosmicTheme();
		
		// Initialize default layout if none exists
		if (!$currentLayout) {
			dashboardActions.createDefaultLayout();
		}
		
		sensorStore.connect();

		return () => {
			sensorStore.disconnect();
		};
	});
</script>

<div class="dashboard h-screen flex flex-col bg-surface-50-900-token">
	<!-- Enhanced Cosmic UI Toolbar -->
	<CosmicToolbar>
		{#snippet left()}
			<div class="flex items-center gap-4">
				<h1 class="font-orbitron font-bold text-xl text-white">SenseCanvas</h1>
				<div class="text-xs text-cyan-400/80 font-orbitron">Real-time Monitoring</div>
			</div>
		{/snippet}
		
		{#snippet center()}
			<div class="flex items-center gap-3">
				<!-- Add Widget Button with Dropdown -->
				<div class="relative">
					<button 
						class="cosmic-button px-4 py-2 text-sm font-orbitron text-cyan-200 border border-cyan-400/30 hover:border-cyan-400 transition-all duration-300 rounded flex items-center gap-2"
						onclick={handleAddWidget}
					>
						<span class="text-cyan-400">+</span>
						Add Widget
						<span class="text-xs opacity-60">▼</span>
					</button>
					
					{#if showWidgetMenu}
						<div class="absolute top-full left-0 mt-2 w-64 bg-gray-900/95 border border-cyan-400/30 rounded-lg shadow-xl backdrop-blur-sm z-50">
							<div class="p-2">
								<div class="text-xs font-orbitron text-cyan-300 mb-2 px-2">WIDGET TYPES</div>
								{#each widgetTemplates.slice(0, 6) as template}
									<button
										class="w-full text-left px-3 py-2 text-sm text-cyan-200 hover:bg-cyan-400/10 rounded transition-colors flex items-center gap-2"
										onclick={() => handleAddSpecificWidget(template.id)}
									>
										<span class="w-2 h-2 bg-cyan-400 rounded-full"></span>
										{template.name}
									</button>
								{/each}
							</div>
						</div>
					{/if}
				</div>

				<!-- Layout Management Button -->
				<div class="relative">
					<button 
						class="cosmic-button px-4 py-2 text-sm font-orbitron text-gray-200 border border-gray-500/30 hover:border-gray-400 transition-all duration-300 rounded flex items-center gap-2"
						onclick={handleLayoutMenu}
					>
						<span class="text-purple-400">⚡</span>
						Layouts
						<span class="text-xs opacity-60">▼</span>
					</button>
					
					{#if showLayoutMenu}
						<div class="absolute top-full left-0 mt-2 w-56 bg-gray-900/95 border border-purple-400/30 rounded-lg shadow-xl backdrop-blur-sm z-50">
							<div class="p-2">
								<div class="text-xs font-orbitron text-purple-300 mb-2 px-2">LAYOUT OPTIONS</div>
								<button
									class="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-purple-400/10 rounded transition-colors"
									onclick={handleLoadDefaultLayout}
								>
									🏠 Load Default Layout
								</button>
								<button
									class="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-purple-400/10 rounded transition-colors"
									onclick={handleCreateNewLayout}
								>
									➕ Create New Layout
								</button>
								<button
									class="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-purple-400/10 rounded transition-colors"
									onclick={handleSaveLayout}
								>
									💾 Save Current Layout
								</button>
								<button
									class="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-purple-400/10 rounded transition-colors"
									onclick={() => $dashboardState.aiLayout.isOpen = true}
								>
									🤖 AI Layout Suggestions
								</button>
							</div>
						</div>
					{/if}
				</div>

				<!-- Grid Toggle Button -->
				<button 
					class="cosmic-button px-4 py-2 text-sm font-orbitron text-gray-200 border border-gray-500/30 hover:border-gray-400 transition-all duration-300 rounded flex items-center gap-2"
					onclick={handleToggleGrid}
					class:border-cyan-400={$dashboardState.isGridVisible}
					class:text-cyan-200={$dashboardState.isGridVisible}
				>
					<span class="text-yellow-400">⚏</span>
					Grid
					{#if $dashboardState.isGridVisible}
						<span class="text-xs text-cyan-400">ON</span>
					{:else}
						<span class="text-xs opacity-60">OFF</span>
					{/if}
				</button>
			</div>
		{/snippet}
		
		{#snippet right()}
			<div class="flex items-center gap-4 text-xs text-gray-300">
				<span class="flex items-center gap-1">
					<div class="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
					<span class="font-orbitron">Connected</span>
				</span>
				<span class="flex items-center gap-1">
					<div class="w-1 h-1 bg-blue-400 rounded-full"></div>
					<span class="font-orbitron">Theme: {$currentTheme}</span>
				</span>
				<span class="flex items-center gap-1">
					<div class="w-1 h-1 bg-purple-400 rounded-full"></div>
					<span class="font-orbitron">v2.0</span>
				</span>
			</div>
		{/snippet}
	</CosmicToolbar>

	<!-- Main Dashboard Area -->
	<div class="flex-1 relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
		<!-- Enhanced animated background elements -->
		<div class="absolute inset-0 overflow-hidden pointer-events-none">
			<!-- Grid pattern -->
			<div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(circle at 1px 1px, rgba(0,255,255,0.3) 1px, transparent 0); background-size: 20px 20px;"></div>
			
			<!-- Floating particles with improved animation -->
			<div class="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400 rounded-full opacity-30 animate-float-1"></div>
			<div class="absolute top-3/4 right-1/4 w-1 h-1 bg-blue-400 rounded-full opacity-40 animate-float-2"></div>
			<div class="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-purple-400 rounded-full opacity-20 animate-float-3"></div>
			<div class="absolute top-1/6 right-1/3 w-1 h-1 bg-green-400 rounded-full opacity-35 animate-float-1"></div>
			
			<!-- Enhanced scan lines -->
			<div class="absolute inset-0">
				<div class="absolute w-full h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent animate-scan-horizontal"></div>
				<div class="absolute h-full w-px bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent animate-scan-vertical"></div>
			</div>
		</div>
		
		<DashboardCanvas />
	</div>

	<!-- Enhanced Status Bar -->
	<div class="status-bar bg-gray-900/80 border-t border-gray-700/50 px-4 py-2 text-xs text-gray-300 backdrop-blur-sm">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-4">
				<span class="flex items-center gap-1">
					<div class="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
					<span class="font-orbitron">Widgets:</span> 
					<span class="font-mono text-cyan-400">{($currentLayout?.widgets?.length || 0)}</span>
				</span>
				<span class="flex items-center gap-1">
					<div class="w-1 h-1 bg-blue-400 rounded-full"></div>
					<span class="font-orbitron">Layout:</span> 
					<span class="font-orbitron text-cyan-400">{$currentLayout?.name || 'Default'}</span>
				</span>
				<span class="flex items-center gap-1">
					<div class="w-1 h-1 bg-purple-400 rounded-full"></div>
					<span class="font-orbitron">Grid:</span> 
					<span class="font-mono text-cyan-400">{$currentLayout?.gridSize || 20}px</span>
				</span>
				<span class="flex items-center gap-1">
					<div class="w-1 h-1 bg-yellow-400 rounded-full"></div>
					<span class="font-orbitron">Zoom:</span> 
					<span class="font-mono text-cyan-400">{Math.round($dashboardState.zoom * 100)}%</span>
				</span>
			</div>
			<div class="flex items-center gap-4">
				<span class="flex items-center gap-1">
					<div class="w-1 h-1 bg-cyan-400 rounded-full"></div>
					<span class="font-orbitron">Theme:</span> 
					<span class="capitalize font-orbitron text-cyan-400">{$currentTheme}</span>
				</span>
				<span class="flex items-center gap-1">
					<div class="w-1 h-1 bg-red-400 rounded-full animate-pulse"></div>
					<span class="font-orbitron">Alerts:</span> 
					<span class="font-mono text-cyan-400">{($alertHistory?.length || 0)}</span>
				</span>
				<span class="flex items-center gap-1">
					<div class="w-1 h-1 bg-green-400 rounded-full"></div>
					<span class="font-orbitron">Status:</span> 
					<span class="font-orbitron text-green-400">OPTIMAL</span>
				</span>
			</div>
		</div>
	</div>

	{#if $dashboardState.aiLayout.isOpen}
	  <AILayoutModal />
	{/if}

	<!-- Click outside handler for dropdowns -->
	{#if showWidgetMenu || showLayoutMenu}
		<button 
			type="button"
			class="fixed inset-0 z-40 bg-transparent cursor-default" 
			onclick={() => {
				showWidgetMenu = false;
				showLayoutMenu = false;
			}}
			onkeydown={(e) => {
				if (e.key === 'Escape') {
					showWidgetMenu = false;
					showLayoutMenu = false;
				}
			}}
			aria-label="Close dropdown menu"
			tabindex="-1"
		/>
	{/if}
</div>

<style lang="css">
	.dashboard {
		background: 
			radial-gradient(ellipse at top left, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
			radial-gradient(ellipse at top right, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
			radial-gradient(ellipse at bottom, rgba(16, 185, 129, 0.1) 0%, transparent 50%);
	}

	.status-bar {
		backdrop-filter: blur(10px);
		border-top: 1px solid rgba(0, 255, 255, 0.1);
	}

	.cosmic-button {
		position: relative;
		overflow: hidden;
		transition: all 0.3s ease;
	}

	.cosmic-button:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 255, 255, 0.2);
	}

	.cosmic-button:active {
		transform: translateY(0);
	}

	/* Enhanced floating animations */
	@keyframes float-1 {
		0%, 100% { transform: translate(0, 0) rotate(0deg); }
		33% { transform: translate(30px, -30px) rotate(120deg); }
		66% { transform: translate(-20px, 20px) rotate(240deg); }
	}

	@keyframes float-2 {
		0%, 100% { transform: translate(0, 0) rotate(0deg); }
		50% { transform: translate(-40px, -20px) rotate(180deg); }
	}

	@keyframes float-3 {
		0%, 100% { transform: translate(0, 0) rotate(0deg); }
		25% { transform: translate(20px, -40px) rotate(90deg); }
		50% { transform: translate(-30px, -20px) rotate(180deg); }
		75% { transform: translate(10px, 30px) rotate(270deg); }
	}

	@keyframes scan-horizontal {
		0% { transform: translateY(-100vh); }
		100% { transform: translateY(100vh); }
	}

	@keyframes scan-vertical {
		0% { transform: translateX(-100vw); }
		100% { transform: translateX(100vw); }
	}

	.animate-float-1 {
		animation: float-1 20s ease-in-out infinite;
	}

	.animate-float-2 {
		animation: float-2 15s ease-in-out infinite;
	}

	.animate-float-3 {
		animation: float-3 25s ease-in-out infinite;
	}

	.animate-scan-horizontal {
		animation: scan-horizontal 8s linear infinite;
	}

	.animate-scan-vertical {
		animation: scan-vertical 12s linear infinite;
	}

	/* Dropdown animations */
	.relative > div {
		animation: dropdownFadeIn 0.2s ease-out;
	}

	@keyframes dropdownFadeIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.animate-float-1,
		.animate-float-2,
		.animate-float-3,
		.animate-scan-horizontal,
		.animate-scan-vertical,
		.cosmic-button {
			animation: none;
		}
		
		.cosmic-button:hover {
			transform: none;
		}
	}
</style>