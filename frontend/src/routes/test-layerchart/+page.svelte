<!--
  Test LayerChart Integration Page
  
  Demonstrates:
  - Proper LayerChart integration with Cosmic UI aesthetic
  - SVG base layers for widget backgrounds
  - Maximum customizability principle
  - Widget configurator with SVG background selection
  - Real-time sensor data integration
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { LayerCake, Svg } from 'layercake';
  import { CosmicPanel } from '$lib/components/cosmic';
  import CosmicSensorGauge from '$lib/components/widgets/CosmicSensorGauge.svelte';
  import CosmicLinearMeter from '$lib/components/widgets/CosmicLinearMeter.svelte';
  
  // Mock sensor data
  let cpuUsage = $state(0);
  let gpuUsage = $state(0);
  let memoryUsage = $state(0);
  let diskUsage = $state(0);
  let networkUsage = $state(0);

  // Update mock data
  function updateMockData() {
    cpuUsage = Math.random() * 100;
    gpuUsage = Math.random() * 100;
    memoryUsage = Math.random() * 100;
    diskUsage = Math.random() * 100;
    networkUsage = Math.random() * 100;
  }

  // Start mock data updates
  onMount(() => {
    updateMockData();
    const interval = setInterval(updateMockData, 2000);
    return () => clearInterval(interval);
  });
</script>

<div class="w-full h-full flex flex-col">
  <!-- Header Panel -->
  <div class="flex-none p-2 md:p-4">
    <CosmicPanel 
      variant="highlighted" 
      title="LayerChart Integration" 
      subtitle="Real-time Hardware Monitoring"
      className="w-full"
      showGlow={true}
    >
      <div class="text-center space-y-2 md:space-y-3">
        <p class="text-cyan-200 font-orbitron text-base md:text-lg lg:text-xl">
          Enhanced Cosmic UI Design System
        </p>
        <p class="text-sm md:text-base text-cyan-400 opacity-80">
          Futuristic monitoring with segmented gauges, real-time updates, and intelligent alerts
        </p>
      </div>
    </CosmicPanel>
  </div>

  <!-- Main Dashboard -->
  <div class="flex-1 min-h-0 w-full p-4">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- CPU Usage -->
      <div class="flex justify-center">
        <CosmicSensorGauge
          value={cpuUsage}
          label="CPU Usage"
          config={{
            min: 0,
            max: 100,
            warningThreshold: 70,
            criticalThreshold: 90,
            unit: "%",
            icon: "🔥"
          }}
          size={220}
        />
      </div>

      <!-- GPU Usage -->
      <div class="flex justify-center">
        <CosmicSensorGauge
          value={gpuUsage}
          label="GPU Usage"
          config={{
            min: 0,
            max: 100,
            warningThreshold: 80,
            criticalThreshold: 95,
            unit: "%",
            icon: "⚡"
          }}
          size={220}
        />
      </div>

      <!-- Memory Usage -->
      <div class="flex justify-center">
        <CosmicSensorGauge
          value={memoryUsage}
          label="Memory Usage"
          config={{
            min: 0,
            max: 100,
            warningThreshold: 75,
            criticalThreshold: 90,
            unit: "%",
            icon: "💾"
          }}
          size={220}
        />
      </div>

      <!-- Disk Usage -->
      <div class="flex justify-center md:col-span-2 lg:col-span-1">
        <CosmicLinearMeter
          value={diskUsage}
          label="Disk Usage"
          config={{
            min: 0,
            max: 100,
            warningThreshold: 80,
            criticalThreshold: 95,
            unit: "%",
            icon: "💿"
          }}
          width={320}
          height={140}
        />
      </div>

      <!-- Network Usage -->
      <div class="flex justify-center md:col-span-2 lg:col-span-2">
        <CosmicLinearMeter
          value={networkUsage}
          label="Network Usage"
          config={{
            min: 0,
            max: 100,
            warningThreshold: 75,
            criticalThreshold: 90,
            unit: "Mbps",
            icon: "🌐"
          }}
          width={320}
          height={140}
        />
      </div>
    </div>
  </div>
</div>

<style>
  /* Custom styling for the test page */
  :global(.font-orbitron) {
    font-family: 'Orbitron', monospace;
  }
  
  :global(*) {
    transition: all 0.3s ease;
  }
  
  /* Custom scrollbar */
  :global(::-webkit-scrollbar) {
    width: 8px;
  }
  
  :global(::-webkit-scrollbar-track) {
    background: #1f2937;
  }
  
  :global(::-webkit-scrollbar-thumb) {
    background: #4b5563;
    border-radius: 4px;
  }
  
  :global(::-webkit-scrollbar-thumb:hover) {
    background: #6b7280;
  }

  /* Responsive adjustments */
  @media (max-width: 640px) {
    :global(.cosmic-button) {
      padding: 0.5rem 1rem;
      font-size: 0.75rem;
    }
    
    :global(.status-bar) {
      font-size: 0.625rem;
    }
  }

  @media (min-width: 1024px) {
    :global(.cosmic-button) {
      padding: 0.75rem 1.5rem;
      font-size: 0.875rem;
    }
  }

  @media (min-width: 1536px) {
    :global(.widget-container) {
      transform: scale(1.1);
    }
  }

  /* Prevent text selection during drag */
  :global(.widget-container *) {
    user-select: none;
  }

  /* Optimize animations for performance */
  :global(.widget-container) {
    will-change: transform;
    backface-visibility: hidden;
    transform: translateZ(0);
  }
</style> 