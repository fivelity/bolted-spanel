<script lang="ts">
	import { onMount } from 'svelte';
	import { currentLayout, dashboardState } from '$lib/stores/dashboard.svelte';
	import { sensorStore } from '$lib/stores/sensorStore';
	import { themeStore, currentTheme } from '$lib/stores/themeStore';
	import { alertStore, alertHistory } from '$lib/stores/alertStore';
	import { injectCosmicTheme } from '$lib/components/cosmic/theme';
	import { CosmicToolbar } from '$lib/components/cosmic';
	import DashboardCanvas from './DashboardCanvas.svelte';
	import AILayoutModal from './AILayoutModal.svelte';

	onMount(() => {
		(async () => {
			await alertStore.init();
		})();

		// Initialize Cosmic UI theme
		injectCosmicTheme();
		
		sensorStore.connect();

		return () => {
			sensorStore.disconnect();
		};
	});
</script>

<div class="dashboard h-screen flex flex-col bg-surface-50-900-token">
	<!-- Cosmic UI Toolbar -->
	<CosmicToolbar>
		{#snippet left()}
			<div class="flex items-center gap-4">
				<h1 class="font-orbitron font-bold text-xl text-white">SenseCanvas</h1>
				<div class="text-xs text-blue-400/80 font-orbitron">Real-time Monitoring</div>
			</div>
		{/snippet}
		
		{#snippet center()}
			<div class="flex items-center gap-4">
				<button 
					class="cosmic-button px-4 py-2 text-sm font-orbitron text-blue-200 border border-blue-400/30 hover:border-blue-400 transition-colors rounded"
					on:click={() => $dashboardState.aiLayout.isOpen = true}
				>
					+ Add Widget
				</button>
				<button 
					class="cosmic-button px-4 py-2 text-sm font-orbitron text-gray-200 border border-gray-500/30 hover:border-gray-400 transition-colors rounded"
					on:click={() => $dashboardState.aiLayout.isOpen = true}
				>
					AI Layouts
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
			</div>
		{/snippet}
	</CosmicToolbar>

	<!-- Main Dashboard Area -->
	<div class="flex-1 relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
		<!-- Animated background elements -->
		<div class="absolute inset-0 overflow-hidden pointer-events-none">
			<!-- Grid pattern -->
			<div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0); background-size: 20px 20px;"></div>
			
			<!-- Floating particles -->
			<div class="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full opacity-30 animate-float-1"></div>
			<div class="absolute top-3/4 right-1/4 w-1 h-1 bg-green-400 rounded-full opacity-40 animate-float-2"></div>
			<div class="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-purple-400 rounded-full opacity-20 animate-float-3"></div>
			
			<!-- Scan lines -->
			<div class="absolute inset-0">
				<div class="absolute w-full h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent animate-scan-horizontal"></div>
				<div class="absolute h-full w-px bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent animate-scan-vertical"></div>
			</div>
		</div>
		
		<DashboardCanvas />
	</div>

	<!-- Status Bar -->
	<div class="status-bar bg-gray-900/80 border-t border-gray-700/50 px-4 py-2 text-xs text-gray-300 backdrop-blur-sm">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-4">
				<span class="flex items-center gap-1">
					<div class="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
					<span class="font-orbitron">Widgets:</span> <span class="font-mono">{($currentLayout?.widgets?.length || 0)}</span>
				</span>
				<span class="flex items-center gap-1">
					<div class="w-1 h-1 bg-blue-400 rounded-full"></div>
					<span class="font-orbitron">Layout:</span> <span class="font-orbitron">{$currentLayout?.name || 'Default'}</span>
				</span>
				<span class="flex items-center gap-1">
					<div class="w-1 h-1 bg-purple-400 rounded-full"></div>
					<span class="font-orbitron">Grid:</span> <span class="font-mono">{$currentLayout?.gridSize || 20}px</span>
				</span>
			</div>
			<div class="flex items-center gap-4">
				<span class="flex items-center gap-1">
					<div class="w-1 h-1 bg-yellow-400 rounded-full"></div>
					<span class="font-orbitron">Theme:</span> <span class="capitalize font-orbitron">{$currentTheme}</span>
				</span>
				<span class="flex items-center gap-1">
					<div class="w-1 h-1 bg-red-400 rounded-full animate-pulse"></div>
					<span class="font-orbitron">Alerts:</span> <span class="font-mono">{($alertHistory?.length || 0)}</span>
				</span>
			</div>
		</div>
	</div>

	{#if $dashboardState.aiLayout.isOpen}
	  <AILayoutModal />
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
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

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

	@media (prefers-reduced-motion: reduce) {
		.animate-float-1,
		.animate-float-2,
		.animate-float-3,
		.animate-scan-horizontal,
		.animate-scan-vertical {
			animation: none;
		}
	}
</style>