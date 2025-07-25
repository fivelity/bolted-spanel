<script lang="ts">
	import { onMount } from 'svelte';
	import { currentLayout, dashboardState, dashboardActions } from '$lib/stores/dashboard.svelte';
	import { CosmicPanel } from '$lib/components/cosmic';
	import CosmicSensorGauge from './widgets/CosmicSensorGauge.svelte';
	import CosmicLinearMeter from './widgets/CosmicLinearMeter.svelte';
	import CosmicKPICard from './widgets/CosmicKPICard.svelte';
	import DraggableWidget from './DraggableWidget.svelte';
	import GridOverlay from './GridOverlay.svelte';
	import WidgetBuilder from './WidgetBuilder.svelte';

	let canvasElement: HTMLDivElement;

	// Enhanced demo sensor data with realistic values
	const sensorData = {
		cpu: { value: 65, trend: 'stable' },
		gpu: { value: 82, trend: 'increasing' },
		memory: { value: 74, trend: 'stable' },
		cpuTemp: { value: 68, trend: 'stable' },
		gpuTemp: { value: 71, trend: 'increasing' },
		diskUsage: { value: 45, trend: 'stable' },
		networkUp: { value: 23, trend: 'fluctuating' },
		networkDown: { value: 156, trend: 'fluctuating' }
	};

	// Default widget layout configuration
	const defaultWidgets = [
		// Top row - Main gauges
		{
			type: 'gauge',
			label: 'CPU Usage',
			value: sensorData.cpu.value,
			config: { min: 0, max: 100, warningThreshold: 70, criticalThreshold: 90, unit: '%', icon: '🔥' },
			position: { x: 40, y: 40 },
			size: 200
		},
		{
			type: 'gauge',
			label: 'GPU Usage',
			value: sensorData.gpu.value,
			config: { min: 0, max: 100, warningThreshold: 80, criticalThreshold: 95, unit: '%', icon: '⚡' },
			position: { x: 280, y: 40 },
			size: 200
		},
		{
			type: 'gauge',
			label: 'Memory Usage',
			value: sensorData.memory.value,
			config: { min: 0, max: 100, warningThreshold: 75, criticalThreshold: 90, unit: '%', icon: '💾' },
			position: { x: 520, y: 40 },
			size: 200
		},
		{
			type: 'gauge',
			label: 'CPU Temperature',
			value: sensorData.cpuTemp.value,
			config: { min: 0, max: 100, warningThreshold: 70, criticalThreshold: 85, unit: '°C', icon: '🌡️' },
			position: { x: 760, y: 40 },
			size: 200
		},
		
		// Second row - Linear meters
		{
			type: 'linear',
			label: 'Disk Usage',
			value: sensorData.diskUsage.value,
			config: { min: 0, max: 100, warningThreshold: 80, criticalThreshold: 95, unit: '%', icon: '💿' },
			position: { x: 40, y: 280 },
			width: 300,
			height: 120
		},
		{
			type: 'linear',
			label: 'GPU Temperature',
			value: sensorData.gpuTemp.value,
			config: { min: 0, max: 100, warningThreshold: 75, criticalThreshold: 90, unit: '°C', icon: '🌡️' },
			position: { x: 380, y: 280 },
			width: 300,
			height: 120
		},
		
		// Third row - KPI Card and additional metrics
		{
			type: 'kpi',
			position: { x: 720, y: 280 },
			width: 320,
			height: 200,
			config: {
				title: 'System Overview',
				metrics: [
					{ label: 'CPU', value: sensorData.cpu.value, unit: '%', icon: '🔥', threshold: { warning: 70, critical: 90 } },
					{ label: 'Memory', value: sensorData.memory.value, unit: '%', icon: '💾', threshold: { warning: 75, critical: 90 } },
					{ label: 'GPU', value: sensorData.gpu.value, unit: '%', icon: '⚡', threshold: { warning: 80, critical: 95 } },
					{ label: 'Temp', value: sensorData.cpuTemp.value, unit: '°C', icon: '🌡️', threshold: { warning: 70, critical: 85 } }
				]
			}
		}
	];

	// Initialize default layout if none exists
	onMount(() => {
		if (!$currentLayout || $currentLayout.widgets.length === 0) {
			// Create default layout with enhanced widgets
			dashboardActions.createDefaultLayout();
		}
	});

	// Function to get sensor value by data source
	const getSensorValue = (dataSource: string): number => {
		switch (dataSource) {
			case 'cpu.usage': return sensorData.cpu.value;
			case 'gpu.usage': return sensorData.gpu.value;
			case 'memory.usage': return sensorData.memory.value;
			case 'cpu.temperature': return sensorData.cpuTemp.value;
			case 'gpu.temperature': return sensorData.gpuTemp.value;
			case 'disk.usage': return sensorData.diskUsage.value;
			case 'network.usage': return sensorData.networkDown.value;
			case 'system.load': return (sensorData.cpu.value + sensorData.memory.value) / 2;
			case 'performance.fps': return 60 + Math.random() * 20;
			case 'network.latency': return 20 + Math.random() * 30;
			case 'system.power': return 250 + Math.random() * 100;
			case 'cooling.fan': return 1500 + Math.random() * 800;
			default: return Math.random() * 100;
		}
	};

	// Simulate real-time data updates
	let dataUpdateInterval: NodeJS.Timeout;
	
	onMount(() => {
		dataUpdateInterval = setInterval(() => {
			// Simulate small variations in sensor data
			Object.keys(sensorData).forEach(key => {
				const sensor = sensorData[key as keyof typeof sensorData];
				const variation = (Math.random() - 0.5) * 4; // ±2% variation
				sensor.value = Math.max(0, Math.min(100, sensor.value + variation));
			});
			
			// Trigger reactivity (in a real app, this would come from the sensor store)
			sensorData.cpu = { ...sensorData.cpu };
		}, 2000);

		return () => {
			if (dataUpdateInterval) clearInterval(dataUpdateInterval);
		};
	});
</script>

<div 
	bind:this={canvasElement}
	class="relative w-full h-full overflow-hidden dashboard-canvas"
	style="background: radial-gradient(ellipse at center, rgba(0, 255, 255, 0.03) 0%, transparent 70%)"
>
	<!-- Grid Overlay -->
	{#if $dashboardState.isGridVisible}
		<GridOverlay gridSize={$dashboardState.dragState.gridSize} zoom={$dashboardState.zoom} />
	{/if}

	<!-- Enhanced Dashboard Content -->
	<div class="absolute inset-0 p-6">
		<!-- Welcome Header (only show if no custom layout) -->
		{#if !$currentLayout || $currentLayout.widgets.length === 0}
			<div class="mb-8 text-center">
				<CosmicPanel 
					variant="highlighted" 
					title="SenseCanvas Dashboard" 
					subtitle="Real-time Hardware Monitoring"
					className="w-full max-w-3xl mx-auto"
					showGlow={true}
				>
					<div class="text-center space-y-3">
						<p class="text-cyan-200 font-orbitron text-lg">
							Enhanced Cosmic UI Design System
						</p>
						<p class="text-sm text-cyan-400 opacity-80">
							Futuristic monitoring with segmented gauges, real-time updates, and intelligent alerts
						</p>
					</div>
				</CosmicPanel>
			</div>
		{/if}

		<!-- Dynamic Widget Grid from Current Layout -->
		{#if $currentLayout && $currentLayout.widgets.length > 0}
			<div class="widget-grid relative">
				{#each $currentLayout.widgets as widget, index}
					<DraggableWidget {widget} />
				{/each}
			</div>
		{:else}
			<!-- Fallback: Default Widget Grid -->
			<div class="widget-grid relative">
				{#each defaultWidgets as widget, index}
					<div 
						class="absolute widget-item"
						style="left: {widget.position.x}px; top: {widget.position.y}px; z-index: {10 + index};"
					>
						{#if widget.type === 'gauge'}
							<CosmicSensorGauge
								value={widget.value || 0}
								label={widget.label || 'Sensor'}
								config={widget.config}
								size={widget.size || 200}
								showFrame={true}
								glowEffect={true}
							/>
						{/if}
					</div>
				{/each}
			</div>
		{/if}

		<!-- System Status Panel -->
		<div class="absolute bottom-6 left-6 right-6">
			<CosmicPanel 
				variant="default" 
				className="w-full"
				title="System Status"
			>
				<div class="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
					<div class="space-y-2">
						<div class="text-2xl font-orbitron text-green-400">ONLINE</div>
						<div class="text-sm text-cyan-400 opacity-80">Connection Status</div>
					</div>
					<div class="space-y-2">
						<div class="text-2xl font-orbitron text-blue-400">{defaultWidgets.length}</div>
						<div class="text-sm text-cyan-400 opacity-80">Active Widgets</div>
					</div>
					<div class="space-y-2">
						<div class="text-2xl font-orbitron text-purple-400">COSMIC</div>
						<div class="text-sm text-cyan-400 opacity-80">UI Framework</div>
					</div>
					<div class="space-y-2">
						<div class="text-2xl font-orbitron text-cyan-400">
							{Math.max(...defaultWidgets.filter(w => w.type === 'gauge').map(w => w.value)).toFixed(0)}%
						</div>
						<div class="text-sm text-cyan-400 opacity-80">Peak Usage</div>
					</div>
				</div>
			</CosmicPanel>
		</div>
	</div>



	<!-- Widget Builder Modal -->
	{#if $dashboardState.widgetBuilder.isOpen}
		<WidgetBuilder />
	{/if}

	<!-- Background Effects -->
	<div class="absolute inset-0 pointer-events-none overflow-hidden">
		<!-- Animated particles -->
		<div class="absolute top-1/4 left-1/6 w-1 h-1 bg-cyan-400 rounded-full opacity-40 animate-float-slow"></div>
		<div class="absolute top-3/4 right-1/4 w-1.5 h-1.5 bg-blue-400 rounded-full opacity-30 animate-float-medium"></div>
		<div class="absolute top-1/2 left-3/4 w-0.5 h-0.5 bg-purple-400 rounded-full opacity-50 animate-float-fast"></div>
		
		<!-- Scanning lines -->
		<div class="absolute inset-0 opacity-20">
			<div class="absolute w-full h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent animate-scan-horizontal"></div>
			<div class="absolute h-full w-px bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent animate-scan-vertical"></div>
		</div>
	</div>
</div>

<style>
	.dashboard-canvas {
		background-image: 
			radial-gradient(circle at 25% 25%, rgba(0, 255, 255, 0.05) 0%, transparent 50%),
			radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.05) 0%, transparent 50%);
	}

	.widget-grid {
		min-height: 600px;
	}

	.widget-item {
		transition: all 0.3s ease;
		animation: fadeInUp 0.8s ease-out forwards;
		animation-delay: calc(var(--index, 0) * 0.1s);
		opacity: 0;
	}

	.widget-item:nth-child(1) { --index: 0; }
	.widget-item:nth-child(2) { --index: 1; }
	.widget-item:nth-child(3) { --index: 2; }
	.widget-item:nth-child(4) { --index: 3; }
	.widget-item:nth-child(5) { --index: 4; }
	.widget-item:nth-child(6) { --index: 5; }
	.widget-item:nth-child(7) { --index: 6; }

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(30px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@keyframes float-slow {
		0%, 100% { transform: translate(0, 0) rotate(0deg); }
		33% { transform: translate(20px, -20px) rotate(120deg); }
		66% { transform: translate(-15px, 15px) rotate(240deg); }
	}

	@keyframes float-medium {
		0%, 100% { transform: translate(0, 0) rotate(0deg); }
		50% { transform: translate(-25px, -15px) rotate(180deg); }
	}

	@keyframes float-fast {
		0%, 100% { transform: translate(0, 0) rotate(0deg); }
		25% { transform: translate(15px, -25px) rotate(90deg); }
		50% { transform: translate(-20px, -10px) rotate(180deg); }
		75% { transform: translate(5px, 20px) rotate(270deg); }
	}

	@keyframes scan-horizontal {
		0% { transform: translateY(-100vh); }
		100% { transform: translateY(100vh); }
	}

	@keyframes scan-vertical {
		0% { transform: translateX(-100vw); }
		100% { transform: translateX(100vw); }
	}

	.animate-float-slow {
		animation: float-slow 25s ease-in-out infinite;
	}

	.animate-float-medium {
		animation: float-medium 18s ease-in-out infinite;
	}

	.animate-float-fast {
		animation: float-fast 12s ease-in-out infinite;
	}

	.animate-scan-horizontal {
		animation: scan-horizontal 15s linear infinite;
	}

	.animate-scan-vertical {
		animation: scan-vertical 20s linear infinite;
	}

	/* Responsive layout */
	@media (max-width: 1200px) {
		.widget-grid {
			transform: scale(0.9);
			transform-origin: top left;
		}
	}

	@media (max-width: 768px) {
		.widget-grid {
			transform: scale(0.7);
		}
		
		.grid {
			grid-template-columns: 1fr;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.widget-item,
		.animate-float-slow,
		.animate-float-medium,
		.animate-float-fast,
		.animate-scan-horizontal,
		.animate-scan-vertical {
			animation: none;
		}
		
		.widget-item {
			opacity: 1;
			transform: none;
		}
	}
</style>