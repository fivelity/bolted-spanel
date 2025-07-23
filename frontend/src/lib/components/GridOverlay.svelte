<script lang="ts">
	interface Props {
		gridSize: number
		zoom: number
	}

	let { gridSize, zoom }: Props = $props()

	$: adjustedGridSize = gridSize * zoom
</script>

<div 
	class="grid-overlay absolute inset-0 pointer-events-none opacity-20"
	style="
		background-image: 
			linear-gradient(to right, #cbd5e1 1px, transparent 1px),
			linear-gradient(to bottom, #cbd5e1 1px, transparent 1px);
		background-size: {adjustedGridSize}px {adjustedGridSize}px;
	"
></div>

<style>
	:global(.dark) .grid-overlay {
		background-image: 
			linear-gradient(to right, #475569 1px, transparent 1px),
			linear-gradient(to bottom, #475569 1px, transparent 1px);
	}
</style>