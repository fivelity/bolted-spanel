<!--
  CosmicPanel.svelte
  
  Cosmic UI Panel component for content containers
  Features:
  - Multiple frame variants
  - Optional header and footer
  - Scrollable content area
  - Glow effects and animations
-->

<script lang="ts">
  import CosmicFrame from './CosmicFrame.svelte';
  import { defaultFramePaths } from './theme';
  import type { Snippet } from 'svelte';
  
  type PanelVariant = 'default' | 'highlighted' | 'minimal';

  // Props
  let { 
    variant = 'default',
    title,
    subtitle,
    className = '',
    contentClass = '',
    showGlow = false,
    scrollable = false,
    children,
    header,
    footer,
    ...restProps 
  }: {
    variant?: PanelVariant;
    title?: string;
    subtitle?: string;
    className?: string;
    contentClass?: string;
    showGlow?: boolean;
    scrollable?: boolean;
    children: Snippet;
    header?: Snippet;
    footer?: Snippet;
    [key: string]: unknown;
  } = $props();

  // Variant-based frame paths
  const currentFrames = $derived(() => {
    switch (variant) {
      case 'highlighted':
        return defaultFramePaths.highlighted;
      case 'minimal':
        return [{
          show: true,
          style: {
            strokeWidth: "1",
            stroke: "rgba(255, 255, 255, 0.2)",
            fill: "rgba(0, 0, 0, 0.2)"
          },
          path: [
            ["M", "0", "0"],
            ["L", "100%", "0"],
            ["L", "100%", "100%"],
            ["L", "0", "100%"],
            ["L", "0", "0"]
          ]
        }];
      default:
        return defaultFramePaths.standard;
    }
  });
</script>

<!-- Cosmic Panel -->
<div 
  class="relative {className}"
  {...restProps}
>
  <!-- Panel Frame -->
  <CosmicFrame 
    paths={currentFrames()}
    className={showGlow ? "drop-shadow-lg" : ""}
  />
  
  <!-- Panel Content Container -->
  <div class="relative z-10 flex flex-col h-full">
    <!-- Header Section -->
    {#if title || subtitle || header}
      <div class="p-4 border-b border-white/10">
        {#if header}
          {@render header()}
        {:else}
          <div class="space-y-1">
            {#if title}
              <h3 class="font-orbitron font-semibold text-white text-lg">{title}</h3>
            {/if}
            {#if subtitle}
              <p class="text-gray-400 text-sm">{subtitle}</p>
            {/if}
          </div>
        {/if}
      </div>
    {/if}
    
    <!-- Main Content Area -->
    <div 
      class="flex-1 p-4 {contentClass} {scrollable ? 'overflow-auto' : ''}"
    >
      {@render children()}
    </div>
    
    <!-- Footer Section -->
    {#if footer}
      <div class="p-4 border-t border-white/10">
        {@render footer()}
      </div>
    {/if}
  </div>
  
  <!-- Glow Effect -->
  {#if showGlow}
    <div 
      class="absolute inset-0 opacity-20 pointer-events-none"
      style="filter: blur(20px); background: radial-gradient(circle at center, var(--color-primary)30 0%, transparent 70%);"
    ></div>
  {/if}
</div> 