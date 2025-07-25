<!--
  CosmicLinearMeter.svelte
  
  Linear meter widget with futuristic styling
  Perfect for memory usage, disk space, and other linear metrics
-->

<script lang="ts">
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { CosmicFrame } from '$lib/components/cosmic';
  
  interface MeterConfig {
    min: number;
    max: number;
    warningThreshold: number;
    criticalThreshold: number;
    unit: string;
    icon?: string;
  }

  // Props
  let { 
    value = 0,
    label = "Metric",
    config = {
      min: 0,
      max: 100,
      warningThreshold: 70,
      criticalThreshold: 90,
      unit: "%",
      icon: "📊"
    } as MeterConfig,
    width = 300,
    height = 120,
    showFrame = true,
    glowEffect = true
  }: {
    value: number;
    label: string;
    config?: MeterConfig;
    width?: number;
    height?: number;
    showFrame?: boolean;
    glowEffect?: boolean;
  } = $props();

  // Animated value for smooth transitions
  const animatedValue = tweened(0, {
    duration: 1000,
    easing: cubicOut
  });

  // Update animated value when data changes
  $effect(() => {
    animatedValue.set(value);
  });

  // Meter calculations
  const normalizedValue = $derived(
    Math.max(0, Math.min(100, ((value - config.min) / (config.max - config.min)) * 100))
  );

  // Status-based colors
  const statusColor = $derived(() => {
    if (value >= config.criticalThreshold) return '#ff0080';
    if (value >= config.warningThreshold) return '#ffaa00';
    return '#00ffaa';
  });

  const statusGlow = $derived(() => {
    if (value >= config.criticalThreshold) return '#ff008040';
    if (value >= config.warningThreshold) return '#ffaa0040';
    return '#00ffaa40';
  });

  // Frame paths for linear meter
  const meterFramePaths = $derived([
    {
      show: true,
      style: {
        strokeWidth: "1",
        stroke: "rgba(0, 255, 255, 0.3)",
        fill: "rgba(0, 20, 40, 0.8)"
      },
      path: [
        ["M", "15", "15"],
        ["L", "85%", "15"],
        ["L", "100%-15", "25"],
        ["L", "100%-15", "85%"],
        ["L", "85%", "100%-15"],
        ["L", "15", "100%-15"],
        ["L", "15", "15"]
      ]
    },
    {
      show: showFrame,
      style: {
        strokeWidth: "2",
        stroke: statusColor(),
        fill: "transparent"
      },
      path: [
        ["M", "10", "10"],
        ["L", "90%", "10"],
        ["L", "100%-10", "20"],
        ["L", "100%-10", "90%"],
        ["L", "90%", "100%-10"],
        ["L", "10", "100%-10"],
        ["L", "10", "10"]
      ]
    }
  ]);

  // Create segmented meter bars
  const segments = 20;
  const segmentWidth = $derived((width - 80) / segments);
  const segmentGap = 2;

  const createSegmentedMeter = $derived(() => {
    const activeSegments = Math.floor((normalizedValue / 100) * segments);
    const segmentBars = [];
    
    for (let i = 0; i < segments; i++) {
      const x = 40 + (i * (segmentWidth + segmentGap));
      const isActive = i < activeSegments;
      const opacity = isActive ? 1 : 0.2;
      const fillColor = isActive ? statusColor() : '#ffffff';
      
      segmentBars.push({
        x,
        width: segmentWidth - segmentGap,
        opacity,
        fillColor,
        isActive
      });
    }
    
    return segmentBars;
  });
</script>

<!-- Linear Meter Container -->
<div 
  class="relative inline-block meter-container"
  style="width: {width}px; height: {height}px;"
>
  <!-- Cosmic UI Frame -->
  {#if showFrame}
    <CosmicFrame 
      paths={meterFramePaths}
      className="meter-frame"
      style="filter: {glowEffect ? `drop-shadow(0 0 15px ${statusGlow()})` : 'none'}"
    />
  {/if}

  <!-- Main Content -->
  <div class="absolute inset-4 flex flex-col justify-between p-4">
    <!-- Header with label and value -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        {#if config.icon}
          <span class="text-lg">{config.icon}</span>
        {/if}
        <span class="text-sm font-orbitron text-cyan-200 tracking-wide">{label}</span>
      </div>
      <div class="text-right">
        <div class="text-xl font-bold font-orbitron text-white">
          {Math.round($animatedValue)}<span class="text-sm text-cyan-400 ml-1">{config.unit}</span>
        </div>
        <div class="text-xs font-orbitron text-cyan-300 opacity-80">
          {value >= config.criticalThreshold ? 'CRITICAL' : value >= config.warningThreshold ? 'WARNING' : 'NORMAL'}
        </div>
      </div>
    </div>

    <!-- Meter Bar -->
    <div class="relative">
      <!-- Background track -->
      <div class="w-full h-6 bg-gray-800 rounded-full overflow-hidden border border-cyan-900">
        <!-- Grid pattern overlay -->
        <div class="absolute inset-0 opacity-20" style="background-image: repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(0, 255, 255, 0.1) 10px, rgba(0, 255, 255, 0.1) 11px);"></div>
        
        <!-- Segmented meter bars -->
        <svg width="100%" height="100%" class="absolute inset-0">
          {#each createSegmentedMeter() as segment}
            <rect
              x={segment.x}
              y="4"
              width={segment.width}
              height="16"
              fill={segment.fillColor}
              opacity={segment.opacity}
              rx="2"
              class="meter-segment transition-all duration-300"
              style="filter: {segment.isActive && glowEffect ? `drop-shadow(0 0 4px ${segment.fillColor})` : 'none'}"
            />
          {/each}
        </svg>

        <!-- Animated fill bar -->
        <div 
          class="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
          style="width: {normalizedValue}%; background: linear-gradient(90deg, {statusColor()}, {statusColor()}80);"
        >
          <!-- Scanning line effect -->
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 w-8 animate-scan"></div>
        </div>
      </div>

      <!-- Threshold markers -->
      <div class="absolute -bottom-2 left-0 right-0 flex justify-between text-xs font-mono text-cyan-400 opacity-60">
        <span>0</span>
        <span style="position: absolute; left: {config.warningThreshold}%;" class="transform -translate-x-1/2">
          {config.warningThreshold}
        </span>
        <span style="position: absolute; left: {config.criticalThreshold}%;" class="transform -translate-x-1/2">
          {config.criticalThreshold}
        </span>
        <span>100</span>
      </div>
    </div>

    <!-- Status indicator -->
    <div class="absolute top-2 right-2">
      <div class="status-indicator w-2 h-2 rounded-full {value >= config.criticalThreshold ? 'bg-red-400 critical-pulse' : value >= config.warningThreshold ? 'bg-yellow-400 warning-pulse' : 'bg-green-400 normal-pulse'}"></div>
    </div>
  </div>
</div>

<style>
  .meter-container {
    transition: transform 0.3s ease;
  }

  .meter-container:hover {
    transform: scale(1.02);
  }

  .meter-frame {
    transition: filter 0.3s ease;
  }

  .meter-segment {
    transition: all 0.3s ease;
  }

  .status-indicator {
    transition: all 0.3s ease;
  }

  .critical-pulse {
    animation: critical-pulse 1s ease-in-out infinite;
    box-shadow: 0 0 8px #ff0080;
  }

  .warning-pulse {
    animation: warning-pulse 2s ease-in-out infinite;
    box-shadow: 0 0 6px #ffaa00;
  }

  .normal-pulse {
    animation: normal-pulse 3s ease-in-out infinite;
    box-shadow: 0 0 4px #00ffaa;
  }

  @keyframes critical-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(1.1); }
  }

  @keyframes warning-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.05); }
  }

  @keyframes normal-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }

  @keyframes scan {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(400%); }
  }

  .animate-scan {
    animation: scan 3s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .meter-container,
    .meter-frame,
    .meter-segment,
    .status-indicator {
      transition: none;
    }
    
    .critical-pulse,
    .warning-pulse,
    .normal-pulse,
    .animate-scan {
      animation: none;
    }
  }
</style>
