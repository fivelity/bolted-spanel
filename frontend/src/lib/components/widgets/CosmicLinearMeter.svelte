<!--
  CosmicLinearMeter.svelte
  
  Linear meter widget with futuristic styling
  Perfect for memory usage, disk space, and other linear metrics
-->

<script lang="ts">
  import { Chart, Rect, Text } from 'layerchart';
  import { CosmicFrame } from '$lib/components/cosmic';
  import { onMount } from 'svelte';
  
  interface MeterConfig {
    min: number;
    max: number;
    warningThreshold: number;
    criticalThreshold: number;
    unit: string;
    icon?: string;
  }

  // Props with Svelte 5 runes
  const props = $props<{
    value?: number;
    label?: string;
    config?: MeterConfig;
    width?: number;
    height?: number;
    showFrame?: boolean;
    glowEffect?: boolean;
  }>();

  // Derived values from props
  const value = $derived(props.value ?? 0);
  const label = $derived(props.label ?? "Meter");
  const config = $derived(props.config ?? {
    min: 0,
    max: 100,
    warningThreshold: 70,
    criticalThreshold: 90,
    unit: "%",
    icon: "📊"
  });
  const width = $derived(props.width ?? 320);
  const height = $derived(props.height ?? 140);
  const showFrame = $derived(props.showFrame ?? true);
  const glowEffect = $derived(props.glowEffect ?? true);

  // State
  let animatedValue = $state(0);

  // Meter calculations
  const normalizedValue = $derived(
    Math.max(0, Math.min(100, ((value - config.min) / (config.max - config.min)) * 100))
  );

  // Animated normalized value
  const animatedNormalizedValue = $derived(
    Math.max(0, Math.min(100, ((animatedValue - config.min) / (config.max - config.min)) * 100))
  );

  // Status-based colors  
  const statusColor = $derived(
    value >= config.criticalThreshold ? '#ff0080' : // Bright red
    value >= config.warningThreshold ? '#ffaa00' : // Orange  
    '#00ffaa' // Cyan green
  );

  const statusGlow = $derived(
    value >= config.criticalThreshold ? '#ff008040' :
    value >= config.warningThreshold ? '#ffaa0040' :
    '#00ffaa40'
  );

  // Frame configuration  
  const frameConfig = $derived({
    width: width,
    height: height,
    padding: 15
  });

  // Bar dimensions
  const barWidth = $derived(frameConfig.width - frameConfig.padding * 4);
  const barHeight = $derived(frameConfig.height * 0.3);

  // Enhanced frame paths with futuristic styling
  const meterFramePaths = $derived([
    {
      show: true,
      style: {
        strokeWidth: "1",
        stroke: "rgba(0, 255, 255, 0.3)",
        fill: "rgba(0, 20, 40, 0.8)"
      },
      path: [
        ["M", "10", "10"],
        ["L", "95%", "10"],
        ["L", "100%-10", "20"],
        ["L", "100%-10", "80%"],
        ["L", "95%", "100%-10"],
        ["L", "10", "100%-10"],
        ["L", "10", "10"]
      ]
    },
    {
      show: showFrame,
      style: {
        strokeWidth: "2",
        stroke: statusColor,
        fill: "transparent"
      },
      path: [
        ["M", "5", "5"],
        ["L", "95%", "5"],
        ["L", "100%-5", "15"],
        ["L", "100%-5", "85%"],
        ["L", "95%", "100%-5"],
        ["L", "5", "100%-5"],
        ["L", "5", "5"]
      ]
    }
  ]);

  // Animation effect
  onMount(() => {
    animatedValue = value;
  });

  $effect(() => {
    const duration = 800;
    const startValue = animatedValue;
    const targetValue = value;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Cubic easing
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      animatedValue = startValue + (targetValue - startValue) * easeProgress;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }
    
    requestAnimationFrame(animate);
  });
</script>

<div 
  class="relative inline-block meter-container"
  style="width: {width}px; height: {height}px;"
>
  <!-- Cosmic UI Frame with enhanced glow -->
  {#if showFrame}
    <CosmicFrame 
      paths={meterFramePaths}
      className="meter-frame"
      style="filter: {glowEffect ? `drop-shadow(0 0 20px ${statusGlow}) drop-shadow(0 0 40px ${statusGlow})` : 'none'}"
    />
  {/if}

  <!-- Main Meter using LayerChart -->
  <div class="absolute inset-6 flex items-center justify-center">
    <Chart>
      <!-- Background bar -->
      <Rect
        x={0}
        y={height * 0.3}
        width={width * 0.8}
        height={height * 0.2}
        fill="rgba(255, 255, 255, 0.1)"
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth={2}
        rx={4}
      />
      
      <!-- Progress bar -->
      <Rect
        x={0}
        y={height * 0.3}
        width={width * 0.8 * (normalizedValue / 100)}
        height={height * 0.2}
        fill={statusColor}
        rx={4}
        class="transition-colors duration-300"
        style={glowEffect ? `filter: drop-shadow(0 0 10px ${statusColor}40);` : ''}
      />
      
      <!-- Value text -->
      <Text
        x={width * 0.4}
        y={height * 0.4}
        textAnchor="middle"
        dominantBaseline="middle"
        class="text-2xl font-bold font-orbitron"
        fill={statusColor}
        style={glowEffect ? `text-shadow: 0 0 10px ${statusColor}80;` : ''}
      >
        {Math.round(animatedValue)}
      </Text>
      
      <!-- Unit text -->
      <Text
        x={width * 0.4}
        y={height * 0.6}
        textAnchor="middle"
        dominantBaseline="middle"
        class="text-sm font-medium"
        fill={statusColor}
        opacity={0.8}
      >
        {config.unit}
      </Text>
    </Chart>
  </div>

  <!-- Label with icon -->
  <div class="absolute bottom-4 left-0 right-0 text-center">
    <div class="text-sm font-medium text-cyan-200 flex items-center justify-center gap-2 font-orbitron">
      {#if config.icon}
        <span class="text-lg">{config.icon}</span>
      {/if}
      <span class="tracking-wide">{label}</span>
    </div>
  </div>
  
  <!-- Status indicator -->
  <div class="absolute top-4 right-4 flex items-center gap-2">
    <div class="status-indicator w-3 h-3 rounded-full {value >= config.criticalThreshold ? 'bg-red-400 critical-pulse' : value >= config.warningThreshold ? 'bg-yellow-400 warning-pulse' : 'bg-green-400 normal-pulse'}"></div>
    <div class="text-xs font-orbitron text-cyan-300 opacity-80">
      {value >= config.criticalThreshold ? 'CRITICAL' : value >= config.warningThreshold ? 'WARNING' : 'NORMAL'}
    </div>
  </div>

  <!-- Performance scale -->
  <div class="absolute bottom-12 left-4 right-4">
    <div class="flex justify-between text-xs font-mono text-cyan-400 opacity-60">
      <span>{config.min}</span>
      <span>{Math.round((config.max - config.min) / 2)}</span>
      <span>{config.max}</span>
    </div>
    <div class="w-full h-1 bg-gray-800 rounded-full mt-1 overflow-hidden">
      <div 
        class="h-full rounded-full transition-all duration-1000 ease-out"
        style="width: {normalizedValue}%; background: linear-gradient(90deg, {statusColor()}, {statusColor()}80);"
      ></div>
    </div>
  </div>
</div>

<style>
  .meter-container {
    position: relative;
    transition: transform 0.3s ease;
  }

  .meter-container:hover {
    transform: scale(1.02);
  }

  .meter-frame {
    transition: filter 0.3s ease;
  }

  /* Status indicator animations */
  .status-indicator {
    transition: all 0.3s ease;
  }

  .critical-pulse {
    animation: critical-pulse 1s ease-in-out infinite;
    box-shadow: 0 0 10px #ff0080;
  }

  .warning-pulse {
    animation: warning-pulse 2s ease-in-out infinite;
    box-shadow: 0 0 8px #ffaa00;
  }

  .normal-pulse {
    animation: normal-pulse 3s ease-in-out infinite;
    box-shadow: 0 0 6px #00ffaa;
  }

  @keyframes critical-pulse {
    0%, 100% { 
      opacity: 1; 
      transform: scale(1);
    }
    50% { 
      opacity: 0.6; 
      transform: scale(1.2);
    }
  }

  @keyframes warning-pulse {
    0%, 100% { 
      opacity: 1; 
      transform: scale(1);
    }
    50% { 
      opacity: 0.7; 
      transform: scale(1.1);
    }
  }

  @keyframes normal-pulse {
    0%, 100% { 
      opacity: 1; 
    }
    50% { 
      opacity: 0.8; 
    }
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .meter-container {
      transform: scale(0.9);
    }
  }

  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    .meter-container,
    .meter-frame,
    .status-indicator {
      transition: none;
    }
    
    .critical-pulse,
    .warning-pulse,
    .normal-pulse {
      animation: none;
    }
  }
</style>
