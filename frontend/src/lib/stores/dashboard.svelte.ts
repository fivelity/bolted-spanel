import { writable } from "svelte/store";
import { nanoid } from "nanoid";
import type {
  DashboardLayout,
  WidgetConfig,
  DashboardState,
  WidgetTemplate,
  Theme,
  Position,
  Size,
} from "../types/dashboard";
import type { LayoutSuggestion } from "../types/ai";

// Create initial dashboard state
const initialState: DashboardState = {
  currentLayout: null,
  layouts: [],
  selectedWidgets: [],
  dragState: {
    isDragging: false,
    draggedWidget: null,
    dragOffset: { x: 0, y: 0 },
    snapToGrid: true,
    gridSize: 20,
  },
  resizeState: {
    isResizing: false,
    resizedWidget: null,
    resizeHandle: null,
  },
  widgetBuilder: {
    isOpen: false,
    mode: "create",
    selectedWidget: null,
    previewData: null,
    activeTab: "general",
  },
  isGridVisible: true,
  zoom: 1,
  history: [],
  historyIndex: -1,
  aiLayout: {
    isOpen: false,
    suggestions: [],
  },
};

// Main dashboard store
export const dashboardState = writable<DashboardState>(initialState);

// Derived stores for easier access
export const currentLayout = writable<DashboardLayout | null>(null);
export const selectedWidgets = writable<string[]>([]);
export const dragState = writable(initialState.dragState);
export const widgetBuilder = writable(initialState.widgetBuilder);

// Widget templates
export const widgetTemplates: WidgetTemplate[] = [
  {
    id: "circular-gauge-cpu",
    name: "CPU Gauge",
    description:
      "Circular gauge showing CPU usage with customizable thresholds",
    type: "circular-gauge",
    preview: "/templates/circular-gauge.png",
    category: "system",
    config: {
      size: { width: 200, height: 200 },
      config: {
        min: 0,
        max: 100,
        unit: "%",
        colors: ["#22c55e", "#f59e0b", "#ef4444"],
        thresholds: [70, 90],
      },
      dataSource: "cpu.usage",
    },
  },
  {
    id: "gauge-gpu",
    name: "GPU Usage",
    description: "Simple gauge for GPU monitoring",
    type: "gauge",
    preview: "/templates/gauge.png",
    category: "system",
    config: {
      size: { width: 200, height: 200 },
      config: {
        colors: ["#3b82f6", "#8b5cf6", "#ef4444"],
        thresholds: [75, 90],
      },
      dataSource: "gpu.usage",
    },
  },
  {
    id: "meter-memory",
    name: "Memory Bar",
    description: "Linear meter showing memory usage",
    type: "meter",
    preview: "/templates/meter.png",
    category: "system",
    config: {
      size: { width: 300, height: 80 },
      config: {
        colors: ["#06b6d4", "#f59e0b", "#ef4444"],
        thresholds: [80, 95],
      },
      dataSource: "memory.usage",
    },
  },
  {
    id: "simple-temp",
    name: "Temperature Display",
    description: "Simple text display for temperature values",
    type: "simple",
    preview: "/templates/simple.png",
    category: "system",
    config: {
      size: { width: 150, height: 100 },
      config: {
        unit: "°C",
      },
      dataSource: "cpu.temperature",
    },
  },
  {
    id: "speedometer-perf",
    name: "Performance Speedometer",
    description: "Speedometer-style gauge for performance monitoring",
    type: "speedometer",
    preview: "/templates/speedometer.png",
    category: "performance",
    config: {
      size: { width: 250, height: 250 },
      config: {
        min: 0,
        max: 100,
        unit: "%",
        colors: ["#10b981", "#f59e0b", "#ef4444"],
      },
      dataSource: "cpu.usage",
    },
  },
  {
    id: "kpi-card-overview",
    name: "System Overview",
    description: "KPI card showing multiple system metrics",
    type: "kpi-card",
    preview: "/templates/kpi-card.png",
    category: "system",
    config: {
      size: { width: 280, height: 160 },
      config: {
        metrics: ["cpu.usage", "memory.usage", "gpu.usage"],
      },
    },
  },
];

// Themes
export const themes: Theme[] = [
  {
    id: "dark-gaming",
    name: "Dark Gaming",
    isDark: true,
    colors: {
      primary: "#8b5cf6",
      secondary: "#06b6d4",
      accent: "#f59e0b",
      background: "#0f172a",
      surface: "#1e293b",
      text: "#f8fafc",
      textSecondary: "#cbd5e1",
      border: "#334155",
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
      info: "#06b6d4",
    },
  },
  {
    id: "light-minimal",
    name: "Light Minimal",
    isDark: false,
    colors: {
      primary: "#6366f1",
      secondary: "#8b5cf6",
      accent: "#06b6d4",
      background: "#ffffff",
      surface: "#f8fafc",
      text: "#1e293b",
      textSecondary: "#64748b",
      border: "#e2e8f0",
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
      info: "#06b6d4",
    },
  },
  {
    id: "neon-cyber",
    name: "Neon Cyber",
    isDark: true,
    colors: {
      primary: "#00ff88",
      secondary: "#ff0080",
      accent: "#00d4ff",
      background: "#000011",
      surface: "#1a1a2e",
      text: "#ffffff",
      textSecondary: "#cccccc",
      border: "#333366",
      success: "#00ff88",
      warning: "#ffaa00",
      error: "#ff0080",
      info: "#00d4ff",
    },
  },
];

export const currentTheme = writable<Theme | null>(null);

// Dashboard actions
export const dashboardActions = {
  // Layout management
  createLayout: (name: string, description?: string): DashboardLayout => {
    const newLayout: DashboardLayout = {
      id: nanoid(),
      name,
      description,
      widgets: [],
      gridSize: 20,
      snapToGrid: true,
      theme: "dark-gaming",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dashboardState.update((state) => ({
      ...state,
      layouts: [...state.layouts, newLayout],
      currentLayout: newLayout,
    }));

    currentLayout.set(newLayout);

    return newLayout;
  },

  loadLayout: (layout: DashboardLayout): void => {
    dashboardState.update((state) => ({
      ...state,
      currentLayout: layout,
    }));
    currentLayout.set(layout);
  },

  saveLayout: (): void => {
    dashboardState.update((state) => {
      if (!state.currentLayout) return state;

      const updatedLayout = {
        ...state.currentLayout,
        updatedAt: new Date(),
      };

      const layouts = state.layouts.map((layout: DashboardLayout) =>
        layout.id === updatedLayout.id ? updatedLayout : layout,
      );

      return {
        ...state,
        layouts,
        currentLayout: updatedLayout,
      };
    });
  },

  // Widget management
  addWidget: (template: WidgetTemplate, position?: Position): WidgetConfig => {
    const widget: WidgetConfig = {
      id: nanoid(),
      ...template.config,
      position: position || { x: 100, y: 100 },
      size: template.config.size || { width: 200, height: 200 },
    } as WidgetConfig;

    dashboardState.update((state) => {
      if (!state.currentLayout) return state;

      const updatedLayout = {
        ...state.currentLayout,
        widgets: [...state.currentLayout.widgets, widget],
      };

      currentLayout.set(updatedLayout);

      return {
        ...state,
        currentLayout: updatedLayout,
      };
    });

    return widget;
  },

  updateWidget: (widgetId: string, updates: Partial<WidgetConfig>): void => {
    dashboardState.update((state) => {
      if (!state.currentLayout) return state;

      const updatedLayout = {
        ...state.currentLayout,
        widgets: state.currentLayout.widgets.map((widget: WidgetConfig) =>
          widget.id === widgetId ? { ...widget, ...updates } : widget,
        ),
      };

      currentLayout.set(updatedLayout);

      return {
        ...state,
        currentLayout: updatedLayout,
      };
    });
  },

  removeWidget: (widgetId: string): void => {
    dashboardState.update((state) => {
      if (!state.currentLayout) return state;

      const updatedLayout = {
        ...state.currentLayout,
        widgets: state.currentLayout.widgets.filter(
          (widget: WidgetConfig) => widget.id !== widgetId,
        ),
      };

      currentLayout.set(updatedLayout);

      return {
        ...state,
        currentLayout: updatedLayout,
      };
    });
  },

  // Selection management
  selectWidget: (widgetId: string, multiSelect = false): void => {
    dashboardState.update((state) => {
      const newSelected = multiSelect
        ? [...state.selectedWidgets, widgetId]
        : [widgetId];

      selectedWidgets.set(newSelected);

      return {
        ...state,
        selectedWidgets: newSelected,
      };
    });
  },

  deselectWidget: (widgetId: string): void => {
    dashboardState.update((state) => {
      const newSelected = state.selectedWidgets.filter(
        (id: string) => id !== widgetId,
      );

      selectedWidgets.set(newSelected);

      return {
        ...state,
        selectedWidgets: newSelected,
      };
    });
  },

  clearSelection: (): void => {
    selectedWidgets.set([]);
    dashboardState.update((state) => ({
      ...state,
      selectedWidgets: [],
    }));
  },

  // Drag and drop
  startDrag: (widgetId: string, offset: Position): void => {
    const newDragState = {
      isDragging: true,
      draggedWidget: widgetId,
      dragOffset: offset,
      snapToGrid: true,
      gridSize: 20,
    };

    dragState.set(newDragState);

    dashboardState.update((state) => ({
      ...state,
      dragState: newDragState,
    }));
  },

  updateDrag: (position: Position): void => {
    dashboardState.update((state) => {
      if (!state.dragState.draggedWidget || !state.currentLayout) return state;

      const snappedPosition = state.dragState.snapToGrid
        ? {
            x:
              Math.round(position.x / state.dragState.gridSize) *
              state.dragState.gridSize,
            y:
              Math.round(position.y / state.dragState.gridSize) *
              state.dragState.gridSize,
          }
        : position;

      const updatedLayout = {
        ...state.currentLayout,
        widgets: state.currentLayout.widgets.map((widget: WidgetConfig) =>
          widget.id === state.dragState.draggedWidget
            ? { ...widget, position: snappedPosition }
            : widget,
        ),
      };

      currentLayout.set(updatedLayout);

      return {
        ...state,
        currentLayout: updatedLayout,
      };
    });
  },

  endDrag: (): void => {
    const newDragState = {
      isDragging: false,
      draggedWidget: null,
      dragOffset: { x: 0, y: 0 },
      snapToGrid: true,
      gridSize: 20,
    };

    dragState.set(newDragState);

    dashboardState.update((state) => ({
      ...state,
      dragState: newDragState,
    }));
  },

  // Widget builder
  openWidgetBuilder: (mode: "create" | "edit", widget?: WidgetConfig): void => {
    const newBuilderState = {
      isOpen: true,
      mode,
      selectedWidget: widget || null,
      previewData: null,
      activeTab: "general" as const,
    };

    widgetBuilder.set(newBuilderState);

    dashboardState.update((state) => ({
      ...state,
      widgetBuilder: newBuilderState,
    }));
  },

  closeWidgetBuilder: (): void => {
    const newBuilderState = {
      isOpen: false,
      mode: "create" as const,
      selectedWidget: null,
      previewData: null,
      activeTab: "general" as const,
    };

    widgetBuilder.set(newBuilderState);

    dashboardState.update((state) => ({
      ...state,
      widgetBuilder: newBuilderState,
    }));
  },

  // Grid and zoom
  toggleGrid: (): void => {
    dashboardState.update((state) => ({
      ...state,
      isGridVisible: !state.isGridVisible,
    }));
  },

  setZoom: (zoom: number): void => {
    dashboardState.update((state) => ({
      ...state,
      zoom: Math.max(0.25, Math.min(2, zoom)),
    }));
  },

  // History (undo/redo)
  saveToHistory: (): void => {
    dashboardState.update((state) => {
      if (!state.currentLayout) return state;

      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(state.currentLayout)));

      return {
        ...state,
        history: newHistory.slice(-50), // Keep last 50 states
        historyIndex: Math.min(newHistory.length - 1, 49),
      };
    });
  },

  undo: (): void => {
    dashboardState.update((state) => {
      if (state.historyIndex <= 0) return state;

      const previousLayout = state.history[state.historyIndex - 1];
      const restoredLayout = JSON.parse(JSON.stringify(previousLayout));

      currentLayout.set(restoredLayout);

      return {
        ...state,
        currentLayout: restoredLayout,
        historyIndex: state.historyIndex - 1,
      };
    });
  },

  redo: (): void => {
    dashboardState.update((state) => {
      if (state.historyIndex >= state.history.length - 1) return state;

      const nextLayout = state.history[state.historyIndex + 1];
      const restoredLayout = JSON.parse(JSON.stringify(nextLayout));

      currentLayout.set(restoredLayout);

      return {
        ...state,
        currentLayout: restoredLayout,
        historyIndex: state.historyIndex + 1,
      };
    });
  },

  // AI Layout
  openAILayoutModal: (): void => {
    dashboardState.update((state) => ({
      ...state,
      aiLayout: { ...state.aiLayout, isOpen: true },
    }));
  },

  closeAILayoutModal: (): void => {
    dashboardState.update((state) => ({
      ...state,
      aiLayout: { ...state.aiLayout, isOpen: false },
    }));
  },

  applyLayoutSuggestion: (suggestion: LayoutSuggestion): void => {
    dashboardState.update((state) => {
      if (!state.currentLayout) return state;

      const updatedLayout = {
        ...state.currentLayout,
        widgets: suggestion.widgets,
      };

      currentLayout.set(updatedLayout);

      return {
        ...state,
        currentLayout: updatedLayout,
      };
    });
  },
};

// Initialize with default layout
dashboardActions.createLayout(
  "Default Dashboard",
  "Your main hardware monitoring dashboard",
);
