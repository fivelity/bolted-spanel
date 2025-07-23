<script lang="ts">
	import { sensorStore } from '$lib/stores/sensorStore';
	
	interface Props {
		config: {
			min?: number;
			max?: number;
			unit?: string;
			colors?: string[];
			thresholds?: number[];
			[key: string]: unknown;
		};
		value: number | null;
	}

	let { config, value }: Props = $props();

	// Meter configuration with defaults
	const meterConfig = {
		min: config.min ?? 0,
		max: config.max ?? 100,
		unit: config.unit ?? '%',
		colors: config.colors ?? ['#22c55e', '#f59e0b', '#ef4444'],
		thresholds: config.thresholds ?? [70, 90],
		...config as Record<string, unknown>
	};

	// Get sensor value reactively (fallback if no value provided)
	const sensorValue = () => {
		return value ?? $sensorStore.data?.cpu?.usage ?? 0;
	};

	// Color based on current value and thresholds
	const currentColor = $derived(() => {
		const val = sensorValue();
		const colors = meterConfig.colors;
		const thresholds = meterConfig.thresholds;

		if (val === null || val === undefined) return colors[0];
		
		for (let i = thresholds.length - 1; i >= 0; i--) {
			if (val >= thresholds[i]) {
				return colors[i + 1] || colors[colors.length - 1];
			}
		}
		return colors[0];
	});

	// Animated value for smooth meter transitions
	let animatedValue = $state(0);
	
	// Calculate percentage for progress bar
	let percentage = $derived(() => {
		const maxValue = meterConfig.max;
		return Math.min(100, Math.max(0, (animatedValue / maxValue) * 100));
	});

	// Update animated value when sensor value changes
	$effect(() => {
		const targetValue = sensorValue();
		animatedValue = targetValue;
	});

	// Styling properties
	let borderRadius = 8;
	let unit = meterConfig.unit;
</script>

<div 
	class="meter-widget relative h-full w-full overflow-hidden bg-gray-900/90 rounded-lg"
	style="border-radius: {borderRadius}px;"
>
	<!-- Background gradient -->
	<div class="absolute inset-0 bg-gradient-to-br from-gray-900/50 via-gray-800/30 to-gray-900/50"></div>
	
	<!-- Content -->
	<div class="relative z-10 h-full flex flex-col justify-center p-4">
		<!-- Title and Value Row -->
		<div class="flex items-center justify-between mb-3">
			<h3 class="text-sm font-bold tracking-wide uppercase text-gray-300">
				{config.title}
			</h3>
			<div class="flex items-baseline gap-1">
				<span 
					class="text-lg font-bold font-mono"
					style="color: {currentColor()};"
				>
					{sensorValue().toFixed(1)}
				</span>
				<span class="text-xs text-gray-400">
					{unit}
				</span>
			</div>
		</div>

		<!-- Progress Bar -->
		<div class="relative">
			<!-- Background bar -->
			<div class="w-full h-3 bg-gray-700/50 rounded-full overflow-hidden">
				<!-- Progress fill -->
				<div 
					class="h-full transition-all duration-300 rounded-full"
					style="
						width: {percentage()}%;
						background: linear-gradient(90deg, {currentColor()}, {currentColor()}dd);
						box-shadow: 0 0 8px {currentColor()}40;
					"
				></div>
			</div>

			<!-- Glow effect -->
			<div 
				class="absolute inset-0 h-3 rounded-full opacity-30 blur-sm"
				style="
					background: linear-gradient(90deg, 
						transparent 0%, 
						{currentColor()}40 {percentage()}%, 
						transparent {percentage() + 5}%
					);
				"
			></div>
		</div>

		<!-- Status indicator -->
		<div class="flex items-center justify-between mt-3">
			<div class="flex items-center gap-2">
				<div 
					class="w-2 h-2 rounded-full"
					style="background-color: {currentColor()}; box-shadow: 0 0 4px {currentColor()};"
				></div>
				<span class="text-xs font-medium uppercase text-gray-400">
					{(sensorValue() || 0) >= 80 ? 'HIGH' : (sensorValue() || 0) >= 60 ? 'WARN' : 'NORMAL'}
				</span>
			</div>
			<span class="text-xs text-gray-500">
				{percentage().toFixed(0)}%
			</span>
		</div>
	</div>
</div>