<!--
  CosmicToolbar.svelte
  
  Cosmic UI Toolbar component
  Features:
  - Sci-fi styled toolbar with cosmic frames
  - Flexible layout with sections
  - Built-in status indicators
  - Animated scan lines
-->

<script lang="ts">
  import CosmicFrame from './CosmicFrame.svelte';
  
  // Props
  let { 
    className = '',
    left,
    center,
    right,
    children,
    showScanLines = true,
    ...restProps 
  }: {
    className?: string;
    left?: any;
    center?: any;
    right?: any;
    children?: any;
    showScanLines?: boolean;
    [key: string]: any;
  } = $props();

  // Toolbar frame with sci-fi styling
  const toolbarFramePaths = [
    {
      show: true,
      style: {
        strokeWidth: "2",
        stroke: "var(--color-frame-1-stroke)",
        fill: "rgba(0, 0, 0, 0.8)"
      },
      path: [
        ["M", "0", "0"],
        ["L", "100%", "0"],
        ["L", "100%", "100%"],
        ["L", "20", "100%"],
        ["L", "0", "80%"],
        ["L", "0", "0"]
      ]
    },
    {
      show: true,
      style: {
        strokeWidth: "1",
        stroke: "rgba(255, 255, 255, 0.3)",
        fill: "transparent"
      },
      path: [
        ["M", "100% - 50", "0"],
        ["L", "100%", "0"],
        ["L", "100%", "100%"],
        ["L", "100% - 30", "100%"]
      ]
    }
  ];
</script>

<!-- Cosmic Toolbar -->
<div 
  class="relative h-16 bg-gray-900/90 backdrop-blur-sm border-b border-gray-700/50 {className}"
  {...restProps}
>
  <!-- Toolbar Frame -->
  <CosmicFrame 
    paths={toolbarFramePaths}
    className="opacity-80"
  />
  
  <!-- Animated Scan Lines -->
  {#if showScanLines}
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute w-full h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent animate-scan-slow"></div>
      <div class="absolute right-0 top-0 w-px h-full bg-gradient-to-b from-transparent via-blue-400/20 to-transparent animate-scan-vertical-slow"></div>
    </div>
  {/if}
  
  <!-- Toolbar Content -->
  <div class="relative z-10 h-full flex items-center justify-between px-6">
    <!-- Left Section -->
    <div class="flex items-center gap-4">
      {#if left}
        {@render left()}
      {/if}
    </div>
    
    <!-- Center Section -->
    <div class="flex items-center gap-4">
      {#if center}
        {@render center()}
      {/if}
    </div>
    
    <!-- Right Section -->
    <div class="flex items-center gap-4">
      {#if right}
        {@render right()}
      {/if}
    </div>
    
    <!-- Default Children (if no sections specified) -->
    {#if children}
      {@render children()}
    {/if}
  </div>
</div>

<style>
  @keyframes scan-slow {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
  
  @keyframes scan-vertical-slow {
    0% { transform: translateX(100%); }
    100% { transform: translateX(-100vw); }
  }
  
  .animate-scan-slow {
    animation: scan-slow 15s linear infinite;
  }
  
  .animate-scan-vertical-slow {
    animation: scan-vertical-slow 20s linear infinite;
  }
  
  @media (prefers-reduced-motion: reduce) {
    .animate-scan-slow,
    .animate-scan-vertical-slow {
      animation: none;
    }
  }
</style> 