<!--
  LayerChartGauge.svelte
  
  LayerChart-based gauge component following the official documentation
  Demonstrates:
  - Proper LayerChart component imports and usage
  - Theme-aware styling using LayerChart's design system
  - Real-time value updates with smooth animations
  - Integration with existing project theme system
-->

<script lang="ts">
  import { Chart, Arc, Text } from 'layerchart';
  
  interface GaugeConfig {
    min: number;
    max: number;
    warningThreshold: number;
    criticalThreshold: number;
    unit: string;
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
    },
    size = 200,
    theme = "dark",
    animated = true,
    showValue = true,
    showLabel = true,
    glowEffect = true
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
  } = $props();

  // Animated value for smooth transitions
  let displayValue = $state(0);
  
  // Update animated value when value prop changes
  $effect(() => {
    if (animated) {
      // Simulate smooth animation
      const startValue = displayValue;
      const targetValue = value;
      const duration = 800;
      const startTime = performance.now();
      
      function animate(currentTime: number) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Cubic ease-out function
        const easeOut = 1 - Math.pow(1 - progress, 3);
        displayValue = startValue + (targetValue - startValue) * easeOut;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      }
      
      requestAnimationFrame(animate);
    } else {
      displayValue = value;
    }
  });
  
  // Calculate normalized value (0-1)
  let normalizedValue = $derived(() => {
    const clamped = Math.max(config.min, Math.min(config.max, displayValue));
    return (clamped - config.min) / (config.max - config.min);
  });
  
  // Calculate gauge colors based on value and theme
  let gaugeColors = $derived(() => {
    const normalized = normalizedValue();
    const warningNorm = (config.warningThreshold - config.min) / (config.max - config.min);
    const criticalNorm = (config.criticalThreshold - config.min) / (config.max - config.min);
    
    if (normalized >= criticalNorm) {
      return theme === 'rgb' ? '#ff0066' : '#ff4444';
    } else if (normalized >= warningNorm) {
      return theme === 'rgb' ? '#ffaa00' : '#ffa500';
    } else {
      switch (theme) {
        case 'gaming': return '#00ff88';
        case 'rgb': return '#00ff66';
        case 'dark': return '#00ffff';
        default: return '#0066cc';
      }
    }
  });
  
  // Background color for the gauge
  let backgroundColor = $derived(() => {
    switch (theme) {
      case 'gaming': return '#001d3d20';
      case 'rgb': return '#16172240';
      case 'dark': return '#1a1a1a40';
      default: return '#f8f9fa40';
    }
  });
  
  // Chart data for LayerChart
  let chartData = $derived(() => [
    { value: normalizedValue(), color: gaugeColors() },
    { value: 1 - normalizedValue(), color: backgroundColor() }
  ]);
  
  // Arc configuration
  let arcConfig = $derived(() => ({
    startAngle: -225 * (Math.PI / 180), // -225 degrees
    endAngle: 45 * (Math.PI / 180),     // 45 degrees
    innerRadius: size * 0.3,
    outerRadius: size * 0.4
  }));
</script>

<div 
  class="relative flex items-center justify-center" 
  class:glow-effect={glowEffect}
  style={`width: ${size}px; height: ${size}px;`}
  data-theme={theme}
>
  <!-- LayerChart Chart Container -->
  <Chart 
    width={size} 
    height={size}
    data={chartData()}
    class="w-full h-full"
  >
    <!-- Background Arc -->
    <Arc
      startAngle={arcConfig().startAngle}
      endAngle={arcConfig().endAngle}
      innerRadius={arcConfig().innerRadius}
      outerRadius={arcConfig().outerRadius}
      fill={backgroundColor()}
      opacity={0.3}
    />
    
    <!-- Value Arc -->
    <Arc
      startAngle={arcConfig().startAngle}
      endAngle={arcConfig().startAngle + (arcConfig().endAngle - arcConfig().startAngle) * normalizedValue()}
      innerRadius={arcConfig().innerRadius}
      outerRadius={arcConfig().outerRadius}
      fill={gaugeColors()}
      class="value-arc"
    />
    
    <!-- Center Value Display -->
    {#if showValue}
      <Text
        x={size / 2}
        y={size / 2 - 10}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={gaugeColors()}
        fontSize={size * 0.15}
        fontWeight="bold"
        fontFamily="monospace"
        class="value-text"
      >
        {Math.round(displayValue)}
      </Text>
      
      <Text
        x={size / 2}
        y={size / 2 + 15}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={theme === 'dark' ? '#999' : '#666'}
        fontSize={size * 0.08}
        fontFamily="monospace"
        class="unit-text"
      >
        {config.unit}
      </Text>
    {/if}
    
    <!-- Label -->
    {#if showLabel}
      <Text
        x={size / 2}
        y={size * 0.85}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={theme === 'dark' ? '#ccc' : '#666'}
        fontSize={size * 0.1}
        fontWeight="500"
        class="label-text"
      >
        {label}
      </Text>
    {/if}
  </Chart>
  
  <!-- Gaming-style corner brackets -->
  {#if theme === 'gaming' || theme === 'rgb'}
    <div class="corner-brackets">
      <div class="bracket top-left"></div>
      <div class="bracket top-right"></div>
      <div class="bracket bottom-left"></div>
      <div class="bracket bottom-right"></div>
    </div>
  {/if}
  
  <!-- Pulse effect for high values -->
  {#if normalizedValue() > 0.8 && animated}
    <div class="pulse-overlay" style={`background: radial-gradient(circle, ${gaugeColors()}20 0%, transparent 70%);`}></div>
  {/if}
</div>

<style>
  .value-arc {
    transition: all 0.5s ease-in-out;
  }
  
  .value-text {
    text-shadow: 0 0 10px currentColor;
  }
  
  /* Corner brackets for gaming themes */
  .corner-brackets {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    pointer-events: none;
  }
  
  .bracket {
    position: absolute;
    width: 1rem;
    height: 1rem;
    border-color: currentColor;
    opacity: 0.6;
  }
  
  .bracket.top-left {
    top: 0.5rem;
    left: 0.5rem;
    border-top: 2px solid;
    border-left: 2px solid;
  }
  
  .bracket.top-right {
    top: 0.5rem;
    right: 0.5rem;
    border-top: 2px solid;
    border-right: 2px solid;
  }
  
  .bracket.bottom-left {
    bottom: 0.5rem;
    left: 0.5rem;
    border-bottom: 2px solid;
    border-left: 2px solid;
  }
  
  .bracket.bottom-right {
    bottom: 0.5rem;
    right: 0.5rem;
    border-bottom: 2px solid;
    border-right: 2px solid;
  }
  
  /* Pulse overlay for high values */
  .pulse-overlay {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    border-radius: 50%;
    pointer-events: none;
    animation: pulse-glow 2s ease-in-out infinite;
  }
  
  @keyframes pulse-glow {
    0%, 100% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(1.1); }
  }
  
  /* High contrast mode */
  @media (prefers-contrast: high) {
    .value-text {
      text-shadow: none;
      font-weight: 900;
    }
  }
  
  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .value-arc,
    .pulse-overlay {
      animation: none;
      transition: none;
    }
  }
</style> 