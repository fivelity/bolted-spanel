<!--
  CosmicKPICard.svelte
  
  KPI card widget displaying multiple system metrics
  Perfect for system overview and key performance indicators
-->

<script lang="ts">
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { CosmicFrame } from '$lib/components/cosmic';
  
  interface KPIMetric {
    label: string;
    value: number;
    unit: string;
    icon: string;
    threshold: {
      warning: number;
      critical: number;
    };
  }

  interface KPIConfig {
    title: string;
    metrics: KPIMetric[];
  }

  // Props
  let { 
    config = {
      title: "System Overview",
      metrics: [
        { label: "CPU", value: 65, unit: "%", icon: "🔥", threshold: { warning: 70, critical: 90 } },
        { label: "Memory", value: 74, unit: "%", icon: "💾", threshold: { warning: 75, critical: 90 } },
        { label: "GPU", value: 82, unit: "%", icon: "⚡", threshold: { warning: 80, critical: 95 } },
        { label: "Temp", value: 68, unit: "°C", icon: "🌡️", threshold: { warning: 70, critical: 85 } }
      ]
    } as KPIConfig,
    width = 320,
    height = 200,
    showFrame = true,
    glowEffect = true
  }: {
    config?: KPIConfig;
    width?: number;
    height?: number;
    showFrame?: boolean;
    glowEffect?: boolean;
  } = $props();

  // Animated values for smooth transitions
  let animatedValues = $state(config.metrics.map(() => 0));

  // Update animated values when data changes
  $effect(() => {
    config.metrics.forEach((metric, index) => {
      // Animate to new value
      const startValue = animatedValues[index];
      const targetValue = metric.value;
      const duration = 1200;
      const startTime = performance.now();
      
      function animate(currentTime: number) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Cubic ease-out function
        const easeOut = 1 - Math.pow(1 - progress, 3);
        animatedValues[index] = startValue + (targetValue - startValue) * easeOut;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      }
      
      requestAnimationFrame(animate);
    });
  });

  // Calculate overall system status
  const systemStatus = $derived(() => {
    const criticalCount = config.metrics.filter(m => m.value >= m.threshold.critical).length;
    const warningCount = config.metrics.filter(m => m.value >= m.threshold.warning).length;
    
    if (criticalCount > 0) return { level: 'critical', color: '#ff0080', text: 'CRITICAL' };
    if (warningCount > 0) return { level: 'warning', color: '#ffaa00', text: 'WARNING' };
    return { level: 'normal', color: '#00ffaa', text: 'OPTIMAL' };
  });

  // Frame paths for KPI card
  const cardFramePaths = $derived([
    {
      show: true,
      style: {
        strokeWidth: "1",
        stroke: "rgba(0, 255, 255, 0.3)",
        fill: "rgba(0, 20, 40, 0.8)"
      },
      path: [
        ["M", "20", "20"],
        ["L", "80%", "20"],
        ["L", "100%-20", "35"],
        ["L", "100%-20", "80%"],
        ["L", "85%", "100%-20"],
        ["L", "20", "100%-20"],
        ["L", "20", "20"]
      ]
    },
    {
      show: showFrame,
      style: {
        strokeWidth: "2",
        stroke: systemStatus().color,
        fill: "transparent"
      },
      path: [
        ["M", "15", "15"],
        ["L", "85%", "15"],
        ["L", "100%-15", "30"],
        ["L", "100%-15", "85%"],
        ["L", "85%", "100%-15"],
        ["L", "15", "100%-15"],
        ["L", "15", "15"]
      ]
    }
  ]);

  // Get status color for individual metrics
  const getMetricStatus = (metric: KPIMetric) => {
    if (metric.value >= metric.threshold.critical) return { color: '#ff0080', level: 'critical' };
    if (metric.value >= metric.threshold.warning) return { color: '#ffaa00', level: 'warning' };
    return { color: '#00ffaa', level: 'normal' };
  };
</script>

<!-- KPI Card Container -->
<div 
  class="relative inline-block kpi-container"
  style="width: {width}px; height: {height}px;"
>
  <!-- Cosmic UI Frame -->
  {#if showFrame}
    <CosmicFrame 
      paths={cardFramePaths}
      className="kpi-frame"
      style="filter: {glowEffect ? `drop-shadow(0 0 20px ${systemStatus().color}40)` : 'none'}"
    />
  {/if}

  <!-- Main Content -->
  <div class="absolute inset-6 flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-orbitron font-bold text-white tracking-wide">{config.title}</h3>
      <div class="flex items-center gap-2">
        <div class="status-indicator w-3 h-3 rounded-full {systemStatus().level === 'critical' ? 'bg-red-400 critical-pulse' : systemStatus().level === 'warning' ? 'bg-yellow-400 warning-pulse' : 'bg-green-400 normal-pulse'}"></div>
        <span class="text-xs font-orbitron text-cyan-300 opacity-80">{systemStatus().text}</span>
      </div>
    </div>

    <!-- Metrics Grid -->
    <div class="grid grid-cols-2 gap-4 flex-1">
      {#each config.metrics as metric, index}
        {@const status = getMetricStatus(metric)}
        <div class="metric-item bg-gray-900/50 rounded-lg p-3 border border-cyan-900/30 hover:border-cyan-600/50 transition-all duration-300">
          <!-- Metric Header -->
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="text-sm">{metric.icon}</span>
              <span class="text-xs font-orbitron text-cyan-200">{metric.label}</span>
            </div>
            <div class="w-2 h-2 rounded-full" style="background-color: {status.color}; box-shadow: 0 0 6px {status.color};"></div>
          </div>

          <!-- Value Display -->
          <div class="flex items-baseline gap-1">
            <span class="text-xl font-bold font-orbitron" style="color: {status.color};">
              {Math.round(animatedValues[index])}
            </span>
            <span class="text-xs text-cyan-400 opacity-80">{metric.unit}</span>
          </div>

          <!-- Mini Progress Bar -->
          <div class="mt-2 w-full h-1 bg-gray-800 rounded-full overflow-hidden">
            <div 
              class="h-full rounded-full transition-all duration-1000 ease-out"
              style="width: {metric.value}%; background: linear-gradient(90deg, {status.color}, {status.color}80);"
            ></div>
          </div>

          <!-- Threshold Indicators -->
          <div class="flex justify-between mt-1 text-xs font-mono text-gray-500">
            <span>0</span>
            <span class="text-yellow-400" title="Warning: {metric.threshold.warning}{metric.unit}">⚠</span>
            <span class="text-red-400" title="Critical: {metric.threshold.critical}{metric.unit}">🚨</span>
            <span>100</span>
          </div>
        </div>
      {/each}
    </div>

    <!-- System Summary -->
    <div class="mt-4 pt-3 border-t border-cyan-900/30">
      <div class="flex items-center justify-between text-xs">
        <div class="flex items-center gap-4">
          <span class="text-cyan-400 font-orbitron">SYSTEM STATUS</span>
          <span class="text-gray-400">Last Update: {new Date().toLocaleTimeString()}</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-1 h-1 bg-cyan-400 rounded-full animate-pulse"></div>
          <span class="text-cyan-300 font-orbitron">MONITORING</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Background Grid Pattern -->
  <div class="absolute inset-0 opacity-5 pointer-events-none">
    <svg width="100%" height="100%">
      <defs>
        <pattern id="kpi-grid-{width}" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0, 255, 255, 0.3)" stroke-width="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#kpi-grid-{width})"/>
    </svg>
  </div>
</div>

<style>
  .kpi-container {
    transition: transform 0.3s ease;
  }

  .kpi-container:hover {
    transform: scale(1.01);
  }

  .kpi-frame {
    transition: filter 0.3s ease;
  }

  .metric-item {
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
  }

  .metric-item:hover {
    background: rgba(0, 40, 80, 0.3);
    transform: translateY(-1px);
  }

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
    .kpi-container {
      transform: scale(0.95);
    }
    
    .grid {
      grid-template-columns: 1fr;
      gap: 2rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .kpi-container,
    .kpi-frame,
    .metric-item,
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
