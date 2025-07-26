<!--
  CosmicSensorGauge.svelte
  
  Enhanced sensor gauge using LayerChart for visualization
  with Cosmic UI SVG frame for futuristic aesthetic
  Integrated with SenseCanvas sensor data
-->

<script lang="ts">
  import { CosmicFrame } from '$lib/components/cosmic';
  import { Chart, Svg, Arc, Text, Group, Circle } from 'layerchart';
  import { onMount, onDestroy } from 'svelte';
  
  interface SensorConfig {
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
    config?: SensorConfig;
    size?: number;
    showFrame?: boolean;
    glowEffect?: boolean;
  }>();

  // Derived values from props
  const value = $derived(props.value ?? 0);
  const label = $derived(props.label ?? "Sensor");
  const config = $derived(props.config ?? {
    min: 0,
    max: 100,
    warningThreshold: 70,
    criticalThreshold: 90,
    unit: '%',
    icon: '📊'
  });
  const size = $derived(props.size ?? 280);
  const showFrame = $derived(props.showFrame ?? true);
  const glowEffect = $derived(props.glowEffect ?? true);

  // Derived calculations
  const normalizedValue = $derived(
    Math.max(0, Math.min(100, ((value - config.min) / (config.max - config.min)) * 100))
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

  // Chart dimensions
  const chartSize = size - 40; // Account for padding
  const radius = chartSize / 2 - 30;
  const innerRadius = radius - 20;

  // Angle calculations (convert degrees to radians)
  const startAngle = -135 * Math.PI / 180; // Start from bottom-left
  const endAngle = 135 * Math.PI / 180;    // End at bottom-right
  const angleRange = endAngle - startAngle;
  const valueAngle = $derived(startAngle + (angleRange * normalizedValue / 100));

  // Animation state
  let animatedValue = $state(0);
  let animatedAngle = $state(startAngle);
  let animationFrame: number;

  // Animation function
  function animateValue() {
    const diff = value - animatedValue;
    const step = diff * 0.1;
    
    if (Math.abs(diff) > 0.1) {
      animatedValue += step;
      animatedAngle = startAngle + (angleRange * ((animatedValue - config.min) / (config.max - config.min)));
      animationFrame = requestAnimationFrame(animateValue);
    } else {
      animatedValue = value;
      animatedAngle = valueAngle;
    }
  }

  onMount(() => {
    animatedValue = value;
    animateValue();
  });

  $effect(() => {
    // Trigger animation when value changes
    animateValue();
  });

  onDestroy(() => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  });
</script>

<div class="cosmic-sensor-gauge" style="width: {size}px; height: {size}px;">
  {#if showFrame}
    <CosmicFrame 
      variant="octagon" 
      strokeColor={statusColor}
      glowEffect={glowEffect}
    />
  {/if}
  
  <div class="gauge-content">
    <!-- LayerChart gauge visualization -->
    <Chart data={{ value: animatedValue }}>
      <Svg width={chartSize} height={chartSize}>
        <Group center>
          <!-- Background arc -->
          <Arc
            startAngle={startAngle}
            endAngle={endAngle}
            innerRadius={innerRadius}
            outerRadius={radius}
            fill="rgba(0, 20, 40, 0.3)"
            stroke="rgba(0, 255, 170, 0.2)"
            stroke-width={1}
            class="background-arc"
          />
          
          <!-- Segmented arc background -->
          {#each Array(20) as _, i}
            {@const segmentStart = startAngle + (angleRange * i / 20)}
            {@const segmentEnd = startAngle + (angleRange * (i + 1) / 20)}
            <Arc
              startAngle={segmentStart}
              endAngle={segmentEnd}
              innerRadius={innerRadius + 2}
              outerRadius={radius - 2}
              fill="rgba(0, 40, 80, 0.2)"
              stroke="rgba(0, 255, 170, 0.1)"
              stroke-width={0.5}
              padAngle={0.02}
              class="segment-arc"
            />
          {/each}
          
          <!-- Progress arc -->
          <Arc
            startAngle={startAngle}
            endAngle={animatedAngle}
            innerRadius={innerRadius}
            outerRadius={radius}
            fill={statusColor}
            opacity={0.8}
            class="progress-arc"
            style={glowEffect ? `filter: drop-shadow(0 0 10px ${statusGlow})` : ''}
          />
          
          <!-- Center circle decoration -->
          <Circle
            cx={0}
            cy={0}
            r={innerRadius - 10}
            fill="rgba(0, 20, 40, 0.9)"
            stroke={statusColor}
            stroke-width={2}
            opacity={0.8}
            class="center-circle"
          />
          
          <!-- Value text -->
          <Text
            x={0}
            y={-10}
            text-anchor="middle"
            dominant-baseline="middle"
            class="value-text"
            fill={statusColor}
            style={glowEffect ? `filter: drop-shadow(0 0 5px ${statusGlow})` : ''}
          >
            {Math.round(animatedValue)}
          </Text>
          
          <!-- Unit text -->
          <Text
            x={0}
            y={15}
            text-anchor="middle"
            dominant-baseline="middle"
            class="unit-text"
            fill={statusColor}
          >
            {config.unit}
          </Text>
        </Group>
      </Svg>
    </Chart>
    
    <!-- Label -->
    <div class="gauge-label">
      <span class="icon">{config.icon}</span>
      <span class="label-text">{label}</span>
    </div>
    
    <!-- Status indicator -->
    <div class="status-indicators">
      <div 
        class="status-dot" 
        style="background-color: {statusColor}; box-shadow: 0 0 10px {statusGlow};"
      />
      <div class="status-bar">
        <div 
          class="status-bar-fill" 
          style="width: {normalizedValue}%; background: linear-gradient(90deg, {statusColor}, {statusColor}80);"
        />
      </div>
    </div>
  </div>
</div>

<style>
  .cosmic-sensor-gauge {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .gauge-content {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }

  /* LayerChart text styles */
  :global(.cosmic-sensor-gauge .value-text) {
    font-family: 'Orbitron', monospace;
    font-size: 2rem;
    font-weight: 700;
  }

  :global(.cosmic-sensor-gauge .unit-text) {
    font-family: 'Orbitron', monospace;
    font-size: 0.875rem;
    font-weight: 300;
    opacity: 0.7;
  }

  /* Arc styles */
  :global(.cosmic-sensor-gauge .background-arc) {
    transition: opacity 0.3s ease;
  }

  :global(.cosmic-sensor-gauge .progress-arc) {
    transition: all 0.3s ease-out;
  }

  :global(.cosmic-sensor-gauge .segment-arc) {
    opacity: 0.5;
    transition: opacity 0.2s ease;
  }

  :global(.cosmic-sensor-gauge .center-circle) {
    transition: stroke 0.3s ease;
  }

  .gauge-label {
    position: absolute;
    bottom: 20px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(0, 20, 40, 0.8);
    border: 1px solid rgba(0, 255, 170, 0.3);
    border-radius: 9999px;
    backdrop-filter: blur(10px);
  }

  .icon {
    font-size: 1.2rem;
  }

  .label-text {
    font-family: 'Orbitron', monospace;
    font-size: 0.9rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .status-indicators {
    position: absolute;
    top: 20px;
    right: 20px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  .status-bar {
    width: 40px;
    height: 4px;
    background: rgba(0, 20, 40, 0.5);
    border-radius: 2px;
    overflow: hidden;
  }

  .status-bar-fill {
    height: 100%;
    transition: width 0.3s ease-out;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.6;
      transform: scale(1.2);
    }
  }

  /* Font imports */
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@300;400;500;700;900&display=swap');
</style>