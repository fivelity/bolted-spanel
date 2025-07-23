<script lang="ts">
	import { onMount } from 'svelte'
	import { dashboardState, dashboardActions, currentLayout } from '$lib/stores/dashboard'
	import { hardwareData } from '$lib/stores/hardware'
	import DraggableWidget from './DraggableWidget.svelte'
	import GridOverlay from './GridOverlay.svelte'
	import SelectionBox from './SelectionBox.svelte'
	import type { Position } from '$lib/types/dashboard'

	let canvasElement: HTMLDivElement
	let isSelecting = $state(false)
	let selectionStart = $state<Position>({ x: 0, y: 0 })
	let selectionEnd = $state<Position>({ x: 0, y: 0 })

	// Handle canvas click for deselection
	function handleCanvasClick(event: MouseEvent) {
		if (event.target === canvasElement) {
			dashboardActions.clearSelection()
		}
	}

	// Handle drag over for widget dropping
	function handleDragOver(event: DragEvent) {
		event.preventDefault()
	}

	// Handle drop for new widgets
	function handleDrop(event: DragEvent) {
		event.preventDefault()
		
		const templateId = event.dataTransfer?.getData('text/template-id')
		if (!templateId) return

		const rect = canvasElement.getBoundingClientRect()
		const position: Position = {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top
		}

		// Find template and add widget
		// This would be implemented with the template system
		console.log('Drop widget template:', templateId, 'at position:', position)
	}

	// Handle selection box
	function handleMouseDown(event: MouseEvent) {
		if (event.target !== canvasElement) return
		
		isSelecting = true
		const rect = canvasElement.getBoundingClientRect()
		selectionStart = {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top
		}
		selectionEnd = { ...selectionStart }
	}

	function handleMouseMove(event: MouseEvent) {
		if (!isSelecting) return
		
		const rect = canvasElement.getBoundingClientRect()
		selectionEnd = {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top
		}
	}

	function handleMouseUp() {
		if (!isSelecting) return
		
		isSelecting = false
		
		// Select widgets within selection box
		if ($currentLayout) {
			const minX = Math.min(selectionStart.x, selectionEnd.x)
			const maxX = Math.max(selectionStart.x, selectionEnd.x)
			const minY = Math.min(selectionStart.y, selectionEnd.y)
			const maxY = Math.max(selectionStart.y, selectionEnd.y)

			$currentLayout.widgets.forEach(widget => {
				const widgetRight = widget.position.x + widget.size.width
				const widgetBottom = widget.position.y + widget.size.height

				if (
					widget.position.x < maxX &&
					widgetRight > minX &&
					widget.position.y < maxY &&
					widgetBottom > minY
				) {
					dashboardActions.selectWidget(widget.id, true)
				}
			})
		}
	}

	// Keyboard shortcuts
	function handleKeyDown(event: KeyboardEvent) {
		if (event.ctrlKey || event.metaKey) {
			switch (event.key) {
				case 'z':
					event.preventDefault()
					if (event.shiftKey) {
						dashboardActions.redo()
					} else {
						dashboardActions.undo()
					}
					break
				case 'a':
					event.preventDefault()
					if ($currentLayout) {
						$currentLayout.widgets.forEach(widget => {
							dashboardActions.selectWidget(widget.id, true)
						})
					}
					break
				case 'Delete':
				case 'Backspace':
					event.preventDefault()
					$dashboardState.selectedWidgets.forEach(widgetId => {
						dashboardActions.removeWidget(widgetId)
					})
					dashboardActions.clearSelection()
					break
			}
		}
	}

	onMount(() => {
		document.addEventListener('keydown', handleKeyDown)
		return () => {
			document.removeEventListener('keydown', handleKeyDown)
		}
	})
</script>

<div
	bind:this={canvasElement}
	class="dashboard-canvas relative w-full h-full overflow-hidden bg-gray-50 dark:bg-gray-900"
	style="transform: scale({$dashboardState.zoom}); transform-origin: top left;"
	onclick={handleCanvasClick}
	ondragover={handleDragOver}
	ondrop={handleDrop}
	onmousedown={handleMouseDown}
	onmousemove={handleMouseMove}
	onmouseup={handleMouseUp}
	onkeydown={handleKeyDown}
	role="application"
>
	<!-- Grid overlay -->
	{#if $dashboardState.isGridVisible}
		<GridOverlay 
			gridSize={$dashboardState.dragState.gridSize} 
			zoom={$dashboardState.zoom}
		/>
	{/if}

	<!-- Widgets -->
	{#if $currentLayout}
		{#each $currentLayout.widgets as widget (widget.id)}
			<DraggableWidget 
				widget={widget as any} // Temporary type cast, fix types
				isSelected={$dashboardState.selectedWidgets.includes(widget.id)}
				hardwareData={$hardwareData}
				onSelect={(multiSelect) => dashboardActions.selectWidget(widget.id, multiSelect)}
				onDeselect={() => dashboardActions.deselectWidget(widget.id)}
				onUpdate={(updates) => dashboardActions.updateWidget(widget.id, updates)}
				onRemove={() => dashboardActions.removeWidget(widget.id)}
			/>
		{/each}
	{/if}

	<!-- Selection box -->
	{#if isSelecting}
		<SelectionBox 
			start={selectionStart}
			end={selectionEnd}
		/>
	{/if}

	<!-- Drop zones and guides would go here -->
</div>

<style>
	.dashboard-canvas {
		cursor: crosshair;
		user-select: none;
	}

	.dashboard-canvas:focus {
		outline: none;
	}
</style>