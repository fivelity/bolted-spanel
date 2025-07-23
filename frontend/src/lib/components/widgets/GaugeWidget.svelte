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

	// Gauge configuration with defaults
	const gaugeConfig = {
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
		const colors = gaugeConfig.colors;
		const thresholds = gaugeConfig.thresholds;

		if (val === null || val === undefined) return colors[0];
		
		for (let i = thresholds.length - 1; i >= 0; i--) {
			if (val >= thresholds[i]) {
				return colors[i + 1] || colors[colors.length - 1];
			}
		}
		return colors[0];
	});

	// Animated value for smooth gauge transitions
	let animatedValue = $state(0);
	
	let size = 200;
	let center = size / 2;
	let strokeWidth = 8;
	
	// Calculate rotation based on value (0-100% maps to -135deg to +135deg)
	let rotation = $derived(() => {
		const maxValue = gaugeConfig.max;
		const percentage = Math.min(100, Math.max(0, (animatedValue / maxValue) * 100));
		return -135 + (percentage * 2.7); // 270 degrees total range
	});

	// Update animated value when sensor value changes
	$effect(() => {
		const targetValue = sensorValue();
		animatedValue = targetValue;
	});

	// Styling properties
	let borderRadius = 8;
	let unit = gaugeConfig.unit;
</script>

<div 
	class="gauge-widget relative h-full w-full overflow-hidden bg-gray-900/90 rounded-lg"
	style="border-radius: {borderRadius}px;"
>
	<!-- Background gradient -->
	<div class="absolute inset-0 bg-gradient-to-br from-gray-900/50 via-gray-800/30 to-gray-900/50"></div>
	
	<!-- Content -->
	<div class="relative z-10 h-full flex flex-col items-center justify-center p-4">
		<!-- Title -->
		<h3 class="text-sm font-bold mb-4 text-center tracking-wide uppercase text-gray-300">
			{config.title}
		</h3>

		<!-- SVG Gauge -->
		<div class="relative">
			<svg width={size} height={size} viewBox="0 0 {size} {size}">
				<!-- Background arc -->
				<path
					d="M 30 170 A 70 70 0 1 1 170 30"
					fill="none"
					stroke="#374151"
					stroke-width={strokeWidth}
					stroke-linecap="round"
				/>

				<!-- Value arc -->
				<path
					d="M 30 170 A 70 70 0 {rotation() > 0 ? 1 : 0} 1 {100 + 70 * Math.cos((rotation() + 90) * Math.PI / 180)} {100 + 70 * Math.sin((rotation() + 90) * Math.PI / 180)}"
					fill="none"
					stroke={currentColor()}
					stroke-width={strokeWidth}
					stroke-linecap="round"
					style="filter: drop-shadow(0 0 6px {currentColor()});"
				/>

				<!-- Center circle -->
				<circle
					cx={center}
					cy={center}
					r="4"
					fill={currentColor()}
				/>

				<!-- Value text -->
				<text
					x={center}
					y={center - 10}
					text-anchor="middle"
					class="text-2xl font-bold font-mono"
					fill={currentColor()}
				>
					{sensorValue().toFixed(1)}
				</text>

				<!-- Unit text -->
				<text
					x={center}
					y={center + 10}
					text-anchor="middle"
					class="text-xs opacity-80"
					fill="#ffffff"
				>
					{unit}
				</text>
			</svg>
		</div>

		<!-- Status -->
		<div class="flex items-center gap-2 mt-2">
			<div 
				class="w-2 h-2 rounded-full"
				style="background-color: {currentColor()}; box-shadow: 0 0 6px {currentColor()};"
			></div>
			<span class="text-xs font-medium uppercase text-gray-400">
				{(sensorValue() || 0) >= 80 ? 'HIGH' : (sensorValue() || 0) >= 60 ? 'WARN' : 'NORMAL'}
			</span>
		</div>
	</div>
</div>