<script lang="ts">
	import { draggable } from '@neodrag/svelte';
	import type { WidgetConfig } from '$lib/types/widget';
	import { layoutStore, selectedWidgets, isEditMode, currentLayout } from '$lib/stores/layoutStore';
	import GaugeWidget from './widgets/GaugeWidget.svelte';
	import SimpleWidget from './widgets/SimpleWidget.svelte';
	import MeterWidget from './widgets/MeterWidget.svelte';

	interface Props {
		widget: WidgetConfig;
	}

	let { widget }: Props = $props();

	let isSelected = $derived(() => $selectedWidgets.includes(widget.id));

	// Drag configuration
	const dragOptions = {
		disabled: !isEditMode,
		bounds: 'parent',
		grid: [20, 20], // Use fixed grid size for now
		onDragStart: () => {
			if (!isSelected) {
				layoutStore.selectWidget(widget.id);
			}
		},
		onDrag: ({ offsetX, offsetY }: { offsetX: number; offsetY: number }) => {
			layoutStore.updateWidget(widget.id, {
				position: { x: offsetX, y: offsetY }
			});
		}
	};

	function handleClick(event: MouseEvent) {
		if (!isEditMode) return;
		
		event.stopPropagation();
		const multiSelect = event.ctrlKey || event.metaKey;
		layoutStore.selectWidget(widget.id, multiSelect);
	}

	function handleDoubleClick() {
		if (!isEditMode) return;
		// TODO: Open widget configurator
		console.log('Configure widget:', widget.id);
	}
</script>

<div
	class="draggable-widget absolute"
	class:selected={isSelected}
	class:edit-mode={$isEditMode}
	style="
		left: {widget.position.x}px;
		top: {widget.position.y}px;
		width: {widget.size.w}px;
		height: {widget.size.h}px;
		z-index: {isSelected ? 10 : 1};
	"
	use:draggable={dragOptions}
	onclick={handleClick}
	ondblclick={handleDoubleClick}
	on:keydown={(e) => { if (e.key === 'Enter' || e.key === 'Space') handleClick(e as unknown as MouseEvent); }}
	role="button"
	tabindex="0"
>
	<!-- Widget Content -->
	<div class="widget-content h-full w-full">
		{#if widget.type === 'gauge'}
			<GaugeWidget config={widget} />
		{:else if widget.type === 'simple'}
			<SimpleWidget config={widget} />
		{:else if widget.type === 'meter'}
			<MeterWidget config={widget} />
		{:else}
			<div class="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded">
				<span class="text-gray-500">Unknown widget type: {widget.type}</span>
			</div>
		{/if}
	</div>

	<!-- Selection Indicator -->
	{#if isSelected && $isEditMode}
		<div class="selection-outline absolute inset-0 pointer-events-none">
			<div class="selection-border"></div>
			
			<!-- Resize handles -->
			<div class="resize-handles">
				<div class="resize-handle nw"></div>
				<div class="resize-handle ne"></div>
				<div class="resize-handle sw"></div>
				<div class="resize-handle se"></div>
			</div>
		</div>
	{/if}

	<!-- Widget Actions (Edit Mode) -->
	{#if isSelected && $isEditMode}
		<div class="widget-actions absolute -top-8 left-0 flex gap-1 bg-surface-100-800-token rounded px-2 py-1 text-xs">
			<button
				class="p-1 hover:bg-surface-200-700-token rounded"
				onclick={(e) => { e.stopPropagation(); handleDoubleClick(); }}
				title="Configure widget"
			>
				⚙️
			</button>
			<button
				class="p-1 hover:bg-surface-200-700-token rounded text-error-500"
				onclick={(e) => { e.stopPropagation(); layoutStore.removeWidget(widget.id); }}
				title="Delete widget"
			>
				🗑️
			</button>
		</div>
	{/if}
</div>

<style>
	.draggable-widget {
		transition: all 0.2s ease;
		cursor: default;
	}

	.draggable-widget.edit-mode {
		cursor: move;
	}

	.draggable-widget.selected {
		z-index: 10;
	}

	.selection-outline {
		border-radius: 8px;
	}

	.selection-border {
		position: absolute;
		inset: -2px;
		border: 2px dashed rgb(var(--color-primary-500));
		border-radius: 8px;
		animation: dash 1s linear infinite;
	}

	.resize-handles {
		position: absolute;
		inset: 0;
	}

	.resize-handle {
		position: absolute;
		width: 8px;
		height: 8px;
		background: rgb(var(--color-primary-500));
		border: 1px solid white;
		border-radius: 50%;
		opacity: 0.8;
	}

	.resize-handle.nw {
		top: -4px;
		left: -4px;
		cursor: nw-resize;
	}

	.resize-handle.ne {
		top: -4px;
		right: -4px;
		cursor: ne-resize;
	}

	.resize-handle.sw {
		bottom: -4px;
		left: -4px;
		cursor: sw-resize;
	}

	.resize-handle.se {
		bottom: -4px;
		right: -4px;
		cursor: se-resize;
	}

	.widget-actions {
		opacity: 0;
		transform: translateY(-4px);
		transition: all 0.2s ease;
	}

	.draggable-widget.selected .widget-actions {
		opacity: 1;
		transform: translateY(0);
	}

	@keyframes dash {
		to {
			stroke-dashoffset: -8px;
		}
	}
</style>