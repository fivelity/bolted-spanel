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
  import LayerChartGauge from '$lib/components/widgets/LayerChartGauge.svelte';
  import WidgetConfigurator from '$lib/components/WidgetConfigurator.svelte';
  import { sensorStore } from '$lib/stores/sensorStore';
  import { get } from 'svelte/store';
  
  // Test data
  let testValue = $state(45);
  let testTheme = $state('gaming');
  let showConfigurator = $state(false);
  
  // Get real sensor data
  let sensorData = $derived(get(sensorStore.data));
  
  // Update test value periodically
  $effect(() => {
    const interval = setInterval(() => {
      testValue = Math.random() * 100;
    }, 3000);
    
    return () => clearInterval(interval);
  });

  // Available SVG backgrounds for demonstration
  const demoSVGBackgrounds = [
    {
      id: 'cosmic-frame',
      name: 'Cosmic Frame',
      paths: [
        {
          show: true,
          style: {
            strokeWidth: "2",
            stroke: "#00ff88",
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
            stroke: "#00ffff",
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
            stroke: "#7c3aed",
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

  function handleConfiguratorSave(event: CustomEvent) {
    console.log('Widget configuration saved:', event.detail);
    showConfigurator = false;
  }

  function handleConfiguratorCancel() {
    showConfigurator = false;
  }
</script>

<svelte:head>
  <title>LayerChart Integration Test - SenseCanvas</title>
</svelte:head>

<div class="min-h-screen bg-gray-900 text-white p-8">
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="text-center mb-12">
      <h1 class="text-4xl font-bold text-cyan-400 font-orbitron mb-4">
        LayerChart + Cosmic UI Integration
      </h1>
      <p class="text-xl text-gray-300 max-w-3xl mx-auto">
        Demonstrating proper LayerChart integration with Cosmic UI aesthetic, 
        where SVGs serve as base layers for widget backgrounds and maximum customizability.
      </p>
    </div>

    <!-- Architecture Explanation -->
    <div class="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-6 mb-8">
      <h2 class="text-2xl font-bold text-cyan-300 mb-4">Architecture Overview</h2>
      <div class="grid md:grid-cols-3 gap-6">
        <div class="bg-gray-700/50 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-green-400 mb-2">LayerChart</h3>
          <p class="text-gray-300 text-sm">
            Provides the actual charting/gauge functionality with reactive data binding and smooth animations.
          </p>
        </div>
        <div class="bg-gray-700/50 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-blue-400 mb-2">Cosmic UI</h3>
          <p class="text-gray-300 text-sm">
            Provides SVG-first sci-fi aesthetic components and techniques for base layers and styling.
          </p>
        </div>
        <div class="bg-gray-700/50 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-purple-400 mb-2">SVG Base Layers</h3>
          <p class="text-gray-300 text-sm">
            Configurable SVG backgrounds serve as base layers for widgets, enabling maximum customizability.
          </p>
        </div>
      </div>
    </div>

    <!-- Demo Controls -->
    <div class="flex justify-center gap-4 mb-8">
      <button 
        class="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-semibold transition-colors"
        on:click={() => showConfigurator = true}
      >
        🎨 Open Widget Configurator
      </button>
      <button 
        class="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
        on:click={() => testTheme = testTheme === 'gaming' ? 'rgb' : testTheme === 'rgb' ? 'neon' : 'gaming'}
      >
        🎭 Switch Theme ({testTheme})
      </button>
    </div>

    <!-- Gauge Demonstrations -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
      
      <!-- LayerChart Gauge with Cosmic Frame -->
      <div class="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-cyan-300 mb-4">LayerChart + Cosmic Frame</h3>
        <div class="flex justify-center">
          <LayerChartGauge
            value={testValue}
            label="CPU Usage"
            config={{ min: 0, max: 100, warningThreshold: 70, criticalThreshold: 90, unit: "%" }}
            size={180}
            theme={testTheme}
            animated={true}
            showValue={true}
            showLabel={true}
            glowEffect={true}
            svgBackground={demoSVGBackgrounds[0]}
          />
        </div>
        <p class="text-sm text-gray-400 mt-4 text-center">
          LayerChart gauge wrapped in Cosmic UI frame with sci-fi aesthetic
        </p>
      </div>

      <!-- LayerChart Gauge with Hexagonal Frame -->
      <div class="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-cyan-300 mb-4">LayerChart + Hexagonal Frame</h3>
        <div class="flex justify-center">
          <LayerChartGauge
            value={sensorData?.cpu?.temperature || 65}
            label="CPU Temp"
            config={{ min: 0, max: 100, warningThreshold: 75, criticalThreshold: 85, unit: "°C" }}
            size={180}
            theme="neon"
            animated={true}
            showValue={true}
            showLabel={true}
            glowEffect={true}
            svgBackground={demoSVGBackgrounds[1]}
          />
        </div>
        <p class="text-sm text-gray-400 mt-4 text-center">
          Futuristic hexagonal frame with neon theme
        </p>
      </div>

      <!-- LayerChart Gauge with Minimal Frame -->
      <div class="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-cyan-300 mb-4">LayerChart + Minimal Frame</h3>
        <div class="flex justify-center">
          <LayerChartGauge
            value={sensorData?.memory?.usage || 45}
            label="Memory"
            config={{ min: 0, max: 100, warningThreshold: 80, criticalThreshold: 90, unit: "%" }}
            size={180}
            theme="cyberpunk"
            animated={true}
            showValue={true}
            showLabel={true}
            glowEffect={true}
            svgBackground={demoSVGBackgrounds[2]}
          />
        </div>
        <p class="text-sm text-gray-400 mt-4 text-center">
          Clean minimal frame with cyberpunk theme
        </p>
      </div>

      <!-- LayerChart Gauge without Frame -->
      <div class="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-cyan-300 mb-4">LayerChart (No Frame)</h3>
        <div class="flex justify-center">
          <LayerChartGauge
                         value={sensorData?.gpu?.usage || 30}
            label="GPU Usage"
            config={{ min: 0, max: 100, warningThreshold: 80, criticalThreshold: 95, unit: "%" }}
            size={180}
            theme="rgb"
            animated={true}
            showValue={true}
            showLabel={true}
            glowEffect={true}
            svgBackground={null}
          />
        </div>
        <p class="text-sm text-gray-400 mt-4 text-center">
          Pure LayerChart gauge without SVG background frame
        </p>
      </div>

      <!-- Real-time Sensor Data -->
      <div class="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-cyan-300 mb-4">Real-time Sensor Data</h3>
        <div class="space-y-3 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-300">CPU Usage:</span>
            <span class="text-cyan-400">{sensorData?.cpu?.usage?.toFixed(1) || 'N/A'}%</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-300">CPU Temp:</span>
            <span class="text-cyan-400">{sensorData?.cpu?.temperature?.toFixed(1) || 'N/A'}°C</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-300">Memory:</span>
            <span class="text-cyan-400">{sensorData?.memory?.usage?.toFixed(1) || 'N/A'}%</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-300">GPU Usage:</span>
                         <span class="text-cyan-400">{sensorData?.gpu?.usage?.toFixed(1) || 'N/A'}%</span>
          </div>
        </div>
        <p class="text-sm text-gray-400 mt-4 text-center">
          Live data from PyHardwareMonitor backend
        </p>
      </div>

      <!-- Customization Info -->
      <div class="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-cyan-300 mb-4">Maximum Customizability</h3>
        <div class="space-y-3 text-sm">
          <div class="flex items-center">
            <span class="text-green-400 mr-2">✓</span>
            <span class="text-gray-300">SVG background selection</span>
          </div>
          <div class="flex items-center">
            <span class="text-green-400 mr-2">✓</span>
            <span class="text-gray-300">Theme customization</span>
          </div>
          <div class="flex items-center">
            <span class="text-green-400 mr-2">✓</span>
            <span class="text-gray-300">Gauge configuration</span>
          </div>
          <div class="flex items-center">
            <span class="text-green-400 mr-2">✓</span>
            <span class="text-gray-300">Animation controls</span>
          </div>
          <div class="flex items-center">
            <span class="text-green-400 mr-2">✓</span>
            <span class="text-gray-300">Real-time preview</span>
          </div>
        </div>
        <p class="text-sm text-gray-400 mt-4 text-center">
          Click "Open Widget Configurator" to explore
        </p>
      </div>
    </div>

    <!-- Technical Details -->
    <div class="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-6">
      <h2 class="text-2xl font-bold text-cyan-300 mb-4">Technical Implementation</h2>
      <div class="grid md:grid-cols-2 gap-6">
        <div>
          <h3 class="text-lg font-semibold text-green-400 mb-2">LayerChart Integration</h3>
          <ul class="text-sm text-gray-300 space-y-1">
            <li>• Chart, Arc, Text components for gauge functionality</li>
            <li>• Reactive data binding with Svelte 5 runes</li>
            <li>• Smooth animations and transitions</li>
            <li>• Theme-aware color calculations</li>
          </ul>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-blue-400 mb-2">Cosmic UI Integration</h3>
          <ul class="text-sm text-gray-300 space-y-1">
            <li>• SVG-first component approach</li>
            <li>• Configurable SVG paths for backgrounds</li>
            <li>• Sci-fi aesthetic with corner decorations</li>
            <li>• Responsive frame sizing</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Widget Configurator Modal -->
<WidgetConfigurator 
  isOpen={showConfigurator}
  on:save={handleConfiguratorSave}
  on:cancel={handleConfiguratorCancel}
/>

<style>
  /* Custom styling for the test page */
  .font-orbitron {
    font-family: 'Orbitron', monospace;
  }
  
  /* Smooth transitions */
  * {
    transition: all 0.3s ease;
  }
  
  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: #1f2937;
  }
  
  ::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-radius: 4px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
  }
</style> 