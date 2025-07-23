<script lang="ts">
	import type { Size } from '$lib/types/dashboard'

	interface Props {
		visible: boolean;
		onResize?: (handle: string, deltaX: number, deltaY: number) => void;
	}

	let { onResize, onResizeEnd }: Props = $props()

	let isResizing = $state(false)
	let resizeHandle = $state<string | null>(null)
	let startSize = $state<Size>({ width: 0, height: 0 })
	let startMouse = $state({ x: 0, y: 0 })

	function handleMouseDown(handle: string, event: MouseEvent) {
		event.stopPropagation()
		event.preventDefault()
		
		isResizing = true
		resizeHandle = handle
		startMouse = { x: event.clientX, y: event.clientY }
		
		// Get current size from parent element
		const parentElement = (event.target as HTMLElement).parentElement
		if (parentElement) {
			const rect = parentElement.getBoundingClientRect()
			startSize = { width: rect.width, height: rect.height }
		}

		document.addEventListener('mousemove', handleMouseMove)
		document.addEventListener('mouseup', handleMouseUp)
	}

	function handleMouseMove(event: MouseEvent) {
		if (!isResizing || !resizeHandle) return

		const deltaX = event.clientX - startMouse.x
		const deltaY = event.clientY - startMouse.y

		let newWidth = startSize.width
		let newHeight = startSize.height

		// Calculate new size based on resize handle
		switch (resizeHandle) {
			case 'se': // Southeast
				newWidth = Math.max(100, startSize.width + deltaX)
				newHeight = Math.max(80, startSize.height + deltaY)
				break
			case 'sw': // Southwest
				newWidth = Math.max(100, startSize.width - deltaX)
				newHeight = Math.max(80, startSize.height + deltaY)
				break
			case 'ne': // Northeast
				newWidth = Math.max(100, startSize.width + deltaX)
				newHeight = Math.max(80, startSize.height - deltaY)
				break
			case 'nw': // Northwest
				newWidth = Math.max(100, startSize.width - deltaX)
				newHeight = Math.max(80, startSize.height - deltaY)
				break
			case 'e': // East
				newWidth = Math.max(100, startSize.width + deltaX)
				break
			case 'w': // West
				newWidth = Math.max(100, startSize.width - deltaX)
				break
			case 's': // South
				newHeight = Math.max(80, startSize.height + deltaY)
				break
			case 'n': // North
				newHeight = Math.max(80, startSize.height - deltaY)
				break
		}

		onResize({ width: newWidth, height: newHeight })
	}

	function handleMouseUp() {
		if (isResizing) {
			isResizing = false
			resizeHandle = null
			onResizeEnd()
			
			document.removeEventListener('mousemove', handleMouseMove)
			document.removeEventListener('mouseup', handleMouseUp)
		}
	}
</script>

<div class="resize-handles absolute inset-0 pointer-events-none">
	<!-- Corner handles -->
	<div
		class="resize-handle corner nw-resize absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-full pointer-events-auto cursor-nw-resize"
		onmousedown={(e) => handleMouseDown('nw', e)}
		role="button"
		tabindex="0"
		onkeydown={(e) => { if (e.key === 'Enter') handleMouseDown('nw', e as unknown as MouseEvent); }}
	></div>
	<div
		class="resize-handle corner ne-resize absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-full pointer-events-auto cursor-ne-resize"
		onmousedown={(e) => handleMouseDown('ne', e)}
		role="button"
		tabindex="0"
		onkeydown={(e) => { if (e.key === 'Enter') handleMouseDown('ne', e as unknown as MouseEvent); }}
	></div>
	<div
		class="resize-handle corner sw-resize absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-full pointer-events-auto cursor-sw-resize"
		onmousedown={(e) => handleMouseDown('sw', e)}
		role="button"
		tabindex="0"
		onkeydown={(e) => { if (e.key === 'Enter') handleMouseDown('sw', e as unknown as MouseEvent); }}
	></div>
	<div
		class="resize-handle corner se-resize absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-full pointer-events-auto cursor-se-resize"
		onmousedown={(e) => handleMouseDown('se', e)}
		role="button"
		tabindex="0"
		onkeydown={(e) => { if (e.key === 'Enter') handleMouseDown('se', e as unknown as MouseEvent); }}
	></div>

	<!-- Edge handles -->
	<div
		class="resize-handle edge n-resize absolute -top-1 left-1/2 transform -translate-x-1/2 w-6 h-2 bg-blue-500 border border-white rounded pointer-events-auto cursor-n-resize"
		onmousedown={(e) => handleMouseDown('n', e)}
		role="button"
		tabindex="0"
		onkeydown={(e) => { if (e.key === 'Enter') handleMouseDown('n', e as unknown as MouseEvent); }}
	></div>
	<div
		class="resize-handle edge s-resize absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-2 bg-blue-500 border border-white rounded pointer-events-auto cursor-s-resize"
		onmousedown={(e) => handleMouseDown('s', e)}
		role="button"
		tabindex="0"
		onkeydown={(e) => { if (e.key === 'Enter') handleMouseDown('s', e as unknown as MouseEvent); }}
	></div>
	<div
		class="resize-handle edge w-resize absolute top-1/2 -left-1 transform -translate-y-1/2 w-2 h-6 bg-blue-500 border border-white rounded pointer-events-auto cursor-w-resize"
		onmousedown={(e) => handleMouseDown('w', e)}
		role="button"
		tabindex="0"
		onkeydown={(e) => { if (e.key === 'Enter') handleMouseDown('w', e as unknown as MouseEvent); }}
	></div>
	<div
		class="resize-handle edge e-resize absolute top-1/2 -right-1 transform -translate-y-1/2 w-2 h-6 bg-blue-500 border border-white rounded pointer-events-auto cursor-e-resize"
		onmousedown={(e) => handleMouseDown('e', e)}
		role="button"
		tabindex="0"
		onkeydown={(e) => { if (e.key === 'Enter') handleMouseDown('e', e as unknown as MouseEvent); }}
	></div>
</div>

<style>
	.resize-handle {
		opacity: 0;
		transition: opacity 0.2s ease;
		z-index: 10;
	}

	.resize-handles:hover .resize-handle {
		opacity: 1;
	}

	.resize-handle:hover {
		opacity: 1 !important;
		transform: scale(1.2);
	}
</style>