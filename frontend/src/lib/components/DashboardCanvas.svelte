<script lang="ts">
	import { onMount } from 'svelte';
	import { currentLayout, dashboardState } from '$lib/stores/dashboard.svelte';
	import { sensorStore } from '$lib/stores/sensorStore';
	import { CosmicPanel } from '$lib/components/cosmic';
	import CosmicSensorGauge from './widgets/CosmicSensorGauge.svelte';
	import DraggableWidget from './DraggableWidget.svelte';
	import GridOverlay from './GridOverlay.svelte';
	import SelectionBox from './SelectionBox.svelte';
	import WidgetBuilder from './WidgetBuilder.svelte';

	let canvasElement: HTMLDivElement;

	// Demo sensor data
	const demoSensors = [
		{ label: "CPU Usage", value: 65, unit: "%", icon: "🔥", critical: 90, warning: 70 },
		{ label: "GPU Usage", value: 82, unit: "%", icon: "⚡", critical: 95, warning: 80 },
		{ label: "Memory", value: 74, unit: "%", icon: "💾", critical: 90, warning: 75 },
		{ label: "CPU Temp", value: 68, unit: "°C", icon: "🌡️", critical: 85, warning: 70 },
	];

	onMount(() => {
		// Canvas initialization code can go here
	});
</script>

<div 
	bind:this={canvasElement}
	class="relative w-full h-full overflow-hidden"
	style="background: radial-gradient(ellipse at center, rgba(20, 160, 230, 0.05) 0%, transparent 70%)"
>
	<!-- Grid Overlay -->
	{#if $dashboardState.isGridVisible}
		<GridOverlay gridSize={$dashboardState.dragState.gridSize} zoom={$dashboardState.zoom} />
	{/if}

	<!-- Cosmic UI Demo Content -->
	<div class="absolute inset-0 p-8">
		<!-- Welcome Panel -->
		<CosmicPanel 
			variant="highlighted" 
			title="SenseCanvas Dashboard" 
			subtitle="Real-time Hardware Monitoring with Cosmic UI"
			className="w-full max-w-2xl mx-auto mb-8"
			showGlow={true}
		>
			<div class="text-center space-y-4">
				<p class="text-gray-300 font-orbitron">
					Welcome to the enhanced SenseCanvas dashboard featuring the new Cosmic UI design system.
				</p>
				<p class="text-sm text-gray-400">
					Sci-fi inspired components with SVG-first design and real-time hardware monitoring.
				</p>
			</div>
		</CosmicPanel>

		<!-- Sensor Gauges Grid -->
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
			{#each demoSensors as sensor, index}
				<div class="flex justify-center">
					<CosmicSensorGauge
						value={sensor.value}
						label={sensor.label}
						config={{
							min: 0,
							max: 100,
							warningThreshold: sensor.warning,
							criticalThreshold: sensor.critical,
							unit: sensor.unit,
							icon: sensor.icon
						}}
						size={180}
						showFrame={true}
						glowEffect={true}
					/>
				</div>
			{/each}
		</div>

		<!-- Status Panel -->
		<CosmicPanel 
			variant="default" 
			className="w-full max-w-4xl mx-auto mt-8"
			title="System Status"
		>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
				<div class="space-y-2">
					<div class="text-2xl font-orbitron text-green-400">ONLINE</div>
					<div class="text-sm text-gray-400">Connection Status</div>
				</div>
				<div class="space-y-2">
					<div class="text-2xl font-orbitron text-blue-400">{demoSensors.length}</div>
					<div class="text-sm text-gray-400">Active Sensors</div>
				</div>
				<div class="space-y-2">
					<div class="text-2xl font-orbitron text-purple-400">COSMIC UI</div>
					<div class="text-sm text-gray-400">Design System</div>
				</div>
			</div>
		</CosmicPanel>
	</div>

	<!-- Existing widget system -->
	{#if $currentLayout}
		{#each $currentLayout.widgets as widget (widget.id)}
			<DraggableWidget {widget} />
		{/each}
	{/if}

	<!-- Selection box can be added later if needed -->

	<!-- Widget Builder Modal -->
	{#if $dashboardState.widgetBuilder.isOpen}
		<WidgetBuilder />
	{/if}
</div>

<style>
	/* Add subtle animations */
	.grid > div {
		animation: fadeInUp 0.6s ease-out forwards;
		animation-delay: calc(var(--index, 0) * 0.1s);
		opacity: 0;
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>