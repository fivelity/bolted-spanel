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
    id: "cosmic-gauge-cpu",
    name: "CPU Gauge",
    description: "Enhanced circular gauge with segmented arcs for CPU monitoring",
    type: "cosmic-gauge",
    preview: "/templates/cosmic-gauge.png",
    category: "system",
    config: {
      size: { width: 200, height: 200 },
      config: {
        min: 0,
        max: 100,
        unit: "%",
        warningThreshold: 70,
        criticalThreshold: 90,
        icon: "",
      },
      dataSource: "cpu.usage",
    },
  },
  {
    id: "cosmic-gauge-gpu",
    name: "GPU Gauge",
    description: "Enhanced circular gauge for GPU usage monitoring",
    type: "cosmic-gauge",
    preview: "/templates/cosmic-gauge.png",
    category: "system",
    config: {
      size: { width: 200, height: 200 },
      config: {
        min: 0,
        max: 100,
        unit: "%",
        warningThreshold: 80,
        criticalThreshold: 95,
        icon: "",
      },
      dataSource: "gpu.usage",
    },
  },
  {
    id: "cosmic-gauge-memory",
    name: "Memory Gauge",
    description: "Enhanced circular gauge for memory usage monitoring",
    type: "cosmic-gauge",
    preview: "/templates/cosmic-gauge.png",
    category: "system",
    config: {
      size: { width: 200, height: 200 },
      config: {
        min: 0,
        max: 100,
        unit: "%",
        warningThreshold: 75,
        criticalThreshold: 90,
        icon: "",
      },
      dataSource: "memory.usage",
    },
  },
  {
    id: "cosmic-gauge-temp",
    name: "Temperature Gauge",
    description: "Enhanced circular gauge for temperature monitoring",
    type: "cosmic-gauge",
    preview: "/templates/cosmic-gauge.png",
    category: "system",
    config: {
      size: { width: 200, height: 200 },
      config: {
        min: 0,
        max: 100,
        unit: "°C",
        warningThreshold: 70,
        criticalThreshold: 85,
        icon: "",
      },
      dataSource: "cpu.temperature",
    },
  },
  {
    id: "cosmic-linear-disk",
    name: "Disk Usage Meter",
    description: "Linear meter with segmented bars for disk usage",
    type: "cosmic-linear",
    preview: "/templates/cosmic-linear.png",
    category: "system",
    config: {
      size: { width: 300, height: 120 },
      config: {
        min: 0,
        max: 100,
        unit: "%",
        warningThreshold: 80,
        criticalThreshold: 95,
        icon: "",
      },
      dataSource: "disk.usage",
    },
  },
  {
    id: "cosmic-linear-network",
    name: "Network Meter",
    description: "Linear meter for network usage monitoring",
    type: "cosmic-linear",
    preview: "/templates/cosmic-linear.png",
    category: "system",
    config: {
      size: { width: 300, height: 120 },
      config: {
        min: 0,
        max: 100,
        unit: "Mbps",
        warningThreshold: 80,
        criticalThreshold: 95,
        icon: "",
      },
      dataSource: "network.usage",
    },
  },
  {
    id: "cosmic-kpi-overview",
    name: "System Overview KPI",
    description: "Multi-metric KPI card showing system overview",
    type: "cosmic-kpi",
    preview: "/templates/cosmic-kpi.png",
    category: "system",
    config: {
      size: { width: 320, height: 200 },
      config: {
        title: "System Overview",
        metrics: [
          { label: "CPU", dataSource: "cpu.usage", unit: "%", icon: "", threshold: { warning: 70, critical: 90 } },
          { label: "Memory", dataSource: "memory.usage", unit: "%", icon: "", threshold: { warning: 75, critical: 90 } },
          { label: "GPU", dataSource: "gpu.usage", unit: "%", icon: "", threshold: { warning: 80, critical: 95 } },
          { label: "Temp", dataSource: "cpu.temperature", unit: "°C", icon: "", threshold: { warning: 70, critical: 85 } },
        ],
      },
    },
  },
  {
    id: "cosmic-kpi-performance",
    name: "Performance KPI",
    description: "Performance metrics KPI card",
    type: "cosmic-kpi",
    preview: "/templates/cosmic-kpi.png",
    category: "performance",
    config: {
      size: { width: 320, height: 200 },
      config: {
        title: "Performance Metrics",
        metrics: [
          { label: "FPS", dataSource: "performance.fps", unit: "fps", icon: "", threshold: { warning: 30, critical: 15 } },
          { label: "Frame Time", dataSource: "performance.frametime", unit: "ms", icon: "", threshold: { warning: 33, critical: 66 } },
          { label: "CPU Load", dataSource: "cpu.load", unit: "%", icon: "", threshold: { warning: 70, critical: 90 } },
          { label: "GPU Load", dataSource: "gpu.load", unit: "%", icon: "", threshold: { warning: 80, critical: 95 } },
        ],
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
  createLayout(name: string, description?: string): DashboardLayout {
    const newLayout: DashboardLayout = {
      id: nanoid(),
      name,
      description: description || "",
      widgets: [],
      gridSize: 20,
      snapToGrid: true,
      theme: "dark-gaming",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dashboardState.update((state) => {
      const updatedLayouts = [...state.layouts, newLayout];
      const updatedState = {
        ...state,
        layouts: updatedLayouts,
        currentLayout: newLayout,
      };

      currentLayout.set(newLayout);
      return updatedState;
    });

    return newLayout;
  },

  createDefaultLayout(): DashboardLayout {
    const defaultLayout: DashboardLayout = {
      id: "default-layout",
      name: "Default Dashboard",
      description: "Enhanced hardware monitoring dashboard with Cosmic UI",
      widgets: [
        // First row - Primary system gauges (20px grid spacing)
        {
          id: nanoid(),
          templateId: "cosmic-gauge-cpu",
          type: "cosmic-gauge",
          position: { x: 40, y: 40 },
          size: { width: 220, height: 220 },
          config: {
            label: "CPU Usage",
            dataSource: "cpu.usage",
            min: 0,
            max: 100,
            unit: "%",
            warningThreshold: 70,
            criticalThreshold: 90,
            icon: "🔥",
          },
          zIndex: 1,
          isLocked: false,
        },
        {
          id: nanoid(),
          templateId: "cosmic-gauge-gpu",
          type: "cosmic-gauge",
          position: { x: 280, y: 40 },
          size: { width: 220, height: 220 },
          config: {
            label: "GPU Usage",
            dataSource: "gpu.usage",
            min: 0,
            max: 100,
            unit: "%",
            warningThreshold: 80,
            criticalThreshold: 95,
            icon: "⚡",
          },
          zIndex: 2,
          isLocked: false,
        },
        {
          id: nanoid(),
          templateId: "cosmic-gauge-memory",
          type: "cosmic-gauge",
          position: { x: 520, y: 40 },
          size: { width: 220, height: 220 },
          config: {
            label: "Memory Usage",
            dataSource: "memory.usage",
            min: 0,
            max: 100,
            unit: "%",
            warningThreshold: 75,
            criticalThreshold: 90,
            icon: "💾",
          },
          zIndex: 3,
          isLocked: false,
        },
        {
          id: nanoid(),
          templateId: "cosmic-gauge-temp",
          type: "cosmic-gauge",
          position: { x: 760, y: 40 },
          size: { width: 220, height: 220 },
          config: {
            label: "CPU Temperature",
            dataSource: "cpu.temperature",
            min: 0,
            max: 100,
            unit: "°C",
            warningThreshold: 70,
            criticalThreshold: 85,
            icon: "🌡️",
          },
          zIndex: 4,
          isLocked: false,
        },
        // Second row - Linear meters with proper spacing
        {
          id: nanoid(),
          templateId: "cosmic-linear-disk",
          type: "cosmic-linear",
          position: { x: 40, y: 300 },
          size: { width: 320, height: 140 },
          config: {
            label: "Disk Usage",
            dataSource: "disk.usage",
            min: 0,
            max: 100,
            unit: "%",
            warningThreshold: 80,
            criticalThreshold: 95,
            icon: "💽",
          },
          zIndex: 5,
          isLocked: false,
        },
        {
          id: nanoid(),
          templateId: "cosmic-linear-network",
          type: "cosmic-linear",
          position: { x: 380, y: 300 },
          size: { width: 320, height: 140 },
          config: {
            label: "Network Usage",
            dataSource: "network.usage",
            min: 0,
            max: 100,
            unit: "Mbps",
            warningThreshold: 75,
            criticalThreshold: 90,
            icon: "🌐",
          },
          zIndex: 6,
          isLocked: false,
        },
        {
          id: nanoid(),
          templateId: "cosmic-gauge-temp",
          type: "cosmic-gauge",
          position: { x: 720, y: 300 },
          size: { width: 200, height: 200 },
          config: {
            label: "GPU Temperature",
            dataSource: "gpu.temperature",
            min: 0,
            max: 100,
            unit: "°C",
            warningThreshold: 75,
            criticalThreshold: 90,
            icon: "🔥",
          },
          zIndex: 7,
          isLocked: false,
        },
        // Third row - KPI Cards and additional widgets
        {
          id: nanoid(),
          templateId: "cosmic-kpi-overview",
          type: "cosmic-kpi",
          position: { x: 40, y: 480 },
          size: { width: 340, height: 180 },
          config: {
            title: "System Overview",
            metrics: [
              { label: "CPU", dataSource: "cpu.usage", unit: "%", icon: "🔥", threshold: { warning: 70, critical: 90 } },
              { label: "Memory", dataSource: "memory.usage", unit: "%", icon: "💾", threshold: { warning: 75, critical: 90 } },
              { label: "GPU", dataSource: "gpu.usage", unit: "%", icon: "⚡", threshold: { warning: 80, critical: 95 } },
              { label: "Temp", dataSource: "cpu.temperature", unit: "°C", icon: "🌡️", threshold: { warning: 70, critical: 85 } },
            ],
          },
          zIndex: 8,
          isLocked: false,
        },
        {
          id: nanoid(),
          templateId: "cosmic-kpi-performance",
          type: "cosmic-kpi",
          position: { x: 400, y: 480 },
          size: { width: 340, height: 180 },
          config: {
            title: "Performance Metrics",
            metrics: [
              { label: "FPS", dataSource: "performance.fps", unit: "fps", icon: "🎮", threshold: { warning: 30, critical: 15 } },
              { label: "Latency", dataSource: "network.latency", unit: "ms", icon: "⚡", threshold: { warning: 100, critical: 200 } },
              { label: "Power", dataSource: "system.power", unit: "W", icon: "🔋", threshold: { warning: 300, critical: 400 } },
              { label: "Fan RPM", dataSource: "cooling.fan", unit: "rpm", icon: "🌪️", threshold: { warning: 2000, critical: 3000 } },
            ],
          },
          zIndex: 9,
          isLocked: false,
        },
        {
          id: nanoid(),
          templateId: "cosmic-linear-disk",
          type: "cosmic-linear",
          position: { x: 760, y: 480 },
          size: { width: 260, height: 180 },
          config: {
            label: "System Load",
            dataSource: "system.load",
            min: 0,
            max: 100,
            unit: "%",
            warningThreshold: 70,
            criticalThreshold: 85,
            icon: "⚙️",
          },
          zIndex: 10,
          isLocked: false,
        },
      ],
      gridSize: 20,
      snapToGrid: true,
      theme: "dark-gaming",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dashboardState.update((state) => {
      const updatedLayouts = [defaultLayout, ...state.layouts.filter((l) => l.id !== "default-layout")];
      const updatedState = {
        ...state,
        layouts: updatedLayouts,
        currentLayout: defaultLayout,
      };

      currentLayout.set(defaultLayout);
      return updatedState;
    });

    return defaultLayout;
  },

  // Widget management
  addWidget(template: WidgetTemplate, position: Position): void {
    const newWidget: WidgetConfig = {
      id: nanoid(),
      templateId: template.id,
      type: template.type,
      title: template.name,
      position,
      size: template.config.size || { width: 200, height: 200 },
      config: template.config.config || {},
      dataSource: template.config.dataSource,
      zIndex: 1,
      isLocked: false,
    };

    dashboardState.update((state) => {
      if (!state.currentLayout) return state;
      
      const updatedLayout = {
        ...state.currentLayout,
        widgets: [...state.currentLayout.widgets, newWidget],
        updatedAt: new Date(),
      };
      
      currentLayout.set(updatedLayout);
      return {
        ...state,
        currentLayout: updatedLayout,
        layouts: state.layouts.map(l => l.id === updatedLayout.id ? updatedLayout : l),
      };
    });
  },

  removeWidget(widgetId: string): void {
    dashboardState.update((state) => {
      if (!state.currentLayout) return state;
      
      const updatedLayout = {
        ...state.currentLayout,
        widgets: state.currentLayout.widgets.filter(w => w.id !== widgetId),
        updatedAt: new Date(),
      };
      
      currentLayout.set(updatedLayout);
      return {
        ...state,
        currentLayout: updatedLayout,
        layouts: state.layouts.map(l => l.id === updatedLayout.id ? updatedLayout : l),
        selectedWidgets: state.selectedWidgets.filter(id => id !== widgetId),
      };
    });
  },

  updateWidget(widgetId: string, updates: Partial<WidgetConfig>): void {
    dashboardState.update((state) => {
      if (!state.currentLayout) return state;
      
      const updatedLayout = {
        ...state.currentLayout,
        widgets: state.currentLayout.widgets.map(w => 
          w.id === widgetId ? { ...w, ...updates } : w
        ),
        updatedAt: new Date(),
      };
      
      currentLayout.set(updatedLayout);
      return {
        ...state,
        currentLayout: updatedLayout,
        layouts: state.layouts.map(l => l.id === updatedLayout.id ? updatedLayout : l),
      };
    });
  },

  selectWidget(widgetId: string, multiSelect: boolean = false): void {
    dashboardState.update((state) => {
      const selectedWidgets = multiSelect 
        ? state.selectedWidgets.includes(widgetId)
          ? state.selectedWidgets.filter(id => id !== widgetId)
          : [...state.selectedWidgets, widgetId]
        : [widgetId];
      
      return {
        ...state,
        selectedWidgets,
      };
    });
  },

  // Layout management
  loadLayout(layout: DashboardLayout): void {
    dashboardState.update((state) => {
      const updatedLayouts = state.layouts.some(l => l.id === layout.id)
        ? state.layouts.map(l => l.id === layout.id ? layout : l)
        : [...state.layouts, layout];
      
      currentLayout.set(layout);
      return {
        ...state,
        layouts: updatedLayouts,
        currentLayout: layout,
      };
    });
  },

  saveLayout(): void {
    dashboardState.update((state) => {
      if (!state.currentLayout) return state;
      
      const updatedLayout = {
        ...state.currentLayout,
        updatedAt: new Date(),
      };
      
      currentLayout.set(updatedLayout);
      return {
        ...state,
        currentLayout: updatedLayout,
        layouts: state.layouts.map(l => l.id === updatedLayout.id ? updatedLayout : l),
      };
    });
  },

  // UI state management
  toggleGrid(): void {
    dashboardState.update((state) => ({
      ...state,
      isGridVisible: !state.isGridVisible,
    }));
  },

  // Widget builder
  openWidgetBuilder(): void {
    dashboardState.update((state) => ({
      ...state,
      widgetBuilder: {
        ...state.widgetBuilder,
        isOpen: true,
        mode: 'create',
        selectedWidget: null,
      },
    }));
  },

  closeWidgetBuilder(): void {
    dashboardState.update((state) => ({
      ...state,
      widgetBuilder: {
        ...state.widgetBuilder,
        isOpen: false,
        selectedWidget: null,
      },
    }));
  },

  // AI Layout Modal
  openAILayoutModal(): void {
    dashboardState.update((state) => ({
      ...state,
      aiLayout: {
        ...state.aiLayout,
        isOpen: true,
      },
    }));
  },

  closeAILayoutModal(): void {
    dashboardState.update((state) => ({
      ...state,
      aiLayout: {
        ...state.aiLayout,
        isOpen: false,
      },
    }));
  },

  applyLayoutSuggestion(suggestion: any): void {
    // Implementation for applying AI layout suggestions
    console.log('Applying layout suggestion:', suggestion);
    // This would typically create a new layout based on the AI suggestion
  },
};

// Initialize with default layout
dashboardActions.createDefaultLayout();
