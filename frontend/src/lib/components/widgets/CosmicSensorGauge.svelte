<!--
  CosmicSensorGauge.svelte
  
  Enhanced sensor gauge with futuristic segmented arc design
  Integrated with SenseCanvas sensor data and Cosmic UI aesthetic
-->

<script lang="ts">
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { CosmicFrame } from '$lib/components/cosmic';
  
  interface SensorConfig {
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
    label = "Sensor",
    config = {
      min: 0,
      max: 100,
      warningThreshold: 70,
      criticalThreshold: 90,
      unit: "%",
      icon: "🔥"
    } as SensorConfig,
    size = 200,
    showFrame = true,
    glowEffect = true
  }: {
    value: number;
    label: string;
    config?: SensorConfig;
    size?: number;
    showFrame?: boolean;
    glowEffect?: boolean;
  } = $props();

  // Animated value for smooth transitions
  const animatedValue = tweened(0, {
    duration: 1200,
    easing: cubicOut
  });

  // Update animated value when sensor data changes
  $effect(() => {
    animatedValue.set(value);
  });

  // Gauge calculations
  const normalizedValue = $derived(
    Math.max(0, Math.min(100, ((value - config.min) / (config.max - config.min)) * 100))
  );
  
  const totalAngle = 270; // Total arc span
  const startAngle = -135; // Starting angle
  const valueAngle = $derived((normalizedValue / 100) * totalAngle + startAngle);
  const radius = $derived(size * 0.32);
  const centerX = $derived(size / 2);
  const centerY = $derived(size / 2);

  // Status-based colors with enhanced palette
  const statusColor = $derived(() => {
    if (value >= config.criticalThreshold) return '#ff0080'; // Bright red
    if (value >= config.warningThreshold) return '#ffaa00'; // Orange
    return '#00ffaa'; // Cyan green
  });

  const statusGlow = $derived(() => {
    if (value >= config.criticalThreshold) return '#ff008040';
    if (value >= config.warningThreshold) return '#ffaa0040';
    return '#00ffaa40';
  });

  // Enhanced segmented arc with better spacing and visual hierarchy
  const segments = 24; // Increased segments for smoother appearance
  const segmentAngle = totalAngle / segments;
  const segmentGap = 3; // Optimized gap for better visual separation
  const innerRadius = $derived(radius - 8); // Inner arc for depth effect
  const outerRadius = $derived(radius + 4); // Outer glow arc

  const createSegmentedArc = $derived(() => {
    const activeSegments = Math.floor((normalizedValue / 100) * segments);
    const segmentPaths = [];
    
    for (let i = 0; i < segments; i++) {
      const segmentStart = startAngle + (i * segmentAngle) + (i * segmentGap / segments);
      const segmentEnd = segmentStart + segmentAngle - (segmentGap / segments);
      
      const startRad = (segmentStart * Math.PI) / 180;
      const endRad = (segmentEnd * Math.PI) / 180;
      
      // Main arc coordinates
      const x1 = centerX + radius * Math.cos(startRad);
      const y1 = centerY + radius * Math.sin(startRad);
      const x2 = centerX + radius * Math.cos(endRad);
      const y2 = centerY + radius * Math.sin(endRad);
      
      // Inner arc coordinates for depth
      const ix1 = centerX + innerRadius * Math.cos(startRad);
      const iy1 = centerY + innerRadius * Math.sin(startRad);
      const ix2 = centerX + innerRadius * Math.cos(endRad);
      const iy2 = centerY + innerRadius * Math.sin(endRad);
      
      // Outer glow arc coordinates
      const ox1 = centerX + outerRadius * Math.cos(startRad);
      const oy1 = centerY + outerRadius * Math.sin(startRad);
      const ox2 = centerX + outerRadius * Math.cos(endRad);
      const oy2 = centerY + outerRadius * Math.sin(endRad);
      
      const isActive = i < activeSegments;
      const isNearActive = i === activeSegments; // Next segment gets subtle glow
      
      // Enhanced color and opacity logic
      let opacity, strokeColor, glowOpacity;
      
      if (isActive) {
        opacity = 1;
        strokeColor = statusColor();
        glowOpacity = 0.8;
      } else if (isNearActive) {
        opacity = 0.4;
        strokeColor = statusColor();
        glowOpacity = 0.3;
      } else {
        opacity = 0.12;
        strokeColor = '#334155';
        glowOpacity = 0;
      }
      
      segmentPaths.push({
        // Main segment
        path: `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`,
        // Inner depth segment
        innerPath: `M ${ix1} ${iy1} A ${innerRadius} ${innerRadius} 0 0 1 ${ix2} ${iy2}`,
        // Outer glow segment
        outerPath: `M ${ox1} ${oy1} A ${outerRadius} ${outerRadius} 0 0 1 ${ox2} ${oy2}`,
        opacity,
        strokeColor,
        glowOpacity,
        isActive,
        isNearActive
      });
    }
    
    return segmentPaths;
  });

  // Enhanced frame paths with futuristic styling
  const gaugeFramePaths = $derived([
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
        stroke: statusColor(),
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

  // Create tick marks around the gauge
  const createTickMarks = $derived(() => {
    const ticks = [];
    const tickCount = 11; // 0, 10, 20, ..., 100
    const tickRadius = radius + 15;
    
    for (let i = 0; i < tickCount; i++) {
      const angle = startAngle + (i / (tickCount - 1)) * totalAngle;
      const rad = (angle * Math.PI) / 180;
      
      const x1 = centerX + (tickRadius - 8) * Math.cos(rad);
      const y1 = centerY + (tickRadius - 8) * Math.sin(rad);
      const x2 = centerX + tickRadius * Math.cos(rad);
      const y2 = centerY + tickRadius * Math.sin(rad);
      
      ticks.push({
        x1, y1, x2, y2,
        value: (i / (tickCount - 1)) * 100,
        isMajor: i % 2 === 0
      });
    }
    
    return ticks;
  });
</script>

<!-- Enhanced Sensor Gauge Container -->
<div 
  class="relative inline-block gauge-container"
  style="width: {size}px; height: {size}px;"
>
  <!-- Cosmic UI Frame with enhanced glow -->
  {#if showFrame}
    <CosmicFrame 
      paths={gaugeFramePaths}
      className="gauge-frame"
      style="filter: {glowEffect ? `drop-shadow(0 0 20px ${statusGlow()}) drop-shadow(0 0 40px ${statusGlow()})` : 'none'}"
    />
  {/if}

  <!-- Main Gauge SVG -->
  <div class="absolute inset-6 flex items-center justify-center">
    <svg 
      width={size - 48} 
      height={size - 48} 
      viewBox="0 0 {size} {size}"
      class="overflow-visible gauge-svg"
    >
      <!-- Background grid pattern -->
      <defs>
        <pattern id="grid-{size}" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0, 255, 255, 0.1)" stroke-width="0.5"/>
        </pattern>
        
        <!-- Gradient definitions -->
        <radialGradient id="center-glow-{size}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style="stop-color:{statusColor()};stop-opacity:0.8" />
          <stop offset="70%" style="stop-color:{statusColor()};stop-opacity:0.3" />
          <stop offset="100%" style="stop-color:{statusColor()};stop-opacity:0" />
        </radialGradient>
      </defs>
      
      <!-- Background circle with grid -->
      <circle
        cx={centerX}
        cy={centerY}
        r={radius + 25}
        fill="url(#grid-{size})"
        opacity="0.3"
      />
      
      <!-- Tick marks -->
      {#each createTickMarks() as tick}
        <line
          x1={tick.x1}
          y1={tick.y1}
          x2={tick.x2}
          y2={tick.y2}
          stroke={tick.isMajor ? "rgba(0, 255, 255, 0.6)" : "rgba(0, 255, 255, 0.3)"}
          stroke-width={tick.isMajor ? "2" : "1"}
          stroke-linecap="round"
        />
      {/each}
      
      <!-- Enhanced multi-layer segmented arc gauge -->
      {#each createSegmentedArc() as segment}
        <!-- Outer glow layer -->
        {#if segment.glowOpacity > 0 && glowEffect}
          <path 
            d={segment.outerPath}
            stroke={segment.strokeColor}
            stroke-width="2"
            fill="none"
            stroke-linecap="round"
            opacity={segment.glowOpacity * 0.3}
            class="gauge-segment-glow"
            style="filter: blur(2px)"
          />
        {/if}
        
        <!-- Main segment with enhanced styling -->
        <path 
          d={segment.path}
          stroke={segment.strokeColor}
          stroke-width="8"
          fill="none"
          stroke-linecap="round"
          opacity={segment.opacity}
          class="gauge-segment"
          style="filter: {segment.isActive && glowEffect ? `drop-shadow(0 0 6px ${segment.strokeColor}) drop-shadow(0 0 12px ${segment.strokeColor}40)` : 'none'}"
        />
        
        <!-- Inner depth layer -->
        <path 
          d={segment.innerPath}
          stroke={segment.isActive ? '#ffffff' : '#1e293b'}
          stroke-width="2"
          fill="none"
          stroke-linecap="round"
          opacity={segment.isActive ? 0.6 : 0.2}
          class="gauge-segment-inner"
        />
      {/each}
      
      <!-- Center circle with enhanced styling -->
      <circle
        cx={centerX}
        cy={centerY}
        r="20"
        fill="url(#center-glow-{size})"
        stroke={statusColor()}
        stroke-width="2"
        class="center-circle"
      />
      
      <!-- Inner center circle -->
      <circle
        cx={centerX}
        cy={centerY}
        r="12"
        fill="rgba(0, 20, 40, 0.9)"
        stroke={statusColor()}
        stroke-width="1"
      />
      
      <!-- Enhanced value display with better typography hierarchy -->
      <text
        x={centerX}
        y={centerY - 12}
        text-anchor="middle"
        fill={statusColor()}
        font-size="28"
        font-weight="bold"
        font-family="'Orbitron', monospace"
        class="value-text"
        style="filter: drop-shadow(0 0 8px {statusColor()}40)"
      >
        {Math.round($animatedValue)}
      </text>
      
      <!-- Unit text with better positioning -->
      <text
        x={centerX}
        y={centerY + 8}
        text-anchor="middle"
        fill="rgba(0, 255, 255, 0.8)"
        font-size="12"
        font-weight="500"
        font-family="'Orbitron', monospace"
        class="unit-text"
      >
        {config.unit}
      </text>
      
      <!-- Percentage indicator for better context -->
      <text
        x={centerX}
        y={centerY + 24}
        text-anchor="middle"
        fill="rgba(156, 163, 175, 0.6)"
        font-size="8"
        font-family="'Orbitron', monospace"
        class="percentage-text"
      >
        {Math.round(normalizedValue)}% of max
      </text>
    </svg>
  </div>

  <!-- Enhanced label with icon -->
  <div class="absolute bottom-4 left-0 right-0 text-center">
    <div class="text-sm font-medium text-cyan-200 flex items-center justify-center gap-2 font-orbitron">
      {#if config.icon}
        <span class="text-lg">{config.icon}</span>
      {/if}
      <span class="tracking-wide">{label}</span>
    </div>
  </div>
  
  <!-- Enhanced status indicator -->
  <div class="absolute top-4 right-4 flex items-center gap-2">
    <div class="status-indicator w-3 h-3 rounded-full {value >= config.criticalThreshold ? 'bg-red-400 critical-pulse' : value >= config.warningThreshold ? 'bg-yellow-400 warning-pulse' : 'bg-green-400 normal-pulse'}"></div>
    <div class="text-xs font-orbitron text-cyan-300 opacity-80">
      {value >= config.criticalThreshold ? 'CRITICAL' : value >= config.warningThreshold ? 'WARNING' : 'NORMAL'}
    </div>
  </div>

  <!-- Performance indicator bars -->
  <div class="absolute bottom-12 left-4 right-4">
    <div class="flex justify-between text-xs font-mono text-cyan-400 opacity-60">
      <span>0</span>
      <span>50</span>
      <span>100</span>
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
  .gauge-container {
    position: relative;
    transition: transform 0.3s ease;
  }

  .gauge-container:hover {
    transform: scale(1.02);
  }

  .gauge-frame {
    transition: filter 0.3s ease;
  }

  .gauge-svg {
    filter: drop-shadow(0 0 10px rgba(0, 255, 255, 0.1));
  }

  .value-text {
    filter: drop-shadow(0 0 8px currentColor);
    transition: all 0.3s ease;
    animation: value-pulse 2s ease-in-out infinite;
  }

  .unit-text {
    opacity: 0.8;
    transition: opacity 0.3s ease;
  }
  
  .percentage-text {
    transition: opacity 0.3s ease;
  }
  
  @keyframes value-pulse {
    0%, 100% { 
      filter: drop-shadow(0 0 8px currentColor);
    }
    50% { 
      filter: drop-shadow(0 0 12px currentColor) drop-shadow(0 0 20px currentColor);
    }
  }

  .center-circle {
    transition: all 0.3s ease;
  }

  .gauge-segment {
    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .gauge-segment-glow {
    transition: all 0.8s ease;
  }
  
  .gauge-segment-inner {
    transition: all 0.4s ease;
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
    .gauge-container {
      transform: scale(0.9);
    }
  }

  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    .gauge-container,
    .gauge-frame,
    .value-text,
    .unit-text,
    .center-circle,
    .gauge-segment,
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