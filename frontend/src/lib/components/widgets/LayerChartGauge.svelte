<!--
  LayerChartGauge.svelte
  
  Proper LayerChart integration with Cosmic UI aesthetic
  Demonstrates:
  - LayerChart for actual gauge functionality
  - Cosmic UI SVG frames for sci-fi aesthetic
  - SVG base layers for widget backgrounds
  - Maximum customizability with configurable SVG backgrounds
  - Svelte 5 runes for reactive state management
-->

<script lang="ts">
  import { Chart, Arc, Text } from 'layerchart';
  import { CosmicFrame } from '$lib/components/cosmic';
  
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

  // Props
  let { 
    value = 0,
    label = "Sensor",
    config = {
      min: 0,
      max: 100,
      warningThreshold: 70,
      criticalThreshold: 90,
      unit: "%"
    } as GaugeConfig,
    size = 200,
    theme = "gaming",
    animated = true,
    showValue = true,
    showLabel = true,
    glowEffect = true,
    svgBackground = null as SVGBackground | null
  }: {
    value?: number;
    label?: string;
    config?: GaugeConfig;
    size?: number;
    theme?: string;
    animated?: boolean;
    showValue?: boolean;
    showLabel?: boolean;
    glowEffect?: boolean;
    svgBackground?: SVGBackground | null;
  } = $props();

  // Reactive state
  let animatedValue = $state(value);
  let isAnimating = $state(false);

  // Theme-based color system
  const themeColors = $derived(() => {
    switch (theme) {
      case 'gaming':
        return {
          primary: '#00ff88',
          warning: '#ffaa00',
          critical: '#ff0080',
          background: 'rgba(0, 20, 40, 0.8)',
          text: '#00ffff'
        };
      case 'rgb':
        return {
          primary: `hsl(${240 + (120 * (value / config.max))}, 80%, 60%)`,
          warning: '#ffaa00',
          critical: '#ff0080',
          background: 'rgba(0, 20, 40, 0.8)',
          text: '#ffffff'
        };
      case 'neon':
        return {
          primary: '#00ffff',
          warning: '#ff00ff',
          critical: '#ff0080',
          background: 'rgba(0, 40, 80, 0.8)',
          text: '#00ffff'
        };
      case 'cyberpunk':
        return {
          primary: '#7c3aed',
          warning: '#fbbf24',
          critical: '#ef4444',
          background: 'rgba(20, 0, 40, 0.8)',
          text: '#fbbf24'
        };
      default:
        return {
          primary: '#3b82f6',
          warning: '#f59e0b',
          critical: '#ef4444',
          background: 'rgba(0, 20, 40, 0.8)',
          text: '#ffffff'
        };
    }
  });

  // Determine current status color
  const statusColor = $derived(() => {
    const normalizedValue = (value - config.min) / (config.max - config.min) * 100;
    if (normalizedValue >= config.criticalThreshold) return themeColors().critical;
    if (normalizedValue >= config.warningThreshold) return themeColors().warning;
    return themeColors().primary;
  });

  // Animate value changes
  $effect(() => {
    if (animated && !isAnimating) {
      isAnimating = true;
      const startValue = animatedValue;
      const targetValue = value;
      const duration = 800;
      const startTime = performance.now();
      
      function animate(currentTime: number) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Cubic ease-out function
        const easeOut = 1 - Math.pow(1 - progress, 3);
        animatedValue = startValue + (targetValue - startValue) * easeOut;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          isAnimating = false;
        }
      }
      
      requestAnimationFrame(animate);
    } else if (!animated) {
      animatedValue = value;
    }
  });

  // Gauge calculations
  const radius = $derived(size * 0.35);
  const center = $derived(size / 2);
  const normalizedValue = $derived((animatedValue - config.min) / (config.max - config.min));
  const arcAngle = $derived(normalizedValue * Math.PI * 1.5); // 270 degrees

  // Default SVG backgrounds for customization
  const defaultSVGBackgrounds: SVGBackground[] = [
    {
      id: 'cosmic-frame',
      name: 'Cosmic Frame',
      paths: [
        {
          show: true,
          style: {
            strokeWidth: "2",
            stroke: statusColor(),
            fill: "transparent"
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
        }
      ]
    },
    {
      id: 'hex-frame',
      name: 'Hexagonal Frame',
      paths: [
        {
          show: true,
          style: {
            strokeWidth: "2",
            stroke: statusColor(),
            fill: "transparent"
          },
          path: [
            ["M", "50%", "10"],
            ["L", "85%", "25%"],
            ["L", "85%", "75%"],
            ["L", "50%", "90%"],
            ["L", "15%", "75%"],
            ["L", "15%", "25%"],
            ["Z"]
          ]
        }
      ]
    },
    {
      id: 'minimal-frame',
      name: 'Minimal Frame',
      paths: [
        {
          show: true,
          style: {
            strokeWidth: "1",
            stroke: statusColor(),
            fill: "transparent"
          },
          path: [
            ["M", "10", "10"],
            ["L", "90%", "10"],
            ["L", "90%", "90%"],
            ["L", "10", "90%"],
            ["Z"]
          ]
        }
      ]
    }
  ];

  // Use provided SVG background or default
  const currentSVGBackground = $derived(svgBackground || defaultSVGBackgrounds[0]);
</script>

<div 
  class="relative gauge-container"
  style="width: {size}px; height: {size}px;"
>
  <!-- SVG Background Layer (Cosmic UI approach) -->
  {#if currentSVGBackground}
    <CosmicFrame 
      paths={currentSVGBackground.paths}
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
        endAngle={-Math.PI * 0.75 + arcAngle}
        innerRadius={radius - 20}
        outerRadius={radius}
        fill={statusColor()}
        class="transition-all duration-300"
        style={glowEffect ? `filter: drop-shadow(0 0 10px ${statusColor()}40);` : ''}
      />
      
      <!-- Center text -->
      {#if showValue}
        <Text
          x={center}
          y={center - 10}
          textAnchor="middle"
          dominantBaseline="middle"
          class="text-2xl font-bold font-orbitron"
          fill={themeColors().text}
          style={glowEffect ? `text-shadow: 0 0 10px ${themeColors().text}80;` : ''}
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
          fill={themeColors().text}
          opacity={0.8}
        >
          {label}
        </Text>
      {/if}
    </Chart>
  </div>

  <!-- Corner decorations (Cosmic UI aesthetic) -->
  <div class="absolute inset-0 pointer-events-none">
    <!-- Top-left corner -->
    <div 
      class="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2"
      style="border-color: {statusColor()}; opacity: 0.6;"
    ></div>
    
    <!-- Top-right corner -->
    <div 
      class="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2"
      style="border-color: {statusColor()}; opacity: 0.6;"
    ></div>
    
    <!-- Bottom-left corner -->
    <div 
      class="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2"
      style="border-color: {statusColor()}; opacity: 0.6;"
    ></div>
    
    <!-- Bottom-right corner -->
    <div 
      class="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2"
      style="border-color: {statusColor()}; opacity: 0.6;"
    ></div>
  </div>

  <!-- Scanning effect -->
  <div 
    class="absolute inset-0 opacity-20 pointer-events-none"
    style="background: conic-gradient(from 0deg, transparent 0deg, {statusColor()}40 35deg, transparent 70deg); animation: rotate-scan 4s linear infinite;"
  ></div>
</div>

<style>
  .gauge-container {
    transition: all 0.3s ease;
  }

  .gauge-container:hover {
    transform: scale(1.02);
  }

  @keyframes rotate-scan {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* Pulse animation for high values */
  .gauge-container:has(.arc[fill*="ff0080"]) {
    animation: pulse-glow 2s ease-in-out infinite;
  }

  @keyframes pulse-glow {
    0%, 100% { 
      filter: drop-shadow(0 0 10px rgba(255, 0, 128, 0.3));
    }
    50% { 
      filter: drop-shadow(0 0 20px rgba(255, 0, 128, 0.6));
    }
  }

  /* Responsive font sizes */
  @container (max-width: 150px) {
    .text-2xl { font-size: 1.2rem; }
    .text-sm { font-size: 0.75rem; }
  }

  @container (min-width: 250px) {
    .text-2xl { font-size: 2.2rem; }
    .text-sm { font-size: 1rem; }
  }
</style> 