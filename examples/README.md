# SenseCanvas Examples

This directory contains example implementations demonstrating key patterns and components for the SenseCanvas sensor dashboard project. These examples showcase best practices for SvelteKit + Svelte 5 development with real-time sensor monitoring and **Cosmic UI integration**, plus React 19+ TypeScript adaptations.

## 🎨 Cosmic UI Integration

SenseCanvas uses **Cosmic UI** as its primary design system for creating a futuristic, sci-fi aesthetic. Key integration points:

- **SVG-first approach**: All components built with customizable SVG paths
- **Sci-fi color system**: Using Cosmic UI's CSS custom properties
- **Frame components**: Cosmic UI frames for widget containers and panels
- **Extensible design**: Custom sensor gauges extending Cosmic UI aesthetic

## 📁 Example Files

### **React TypeScript Adaptations** ⚛️

#### `CosmicSensorGauge.tsx` ✨ **NEW**
**Purpose**: React TypeScript adaptation of Cosmic UI sensor gauge

**Demonstrates**:
- Cosmic UI Frame integration with sensor data in React
- Framer Motion animations for smooth transitions
- React 19+ patterns with hooks and concurrent features
- TypeScript integration with strict typing
- Real-time sensor data with TanStack Query patterns

**Note**: *This example file will have linter errors until the React project is set up with proper dependencies (react, framer-motion, etc.). The examples are for reference and adaptation.*

### **Svelte Examples** (Original)

#### `CosmicFrame.svelte` ✨
**Purpose**: Svelte adaptation of Cosmic UI's Frame component

**Demonstrates**:
- Converting React-based Cosmic UI components to Svelte
- SVG-first design with customizable paths
- Responsive frame dimensions with percentage-based coordinates
- Cosmic UI color system integration

#### `CosmicSensorGauge.svelte` ✨
**Purpose**: Custom sensor gauge extending Cosmic UI aesthetic

**Demonstrates**:
- Cosmic UI Frame integration with sensor data
- Custom SVG gauge design with sci-fi styling
- Real-time animations with Svelte motion
- Gaming-inspired visual effects and glows

### `layoutStore.ts`
**Purpose**: Svelte 5 runes-based layout store for widget position management

**Demonstrates**:
- Svelte 5 `$state()` and `$effect()` usage
- Layout persistence with localStorage
- Widget collision detection
- Grid snapping utilities
- Import/export functionality

**Key Patterns**:
```typescript
// Svelte 5 reactive state
let currentLayout = $state<DashboardLayout>({...});

// Reactive getters
get current() { return currentLayout; }

// Effect for initialization
$effect(() => {
  if (browser) {
    loadLayoutFromStorage();
  }
});
```

### `ThemeConfig.js`
**Purpose**: Theme switching implementation using CSS custom properties

**Demonstrates**:
- Multiple sci-fi theme definitions (Cyberpunk, Neon, Gaming, Corporate)
- CSS custom property management
- Theme persistence with localStorage
- Cosmic UI color system integration

**Key Patterns**:
```javascript
// Theme switching with CSS variables
const applyTheme = (theme) => {
  Object.entries(theme.colors).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--color-${key}`, value);
  });
};
```

### `DashboardGrid.svelte`
**Purpose**: CSS Grid layout with automatic positioning and snap functionality

**Demonstrates**:
- CSS Grid with dynamic sizing and responsive breakpoints
- Grid snapping and collision detection algorithms
- Widget container management
- Boundary checking and validation

**Key Patterns**:
```svelte
<!-- CSS Grid with dynamic columns -->
<div 
  class="dashboard-grid" 
  style="grid-template-columns: repeat({gridCols}, 1fr);"
>
  {#each widgets as widget (widget.id)}
    <WidgetContainer {widget} />
  {/each}
</div>
```

### `DraggableWidget.svelte`
**Purpose**: NeoDrag integration for draggable/resizable widgets

**Demonstrates**:
- NeoDrag library integration with Svelte
- Position tracking and persistence
- Resize handles with boundary checking
- Grid snapping during drag operations

**Key Patterns**:
```svelte
<script>
  import { neoDrag } from '@neodrag/svelte';
  
  // NeoDrag configuration
  $: dragOptions = {
    bounds: 'parent',
    grid: [gridSize, gridSize],
    onDrag: handleDragMove
  };
</script>

<div use:neoDrag={dragOptions}>
  <!-- Widget content -->
</div>
```

## 🔧 Usage Notes

### **For React Development**
1. The React TypeScript examples (`.tsx` files) require a proper React project setup
2. Install dependencies: `react`, `framer-motion`, `@tanstack/react-query`, `zustand`
3. Configure TypeScript with proper type definitions
4. Set up Vite or your preferred build tool

### **For Svelte Development**
1. The Svelte examples require Svelte 5+ for runes syntax
2. Install dependencies: `@neodrag/svelte`, `svelte/motion`, etc.
3. Configure SvelteKit for TypeScript support

### **Cosmic UI Integration**
1. Install Cosmic UI dependencies: `@left4code/svg-renderer`, `chart.js`
2. Adapt React components to your chosen framework
3. Configure CSS custom properties for theming
4. Implement SVG path processing for responsive frames

### **Performance Considerations**
- Use virtualization for large widget grids (TanStack Virtual for React)
- Implement proper cleanup for WebSocket connections
- Optimize animations for 60fps performance
- Consider Canvas fallback for complex visualizations

### **Browser Compatibility**
- Requires modern browsers with SVG support
- CSS Container Queries support (optional enhancement)
- ES2020+ features required
- WebSocket support for real-time data

---

These examples provide a solid foundation for building either version of SenseCanvas. Choose the framework that best fits your project requirements and adapt the patterns accordingly.

## 🚀 Next Steps

1. **Choose your framework**: React 19+ or SvelteKit + Svelte 5
2. **Set up the project**: Use the respective project templates
3. **Install Cosmic UI**: Follow the integration guides
4. **Adapt examples**: Modify the examples for your specific needs
5. **Build custom components**: Extend Cosmic UI for sensor-specific widgets 