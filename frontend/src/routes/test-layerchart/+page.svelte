<!--
  Test LayerChart Integration Page
  
  This page demonstrates the LayerChart integration with Cosmic UI
  and tests various gauge components to ensure they're working correctly.
-->

<script lang="ts">
  import LayerChartGauge from '$lib/components/widgets/LayerChartGauge.svelte';
  import CosmicSensorGauge from '$lib/components/widgets/CosmicSensorGauge.svelte';
  import { sensorStore } from '$lib/stores/sensorStore';
  import { get } from 'svelte/store';
  
  // Test data
  let testValue = $state(45);
  let testTheme = $state('gaming');
  
  // Get real sensor data
  let sensorData = $derived(get(sensorStore.data));
  
  // Update test value periodically
  $effect(() => {
    const interval = setInterval(() => {
      testValue = Math.random() * 100;
    }, 2000);
    
    return () => clearInterval(interval);
  });
</script>

<svelte:head>
  <title>LayerChart Integration Test</title>
</svelte:head>

<div class="min-h-screen bg-gray-900 text-white p-8">
  <div class="max-w-6xl mx-auto">
    <h1 class="text-4xl font-bold mb-8 text-center font-orbitron">
      LayerChart Integration Test
    </h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      
      <!-- LayerChart Gauge Test -->
      <div class="bg-gray-800 p-6 rounded-lg border border-cyan-500/30">
        <h2 class="text-xl font-semibold mb-4 text-cyan-400">LayerChart Gauge</h2>
        <div class="flex justify-center">
          <LayerChartGauge
            value={testValue}
            label="Test Gauge"
            config={{
              min: 0,
              max: 100,
              warningThreshold: 70,
              criticalThreshold: 90,
              unit: "%"
            }}
            size={200}
            theme={testTheme}
            animated={true}
            showValue={true}
            showLabel={true}
            glowEffect={true}
          />
        </div>
        <div class="mt-4 text-center">
          <p class="text-sm text-gray-400">Value: {testValue.toFixed(1)}%</p>
          <p class="text-sm text-gray-400">Theme: {testTheme}</p>
        </div>
      </div>
      
      <!-- Cosmic Sensor Gauge Test -->
      <div class="bg-gray-800 p-6 rounded-lg border border-purple-500/30">
        <h2 class="text-xl font-semibold mb-4 text-purple-400">Cosmic Sensor Gauge</h2>
        <div class="flex justify-center">
          <CosmicSensorGauge
            value={testValue}
            label="Cosmic Gauge"
            config={{
              min: 0,
              max: 100,
              warningThreshold: 70,
              criticalThreshold: 90,
              unit: "%",
              icon: "⚡"
            }}
            size={200}
            showFrame={true}
            glowEffect={true}
          />
        </div>
        <div class="mt-4 text-center">
          <p class="text-sm text-gray-400">Value: {testValue.toFixed(1)}%</p>
        </div>
      </div>
      
      <!-- Real Sensor Data Test -->
      <div class="bg-gray-800 p-6 rounded-lg border border-green-500/30">
        <h2 class="text-xl font-semibold mb-4 text-green-400">Real Sensor Data</h2>
        <div class="flex justify-center">
          <LayerChartGauge
            value={sensorData?.cpu?.usage || 0}
            label="CPU Usage"
            config={{
              min: 0,
              max: 100,
              warningThreshold: 70,
              criticalThreshold: 90,
              unit: "%"
            }}
            size={200}
            theme="dark"
            animated={true}
            showValue={true}
            showLabel={true}
            glowEffect={true}
          />
        </div>
        <div class="mt-4 text-center">
          <p class="text-sm text-gray-400">CPU: {sensorData?.cpu?.usage?.toFixed(1)}%</p>
          <p class="text-sm text-gray-400">Temp: {sensorData?.cpu?.temperature?.toFixed(1)}°C</p>
        </div>
      </div>
      
      <!-- Theme Switcher -->
      <div class="bg-gray-800 p-6 rounded-lg border border-yellow-500/30">
        <h2 class="text-xl font-semibold mb-4 text-yellow-400">Theme Controls</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">Theme:</label>
            <select 
              bind:value={testTheme}
              class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
            >
              <option value="gaming">Gaming</option>
              <option value="rgb">RGB</option>
              <option value="dark">Dark</option>
              <option value="minimal">Minimal</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">Value: {testValue.toFixed(1)}%</label>
            <input 
              type="range" 
              min="0" 
              max="100" 
              bind:value={testValue}
              class="w-full"
            />
          </div>
        </div>
      </div>
      
      <!-- Status Information -->
      <div class="bg-gray-800 p-6 rounded-lg border border-blue-500/30">
        <h2 class="text-xl font-semibold mb-4 text-blue-400">System Status</h2>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span>Connection:</span>
            <span class="text-green-400">Connected</span>
          </div>
          <div class="flex justify-between">
            <span>LayerChart:</span>
            <span class="text-green-400">Loaded</span>
          </div>
          <div class="flex justify-between">
            <span>Cosmic UI:</span>
            <span class="text-green-400">Active</span>
          </div>
          <div class="flex justify-between">
            <span>Svelte 5:</span>
            <span class="text-green-400">Runes</span>
          </div>
        </div>
      </div>
      
      <!-- Performance Metrics -->
      <div class="bg-gray-800 p-6 rounded-lg border border-red-500/30">
        <h2 class="text-xl font-semibold mb-4 text-red-400">Performance</h2>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span>Memory Usage:</span>
            <span>{sensorData?.memory?.usage?.toFixed(1)}%</span>
          </div>
          <div class="flex justify-between">
            <span>GPU Usage:</span>
            <span>{sensorData?.gpu?.usage?.toFixed(1)}%</span>
          </div>
          <div class="flex justify-between">
            <span>GPU Temp:</span>
            <span>{sensorData?.gpu?.temperature?.toFixed(1)}°C</span>
          </div>
        </div>
      </div>
      
    </div>
    
    <!-- Instructions -->
    <div class="mt-12 bg-gray-800 p-6 rounded-lg border border-gray-600">
      <h2 class="text-2xl font-semibold mb-4">Test Instructions</h2>
      <ul class="space-y-2 text-gray-300">
        <li>• The LayerChart gauge should display with smooth animations</li>
        <li>• The Cosmic Sensor gauge should show the sci-fi frame styling</li>
        <li>• Real sensor data should update from the mock data stream</li>
        <li>• Theme switching should change colors and effects</li>
        <li>• All gauges should be responsive and properly sized</li>
        <li>• Check browser console for any errors</li>
      </ul>
    </div>
  </div>
</div>

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