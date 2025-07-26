<!--
  LayerChartGauge.svelte
  
  Optimized version with better performance:
  - Reduced reactive computations
  - Optimized animations
  - Improved SVG handling
-->

<script lang="ts">
  import { Chart, Arc, Text } from 'layerchart';
  import { CosmicFrame } from '$lib/components/cosmic';
  import { onMount, onDestroy } from 'svelte';
  
  interface GaugeConfig {
    min: number;
    max: number;
    warningThreshold: number;
    criticalThreshold: number;
    unit: string;
  }

  interface SVGBackground {
    id: string;
    name: string;
    paths: Array<{
      show: boolean;
      style: {
        strokeWidth: string;
        stroke: string;
        fill: string;
      };
      path: string[][];
    }>;
  }

  interface ThemeColors {
    primary: string;
    warning: string;
    critical: string;
    background: string;
    text: string;
  }

  type ThemeType = 'gaming' | 'rgb' | 'neon' | 'cyberpunk' | 'default' | 'minimal';

  // Theme colors map
  const themeColorMap: Record<Exclude<ThemeType, 'minimal'>, ThemeColors> = {
    gaming: {
      primary: '#00ff88',
      warning: '#ffaa00',
      critical: '#ff0080',
      background: 'rgba(0, 20, 40, 0.8)',
      text: '#00ffff'
    },
    rgb: {
      primary: '#00ff88',
      warning: '#ffaa00',
      critical: '#ff0080',
      background: 'rgba(0, 20, 40, 0.8)',
      text: '#ffffff'
    },
    neon: {
      primary: '#00ffff',
      warning: '#ff00ff',
      critical: '#ff0080',
      background: 'rgba(0, 40, 80, 0.8)',
      text: '#00ffff'
    },
    cyberpunk: {
      primary: '#7c3aed',
      warning: '#fbbf24',
      critical: '#ef4444',
      background: 'rgba(20, 0, 40, 0.8)',
      text: '#fbbf24'
    },
    default: {
      primary: '#3b82f6',
      warning: '#f59e0b',
      critical: '#ef4444',
      background: 'rgba(0, 20, 40, 0.8)',
      text: '#ffffff'
    }
  };

  // Props with defaults using Svelte 5 runes
  const props = $props<{
    value?: number;
    label?: string;
    config?: GaugeConfig;
    size?: number;
    theme?: ThemeType;
    animated?: boolean;
    showValue?: boolean;
    showLabel?: boolean;
    glowEffect?: boolean;
    svgBackground?: SVGBackground | null;
  }>();

  const value = $derived(props.value ?? 0);
  const label = $derived(props.label ?? "Sensor");
  const config = $derived(props.config ?? {
    min: 0,
    max: 100,
    warningThreshold: 70,
    criticalThreshold: 90,
    unit: "%"
  } as GaugeConfig);
  const size = $derived(props.size ?? 200);
  const theme = $derived(props.theme ?? "gaming" as ThemeType);
  const animated = $derived(props.animated ?? true);
  const showValue = $derived(props.showValue ?? true);
  const showLabel = $derived(props.showLabel ?? true);
  const glowEffect = $derived(props.glowEffect ?? true);
  const svgBackground = $derived(props.svgBackground ?? null);

  // State using Svelte 5 runes
  let animatedValue = $state(value);
  let isAnimating = $state(false);
  let animationFrame = $state<number | undefined>(undefined);
  let currentThemeColors = $state<ThemeColors>(themeColorMap['default']);
  let currentStatusColor = $state(themeColorMap['default'].primary);
  let currentArcAngle = $state(0);

  // Initialize theme colors
  $effect(() => {
    const themeKey = theme === 'minimal' ? 'default' : theme;
    currentThemeColors = themeColorMap[themeKey as keyof typeof themeColorMap];
  });

  // Cached calculations
  const radius = size * 0.35;
  const center = size / 2;

  // Effects using Svelte 5 syntax
  $effect(() => {
    const themeKey = theme === 'minimal' ? 'default' : theme;
    const baseColors = { ...themeColorMap[themeKey as keyof typeof themeColorMap] };
    if (theme === 'rgb') {
      baseColors.primary = `hsl(${240 + (120 * (value / config.max))}, 80%, 60%)`;
    }
    currentThemeColors = baseColors;
  });

  $effect(() => {
    const themeKey = theme === 'minimal' ? 'default' : theme;
    currentThemeColors = themeColorMap[themeKey as keyof typeof themeColorMap];
    
    const normalizedValue = (value - config.min) / (config.max - config.min) * 100;
    if (normalizedValue >= config.criticalThreshold) {
      currentStatusColor = currentThemeColors.critical;
    } else if (normalizedValue >= config.warningThreshold) {
      currentStatusColor = currentThemeColors.warning;
    } else {
      currentStatusColor = currentThemeColors.primary;
    }
  });

  $effect(() => {
    const normalizedValue = (animatedValue - config.min) / (config.max - config.min);
    currentArcAngle = normalizedValue * Math.PI * 1.5; // 270 degrees
  });

  // Animation function
  function startAnimation(targetValue: number) {
    if (!animated || isAnimating) return;
    
    isAnimating = true;
    const startValue = animatedValue;
    const valueChange = targetValue - startValue;
    const startTime = performance.now();
    const duration = 800;

    // Pre-calculate animation curve points
    const curvePoints = new Float32Array(100);
    for (let i = 0; i < 100; i++) {
      const t = i / 99;
      curvePoints[i] = 1 - Math.pow(1 - t, 3); // Cubic ease-out
    }

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Use pre-calculated curve
      const easeIndex = Math.floor(progress * 99);
      const easeOut = curvePoints[easeIndex];
      
      animatedValue = startValue + valueChange * easeOut;
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        isAnimating = false;
        animatedValue = targetValue;
      }
    }
    
    animationFrame = requestAnimationFrame(animate);
  }

  // Watch value changes
  $effect(() => {
    if (animated) {
      startAnimation(value);
    } else {
      animatedValue = value;
    }
  });

  // Cleanup
  onDestroy(() => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  });
</script>

<div class="gauge-container relative" style="width: {size}px; height: {size}px;">
  <!-- SVG Background Layer (Cosmic UI approach) -->
  {#if svgBackground}
    <CosmicFrame 
      paths={svgBackground.paths}
      className="absolute inset-0 z-0"
    />
  {/if}

  <!-- LayerChart Gauge (Core functionality) -->
  <div class="absolute inset-0 z-10 flex items-center justify-center">
    <Chart>
      <!-- Background arc -->
      <Arc
        startAngle={-Math.PI * 0.75}
        endAngle={Math.PI * 0.75}
        innerRadius={radius - 20}
        outerRadius={radius}
        fill="rgba(255, 255, 255, 0.1)"
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth={2}
      />
      
      <!-- Progress arc -->
      <Arc
        startAngle={-Math.PI * 0.75}
        endAngle={-Math.PI * 0.75 + currentArcAngle}
        innerRadius={radius - 20}
        outerRadius={radius}
        fill={currentStatusColor}
        class="transition-colors duration-300"
        style={glowEffect ? `filter: drop-shadow(0 0 10px ${currentStatusColor}40);` : ''}
      />
      
      <!-- Center text -->
      {#if showValue}
        <Text
          x={center}
          y={center - 10}
          textAnchor="middle"
          dominantBaseline="middle"
          class="text-2xl font-bold font-orbitron"
          fill={currentThemeColors.text}
          style={glowEffect ? `text-shadow: 0 0 10px ${currentThemeColors.text}80;` : ''}
        >
          {Math.round(animatedValue)}{config.unit}
        </Text>
      {/if}
      
      <!-- Label text -->
      {#if showLabel}
        <Text
          x={center}
          y={center + 20}
          textAnchor="middle"
          dominantBaseline="middle"
          class="text-sm font-medium"
          fill={currentThemeColors.text}
          opacity={0.8}
        >
          {label}
        </Text>
      {/if}
    </Chart>
  </div>

  <!-- Corner decorations (optimized) -->
  {#if theme !== 'minimal'}
    <div class="absolute inset-0 pointer-events-none">
      {#each ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as corner}
        <div 
          class="absolute w-3 h-3 border-2 {corner === 'top-left' ? 'top-2 left-2 border-t border-l' : 
            corner === 'top-right' ? 'top-2 right-2 border-t border-r' :
            corner === 'bottom-left' ? 'bottom-2 left-2 border-b border-l' :
            'bottom-2 right-2 border-b border-r'}"
          style="border-color: {currentStatusColor}; opacity: 0.6;"
        />
      {/each}
    </div>
  {/if}

  <!-- Scanning effect (optimized) -->
  {#if theme !== 'minimal' && value > config.warningThreshold}
    <div 
      class="absolute inset-0 opacity-20 pointer-events-none scan-effect"
      style="background: conic-gradient(from 0deg, transparent 0deg, {currentStatusColor}40 35deg, transparent 70deg);"
    />
  {/if}
</div>

<style>
  .gauge-container {
    transition: transform 0.3s ease;
  }

  .gauge-container:hover {
    transform: scale(1.02);
  }

  .scan-effect {
    animation: rotate-scan 4s linear infinite;
  }

  @keyframes rotate-scan {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* Pulse animation only when critical */
  .gauge-container:has(.arc[fill*="ff0080"]) {
    animation: pulse-glow 2s ease-in-out infinite;
  }

  @keyframes pulse-glow {
    0%, 100% { filter: drop-shadow(0 0 10px rgba(255, 0, 128, 0.3)); }
    50% { filter: drop-shadow(0 0 20px rgba(255, 0, 128, 0.6)); }
  }

  /* Responsive font sizes */
  @container (max-width: 150px) {
    .text-2xl { font-size: 1.2rem; }
    .text-sm { font-size: 0.75rem; }
  }
</style> 