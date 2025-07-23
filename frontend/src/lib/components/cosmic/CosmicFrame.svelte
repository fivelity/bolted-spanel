<!--
  CosmicFrame.svelte
  
  Svelte adaptation of Cosmic UI Frame component
  Demonstrates:
  - SVG-first design approach from Cosmic UI
  - Customizable SVG paths for sci-fi aesthetic
  - Frame component for sensor widget containers
  - Cosmic UI color system integration
  - Dynamic path rendering with reactive updates
-->

<script lang="ts">
  import { onMount } from 'svelte';
  
  interface PathData {
    show: boolean;
    style: {
      strokeWidth: string;
      stroke: string;
      fill: string;
    };
    path: string[][];
  }

  // Props
  let { paths = [] as PathData[], className = "", style = "", ...restProps } = $props<{ paths?: PathData[], className?: string, style?: string, [key: string]: unknown }>()

  let svgElement: SVGSVGElement;

  // Convert Cosmic UI path format to SVG path string
  function pathToString(pathArray: string[][]): string {
    return pathArray.map(segment => segment.join(' ')).join(' ');
  }

  // Process percentage-based coordinates for responsive frames
  function processPath(pathString: string, width: number): string {
    return pathString
      .replace(/100%-(\d+)/g, (match, offset) => {
        return `${width - parseFloat(offset)}`;
      })
      .replace(/(\d+)%-(\d+)/g, (match, percent, offset) => {
        const num = parseFloat(percent);
        return `${(num / 100) * width - parseFloat(offset)}`;
      })
      .replace(/(\d+)%\+(\d+)/g, (match, percent, offset) => {
        const num = parseFloat(percent);
        return `${(num / 100) * width + parseFloat(offset)}`;
      })
      .replace(/(\d+)%/g, (match, percent) => {
        const num = parseFloat(percent);
        return `${(num / 100) * width}`;
      });
  }

  // Reactive frame dimensions
  let frameWidth = $state(300);
  let frameHeight = $state(200);

  // Update dimensions when component mounts or resizes
  onMount(() => {
    if (svgElement && svgElement.parentElement) {
      const updateDimensions = () => {
        const rect = svgElement.parentElement!.getBoundingClientRect();
        frameWidth = rect.width || 300;
        frameHeight = rect.height || 200;
      };

      updateDimensions();
      
      // Watch for resize
      const resizeObserver = new ResizeObserver(updateDimensions);
      resizeObserver.observe(svgElement.parentElement);
      
      return () => resizeObserver.disconnect();
    }
  });

  // Process paths reactively
  const processedPaths = $derived(
    paths.map((pathData: PathData) => ({
      ...pathData,
      processedPath: processPath(
        pathToString(pathData.path), 
        frameWidth
      )
    }))
  );
</script>

<!-- Cosmic UI Frame SVG -->
<svg
  bind:this={svgElement}
  class="absolute inset-0 size-full {className}"
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 {frameWidth} {frameHeight}"
  {style}
  {...restProps}
>
  {#each processedPaths as pathData}
    {#if pathData.show}
      <path
        d={pathData.processedPath}
        stroke-width={pathData.style.strokeWidth}
        stroke={pathData.style.stroke}
        fill={pathData.style.fill}
        class="transition-all duration-300"
      />
    {/if}
  {/each}
</svg> 