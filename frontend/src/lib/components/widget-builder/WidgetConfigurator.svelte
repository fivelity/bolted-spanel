<!--
  WidgetConfigurator.svelte
  
  Widget configuration modal demonstrating maximum customizability
  Features:
  - SVG background selection as base layers
  - Theme customization
  - LayerChart gauge configuration
  - Cosmic UI aesthetic integration
  - Real-time preview
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { CosmicFrame } from '$lib/components/cosmic';
  import LayerChartGauge from '../widgets/LayerChartGauge.svelte';
  
  interface SVGBackground {
    id: string;
    name: string;
    description: string;
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

  interface WidgetConfig {
    id: string;
    type: 'gauge';
    label: string;
    config: {
      min: number;
      max: number;
      warningThreshold: number;
      criticalThreshold: number;
      unit: string;
    };
    size: number;
    theme: string;
    animated: boolean;
    showValue: boolean;
    showLabel: boolean;
    glowEffect: boolean;
    svgBackground: SVGBackground | null;
  }

  // Props
  let { 
    widget = null as WidgetConfig | null,
    isOpen = false 
  }: {
    widget?: WidgetConfig | null;
    isOpen?: boolean;
  } = $props();

  const dispatch = createEventDispatcher();

  // Available SVG backgrounds (base layers)
  const availableSVGBackgrounds: SVGBackground[] = [
    {
      id: 'cosmic-frame',
      name: 'Cosmic Frame',
      description: 'Classic sci-fi frame with angular design',
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
      description: 'Futuristic hexagonal design',
      paths: [
        {
          show: true,
          style: {
            strokeWidth: "2",
            stroke: "#00ff88",
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
      description: 'Clean, professional design',
      paths: [
        {
          show: true,
          style: {
            strokeWidth: "1",
            stroke: "#00ff88",
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
    },
    {
      id: 'none',
      name: 'No Frame',
      description: 'Clean gauge without background frame',
      paths: []
    }
  ];

  // Available themes
  const availableThemes = [
    { id: 'gaming', name: 'Gaming', description: 'Classic green sci-fi' },
    { id: 'rgb', name: 'RGB', description: 'Dynamic color shifting' },
    { id: 'blue', name: 'Blue', description: 'Cool blue tones' },
    { id: 'red', name: 'Red', description: 'Alert red theme' }
  ];

  // Current configuration state
  let currentConfig = $state<WidgetConfig>({
    id: widget?.id || 'new-widget',
    type: 'gauge',
    label: widget?.label || 'New Gauge',
    config: {
      min: widget?.config?.min || 0,
      max: widget?.config?.max || 100,
      warningThreshold: widget?.config?.warningThreshold || 70,
      criticalThreshold: widget?.config?.criticalThreshold || 90,
      unit: widget?.config?.unit || '%'
    },
    size: widget?.size || 200,
    theme: widget?.theme || 'gaming',
    animated: widget?.animated ?? true,
    showValue: widget?.showValue ?? true,
    showLabel: widget?.showLabel ?? true,
    glowEffect: widget?.glowEffect ?? true,
    svgBackground: widget?.svgBackground || availableSVGBackgrounds[0]
  });

  // Test value for preview (animated)
  let testValue = $state(45);

  $effect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        testValue = Math.random() * (currentConfig.config.max - currentConfig.config.min) + currentConfig.config.min;
      }, 2000);
      
      return () => clearInterval(interval);
    }
  });

  // Save configuration
  function saveConfig() {
    dispatch('save', currentConfig);
    isOpen = false;
  }

  // Cancel configuration
  function cancelConfig() {
    dispatch('cancel');
    isOpen = false;
  }
</script>

{#if isOpen}
  <!-- Modal backdrop -->
  <div 
    class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    on:click={cancelConfig}
  >
    <!-- Modal content -->
    <div 
      class="bg-gray-900 border border-cyan-500/30 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
      on:click|stopPropagation
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-cyan-500/30">
        <h2 class="text-2xl font-bold text-cyan-400 font-orbitron">
          Widget Configurator
        </h2>
        <button 
          class="text-gray-400 hover:text-white transition-colors"
          on:click={cancelConfig}
        >
          ✕
        </button>
      </div>

      <div class="flex h-[calc(90vh-120px)]">
        <!-- Configuration Panel -->
        <div class="w-1/2 p-6 overflow-y-auto border-r border-cyan-500/30">
          <div class="space-y-6">
            
            <!-- Basic Settings -->
            <div>
              <h3 class="text-lg font-semibold text-cyan-300 mb-4">Basic Settings</h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">Label</label>
                  <input 
                    type="text" 
                    bind:value={currentConfig.label}
                    class="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">Size: {currentConfig.size}px</label>
                  <input 
                    type="range" 
                    min="150" 
                    max="400" 
                    bind:value={currentConfig.size}
                    class="w-full"
                  />
                  <div class="text-xs text-gray-400 mt-1">{currentConfig.size}px</div>
                </div>
              </div>
            </div>

            <!-- SVG Background Selection -->
            <div>
              <h3 class="text-lg font-semibold text-cyan-300 mb-4">SVG Background (Base Layer)</h3>
              <div class="grid grid-cols-2 gap-3">
                {#each availableSVGBackgrounds as background}
                  <button
                    class="p-3 border rounded-lg text-left transition-colors {currentConfig.svgBackground?.id === background.id ? 'border-cyan-500 bg-cyan-500/10' : 'border-gray-600 hover:border-gray-500'}"
                    on:click={() => currentConfig.svgBackground = background}
                  >
                    <div class="text-sm font-medium text-white">{background.name}</div>
                    <div class="text-xs text-gray-400">{background.description}</div>
                    {#if background.paths.length > 0}
                      <div class="mt-2">
                        <svg width="40" height="30" viewBox="0 0 100 100" class="opacity-60">
                          {#each background.paths as pathData}
                            <path d={pathData.path.map(p => p.join(' ')).join(' ')} {...pathData.style} />
                          {/each}
                        </svg>
                      </div>
                    {/if}
                  </button>
                {/each}
              </div>
            </div>

            <!-- Theme Selection -->
            <div>
              <h3 class="text-lg font-semibold text-cyan-300 mb-4">Theme</h3>
              <div class="grid grid-cols-2 gap-3">
                {#each availableThemes as theme}
                  <button
                    class="p-3 border rounded-lg text-left transition-colors {currentConfig.theme === theme.id ? 'border-cyan-500 bg-cyan-500/10' : 'border-gray-600 hover:border-gray-500'}"
                    on:click={() => currentConfig.theme = theme.id}
                  >
                    <div class="text-sm font-medium text-white">{theme.name}</div>
                    <div class="text-xs text-gray-400">{theme.description}</div>
                  </button>
                {/each}
              </div>
            </div>

            <!-- Gauge Configuration -->
            <div>
              <h3 class="text-lg font-semibold text-cyan-300 mb-4">Gauge Configuration</h3>
              <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Min Value</label>
                    <input 
                      type="number" 
                      bind:value={currentConfig.config.min}
                      class="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Max Value</label>
                    <input 
                      type="number" 
                      bind:value={currentConfig.config.max}
                      class="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                    />
                  </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Warning Threshold</label>
                    <input 
                      type="number" 
                      bind:value={currentConfig.config.warningThreshold}
                      class="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Critical Threshold</label>
                    <input 
                      type="number" 
                      bind:value={currentConfig.config.criticalThreshold}
                      class="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">Unit</label>
                  <input 
                    type="text" 
                    bind:value={currentConfig.config.unit}
                    class="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                  />
                </div>
              </div>
            </div>

            <!-- Display Options -->
            <div>
              <h3 class="text-lg font-semibold text-cyan-300 mb-4">Display Options</h3>
              <div class="space-y-3">
                <label class="flex items-center">
                  <input 
                    type="checkbox" 
                    bind:checked={currentConfig.animated}
                    class="mr-3"
                  />
                  <span class="text-gray-300">Animated transitions</span>
                </label>
                
                <label class="flex items-center">
                  <input 
                    type="checkbox" 
                    bind:checked={currentConfig.showValue}
                    class="mr-3"
                  />
                  <span class="text-gray-300">Show value</span>
                </label>
                
                <label class="flex items-center">
                  <input 
                    type="checkbox" 
                    bind:checked={currentConfig.showLabel}
                    class="mr-3"
                  />
                  <span class="text-gray-300">Show label</span>
                </label>
                
                <label class="flex items-center">
                  <input 
                    type="checkbox" 
                    bind:checked={currentConfig.glowEffect}
                    class="mr-3"
                  />
                  <span class="text-gray-300">Glow effects</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Preview Panel -->
        <div class="w-1/2 p-6 flex flex-col">
          <h3 class="text-lg font-semibold text-cyan-300 mb-4">Live Preview</h3>
          
          <div class="flex-1 flex items-center justify-center bg-gray-800/50 rounded-lg border border-gray-600">
            <LayerChartGauge
              value={testValue}
              label={currentConfig.label}
              config={currentConfig.config}
              size={currentConfig.size}
              theme={currentConfig.theme}
              animated={currentConfig.animated}
              showValue={currentConfig.showValue}
              showLabel={currentConfig.showLabel}
              glowEffect={currentConfig.glowEffect}
              svgBackground={currentConfig.svgBackground}
            />
          </div>
          
          <div class="mt-4 text-center text-sm text-gray-400">
            Test Value: {testValue.toFixed(1)}{currentConfig.config.unit}
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex justify-end gap-3 p-6 border-t border-cyan-500/30">
        <button 
          class="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          on:click={cancelConfig}
        >
          Cancel
        </button>
        <button 
          class="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded transition-colors"
          on:click={saveConfig}
        >
          Save Configuration
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Custom scrollbar for configuration panel */
  .overflow-y-auto::-webkit-scrollbar {
    width: 6px;
  }
  
  .overflow-y-auto::-webkit-scrollbar-track {
    background: #1f2937;
  }
  
  .overflow-y-auto::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-radius: 3px;
  }
  
  .overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
  }
</style>
