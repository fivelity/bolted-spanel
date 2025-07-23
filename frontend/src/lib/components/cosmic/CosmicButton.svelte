<!--
  CosmicButton.svelte
  
  Cosmic UI Button component with sci-fi styling
  Features:
  - SVG frame-based design
  - Hover and active states
  - Multiple variants (primary, secondary, accent)
  - Built-in glow effects
-->

<script lang="ts">
  import CosmicFrame from './CosmicFrame.svelte';
  import { defaultFramePaths } from './theme';
  
  type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost';
  type ButtonSize = 'sm' | 'md' | 'lg';

  // Props
  let { 
    variant = 'primary',
    size = 'md',
    disabled = false,
    onclick,
    className = '',
    children,
    ...restProps 
  }: {
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    onclick?: () => void;
    className?: string;
    children: any;
    [key: string]: any;
  } = $props();

  // Button state
  let isHovered = $state(false);
  let isPressed = $state(false);

  // Variant-based styling
  const variantStyles = {
    primary: {
      stroke: 'var(--color-primary)',
      fill: 'rgba(20, 160, 230, 0.1)',
      hoverStroke: 'var(--color-primary)',
      hoverFill: 'rgba(20, 160, 230, 0.2)',
      textColor: 'text-blue-200'
    },
    secondary: {
      stroke: 'var(--color-frame-5-stroke)',
      fill: 'var(--color-frame-5-fill)',
      hoverStroke: 'var(--color-primary)',
      hoverFill: 'rgba(255, 255, 255, 0.1)',
      textColor: 'text-gray-200'
    },
    accent: {
      stroke: 'var(--color-accent)',
      fill: 'rgba(202, 65, 34, 0.1)',
      hoverStroke: 'var(--color-accent)',
      hoverFill: 'rgba(202, 65, 34, 0.2)',
      textColor: 'text-red-200'
    },
    ghost: {
      stroke: 'transparent',
      fill: 'transparent',
      hoverStroke: 'var(--color-frame-5-stroke)',
      hoverFill: 'rgba(255, 255, 255, 0.05)',
      textColor: 'text-gray-300'
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const currentStyle = $derived(variantStyles[variant]);
  
  // Dynamic frame paths based on state
  const buttonFramePaths = $derived([
    {
      show: true,
      style: {
        strokeWidth: disabled ? "1" : isPressed ? "3" : isHovered ? "2" : "1.5",
        stroke: disabled ? 'rgba(255, 255, 255, 0.2)' : isHovered ? currentStyle.hoverStroke : currentStyle.stroke,
        fill: disabled ? 'rgba(255, 255, 255, 0.02)' : isHovered ? currentStyle.hoverFill : currentStyle.fill
      },
      path: [
        ["M", "8", "8"],
        ["L", "90%", "8"],
        ["L", "100% - 8", "20"],
        ["L", "100% - 8", "80%"],
        ["L", "90%", "100% - 8"],
        ["L", "8", "100% - 8"],
        ["L", "8", "8"]
      ]
    }
  ]);

  function handleClick() {
    if (!disabled && onclick) {
      onclick();
    }
  }
</script>

<!-- Cosmic Button -->
<button
  class="relative font-orbitron font-medium transition-all duration-200 {sizeClasses[size]} {currentStyle.textColor} {className} {disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:brightness-110'}"
  {disabled}
  onclick={handleClick}
  onmouseenter={() => !disabled && (isHovered = true)}
  onmouseleave={() => !disabled && (isHovered = false)}
  onmousedown={() => !disabled && (isPressed = true)}
  onmouseup={() => !disabled && (isPressed = false)}
  {...restProps}
>
  <!-- Cosmic Frame Background -->
  <CosmicFrame 
    paths={buttonFramePaths}
    className="pointer-events-none"
  />
  
  <!-- Button Content -->
  <span class="relative z-10 flex items-center justify-center gap-2">
    {@render children()}
  </span>
  
  <!-- Glow Effect -->
  {#if !disabled && isHovered}
    <div 
      class="absolute inset-0 opacity-30 transition-opacity duration-200"
      style="filter: blur(8px); background: radial-gradient(circle, {currentStyle.hoverStroke}40 0%, transparent 70%);"
    ></div>
  {/if}
</button>

<style>
  button {
    background: transparent;
    border: none;
    outline: none;
  }
  
  button:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
</style> 