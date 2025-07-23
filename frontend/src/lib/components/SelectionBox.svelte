<script lang="ts">
	import type { Position } from '$lib/types/dashboard'

	interface Props {
		start: Position
		end: Position
	}

	let { start, end }: Props = $props()

	let left = $derived(Math.min(start.x, end.x));
	let top = $derived(Math.min(start.y, end.y));
	let width = $derived(Math.abs(end.x - start.x));
	let height = $derived(Math.abs(end.y - start.y));
</script>

<div
	class="selection-box absolute pointer-events-none"
	style="
		left: {left}px;
		top: {top}px;
		width: {width}px;
		height: {height}px;
	"
></div>

<style>
	.selection-box {
		border: 2px dashed #3b82f6;
		background: rgba(59, 130, 246, 0.1);
		border-radius: 4px;
		animation: dash 1s linear infinite;
	}

	@keyframes dash {
		to {
			stroke-dashoffset: -8px;
		}
	}
</style>