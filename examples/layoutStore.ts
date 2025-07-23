import { browser } from '$app/environment';

// Type definitions for layout management
export interface WidgetPosition {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: WidgetPosition[];
  gridSize: number;
  theme: string;
  created: number;
  modified: number;
}

// Svelte 5 runes-based layout store
let currentLayout = $state<DashboardLayout>({
  id: 'default',
  name: 'Default Layout',
  widgets: [],
  gridSize: 20,
  theme: 'dark',
  created: Date.now(),
  modified: Date.now()
});

let savedLayouts = $state<DashboardLayout[]>([]);

// Layout store with persistence
export const layoutStore = {
  // Reactive getters
  get current() { return currentLayout; },
  get saved() { return savedLayouts; },
  get widgets() { return currentLayout.widgets; },
  
  // Initialize from localStorage
  init() {
    if (!browser) return;
    
    try {
      const stored = localStorage.getItem('sensecanvas-layout');
      if (stored) {
        const parsed = JSON.parse(stored);
        currentLayout = { ...currentLayout, ...parsed };
      }
      
      const storedLayouts = localStorage.getItem('sensecanvas-saved-layouts');
      if (storedLayouts) {
        savedLayouts = JSON.parse(storedLayouts);
      }
    } catch (error) {
      console.warn('Failed to load layout from localStorage:', error);
    }
  },
  
  // Update widget position
  updateWidget(widgetId: string, position: Partial<WidgetPosition>) {
    const widgetIndex = currentLayout.widgets.findIndex(w => w.id === widgetId);
    
    if (widgetIndex >= 0) {
      // Update existing widget
      currentLayout.widgets[widgetIndex] = {
        ...currentLayout.widgets[widgetIndex],
        ...position
      };
    } else {
      // Add new widget
      currentLayout.widgets.push({
        id: widgetId,
        x: 0,
        y: 0,
        w: 4,
        h: 4,
        ...position
      });
    }
    
    currentLayout.modified = Date.now();
    this.persist();
  },
  
  // Remove widget
  removeWidget(widgetId: string) {
    currentLayout.widgets = currentLayout.widgets.filter(w => w.id !== widgetId);
    currentLayout.modified = Date.now();
    this.persist();
  },
  
  // Save current layout with a name
  saveLayout(name: string) {
    const newLayout: DashboardLayout = {
      ...currentLayout,
      id: `layout-${Date.now()}`,
      name,
      created: Date.now(),
      modified: Date.now()
    };
    
    savedLayouts.push(newLayout);
    this.persistSavedLayouts();
    return newLayout.id;
  },
  
  // Load a saved layout
  loadLayout(layoutId: string) {
    const layout = savedLayouts.find(l => l.id === layoutId);
    if (layout) {
      currentLayout = { ...layout };
      this.persist();
    }
  },
  
  // Reset to default layout
  resetLayout() {
    currentLayout = {
      id: 'default',
      name: 'Default Layout',
      widgets: [],
      gridSize: 20,
      theme: currentLayout.theme, // Keep current theme
      created: Date.now(),
      modified: Date.now()
    };
    this.persist();
  },
  
  // Update grid size
  setGridSize(size: number) {
    currentLayout.gridSize = Math.max(10, Math.min(50, size)); // Clamp between 10-50
    currentLayout.modified = Date.now();
    this.persist();
  },
  
  // Update theme
  setTheme(theme: string) {
    currentLayout.theme = theme;
    currentLayout.modified = Date.now();
    this.persist();
  },
  
  // Export layout as JSON
  exportLayout() {
    return JSON.stringify(currentLayout, null, 2);
  },
  
  // Import layout from JSON
  importLayout(jsonString: string) {
    try {
      const imported = JSON.parse(jsonString);
      
      // Validate imported layout
      if (imported.widgets && Array.isArray(imported.widgets)) {
        currentLayout = {
          id: `imported-${Date.now()}`,
          name: imported.name || 'Imported Layout',
          widgets: imported.widgets,
          gridSize: imported.gridSize || 20,
          theme: imported.theme || 'dark',
          created: Date.now(),
          modified: Date.now()
        };
        this.persist();
        return true;
      }
    } catch (error) {
      console.error('Failed to import layout:', error);
    }
    return false;
  },
  
  // Check for widget collisions
  hasCollision(widget: WidgetPosition, excludeId?: string): boolean {
    return currentLayout.widgets.some(w => {
      if (w.id === excludeId) return false;
      
      return !(
        widget.x >= w.x + w.w ||
        widget.x + widget.w <= w.x ||
        widget.y >= w.y + w.h ||
        widget.y + widget.h <= w.y
      );
    });
  },
  
  // Snap position to grid
  snapToGrid(x: number, y: number): { x: number; y: number } {
    const grid = currentLayout.gridSize;
    return {
      x: Math.round(x / grid) * grid,
      y: Math.round(y / grid) * grid
    };
  },
  
  // Persist current layout to localStorage
  persist() {
    if (!browser) return;
    
    try {
      localStorage.setItem('sensecanvas-layout', JSON.stringify(currentLayout));
    } catch (error) {
      console.warn('Failed to persist layout:', error);
    }
  },
  
  // Persist saved layouts to localStorage
  persistSavedLayouts() {
    if (!browser) return;
    
    try {
      localStorage.setItem('sensecanvas-saved-layouts', JSON.stringify(savedLayouts));
    } catch (error) {
      console.warn('Failed to persist saved layouts:', error);
    }
  }
};

// Initialize store when module loads
$effect(() => {
  layoutStore.init();
}); 