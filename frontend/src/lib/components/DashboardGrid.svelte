<script lang="ts">
	import { layoutStore, currentLayout, selectedWidgets, isEditMode } from '$lib/stores/layoutStore';
	import { get } from 'svelte/store';
	import DraggableWidget from './DraggableWidget.svelte';

	let dashboardElement: HTMLDivElement;
	$: gridSize = $currentLayout?.gridSize || 20;

	function handleCanvasClick(event: MouseEvent) {
		if (event.target === dashboardElement) {
			layoutStore.clearSelection();
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (!$isEditMode) return;

		switch (event.key) {
			case 'Delete':
			case 'Backspace':
				event.preventDefault();
				$selectedWidgets.forEach(widgetId => {
					layoutStore.removeWidget(widgetId);
				});
				break;
			case 'Escape':
				event.preventDefault();
				layoutStore.clearSelection();
				break;
		}
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

<div
	bind:this={dashboardElement}
	class="dashboard-grid relative w-full h-full overflow-hidden"
	class:edit-mode={$isEditMode}
	onclick={handleCanvasClick}
	role="region"
>
	<!-- Grid Overlay (Edit Mode) -->
	{#if $isEditMode}
		<div 
			class="grid-overlay absolute inset-0 pointer-events-none opacity-20"
			style="
				background-image: 
					linear-gradient(to right, rgb(var(--color-surface-400)) 1px, transparent 1px),
					linear-gradient(to bottom, rgb(var(--color-surface-400)) 1px, transparent 1px);
				background-size: {gridSize}px {gridSize}px;
			"
		></div>
	{/if}

	<!-- Widgets -->
	{#each ($currentLayout?.widgets || []) as widget (widget.id)}
		<DraggableWidget {widget} />
	{/each}

	<!-- Edit Mode Instructions -->
	{#if $isEditMode && (!$currentLayout?.widgets || $currentLayout.widgets.length === 0)}
		<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
			<div class="text-center text-surface-500 dark:text-surface-400">
				<div class="text-4xl mb-4">🎛️</div>
				<h3 class="text-lg font-semibold mb-2">Dashboard is Empty</h3>
				<p class="text-sm">Add widgets from the toolbar to get started</p>
			</div>
		</div>
	{/if}

	<!-- Selection Info -->
	{#if $isEditMode && $selectedWidgets.length > 0}
		<div class="absolute bottom-4 left-4 bg-surface-100-800-token rounded-lg px-3 py-2 text-sm">
			{$selectedWidgets.length} widget{$selectedWidgets.length > 1 ? 's' : ''} selected
		</div>
	{/if}
</div>

<style>
	.dashboard-grid {
		background: radial-gradient(circle at 50% 50%, rgba(var(--color-primary-500), 0.05) 0%, transparent 50%);
		min-height: 600px;
	}

	.dashboard-grid.edit-mode {
		cursor: crosshair;
	}

	.dashboard-grid:focus {
		outline: none;
	}

	.grid-overlay {
		background-attachment: local;
	}
</style>