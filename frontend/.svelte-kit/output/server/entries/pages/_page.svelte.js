import {
  Q as noop,
  T as ensure_array_like,
  U as spread_attributes,
  V as attr,
  E as pop,
  A as push,
  P as stringify,
  S as escape_html,
  J as attr_class,
  N as attr_style,
  W as store_get,
  X as unsubscribe_stores,
  Y as maybe_selected,
  Z as head,
} from "../../chunks/index.js";
import "clsx";
import {
  w as writable,
  g as get$1,
  r as readable,
} from "../../chunks/index2.js";
import { nanoid } from "nanoid";
import { extendTailwindMerge } from "tailwind-merge";
const now = () => Date.now();
const raf = {
  // don't access requestAnimationFrame eagerly outside method
  // this allows basic testing of user code without JSDOM
  // bunder will eval and remove ternary when the user's app is built
  tick:
    /** @param {any} _ */
    (_) => noop(),
  now: () => now(),
  tasks: /* @__PURE__ */ new Set(),
};
function loop(callback) {
  let task;
  if (raf.tasks.size === 0);
  return {
    promise: new Promise((fulfill) => {
      raf.tasks.add((task = { c: callback, f: fulfill }));
    }),
    abort() {
      raf.tasks.delete(task);
    },
  };
}
function linear(t) {
  return t;
}
function cubicOut(t) {
  const f2 = t - 1;
  return f2 * f2 * f2 + 1;
}
const initialState = {
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
  resizeState: { isResizing: false, resizedWidget: null, resizeHandle: null },
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
  aiLayout: { isOpen: false, suggestions: [] },
};
const dashboardState = writable(initialState);
const currentLayout = writable(null);
const selectedWidgets = writable([]);
const dragState = writable(initialState.dragState);
const widgetBuilder = writable(initialState.widgetBuilder);
const widgetTemplates = [
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
      config: { unit: "°C" },
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
      config: { metrics: ["cpu.usage", "memory.usage", "gpu.usage"] },
    },
  },
];
const dashboardActions = {
  createLayout: (name, description) => {
    const newLayout = {
      id: nanoid(),
      name,
      description,
      widgets: [],
      gridSize: 20,
      snapToGrid: true,
      theme: "dark-gaming",
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
    };
    dashboardState.update((state) => ({
      ...state,
      layouts: [...state.layouts, newLayout],
      currentLayout: newLayout,
    }));
    currentLayout.set(newLayout);
    return newLayout;
  },
  loadLayout: (layout) => {
    dashboardState.update((state) => ({ ...state, currentLayout: layout }));
    currentLayout.set(layout);
  },
  saveLayout: () => {
    dashboardState.update((state) => {
      if (!state.currentLayout) return state;
      const updatedLayout = {
        ...state.currentLayout,
        updatedAt: /* @__PURE__ */ new Date(),
      };
      const layouts = state.layouts.map((layout) =>
        layout.id === updatedLayout.id ? updatedLayout : layout,
      );
      return { ...state, layouts, currentLayout: updatedLayout };
    });
  },
  // Widget management
  addWidget: (template, position) => {
    const widget = {
      id: nanoid(),
      ...template.config,
      position: position || { x: 100, y: 100 },
      size: template.config.size || { width: 200, height: 200 },
    };
    dashboardState.update((state) => {
      if (!state.currentLayout) return state;
      const updatedLayout = {
        ...state.currentLayout,
        widgets: [...state.currentLayout.widgets, widget],
      };
      currentLayout.set(updatedLayout);
      return { ...state, currentLayout: updatedLayout };
    });
    return widget;
  },
  updateWidget: (widgetId, updates) => {
    dashboardState.update((state) => {
      if (!state.currentLayout) return state;
      const updatedLayout = {
        ...state.currentLayout,
        widgets: state.currentLayout.widgets.map((widget) =>
          widget.id === widgetId ? { ...widget, ...updates } : widget,
        ),
      };
      currentLayout.set(updatedLayout);
      return { ...state, currentLayout: updatedLayout };
    });
  },
  removeWidget: (widgetId) => {
    dashboardState.update((state) => {
      if (!state.currentLayout) return state;
      const updatedLayout = {
        ...state.currentLayout,
        widgets: state.currentLayout.widgets.filter(
          (widget) => widget.id !== widgetId,
        ),
      };
      currentLayout.set(updatedLayout);
      return { ...state, currentLayout: updatedLayout };
    });
  },
  // Selection management
  selectWidget: (widgetId, multiSelect = false) => {
    dashboardState.update((state) => {
      const newSelected = multiSelect
        ? [...state.selectedWidgets, widgetId]
        : [widgetId];
      selectedWidgets.set(newSelected);
      return { ...state, selectedWidgets: newSelected };
    });
  },
  deselectWidget: (widgetId) => {
    dashboardState.update((state) => {
      const newSelected = state.selectedWidgets.filter((id) => id !== widgetId);
      selectedWidgets.set(newSelected);
      return { ...state, selectedWidgets: newSelected };
    });
  },
  clearSelection: () => {
    selectedWidgets.set([]);
    dashboardState.update((state) => ({ ...state, selectedWidgets: [] }));
  },
  // Drag and drop
  startDrag: (widgetId, offset) => {
    const newDragState = {
      isDragging: true,
      draggedWidget: widgetId,
      dragOffset: offset,
      snapToGrid: true,
      gridSize: 20,
    };
    dragState.set(newDragState);
    dashboardState.update((state) => ({ ...state, dragState: newDragState }));
  },
  updateDrag: (position) => {
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
        widgets: state.currentLayout.widgets.map((widget) =>
          widget.id === state.dragState.draggedWidget
            ? { ...widget, position: snappedPosition }
            : widget,
        ),
      };
      currentLayout.set(updatedLayout);
      return { ...state, currentLayout: updatedLayout };
    });
  },
  endDrag: () => {
    const newDragState = {
      isDragging: false,
      draggedWidget: null,
      dragOffset: { x: 0, y: 0 },
      snapToGrid: true,
      gridSize: 20,
    };
    dragState.set(newDragState);
    dashboardState.update((state) => ({ ...state, dragState: newDragState }));
  },
  // Widget builder
  openWidgetBuilder: (mode, widget) => {
    const newBuilderState = {
      isOpen: true,
      mode,
      selectedWidget: widget || null,
      previewData: null,
      activeTab: "general",
    };
    widgetBuilder.set(newBuilderState);
    dashboardState.update((state) => ({
      ...state,
      widgetBuilder: newBuilderState,
    }));
  },
  closeWidgetBuilder: () => {
    const newBuilderState = {
      isOpen: false,
      mode: "create",
      selectedWidget: null,
      previewData: null,
      activeTab: "general",
    };
    widgetBuilder.set(newBuilderState);
    dashboardState.update((state) => ({
      ...state,
      widgetBuilder: newBuilderState,
    }));
  },
  // Grid and zoom
  toggleGrid: () => {
    dashboardState.update((state) => ({
      ...state,
      isGridVisible: !state.isGridVisible,
    }));
  },
  setZoom: (zoom) => {
    dashboardState.update((state) => ({
      ...state,
      zoom: Math.max(0.25, Math.min(2, zoom)),
    }));
  },
  // History (undo/redo)
  saveToHistory: () => {
    dashboardState.update((state) => {
      if (!state.currentLayout) return state;
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(state.currentLayout)));
      return {
        ...state,
        history: newHistory.slice(-50),
        // Keep last 50 states
        historyIndex: Math.min(newHistory.length - 1, 49),
      };
    });
  },
  undo: () => {
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
  redo: () => {
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
  openAILayoutModal: () => {
    dashboardState.update((state) => ({
      ...state,
      aiLayout: { ...state.aiLayout, isOpen: true },
    }));
  },
  closeAILayoutModal: () => {
    dashboardState.update((state) => ({
      ...state,
      aiLayout: { ...state.aiLayout, isOpen: false },
    }));
  },
  applyLayoutSuggestion: (suggestion) => {
    dashboardState.update((state) => {
      if (!state.currentLayout) return state;
      const updatedLayout = {
        ...state.currentLayout,
        widgets: suggestion.widgets,
      };
      currentLayout.set(updatedLayout);
      return { ...state, currentLayout: updatedLayout };
    });
  },
};
dashboardActions.createLayout(
  "Default Dashboard",
  "Your main hardware monitoring dashboard",
);
function generateMockSensorData() {
  const now2 = Date.now();
  const cpuUsage = 20 + Math.sin(now2 / 1e4) * 15 + Math.random() * 10;
  const gpuUsage = 30 + Math.sin(now2 / 8e3) * 20 + Math.random() * 15;
  const memoryUsage = 45 + Math.sin(now2 / 15e3) * 10 + Math.random() * 5;
  return {
    cpu: {
      usage: Math.max(0, Math.min(100, cpuUsage)),
      temperature: 35 + cpuUsage * 0.8 + Math.random() * 10,
      frequency: 3.2 + Math.random() * 0.8,
      voltage: 1.2 + Math.random() * 0.1,
      cores: Array.from({ length: 8 }, (_, i) => ({
        id: i,
        usage: Math.max(
          0,
          Math.min(100, cpuUsage + (Math.random() - 0.5) * 30),
        ),
        temperature: 35 + cpuUsage * 0.8 + Math.random() * 15,
      })),
    },
    gpu: {
      usage: Math.max(0, Math.min(100, gpuUsage)),
      temperature: 40 + gpuUsage * 0.6 + Math.random() * 15,
      memory: Math.max(0, Math.min(100, gpuUsage * 0.7 + Math.random() * 20)),
      fanSpeed: Math.max(
        30,
        Math.min(100, gpuUsage * 0.8 + Math.random() * 20),
      ),
      voltage: 1.1 + Math.random() * 0.1,
      powerUsage: Math.max(
        50,
        Math.min(300, gpuUsage * 2.5 + Math.random() * 50),
      ),
    },
    memory: {
      usage: Math.max(0, Math.min(100, memoryUsage)),
      available: Math.max(0, (16384 * (100 - memoryUsage)) / 100),
      total: 16384,
      speed: 3200 + Math.random() * 400,
    },
    storage: [
      {
        name: "NVMe SSD",
        usage: 65 + Math.random() * 10,
        temperature: 35 + Math.random() * 15,
        readSpeed: 500 + Math.random() * 200,
        writeSpeed: 400 + Math.random() * 150,
      },
      {
        name: "HDD",
        usage: 45 + Math.random() * 10,
        temperature: 30 + Math.random() * 10,
        readSpeed: 120 + Math.random() * 30,
        writeSpeed: 100 + Math.random() * 25,
      },
    ],
    fans: {
      "CPU Fan": Math.max(800, 1200 + Math.random() * 400),
      "GPU Fan 1": Math.max(600, 1e3 + Math.random() * 600),
      "GPU Fan 2": Math.max(600, 1e3 + Math.random() * 600),
      "Case Fan 1": Math.max(500, 800 + Math.random() * 200),
      "Case Fan 2": Math.max(500, 800 + Math.random() * 200),
    },
    voltages: {
      "CPU Core": 1.2 + Math.random() * 0.1,
      "12V Rail": 11.9 + Math.random() * 0.2,
      "5V Rail": 4.95 + Math.random() * 0.1,
      "3.3V Rail": 3.28 + Math.random() * 0.05,
    },
    motherboard: {
      temperature: 32 + Math.random() * 8,
      voltage: 3.3 + Math.random() * 0.1,
    },
    network: {
      bytesReceived: Math.random() * 1e6,
      bytesSent: Math.random() * 5e5,
      packetsReceived: Math.random() * 1e3,
      packetsSent: Math.random() * 800,
    },
  };
}
const sensorData = writable(generateMockSensorData());
const websocket = writable(null);
const connectionStatus = writable("disconnected");
const historicalData = writable([]);
let _mockInterval = null;
const sensorStore = {
  // Export stores for reactive access
  data: sensorData,
  status: connectionStatus,
  history: historicalData,
  connect() {
    const ws = get$1(websocket);
    if (ws?.readyState === WebSocket.OPEN) return;
    connectionStatus.set("connecting");
    try {
      const newWebSocket = new WebSocket("ws://localhost:8000/sensors");
      websocket.set(newWebSocket);
      newWebSocket.onopen = () => {
        connectionStatus.set("connected");
        console.log("WebSocket connected to sensor backend");
      };
      newWebSocket.onmessage = (event) => {
        try {
          const rawData = JSON.parse(event.data);
          const parsedData = this.parseHardwareData(rawData);
          sensorData.set(parsedData);
          historicalData.update((history) => [
            ...history.slice(-99),
            parsedData,
          ]);
        } catch (error) {
          console.error("Failed to parse sensor data:", error);
        }
      };
      newWebSocket.onclose = () => {
        connectionStatus.set("disconnected");
        console.log("WebSocket disconnected, attempting to reconnect...");
        setTimeout(() => this.connect(), 5e3);
      };
      newWebSocket.onerror = (error) => {
        connectionStatus.set("error");
        console.error("WebSocket error:", error);
      };
    } catch (error) {
      connectionStatus.set("error");
      console.error("Failed to create WebSocket connection:", error);
      this.startMockDataStream();
    }
  },
  disconnect() {
    const ws = get$1(websocket);
    if (ws) {
      ws.close();
      websocket.set(null);
    }
    connectionStatus.set("disconnected");
  },
  startMockDataStream() {
    console.log("Starting mock data stream for development");
    connectionStatus.set("connected");
    if (_mockInterval) {
      clearInterval(_mockInterval);
    }
    const updateMockData = () => {
      const mockData = generateMockSensorData();
      sensorData.set(mockData);
      historicalData.update((history) => [...history.slice(-99), mockData]);
    };
    _mockInterval = setInterval(updateMockData, 2e3);
    updateMockData();
  },
  parseHardwareData(hardware) {
    const parsed = {
      cpu: { usage: 0, temperature: 0, frequency: 0, voltage: 0, cores: [] },
      gpu: {
        usage: 0,
        temperature: 0,
        memory: 0,
        fanSpeed: 0,
        voltage: 0,
        powerUsage: 0,
      },
      memory: { usage: 0, available: 0, total: 0, speed: 0 },
      storage: [],
      fans: {},
      voltages: {},
      motherboard: { temperature: 0, voltage: 0 },
      network: {
        bytesReceived: 0,
        bytesSent: 0,
        packetsReceived: 0,
        packetsSent: 0,
      },
    };
    hardware.forEach((component) => {
      component.sensors.forEach((sensor) => {
        if (component.hardwareType === "Cpu") {
          if (sensor.sensorType === "Load") parsed.cpu.usage = sensor.value;
          if (sensor.sensorType === "Temperature")
            parsed.cpu.temperature = sensor.value;
          if (sensor.sensorType === "Clock")
            parsed.cpu.frequency = sensor.value / 1e3;
          if (sensor.sensorType === "Voltage")
            parsed.cpu.voltage = sensor.value;
        }
        if (component.hardwareType.startsWith("Gpu")) {
          if (sensor.sensorType === "Load") parsed.gpu.usage = sensor.value;
          if (sensor.sensorType === "Temperature")
            parsed.gpu.temperature = sensor.value;
          if (sensor.sensorType === "Fan") parsed.gpu.fanSpeed = sensor.value;
          if (sensor.sensorType === "Voltage")
            parsed.gpu.voltage = sensor.value;
        }
        if (component.hardwareType === "Memory") {
          if (sensor.sensorType === "Load") parsed.memory.usage = sensor.value;
          if (sensor.sensorType === "Data") {
            if (sensor.name.includes("Available"))
              parsed.memory.available = sensor.value;
            if (sensor.name.includes("Used"))
              parsed.memory.total = sensor.value;
          }
        }
        if (sensor.sensorType === "Fan") {
          parsed.fans[sensor.name] = sensor.value;
        }
        if (sensor.sensorType === "Voltage") {
          parsed.voltages[sensor.name] = sensor.value;
        }
      });
    });
    return parsed;
  },
  getSensorValue(path) {
    const keys = path.split(".");
    let value = get$1(sensorData);
    for (const key of keys) {
      if (value && typeof value === "object" && key in value) {
        value = value[key];
      } else {
        return 0;
      }
    }
    return typeof value === "number" ? value : 0;
  },
};
const currentTheme = writable("gaming");
const alertHistory = writable([]);
function createPathData(show, strokeWidth, stroke, fill, path) {
  return {
    show,
    style: {
      strokeWidth,
      stroke,
      fill,
    },
    path,
  };
}
const defaultFramePaths = {
  // Standard rectangular frame with clipped corners
  standard: [
    createPathData(
      true,
      "2",
      "var(--color-frame-1-stroke)",
      "var(--color-frame-1-fill)",
      [
        ["M", "15", "15"],
        ["L", "85%", "15"],
        ["L", "100% - 15", "30"],
        ["L", "100% - 15", "85%"],
        ["L", "85%", "100% - 15"],
        ["L", "15", "100% - 15"],
        ["L", "15", "15"],
      ],
    ),
  ],
  // Highlighted frame for active states
  highlighted: [
    createPathData(
      true,
      "2",
      "var(--color-frame-2-stroke)",
      "var(--color-frame-2-fill)",
      [
        ["M", "10", "10"],
        ["L", "90%", "10"],
        ["L", "100% - 10", "25"],
        ["L", "100% - 10", "90%"],
        ["L", "90%", "100% - 10"],
        ["L", "10", "100% - 10"],
        ["L", "10", "10"],
      ],
    ),
  ],
};
function CosmicFrame($$payload, $$props) {
  push();
  let {
    paths = [],
    className = "",
    style = "",
    $$slots,
    $$events,
    ...restProps
  } = $$props;
  function pathToString(pathArray) {
    return pathArray.map((segment) => segment.join(" ")).join(" ");
  }
  function processPath(pathString, width, height) {
    return pathString
      .replace(/(\d+)%/g, (match2, percent) => {
        const num2 = parseFloat(percent);
        return `${(num2 / 100) * width}`;
      })
      .replace(/100% - (\d+)/g, (match2, offset) => {
        return `${width - parseFloat(offset)}`;
      })
      .replace(/50% \+ (\d+)/g, (match2, offset) => {
        return `${width / 2 + parseFloat(offset)}`;
      })
      .replace(/50% - (\d+)/g, (match2, offset) => {
        return `${width / 2 - parseFloat(offset)}`;
      });
  }
  let frameWidth = 300;
  let frameHeight = 200;
  const processedPaths = paths.map((pathData) => ({
    ...pathData,
    processedPath: processPath(pathToString(pathData.path), frameWidth),
  }));
  const each_array = ensure_array_like(processedPaths);
  $$payload.out.push(
    `<svg${spread_attributes(
      {
        class: `absolute inset-0 size-full ${stringify(className)}`,
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: `0 0 ${stringify(frameWidth)} ${stringify(frameHeight)}`,
        style,
        ...restProps,
      },
      null,
      void 0,
      void 0,
      3,
    )}><!--[-->`,
  );
  for (
    let $$index = 0, $$length = each_array.length;
    $$index < $$length;
    $$index++
  ) {
    let pathData = each_array[$$index];
    if (pathData.show) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(
        `<path${attr("d", pathData.processedPath)}${attr("stroke-width", pathData.style.strokeWidth)}${attr("stroke", pathData.style.stroke)}${attr("fill", pathData.style.fill)} class="transition-all duration-300"></path>`,
      );
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--></svg>`);
  pop();
}
function is_date(obj) {
  return Object.prototype.toString.call(obj) === "[object Date]";
}
function get_interpolator(a, b) {
  if (a === b || a !== a) return () => a;
  const type = typeof a;
  if (type !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
    throw new Error("Cannot interpolate values of different type");
  }
  if (Array.isArray(a)) {
    const arr =
      /** @type {Array<any>} */
      b.map((bi, i) => {
        return get_interpolator(
          /** @type {Array<any>} */
          a[i],
          bi,
        );
      });
    return (t) => arr.map((fn2) => fn2(t));
  }
  if (type === "object") {
    if (!a || !b) {
      throw new Error("Object cannot be null");
    }
    if (is_date(a) && is_date(b)) {
      const an = a.getTime();
      const bn = b.getTime();
      const delta = bn - an;
      return (t) => new Date(an + t * delta);
    }
    const keys = Object.keys(b);
    const interpolators = {};
    keys.forEach((key) => {
      interpolators[key] = get_interpolator(a[key], b[key]);
    });
    return (t) => {
      const result = {};
      keys.forEach((key) => {
        result[key] = interpolators[key](t);
      });
      return result;
    };
  }
  if (type === "number") {
    const delta =
      /** @type {number} */
      b - /** @type {number} */ a;
    return (t) => a + t * delta;
  }
  return () => b;
}
function tweened(value, defaults = {}) {
  const store = writable(value);
  let task;
  let target_value = value;
  function set2(new_value, opts) {
    target_value = new_value;
    if (value == null) {
      store.set((value = new_value));
      return Promise.resolve();
    }
    let previous_task = task;
    let started = false;
    let {
      delay = 0,
      duration = 400,
      easing = linear,
      interpolate = get_interpolator,
    } = { ...defaults, ...opts };
    if (duration === 0) {
      if (previous_task) {
        previous_task.abort();
        previous_task = null;
      }
      store.set((value = target_value));
      return Promise.resolve();
    }
    const start = raf.now() + delay;
    let fn2;
    task = loop((now2) => {
      if (now2 < start) return true;
      if (!started) {
        fn2 = interpolate(
          /** @type {any} */
          value,
          new_value,
        );
        if (typeof duration === "function")
          duration = duration(
            /** @type {any} */
            value,
            new_value,
          );
        started = true;
      }
      if (previous_task) {
        previous_task.abort();
        previous_task = null;
      }
      const elapsed = now2 - start;
      if (elapsed > /** @type {number} */ duration) {
        store.set((value = new_value));
        return false;
      }
      store.set((value = fn2(easing(elapsed / duration))));
      return true;
    });
    return task.promise;
  }
  return {
    set: set2,
    update: (fn2, opts) =>
      set2(
        fn2(
          /** @type {any} */
          target_value,
          /** @type {any} */
          value,
        ),
        opts,
      ),
    subscribe: store.subscribe,
  };
}
function CosmicPanel($$payload, $$props) {
  push();
  let {
    variant = "default",
    title,
    subtitle,
    className = "",
    contentClass = "",
    showGlow = false,
    scrollable = false,
    children,
    header,
    footer,
    $$slots,
    $$events,
    ...restProps
  } = $$props;
  const currentFrames = () => {
    switch (variant) {
      case "highlighted":
        return defaultFramePaths.highlighted;
      case "minimal":
        return [
          {
            show: true,
            style: {
              strokeWidth: "1",
              stroke: "rgba(255, 255, 255, 0.2)",
              fill: "rgba(0, 0, 0, 0.2)",
            },
            path: [
              ["M", "0", "0"],
              ["L", "100%", "0"],
              ["L", "100%", "100%"],
              ["L", "0", "100%"],
              ["L", "0", "0"],
            ],
          },
        ];
      default:
        return defaultFramePaths.standard;
    }
  };
  $$payload.out.push(
    `<div${spread_attributes({ class: `relative ${stringify(className)}`, ...restProps }, null)}>`,
  );
  CosmicFrame($$payload, {
    paths: currentFrames(),
    className: showGlow ? "drop-shadow-lg" : "",
  });
  $$payload.out.push(
    `<!----> <div class="relative z-10 flex flex-col h-full">`,
  );
  if (title || subtitle || header) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="p-4 border-b border-white/10">`);
    if (header) {
      $$payload.out.push("<!--[-->");
      header($$payload);
      $$payload.out.push(`<!---->`);
    } else {
      $$payload.out.push("<!--[!-->");
      $$payload.out.push(`<div class="space-y-1">`);
      if (title) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(
          `<h3 class="font-orbitron font-semibold text-white text-lg">${escape_html(title)}</h3>`,
        );
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--> `);
      if (subtitle) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(
          `<p class="text-gray-400 text-sm">${escape_html(subtitle)}</p>`,
        );
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--></div>`);
    }
    $$payload.out.push(`<!--]--></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(
    `<!--]--> <div${attr_class(`flex-1 p-4 ${stringify(contentClass)} ${stringify(scrollable ? "overflow-auto" : "")}`)}>`,
  );
  children($$payload);
  $$payload.out.push(`<!----></div> `);
  if (footer) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="p-4 border-t border-white/10">`);
    footer($$payload);
    $$payload.out.push(`<!----></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div> `);
  if (showGlow) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(
      `<div class="absolute inset-0 opacity-20 pointer-events-none" style="filter: blur(20px); background: radial-gradient(circle at center, var(--color-primary)30 0%, transparent 70%);"></div>`,
    );
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div>`);
  pop();
}
function CosmicToolbar($$payload, $$props) {
  let {
    className = "",
    left,
    center,
    right,
    children,
    showScanLines = true,
    $$slots,
    $$events,
    ...restProps
  } = $$props;
  const toolbarFramePaths = [
    {
      show: true,
      style: {
        strokeWidth: "2",
        stroke: "var(--color-frame-1-stroke)",
        fill: "rgba(0, 0, 0, 0.8)",
      },
      path: [
        ["M", "0", "0"],
        ["L", "100%", "0"],
        ["L", "100%", "100%"],
        ["L", "20", "100%"],
        ["L", "0", "80%"],
        ["L", "0", "0"],
      ],
    },
    {
      show: true,
      style: {
        strokeWidth: "1",
        stroke: "rgba(255, 255, 255, 0.3)",
        fill: "transparent",
      },
      path: [
        ["M", "100% - 50", "0"],
        ["L", "100%", "0"],
        ["L", "100%", "100%"],
        ["L", "100% - 30", "100%"],
      ],
    },
  ];
  $$payload.out.push(
    `<div${spread_attributes(
      {
        class: `relative h-16 bg-gray-900/90 backdrop-blur-sm border-b border-gray-700/50 ${stringify(className)}`,
        ...restProps,
      },
      "svelte-rabmgl",
    )}>`,
  );
  CosmicFrame($$payload, { paths: toolbarFramePaths, className: "opacity-80" });
  $$payload.out.push(`<!----> `);
  if (showScanLines) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(
      `<div class="absolute inset-0 overflow-hidden pointer-events-none svelte-rabmgl"><div class="absolute w-full h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent animate-scan-slow svelte-rabmgl"></div> <div class="absolute right-0 top-0 w-px h-full bg-gradient-to-b from-transparent via-blue-400/20 to-transparent animate-scan-vertical-slow svelte-rabmgl"></div></div>`,
    );
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(
    `<!--]--> <div class="relative z-10 h-full flex items-center justify-between px-6 svelte-rabmgl"><div class="flex items-center gap-4 svelte-rabmgl">`,
  );
  if (left) {
    $$payload.out.push("<!--[-->");
    left($$payload);
    $$payload.out.push(`<!---->`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(
    `<!--]--></div> <div class="flex items-center gap-4 svelte-rabmgl">`,
  );
  if (center) {
    $$payload.out.push("<!--[-->");
    center($$payload);
    $$payload.out.push(`<!---->`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(
    `<!--]--></div> <div class="flex items-center gap-4 svelte-rabmgl">`,
  );
  if (right) {
    $$payload.out.push("<!--[-->");
    right($$payload);
    $$payload.out.push(`<!---->`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div> `);
  if (children) {
    $$payload.out.push("<!--[-->");
    children($$payload);
    $$payload.out.push(`<!---->`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div></div>`);
}
function CosmicSensorGauge($$payload, $$props) {
  push();
  var $$store_subs;
  let {
    value = 0,
    label = "Sensor",
    config = {
      min: 0,
      max: 100,
      warningThreshold: 70,
      criticalThreshold: 90,
      unit: "%",
      icon: "🔥",
    },
    size = 200,
    showFrame = true,
    glowEffect = true,
  } = $$props;
  const animatedValue = tweened(0, { duration: 800, easing: cubicOut });
  const normalizedValue = Math.max(
    0,
    Math.min(100, ((value - config.min) / (config.max - config.min)) * 100),
  );
  const angle = (normalizedValue / 100) * 270 - 135;
  const radius = size * 0.35;
  const centerX = size / 2;
  const centerY = size / 2;
  const statusColor = () => {
    if (value >= config.criticalThreshold) return "var(--color-accent)";
    if (value >= config.warningThreshold) return "orange";
    return "var(--color-success)";
  };
  const gaugeFramePaths = [
    {
      show: true,
      style: {
        strokeWidth: "2",
        stroke: "var(--color-frame-1-stroke)",
        fill: "var(--color-frame-1-fill)",
      },
      path: [
        ["M", "15", "15"],
        ["L", "85%", "15"],
        ["L", "100% - 15", "30"],
        ["L", "100% - 15", "85%"],
        ["L", "85%", "100% - 15"],
        ["L", "15", "100% - 15"],
        ["L", "15", "15"],
      ],
    },
    {
      show: showFrame,
      style: { strokeWidth: "1", stroke: statusColor(), fill: "transparent" },
      path: [
        ["M", "10", "10"],
        ["L", "90%", "10"],
        ["L", "100% - 10", "25"],
        ["L", "100% - 10", "90%"],
        ["L", "90%", "100% - 10"],
        ["L", "10", "100% - 10"],
        ["L", "10", "10"],
      ],
    },
  ];
  function createArcPath(startAngle, endAngle, radius2, cx, cy) {
    const start = {
      x: cx + radius2 * Math.cos((startAngle * Math.PI) / 180),
      y: cy + radius2 * Math.sin((startAngle * Math.PI) / 180),
    };
    const end = {
      x: cx + radius2 * Math.cos((endAngle * Math.PI) / 180),
      y: cy + radius2 * Math.sin((endAngle * Math.PI) / 180),
    };
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return `M ${start.x} ${start.y} A ${radius2} ${radius2} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  }
  const backgroundArc = createArcPath(-135, 135, radius, centerX, centerY);
  const valueArc = createArcPath(-135, angle, radius, centerX, centerY);
  $$payload.out.push(
    `<div class="relative inline-block svelte-1in9g11"${attr_style(`width: ${stringify(size)}px; height: ${stringify(size)}px;`)}>`,
  );
  if (showFrame) {
    $$payload.out.push("<!--[-->");
    CosmicFrame($$payload, {
      paths: gaugeFramePaths,
      className: glowEffect ? "drop-shadow-xl" : "",
      style: `filter: ${stringify(glowEffect ? `drop-shadow(0 0 20px ${statusColor()}40)` : "none")}`,
    });
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(
    `<!--]--> <div class="absolute inset-4 flex items-center justify-center svelte-1in9g11"><svg${attr("width", size - 32)}${attr("height", size - 32)}${attr("viewBox", `0 0 ${stringify(size)} ${stringify(size)}`)} class="overflow-visible svelte-1in9g11"><path${attr("d", backgroundArc)} stroke="rgba(255, 255, 255, 0.1)" stroke-width="8" fill="none" stroke-linecap="round" class="svelte-1in9g11"></path><path${attr("d", valueArc)}${attr("stroke", statusColor())} stroke-width="8" fill="none" stroke-linecap="round" class="transition-all duration-800 ease-out svelte-1in9g11"${attr_style(`filter: ${stringify(glowEffect ? `drop-shadow(0 0 8px ${statusColor()})` : "none")}`)}></path><circle${attr("cx", centerX)}${attr("cy", centerY)} r="12" fill="var(--color-background)"${attr("stroke", statusColor())} stroke-width="2" class="svelte-1in9g11"></circle><text${attr("x", centerX)}${attr("y", centerY - 10)} text-anchor="middle" fill="var(--color-foreground)" font-size="18" font-weight="bold" font-family="monospace" class="svelte-1in9g11">${escape_html(Math.round(store_get(($$store_subs ??= {}), "$animatedValue", animatedValue)))}</text><text${attr("x", centerX)}${attr("y", centerY + 8)} text-anchor="middle" fill="var(--color-foreground)" font-size="10" opacity="0.7" font-family="monospace" class="svelte-1in9g11">${escape_html(config.unit)}</text></svg></div> <div class="absolute bottom-2 left-0 right-0 text-center svelte-1in9g11"><div class="text-xs font-medium text-white/80 flex items-center justify-center gap-1 font-orbitron svelte-1in9g11">`,
  );
  if (config.icon) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(
      `<span class="svelte-1in9g11">${escape_html(config.icon)}</span>`,
    );
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(
    `<!--]--> ${escape_html(label)}</div></div> <div class="absolute top-2 right-2 svelte-1in9g11"><div${attr_class(
      `w-2 h-2 rounded-full ${stringify(value >= config.criticalThreshold ? "bg-red-400 critical-glow" : value >= config.warningThreshold ? "bg-yellow-400" : "bg-green-400")}`,
      "svelte-1in9g11",
    )}></div></div></div>`,
  );
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function range$1(start, stop, step) {
  ((start = +start),
    (stop = +stop),
    (step =
      (n = arguments.length) < 2
        ? ((stop = start), (start = 0), 1)
        : n < 3
          ? 1
          : +step));
  var i = -1,
    n = Math.max(0, Math.ceil((stop - start) / step)) | 0,
    range2 = new Array(n);
  while (++i < n) {
    range2[i] = start + i * step;
  }
  return range2;
}
const t0 = /* @__PURE__ */ new Date(),
  t1 = /* @__PURE__ */ new Date();
function timeInterval(floori, offseti, count, field) {
  function interval(date) {
    return (
      floori(
        (date =
          arguments.length === 0
            ? /* @__PURE__ */ new Date()
            : /* @__PURE__ */ new Date(+date)),
      ),
      date
    );
  }
  interval.floor = (date) => {
    return (floori((date = /* @__PURE__ */ new Date(+date))), date);
  };
  interval.ceil = (date) => {
    return (
      floori((date = new Date(date - 1))),
      offseti(date, 1),
      floori(date),
      date
    );
  };
  interval.round = (date) => {
    const d02 = interval(date),
      d1 = interval.ceil(date);
    return date - d02 < d1 - date ? d02 : d1;
  };
  interval.offset = (date, step) => {
    return (
      offseti(
        (date = /* @__PURE__ */ new Date(+date)),
        step == null ? 1 : Math.floor(step),
      ),
      date
    );
  };
  interval.range = (start, stop, step) => {
    const range2 = [];
    start = interval.ceil(start);
    step = step == null ? 1 : Math.floor(step);
    if (!(start < stop) || !(step > 0)) return range2;
    let previous;
    do
      (range2.push((previous = /* @__PURE__ */ new Date(+start))),
        offseti(start, step),
        floori(start));
    while (previous < start && start < stop);
    return range2;
  };
  interval.filter = (test) => {
    return timeInterval(
      (date) => {
        if (date >= date)
          while ((floori(date), !test(date))) date.setTime(date - 1);
      },
      (date, step) => {
        if (date >= date) {
          if (step < 0)
            while (++step <= 0) {
              while ((offseti(date, -1), !test(date))) {}
            }
          else
            while (--step >= 0) {
              while ((offseti(date, 1), !test(date))) {}
            }
        }
      },
    );
  };
  if (count) {
    interval.count = (start, end) => {
      (t0.setTime(+start), t1.setTime(+end));
      (floori(t0), floori(t1));
      return Math.floor(count(t0, t1));
    };
    interval.every = (step) => {
      step = Math.floor(step);
      return !isFinite(step) || !(step > 0)
        ? null
        : !(step > 1)
          ? interval
          : interval.filter(
              field
                ? (d) => field(d) % step === 0
                : (d) => interval.count(0, d) % step === 0,
            );
    };
  }
  return interval;
}
const millisecond = timeInterval(
  () => {},
  (date, step) => {
    date.setTime(+date + step);
  },
  (start, end) => {
    return end - start;
  },
);
millisecond.every = (k2) => {
  k2 = Math.floor(k2);
  if (!isFinite(k2) || !(k2 > 0)) return null;
  if (!(k2 > 1)) return millisecond;
  return timeInterval(
    (date) => {
      date.setTime(Math.floor(date / k2) * k2);
    },
    (date, step) => {
      date.setTime(+date + step * k2);
    },
    (start, end) => {
      return (end - start) / k2;
    },
  );
};
millisecond.range;
const durationSecond = 1e3;
const durationMinute = durationSecond * 60;
const durationHour = durationMinute * 60;
const durationDay = durationHour * 24;
const durationWeek = durationDay * 7;
const second = timeInterval(
  (date) => {
    date.setTime(date - date.getMilliseconds());
  },
  (date, step) => {
    date.setTime(+date + step * durationSecond);
  },
  (start, end) => {
    return (end - start) / durationSecond;
  },
  (date) => {
    return date.getUTCSeconds();
  },
);
second.range;
const timeMinute = timeInterval(
  (date) => {
    date.setTime(
      date - date.getMilliseconds() - date.getSeconds() * durationSecond,
    );
  },
  (date, step) => {
    date.setTime(+date + step * durationMinute);
  },
  (start, end) => {
    return (end - start) / durationMinute;
  },
  (date) => {
    return date.getMinutes();
  },
);
timeMinute.range;
const utcMinute = timeInterval(
  (date) => {
    date.setUTCSeconds(0, 0);
  },
  (date, step) => {
    date.setTime(+date + step * durationMinute);
  },
  (start, end) => {
    return (end - start) / durationMinute;
  },
  (date) => {
    return date.getUTCMinutes();
  },
);
utcMinute.range;
const timeHour = timeInterval(
  (date) => {
    date.setTime(
      date -
        date.getMilliseconds() -
        date.getSeconds() * durationSecond -
        date.getMinutes() * durationMinute,
    );
  },
  (date, step) => {
    date.setTime(+date + step * durationHour);
  },
  (start, end) => {
    return (end - start) / durationHour;
  },
  (date) => {
    return date.getHours();
  },
);
timeHour.range;
const utcHour = timeInterval(
  (date) => {
    date.setUTCMinutes(0, 0, 0);
  },
  (date, step) => {
    date.setTime(+date + step * durationHour);
  },
  (start, end) => {
    return (end - start) / durationHour;
  },
  (date) => {
    return date.getUTCHours();
  },
);
utcHour.range;
const timeDay = timeInterval(
  (date) => date.setHours(0, 0, 0, 0),
  (date, step) => date.setDate(date.getDate() + step),
  (start, end) =>
    (end -
      start -
      (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) /
    durationDay,
  (date) => date.getDate() - 1,
);
timeDay.range;
const utcDay = timeInterval(
  (date) => {
    date.setUTCHours(0, 0, 0, 0);
  },
  (date, step) => {
    date.setUTCDate(date.getUTCDate() + step);
  },
  (start, end) => {
    return (end - start) / durationDay;
  },
  (date) => {
    return date.getUTCDate() - 1;
  },
);
utcDay.range;
const unixDay = timeInterval(
  (date) => {
    date.setUTCHours(0, 0, 0, 0);
  },
  (date, step) => {
    date.setUTCDate(date.getUTCDate() + step);
  },
  (start, end) => {
    return (end - start) / durationDay;
  },
  (date) => {
    return Math.floor(date / durationDay);
  },
);
unixDay.range;
function timeWeekday(i) {
  return timeInterval(
    (date) => {
      date.setDate(date.getDate() - ((date.getDay() + 7 - i) % 7));
      date.setHours(0, 0, 0, 0);
    },
    (date, step) => {
      date.setDate(date.getDate() + step * 7);
    },
    (start, end) => {
      return (
        (end -
          start -
          (end.getTimezoneOffset() - start.getTimezoneOffset()) *
            durationMinute) /
        durationWeek
      );
    },
  );
}
const timeSunday = timeWeekday(0);
const timeMonday = timeWeekday(1);
const timeTuesday = timeWeekday(2);
const timeWednesday = timeWeekday(3);
const timeThursday = timeWeekday(4);
const timeFriday = timeWeekday(5);
const timeSaturday = timeWeekday(6);
timeSunday.range;
timeMonday.range;
timeTuesday.range;
timeWednesday.range;
timeThursday.range;
timeFriday.range;
timeSaturday.range;
function utcWeekday(i) {
  return timeInterval(
    (date) => {
      date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 7 - i) % 7));
      date.setUTCHours(0, 0, 0, 0);
    },
    (date, step) => {
      date.setUTCDate(date.getUTCDate() + step * 7);
    },
    (start, end) => {
      return (end - start) / durationWeek;
    },
  );
}
const utcSunday = utcWeekday(0);
const utcMonday = utcWeekday(1);
const utcTuesday = utcWeekday(2);
const utcWednesday = utcWeekday(3);
const utcThursday = utcWeekday(4);
const utcFriday = utcWeekday(5);
const utcSaturday = utcWeekday(6);
utcSunday.range;
utcMonday.range;
utcTuesday.range;
utcWednesday.range;
utcThursday.range;
utcFriday.range;
utcSaturday.range;
const timeMonth = timeInterval(
  (date) => {
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
  },
  (date, step) => {
    date.setMonth(date.getMonth() + step);
  },
  (start, end) => {
    return (
      end.getMonth() -
      start.getMonth() +
      (end.getFullYear() - start.getFullYear()) * 12
    );
  },
  (date) => {
    return date.getMonth();
  },
);
timeMonth.range;
const utcMonth = timeInterval(
  (date) => {
    date.setUTCDate(1);
    date.setUTCHours(0, 0, 0, 0);
  },
  (date, step) => {
    date.setUTCMonth(date.getUTCMonth() + step);
  },
  (start, end) => {
    return (
      end.getUTCMonth() -
      start.getUTCMonth() +
      (end.getUTCFullYear() - start.getUTCFullYear()) * 12
    );
  },
  (date) => {
    return date.getUTCMonth();
  },
);
utcMonth.range;
const timeYear = timeInterval(
  (date) => {
    date.setMonth(0, 1);
    date.setHours(0, 0, 0, 0);
  },
  (date, step) => {
    date.setFullYear(date.getFullYear() + step);
  },
  (start, end) => {
    return end.getFullYear() - start.getFullYear();
  },
  (date) => {
    return date.getFullYear();
  },
);
timeYear.every = (k2) => {
  return !isFinite((k2 = Math.floor(k2))) || !(k2 > 0)
    ? null
    : timeInterval(
        (date) => {
          date.setFullYear(Math.floor(date.getFullYear() / k2) * k2);
          date.setMonth(0, 1);
          date.setHours(0, 0, 0, 0);
        },
        (date, step) => {
          date.setFullYear(date.getFullYear() + step * k2);
        },
      );
};
timeYear.range;
const utcYear = timeInterval(
  (date) => {
    date.setUTCMonth(0, 1);
    date.setUTCHours(0, 0, 0, 0);
  },
  (date, step) => {
    date.setUTCFullYear(date.getUTCFullYear() + step);
  },
  (start, end) => {
    return end.getUTCFullYear() - start.getUTCFullYear();
  },
  (date) => {
    return date.getUTCFullYear();
  },
);
utcYear.every = (k2) => {
  return !isFinite((k2 = Math.floor(k2))) || !(k2 > 0)
    ? null
    : timeInterval(
        (date) => {
          date.setUTCFullYear(Math.floor(date.getUTCFullYear() / k2) * k2);
          date.setUTCMonth(0, 1);
          date.setUTCHours(0, 0, 0, 0);
        },
        (date, step) => {
          date.setUTCFullYear(date.getUTCFullYear() + step * k2);
        },
      );
};
utcYear.range;
var freeGlobal =
  typeof global == "object" && global && global.Object === Object && global;
var freeSelf =
  typeof self == "object" && self && self.Object === Object && self;
var root = freeGlobal || freeSelf || Function("return this")();
var Symbol$1 = root.Symbol;
var objectProto$9 = Object.prototype;
var hasOwnProperty$7 = objectProto$9.hasOwnProperty;
var nativeObjectToString$1 = objectProto$9.toString;
var symToStringTag$1 = Symbol$1 ? Symbol$1.toStringTag : void 0;
function getRawTag(value) {
  var isOwn = hasOwnProperty$7.call(value, symToStringTag$1),
    tag = value[symToStringTag$1];
  try {
    value[symToStringTag$1] = void 0;
    var unmasked = true;
  } catch (e2) {}
  var result = nativeObjectToString$1.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag$1] = tag;
    } else {
      delete value[symToStringTag$1];
    }
  }
  return result;
}
var objectProto$8 = Object.prototype;
var nativeObjectToString = objectProto$8.toString;
function objectToString(value) {
  return nativeObjectToString.call(value);
}
var nullTag = "[object Null]",
  undefinedTag = "[object Undefined]";
var symToStringTag = Symbol$1 ? Symbol$1.toStringTag : void 0;
function baseGetTag(value) {
  if (value == null) {
    return value === void 0 ? undefinedTag : nullTag;
  }
  return symToStringTag && symToStringTag in Object(value)
    ? getRawTag(value)
    : objectToString(value);
}
function isObjectLike(value) {
  return value != null && typeof value == "object";
}
var isArray = Array.isArray;
function isObject(value) {
  var type = typeof value;
  return value != null && (type == "object" || type == "function");
}
function identity$1(value) {
  return value;
}
var asyncTag = "[object AsyncFunction]",
  funcTag$1 = "[object Function]",
  genTag = "[object GeneratorFunction]",
  proxyTag = "[object Proxy]";
function isFunction(value) {
  if (!isObject(value)) {
    return false;
  }
  var tag = baseGetTag(value);
  return (
    tag == funcTag$1 || tag == genTag || tag == asyncTag || tag == proxyTag
  );
}
var coreJsData = root["__core-js_shared__"];
var maskSrcKey = (function () {
  var uid = /[^.]+$/.exec(
    (coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO) || "",
  );
  return uid ? "Symbol(src)_1." + uid : "";
})();
function isMasked(func) {
  return !!maskSrcKey && maskSrcKey in func;
}
var funcProto$2 = Function.prototype;
var funcToString$2 = funcProto$2.toString;
function toSource(func) {
  if (func != null) {
    try {
      return funcToString$2.call(func);
    } catch (e2) {}
    try {
      return func + "";
    } catch (e2) {}
  }
  return "";
}
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
var reIsHostCtor = /^\[object .+?Constructor\]$/;
var funcProto$1 = Function.prototype,
  objectProto$7 = Object.prototype;
var funcToString$1 = funcProto$1.toString;
var hasOwnProperty$6 = objectProto$7.hasOwnProperty;
var reIsNative = RegExp(
  "^" +
    funcToString$1
      .call(hasOwnProperty$6)
      .replace(reRegExpChar, "\\$&")
      .replace(
        /hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,
        "$1.*?",
      ) +
    "$",
);
function baseIsNative(value) {
  if (!isObject(value) || isMasked(value)) {
    return false;
  }
  var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource(value));
}
function getValue(object, key) {
  return object == null ? void 0 : object[key];
}
function getNative(object, key) {
  var value = getValue(object, key);
  return baseIsNative(value) ? value : void 0;
}
var objectCreate = Object.create;
var baseCreate = /* @__PURE__ */ (function () {
  function object() {}
  return function (proto) {
    if (!isObject(proto)) {
      return {};
    }
    if (objectCreate) {
      return objectCreate(proto);
    }
    object.prototype = proto;
    var result = new object();
    object.prototype = void 0;
    return result;
  };
})();
function apply(func, thisArg, args) {
  switch (args.length) {
    case 0:
      return func.call(thisArg);
    case 1:
      return func.call(thisArg, args[0]);
    case 2:
      return func.call(thisArg, args[0], args[1]);
    case 3:
      return func.call(thisArg, args[0], args[1], args[2]);
  }
  return func.apply(thisArg, args);
}
function copyArray(source, array) {
  var index = -1,
    length = source.length;
  array || (array = Array(length));
  while (++index < length) {
    array[index] = source[index];
  }
  return array;
}
var HOT_COUNT = 800,
  HOT_SPAN = 16;
var nativeNow = Date.now;
function shortOut(func) {
  var count = 0,
    lastCalled = 0;
  return function () {
    var stamp = nativeNow(),
      remaining = HOT_SPAN - (stamp - lastCalled);
    lastCalled = stamp;
    if (remaining > 0) {
      if (++count >= HOT_COUNT) {
        return arguments[0];
      }
    } else {
      count = 0;
    }
    return func.apply(void 0, arguments);
  };
}
function constant(value) {
  return function () {
    return value;
  };
}
var defineProperty = (function () {
  try {
    var func = getNative(Object, "defineProperty");
    func({}, "", {});
    return func;
  } catch (e2) {}
})();
var baseSetToString = !defineProperty
  ? identity$1
  : function (func, string) {
      return defineProperty(func, "toString", {
        configurable: true,
        enumerable: false,
        value: constant(string),
        writable: true,
      });
    };
var setToString = shortOut(baseSetToString);
var MAX_SAFE_INTEGER$1 = 9007199254740991;
var reIsUint = /^(?:0|[1-9]\d*)$/;
function isIndex(value, length) {
  var type = typeof value;
  length = length == null ? MAX_SAFE_INTEGER$1 : length;
  return (
    !!length &&
    (type == "number" || (type != "symbol" && reIsUint.test(value))) &&
    value > -1 &&
    value % 1 == 0 &&
    value < length
  );
}
function baseAssignValue(object, key, value) {
  if (key == "__proto__" && defineProperty) {
    defineProperty(object, key, {
      configurable: true,
      enumerable: true,
      value: value,
      writable: true,
    });
  } else {
    object[key] = value;
  }
}
function eq(value, other) {
  return value === other || (value !== value && other !== other);
}
var objectProto$6 = Object.prototype;
var hasOwnProperty$5 = objectProto$6.hasOwnProperty;
function assignValue(object, key, value) {
  var objValue = object[key];
  if (
    !(hasOwnProperty$5.call(object, key) && eq(objValue, value)) ||
    (value === void 0 && !(key in object))
  ) {
    baseAssignValue(object, key, value);
  }
}
function copyObject(source, props, object, customizer) {
  var isNew = !object;
  object || (object = {});
  var index = -1,
    length = props.length;
  while (++index < length) {
    var key = props[index];
    var newValue = void 0;
    if (newValue === void 0) {
      newValue = source[key];
    }
    if (isNew) {
      baseAssignValue(object, key, newValue);
    } else {
      assignValue(object, key, newValue);
    }
  }
  return object;
}
var nativeMax = Math.max;
function overRest(func, start, transform) {
  start = nativeMax(start === void 0 ? func.length - 1 : start, 0);
  return function () {
    var args = arguments,
      index = -1,
      length = nativeMax(args.length - start, 0),
      array = Array(length);
    while (++index < length) {
      array[index] = args[start + index];
    }
    index = -1;
    var otherArgs = Array(start + 1);
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = transform(array);
    return apply(func, this, otherArgs);
  };
}
function baseRest(func, start) {
  return setToString(overRest(func, start, identity$1), func + "");
}
var MAX_SAFE_INTEGER = 9007199254740991;
function isLength(value) {
  return (
    typeof value == "number" &&
    value > -1 &&
    value % 1 == 0 &&
    value <= MAX_SAFE_INTEGER
  );
}
function isArrayLike(value) {
  return value != null && isLength(value.length) && !isFunction(value);
}
function isIterateeCall(value, index, object) {
  if (!isObject(object)) {
    return false;
  }
  var type = typeof index;
  if (
    type == "number"
      ? isArrayLike(object) && isIndex(index, object.length)
      : type == "string" && index in object
  ) {
    return eq(object[index], value);
  }
  return false;
}
function createAssigner(assigner) {
  return baseRest(function (object, sources) {
    var index = -1,
      length = sources.length,
      customizer = length > 1 ? sources[length - 1] : void 0,
      guard = length > 2 ? sources[2] : void 0;
    customizer =
      assigner.length > 3 && typeof customizer == "function"
        ? (length--, customizer)
        : void 0;
    if (guard && isIterateeCall(sources[0], sources[1], guard)) {
      customizer = length < 3 ? void 0 : customizer;
      length = 1;
    }
    object = Object(object);
    while (++index < length) {
      var source = sources[index];
      if (source) {
        assigner(object, source, index, customizer);
      }
    }
    return object;
  });
}
var objectProto$5 = Object.prototype;
function isPrototype(value) {
  var Ctor = value && value.constructor,
    proto = (typeof Ctor == "function" && Ctor.prototype) || objectProto$5;
  return value === proto;
}
function baseTimes(n, iteratee) {
  var index = -1,
    result = Array(n);
  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}
var argsTag$1 = "[object Arguments]";
function baseIsArguments(value) {
  return isObjectLike(value) && baseGetTag(value) == argsTag$1;
}
var objectProto$4 = Object.prototype;
var hasOwnProperty$4 = objectProto$4.hasOwnProperty;
var propertyIsEnumerable = objectProto$4.propertyIsEnumerable;
var isArguments = baseIsArguments(
  /* @__PURE__ */ (function () {
    return arguments;
  })(),
)
  ? baseIsArguments
  : function (value) {
      return (
        isObjectLike(value) &&
        hasOwnProperty$4.call(value, "callee") &&
        !propertyIsEnumerable.call(value, "callee")
      );
    };
function stubFalse() {
  return false;
}
var freeExports$2 =
  typeof exports == "object" && exports && !exports.nodeType && exports;
var freeModule$2 =
  freeExports$2 &&
  typeof module == "object" &&
  module &&
  !module.nodeType &&
  module;
var moduleExports$2 = freeModule$2 && freeModule$2.exports === freeExports$2;
var Buffer$1 = moduleExports$2 ? root.Buffer : void 0;
var nativeIsBuffer = Buffer$1 ? Buffer$1.isBuffer : void 0;
var isBuffer = nativeIsBuffer || stubFalse;
var argsTag = "[object Arguments]",
  arrayTag = "[object Array]",
  boolTag = "[object Boolean]",
  dateTag = "[object Date]",
  errorTag = "[object Error]",
  funcTag = "[object Function]",
  mapTag = "[object Map]",
  numberTag = "[object Number]",
  objectTag$1 = "[object Object]",
  regexpTag = "[object RegExp]",
  setTag = "[object Set]",
  stringTag = "[object String]",
  weakMapTag = "[object WeakMap]";
var arrayBufferTag = "[object ArrayBuffer]",
  dataViewTag = "[object DataView]",
  float32Tag = "[object Float32Array]",
  float64Tag = "[object Float64Array]",
  int8Tag = "[object Int8Array]",
  int16Tag = "[object Int16Array]",
  int32Tag = "[object Int32Array]",
  uint8Tag = "[object Uint8Array]",
  uint8ClampedTag = "[object Uint8ClampedArray]",
  uint16Tag = "[object Uint16Array]",
  uint32Tag = "[object Uint32Array]";
var typedArrayTags = {};
typedArrayTags[float32Tag] =
  typedArrayTags[float64Tag] =
  typedArrayTags[int8Tag] =
  typedArrayTags[int16Tag] =
  typedArrayTags[int32Tag] =
  typedArrayTags[uint8Tag] =
  typedArrayTags[uint8ClampedTag] =
  typedArrayTags[uint16Tag] =
  typedArrayTags[uint32Tag] =
    true;
typedArrayTags[argsTag] =
  typedArrayTags[arrayTag] =
  typedArrayTags[arrayBufferTag] =
  typedArrayTags[boolTag] =
  typedArrayTags[dataViewTag] =
  typedArrayTags[dateTag] =
  typedArrayTags[errorTag] =
  typedArrayTags[funcTag] =
  typedArrayTags[mapTag] =
  typedArrayTags[numberTag] =
  typedArrayTags[objectTag$1] =
  typedArrayTags[regexpTag] =
  typedArrayTags[setTag] =
  typedArrayTags[stringTag] =
  typedArrayTags[weakMapTag] =
    false;
function baseIsTypedArray(value) {
  return (
    isObjectLike(value) &&
    isLength(value.length) &&
    !!typedArrayTags[baseGetTag(value)]
  );
}
function baseUnary(func) {
  return function (value) {
    return func(value);
  };
}
var freeExports$1 =
  typeof exports == "object" && exports && !exports.nodeType && exports;
var freeModule$1 =
  freeExports$1 &&
  typeof module == "object" &&
  module &&
  !module.nodeType &&
  module;
var moduleExports$1 = freeModule$1 && freeModule$1.exports === freeExports$1;
var freeProcess = moduleExports$1 && freeGlobal.process;
var nodeUtil = (function () {
  try {
    var types =
      freeModule$1 &&
      freeModule$1.require &&
      freeModule$1.require("util").types;
    if (types) {
      return types;
    }
    return freeProcess && freeProcess.binding && freeProcess.binding("util");
  } catch (e2) {}
})();
var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;
var isTypedArray = nodeIsTypedArray
  ? baseUnary(nodeIsTypedArray)
  : baseIsTypedArray;
function arrayLikeKeys(value, inherited) {
  var isArr = isArray(value),
    isArg = !isArr && isArguments(value),
    isBuff = !isArr && !isArg && isBuffer(value),
    isType = !isArr && !isArg && !isBuff && isTypedArray(value),
    skipIndexes = isArr || isArg || isBuff || isType,
    result = skipIndexes ? baseTimes(value.length, String) : [],
    length = result.length;
  for (var key in value) {
    if (
      !(
        skipIndexes && // Safari 9 has enumerable `arguments.length` in strict mode.
        (key == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
          (isBuff && (key == "offset" || key == "parent")) || // PhantomJS 2 has enumerable non-index properties on typed arrays.
          (isType &&
            (key == "buffer" || key == "byteLength" || key == "byteOffset")) || // Skip index properties.
          isIndex(key, length))
      )
    ) {
      result.push(key);
    }
  }
  return result;
}
function overArg(func, transform) {
  return function (arg) {
    return func(transform(arg));
  };
}
function nativeKeysIn(object) {
  var result = [];
  if (object != null) {
    for (var key in Object(object)) {
      result.push(key);
    }
  }
  return result;
}
var objectProto$3 = Object.prototype;
var hasOwnProperty$3 = objectProto$3.hasOwnProperty;
function baseKeysIn(object) {
  if (!isObject(object)) {
    return nativeKeysIn(object);
  }
  var isProto = isPrototype(object),
    result = [];
  for (var key in object) {
    if (
      !(
        key == "constructor" &&
        (isProto || !hasOwnProperty$3.call(object, key))
      )
    ) {
      result.push(key);
    }
  }
  return result;
}
function keysIn(object) {
  return isArrayLike(object) ? arrayLikeKeys(object) : baseKeysIn(object);
}
var nativeCreate = getNative(Object, "create");
function hashClear() {
  this.__data__ = nativeCreate ? nativeCreate(null) : {};
  this.size = 0;
}
function hashDelete(key) {
  var result = this.has(key) && delete this.__data__[key];
  this.size -= result ? 1 : 0;
  return result;
}
var HASH_UNDEFINED$1 = "__lodash_hash_undefined__";
var objectProto$2 = Object.prototype;
var hasOwnProperty$2 = objectProto$2.hasOwnProperty;
function hashGet(key) {
  var data = this.__data__;
  if (nativeCreate) {
    var result = data[key];
    return result === HASH_UNDEFINED$1 ? void 0 : result;
  }
  return hasOwnProperty$2.call(data, key) ? data[key] : void 0;
}
var objectProto$1 = Object.prototype;
var hasOwnProperty$1 = objectProto$1.hasOwnProperty;
function hashHas(key) {
  var data = this.__data__;
  return nativeCreate ? data[key] !== void 0 : hasOwnProperty$1.call(data, key);
}
var HASH_UNDEFINED = "__lodash_hash_undefined__";
function hashSet(key, value) {
  var data = this.__data__;
  this.size += this.has(key) ? 0 : 1;
  data[key] = nativeCreate && value === void 0 ? HASH_UNDEFINED : value;
  return this;
}
function Hash(entries) {
  var index = -1,
    length = entries == null ? 0 : entries.length;
  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}
Hash.prototype.clear = hashClear;
Hash.prototype["delete"] = hashDelete;
Hash.prototype.get = hashGet;
Hash.prototype.has = hashHas;
Hash.prototype.set = hashSet;
function listCacheClear() {
  this.__data__ = [];
  this.size = 0;
}
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}
var arrayProto = Array.prototype;
var splice = arrayProto.splice;
function listCacheDelete(key) {
  var data = this.__data__,
    index = assocIndexOf(data, key);
  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  --this.size;
  return true;
}
function listCacheGet(key) {
  var data = this.__data__,
    index = assocIndexOf(data, key);
  return index < 0 ? void 0 : data[index][1];
}
function listCacheHas(key) {
  return assocIndexOf(this.__data__, key) > -1;
}
function listCacheSet(key, value) {
  var data = this.__data__,
    index = assocIndexOf(data, key);
  if (index < 0) {
    ++this.size;
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}
function ListCache(entries) {
  var index = -1,
    length = entries == null ? 0 : entries.length;
  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}
ListCache.prototype.clear = listCacheClear;
ListCache.prototype["delete"] = listCacheDelete;
ListCache.prototype.get = listCacheGet;
ListCache.prototype.has = listCacheHas;
ListCache.prototype.set = listCacheSet;
var Map$1 = getNative(root, "Map");
function mapCacheClear() {
  this.size = 0;
  this.__data__ = {
    hash: new Hash(),
    map: new (Map$1 || ListCache)(),
    string: new Hash(),
  };
}
function isKeyable(value) {
  var type = typeof value;
  return type == "string" ||
    type == "number" ||
    type == "symbol" ||
    type == "boolean"
    ? value !== "__proto__"
    : value === null;
}
function getMapData(map, key) {
  var data = map.__data__;
  return isKeyable(key)
    ? data[typeof key == "string" ? "string" : "hash"]
    : data.map;
}
function mapCacheDelete(key) {
  var result = getMapData(this, key)["delete"](key);
  this.size -= result ? 1 : 0;
  return result;
}
function mapCacheGet(key) {
  return getMapData(this, key).get(key);
}
function mapCacheHas(key) {
  return getMapData(this, key).has(key);
}
function mapCacheSet(key, value) {
  var data = getMapData(this, key),
    size = data.size;
  data.set(key, value);
  this.size += data.size == size ? 0 : 1;
  return this;
}
function MapCache(entries) {
  var index = -1,
    length = entries == null ? 0 : entries.length;
  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}
MapCache.prototype.clear = mapCacheClear;
MapCache.prototype["delete"] = mapCacheDelete;
MapCache.prototype.get = mapCacheGet;
MapCache.prototype.has = mapCacheHas;
MapCache.prototype.set = mapCacheSet;
var FUNC_ERROR_TEXT = "Expected a function";
function memoize(func, resolver) {
  if (
    typeof func != "function" ||
    (resolver != null && typeof resolver != "function")
  ) {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  var memoized = function () {
    var args = arguments,
      key = resolver ? resolver.apply(this, args) : args[0],
      cache = memoized.cache;
    if (cache.has(key)) {
      return cache.get(key);
    }
    var result = func.apply(this, args);
    memoized.cache = cache.set(key, result) || cache;
    return result;
  };
  memoized.cache = new (memoize.Cache || MapCache)();
  return memoized;
}
memoize.Cache = MapCache;
var getPrototype = overArg(Object.getPrototypeOf, Object);
var objectTag = "[object Object]";
var funcProto = Function.prototype,
  objectProto = Object.prototype;
var funcToString = funcProto.toString;
var hasOwnProperty = objectProto.hasOwnProperty;
var objectCtorString$1 = funcToString.call(Object);
function isPlainObject$1(value) {
  if (!isObjectLike(value) || baseGetTag(value) != objectTag) {
    return false;
  }
  var proto = getPrototype(value);
  if (proto === null) {
    return true;
  }
  var Ctor = hasOwnProperty.call(proto, "constructor") && proto.constructor;
  return (
    typeof Ctor == "function" &&
    Ctor instanceof Ctor &&
    funcToString.call(Ctor) == objectCtorString$1
  );
}
function stackClear() {
  this.__data__ = new ListCache();
  this.size = 0;
}
function stackDelete(key) {
  var data = this.__data__,
    result = data["delete"](key);
  this.size = data.size;
  return result;
}
function stackGet(key) {
  return this.__data__.get(key);
}
function stackHas(key) {
  return this.__data__.has(key);
}
var LARGE_ARRAY_SIZE = 200;
function stackSet(key, value) {
  var data = this.__data__;
  if (data instanceof ListCache) {
    var pairs = data.__data__;
    if (!Map$1 || pairs.length < LARGE_ARRAY_SIZE - 1) {
      pairs.push([key, value]);
      this.size = ++data.size;
      return this;
    }
    data = this.__data__ = new MapCache(pairs);
  }
  data.set(key, value);
  this.size = data.size;
  return this;
}
function Stack(entries) {
  var data = (this.__data__ = new ListCache(entries));
  this.size = data.size;
}
Stack.prototype.clear = stackClear;
Stack.prototype["delete"] = stackDelete;
Stack.prototype.get = stackGet;
Stack.prototype.has = stackHas;
Stack.prototype.set = stackSet;
var freeExports =
  typeof exports == "object" && exports && !exports.nodeType && exports;
var freeModule =
  freeExports &&
  typeof module == "object" &&
  module &&
  !module.nodeType &&
  module;
var moduleExports = freeModule && freeModule.exports === freeExports;
var Buffer = moduleExports ? root.Buffer : void 0;
Buffer ? Buffer.allocUnsafe : void 0;
function cloneBuffer(buffer, isDeep) {
  {
    return buffer.slice();
  }
}
var Uint8Array = root.Uint8Array;
function cloneArrayBuffer(arrayBuffer) {
  var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
  new Uint8Array(result).set(new Uint8Array(arrayBuffer));
  return result;
}
function cloneTypedArray(typedArray, isDeep) {
  var buffer = cloneArrayBuffer(typedArray.buffer);
  return new typedArray.constructor(
    buffer,
    typedArray.byteOffset,
    typedArray.length,
  );
}
function initCloneObject(object) {
  return typeof object.constructor == "function" && !isPrototype(object)
    ? baseCreate(getPrototype(object))
    : {};
}
function createBaseFor(fromRight) {
  return function (object, iteratee, keysFunc) {
    var index = -1,
      iterable = Object(object),
      props = keysFunc(object),
      length = props.length;
    while (length--) {
      var key = props[++index];
      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }
    return object;
  };
}
var baseFor = createBaseFor();
function assignMergeValue(object, key, value) {
  if (
    (value !== void 0 && !eq(object[key], value)) ||
    (value === void 0 && !(key in object))
  ) {
    baseAssignValue(object, key, value);
  }
}
function isArrayLikeObject(value) {
  return isObjectLike(value) && isArrayLike(value);
}
function safeGet(object, key) {
  if (key === "constructor" && typeof object[key] === "function") {
    return;
  }
  if (key == "__proto__") {
    return;
  }
  return object[key];
}
function toPlainObject(value) {
  return copyObject(value, keysIn(value));
}
function baseMergeDeep(
  object,
  source,
  key,
  srcIndex,
  mergeFunc,
  customizer,
  stack,
) {
  var objValue = safeGet(object, key),
    srcValue = safeGet(source, key),
    stacked = stack.get(srcValue);
  if (stacked) {
    assignMergeValue(object, key, stacked);
    return;
  }
  var newValue = customizer
    ? customizer(objValue, srcValue, key + "", object, source, stack)
    : void 0;
  var isCommon = newValue === void 0;
  if (isCommon) {
    var isArr = isArray(srcValue),
      isBuff = !isArr && isBuffer(srcValue),
      isTyped = !isArr && !isBuff && isTypedArray(srcValue);
    newValue = srcValue;
    if (isArr || isBuff || isTyped) {
      if (isArray(objValue)) {
        newValue = objValue;
      } else if (isArrayLikeObject(objValue)) {
        newValue = copyArray(objValue);
      } else if (isBuff) {
        isCommon = false;
        newValue = cloneBuffer(srcValue);
      } else if (isTyped) {
        isCommon = false;
        newValue = cloneTypedArray(srcValue);
      } else {
        newValue = [];
      }
    } else if (isPlainObject$1(srcValue) || isArguments(srcValue)) {
      newValue = objValue;
      if (isArguments(objValue)) {
        newValue = toPlainObject(objValue);
      } else if (!isObject(objValue) || isFunction(objValue)) {
        newValue = initCloneObject(srcValue);
      }
    } else {
      isCommon = false;
    }
  }
  if (isCommon) {
    stack.set(srcValue, newValue);
    mergeFunc(newValue, srcValue, srcIndex, customizer, stack);
    stack["delete"](srcValue);
  }
  assignMergeValue(object, key, newValue);
}
function baseMerge(object, source, srcIndex, customizer, stack) {
  if (object === source) {
    return;
  }
  baseFor(
    source,
    function (srcValue, key) {
      stack || (stack = new Stack());
      if (isObject(srcValue)) {
        baseMergeDeep(
          object,
          source,
          key,
          srcIndex,
          baseMerge,
          customizer,
          stack,
        );
      } else {
        var newValue = customizer
          ? customizer(
              safeGet(object, key),
              srcValue,
              key + "",
              object,
              source,
              stack,
            )
          : void 0;
        if (newValue === void 0) {
          newValue = srcValue;
        }
        assignMergeValue(object, key, newValue);
      }
    },
    keysIn,
  );
}
function customDefaultsMerge(objValue, srcValue, key, object, source, stack) {
  if (isObject(objValue) && isObject(srcValue)) {
    stack.set(srcValue, objValue);
    baseMerge(objValue, srcValue, void 0, customDefaultsMerge, stack);
    stack["delete"](srcValue);
  }
  return objValue;
}
var mergeWith = createAssigner(function (object, source, srcIndex, customizer) {
  baseMerge(object, source, srcIndex, customizer);
});
var defaultsDeep = baseRest(function (args) {
  args.push(void 0, customDefaultsMerge);
  return apply(mergeWith, void 0, args);
});
const millisecondsInWeek = 6048e5;
const millisecondsInDay = 864e5;
const millisecondsInMinute = 6e4;
const millisecondsInHour = 36e5;
const constructFromSymbol = Symbol.for("constructDateFrom");
function constructFrom(date, value) {
  if (typeof date === "function") return date(value);
  if (date && typeof date === "object" && constructFromSymbol in date)
    return date[constructFromSymbol](value);
  if (date instanceof Date) return new date.constructor(value);
  return new Date(value);
}
function toDate(argument, context) {
  return constructFrom(context || argument, argument);
}
function addDays(date, amount, options) {
  const _date = toDate(date, options?.in);
  if (isNaN(amount)) return constructFrom(date, NaN);
  if (!amount) return _date;
  _date.setDate(_date.getDate() + amount);
  return _date;
}
let defaultOptions = {};
function getDefaultOptions() {
  return defaultOptions;
}
function startOfWeek(date, options) {
  const defaultOptions2 = getDefaultOptions();
  const weekStartsOn =
    options?.weekStartsOn ??
    options?.locale?.options?.weekStartsOn ??
    defaultOptions2.weekStartsOn ??
    defaultOptions2.locale?.options?.weekStartsOn ??
    0;
  const _date = toDate(date, options?.in);
  const day = _date.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  _date.setDate(_date.getDate() - diff);
  _date.setHours(0, 0, 0, 0);
  return _date;
}
function startOfISOWeek(date, options) {
  return startOfWeek(date, { ...options, weekStartsOn: 1 });
}
function getISOWeekYear(date, options) {
  const _date = toDate(date, options?.in);
  const year = _date.getFullYear();
  const fourthOfJanuaryOfNextYear = constructFrom(_date, 0);
  fourthOfJanuaryOfNextYear.setFullYear(year + 1, 0, 4);
  fourthOfJanuaryOfNextYear.setHours(0, 0, 0, 0);
  const startOfNextYear = startOfISOWeek(fourthOfJanuaryOfNextYear);
  const fourthOfJanuaryOfThisYear = constructFrom(_date, 0);
  fourthOfJanuaryOfThisYear.setFullYear(year, 0, 4);
  fourthOfJanuaryOfThisYear.setHours(0, 0, 0, 0);
  const startOfThisYear = startOfISOWeek(fourthOfJanuaryOfThisYear);
  if (_date.getTime() >= startOfNextYear.getTime()) {
    return year + 1;
  } else if (_date.getTime() >= startOfThisYear.getTime()) {
    return year;
  } else {
    return year - 1;
  }
}
function getTimezoneOffsetInMilliseconds(date) {
  const _date = toDate(date);
  const utcDate = new Date(
    Date.UTC(
      _date.getFullYear(),
      _date.getMonth(),
      _date.getDate(),
      _date.getHours(),
      _date.getMinutes(),
      _date.getSeconds(),
      _date.getMilliseconds(),
    ),
  );
  utcDate.setUTCFullYear(_date.getFullYear());
  return +date - +utcDate;
}
function normalizeDates(context, ...dates) {
  const normalize = constructFrom.bind(
    null,
    dates.find((date) => typeof date === "object"),
  );
  return dates.map(normalize);
}
function startOfDay(date, options) {
  const _date = toDate(date, options?.in);
  _date.setHours(0, 0, 0, 0);
  return _date;
}
function differenceInCalendarDays(laterDate, earlierDate, options) {
  const [laterDate_, earlierDate_] = normalizeDates(
    options?.in,
    laterDate,
    earlierDate,
  );
  const laterStartOfDay = startOfDay(laterDate_);
  const earlierStartOfDay = startOfDay(earlierDate_);
  const laterTimestamp =
    +laterStartOfDay - getTimezoneOffsetInMilliseconds(laterStartOfDay);
  const earlierTimestamp =
    +earlierStartOfDay - getTimezoneOffsetInMilliseconds(earlierStartOfDay);
  return Math.round((laterTimestamp - earlierTimestamp) / millisecondsInDay);
}
function startOfISOWeekYear(date, options) {
  const year = getISOWeekYear(date, options);
  const fourthOfJanuary = constructFrom(date, 0);
  fourthOfJanuary.setFullYear(year, 0, 4);
  fourthOfJanuary.setHours(0, 0, 0, 0);
  return startOfISOWeek(fourthOfJanuary);
}
function isDate(value) {
  return (
    value instanceof Date ||
    (typeof value === "object" &&
      Object.prototype.toString.call(value) === "[object Date]")
  );
}
function isValid(date) {
  return !((!isDate(date) && typeof date !== "number") || isNaN(+toDate(date)));
}
function differenceInDays(laterDate, earlierDate, options) {
  const [laterDate_, earlierDate_] = normalizeDates(
    options?.in,
    laterDate,
    earlierDate,
  );
  const sign = compareLocalAsc(laterDate_, earlierDate_);
  const difference = Math.abs(
    differenceInCalendarDays(laterDate_, earlierDate_),
  );
  laterDate_.setDate(laterDate_.getDate() - sign * difference);
  const isLastDayNotFull = Number(
    compareLocalAsc(laterDate_, earlierDate_) === -sign,
  );
  const result = sign * (difference - isLastDayNotFull);
  return result === 0 ? 0 : result;
}
function compareLocalAsc(laterDate, earlierDate) {
  const diff =
    laterDate.getFullYear() - earlierDate.getFullYear() ||
    laterDate.getMonth() - earlierDate.getMonth() ||
    laterDate.getDate() - earlierDate.getDate() ||
    laterDate.getHours() - earlierDate.getHours() ||
    laterDate.getMinutes() - earlierDate.getMinutes() ||
    laterDate.getSeconds() - earlierDate.getSeconds() ||
    laterDate.getMilliseconds() - earlierDate.getMilliseconds();
  if (diff < 0) return -1;
  if (diff > 0) return 1;
  return diff;
}
function startOfQuarter(date, options) {
  const _date = toDate(date, options?.in);
  const currentMonth = _date.getMonth();
  const month = currentMonth - (currentMonth % 3);
  _date.setMonth(month, 1);
  _date.setHours(0, 0, 0, 0);
  return _date;
}
function startOfYear(date, options) {
  const date_ = toDate(date, options?.in);
  date_.setFullYear(date_.getFullYear(), 0, 1);
  date_.setHours(0, 0, 0, 0);
  return date_;
}
function endOfWeek(date, options) {
  const defaultOptions2 = getDefaultOptions();
  const weekStartsOn =
    options?.weekStartsOn ??
    options?.locale?.options?.weekStartsOn ??
    defaultOptions2.weekStartsOn ??
    defaultOptions2.locale?.options?.weekStartsOn ??
    0;
  const _date = toDate(date, options?.in);
  const day = _date.getDay();
  const diff = (day < weekStartsOn ? -7 : 0) + 6 - (day - weekStartsOn);
  _date.setDate(_date.getDate() + diff);
  _date.setHours(23, 59, 59, 999);
  return _date;
}
function endOfQuarter(date, options) {
  const _date = toDate(date, options?.in);
  const currentMonth = _date.getMonth();
  const month = currentMonth - (currentMonth % 3) + 3;
  _date.setMonth(month, 0);
  _date.setHours(23, 59, 59, 999);
  return _date;
}
const formatDistanceLocale = {
  lessThanXSeconds: {
    one: "less than a second",
    other: "less than {{count}} seconds",
  },
  xSeconds: {
    one: "1 second",
    other: "{{count}} seconds",
  },
  halfAMinute: "half a minute",
  lessThanXMinutes: {
    one: "less than a minute",
    other: "less than {{count}} minutes",
  },
  xMinutes: {
    one: "1 minute",
    other: "{{count}} minutes",
  },
  aboutXHours: {
    one: "about 1 hour",
    other: "about {{count}} hours",
  },
  xHours: {
    one: "1 hour",
    other: "{{count}} hours",
  },
  xDays: {
    one: "1 day",
    other: "{{count}} days",
  },
  aboutXWeeks: {
    one: "about 1 week",
    other: "about {{count}} weeks",
  },
  xWeeks: {
    one: "1 week",
    other: "{{count}} weeks",
  },
  aboutXMonths: {
    one: "about 1 month",
    other: "about {{count}} months",
  },
  xMonths: {
    one: "1 month",
    other: "{{count}} months",
  },
  aboutXYears: {
    one: "about 1 year",
    other: "about {{count}} years",
  },
  xYears: {
    one: "1 year",
    other: "{{count}} years",
  },
  overXYears: {
    one: "over 1 year",
    other: "over {{count}} years",
  },
  almostXYears: {
    one: "almost 1 year",
    other: "almost {{count}} years",
  },
};
const formatDistance = (token, count, options) => {
  let result;
  const tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "string") {
    result = tokenValue;
  } else if (count === 1) {
    result = tokenValue.one;
  } else {
    result = tokenValue.other.replace("{{count}}", count.toString());
  }
  if (options?.addSuffix) {
    if (options.comparison && options.comparison > 0) {
      return "in " + result;
    } else {
      return result + " ago";
    }
  }
  return result;
};
function buildFormatLongFn(args) {
  return (options = {}) => {
    const width = options.width ? String(options.width) : args.defaultWidth;
    const format2 = args.formats[width] || args.formats[args.defaultWidth];
    return format2;
  };
}
const dateFormats = {
  full: "EEEE, MMMM do, y",
  long: "MMMM do, y",
  medium: "MMM d, y",
  short: "MM/dd/yyyy",
};
const timeFormats = {
  full: "h:mm:ss a zzzz",
  long: "h:mm:ss a z",
  medium: "h:mm:ss a",
  short: "h:mm a",
};
const dateTimeFormats = {
  full: "{{date}} 'at' {{time}}",
  long: "{{date}} 'at' {{time}}",
  medium: "{{date}}, {{time}}",
  short: "{{date}}, {{time}}",
};
const formatLong = {
  date: buildFormatLongFn({
    formats: dateFormats,
    defaultWidth: "full",
  }),
  time: buildFormatLongFn({
    formats: timeFormats,
    defaultWidth: "full",
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats,
    defaultWidth: "full",
  }),
};
const formatRelativeLocale = {
  lastWeek: "'last' eeee 'at' p",
  yesterday: "'yesterday at' p",
  today: "'today at' p",
  tomorrow: "'tomorrow at' p",
  nextWeek: "eeee 'at' p",
  other: "P",
};
const formatRelative = (token, _date, _baseDate, _options) =>
  formatRelativeLocale[token];
function buildLocalizeFn(args) {
  return (value, options) => {
    const context = options?.context ? String(options.context) : "standalone";
    let valuesArray;
    if (context === "formatting" && args.formattingValues) {
      const defaultWidth = args.defaultFormattingWidth || args.defaultWidth;
      const width = options?.width ? String(options.width) : defaultWidth;
      valuesArray =
        args.formattingValues[width] || args.formattingValues[defaultWidth];
    } else {
      const defaultWidth = args.defaultWidth;
      const width = options?.width ? String(options.width) : args.defaultWidth;
      valuesArray = args.values[width] || args.values[defaultWidth];
    }
    const index = args.argumentCallback ? args.argumentCallback(value) : value;
    return valuesArray[index];
  };
}
const eraValues = {
  narrow: ["B", "A"],
  abbreviated: ["BC", "AD"],
  wide: ["Before Christ", "Anno Domini"],
};
const quarterValues = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["Q1", "Q2", "Q3", "Q4"],
  wide: ["1st quarter", "2nd quarter", "3rd quarter", "4th quarter"],
};
const monthValues = {
  narrow: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
  abbreviated: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ],
  wide: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
};
const dayValues = {
  narrow: ["S", "M", "T", "W", "T", "F", "S"],
  short: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  abbreviated: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  wide: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ],
};
const dayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "mi",
    noon: "n",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night",
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "midnight",
    noon: "noon",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night",
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "midnight",
    noon: "noon",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night",
  },
};
const formattingDayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "mi",
    noon: "n",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night",
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "midnight",
    noon: "noon",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night",
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "midnight",
    noon: "noon",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night",
  },
};
const ordinalNumber = (dirtyNumber, _options) => {
  const number = Number(dirtyNumber);
  const rem100 = number % 100;
  if (rem100 > 20 || rem100 < 10) {
    switch (rem100 % 10) {
      case 1:
        return number + "st";
      case 2:
        return number + "nd";
      case 3:
        return number + "rd";
    }
  }
  return number + "th";
};
const localize = {
  ordinalNumber,
  era: buildLocalizeFn({
    values: eraValues,
    defaultWidth: "wide",
  }),
  quarter: buildLocalizeFn({
    values: quarterValues,
    defaultWidth: "wide",
    argumentCallback: (quarter) => quarter - 1,
  }),
  month: buildLocalizeFn({
    values: monthValues,
    defaultWidth: "wide",
  }),
  day: buildLocalizeFn({
    values: dayValues,
    defaultWidth: "wide",
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues,
    defaultWidth: "wide",
    formattingValues: formattingDayPeriodValues,
    defaultFormattingWidth: "wide",
  }),
};
function buildMatchFn(args) {
  return (string, options = {}) => {
    const width = options.width;
    const matchPattern =
      (width && args.matchPatterns[width]) ||
      args.matchPatterns[args.defaultMatchWidth];
    const matchResult = string.match(matchPattern);
    if (!matchResult) {
      return null;
    }
    const matchedString = matchResult[0];
    const parsePatterns =
      (width && args.parsePatterns[width]) ||
      args.parsePatterns[args.defaultParseWidth];
    const key = Array.isArray(parsePatterns)
      ? findIndex(parsePatterns, (pattern) => pattern.test(matchedString))
      : // [TODO] -- I challenge you to fix the type
        findKey(parsePatterns, (pattern) => pattern.test(matchedString));
    let value;
    value = args.valueCallback ? args.valueCallback(key) : key;
    value = options.valueCallback
      ? // [TODO] -- I challenge you to fix the type
        options.valueCallback(value)
      : value;
    const rest = string.slice(matchedString.length);
    return { value, rest };
  };
}
function findKey(object, predicate) {
  for (const key in object) {
    if (
      Object.prototype.hasOwnProperty.call(object, key) &&
      predicate(object[key])
    ) {
      return key;
    }
  }
  return void 0;
}
function findIndex(array, predicate) {
  for (let key = 0; key < array.length; key++) {
    if (predicate(array[key])) {
      return key;
    }
  }
  return void 0;
}
function buildMatchPatternFn(args) {
  return (string, options = {}) => {
    const matchResult = string.match(args.matchPattern);
    if (!matchResult) return null;
    const matchedString = matchResult[0];
    const parseResult = string.match(args.parsePattern);
    if (!parseResult) return null;
    let value = args.valueCallback
      ? args.valueCallback(parseResult[0])
      : parseResult[0];
    value = options.valueCallback ? options.valueCallback(value) : value;
    const rest = string.slice(matchedString.length);
    return { value, rest };
  };
}
const matchOrdinalNumberPattern = /^(\d+)(th|st|nd|rd)?/i;
const parseOrdinalNumberPattern = /\d+/i;
const matchEraPatterns = {
  narrow: /^(b|a)/i,
  abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
  wide: /^(before christ|before common era|anno domini|common era)/i,
};
const parseEraPatterns = {
  any: [/^b/i, /^(a|c)/i],
};
const matchQuarterPatterns = {
  narrow: /^[1234]/i,
  abbreviated: /^q[1234]/i,
  wide: /^[1234](th|st|nd|rd)? quarter/i,
};
const parseQuarterPatterns = {
  any: [/1/i, /2/i, /3/i, /4/i],
};
const matchMonthPatterns = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
  wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i,
};
const parseMonthPatterns = {
  narrow: [
    /^j/i,
    /^f/i,
    /^m/i,
    /^a/i,
    /^m/i,
    /^j/i,
    /^j/i,
    /^a/i,
    /^s/i,
    /^o/i,
    /^n/i,
    /^d/i,
  ],
  any: [
    /^ja/i,
    /^f/i,
    /^mar/i,
    /^ap/i,
    /^may/i,
    /^jun/i,
    /^jul/i,
    /^au/i,
    /^s/i,
    /^o/i,
    /^n/i,
    /^d/i,
  ],
};
const matchDayPatterns = {
  narrow: /^[smtwf]/i,
  short: /^(su|mo|tu|we|th|fr|sa)/i,
  abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
  wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i,
};
const parseDayPatterns = {
  narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
  any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i],
};
const matchDayPeriodPatterns = {
  narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
  any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i,
};
const parseDayPeriodPatterns = {
  any: {
    am: /^a/i,
    pm: /^p/i,
    midnight: /^mi/i,
    noon: /^no/i,
    morning: /morning/i,
    afternoon: /afternoon/i,
    evening: /evening/i,
    night: /night/i,
  },
};
const match = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern,
    parsePattern: parseOrdinalNumberPattern,
    valueCallback: (value) => parseInt(value, 10),
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseEraPatterns,
    defaultParseWidth: "any",
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseQuarterPatterns,
    defaultParseWidth: "any",
    valueCallback: (index) => index + 1,
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseMonthPatterns,
    defaultParseWidth: "any",
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseDayPatterns,
    defaultParseWidth: "any",
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns,
    defaultMatchWidth: "any",
    parsePatterns: parseDayPeriodPatterns,
    defaultParseWidth: "any",
  }),
};
const enUS = {
  code: "en-US",
  formatDistance,
  formatLong,
  formatRelative,
  localize,
  match,
  options: {
    weekStartsOn: 0,
    firstWeekContainsDate: 1,
  },
};
function getDayOfYear(date, options) {
  const _date = toDate(date, options?.in);
  const diff = differenceInCalendarDays(_date, startOfYear(_date));
  const dayOfYear = diff + 1;
  return dayOfYear;
}
function getISOWeek(date, options) {
  const _date = toDate(date, options?.in);
  const diff = +startOfISOWeek(_date) - +startOfISOWeekYear(_date);
  return Math.round(diff / millisecondsInWeek) + 1;
}
function getWeekYear(date, options) {
  const _date = toDate(date, options?.in);
  const year = _date.getFullYear();
  const defaultOptions2 = getDefaultOptions();
  const firstWeekContainsDate =
    options?.firstWeekContainsDate ??
    options?.locale?.options?.firstWeekContainsDate ??
    defaultOptions2.firstWeekContainsDate ??
    defaultOptions2.locale?.options?.firstWeekContainsDate ??
    1;
  const firstWeekOfNextYear = constructFrom(options?.in || date, 0);
  firstWeekOfNextYear.setFullYear(year + 1, 0, firstWeekContainsDate);
  firstWeekOfNextYear.setHours(0, 0, 0, 0);
  const startOfNextYear = startOfWeek(firstWeekOfNextYear, options);
  const firstWeekOfThisYear = constructFrom(options?.in || date, 0);
  firstWeekOfThisYear.setFullYear(year, 0, firstWeekContainsDate);
  firstWeekOfThisYear.setHours(0, 0, 0, 0);
  const startOfThisYear = startOfWeek(firstWeekOfThisYear, options);
  if (+_date >= +startOfNextYear) {
    return year + 1;
  } else if (+_date >= +startOfThisYear) {
    return year;
  } else {
    return year - 1;
  }
}
function startOfWeekYear(date, options) {
  const defaultOptions2 = getDefaultOptions();
  const firstWeekContainsDate =
    options?.firstWeekContainsDate ??
    options?.locale?.options?.firstWeekContainsDate ??
    defaultOptions2.firstWeekContainsDate ??
    defaultOptions2.locale?.options?.firstWeekContainsDate ??
    1;
  const year = getWeekYear(date, options);
  const firstWeek = constructFrom(options?.in || date, 0);
  firstWeek.setFullYear(year, 0, firstWeekContainsDate);
  firstWeek.setHours(0, 0, 0, 0);
  const _date = startOfWeek(firstWeek, options);
  return _date;
}
function getWeek(date, options) {
  const _date = toDate(date, options?.in);
  const diff = +startOfWeek(_date, options) - +startOfWeekYear(_date, options);
  return Math.round(diff / millisecondsInWeek) + 1;
}
function addLeadingZeros(number, targetLength) {
  const sign = number < 0 ? "-" : "";
  const output = Math.abs(number).toString().padStart(targetLength, "0");
  return sign + output;
}
const lightFormatters = {
  // Year
  y(date, token) {
    const signedYear = date.getFullYear();
    const year = signedYear > 0 ? signedYear : 1 - signedYear;
    return addLeadingZeros(token === "yy" ? year % 100 : year, token.length);
  },
  // Month
  M(date, token) {
    const month = date.getMonth();
    return token === "M" ? String(month + 1) : addLeadingZeros(month + 1, 2);
  },
  // Day of the month
  d(date, token) {
    return addLeadingZeros(date.getDate(), token.length);
  },
  // AM or PM
  a(date, token) {
    const dayPeriodEnumValue = date.getHours() / 12 >= 1 ? "pm" : "am";
    switch (token) {
      case "a":
      case "aa":
        return dayPeriodEnumValue.toUpperCase();
      case "aaa":
        return dayPeriodEnumValue;
      case "aaaaa":
        return dayPeriodEnumValue[0];
      case "aaaa":
      default:
        return dayPeriodEnumValue === "am" ? "a.m." : "p.m.";
    }
  },
  // Hour [1-12]
  h(date, token) {
    return addLeadingZeros(date.getHours() % 12 || 12, token.length);
  },
  // Hour [0-23]
  H(date, token) {
    return addLeadingZeros(date.getHours(), token.length);
  },
  // Minute
  m(date, token) {
    return addLeadingZeros(date.getMinutes(), token.length);
  },
  // Second
  s(date, token) {
    return addLeadingZeros(date.getSeconds(), token.length);
  },
  // Fraction of second
  S(date, token) {
    const numberOfDigits = token.length;
    const milliseconds = date.getMilliseconds();
    const fractionalSeconds = Math.trunc(
      milliseconds * Math.pow(10, numberOfDigits - 3),
    );
    return addLeadingZeros(fractionalSeconds, token.length);
  },
};
const dayPeriodEnum = {
  midnight: "midnight",
  noon: "noon",
  morning: "morning",
  afternoon: "afternoon",
  evening: "evening",
  night: "night",
};
const formatters = {
  // Era
  G: function (date, token, localize2) {
    const era = date.getFullYear() > 0 ? 1 : 0;
    switch (token) {
      case "G":
      case "GG":
      case "GGG":
        return localize2.era(era, { width: "abbreviated" });
      case "GGGGG":
        return localize2.era(era, { width: "narrow" });
      case "GGGG":
      default:
        return localize2.era(era, { width: "wide" });
    }
  },
  // Year
  y: function (date, token, localize2) {
    if (token === "yo") {
      const signedYear = date.getFullYear();
      const year = signedYear > 0 ? signedYear : 1 - signedYear;
      return localize2.ordinalNumber(year, { unit: "year" });
    }
    return lightFormatters.y(date, token);
  },
  // Local week-numbering year
  Y: function (date, token, localize2, options) {
    const signedWeekYear = getWeekYear(date, options);
    const weekYear = signedWeekYear > 0 ? signedWeekYear : 1 - signedWeekYear;
    if (token === "YY") {
      const twoDigitYear = weekYear % 100;
      return addLeadingZeros(twoDigitYear, 2);
    }
    if (token === "Yo") {
      return localize2.ordinalNumber(weekYear, { unit: "year" });
    }
    return addLeadingZeros(weekYear, token.length);
  },
  // ISO week-numbering year
  R: function (date, token) {
    const isoWeekYear = getISOWeekYear(date);
    return addLeadingZeros(isoWeekYear, token.length);
  },
  // Extended year. This is a single number designating the year of this calendar system.
  // The main difference between `y` and `u` localizers are B.C. years:
  // | Year | `y` | `u` |
  // |------|-----|-----|
  // | AC 1 |   1 |   1 |
  // | BC 1 |   1 |   0 |
  // | BC 2 |   2 |  -1 |
  // Also `yy` always returns the last two digits of a year,
  // while `uu` pads single digit years to 2 characters and returns other years unchanged.
  u: function (date, token) {
    const year = date.getFullYear();
    return addLeadingZeros(year, token.length);
  },
  // Quarter
  Q: function (date, token, localize2) {
    const quarter = Math.ceil((date.getMonth() + 1) / 3);
    switch (token) {
      case "Q":
        return String(quarter);
      case "QQ":
        return addLeadingZeros(quarter, 2);
      case "Qo":
        return localize2.ordinalNumber(quarter, { unit: "quarter" });
      case "QQQ":
        return localize2.quarter(quarter, {
          width: "abbreviated",
          context: "formatting",
        });
      case "QQQQQ":
        return localize2.quarter(quarter, {
          width: "narrow",
          context: "formatting",
        });
      case "QQQQ":
      default:
        return localize2.quarter(quarter, {
          width: "wide",
          context: "formatting",
        });
    }
  },
  // Stand-alone quarter
  q: function (date, token, localize2) {
    const quarter = Math.ceil((date.getMonth() + 1) / 3);
    switch (token) {
      case "q":
        return String(quarter);
      case "qq":
        return addLeadingZeros(quarter, 2);
      case "qo":
        return localize2.ordinalNumber(quarter, { unit: "quarter" });
      case "qqq":
        return localize2.quarter(quarter, {
          width: "abbreviated",
          context: "standalone",
        });
      case "qqqqq":
        return localize2.quarter(quarter, {
          width: "narrow",
          context: "standalone",
        });
      case "qqqq":
      default:
        return localize2.quarter(quarter, {
          width: "wide",
          context: "standalone",
        });
    }
  },
  // Month
  M: function (date, token, localize2) {
    const month = date.getMonth();
    switch (token) {
      case "M":
      case "MM":
        return lightFormatters.M(date, token);
      case "Mo":
        return localize2.ordinalNumber(month + 1, { unit: "month" });
      case "MMM":
        return localize2.month(month, {
          width: "abbreviated",
          context: "formatting",
        });
      case "MMMMM":
        return localize2.month(month, {
          width: "narrow",
          context: "formatting",
        });
      case "MMMM":
      default:
        return localize2.month(month, { width: "wide", context: "formatting" });
    }
  },
  // Stand-alone month
  L: function (date, token, localize2) {
    const month = date.getMonth();
    switch (token) {
      case "L":
        return String(month + 1);
      case "LL":
        return addLeadingZeros(month + 1, 2);
      case "Lo":
        return localize2.ordinalNumber(month + 1, { unit: "month" });
      case "LLL":
        return localize2.month(month, {
          width: "abbreviated",
          context: "standalone",
        });
      case "LLLLL":
        return localize2.month(month, {
          width: "narrow",
          context: "standalone",
        });
      case "LLLL":
      default:
        return localize2.month(month, { width: "wide", context: "standalone" });
    }
  },
  // Local week of year
  w: function (date, token, localize2, options) {
    const week = getWeek(date, options);
    if (token === "wo") {
      return localize2.ordinalNumber(week, { unit: "week" });
    }
    return addLeadingZeros(week, token.length);
  },
  // ISO week of year
  I: function (date, token, localize2) {
    const isoWeek = getISOWeek(date);
    if (token === "Io") {
      return localize2.ordinalNumber(isoWeek, { unit: "week" });
    }
    return addLeadingZeros(isoWeek, token.length);
  },
  // Day of the month
  d: function (date, token, localize2) {
    if (token === "do") {
      return localize2.ordinalNumber(date.getDate(), { unit: "date" });
    }
    return lightFormatters.d(date, token);
  },
  // Day of year
  D: function (date, token, localize2) {
    const dayOfYear = getDayOfYear(date);
    if (token === "Do") {
      return localize2.ordinalNumber(dayOfYear, { unit: "dayOfYear" });
    }
    return addLeadingZeros(dayOfYear, token.length);
  },
  // Day of week
  E: function (date, token, localize2) {
    const dayOfWeek = date.getDay();
    switch (token) {
      case "E":
      case "EE":
      case "EEE":
        return localize2.day(dayOfWeek, {
          width: "abbreviated",
          context: "formatting",
        });
      case "EEEEE":
        return localize2.day(dayOfWeek, {
          width: "narrow",
          context: "formatting",
        });
      case "EEEEEE":
        return localize2.day(dayOfWeek, {
          width: "short",
          context: "formatting",
        });
      case "EEEE":
      default:
        return localize2.day(dayOfWeek, {
          width: "wide",
          context: "formatting",
        });
    }
  },
  // Local day of week
  e: function (date, token, localize2, options) {
    const dayOfWeek = date.getDay();
    const localDayOfWeek = (dayOfWeek - options.weekStartsOn + 8) % 7 || 7;
    switch (token) {
      case "e":
        return String(localDayOfWeek);
      case "ee":
        return addLeadingZeros(localDayOfWeek, 2);
      case "eo":
        return localize2.ordinalNumber(localDayOfWeek, { unit: "day" });
      case "eee":
        return localize2.day(dayOfWeek, {
          width: "abbreviated",
          context: "formatting",
        });
      case "eeeee":
        return localize2.day(dayOfWeek, {
          width: "narrow",
          context: "formatting",
        });
      case "eeeeee":
        return localize2.day(dayOfWeek, {
          width: "short",
          context: "formatting",
        });
      case "eeee":
      default:
        return localize2.day(dayOfWeek, {
          width: "wide",
          context: "formatting",
        });
    }
  },
  // Stand-alone local day of week
  c: function (date, token, localize2, options) {
    const dayOfWeek = date.getDay();
    const localDayOfWeek = (dayOfWeek - options.weekStartsOn + 8) % 7 || 7;
    switch (token) {
      case "c":
        return String(localDayOfWeek);
      case "cc":
        return addLeadingZeros(localDayOfWeek, token.length);
      case "co":
        return localize2.ordinalNumber(localDayOfWeek, { unit: "day" });
      case "ccc":
        return localize2.day(dayOfWeek, {
          width: "abbreviated",
          context: "standalone",
        });
      case "ccccc":
        return localize2.day(dayOfWeek, {
          width: "narrow",
          context: "standalone",
        });
      case "cccccc":
        return localize2.day(dayOfWeek, {
          width: "short",
          context: "standalone",
        });
      case "cccc":
      default:
        return localize2.day(dayOfWeek, {
          width: "wide",
          context: "standalone",
        });
    }
  },
  // ISO day of week
  i: function (date, token, localize2) {
    const dayOfWeek = date.getDay();
    const isoDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
    switch (token) {
      case "i":
        return String(isoDayOfWeek);
      case "ii":
        return addLeadingZeros(isoDayOfWeek, token.length);
      case "io":
        return localize2.ordinalNumber(isoDayOfWeek, { unit: "day" });
      case "iii":
        return localize2.day(dayOfWeek, {
          width: "abbreviated",
          context: "formatting",
        });
      case "iiiii":
        return localize2.day(dayOfWeek, {
          width: "narrow",
          context: "formatting",
        });
      case "iiiiii":
        return localize2.day(dayOfWeek, {
          width: "short",
          context: "formatting",
        });
      case "iiii":
      default:
        return localize2.day(dayOfWeek, {
          width: "wide",
          context: "formatting",
        });
    }
  },
  // AM or PM
  a: function (date, token, localize2) {
    const hours = date.getHours();
    const dayPeriodEnumValue = hours / 12 >= 1 ? "pm" : "am";
    switch (token) {
      case "a":
      case "aa":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting",
        });
      case "aaa":
        return localize2
          .dayPeriod(dayPeriodEnumValue, {
            width: "abbreviated",
            context: "formatting",
          })
          .toLowerCase();
      case "aaaaa":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "narrow",
          context: "formatting",
        });
      case "aaaa":
      default:
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "wide",
          context: "formatting",
        });
    }
  },
  // AM, PM, midnight, noon
  b: function (date, token, localize2) {
    const hours = date.getHours();
    let dayPeriodEnumValue;
    if (hours === 12) {
      dayPeriodEnumValue = dayPeriodEnum.noon;
    } else if (hours === 0) {
      dayPeriodEnumValue = dayPeriodEnum.midnight;
    } else {
      dayPeriodEnumValue = hours / 12 >= 1 ? "pm" : "am";
    }
    switch (token) {
      case "b":
      case "bb":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting",
        });
      case "bbb":
        return localize2
          .dayPeriod(dayPeriodEnumValue, {
            width: "abbreviated",
            context: "formatting",
          })
          .toLowerCase();
      case "bbbbb":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "narrow",
          context: "formatting",
        });
      case "bbbb":
      default:
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "wide",
          context: "formatting",
        });
    }
  },
  // in the morning, in the afternoon, in the evening, at night
  B: function (date, token, localize2) {
    const hours = date.getHours();
    let dayPeriodEnumValue;
    if (hours >= 17) {
      dayPeriodEnumValue = dayPeriodEnum.evening;
    } else if (hours >= 12) {
      dayPeriodEnumValue = dayPeriodEnum.afternoon;
    } else if (hours >= 4) {
      dayPeriodEnumValue = dayPeriodEnum.morning;
    } else {
      dayPeriodEnumValue = dayPeriodEnum.night;
    }
    switch (token) {
      case "B":
      case "BB":
      case "BBB":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting",
        });
      case "BBBBB":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "narrow",
          context: "formatting",
        });
      case "BBBB":
      default:
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "wide",
          context: "formatting",
        });
    }
  },
  // Hour [1-12]
  h: function (date, token, localize2) {
    if (token === "ho") {
      let hours = date.getHours() % 12;
      if (hours === 0) hours = 12;
      return localize2.ordinalNumber(hours, { unit: "hour" });
    }
    return lightFormatters.h(date, token);
  },
  // Hour [0-23]
  H: function (date, token, localize2) {
    if (token === "Ho") {
      return localize2.ordinalNumber(date.getHours(), { unit: "hour" });
    }
    return lightFormatters.H(date, token);
  },
  // Hour [0-11]
  K: function (date, token, localize2) {
    const hours = date.getHours() % 12;
    if (token === "Ko") {
      return localize2.ordinalNumber(hours, { unit: "hour" });
    }
    return addLeadingZeros(hours, token.length);
  },
  // Hour [1-24]
  k: function (date, token, localize2) {
    let hours = date.getHours();
    if (hours === 0) hours = 24;
    if (token === "ko") {
      return localize2.ordinalNumber(hours, { unit: "hour" });
    }
    return addLeadingZeros(hours, token.length);
  },
  // Minute
  m: function (date, token, localize2) {
    if (token === "mo") {
      return localize2.ordinalNumber(date.getMinutes(), { unit: "minute" });
    }
    return lightFormatters.m(date, token);
  },
  // Second
  s: function (date, token, localize2) {
    if (token === "so") {
      return localize2.ordinalNumber(date.getSeconds(), { unit: "second" });
    }
    return lightFormatters.s(date, token);
  },
  // Fraction of second
  S: function (date, token) {
    return lightFormatters.S(date, token);
  },
  // Timezone (ISO-8601. If offset is 0, output is always `'Z'`)
  X: function (date, token, _localize) {
    const timezoneOffset = date.getTimezoneOffset();
    if (timezoneOffset === 0) {
      return "Z";
    }
    switch (token) {
      case "X":
        return formatTimezoneWithOptionalMinutes(timezoneOffset);
      case "XXXX":
      case "XX":
        return formatTimezone(timezoneOffset);
      case "XXXXX":
      case "XXX":
      default:
        return formatTimezone(timezoneOffset, ":");
    }
  },
  // Timezone (ISO-8601. If offset is 0, output is `'+00:00'` or equivalent)
  x: function (date, token, _localize) {
    const timezoneOffset = date.getTimezoneOffset();
    switch (token) {
      case "x":
        return formatTimezoneWithOptionalMinutes(timezoneOffset);
      case "xxxx":
      case "xx":
        return formatTimezone(timezoneOffset);
      case "xxxxx":
      case "xxx":
      default:
        return formatTimezone(timezoneOffset, ":");
    }
  },
  // Timezone (GMT)
  O: function (date, token, _localize) {
    const timezoneOffset = date.getTimezoneOffset();
    switch (token) {
      case "O":
      case "OO":
      case "OOO":
        return "GMT" + formatTimezoneShort(timezoneOffset, ":");
      case "OOOO":
      default:
        return "GMT" + formatTimezone(timezoneOffset, ":");
    }
  },
  // Timezone (specific non-location)
  z: function (date, token, _localize) {
    const timezoneOffset = date.getTimezoneOffset();
    switch (token) {
      case "z":
      case "zz":
      case "zzz":
        return "GMT" + formatTimezoneShort(timezoneOffset, ":");
      case "zzzz":
      default:
        return "GMT" + formatTimezone(timezoneOffset, ":");
    }
  },
  // Seconds timestamp
  t: function (date, token, _localize) {
    const timestamp = Math.trunc(+date / 1e3);
    return addLeadingZeros(timestamp, token.length);
  },
  // Milliseconds timestamp
  T: function (date, token, _localize) {
    return addLeadingZeros(+date, token.length);
  },
};
function formatTimezoneShort(offset, delimiter = "") {
  const sign = offset > 0 ? "-" : "+";
  const absOffset = Math.abs(offset);
  const hours = Math.trunc(absOffset / 60);
  const minutes = absOffset % 60;
  if (minutes === 0) {
    return sign + String(hours);
  }
  return sign + String(hours) + delimiter + addLeadingZeros(minutes, 2);
}
function formatTimezoneWithOptionalMinutes(offset, delimiter) {
  if (offset % 60 === 0) {
    const sign = offset > 0 ? "-" : "+";
    return sign + addLeadingZeros(Math.abs(offset) / 60, 2);
  }
  return formatTimezone(offset, delimiter);
}
function formatTimezone(offset, delimiter = "") {
  const sign = offset > 0 ? "-" : "+";
  const absOffset = Math.abs(offset);
  const hours = addLeadingZeros(Math.trunc(absOffset / 60), 2);
  const minutes = addLeadingZeros(absOffset % 60, 2);
  return sign + hours + delimiter + minutes;
}
const dateLongFormatter = (pattern, formatLong2) => {
  switch (pattern) {
    case "P":
      return formatLong2.date({ width: "short" });
    case "PP":
      return formatLong2.date({ width: "medium" });
    case "PPP":
      return formatLong2.date({ width: "long" });
    case "PPPP":
    default:
      return formatLong2.date({ width: "full" });
  }
};
const timeLongFormatter = (pattern, formatLong2) => {
  switch (pattern) {
    case "p":
      return formatLong2.time({ width: "short" });
    case "pp":
      return formatLong2.time({ width: "medium" });
    case "ppp":
      return formatLong2.time({ width: "long" });
    case "pppp":
    default:
      return formatLong2.time({ width: "full" });
  }
};
const dateTimeLongFormatter = (pattern, formatLong2) => {
  const matchResult = pattern.match(/(P+)(p+)?/) || [];
  const datePattern = matchResult[1];
  const timePattern = matchResult[2];
  if (!timePattern) {
    return dateLongFormatter(pattern, formatLong2);
  }
  let dateTimeFormat;
  switch (datePattern) {
    case "P":
      dateTimeFormat = formatLong2.dateTime({ width: "short" });
      break;
    case "PP":
      dateTimeFormat = formatLong2.dateTime({ width: "medium" });
      break;
    case "PPP":
      dateTimeFormat = formatLong2.dateTime({ width: "long" });
      break;
    case "PPPP":
    default:
      dateTimeFormat = formatLong2.dateTime({ width: "full" });
      break;
  }
  return dateTimeFormat
    .replace("{{date}}", dateLongFormatter(datePattern, formatLong2))
    .replace("{{time}}", timeLongFormatter(timePattern, formatLong2));
};
const longFormatters = {
  p: timeLongFormatter,
  P: dateTimeLongFormatter,
};
const dayOfYearTokenRE = /^D+$/;
const weekYearTokenRE = /^Y+$/;
const throwTokens = ["D", "DD", "YY", "YYYY"];
function isProtectedDayOfYearToken(token) {
  return dayOfYearTokenRE.test(token);
}
function isProtectedWeekYearToken(token) {
  return weekYearTokenRE.test(token);
}
function warnOrThrowProtectedError(token, format2, input) {
  const _message = message(token, format2, input);
  console.warn(_message);
  if (throwTokens.includes(token)) throw new RangeError(_message);
}
function message(token, format2, input) {
  const subject = token[0] === "Y" ? "years" : "days of the month";
  return `Use \`${token.toLowerCase()}\` instead of \`${token}\` (in \`${format2}\`) for formatting ${subject} to the input \`${input}\`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md`;
}
const formattingTokensRegExp =
  /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g;
const longFormattingTokensRegExp = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g;
const escapedStringRegExp = /^'([^]*?)'?$/;
const doubleQuoteRegExp = /''/g;
const unescapedLatinCharacterRegExp = /[a-zA-Z]/;
function format(date, formatStr, options) {
  const defaultOptions2 = getDefaultOptions();
  const locale = defaultOptions2.locale ?? enUS;
  const firstWeekContainsDate =
    defaultOptions2.firstWeekContainsDate ??
    defaultOptions2.locale?.options?.firstWeekContainsDate ??
    1;
  const weekStartsOn =
    defaultOptions2.weekStartsOn ??
    defaultOptions2.locale?.options?.weekStartsOn ??
    0;
  const originalDate = toDate(date, options?.in);
  if (!isValid(originalDate)) {
    throw new RangeError("Invalid time value");
  }
  let parts = formatStr
    .match(longFormattingTokensRegExp)
    .map((substring) => {
      const firstCharacter = substring[0];
      if (firstCharacter === "p" || firstCharacter === "P") {
        const longFormatter = longFormatters[firstCharacter];
        return longFormatter(substring, locale.formatLong);
      }
      return substring;
    })
    .join("")
    .match(formattingTokensRegExp)
    .map((substring) => {
      if (substring === "''") {
        return { isToken: false, value: "'" };
      }
      const firstCharacter = substring[0];
      if (firstCharacter === "'") {
        return { isToken: false, value: cleanEscapedString(substring) };
      }
      if (formatters[firstCharacter]) {
        return { isToken: true, value: substring };
      }
      if (firstCharacter.match(unescapedLatinCharacterRegExp)) {
        throw new RangeError(
          "Format string contains an unescaped latin alphabet character `" +
            firstCharacter +
            "`",
        );
      }
      return { isToken: false, value: substring };
    });
  if (locale.localize.preprocessor) {
    parts = locale.localize.preprocessor(originalDate, parts);
  }
  const formatterOptions = {
    firstWeekContainsDate,
    weekStartsOn,
    locale,
  };
  return parts
    .map((part) => {
      if (!part.isToken) return part.value;
      const token = part.value;
      if (isProtectedWeekYearToken(token) || isProtectedDayOfYearToken(token)) {
        warnOrThrowProtectedError(token, formatStr, String(date));
      }
      const formatter = formatters[token[0]];
      return formatter(originalDate, token, locale.localize, formatterOptions);
    })
    .join("");
}
function cleanEscapedString(input) {
  const matched = input.match(escapedStringRegExp);
  if (!matched) {
    return input;
  }
  return matched[1].replace(doubleQuoteRegExp, "'");
}
function formatISO(date, options) {
  const date_ = toDate(date, options?.in);
  if (isNaN(+date_)) {
    throw new RangeError("Invalid time value");
  }
  let result = "";
  let tzOffset = "";
  const dateDelimiter = "-";
  const timeDelimiter = ":";
  {
    const day = addLeadingZeros(date_.getDate(), 2);
    const month = addLeadingZeros(date_.getMonth() + 1, 2);
    const year = addLeadingZeros(date_.getFullYear(), 4);
    result = `${year}${dateDelimiter}${month}${dateDelimiter}${day}`;
  }
  {
    const offset = date_.getTimezoneOffset();
    if (offset !== 0) {
      const absoluteOffset = Math.abs(offset);
      const hourOffset = addLeadingZeros(Math.trunc(absoluteOffset / 60), 2);
      const minuteOffset = addLeadingZeros(absoluteOffset % 60, 2);
      const sign = offset < 0 ? "+" : "-";
      tzOffset = `${sign}${hourOffset}:${minuteOffset}`;
    } else {
      tzOffset = "Z";
    }
    const hour = addLeadingZeros(date_.getHours(), 2);
    const minute = addLeadingZeros(date_.getMinutes(), 2);
    const second2 = addLeadingZeros(date_.getSeconds(), 2);
    const separator = result === "" ? "" : "T";
    const time = [hour, minute, second2].join(timeDelimiter);
    result = `${result}${separator}${time}${tzOffset}`;
  }
  return result;
}
function parseISO(argument, options) {
  const invalidDate = () => constructFrom(options?.in, NaN);
  const additionalDigits = 2;
  const dateStrings = splitDateString(argument);
  let date;
  if (dateStrings.date) {
    const parseYearResult = parseYear(dateStrings.date, additionalDigits);
    date = parseDate(parseYearResult.restDateString, parseYearResult.year);
  }
  if (!date || isNaN(+date)) return invalidDate();
  const timestamp = +date;
  let time = 0;
  let offset;
  if (dateStrings.time) {
    time = parseTime(dateStrings.time);
    if (isNaN(time)) return invalidDate();
  }
  if (dateStrings.timezone) {
    offset = parseTimezone(dateStrings.timezone);
    if (isNaN(offset)) return invalidDate();
  } else {
    const tmpDate = new Date(timestamp + time);
    const result = toDate(0, options?.in);
    result.setFullYear(
      tmpDate.getUTCFullYear(),
      tmpDate.getUTCMonth(),
      tmpDate.getUTCDate(),
    );
    result.setHours(
      tmpDate.getUTCHours(),
      tmpDate.getUTCMinutes(),
      tmpDate.getUTCSeconds(),
      tmpDate.getUTCMilliseconds(),
    );
    return result;
  }
  return toDate(timestamp + time + offset, options?.in);
}
const patterns = {
  dateTimeDelimiter: /[T ]/,
  timeZoneDelimiter: /[Z ]/i,
  timezone: /([Z+-].*)$/,
};
const dateRegex =
  /^-?(?:(\d{3})|(\d{2})(?:-?(\d{2}))?|W(\d{2})(?:-?(\d{1}))?|)$/;
const timeRegex =
  /^(\d{2}(?:[.,]\d*)?)(?::?(\d{2}(?:[.,]\d*)?))?(?::?(\d{2}(?:[.,]\d*)?))?$/;
const timezoneRegex = /^([+-])(\d{2})(?::?(\d{2}))?$/;
function splitDateString(dateString) {
  const dateStrings = {};
  const array = dateString.split(patterns.dateTimeDelimiter);
  let timeString;
  if (array.length > 2) {
    return dateStrings;
  }
  if (/:/.test(array[0])) {
    timeString = array[0];
  } else {
    dateStrings.date = array[0];
    timeString = array[1];
    if (patterns.timeZoneDelimiter.test(dateStrings.date)) {
      dateStrings.date = dateString.split(patterns.timeZoneDelimiter)[0];
      timeString = dateString.substr(
        dateStrings.date.length,
        dateString.length,
      );
    }
  }
  if (timeString) {
    const token = patterns.timezone.exec(timeString);
    if (token) {
      dateStrings.time = timeString.replace(token[1], "");
      dateStrings.timezone = token[1];
    } else {
      dateStrings.time = timeString;
    }
  }
  return dateStrings;
}
function parseYear(dateString, additionalDigits) {
  const regex = new RegExp(
    "^(?:(\\d{4}|[+-]\\d{" +
      (4 + additionalDigits) +
      "})|(\\d{2}|[+-]\\d{" +
      (2 + additionalDigits) +
      "})$)",
  );
  const captures = dateString.match(regex);
  if (!captures) return { year: NaN, restDateString: "" };
  const year = captures[1] ? parseInt(captures[1]) : null;
  const century = captures[2] ? parseInt(captures[2]) : null;
  return {
    year: century === null ? year : century * 100,
    restDateString: dateString.slice((captures[1] || captures[2]).length),
  };
}
function parseDate(dateString, year) {
  if (year === null) return /* @__PURE__ */ new Date(NaN);
  const captures = dateString.match(dateRegex);
  if (!captures) return /* @__PURE__ */ new Date(NaN);
  const isWeekDate = !!captures[4];
  const dayOfYear = parseDateUnit(captures[1]);
  const month = parseDateUnit(captures[2]) - 1;
  const day = parseDateUnit(captures[3]);
  const week = parseDateUnit(captures[4]);
  const dayOfWeek = parseDateUnit(captures[5]) - 1;
  if (isWeekDate) {
    if (!validateWeekDate(year, week, dayOfWeek)) {
      return /* @__PURE__ */ new Date(NaN);
    }
    return dayOfISOWeekYear(year, week, dayOfWeek);
  } else {
    const date = /* @__PURE__ */ new Date(0);
    if (
      !validateDate(year, month, day) ||
      !validateDayOfYearDate(year, dayOfYear)
    ) {
      return /* @__PURE__ */ new Date(NaN);
    }
    date.setUTCFullYear(year, month, Math.max(dayOfYear, day));
    return date;
  }
}
function parseDateUnit(value) {
  return value ? parseInt(value) : 1;
}
function parseTime(timeString) {
  const captures = timeString.match(timeRegex);
  if (!captures) return NaN;
  const hours = parseTimeUnit(captures[1]);
  const minutes = parseTimeUnit(captures[2]);
  const seconds = parseTimeUnit(captures[3]);
  if (!validateTime(hours, minutes, seconds)) {
    return NaN;
  }
  return (
    hours * millisecondsInHour + minutes * millisecondsInMinute + seconds * 1e3
  );
}
function parseTimeUnit(value) {
  return (value && parseFloat(value.replace(",", "."))) || 0;
}
function parseTimezone(timezoneString) {
  if (timezoneString === "Z") return 0;
  const captures = timezoneString.match(timezoneRegex);
  if (!captures) return 0;
  const sign = captures[1] === "+" ? -1 : 1;
  const hours = parseInt(captures[2]);
  const minutes = (captures[3] && parseInt(captures[3])) || 0;
  if (!validateTimezone(hours, minutes)) {
    return NaN;
  }
  return sign * (hours * millisecondsInHour + minutes * millisecondsInMinute);
}
function dayOfISOWeekYear(isoWeekYear, week, day) {
  const date = /* @__PURE__ */ new Date(0);
  date.setUTCFullYear(isoWeekYear, 0, 4);
  const fourthOfJanuaryDay = date.getUTCDay() || 7;
  const diff = (week - 1) * 7 + day + 1 - fourthOfJanuaryDay;
  date.setUTCDate(date.getUTCDate() + diff);
  return date;
}
const daysInMonths = [31, null, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function isLeapYearIndex(year) {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}
function validateDate(year, month, date) {
  return (
    month >= 0 &&
    month <= 11 &&
    date >= 1 &&
    date <= (daysInMonths[month] || (isLeapYearIndex(year) ? 29 : 28))
  );
}
function validateDayOfYearDate(year, dayOfYear) {
  return dayOfYear >= 1 && dayOfYear <= (isLeapYearIndex(year) ? 366 : 365);
}
function validateWeekDate(_year, week, day) {
  return week >= 1 && week <= 53 && day >= 0 && day <= 6;
}
function validateTime(hours, minutes, seconds) {
  if (hours === 24) {
    return minutes === 0 && seconds === 0;
  }
  return (
    seconds >= 0 &&
    seconds < 60 &&
    minutes >= 0 &&
    minutes < 60 &&
    hours >= 0 &&
    hours < 25
  );
}
function validateTimezone(_hours, minutes) {
  return minutes >= 0 && minutes <= 59;
}
var PeriodType;
(function (PeriodType2) {
  PeriodType2[(PeriodType2["Custom"] = 1)] = "Custom";
  PeriodType2[(PeriodType2["Day"] = 10)] = "Day";
  PeriodType2[(PeriodType2["DayTime"] = 11)] = "DayTime";
  PeriodType2[(PeriodType2["TimeOnly"] = 15)] = "TimeOnly";
  PeriodType2[(PeriodType2["Week"] = 20)] = "Week";
  PeriodType2[(PeriodType2["WeekSun"] = 21)] = "WeekSun";
  PeriodType2[(PeriodType2["WeekMon"] = 22)] = "WeekMon";
  PeriodType2[(PeriodType2["WeekTue"] = 23)] = "WeekTue";
  PeriodType2[(PeriodType2["WeekWed"] = 24)] = "WeekWed";
  PeriodType2[(PeriodType2["WeekThu"] = 25)] = "WeekThu";
  PeriodType2[(PeriodType2["WeekFri"] = 26)] = "WeekFri";
  PeriodType2[(PeriodType2["WeekSat"] = 27)] = "WeekSat";
  PeriodType2[(PeriodType2["Month"] = 30)] = "Month";
  PeriodType2[(PeriodType2["MonthYear"] = 31)] = "MonthYear";
  PeriodType2[(PeriodType2["Quarter"] = 40)] = "Quarter";
  PeriodType2[(PeriodType2["CalendarYear"] = 50)] = "CalendarYear";
  PeriodType2[(PeriodType2["FiscalYearOctober"] = 60)] = "FiscalYearOctober";
  PeriodType2[(PeriodType2["BiWeek1"] = 70)] = "BiWeek1";
  PeriodType2[(PeriodType2["BiWeek1Sun"] = 71)] = "BiWeek1Sun";
  PeriodType2[(PeriodType2["BiWeek1Mon"] = 72)] = "BiWeek1Mon";
  PeriodType2[(PeriodType2["BiWeek1Tue"] = 73)] = "BiWeek1Tue";
  PeriodType2[(PeriodType2["BiWeek1Wed"] = 74)] = "BiWeek1Wed";
  PeriodType2[(PeriodType2["BiWeek1Thu"] = 75)] = "BiWeek1Thu";
  PeriodType2[(PeriodType2["BiWeek1Fri"] = 76)] = "BiWeek1Fri";
  PeriodType2[(PeriodType2["BiWeek1Sat"] = 77)] = "BiWeek1Sat";
  PeriodType2[(PeriodType2["BiWeek2"] = 80)] = "BiWeek2";
  PeriodType2[(PeriodType2["BiWeek2Sun"] = 81)] = "BiWeek2Sun";
  PeriodType2[(PeriodType2["BiWeek2Mon"] = 82)] = "BiWeek2Mon";
  PeriodType2[(PeriodType2["BiWeek2Tue"] = 83)] = "BiWeek2Tue";
  PeriodType2[(PeriodType2["BiWeek2Wed"] = 84)] = "BiWeek2Wed";
  PeriodType2[(PeriodType2["BiWeek2Thu"] = 85)] = "BiWeek2Thu";
  PeriodType2[(PeriodType2["BiWeek2Fri"] = 86)] = "BiWeek2Fri";
  PeriodType2[(PeriodType2["BiWeek2Sat"] = 87)] = "BiWeek2Sat";
})(PeriodType || (PeriodType = {}));
var DayOfWeek;
(function (DayOfWeek2) {
  DayOfWeek2[(DayOfWeek2["Sunday"] = 0)] = "Sunday";
  DayOfWeek2[(DayOfWeek2["Monday"] = 1)] = "Monday";
  DayOfWeek2[(DayOfWeek2["Tuesday"] = 2)] = "Tuesday";
  DayOfWeek2[(DayOfWeek2["Wednesday"] = 3)] = "Wednesday";
  DayOfWeek2[(DayOfWeek2["Thursday"] = 4)] = "Thursday";
  DayOfWeek2[(DayOfWeek2["Friday"] = 5)] = "Friday";
  DayOfWeek2[(DayOfWeek2["Saturday"] = 6)] = "Saturday";
})(DayOfWeek || (DayOfWeek = {}));
var DateToken;
(function (DateToken2) {
  DateToken2["Year_numeric"] = "yyy";
  DateToken2["Year_2Digit"] = "yy";
  DateToken2["Month_long"] = "MMMM";
  DateToken2["Month_short"] = "MMM";
  DateToken2["Month_2Digit"] = "MM";
  DateToken2["Month_numeric"] = "M";
  DateToken2["Hour_numeric"] = "h";
  DateToken2["Hour_2Digit"] = "hh";
  DateToken2["Hour_wAMPM"] = "a";
  DateToken2["Hour_woAMPM"] = "aaaaaa";
  DateToken2["Minute_numeric"] = "m";
  DateToken2["Minute_2Digit"] = "mm";
  DateToken2["Second_numeric"] = "s";
  DateToken2["Second_2Digit"] = "ss";
  DateToken2["MiliSecond_3"] = "SSS";
  DateToken2["DayOfMonth_numeric"] = "d";
  DateToken2["DayOfMonth_2Digit"] = "dd";
  DateToken2["DayOfMonth_withOrdinal"] = "do";
  DateToken2["DayOfWeek_narrow"] = "eeeee";
  DateToken2["DayOfWeek_long"] = "eeee";
  DateToken2["DayOfWeek_short"] = "eee";
})(DateToken || (DateToken = {}));
function getWeekStartsOnFromIntl(locales) {
  if (!locales) {
    return DayOfWeek.Sunday;
  }
  const locale = new Intl.Locale(locales);
  const weekInfo = locale.weekInfo ?? locale.getWeekInfo?.();
  return (weekInfo?.firstDay ?? 0) % 7;
}
const defaultLocaleSettings = {
  locale: "en",
  dictionary: {
    Ok: "Ok",
    Cancel: "Cancel",
    Date: {
      Start: "Start",
      End: "End",
      Empty: "Empty",
      Day: "Day",
      DayTime: "Day Time",
      Time: "Time",
      Week: "Week",
      BiWeek: "Bi-Week",
      Month: "Month",
      Quarter: "Quarter",
      CalendarYear: "Calendar Year",
      FiscalYearOct: "Fiscal Year (Oct)",
      PeriodDay: {
        Current: "Today",
        Last: "Yesterday",
        LastX: "Last {0} days",
      },
      PeriodWeek: {
        Current: "This week",
        Last: "Last week",
        LastX: "Last {0} weeks",
      },
      PeriodBiWeek: {
        Current: "This bi-week",
        Last: "Last bi-week",
        LastX: "Last {0} bi-weeks",
      },
      PeriodMonth: {
        Current: "This month",
        Last: "Last month",
        LastX: "Last {0} months",
      },
      PeriodQuarter: {
        Current: "This quarter",
        Last: "Last quarter",
        LastX: "Last {0} quarters",
      },
      PeriodQuarterSameLastyear: "Same quarter last year",
      PeriodYear: {
        Current: "This year",
        Last: "Last year",
        LastX: "Last {0} years",
      },
      PeriodFiscalYear: {
        Current: "This fiscal year",
        Last: "Last fiscal year",
        LastX: "Last {0} fiscal years",
      },
    },
  },
  formats: {
    numbers: {
      defaults: {
        currency: "USD",
        fractionDigits: 2,
        currencyDisplay: "symbol",
      },
    },
    dates: {
      baseParsing: "MM/dd/yyyy",
      weekStartsOn: DayOfWeek.Sunday,
      ordinalSuffixes: {
        one: "st",
        two: "nd",
        few: "rd",
        other: "th",
      },
      presets: {
        day: {
          short: [DateToken.DayOfMonth_numeric, DateToken.Month_numeric],
          default: [
            DateToken.DayOfMonth_numeric,
            DateToken.Month_numeric,
            DateToken.Year_numeric,
          ],
          long: [
            DateToken.DayOfMonth_numeric,
            DateToken.Month_short,
            DateToken.Year_numeric,
          ],
        },
        dayTime: {
          short: [
            DateToken.DayOfMonth_numeric,
            DateToken.Month_numeric,
            DateToken.Year_numeric,
            DateToken.Hour_numeric,
            DateToken.Minute_numeric,
          ],
          default: [
            DateToken.DayOfMonth_numeric,
            DateToken.Month_numeric,
            DateToken.Year_numeric,
            DateToken.Hour_2Digit,
            DateToken.Minute_2Digit,
          ],
          long: [
            DateToken.DayOfMonth_numeric,
            DateToken.Month_numeric,
            DateToken.Year_numeric,
            DateToken.Hour_2Digit,
            DateToken.Minute_2Digit,
            DateToken.Second_2Digit,
          ],
        },
        timeOnly: {
          short: [DateToken.Hour_numeric, DateToken.Minute_numeric],
          default: [
            DateToken.Hour_2Digit,
            DateToken.Minute_2Digit,
            DateToken.Second_2Digit,
          ],
          long: [
            DateToken.Hour_2Digit,
            DateToken.Minute_2Digit,
            DateToken.Second_2Digit,
            DateToken.MiliSecond_3,
          ],
        },
        week: {
          short: [DateToken.DayOfMonth_numeric, DateToken.Month_numeric],
          default: [
            DateToken.DayOfMonth_numeric,
            DateToken.Month_numeric,
            DateToken.Year_numeric,
          ],
          long: [
            DateToken.DayOfMonth_numeric,
            DateToken.Month_numeric,
            DateToken.Year_numeric,
          ],
        },
        month: {
          short: DateToken.Month_short,
          default: DateToken.Month_short,
          long: DateToken.Month_long,
        },
        monthsYear: {
          short: [DateToken.Month_short, DateToken.Year_2Digit],
          default: [DateToken.Month_long, DateToken.Year_numeric],
          long: [DateToken.Month_long, DateToken.Year_numeric],
        },
        year: {
          short: DateToken.Year_2Digit,
          default: DateToken.Year_numeric,
          long: DateToken.Year_numeric,
        },
      },
    },
  },
};
function createLocaleSettings(localeSettings, base = defaultLocaleSettings) {
  if (localeSettings.formats?.dates?.ordinalSuffixes) {
    localeSettings.formats.dates.ordinalSuffixes = {
      one: "",
      two: "",
      few: "",
      other: "",
      zero: "",
      many: "",
      ...localeSettings.formats.dates.ordinalSuffixes,
    };
  }
  if (localeSettings.formats?.dates?.weekStartsOn === void 0) {
    localeSettings = defaultsDeep(localeSettings, {
      formats: {
        dates: { weekStartsOn: getWeekStartsOnFromIntl(localeSettings.locale) },
      },
    });
  }
  return defaultsDeep(localeSettings, base);
}
const defaultLocale = createLocaleSettings({ locale: "en" });
({
  [PeriodType.Custom]: "CUSTOM",
  [PeriodType.Day]: "DAY",
  [PeriodType.DayTime]: "DAY-TIME",
  [PeriodType.TimeOnly]: "TIME",
  [PeriodType.WeekSun]: "WEEK-SUN",
  [PeriodType.WeekMon]: "WEEK-MON",
  [PeriodType.WeekTue]: "WEEK-TUE",
  [PeriodType.WeekWed]: "WEEK-WED",
  [PeriodType.WeekThu]: "WEEK-THU",
  [PeriodType.WeekFri]: "WEEK-FRI",
  [PeriodType.WeekSat]: "WEEK-SAT",
  [PeriodType.Week]: "WEEK",
  [PeriodType.Month]: "MTH",
  [PeriodType.MonthYear]: "MTH-CY",
  [PeriodType.Quarter]: "QTR",
  [PeriodType.CalendarYear]: "CY",
  [PeriodType.FiscalYearOctober]: "FY-OCT",
  [PeriodType.BiWeek1Sun]: "BIWEEK1-SUN",
  [PeriodType.BiWeek1Mon]: "BIWEEK1-MON",
  [PeriodType.BiWeek1Tue]: "BIWEEK1-TUE",
  [PeriodType.BiWeek1Wed]: "BIWEEK1-WED",
  [PeriodType.BiWeek1Thu]: "BIWEEK1-THU",
  [PeriodType.BiWeek1Fri]: "BIWEEK1-FRI",
  [PeriodType.BiWeek1Sat]: "BIWEEK1-SAT",
  [PeriodType.BiWeek1]: "BIWEEK1",
  [PeriodType.BiWeek2Sun]: "BIWEEK2-SUN",
  [PeriodType.BiWeek2Mon]: "BIWEEK2-MON",
  [PeriodType.BiWeek2Tue]: "BIWEEK2-TUE",
  [PeriodType.BiWeek2Wed]: "BIWEEK2-WED",
  [PeriodType.BiWeek2Thu]: "BIWEEK2-THU",
  [PeriodType.BiWeek2Fri]: "BIWEEK2-FRI",
  [PeriodType.BiWeek2Sat]: "BIWEEK2-SAT",
  [PeriodType.BiWeek2]: "BIWEEK2",
});
function getFiscalYear(date = /* @__PURE__ */ new Date(), options) {
  if (date === null) {
    return NaN;
  }
  const startMonth = 10;
  return date.getMonth() >= startMonth - 1
    ? date.getFullYear() + 1
    : date.getFullYear();
}
const biweekBaseDates = [
  /* @__PURE__ */ new Date("1799-12-22T00:00"),
  /* @__PURE__ */ new Date("1799-12-15T00:00"),
];
function startOfBiWeek(date, week, startOfWeek2) {
  var weekBaseDate = biweekBaseDates[week - 1];
  var baseDate = addDays(weekBaseDate, startOfWeek2);
  var periodsSince = Math.floor(differenceInDays(date, baseDate) / 14);
  return addDays(baseDate, periodsSince * 14);
}
function endOfBiWeek(date, week, startOfWeek2) {
  return addDays(startOfBiWeek(date, week, startOfWeek2), 13);
}
function formatIntl(settings, dt, tokens_or_intlOptions) {
  const {
    locale,
    formats: {
      dates: { ordinalSuffixes: suffixes },
    },
  } = settings;
  function formatIntlOrdinal(formatter2, with_ordinal = false) {
    if (with_ordinal) {
      const rules = new Intl.PluralRules(locale, { type: "ordinal" });
      const splited = formatter2.formatToParts(dt);
      return splited
        .map((c2) => {
          if (c2.type === "day") {
            const ordinal = rules.select(parseInt(c2.value, 10));
            const suffix = suffixes[ordinal];
            return `${c2.value}${suffix}`;
          }
          return c2.value;
        })
        .join("");
    }
    return formatter2.format(dt);
  }
  if (
    typeof tokens_or_intlOptions !== "string" &&
    !Array.isArray(tokens_or_intlOptions)
  ) {
    return formatIntlOrdinal(
      new Intl.DateTimeFormat(locale, tokens_or_intlOptions),
      tokens_or_intlOptions.withOrdinal,
    );
  }
  const tokens = Array.isArray(tokens_or_intlOptions)
    ? tokens_or_intlOptions.join("")
    : tokens_or_intlOptions;
  const formatter = new Intl.DateTimeFormat(locale, {
    year: tokens.includes(DateToken.Year_numeric)
      ? "numeric"
      : tokens.includes(DateToken.Year_2Digit)
        ? "2-digit"
        : void 0,
    month: tokens.includes(DateToken.Month_long)
      ? "long"
      : tokens.includes(DateToken.Month_short)
        ? "short"
        : tokens.includes(DateToken.Month_2Digit)
          ? "2-digit"
          : tokens.includes(DateToken.Month_numeric)
            ? "numeric"
            : void 0,
    day: tokens.includes(DateToken.DayOfMonth_2Digit)
      ? "2-digit"
      : tokens.includes(DateToken.DayOfMonth_numeric)
        ? "numeric"
        : void 0,
    hour: tokens.includes(DateToken.Hour_2Digit)
      ? "2-digit"
      : tokens.includes(DateToken.Hour_numeric)
        ? "numeric"
        : void 0,
    hour12: tokens.includes(DateToken.Hour_woAMPM)
      ? false
      : tokens.includes(DateToken.Hour_wAMPM)
        ? true
        : void 0,
    minute: tokens.includes(DateToken.Minute_2Digit)
      ? "2-digit"
      : tokens.includes(DateToken.Minute_numeric)
        ? "numeric"
        : void 0,
    second: tokens.includes(DateToken.Second_2Digit)
      ? "2-digit"
      : tokens.includes(DateToken.Second_numeric)
        ? "numeric"
        : void 0,
    fractionalSecondDigits: tokens.includes(DateToken.MiliSecond_3)
      ? 3
      : void 0,
    weekday: tokens.includes(DateToken.DayOfWeek_narrow)
      ? "narrow"
      : tokens.includes(DateToken.DayOfWeek_long)
        ? "long"
        : tokens.includes(DateToken.DayOfWeek_short)
          ? "short"
          : void 0,
  });
  return formatIntlOrdinal(
    formatter,
    tokens.includes(DateToken.DayOfMonth_withOrdinal),
  );
}
function range(settings, date, weekStartsOn, formatToUse, biWeek = void 0) {
  const start =
    biWeek === void 0
      ? startOfWeek(date, { weekStartsOn })
      : startOfBiWeek(date, biWeek, weekStartsOn);
  const end =
    biWeek === void 0
      ? endOfWeek(date, { weekStartsOn })
      : endOfBiWeek(date, biWeek, weekStartsOn);
  return (
    formatIntl(settings, start, formatToUse) +
    " - " +
    formatIntl(settings, end, formatToUse)
  );
}
function formatDate(date, periodType, options = {}) {
  return formatDateWithLocale(defaultLocale, date, periodType, options);
}
function updatePeriodTypeWithWeekStartsOn(weekStartsOn, periodType) {
  if (periodType === PeriodType.Week) {
    periodType = [
      PeriodType.WeekSun,
      PeriodType.WeekMon,
      PeriodType.WeekTue,
      PeriodType.WeekWed,
      PeriodType.WeekThu,
      PeriodType.WeekFri,
      PeriodType.WeekSat,
    ][weekStartsOn];
  } else if (periodType === PeriodType.BiWeek1) {
    periodType = [
      PeriodType.BiWeek1Sun,
      PeriodType.BiWeek1Mon,
      PeriodType.BiWeek1Tue,
      PeriodType.BiWeek1Wed,
      PeriodType.BiWeek1Thu,
      PeriodType.BiWeek1Fri,
      PeriodType.BiWeek1Sat,
    ][weekStartsOn];
  } else if (periodType === PeriodType.BiWeek2) {
    periodType = [
      PeriodType.BiWeek2Sun,
      PeriodType.BiWeek2Mon,
      PeriodType.BiWeek2Tue,
      PeriodType.BiWeek2Wed,
      PeriodType.BiWeek2Thu,
      PeriodType.BiWeek2Fri,
      PeriodType.BiWeek2Sat,
    ][weekStartsOn];
  }
  return periodType;
}
function formatDateWithLocale(settings, date, periodType, options = {}) {
  if (typeof date === "string") {
    date = parseISO(date);
  }
  if (date == null || isNaN(date)) {
    return "";
  }
  const weekStartsOn =
    options.weekStartsOn ?? settings.formats.dates.weekStartsOn;
  const { day, dayTime, timeOnly, week, month, monthsYear, year } =
    settings.formats.dates.presets;
  periodType =
    updatePeriodTypeWithWeekStartsOn(weekStartsOn, periodType) ?? periodType;
  function rv(preset) {
    if (options.variant === "custom") {
      return options.custom ?? preset.default;
    } else if (options.custom && !options.variant) {
      return options.custom;
    }
    return preset[options.variant ?? "default"];
  }
  switch (periodType) {
    case PeriodType.Custom:
      return formatIntl(settings, date, options.custom);
    case PeriodType.Day:
      return formatIntl(settings, date, rv(day));
    case PeriodType.DayTime:
      return formatIntl(settings, date, rv(dayTime));
    case PeriodType.TimeOnly:
      return formatIntl(settings, date, rv(timeOnly));
    case PeriodType.Week:
    case PeriodType.WeekSun:
      return range(settings, date, 0, rv(week));
    case PeriodType.WeekMon:
      return range(settings, date, 1, rv(week));
    case PeriodType.WeekTue:
      return range(settings, date, 2, rv(week));
    case PeriodType.WeekWed:
      return range(settings, date, 3, rv(week));
    case PeriodType.WeekThu:
      return range(settings, date, 4, rv(week));
    case PeriodType.WeekFri:
      return range(settings, date, 5, rv(week));
    case PeriodType.WeekSat:
      return range(settings, date, 6, rv(week));
    case PeriodType.Month:
      return formatIntl(settings, date, rv(month));
    case PeriodType.MonthYear:
      return formatIntl(settings, date, rv(monthsYear));
    case PeriodType.Quarter:
      return [
        formatIntl(settings, startOfQuarter(date), rv(month)),
        formatIntl(settings, endOfQuarter(date), rv(monthsYear)),
      ].join(" - ");
    case PeriodType.CalendarYear:
      return formatIntl(settings, date, rv(year));
    case PeriodType.FiscalYearOctober:
      const fDate = new Date(getFiscalYear(date), 0, 1);
      return formatIntl(settings, fDate, rv(year));
    case PeriodType.BiWeek1:
    case PeriodType.BiWeek1Sun:
      return range(settings, date, 0, rv(week), 1);
    case PeriodType.BiWeek1Mon:
      return range(settings, date, 1, rv(week), 1);
    case PeriodType.BiWeek1Tue:
      return range(settings, date, 2, rv(week), 1);
    case PeriodType.BiWeek1Wed:
      return range(settings, date, 3, rv(week), 1);
    case PeriodType.BiWeek1Thu:
      return range(settings, date, 4, rv(week), 1);
    case PeriodType.BiWeek1Fri:
      return range(settings, date, 5, rv(week), 1);
    case PeriodType.BiWeek1Sat:
      return range(settings, date, 6, rv(week), 1);
    case PeriodType.BiWeek2:
    case PeriodType.BiWeek2Sun:
      return range(settings, date, 0, rv(week), 2);
    case PeriodType.BiWeek2Mon:
      return range(settings, date, 1, rv(week), 2);
    case PeriodType.BiWeek2Tue:
      return range(settings, date, 2, rv(week), 2);
    case PeriodType.BiWeek2Wed:
      return range(settings, date, 3, rv(week), 2);
    case PeriodType.BiWeek2Thu:
      return range(settings, date, 4, rv(week), 2);
    case PeriodType.BiWeek2Fri:
      return range(settings, date, 5, rv(week), 2);
    case PeriodType.BiWeek2Sat:
      return range(settings, date, 6, rv(week), 2);
    default:
      return formatISO(date);
  }
}
var DurationUnits;
(function (DurationUnits2) {
  DurationUnits2[(DurationUnits2["Year"] = 0)] = "Year";
  DurationUnits2[(DurationUnits2["Day"] = 1)] = "Day";
  DurationUnits2[(DurationUnits2["Hour"] = 2)] = "Hour";
  DurationUnits2[(DurationUnits2["Minute"] = 3)] = "Minute";
  DurationUnits2[(DurationUnits2["Second"] = 4)] = "Second";
  DurationUnits2[(DurationUnits2["Millisecond"] = 5)] = "Millisecond";
})(DurationUnits || (DurationUnits = {}));
const browser = typeof window !== "undefined";
const parseNumber = (color, len) => {
  if (typeof color !== "number") return;
  if (len === 3) {
    return {
      mode: "rgb",
      r: (((color >> 8) & 15) | ((color >> 4) & 240)) / 255,
      g: (((color >> 4) & 15) | (color & 240)) / 255,
      b: ((color & 15) | ((color << 4) & 240)) / 255,
    };
  }
  if (len === 4) {
    return {
      mode: "rgb",
      r: (((color >> 12) & 15) | ((color >> 8) & 240)) / 255,
      g: (((color >> 8) & 15) | ((color >> 4) & 240)) / 255,
      b: (((color >> 4) & 15) | (color & 240)) / 255,
      alpha: ((color & 15) | ((color << 4) & 240)) / 255,
    };
  }
  if (len === 6) {
    return {
      mode: "rgb",
      r: ((color >> 16) & 255) / 255,
      g: ((color >> 8) & 255) / 255,
      b: (color & 255) / 255,
    };
  }
  if (len === 8) {
    return {
      mode: "rgb",
      r: ((color >> 24) & 255) / 255,
      g: ((color >> 16) & 255) / 255,
      b: ((color >> 8) & 255) / 255,
      alpha: (color & 255) / 255,
    };
  }
};
const named = {
  aliceblue: 15792383,
  antiquewhite: 16444375,
  aqua: 65535,
  aquamarine: 8388564,
  azure: 15794175,
  beige: 16119260,
  bisque: 16770244,
  black: 0,
  blanchedalmond: 16772045,
  blue: 255,
  blueviolet: 9055202,
  brown: 10824234,
  burlywood: 14596231,
  cadetblue: 6266528,
  chartreuse: 8388352,
  chocolate: 13789470,
  coral: 16744272,
  cornflowerblue: 6591981,
  cornsilk: 16775388,
  crimson: 14423100,
  cyan: 65535,
  darkblue: 139,
  darkcyan: 35723,
  darkgoldenrod: 12092939,
  darkgray: 11119017,
  darkgreen: 25600,
  darkgrey: 11119017,
  darkkhaki: 12433259,
  darkmagenta: 9109643,
  darkolivegreen: 5597999,
  darkorange: 16747520,
  darkorchid: 10040012,
  darkred: 9109504,
  darksalmon: 15308410,
  darkseagreen: 9419919,
  darkslateblue: 4734347,
  darkslategray: 3100495,
  darkslategrey: 3100495,
  darkturquoise: 52945,
  darkviolet: 9699539,
  deeppink: 16716947,
  deepskyblue: 49151,
  dimgray: 6908265,
  dimgrey: 6908265,
  dodgerblue: 2003199,
  firebrick: 11674146,
  floralwhite: 16775920,
  forestgreen: 2263842,
  fuchsia: 16711935,
  gainsboro: 14474460,
  ghostwhite: 16316671,
  gold: 16766720,
  goldenrod: 14329120,
  gray: 8421504,
  green: 32768,
  greenyellow: 11403055,
  grey: 8421504,
  honeydew: 15794160,
  hotpink: 16738740,
  indianred: 13458524,
  indigo: 4915330,
  ivory: 16777200,
  khaki: 15787660,
  lavender: 15132410,
  lavenderblush: 16773365,
  lawngreen: 8190976,
  lemonchiffon: 16775885,
  lightblue: 11393254,
  lightcoral: 15761536,
  lightcyan: 14745599,
  lightgoldenrodyellow: 16448210,
  lightgray: 13882323,
  lightgreen: 9498256,
  lightgrey: 13882323,
  lightpink: 16758465,
  lightsalmon: 16752762,
  lightseagreen: 2142890,
  lightskyblue: 8900346,
  lightslategray: 7833753,
  lightslategrey: 7833753,
  lightsteelblue: 11584734,
  lightyellow: 16777184,
  lime: 65280,
  limegreen: 3329330,
  linen: 16445670,
  magenta: 16711935,
  maroon: 8388608,
  mediumaquamarine: 6737322,
  mediumblue: 205,
  mediumorchid: 12211667,
  mediumpurple: 9662683,
  mediumseagreen: 3978097,
  mediumslateblue: 8087790,
  mediumspringgreen: 64154,
  mediumturquoise: 4772300,
  mediumvioletred: 13047173,
  midnightblue: 1644912,
  mintcream: 16121850,
  mistyrose: 16770273,
  moccasin: 16770229,
  navajowhite: 16768685,
  navy: 128,
  oldlace: 16643558,
  olive: 8421376,
  olivedrab: 7048739,
  orange: 16753920,
  orangered: 16729344,
  orchid: 14315734,
  palegoldenrod: 15657130,
  palegreen: 10025880,
  paleturquoise: 11529966,
  palevioletred: 14381203,
  papayawhip: 16773077,
  peachpuff: 16767673,
  peru: 13468991,
  pink: 16761035,
  plum: 14524637,
  powderblue: 11591910,
  purple: 8388736,
  // Added in CSS Colors Level 4:
  // https://drafts.csswg.org/css-color/#changes-from-3
  rebeccapurple: 6697881,
  red: 16711680,
  rosybrown: 12357519,
  royalblue: 4286945,
  saddlebrown: 9127187,
  salmon: 16416882,
  sandybrown: 16032864,
  seagreen: 3050327,
  seashell: 16774638,
  sienna: 10506797,
  silver: 12632256,
  skyblue: 8900331,
  slateblue: 6970061,
  slategray: 7372944,
  slategrey: 7372944,
  snow: 16775930,
  springgreen: 65407,
  steelblue: 4620980,
  tan: 13808780,
  teal: 32896,
  thistle: 14204888,
  tomato: 16737095,
  turquoise: 4251856,
  violet: 15631086,
  wheat: 16113331,
  white: 16777215,
  whitesmoke: 16119285,
  yellow: 16776960,
  yellowgreen: 10145074,
};
const parseNamed = (color) => {
  return parseNumber(named[color.toLowerCase()], 6);
};
const hex = /^#?([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{4}|[0-9a-f]{3})$/i;
const parseHex = (color) => {
  let match2;
  return (match2 = color.match(hex))
    ? parseNumber(parseInt(match2[1], 16), match2[1].length)
    : void 0;
};
const num$1 = "([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)";
const per = `${num$1}%`;
const num_per = `(?:${num$1}%|${num$1})`;
const hue$1 = `(?:${num$1}(deg|grad|rad|turn)|${num$1})`;
const c = `\\s*,\\s*`;
const rgb_num_old = new RegExp(
  `^rgba?\\(\\s*${num$1}${c}${num$1}${c}${num$1}\\s*(?:,\\s*${num_per}\\s*)?\\)$`,
);
const rgb_per_old = new RegExp(
  `^rgba?\\(\\s*${per}${c}${per}${c}${per}\\s*(?:,\\s*${num_per}\\s*)?\\)$`,
);
const parseRgbLegacy = (color) => {
  let res = { mode: "rgb" };
  let match2;
  if ((match2 = color.match(rgb_num_old))) {
    if (match2[1] !== void 0) {
      res.r = match2[1] / 255;
    }
    if (match2[2] !== void 0) {
      res.g = match2[2] / 255;
    }
    if (match2[3] !== void 0) {
      res.b = match2[3] / 255;
    }
  } else if ((match2 = color.match(rgb_per_old))) {
    if (match2[1] !== void 0) {
      res.r = match2[1] / 100;
    }
    if (match2[2] !== void 0) {
      res.g = match2[2] / 100;
    }
    if (match2[3] !== void 0) {
      res.b = match2[3] / 100;
    }
  } else {
    return void 0;
  }
  if (match2[4] !== void 0) {
    res.alpha = Math.max(0, Math.min(1, match2[4] / 100));
  } else if (match2[5] !== void 0) {
    res.alpha = Math.max(0, Math.min(1, +match2[5]));
  }
  return res;
};
const prepare = (color, mode) =>
  color === void 0
    ? void 0
    : typeof color !== "object"
      ? parse(color)
      : color.mode !== void 0
        ? color
        : mode
          ? { ...color, mode }
          : void 0;
const converter =
  (target_mode = "rgb") =>
  (color) =>
    (color = prepare(color, target_mode)) !== void 0
      ? // if the color's mode corresponds to our target mode
        color.mode === target_mode
        ? // then just return the color
          color
        : // otherwise check to see if we have a dedicated
          // converter for the target mode
          converters[color.mode][target_mode]
          ? // and return its result...
            converters[color.mode][target_mode](color)
          : // ...otherwise pass through RGB as an intermediary step.
            // if the target mode is RGB...
            target_mode === "rgb"
            ? // just return the RGB
              converters[color.mode].rgb(color)
            : // otherwise convert color.mode -> RGB -> target_mode
              converters.rgb[target_mode](converters[color.mode].rgb(color))
      : void 0;
const converters = {};
const modes = {};
const parsers = [];
const colorProfiles = {};
const identity = (v) => v;
const useMode = (definition2) => {
  converters[definition2.mode] = {
    ...converters[definition2.mode],
    ...definition2.toMode,
  };
  Object.keys(definition2.fromMode || {}).forEach((k2) => {
    if (!converters[k2]) {
      converters[k2] = {};
    }
    converters[k2][definition2.mode] = definition2.fromMode[k2];
  });
  if (!definition2.ranges) {
    definition2.ranges = {};
  }
  if (!definition2.difference) {
    definition2.difference = {};
  }
  definition2.channels.forEach((channel) => {
    if (definition2.ranges[channel] === void 0) {
      definition2.ranges[channel] = [0, 1];
    }
    if (!definition2.interpolate[channel]) {
      throw new Error(`Missing interpolator for: ${channel}`);
    }
    if (typeof definition2.interpolate[channel] === "function") {
      definition2.interpolate[channel] = {
        use: definition2.interpolate[channel],
      };
    }
    if (!definition2.interpolate[channel].fixup) {
      definition2.interpolate[channel].fixup = identity;
    }
  });
  modes[definition2.mode] = definition2;
  (definition2.parse || []).forEach((parser) => {
    useParser(parser, definition2.mode);
  });
  return converter(definition2.mode);
};
const getMode = (mode) => modes[mode];
const useParser = (parser, mode) => {
  if (typeof parser === "string") {
    if (!mode) {
      throw new Error(`'mode' required when 'parser' is a string`);
    }
    colorProfiles[parser] = mode;
  } else if (typeof parser === "function") {
    if (parsers.indexOf(parser) < 0) {
      parsers.push(parser);
    }
  }
};
const IdentStartCodePoint = /[^\x00-\x7F]|[a-zA-Z_]/;
const IdentCodePoint = /[^\x00-\x7F]|[-\w]/;
const Tok = {
  Function: "function",
  Ident: "ident",
  Number: "number",
  Percentage: "percentage",
  ParenClose: ")",
  None: "none",
  Hue: "hue",
  Alpha: "alpha",
};
let _i = 0;
function is_num(chars) {
  let ch = chars[_i];
  let ch1 = chars[_i + 1];
  if (ch === "-" || ch === "+") {
    return /\d/.test(ch1) || (ch1 === "." && /\d/.test(chars[_i + 2]));
  }
  if (ch === ".") {
    return /\d/.test(ch1);
  }
  return /\d/.test(ch);
}
function is_ident(chars) {
  if (_i >= chars.length) {
    return false;
  }
  let ch = chars[_i];
  if (IdentStartCodePoint.test(ch)) {
    return true;
  }
  if (ch === "-") {
    if (chars.length - _i < 2) {
      return false;
    }
    let ch1 = chars[_i + 1];
    if (ch1 === "-" || IdentStartCodePoint.test(ch1)) {
      return true;
    }
    return false;
  }
  return false;
}
const huenits = {
  deg: 1,
  rad: 180 / Math.PI,
  grad: 9 / 10,
  turn: 360,
};
function num(chars) {
  let value = "";
  if (chars[_i] === "-" || chars[_i] === "+") {
    value += chars[_i++];
  }
  value += digits(chars);
  if (chars[_i] === "." && /\d/.test(chars[_i + 1])) {
    value += chars[_i++] + digits(chars);
  }
  if (chars[_i] === "e" || chars[_i] === "E") {
    if (
      (chars[_i + 1] === "-" || chars[_i + 1] === "+") &&
      /\d/.test(chars[_i + 2])
    ) {
      value += chars[_i++] + chars[_i++] + digits(chars);
    } else if (/\d/.test(chars[_i + 1])) {
      value += chars[_i++] + digits(chars);
    }
  }
  if (is_ident(chars)) {
    let id = ident(chars);
    if (id === "deg" || id === "rad" || id === "turn" || id === "grad") {
      return { type: Tok.Hue, value: value * huenits[id] };
    }
    return void 0;
  }
  if (chars[_i] === "%") {
    _i++;
    return { type: Tok.Percentage, value: +value };
  }
  return { type: Tok.Number, value: +value };
}
function digits(chars) {
  let v = "";
  while (/\d/.test(chars[_i])) {
    v += chars[_i++];
  }
  return v;
}
function ident(chars) {
  let v = "";
  while (_i < chars.length && IdentCodePoint.test(chars[_i])) {
    v += chars[_i++];
  }
  return v;
}
function identlike(chars) {
  let v = ident(chars);
  if (chars[_i] === "(") {
    _i++;
    return { type: Tok.Function, value: v };
  }
  if (v === "none") {
    return { type: Tok.None, value: void 0 };
  }
  return { type: Tok.Ident, value: v };
}
function tokenize(str = "") {
  let chars = str.trim();
  let tokens = [];
  let ch;
  _i = 0;
  while (_i < chars.length) {
    ch = chars[_i++];
    if (ch === "\n" || ch === "	" || ch === " ") {
      while (
        _i < chars.length &&
        (chars[_i] === "\n" || chars[_i] === "	" || chars[_i] === " ")
      ) {
        _i++;
      }
      continue;
    }
    if (ch === ",") {
      return void 0;
    }
    if (ch === ")") {
      tokens.push({ type: Tok.ParenClose });
      continue;
    }
    if (ch === "+") {
      _i--;
      if (is_num(chars)) {
        tokens.push(num(chars));
        continue;
      }
      return void 0;
    }
    if (ch === "-") {
      _i--;
      if (is_num(chars)) {
        tokens.push(num(chars));
        continue;
      }
      if (is_ident(chars)) {
        tokens.push({ type: Tok.Ident, value: ident(chars) });
        continue;
      }
      return void 0;
    }
    if (ch === ".") {
      _i--;
      if (is_num(chars)) {
        tokens.push(num(chars));
        continue;
      }
      return void 0;
    }
    if (ch === "/") {
      while (
        _i < chars.length &&
        (chars[_i] === "\n" || chars[_i] === "	" || chars[_i] === " ")
      ) {
        _i++;
      }
      let alpha;
      if (is_num(chars)) {
        alpha = num(chars);
        if (alpha.type !== Tok.Hue) {
          tokens.push({ type: Tok.Alpha, value: alpha });
          continue;
        }
      }
      if (is_ident(chars)) {
        if (ident(chars) === "none") {
          tokens.push({
            type: Tok.Alpha,
            value: { type: Tok.None, value: void 0 },
          });
          continue;
        }
      }
      return void 0;
    }
    if (/\d/.test(ch)) {
      _i--;
      tokens.push(num(chars));
      continue;
    }
    if (IdentStartCodePoint.test(ch)) {
      _i--;
      tokens.push(identlike(chars));
      continue;
    }
    return void 0;
  }
  return tokens;
}
function parseColorSyntax(tokens) {
  tokens._i = 0;
  let token = tokens[tokens._i++];
  if (!token || token.type !== Tok.Function || token.value !== "color") {
    return void 0;
  }
  token = tokens[tokens._i++];
  if (token.type !== Tok.Ident) {
    return void 0;
  }
  const mode = colorProfiles[token.value];
  if (!mode) {
    return void 0;
  }
  const res = { mode };
  const coords = consumeCoords(tokens, false);
  if (!coords) {
    return void 0;
  }
  const channels = getMode(mode).channels;
  for (let ii = 0, c2, ch; ii < channels.length; ii++) {
    c2 = coords[ii];
    ch = channels[ii];
    if (c2.type !== Tok.None) {
      res[ch] = c2.type === Tok.Number ? c2.value : c2.value / 100;
      if (ch === "alpha") {
        res[ch] = Math.max(0, Math.min(1, res[ch]));
      }
    }
  }
  return res;
}
function consumeCoords(tokens, includeHue) {
  const coords = [];
  let token;
  while (tokens._i < tokens.length) {
    token = tokens[tokens._i++];
    if (
      token.type === Tok.None ||
      token.type === Tok.Number ||
      token.type === Tok.Alpha ||
      token.type === Tok.Percentage ||
      (includeHue && token.type === Tok.Hue)
    ) {
      coords.push(token);
      continue;
    }
    if (token.type === Tok.ParenClose) {
      if (tokens._i < tokens.length) {
        return void 0;
      }
      continue;
    }
    return void 0;
  }
  if (coords.length < 3 || coords.length > 4) {
    return void 0;
  }
  if (coords.length === 4) {
    if (coords[3].type !== Tok.Alpha) {
      return void 0;
    }
    coords[3] = coords[3].value;
  }
  if (coords.length === 3) {
    coords.push({ type: Tok.None, value: void 0 });
  }
  return coords.every((c2) => c2.type !== Tok.Alpha) ? coords : void 0;
}
function parseModernSyntax(tokens, includeHue) {
  tokens._i = 0;
  let token = tokens[tokens._i++];
  if (!token || token.type !== Tok.Function) {
    return void 0;
  }
  let coords = consumeCoords(tokens, includeHue);
  if (!coords) {
    return void 0;
  }
  coords.unshift(token.value);
  return coords;
}
const parse = (color) => {
  if (typeof color !== "string") {
    return void 0;
  }
  const tokens = tokenize(color);
  const parsed = tokens ? parseModernSyntax(tokens, true) : void 0;
  let result = void 0;
  let i = 0;
  let len = parsers.length;
  while (i < len) {
    if ((result = parsers[i++](color, parsed)) !== void 0) {
      return result;
    }
  }
  return tokens ? parseColorSyntax(tokens) : void 0;
};
function parseRgb(color, parsed) {
  if (!parsed || (parsed[0] !== "rgb" && parsed[0] !== "rgba")) {
    return void 0;
  }
  const res = { mode: "rgb" };
  const [, r, g, b, alpha] = parsed;
  if (r.type === Tok.Hue || g.type === Tok.Hue || b.type === Tok.Hue) {
    return void 0;
  }
  if (r.type !== Tok.None) {
    res.r = r.type === Tok.Number ? r.value / 255 : r.value / 100;
  }
  if (g.type !== Tok.None) {
    res.g = g.type === Tok.Number ? g.value / 255 : g.value / 100;
  }
  if (b.type !== Tok.None) {
    res.b = b.type === Tok.Number ? b.value / 255 : b.value / 100;
  }
  if (alpha.type !== Tok.None) {
    res.alpha = Math.min(
      1,
      Math.max(0, alpha.type === Tok.Number ? alpha.value : alpha.value / 100),
    );
  }
  return res;
}
const parseTransparent = (c2) =>
  c2 === "transparent" ? { mode: "rgb", r: 0, g: 0, b: 0, alpha: 0 } : void 0;
const lerp = (a, b, t) => a + t * (b - a);
const get_classes = (arr) => {
  let classes = [];
  for (let i = 0; i < arr.length - 1; i++) {
    let a = arr[i];
    let b = arr[i + 1];
    if (a === void 0 && b === void 0) {
      classes.push(void 0);
    } else if (a !== void 0 && b !== void 0) {
      classes.push([a, b]);
    } else {
      classes.push(a !== void 0 ? [a, a] : [b, b]);
    }
  }
  return classes;
};
const interpolatorPiecewise = (interpolator) => (arr) => {
  let classes = get_classes(arr);
  return (t) => {
    let cls = t * classes.length;
    let idx = t >= 1 ? classes.length - 1 : Math.max(Math.floor(cls), 0);
    let pair = classes[idx];
    return pair === void 0 ? void 0 : interpolator(pair[0], pair[1], cls - idx);
  };
};
const interpolatorLinear = interpolatorPiecewise(lerp);
const fixupAlpha = (arr) => {
  let some_defined = false;
  let res = arr.map((v) => {
    if (v !== void 0) {
      some_defined = true;
      return v;
    }
    return 1;
  });
  return some_defined ? res : arr;
};
const definition$r = {
  mode: "rgb",
  channels: ["r", "g", "b", "alpha"],
  parse: [
    parseRgb,
    parseHex,
    parseRgbLegacy,
    parseNamed,
    parseTransparent,
    "srgb",
  ],
  serialize: "srgb",
  interpolate: {
    r: interpolatorLinear,
    g: interpolatorLinear,
    b: interpolatorLinear,
    alpha: { use: interpolatorLinear, fixup: fixupAlpha },
  },
  gamut: true,
  white: { r: 1, g: 1, b: 1 },
  black: { r: 0, g: 0, b: 0 },
};
const linearize$2 = (v = 0) => Math.pow(Math.abs(v), 563 / 256) * Math.sign(v);
const convertA98ToXyz65 = (a98) => {
  let r = linearize$2(a98.r);
  let g = linearize$2(a98.g);
  let b = linearize$2(a98.b);
  let res = {
    mode: "xyz65",
    x: 0.5766690429101305 * r + 0.1855582379065463 * g + 0.1882286462349947 * b,
    y: 0.297344975250536 * r + 0.6273635662554661 * g + 0.0752914584939979 * b,
    z: 0.0270313613864123 * r + 0.0706888525358272 * g + 0.9913375368376386 * b,
  };
  if (a98.alpha !== void 0) {
    res.alpha = a98.alpha;
  }
  return res;
};
const gamma$2 = (v) => Math.pow(Math.abs(v), 256 / 563) * Math.sign(v);
const convertXyz65ToA98 = ({ x, y, z, alpha }) => {
  if (x === void 0) x = 0;
  if (y === void 0) y = 0;
  if (z === void 0) z = 0;
  let res = {
    mode: "a98",
    r: gamma$2(
      x * 2.0415879038107465 - y * 0.5650069742788597 - 0.3447313507783297 * z,
    ),
    g: gamma$2(
      x * -0.9692436362808798 + y * 1.8759675015077206 + 0.0415550574071756 * z,
    ),
    b: gamma$2(
      x * 0.0134442806320312 - y * 0.1183623922310184 + 1.0151749943912058 * z,
    ),
  };
  if (alpha !== void 0) {
    res.alpha = alpha;
  }
  return res;
};
const fn$3 = (c2 = 0) => {
  const abs2 = Math.abs(c2);
  if (abs2 <= 0.04045) {
    return c2 / 12.92;
  }
  return (Math.sign(c2) || 1) * Math.pow((abs2 + 0.055) / 1.055, 2.4);
};
const convertRgbToLrgb = ({ r, g, b, alpha }) => {
  let res = {
    mode: "lrgb",
    r: fn$3(r),
    g: fn$3(g),
    b: fn$3(b),
  };
  if (alpha !== void 0) res.alpha = alpha;
  return res;
};
const convertRgbToXyz65 = (rgb) => {
  let { r, g, b, alpha } = convertRgbToLrgb(rgb);
  let res = {
    mode: "xyz65",
    x: 0.4123907992659593 * r + 0.357584339383878 * g + 0.1804807884018343 * b,
    y: 0.2126390058715102 * r + 0.715168678767756 * g + 0.0721923153607337 * b,
    z: 0.0193308187155918 * r + 0.119194779794626 * g + 0.9505321522496607 * b,
  };
  if (alpha !== void 0) {
    res.alpha = alpha;
  }
  return res;
};
const fn$2 = (c2 = 0) => {
  const abs2 = Math.abs(c2);
  if (abs2 > 31308e-7) {
    return (Math.sign(c2) || 1) * (1.055 * Math.pow(abs2, 1 / 2.4) - 0.055);
  }
  return c2 * 12.92;
};
const convertLrgbToRgb = ({ r, g, b, alpha }, mode = "rgb") => {
  let res = {
    mode,
    r: fn$2(r),
    g: fn$2(g),
    b: fn$2(b),
  };
  if (alpha !== void 0) res.alpha = alpha;
  return res;
};
const convertXyz65ToRgb = ({ x, y, z, alpha }) => {
  if (x === void 0) x = 0;
  if (y === void 0) y = 0;
  if (z === void 0) z = 0;
  let res = convertLrgbToRgb({
    r: x * 3.2409699419045226 - y * 1.537383177570094 - 0.4986107602930034 * z,
    g:
      x * -0.9692436362808796 + y * 1.8759675015077204 + 0.0415550574071756 * z,
    b: x * 0.0556300796969936 - y * 0.2039769588889765 + 1.0569715142428784 * z,
  });
  if (alpha !== void 0) {
    res.alpha = alpha;
  }
  return res;
};
const definition$q = {
  ...definition$r,
  mode: "a98",
  parse: ["a98-rgb"],
  serialize: "a98-rgb",
  fromMode: {
    rgb: (color) => convertXyz65ToA98(convertRgbToXyz65(color)),
    xyz65: convertXyz65ToA98,
  },
  toMode: {
    rgb: (color) => convertXyz65ToRgb(convertA98ToXyz65(color)),
    xyz65: convertA98ToXyz65,
  },
};
const normalizeHue = (hue2) => ((hue2 = hue2 % 360) < 0 ? hue2 + 360 : hue2);
const hue = (hues, fn2) => {
  return hues
    .map((hue2, idx, arr) => {
      if (hue2 === void 0) {
        return hue2;
      }
      let normalized = normalizeHue(hue2);
      if (idx === 0 || hues[idx - 1] === void 0) {
        return normalized;
      }
      return fn2(normalized - normalizeHue(arr[idx - 1]));
    })
    .reduce((acc, curr) => {
      if (!acc.length || curr === void 0 || acc[acc.length - 1] === void 0) {
        acc.push(curr);
        return acc;
      }
      acc.push(curr + acc[acc.length - 1]);
      return acc;
    }, []);
};
const fixupHueShorter = (arr) =>
  hue(arr, (d) => (Math.abs(d) <= 180 ? d : d - 360 * Math.sign(d)));
const M = [-0.14861, 1.78277, -0.29227, -0.90649, 1.97294, 0];
const degToRad = Math.PI / 180;
const radToDeg = 180 / Math.PI;
let DE = M[3] * M[4];
let BE = M[1] * M[4];
let BCAD = M[1] * M[2] - M[0] * M[3];
const convertRgbToCubehelix = ({ r, g, b, alpha }) => {
  if (r === void 0) r = 0;
  if (g === void 0) g = 0;
  if (b === void 0) b = 0;
  let l = (BCAD * b + r * DE - g * BE) / (BCAD + DE - BE);
  let x = b - l;
  let y = (M[4] * (g - l) - M[2] * x) / M[3];
  let res = {
    mode: "cubehelix",
    l,
    s:
      l === 0 || l === 1
        ? void 0
        : Math.sqrt(x * x + y * y) / (M[4] * l * (1 - l)),
  };
  if (res.s) res.h = Math.atan2(y, x) * radToDeg - 120;
  if (alpha !== void 0) res.alpha = alpha;
  return res;
};
const convertCubehelixToRgb = ({ h, s, l, alpha }) => {
  let res = { mode: "rgb" };
  h = (h === void 0 ? 0 : h + 120) * degToRad;
  if (l === void 0) l = 0;
  let amp = s === void 0 ? 0 : s * l * (1 - l);
  let cosh = Math.cos(h);
  let sinh = Math.sin(h);
  res.r = l + amp * (M[0] * cosh + M[1] * sinh);
  res.g = l + amp * (M[2] * cosh + M[3] * sinh);
  res.b = l + amp * (M[4] * cosh + M[5] * sinh);
  if (alpha !== void 0) res.alpha = alpha;
  return res;
};
const differenceHueSaturation = (std, smp) => {
  if (std.h === void 0 || smp.h === void 0 || !std.s || !smp.s) {
    return 0;
  }
  let std_h = normalizeHue(std.h);
  let smp_h = normalizeHue(smp.h);
  let dH = Math.sin((((smp_h - std_h + 360) / 2) * Math.PI) / 180);
  return 2 * Math.sqrt(std.s * smp.s) * dH;
};
const differenceHueNaive = (std, smp) => {
  if (std.h === void 0 || smp.h === void 0) {
    return 0;
  }
  let std_h = normalizeHue(std.h);
  let smp_h = normalizeHue(smp.h);
  if (Math.abs(smp_h - std_h) > 180) {
    return std_h - (smp_h - 360 * Math.sign(smp_h - std_h));
  }
  return smp_h - std_h;
};
const differenceHueChroma = (std, smp) => {
  if (std.h === void 0 || smp.h === void 0 || !std.c || !smp.c) {
    return 0;
  }
  let std_h = normalizeHue(std.h);
  let smp_h = normalizeHue(smp.h);
  let dH = Math.sin((((smp_h - std_h + 360) / 2) * Math.PI) / 180);
  return 2 * Math.sqrt(std.c * smp.c) * dH;
};
const averageAngle = (val) => {
  let sum = val.reduce(
    (sum2, val2) => {
      if (val2 !== void 0) {
        let rad = (val2 * Math.PI) / 180;
        sum2.sin += Math.sin(rad);
        sum2.cos += Math.cos(rad);
      }
      return sum2;
    },
    { sin: 0, cos: 0 },
  );
  let angle = (Math.atan2(sum.sin, sum.cos) * 180) / Math.PI;
  return angle < 0 ? 360 + angle : angle;
};
const definition$p = {
  mode: "cubehelix",
  channels: ["h", "s", "l", "alpha"],
  parse: ["--cubehelix"],
  serialize: "--cubehelix",
  ranges: {
    h: [0, 360],
    s: [0, 4.614],
    l: [0, 1],
  },
  fromMode: {
    rgb: convertRgbToCubehelix,
  },
  toMode: {
    rgb: convertCubehelixToRgb,
  },
  interpolate: {
    h: {
      use: interpolatorLinear,
      fixup: fixupHueShorter,
    },
    s: interpolatorLinear,
    l: interpolatorLinear,
    alpha: {
      use: interpolatorLinear,
      fixup: fixupAlpha,
    },
  },
  difference: {
    h: differenceHueSaturation,
  },
  average: {
    h: averageAngle,
  },
};
const convertLabToLch = ({ l, a, b, alpha }, mode = "lch") => {
  if (a === void 0) a = 0;
  if (b === void 0) b = 0;
  let c2 = Math.sqrt(a * a + b * b);
  let res = { mode, l, c: c2 };
  if (c2) res.h = normalizeHue((Math.atan2(b, a) * 180) / Math.PI);
  if (alpha !== void 0) res.alpha = alpha;
  return res;
};
const convertLchToLab = ({ l, c: c2, h, alpha }, mode = "lab") => {
  if (h === void 0) h = 0;
  let res = {
    mode,
    l,
    a: c2 ? c2 * Math.cos((h / 180) * Math.PI) : 0,
    b: c2 ? c2 * Math.sin((h / 180) * Math.PI) : 0,
  };
  if (alpha !== void 0) res.alpha = alpha;
  return res;
};
const k$1 = Math.pow(29, 3) / Math.pow(3, 3);
const e$1 = Math.pow(6, 3) / Math.pow(29, 3);
const D50 = {
  X: 0.3457 / 0.3585,
  Y: 1,
  Z: (1 - 0.3457 - 0.3585) / 0.3585,
};
const D65 = {
  X: 0.3127 / 0.329,
  Y: 1,
  Z: (1 - 0.3127 - 0.329) / 0.329,
};
let fn$1 = (v) =>
  Math.pow(v, 3) > e$1 ? Math.pow(v, 3) : (116 * v - 16) / k$1;
const convertLab65ToXyz65 = ({ l, a, b, alpha }) => {
  if (l === void 0) l = 0;
  if (a === void 0) a = 0;
  if (b === void 0) b = 0;
  let fy = (l + 16) / 116;
  let fx = a / 500 + fy;
  let fz = fy - b / 200;
  let res = {
    mode: "xyz65",
    x: fn$1(fx) * D65.X,
    y: fn$1(fy) * D65.Y,
    z: fn$1(fz) * D65.Z,
  };
  if (alpha !== void 0) {
    res.alpha = alpha;
  }
  return res;
};
const convertLab65ToRgb = (lab) => convertXyz65ToRgb(convertLab65ToXyz65(lab));
const f$1 = (value) =>
  value > e$1 ? Math.cbrt(value) : (k$1 * value + 16) / 116;
const convertXyz65ToLab65 = ({ x, y, z, alpha }) => {
  if (x === void 0) x = 0;
  if (y === void 0) y = 0;
  if (z === void 0) z = 0;
  let f0 = f$1(x / D65.X);
  let f1 = f$1(y / D65.Y);
  let f2 = f$1(z / D65.Z);
  let res = {
    mode: "lab65",
    l: 116 * f1 - 16,
    a: 500 * (f0 - f1),
    b: 200 * (f1 - f2),
  };
  if (alpha !== void 0) {
    res.alpha = alpha;
  }
  return res;
};
const convertRgbToLab65 = (rgb) => {
  let res = convertXyz65ToLab65(convertRgbToXyz65(rgb));
  if (rgb.r === rgb.b && rgb.b === rgb.g) {
    res.a = res.b = 0;
  }
  return res;
};
const kE = 1;
const kCH = 1;
const θ = (26 / 180) * Math.PI;
const cosθ = Math.cos(θ);
const sinθ = Math.sin(θ);
const factor = 100 / Math.log(139 / 100);
const convertDlchToLab65 = ({ l, c: c2, h, alpha }) => {
  if (l === void 0) l = 0;
  if (c2 === void 0) c2 = 0;
  if (h === void 0) h = 0;
  let res = {
    mode: "lab65",
    l: (Math.exp((l * kE) / factor) - 1) / 39e-4,
  };
  let G = (Math.exp(0.0435 * c2 * kCH * kE) - 1) / 0.075;
  let e2 = G * Math.cos((h / 180) * Math.PI - θ);
  let f2 = G * Math.sin((h / 180) * Math.PI - θ);
  res.a = e2 * cosθ - (f2 / 0.83) * sinθ;
  res.b = e2 * sinθ + (f2 / 0.83) * cosθ;
  if (alpha !== void 0) res.alpha = alpha;
  return res;
};
const convertLab65ToDlch = ({ l, a, b, alpha }) => {
  if (l === void 0) l = 0;
  if (a === void 0) a = 0;
  if (b === void 0) b = 0;
  let e2 = a * cosθ + b * sinθ;
  let f2 = 0.83 * (b * cosθ - a * sinθ);
  let G = Math.sqrt(e2 * e2 + f2 * f2);
  let res = {
    mode: "dlch",
    l: (factor / kE) * Math.log(1 + 39e-4 * l),
    c: Math.log(1 + 0.075 * G) / (0.0435 * kCH * kE),
  };
  if (res.c) {
    res.h = normalizeHue(((Math.atan2(f2, e2) + θ) / Math.PI) * 180);
  }
  if (alpha !== void 0) res.alpha = alpha;
  return res;
};
const convertDlabToLab65 = (c2) =>
  convertDlchToLab65(convertLabToLch(c2, "dlch"));
const convertLab65ToDlab = (c2) =>
  convertLchToLab(convertLab65ToDlch(c2), "dlab");
const definition$o = {
  mode: "dlab",
  parse: ["--din99o-lab"],
  serialize: "--din99o-lab",
  toMode: {
    lab65: convertDlabToLab65,
    rgb: (c2) => convertLab65ToRgb(convertDlabToLab65(c2)),
  },
  fromMode: {
    lab65: convertLab65ToDlab,
    rgb: (c2) => convertLab65ToDlab(convertRgbToLab65(c2)),
  },
  channels: ["l", "a", "b", "alpha"],
  ranges: {
    l: [0, 100],
    a: [-40.09, 45.501],
    b: [-40.469, 44.344],
  },
  interpolate: {
    l: interpolatorLinear,
    a: interpolatorLinear,
    b: interpolatorLinear,
    alpha: {
      use: interpolatorLinear,
      fixup: fixupAlpha,
    },
  },
};
const definition$n = {
  mode: "dlch",
  parse: ["--din99o-lch"],
  serialize: "--din99o-lch",
  toMode: {
    lab65: convertDlchToLab65,
    dlab: (c2) => convertLchToLab(c2, "dlab"),
    rgb: (c2) => convertLab65ToRgb(convertDlchToLab65(c2)),
  },
  fromMode: {
    lab65: convertLab65ToDlch,
    dlab: (c2) => convertLabToLch(c2, "dlch"),
    rgb: (c2) => convertLab65ToDlch(convertRgbToLab65(c2)),
  },
  channels: ["l", "c", "h", "alpha"],
  ranges: {
    l: [0, 100],
    c: [0, 51.484],
    h: [0, 360],
  },
  interpolate: {
    l: interpolatorLinear,
    c: interpolatorLinear,
    h: {
      use: interpolatorLinear,
      fixup: fixupHueShorter,
    },
    alpha: {
      use: interpolatorLinear,
      fixup: fixupAlpha,
    },
  },
  difference: {
    h: differenceHueChroma,
  },
  average: {
    h: averageAngle,
  },
};
function convertHsiToRgb({ h, s, i, alpha }) {
  h = normalizeHue(h !== void 0 ? h : 0);
  if (s === void 0) s = 0;
  if (i === void 0) i = 0;
  let f2 = Math.abs(((h / 60) % 2) - 1);
  let res;
  switch (Math.floor(h / 60)) {
    case 0:
      res = {
        r: i * (1 + s * (3 / (2 - f2) - 1)),
        g: i * (1 + s * ((3 * (1 - f2)) / (2 - f2) - 1)),
        b: i * (1 - s),
      };
      break;
    case 1:
      res = {
        r: i * (1 + s * ((3 * (1 - f2)) / (2 - f2) - 1)),
        g: i * (1 + s * (3 / (2 - f2) - 1)),
        b: i * (1 - s),
      };
      break;
    case 2:
      res = {
        r: i * (1 - s),
        g: i * (1 + s * (3 / (2 - f2) - 1)),
        b: i * (1 + s * ((3 * (1 - f2)) / (2 - f2) - 1)),
      };
      break;
    case 3:
      res = {
        r: i * (1 - s),
        g: i * (1 + s * ((3 * (1 - f2)) / (2 - f2) - 1)),
        b: i * (1 + s * (3 / (2 - f2) - 1)),
      };
      break;
    case 4:
      res = {
        r: i * (1 + s * ((3 * (1 - f2)) / (2 - f2) - 1)),
        g: i * (1 - s),
        b: i * (1 + s * (3 / (2 - f2) - 1)),
      };
      break;
    case 5:
      res = {
        r: i * (1 + s * (3 / (2 - f2) - 1)),
        g: i * (1 - s),
        b: i * (1 + s * ((3 * (1 - f2)) / (2 - f2) - 1)),
      };
      break;
    default:
      res = { r: i * (1 - s), g: i * (1 - s), b: i * (1 - s) };
  }
  res.mode = "rgb";
  if (alpha !== void 0) res.alpha = alpha;
  return res;
}
function convertRgbToHsi({ r, g, b, alpha }) {
  if (r === void 0) r = 0;
  if (g === void 0) g = 0;
  if (b === void 0) b = 0;
  let M3 = Math.max(r, g, b),
    m = Math.min(r, g, b);
  let res = {
    mode: "hsi",
    s: r + g + b === 0 ? 0 : 1 - (3 * m) / (r + g + b),
    i: (r + g + b) / 3,
  };
  if (M3 - m !== 0)
    res.h =
      (M3 === r
        ? (g - b) / (M3 - m) + (g < b) * 6
        : M3 === g
          ? (b - r) / (M3 - m) + 2
          : (r - g) / (M3 - m) + 4) * 60;
  if (alpha !== void 0) res.alpha = alpha;
  return res;
}
const definition$m = {
  mode: "hsi",
  toMode: {
    rgb: convertHsiToRgb,
  },
  parse: ["--hsi"],
  serialize: "--hsi",
  fromMode: {
    rgb: convertRgbToHsi,
  },
  channels: ["h", "s", "i", "alpha"],
  ranges: {
    h: [0, 360],
  },
  gamut: "rgb",
  interpolate: {
    h: { use: interpolatorLinear, fixup: fixupHueShorter },
    s: interpolatorLinear,
    i: interpolatorLinear,
    alpha: { use: interpolatorLinear, fixup: fixupAlpha },
  },
  difference: {
    h: differenceHueSaturation,
  },
  average: {
    h: averageAngle,
  },
};
function convertHslToRgb({ h, s, l, alpha }) {
  h = normalizeHue(h !== void 0 ? h : 0);
  if (s === void 0) s = 0;
  if (l === void 0) l = 0;
  let m1 = l + s * (l < 0.5 ? l : 1 - l);
  let m2 = m1 - (m1 - l) * 2 * Math.abs(((h / 60) % 2) - 1);
  let res;
  switch (Math.floor(h / 60)) {
    case 0:
      res = { r: m1, g: m2, b: 2 * l - m1 };
      break;
    case 1:
      res = { r: m2, g: m1, b: 2 * l - m1 };
      break;
    case 2:
      res = { r: 2 * l - m1, g: m1, b: m2 };
      break;
    case 3:
      res = { r: 2 * l - m1, g: m2, b: m1 };
      break;
    case 4:
      res = { r: m2, g: 2 * l - m1, b: m1 };
      break;
    case 5:
      res = { r: m1, g: 2 * l - m1, b: m2 };
      break;
    default:
      res = { r: 2 * l - m1, g: 2 * l - m1, b: 2 * l - m1 };
  }
  res.mode = "rgb";
  if (alpha !== void 0) res.alpha = alpha;
  return res;
}
function convertRgbToHsl({ r, g, b, alpha }) {
  if (r === void 0) r = 0;
  if (g === void 0) g = 0;
  if (b === void 0) b = 0;
  let M3 = Math.max(r, g, b),
    m = Math.min(r, g, b);
  let res = {
    mode: "hsl",
    s: M3 === m ? 0 : (M3 - m) / (1 - Math.abs(M3 + m - 1)),
    l: 0.5 * (M3 + m),
  };
  if (M3 - m !== 0)
    res.h =
      (M3 === r
        ? (g - b) / (M3 - m) + (g < b) * 6
        : M3 === g
          ? (b - r) / (M3 - m) + 2
          : (r - g) / (M3 - m) + 4) * 60;
  if (alpha !== void 0) res.alpha = alpha;
  return res;
}
const hueToDeg = (val, unit) => {
  switch (unit) {
    case "deg":
      return +val;
    case "rad":
      return (val / Math.PI) * 180;
    case "grad":
      return (val / 10) * 9;
    case "turn":
      return val * 360;
  }
};
const hsl_old = new RegExp(
  `^hsla?\\(\\s*${hue$1}${c}${per}${c}${per}\\s*(?:,\\s*${num_per}\\s*)?\\)$`,
);
const parseHslLegacy = (color) => {
  let match2 = color.match(hsl_old);
  if (!match2) return;
  let res = { mode: "hsl" };
  if (match2[3] !== void 0) {
    res.h = +match2[3];
  } else if (match2[1] !== void 0 && match2[2] !== void 0) {
    res.h = hueToDeg(match2[1], match2[2]);
  }
  if (match2[4] !== void 0) {
    res.s = Math.min(Math.max(0, match2[4] / 100), 1);
  }
  if (match2[5] !== void 0) {
    res.l = Math.min(Math.max(0, match2[5] / 100), 1);
  }
  if (match2[6] !== void 0) {
    res.alpha = Math.max(0, Math.min(1, match2[6] / 100));
  } else if (match2[7] !== void 0) {
    res.alpha = Math.max(0, Math.min(1, +match2[7]));
  }
  return res;
};
function parseHsl(color, parsed) {
  if (!parsed || (parsed[0] !== "hsl" && parsed[0] !== "hsla")) {
    return void 0;
  }
  const res = { mode: "hsl" };
  const [, h, s, l, alpha] = parsed;
  if (h.type !== Tok.None) {
    if (h.type === Tok.Percentage) {
      return void 0;
    }
    res.h = h.value;
  }
  if (s.type !== Tok.None) {
    if (s.type === Tok.Hue) {
      return void 0;
    }
    res.s = s.value / 100;
  }
  if (l.type !== Tok.None) {
    if (l.type === Tok.Hue) {
      return void 0;
    }
    res.l = l.value / 100;
  }
  if (alpha.type !== Tok.None) {
    res.alpha = Math.min(
      1,
      Math.max(0, alpha.type === Tok.Number ? alpha.value : alpha.value / 100),
    );
  }
  return res;
}
const definition$l = {
  mode: "hsl",
  toMode: {
    rgb: convertHslToRgb,
  },
  fromMode: {
    rgb: convertRgbToHsl,
  },
  channels: ["h", "s", "l", "alpha"],
  ranges: {
    h: [0, 360],
  },
  gamut: "rgb",
  parse: [parseHsl, parseHslLegacy],
  serialize: (c2) =>
    `hsl(${c2.h !== void 0 ? c2.h : "none"} ${c2.s !== void 0 ? c2.s * 100 + "%" : "none"} ${c2.l !== void 0 ? c2.l * 100 + "%" : "none"}${c2.alpha < 1 ? ` / ${c2.alpha}` : ""})`,
  interpolate: {
    h: { use: interpolatorLinear, fixup: fixupHueShorter },
    s: interpolatorLinear,
    l: interpolatorLinear,
    alpha: { use: interpolatorLinear, fixup: fixupAlpha },
  },
  difference: {
    h: differenceHueSaturation,
  },
  average: {
    h: averageAngle,
  },
};
function convertHsvToRgb({ h, s, v, alpha }) {
  h = normalizeHue(h !== void 0 ? h : 0);
  if (s === void 0) s = 0;
  if (v === void 0) v = 0;
  let f2 = Math.abs(((h / 60) % 2) - 1);
  let res;
  switch (Math.floor(h / 60)) {
    case 0:
      res = { r: v, g: v * (1 - s * f2), b: v * (1 - s) };
      break;
    case 1:
      res = { r: v * (1 - s * f2), g: v, b: v * (1 - s) };
      break;
    case 2:
      res = { r: v * (1 - s), g: v, b: v * (1 - s * f2) };
      break;
    case 3:
      res = { r: v * (1 - s), g: v * (1 - s * f2), b: v };
      break;
    case 4:
      res = { r: v * (1 - s * f2), g: v * (1 - s), b: v };
      break;
    case 5:
      res = { r: v, g: v * (1 - s), b: v * (1 - s * f2) };
      break;
    default:
      res = { r: v * (1 - s), g: v * (1 - s), b: v * (1 - s) };
  }
  res.mode = "rgb";
  if (alpha !== void 0) res.alpha = alpha;
  return res;
}
function convertRgbToHsv({ r, g, b, alpha }) {
  if (r === void 0) r = 0;
  if (g === void 0) g = 0;
  if (b === void 0) b = 0;
  let M3 = Math.max(r, g, b),
    m = Math.min(r, g, b);
  let res = {
    mode: "hsv",
    s: M3 === 0 ? 0 : 1 - m / M3,
    v: M3,
  };
  if (M3 - m !== 0)
    res.h =
      (M3 === r
        ? (g - b) / (M3 - m) + (g < b) * 6
        : M3 === g
          ? (b - r) / (M3 - m) + 2
          : (r - g) / (M3 - m) + 4) * 60;
  if (alpha !== void 0) res.alpha = alpha;
  return res;
}
const definition$k = {
  mode: "hsv",
  toMode: {
    rgb: convertHsvToRgb,
  },
  parse: ["--hsv"],
  serialize: "--hsv",
  fromMode: {
    rgb: convertRgbToHsv,
  },
  channels: ["h", "s", "v", "alpha"],
  ranges: {
    h: [0, 360],
  },
  gamut: "rgb",
  interpolate: {
    h: { use: interpolatorLinear, fixup: fixupHueShorter },
    s: interpolatorLinear,
    v: interpolatorLinear,
    alpha: { use: interpolatorLinear, fixup: fixupAlpha },
  },
  difference: {
    h: differenceHueSaturation,
  },
  average: {
    h: averageAngle,
  },
};
function convertHwbToRgb({ h, w, b, alpha }) {
  if (w === void 0) w = 0;
  if (b === void 0) b = 0;
  if (w + b > 1) {
    let s = w + b;
    w /= s;
    b /= s;
  }
  return convertHsvToRgb({
    h,
    s: b === 1 ? 1 : 1 - w / (1 - b),
    v: 1 - b,
    alpha,
  });
}
function convertRgbToHwb(rgba) {
  let hsv = convertRgbToHsv(rgba);
  if (hsv === void 0) return void 0;
  let s = hsv.s !== void 0 ? hsv.s : 0;
  let v = hsv.v !== void 0 ? hsv.v : 0;
  let res = {
    mode: "hwb",
    w: (1 - s) * v,
    b: 1 - v,
  };
  if (hsv.h !== void 0) res.h = hsv.h;
  if (hsv.alpha !== void 0) res.alpha = hsv.alpha;
  return res;
}
function ParseHwb(color, parsed) {
  if (!parsed || parsed[0] !== "hwb") {
    return void 0;
  }
  const res = { mode: "hwb" };
  const [, h, w, b, alpha] = parsed;
  if (h.type !== Tok.None) {
    if (h.type === Tok.Percentage) {
      return void 0;
    }
    res.h = h.value;
  }
  if (w.type !== Tok.None) {
    if (w.type === Tok.Hue) {
      return void 0;
    }
    res.w = w.value / 100;
  }
  if (b.type !== Tok.None) {
    if (b.type === Tok.Hue) {
      return void 0;
    }
    res.b = b.value / 100;
  }
  if (alpha.type !== Tok.None) {
    res.alpha = Math.min(
      1,
      Math.max(0, alpha.type === Tok.Number ? alpha.value : alpha.value / 100),
    );
  }
  return res;
}
const definition$j = {
  mode: "hwb",
  toMode: {
    rgb: convertHwbToRgb,
  },
  fromMode: {
    rgb: convertRgbToHwb,
  },
  channels: ["h", "w", "b", "alpha"],
  ranges: {
    h: [0, 360],
  },
  gamut: "rgb",
  parse: [ParseHwb],
  serialize: (c2) =>
    `hwb(${c2.h !== void 0 ? c2.h : "none"} ${c2.w !== void 0 ? c2.w * 100 + "%" : "none"} ${c2.b !== void 0 ? c2.b * 100 + "%" : "none"}${c2.alpha < 1 ? ` / ${c2.alpha}` : ""})`,
  interpolate: {
    h: { use: interpolatorLinear, fixup: fixupHueShorter },
    w: interpolatorLinear,
    b: interpolatorLinear,
    alpha: { use: interpolatorLinear, fixup: fixupAlpha },
  },
  difference: {
    h: differenceHueNaive,
  },
  average: {
    h: averageAngle,
  },
};
const YW = 203;
const M1 = 0.1593017578125;
const M2 = 78.84375;
const C1 = 0.8359375;
const C2 = 18.8515625;
const C3 = 18.6875;
function transferPqDecode(v) {
  if (v < 0) return 0;
  const c2 = Math.pow(v, 1 / M2);
  return 1e4 * Math.pow(Math.max(0, c2 - C1) / (C2 - C3 * c2), 1 / M1);
}
function transferPqEncode(v) {
  if (v < 0) return 0;
  const c2 = Math.pow(v / 1e4, M1);
  return Math.pow((C1 + C2 * c2) / (1 + C3 * c2), M2);
}
const toRel = (c2) => Math.max(c2 / YW, 0);
const convertItpToXyz65 = ({ i, t, p: p2, alpha }) => {
  if (i === void 0) i = 0;
  if (t === void 0) t = 0;
  if (p2 === void 0) p2 = 0;
  const l = transferPqDecode(
    i + 0.008609037037932761 * t + 0.11102962500302593 * p2,
  );
  const m = transferPqDecode(
    i - 0.00860903703793275 * t - 0.11102962500302599 * p2,
  );
  const s = transferPqDecode(
    i + 0.5600313357106791 * t - 0.32062717498731885 * p2,
  );
  const res = {
    mode: "xyz65",
    x: toRel(
      2.070152218389422 * l - 1.3263473389671556 * m + 0.2066510476294051 * s,
    ),
    y: toRel(
      0.3647385209748074 * l + 0.680566024947227 * m - 0.0453045459220346 * s,
    ),
    z: toRel(
      -0.049747207535812 * l - 0.0492609666966138 * m + 1.1880659249923042 * s,
    ),
  };
  if (alpha !== void 0) {
    res.alpha = alpha;
  }
  return res;
};
const toAbs = (c2 = 0) => Math.max(c2 * YW, 0);
const convertXyz65ToItp = ({ x, y, z, alpha }) => {
  const absX = toAbs(x);
  const absY = toAbs(y);
  const absZ = toAbs(z);
  const l = transferPqEncode(
    0.3592832590121217 * absX +
      0.6976051147779502 * absY -
      0.0358915932320289 * absZ,
  );
  const m = transferPqEncode(
    -0.1920808463704995 * absX +
      1.1004767970374323 * absY +
      0.0753748658519118 * absZ,
  );
  const s = transferPqEncode(
    0.0070797844607477 * absX +
      0.0748396662186366 * absY +
      0.8433265453898765 * absZ,
  );
  const i = 0.5 * l + 0.5 * m;
  const t = 1.61376953125 * l - 3.323486328125 * m + 1.709716796875 * s;
  const p2 = 4.378173828125 * l - 4.24560546875 * m - 0.132568359375 * s;
  const res = { mode: "itp", i, t, p: p2 };
  if (alpha !== void 0) {
    res.alpha = alpha;
  }
  return res;
};
const definition$i = {
  mode: "itp",
  channels: ["i", "t", "p", "alpha"],
  parse: ["--ictcp"],
  serialize: "--ictcp",
  toMode: {
    xyz65: convertItpToXyz65,
    rgb: (color) => convertXyz65ToRgb(convertItpToXyz65(color)),
  },
  fromMode: {
    xyz65: convertXyz65ToItp,
    rgb: (color) => convertXyz65ToItp(convertRgbToXyz65(color)),
  },
  ranges: {
    i: [0, 0.581],
    t: [-0.369, 0.272],
    p: [-0.164, 0.331],
  },
  interpolate: {
    i: interpolatorLinear,
    t: interpolatorLinear,
    p: interpolatorLinear,
    alpha: { use: interpolatorLinear, fixup: fixupAlpha },
  },
};
const p$1 = 134.03437499999998;
const d0$1 = 16295499532821565e-27;
const jabPqEncode = (v) => {
  if (v < 0) return 0;
  let vn2 = Math.pow(v / 1e4, M1);
  return Math.pow((C1 + C2 * vn2) / (1 + C3 * vn2), p$1);
};
const abs = (v = 0) => Math.max(v * 203, 0);
const convertXyz65ToJab = ({ x, y, z, alpha }) => {
  x = abs(x);
  y = abs(y);
  z = abs(z);
  let xp = 1.15 * x - 0.15 * z;
  let yp = 0.66 * y + 0.34 * x;
  let l = jabPqEncode(0.41478972 * xp + 0.579999 * yp + 0.014648 * z);
  let m = jabPqEncode(-0.20151 * xp + 1.120649 * yp + 0.0531008 * z);
  let s = jabPqEncode(-0.0166008 * xp + 0.2648 * yp + 0.6684799 * z);
  let i = (l + m) / 2;
  let res = {
    mode: "jab",
    j: (0.44 * i) / (1 - 0.56 * i) - d0$1,
    a: 3.524 * l - 4.066708 * m + 0.542708 * s,
    b: 0.199076 * l + 1.096799 * m - 1.295875 * s,
  };
  if (alpha !== void 0) {
    res.alpha = alpha;
  }
  return res;
};
const p = 134.03437499999998;
const d0 = 16295499532821565e-27;
const jabPqDecode = (v) => {
  if (v < 0) return 0;
  let vp = Math.pow(v, 1 / p);
  return 1e4 * Math.pow((C1 - vp) / (C3 * vp - C2), 1 / M1);
};
const rel = (v) => v / 203;
const convertJabToXyz65 = ({ j, a, b, alpha }) => {
  if (j === void 0) j = 0;
  if (a === void 0) a = 0;
  if (b === void 0) b = 0;
  let i = (j + d0) / (0.44 + 0.56 * (j + d0));
  let l = jabPqDecode(i + 0.13860504 * a + 0.058047316 * b);
  let m = jabPqDecode(i - 0.13860504 * a - 0.058047316 * b);
  let s = jabPqDecode(i - 0.096019242 * a - 0.8118919 * b);
  let res = {
    mode: "xyz65",
    x: rel(
      1.661373024652174 * l - 0.914523081304348 * m + 0.23136208173913045 * s,
    ),
    y: rel(
      -0.3250758611844533 * l + 1.571847026732543 * m - 0.21825383453227928 * s,
    ),
    z: rel(-0.090982811 * l - 0.31272829 * m + 1.5227666 * s),
  };
  if (alpha !== void 0) {
    res.alpha = alpha;
  }
  return res;
};
const convertRgbToJab = (rgb) => {
  let res = convertXyz65ToJab(convertRgbToXyz65(rgb));
  if (rgb.r === rgb.b && rgb.b === rgb.g) {
    res.a = res.b = 0;
  }
  return res;
};
const convertJabToRgb = (color) => convertXyz65ToRgb(convertJabToXyz65(color));
const definition$h = {
  mode: "jab",
  channels: ["j", "a", "b", "alpha"],
  parse: ["--jzazbz"],
  serialize: "--jzazbz",
  fromMode: {
    rgb: convertRgbToJab,
    xyz65: convertXyz65ToJab,
  },
  toMode: {
    rgb: convertJabToRgb,
    xyz65: convertJabToXyz65,
  },
  ranges: {
    j: [0, 0.222],
    a: [-0.109, 0.129],
    b: [-0.185, 0.134],
  },
  interpolate: {
    j: interpolatorLinear,
    a: interpolatorLinear,
    b: interpolatorLinear,
    alpha: { use: interpolatorLinear, fixup: fixupAlpha },
  },
};
const convertJabToJch = ({ j, a, b, alpha }) => {
  if (a === void 0) a = 0;
  if (b === void 0) b = 0;
  let c2 = Math.sqrt(a * a + b * b);
  let res = {
    mode: "jch",
    j,
    c: c2,
  };
  if (c2) {
    res.h = normalizeHue((Math.atan2(b, a) * 180) / Math.PI);
  }
  if (alpha !== void 0) {
    res.alpha = alpha;
  }
  return res;
};
const convertJchToJab = ({ j, c: c2, h, alpha }) => {
  if (h === void 0) h = 0;
  let res = {
    mode: "jab",
    j,
    a: c2 ? c2 * Math.cos((h / 180) * Math.PI) : 0,
    b: c2 ? c2 * Math.sin((h / 180) * Math.PI) : 0,
  };
  if (alpha !== void 0) res.alpha = alpha;
  return res;
};
const definition$g = {
  mode: "jch",
  parse: ["--jzczhz"],
  serialize: "--jzczhz",
  toMode: {
    jab: convertJchToJab,
    rgb: (c2) => convertJabToRgb(convertJchToJab(c2)),
  },
  fromMode: {
    rgb: (c2) => convertJabToJch(convertRgbToJab(c2)),
    jab: convertJabToJch,
  },
  channels: ["j", "c", "h", "alpha"],
  ranges: {
    j: [0, 0.221],
    c: [0, 0.19],
    h: [0, 360],
  },
  interpolate: {
    h: { use: interpolatorLinear, fixup: fixupHueShorter },
    c: interpolatorLinear,
    j: interpolatorLinear,
    alpha: { use: interpolatorLinear, fixup: fixupAlpha },
  },
  difference: {
    h: differenceHueChroma,
  },
  average: {
    h: averageAngle,
  },
};
const k = Math.pow(29, 3) / Math.pow(3, 3);
const e = Math.pow(6, 3) / Math.pow(29, 3);
let fn = (v) => (Math.pow(v, 3) > e ? Math.pow(v, 3) : (116 * v - 16) / k);
const convertLabToXyz50 = ({ l, a, b, alpha }) => {
  if (l === void 0) l = 0;
  if (a === void 0) a = 0;
  if (b === void 0) b = 0;
  let fy = (l + 16) / 116;
  let fx = a / 500 + fy;
  let fz = fy - b / 200;
  let res = {
    mode: "xyz50",
    x: fn(fx) * D50.X,
    y: fn(fy) * D50.Y,
    z: fn(fz) * D50.Z,
  };
  if (alpha !== void 0) {
    res.alpha = alpha;
  }
  return res;
};
const convertXyz50ToRgb = ({ x, y, z, alpha }) => {
  if (x === void 0) x = 0;
  if (y === void 0) y = 0;
  if (z === void 0) z = 0;
  let res = convertLrgbToRgb({
    r: x * 3.1341359569958707 - y * 1.6173863321612538 - 0.4906619460083532 * z,
    g: x * -0.978795502912089 + y * 1.916254567259524 + 0.03344273116131949 * z,
    b: x * 0.07195537988411677 - y * 0.2289768264158322 + 1.405386058324125 * z,
  });
  if (alpha !== void 0) {
    res.alpha = alpha;
  }
  return res;
};
const convertLabToRgb = (lab) => convertXyz50ToRgb(convertLabToXyz50(lab));
const convertRgbToXyz50 = (rgb) => {
  let { r, g, b, alpha } = convertRgbToLrgb(rgb);
  let res = {
    mode: "xyz50",
    x: 0.436065742824811 * r + 0.3851514688337912 * g + 0.14307845442264197 * b,
    y:
      0.22249319175623702 * r +
      0.7168870538238823 * g +
      0.06061979053616537 * b,
    z:
      0.013923904500943465 * r +
      0.09708128566574634 * g +
      0.7140993584005155 * b,
  };
  if (alpha !== void 0) {
    res.alpha = alpha;
  }
  return res;
};
const f = (value) => (value > e ? Math.cbrt(value) : (k * value + 16) / 116);
const convertXyz50ToLab = ({ x, y, z, alpha }) => {
  if (x === void 0) x = 0;
  if (y === void 0) y = 0;
  if (z === void 0) z = 0;
  let f0 = f(x / D50.X);
  let f1 = f(y / D50.Y);
  let f2 = f(z / D50.Z);
  let res = {
    mode: "lab",
    l: 116 * f1 - 16,
    a: 500 * (f0 - f1),
    b: 200 * (f1 - f2),
  };
  if (alpha !== void 0) {
    res.alpha = alpha;
  }
  return res;
};
const convertRgbToLab = (rgb) => {
  let res = convertXyz50ToLab(convertRgbToXyz50(rgb));
  if (rgb.r === rgb.b && rgb.b === rgb.g) {
    res.a = res.b = 0;
  }
  return res;
};
function parseLab(color, parsed) {
  if (!parsed || parsed[0] !== "lab") {
    return void 0;
  }
  const res = { mode: "lab" };
  const [, l, a, b, alpha] = parsed;
  if (l.type === Tok.Hue || a.type === Tok.Hue || b.type === Tok.Hue) {
    return void 0;
  }
  if (l.type !== Tok.None) {
    res.l = Math.min(Math.max(0, l.value), 100);
  }
  if (a.type !== Tok.None) {
    res.a = a.type === Tok.Number ? a.value : (a.value * 125) / 100;
  }
  if (b.type !== Tok.None) {
    res.b = b.type === Tok.Number ? b.value : (b.value * 125) / 100;
  }
  if (alpha.type !== Tok.None) {
    res.alpha = Math.min(
      1,
      Math.max(0, alpha.type === Tok.Number ? alpha.value : alpha.value / 100),
    );
  }
  return res;
}
const definition$f = {
  mode: "lab",
  toMode: {
    xyz50: convertLabToXyz50,
    rgb: convertLabToRgb,
  },
  fromMode: {
    xyz50: convertXyz50ToLab,
    rgb: convertRgbToLab,
  },
  channels: ["l", "a", "b", "alpha"],
  ranges: {
    l: [0, 100],
    a: [-125, 125],
    b: [-125, 125],
  },
  parse: [parseLab],
  serialize: (c2) =>
    `lab(${c2.l !== void 0 ? c2.l : "none"} ${c2.a !== void 0 ? c2.a : "none"} ${c2.b !== void 0 ? c2.b : "none"}${c2.alpha < 1 ? ` / ${c2.alpha}` : ""})`,
  interpolate: {
    l: interpolatorLinear,
    a: interpolatorLinear,
    b: interpolatorLinear,
    alpha: { use: interpolatorLinear, fixup: fixupAlpha },
  },
};
const definition$e = {
  ...definition$f,
  mode: "lab65",
  parse: ["--lab-d65"],
  serialize: "--lab-d65",
  toMode: {
    xyz65: convertLab65ToXyz65,
    rgb: convertLab65ToRgb,
  },
  fromMode: {
    xyz65: convertXyz65ToLab65,
    rgb: convertRgbToLab65,
  },
  ranges: {
    l: [0, 100],
    a: [-125, 125],
    b: [-125, 125],
  },
};
function parseLch(color, parsed) {
  if (!parsed || parsed[0] !== "lch") {
    return void 0;
  }
  const res = { mode: "lch" };
  const [, l, c2, h, alpha] = parsed;
  if (l.type !== Tok.None) {
    if (l.type === Tok.Hue) {
      return void 0;
    }
    res.l = Math.min(Math.max(0, l.value), 100);
  }
  if (c2.type !== Tok.None) {
    res.c = Math.max(
      0,
      c2.type === Tok.Number ? c2.value : (c2.value * 150) / 100,
    );
  }
  if (h.type !== Tok.None) {
    if (h.type === Tok.Percentage) {
      return void 0;
    }
    res.h = h.value;
  }
  if (alpha.type !== Tok.None) {
    res.alpha = Math.min(
      1,
      Math.max(0, alpha.type === Tok.Number ? alpha.value : alpha.value / 100),
    );
  }
  return res;
}
const definition$d = {
  mode: "lch",
  toMode: {
    lab: convertLchToLab,
    rgb: (c2) => convertLabToRgb(convertLchToLab(c2)),
  },
  fromMode: {
    rgb: (c2) => convertLabToLch(convertRgbToLab(c2)),
    lab: convertLabToLch,
  },
  channels: ["l", "c", "h", "alpha"],
  ranges: {
    l: [0, 100],
    c: [0, 150],
    h: [0, 360],
  },
  parse: [parseLch],
  serialize: (c2) =>
    `lch(${c2.l !== void 0 ? c2.l : "none"} ${c2.c !== void 0 ? c2.c : "none"} ${c2.h !== void 0 ? c2.h : "none"}${c2.alpha < 1 ? ` / ${c2.alpha}` : ""})`,
  interpolate: {
    h: { use: interpolatorLinear, fixup: fixupHueShorter },
    c: interpolatorLinear,
    l: interpolatorLinear,
    alpha: { use: interpolatorLinear, fixup: fixupAlpha },
  },
  difference: {
    h: differenceHueChroma,
  },
  average: {
    h: averageAngle,
  },
};
const definition$c = {
  ...definition$d,
  mode: "lch65",
  parse: ["--lch-d65"],
  serialize: "--lch-d65",
  toMode: {
    lab65: (c2) => convertLchToLab(c2, "lab65"),
    rgb: (c2) => convertLab65ToRgb(convertLchToLab(c2, "lab65")),
  },
  fromMode: {
    rgb: (c2) => convertLabToLch(convertRgbToLab65(c2), "lch65"),
    lab65: (c2) => convertLabToLch(c2, "lch65"),
  },
  ranges: {
    l: [0, 100],
    c: [0, 150],
    h: [0, 360],
  },
};
const convertLuvToLchuv = ({ l, u, v, alpha }) => {
  if (u === void 0) u = 0;
  if (v === void 0) v = 0;
  let c2 = Math.sqrt(u * u + v * v);
  let res = {
    mode: "lchuv",
    l,
    c: c2,
  };
  if (c2) {
    res.h = normalizeHue((Math.atan2(v, u) * 180) / Math.PI);
  }
  if (alpha !== void 0) {
    res.alpha = alpha;
  }
  return res;
};
const convertLchuvToLuv = ({ l, c: c2, h, alpha }) => {
  if (h === void 0) h = 0;
  let res = {
    mode: "luv",
    l,
    u: c2 ? c2 * Math.cos((h / 180) * Math.PI) : 0,
    v: c2 ? c2 * Math.sin((h / 180) * Math.PI) : 0,
  };
  if (alpha !== void 0) {
    res.alpha = alpha;
  }
  return res;
};
const u_fn$1 = (x, y, z) => (4 * x) / (x + 15 * y + 3 * z);
const v_fn$1 = (x, y, z) => (9 * y) / (x + 15 * y + 3 * z);
const un$1 = u_fn$1(D50.X, D50.Y, D50.Z);
const vn$1 = v_fn$1(D50.X, D50.Y, D50.Z);
const l_fn = (value) => (value <= e ? k * value : 116 * Math.cbrt(value) - 16);
const convertXyz50ToLuv = ({ x, y, z, alpha }) => {
  if (x === void 0) x = 0;
  if (y === void 0) y = 0;
  if (z === void 0) z = 0;
  let l = l_fn(y / D50.Y);
  let u = u_fn$1(x, y, z);
  let v = v_fn$1(x, y, z);
  if (!isFinite(u) || !isFinite(v)) {
    l = u = v = 0;
  } else {
    u = 13 * l * (u - un$1);
    v = 13 * l * (v - vn$1);
  }
  let res = {
    mode: "luv",
    l,
    u,
    v,
  };
  if (alpha !== void 0) {
    res.alpha = alpha;
  }
  return res;
};
const u_fn = (x, y, z) => (4 * x) / (x + 15 * y + 3 * z);
const v_fn = (x, y, z) => (9 * y) / (x + 15 * y + 3 * z);
const un = u_fn(D50.X, D50.Y, D50.Z);
const vn = v_fn(D50.X, D50.Y, D50.Z);
const convertLuvToXyz50 = ({ l, u, v, alpha }) => {
  if (l === void 0) l = 0;
  if (l === 0) {
    return { mode: "xyz50", x: 0, y: 0, z: 0 };
  }
  if (u === void 0) u = 0;
  if (v === void 0) v = 0;
  let up = u / (13 * l) + un;
  let vp = v / (13 * l) + vn;
  let y = D50.Y * (l <= 8 ? l / k : Math.pow((l + 16) / 116, 3));
  let x = (y * (9 * up)) / (4 * vp);
  let z = (y * (12 - 3 * up - 20 * vp)) / (4 * vp);
  let res = { mode: "xyz50", x, y, z };
  if (alpha !== void 0) {
    res.alpha = alpha;
  }
  return res;
};
const convertRgbToLchuv = (rgb) =>
  convertLuvToLchuv(convertXyz50ToLuv(convertRgbToXyz50(rgb)));
const convertLchuvToRgb = (lchuv) =>
  convertXyz50ToRgb(convertLuvToXyz50(convertLchuvToLuv(lchuv)));
const definition$b = {
  mode: "lchuv",
  toMode: {
    luv: convertLchuvToLuv,
    rgb: convertLchuvToRgb,
  },
  fromMode: {
    rgb: convertRgbToLchuv,
    luv: convertLuvToLchuv,
  },
  channels: ["l", "c", "h", "alpha"],
  parse: ["--lchuv"],
  serialize: "--lchuv",
  ranges: {
    l: [0, 100],
    c: [0, 176.956],
    h: [0, 360],
  },
  interpolate: {
    h: { use: interpolatorLinear, fixup: fixupHueShorter },
    c: interpolatorLinear,
    l: interpolatorLinear,
    alpha: { use: interpolatorLinear, fixup: fixupAlpha },
  },
  difference: {
    h: differenceHueChroma,
  },
  average: {
    h: averageAngle,
  },
};
const definition$a = {
  ...definition$r,
  mode: "lrgb",
  toMode: {
    rgb: convertLrgbToRgb,
  },
  fromMode: {
    rgb: convertRgbToLrgb,
  },
  parse: ["srgb-linear"],
  serialize: "srgb-linear",
};
const definition$9 = {
  mode: "luv",
  toMode: {
    xyz50: convertLuvToXyz50,
    rgb: (luv) => convertXyz50ToRgb(convertLuvToXyz50(luv)),
  },
  fromMode: {
    xyz50: convertXyz50ToLuv,
    rgb: (rgb) => convertXyz50ToLuv(convertRgbToXyz50(rgb)),
  },
  channels: ["l", "u", "v", "alpha"],
  parse: ["--luv"],
  serialize: "--luv",
  ranges: {
    l: [0, 100],
    u: [-84.936, 175.042],
    v: [-125.882, 87.243],
  },
  interpolate: {
    l: interpolatorLinear,
    u: interpolatorLinear,
    v: interpolatorLinear,
    alpha: { use: interpolatorLinear, fixup: fixupAlpha },
  },
};
const convertLrgbToOklab = ({ r, g, b, alpha }) => {
  if (r === void 0) r = 0;
  if (g === void 0) g = 0;
  if (b === void 0) b = 0;
  let L = Math.cbrt(
    0.412221469470763 * r + 0.5363325372617348 * g + 0.0514459932675022 * b,
  );
  let M3 = Math.cbrt(
    0.2119034958178252 * r + 0.6806995506452344 * g + 0.1073969535369406 * b,
  );
  let S = Math.cbrt(
    0.0883024591900564 * r + 0.2817188391361215 * g + 0.6299787016738222 * b,
  );
  let res = {
    mode: "oklab",
    l: 0.210454268309314 * L + 0.7936177747023054 * M3 - 0.0040720430116193 * S,
    a: 1.9779985324311684 * L - 2.42859224204858 * M3 + 0.450593709617411 * S,
    b:
      0.0259040424655478 * L + 0.7827717124575296 * M3 - 0.8086757549230774 * S,
  };
  if (alpha !== void 0) {
    res.alpha = alpha;
  }
  return res;
};
const convertRgbToOklab = (rgb) => {
  let res = convertLrgbToOklab(convertRgbToLrgb(rgb));
  if (rgb.r === rgb.b && rgb.b === rgb.g) {
    res.a = res.b = 0;
  }
  return res;
};
const convertOklabToLrgb = ({ l, a, b, alpha }) => {
  if (l === void 0) l = 0;
  if (a === void 0) a = 0;
  if (b === void 0) b = 0;
  let L = Math.pow(l + 0.3963377773761749 * a + 0.2158037573099136 * b, 3);
  let M3 = Math.pow(l - 0.1055613458156586 * a - 0.0638541728258133 * b, 3);
  let S = Math.pow(l - 0.0894841775298119 * a - 1.2914855480194092 * b, 3);
  let res = {
    mode: "lrgb",
    r: 4.076741636075957 * L - 3.3077115392580616 * M3 + 0.2309699031821044 * S,
    g:
      -1.2684379732850317 * L +
      2.6097573492876887 * M3 -
      0.3413193760026573 * S,
    b:
      -0.0041960761386756 * L -
      0.7034186179359362 * M3 +
      1.7076146940746117 * S,
  };
  if (alpha !== void 0) {
    res.alpha = alpha;
  }
  return res;
};
const convertOklabToRgb = (c2) => convertLrgbToRgb(convertOklabToLrgb(c2));
function toe(x) {
  const k_1 = 0.206;
  const k_2 = 0.03;
  const k_3 = (1 + k_1) / (1 + k_2);
  return (
    0.5 *
    (k_3 * x -
      k_1 +
      Math.sqrt((k_3 * x - k_1) * (k_3 * x - k_1) + 4 * k_2 * k_3 * x))
  );
}
function toe_inv(x) {
  const k_1 = 0.206;
  const k_2 = 0.03;
  const k_3 = (1 + k_1) / (1 + k_2);
  return (x * x + k_1 * x) / (k_3 * (x + k_2));
}
function compute_max_saturation(a, b) {
  let k0, k1, k2, k3, k4, wl, wm, ws;
  if (-1.88170328 * a - 0.80936493 * b > 1) {
    k0 = 1.19086277;
    k1 = 1.76576728;
    k2 = 0.59662641;
    k3 = 0.75515197;
    k4 = 0.56771245;
    wl = 4.0767416621;
    wm = -3.3077115913;
    ws = 0.2309699292;
  } else if (1.81444104 * a - 1.19445276 * b > 1) {
    k0 = 0.73956515;
    k1 = -0.45954404;
    k2 = 0.08285427;
    k3 = 0.1254107;
    k4 = 0.14503204;
    wl = -1.2684380046;
    wm = 2.6097574011;
    ws = -0.3413193965;
  } else {
    k0 = 1.35733652;
    k1 = -915799e-8;
    k2 = -1.1513021;
    k3 = -0.50559606;
    k4 = 692167e-8;
    wl = -0.0041960863;
    wm = -0.7034186147;
    ws = 1.707614701;
  }
  let S = k0 + k1 * a + k2 * b + k3 * a * a + k4 * a * b;
  let k_l = 0.3963377774 * a + 0.2158037573 * b;
  let k_m = -0.1055613458 * a - 0.0638541728 * b;
  let k_s = -0.0894841775 * a - 1.291485548 * b;
  {
    let l_ = 1 + S * k_l;
    let m_ = 1 + S * k_m;
    let s_ = 1 + S * k_s;
    let l = l_ * l_ * l_;
    let m = m_ * m_ * m_;
    let s = s_ * s_ * s_;
    let l_dS = 3 * k_l * l_ * l_;
    let m_dS = 3 * k_m * m_ * m_;
    let s_dS = 3 * k_s * s_ * s_;
    let l_dS2 = 6 * k_l * k_l * l_;
    let m_dS2 = 6 * k_m * k_m * m_;
    let s_dS2 = 6 * k_s * k_s * s_;
    let f2 = wl * l + wm * m + ws * s;
    let f1 = wl * l_dS + wm * m_dS + ws * s_dS;
    let f22 = wl * l_dS2 + wm * m_dS2 + ws * s_dS2;
    S = S - (f2 * f1) / (f1 * f1 - 0.5 * f2 * f22);
  }
  return S;
}
function find_cusp(a, b) {
  let S_cusp = compute_max_saturation(a, b);
  let rgb = convertOklabToLrgb({ l: 1, a: S_cusp * a, b: S_cusp * b });
  let L_cusp = Math.cbrt(1 / Math.max(rgb.r, rgb.g, rgb.b));
  let C_cusp = L_cusp * S_cusp;
  return [L_cusp, C_cusp];
}
function find_gamut_intersection(a, b, L1, C12, L0, cusp = null) {
  if (!cusp) {
    cusp = find_cusp(a, b);
  }
  let t;
  if ((L1 - L0) * cusp[1] - (cusp[0] - L0) * C12 <= 0) {
    t = (cusp[1] * L0) / (C12 * cusp[0] + cusp[1] * (L0 - L1));
  } else {
    t = (cusp[1] * (L0 - 1)) / (C12 * (cusp[0] - 1) + cusp[1] * (L0 - L1));
    {
      let dL = L1 - L0;
      let dC = C12;
      let k_l = 0.3963377774 * a + 0.2158037573 * b;
      let k_m = -0.1055613458 * a - 0.0638541728 * b;
      let k_s = -0.0894841775 * a - 1.291485548 * b;
      let l_dt = dL + dC * k_l;
      let m_dt = dL + dC * k_m;
      let s_dt = dL + dC * k_s;
      {
        let L = L0 * (1 - t) + t * L1;
        let C = t * C12;
        let l_ = L + C * k_l;
        let m_ = L + C * k_m;
        let s_ = L + C * k_s;
        let l = l_ * l_ * l_;
        let m = m_ * m_ * m_;
        let s = s_ * s_ * s_;
        let ldt = 3 * l_dt * l_ * l_;
        let mdt = 3 * m_dt * m_ * m_;
        let sdt = 3 * s_dt * s_ * s_;
        let ldt2 = 6 * l_dt * l_dt * l_;
        let mdt2 = 6 * m_dt * m_dt * m_;
        let sdt2 = 6 * s_dt * s_dt * s_;
        let r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s - 1;
        let r1 = 4.0767416621 * ldt - 3.3077115913 * mdt + 0.2309699292 * sdt;
        let r2 =
          4.0767416621 * ldt2 - 3.3077115913 * mdt2 + 0.2309699292 * sdt2;
        let u_r = r1 / (r1 * r1 - 0.5 * r * r2);
        let t_r = -r * u_r;
        let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s - 1;
        let g1 = -1.2684380046 * ldt + 2.6097574011 * mdt - 0.3413193965 * sdt;
        let g2 =
          -1.2684380046 * ldt2 + 2.6097574011 * mdt2 - 0.3413193965 * sdt2;
        let u_g = g1 / (g1 * g1 - 0.5 * g * g2);
        let t_g = -g * u_g;
        let b2 = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s - 1;
        let b1 = -0.0041960863 * ldt - 0.7034186147 * mdt + 1.707614701 * sdt;
        let b22 =
          -0.0041960863 * ldt2 - 0.7034186147 * mdt2 + 1.707614701 * sdt2;
        let u_b = b1 / (b1 * b1 - 0.5 * b2 * b22);
        let t_b = -b2 * u_b;
        t_r = u_r >= 0 ? t_r : 1e6;
        t_g = u_g >= 0 ? t_g : 1e6;
        t_b = u_b >= 0 ? t_b : 1e6;
        t += Math.min(t_r, Math.min(t_g, t_b));
      }
    }
  }
  return t;
}
function get_ST_max(a_, b_, cusp = null) {
  if (!cusp) {
    cusp = find_cusp(a_, b_);
  }
  let L = cusp[0];
  let C = cusp[1];
  return [C / L, C / (1 - L)];
}
function get_Cs(L, a_, b_) {
  let cusp = find_cusp(a_, b_);
  let C_max = find_gamut_intersection(a_, b_, L, 1, L, cusp);
  let ST_max = get_ST_max(a_, b_, cusp);
  let S_mid =
    0.11516993 +
    1 /
      (7.4477897 +
        4.1590124 * b_ +
        a_ *
          (-2.19557347 +
            1.75198401 * b_ +
            a_ *
              (-2.13704948 -
                10.02301043 * b_ +
                a_ * (-4.24894561 + 5.38770819 * b_ + 4.69891013 * a_))));
  let T_mid =
    0.11239642 +
    1 /
      (1.6132032 -
        0.68124379 * b_ +
        a_ *
          (0.40370612 +
            0.90148123 * b_ +
            a_ *
              (-0.27087943 +
                0.6122399 * b_ +
                a_ * (299215e-8 - 0.45399568 * b_ - 0.14661872 * a_))));
  let k2 = C_max / Math.min(L * ST_max[0], (1 - L) * ST_max[1]);
  let C_a = L * S_mid;
  let C_b = (1 - L) * T_mid;
  let C_mid =
    0.9 *
    k2 *
    Math.sqrt(
      Math.sqrt(
        1 / (1 / (C_a * C_a * C_a * C_a) + 1 / (C_b * C_b * C_b * C_b)),
      ),
    );
  C_a = L * 0.4;
  C_b = (1 - L) * 0.8;
  let C_0 = Math.sqrt(1 / (1 / (C_a * C_a) + 1 / (C_b * C_b)));
  return [C_0, C_mid, C_max];
}
function convertOklabToOkhsl(lab) {
  const l = lab.l !== void 0 ? lab.l : 0;
  const a = lab.a !== void 0 ? lab.a : 0;
  const b = lab.b !== void 0 ? lab.b : 0;
  const ret = { mode: "okhsl", l: toe(l) };
  if (lab.alpha !== void 0) {
    ret.alpha = lab.alpha;
  }
  let c2 = Math.sqrt(a * a + b * b);
  if (!c2) {
    ret.s = 0;
    return ret;
  }
  let [C_0, C_mid, C_max] = get_Cs(l, a / c2, b / c2);
  let s;
  if (c2 < C_mid) {
    let k_0 = 0;
    let k_1 = 0.8 * C_0;
    let k_2 = 1 - k_1 / C_mid;
    let t = (c2 - k_0) / (k_1 + k_2 * (c2 - k_0));
    s = t * 0.8;
  } else {
    let k_0 = C_mid;
    let k_1 = (0.2 * C_mid * C_mid * 1.25 * 1.25) / C_0;
    let k_2 = 1 - k_1 / (C_max - C_mid);
    let t = (c2 - k_0) / (k_1 + k_2 * (c2 - k_0));
    s = 0.8 + 0.2 * t;
  }
  if (s) {
    ret.s = s;
    ret.h = normalizeHue((Math.atan2(b, a) * 180) / Math.PI);
  }
  return ret;
}
function convertOkhslToOklab(hsl) {
  let h = hsl.h !== void 0 ? hsl.h : 0;
  let s = hsl.s !== void 0 ? hsl.s : 0;
  let l = hsl.l !== void 0 ? hsl.l : 0;
  const ret = { mode: "oklab", l: toe_inv(l) };
  if (hsl.alpha !== void 0) {
    ret.alpha = hsl.alpha;
  }
  if (!s || l === 1) {
    ret.a = ret.b = 0;
    return ret;
  }
  let a_ = Math.cos((h / 180) * Math.PI);
  let b_ = Math.sin((h / 180) * Math.PI);
  let [C_0, C_mid, C_max] = get_Cs(ret.l, a_, b_);
  let t, k_0, k_1, k_2;
  if (s < 0.8) {
    t = 1.25 * s;
    k_0 = 0;
    k_1 = 0.8 * C_0;
    k_2 = 1 - k_1 / C_mid;
  } else {
    t = 5 * (s - 0.8);
    k_0 = C_mid;
    k_1 = (0.2 * C_mid * C_mid * 1.25 * 1.25) / C_0;
    k_2 = 1 - k_1 / (C_max - C_mid);
  }
  let C = k_0 + (t * k_1) / (1 - k_2 * t);
  ret.a = C * a_;
  ret.b = C * b_;
  return ret;
}
const modeOkhsl = {
  ...definition$l,
  mode: "okhsl",
  channels: ["h", "s", "l", "alpha"],
  parse: ["--okhsl"],
  serialize: "--okhsl",
  fromMode: {
    oklab: convertOklabToOkhsl,
    rgb: (c2) => convertOklabToOkhsl(convertRgbToOklab(c2)),
  },
  toMode: {
    oklab: convertOkhslToOklab,
    rgb: (c2) => convertOklabToRgb(convertOkhslToOklab(c2)),
  },
};
function convertOklabToOkhsv(lab) {
  let l = lab.l !== void 0 ? lab.l : 0;
  let a = lab.a !== void 0 ? lab.a : 0;
  let b = lab.b !== void 0 ? lab.b : 0;
  let c2 = Math.sqrt(a * a + b * b);
  let a_ = c2 ? a / c2 : 1;
  let b_ = c2 ? b / c2 : 1;
  let [S_max, T] = get_ST_max(a_, b_);
  let S_0 = 0.5;
  let k2 = 1 - S_0 / S_max;
  let t = T / (c2 + l * T);
  let L_v = t * l;
  let C_v = t * c2;
  let L_vt = toe_inv(L_v);
  let C_vt = (C_v * L_vt) / L_v;
  let rgb_scale = convertOklabToLrgb({ l: L_vt, a: a_ * C_vt, b: b_ * C_vt });
  let scale_L = Math.cbrt(
    1 / Math.max(rgb_scale.r, rgb_scale.g, rgb_scale.b, 0),
  );
  l = l / scale_L;
  c2 = ((c2 / scale_L) * toe(l)) / l;
  l = toe(l);
  const ret = {
    mode: "okhsv",
    s: c2 ? ((S_0 + T) * C_v) / (T * S_0 + T * k2 * C_v) : 0,
    v: l ? l / L_v : 0,
  };
  if (ret.s) {
    ret.h = normalizeHue((Math.atan2(b, a) * 180) / Math.PI);
  }
  if (lab.alpha !== void 0) {
    ret.alpha = lab.alpha;
  }
  return ret;
}
function convertOkhsvToOklab(hsv) {
  const ret = { mode: "oklab" };
  if (hsv.alpha !== void 0) {
    ret.alpha = hsv.alpha;
  }
  const h = hsv.h !== void 0 ? hsv.h : 0;
  const s = hsv.s !== void 0 ? hsv.s : 0;
  const v = hsv.v !== void 0 ? hsv.v : 0;
  const a_ = Math.cos((h / 180) * Math.PI);
  const b_ = Math.sin((h / 180) * Math.PI);
  const [S_max, T] = get_ST_max(a_, b_);
  const S_0 = 0.5;
  const k2 = 1 - S_0 / S_max;
  const L_v = 1 - (s * S_0) / (S_0 + T - T * k2 * s);
  const C_v = (s * T * S_0) / (S_0 + T - T * k2 * s);
  const L_vt = toe_inv(L_v);
  const C_vt = (C_v * L_vt) / L_v;
  const rgb_scale = convertOklabToLrgb({
    l: L_vt,
    a: a_ * C_vt,
    b: b_ * C_vt,
  });
  const scale_L = Math.cbrt(
    1 / Math.max(rgb_scale.r, rgb_scale.g, rgb_scale.b, 0),
  );
  const L_new = toe_inv(v * L_v);
  const C = (C_v * L_new) / L_v;
  ret.l = L_new * scale_L;
  ret.a = C * a_ * scale_L;
  ret.b = C * b_ * scale_L;
  return ret;
}
const modeOkhsv = {
  ...definition$k,
  mode: "okhsv",
  channels: ["h", "s", "v", "alpha"],
  parse: ["--okhsv"],
  serialize: "--okhsv",
  fromMode: {
    oklab: convertOklabToOkhsv,
    rgb: (c2) => convertOklabToOkhsv(convertRgbToOklab(c2)),
  },
  toMode: {
    oklab: convertOkhsvToOklab,
    rgb: (c2) => convertOklabToRgb(convertOkhsvToOklab(c2)),
  },
};
function parseOklab(color, parsed) {
  if (!parsed || parsed[0] !== "oklab") {
    return void 0;
  }
  const res = { mode: "oklab" };
  const [, l, a, b, alpha] = parsed;
  if (l.type === Tok.Hue || a.type === Tok.Hue || b.type === Tok.Hue) {
    return void 0;
  }
  if (l.type !== Tok.None) {
    res.l = Math.min(
      Math.max(0, l.type === Tok.Number ? l.value : l.value / 100),
      1,
    );
  }
  if (a.type !== Tok.None) {
    res.a = a.type === Tok.Number ? a.value : (a.value * 0.4) / 100;
  }
  if (b.type !== Tok.None) {
    res.b = b.type === Tok.Number ? b.value : (b.value * 0.4) / 100;
  }
  if (alpha.type !== Tok.None) {
    res.alpha = Math.min(
      1,
      Math.max(0, alpha.type === Tok.Number ? alpha.value : alpha.value / 100),
    );
  }
  return res;
}
const definition$8 = {
  ...definition$f,
  mode: "oklab",
  toMode: {
    lrgb: convertOklabToLrgb,
    rgb: convertOklabToRgb,
  },
  fromMode: {
    lrgb: convertLrgbToOklab,
    rgb: convertRgbToOklab,
  },
  ranges: {
    l: [0, 1],
    a: [-0.4, 0.4],
    b: [-0.4, 0.4],
  },
  parse: [parseOklab],
  serialize: (c2) =>
    `oklab(${c2.l !== void 0 ? c2.l : "none"} ${c2.a !== void 0 ? c2.a : "none"} ${c2.b !== void 0 ? c2.b : "none"}${c2.alpha < 1 ? ` / ${c2.alpha}` : ""})`,
};
function parseOklch(color, parsed) {
  if (!parsed || parsed[0] !== "oklch") {
    return void 0;
  }
  const res = { mode: "oklch" };
  const [, l, c2, h, alpha] = parsed;
  if (l.type !== Tok.None) {
    if (l.type === Tok.Hue) {
      return void 0;
    }
    res.l = Math.min(
      Math.max(0, l.type === Tok.Number ? l.value : l.value / 100),
      1,
    );
  }
  if (c2.type !== Tok.None) {
    res.c = Math.max(
      0,
      c2.type === Tok.Number ? c2.value : (c2.value * 0.4) / 100,
    );
  }
  if (h.type !== Tok.None) {
    if (h.type === Tok.Percentage) {
      return void 0;
    }
    res.h = h.value;
  }
  if (alpha.type !== Tok.None) {
    res.alpha = Math.min(
      1,
      Math.max(0, alpha.type === Tok.Number ? alpha.value : alpha.value / 100),
    );
  }
  return res;
}
const definition$7 = {
  ...definition$d,
  mode: "oklch",
  toMode: {
    oklab: (c2) => convertLchToLab(c2, "oklab"),
    rgb: (c2) => convertOklabToRgb(convertLchToLab(c2, "oklab")),
  },
  fromMode: {
    rgb: (c2) => convertLabToLch(convertRgbToOklab(c2), "oklch"),
    oklab: (c2) => convertLabToLch(c2, "oklch"),
  },
  parse: [parseOklch],
  serialize: (c2) =>
    `oklch(${c2.l !== void 0 ? c2.l : "none"} ${c2.c !== void 0 ? c2.c : "none"} ${c2.h !== void 0 ? c2.h : "none"}${c2.alpha < 1 ? ` / ${c2.alpha}` : ""})`,
  ranges: {
    l: [0, 1],
    c: [0, 0.4],
    h: [0, 360],
  },
};
const convertP3ToXyz65 = (rgb) => {
  let { r, g, b, alpha } = convertRgbToLrgb(rgb);
  let res = {
    mode: "xyz65",
    x: 0.486570948648216 * r + 0.265667693169093 * g + 0.1982172852343625 * b,
    y: 0.2289745640697487 * r + 0.6917385218365062 * g + 0.079286914093745 * b,
    z: 0 * r + 0.0451133818589026 * g + 1.043944368900976 * b,
  };
  if (alpha !== void 0) {
    res.alpha = alpha;
  }
  return res;
};
const convertXyz65ToP3 = ({ x, y, z, alpha }) => {
  if (x === void 0) x = 0;
  if (y === void 0) y = 0;
  if (z === void 0) z = 0;
  let res = convertLrgbToRgb(
    {
      r:
        x * 2.4934969119414263 - y * 0.9313836179191242 - 0.402710784450717 * z,
      g:
        x * -0.8294889695615749 +
        y * 1.7626640603183465 +
        0.0236246858419436 * z,
      b:
        x * 0.0358458302437845 -
        y * 0.0761723892680418 +
        0.9568845240076871 * z,
    },
    "p3",
  );
  if (alpha !== void 0) {
    res.alpha = alpha;
  }
  return res;
};
const definition$6 = {
  ...definition$r,
  mode: "p3",
  parse: ["display-p3"],
  serialize: "display-p3",
  fromMode: {
    rgb: (color) => convertXyz65ToP3(convertRgbToXyz65(color)),
    xyz65: convertXyz65ToP3,
  },
  toMode: {
    rgb: (color) => convertXyz65ToRgb(convertP3ToXyz65(color)),
    xyz65: convertP3ToXyz65,
  },
};
const gamma$1 = (v) => {
  let abs2 = Math.abs(v);
  if (abs2 >= 1 / 512) {
    return Math.sign(v) * Math.pow(abs2, 1 / 1.8);
  }
  return 16 * v;
};
const convertXyz50ToProphoto = ({ x, y, z, alpha }) => {
  if (x === void 0) x = 0;
  if (y === void 0) y = 0;
  if (z === void 0) z = 0;
  let res = {
    mode: "prophoto",
    r: gamma$1(
      x * 1.3457868816471585 - y * 0.2555720873797946 - 0.0511018649755453 * z,
    ),
    g: gamma$1(
      x * -0.5446307051249019 + y * 1.5082477428451466 + 0.0205274474364214 * z,
    ),
    b: gamma$1(x * 0 + y * 0 + 1.2119675456389452 * z),
  };
  if (alpha !== void 0) {
    res.alpha = alpha;
  }
  return res;
};
const linearize$1 = (v = 0) => {
  let abs2 = Math.abs(v);
  if (abs2 >= 16 / 512) {
    return Math.sign(v) * Math.pow(abs2, 1.8);
  }
  return v / 16;
};
const convertProphotoToXyz50 = (prophoto) => {
  let r = linearize$1(prophoto.r);
  let g = linearize$1(prophoto.g);
  let b = linearize$1(prophoto.b);
  let res = {
    mode: "xyz50",
    x: 0.7977666449006423 * r + 0.1351812974005331 * g + 0.0313477341283922 * b,
    y: 0.2880748288194013 * r + 0.7118352342418731 * g + 899369387256e-16 * b,
    z: 0 * r + 0 * g + 0.8251046025104602 * b,
  };
  if (prophoto.alpha !== void 0) {
    res.alpha = prophoto.alpha;
  }
  return res;
};
const definition$5 = {
  ...definition$r,
  mode: "prophoto",
  parse: ["prophoto-rgb"],
  serialize: "prophoto-rgb",
  fromMode: {
    xyz50: convertXyz50ToProphoto,
    rgb: (color) => convertXyz50ToProphoto(convertRgbToXyz50(color)),
  },
  toMode: {
    xyz50: convertProphotoToXyz50,
    rgb: (color) => convertXyz50ToRgb(convertProphotoToXyz50(color)),
  },
};
const α$1 = 1.09929682680944;
const β$1 = 0.018053968510807;
const gamma = (v) => {
  const abs2 = Math.abs(v);
  if (abs2 > β$1) {
    return (Math.sign(v) || 1) * (α$1 * Math.pow(abs2, 0.45) - (α$1 - 1));
  }
  return 4.5 * v;
};
const convertXyz65ToRec2020 = ({ x, y, z, alpha }) => {
  if (x === void 0) x = 0;
  if (y === void 0) y = 0;
  if (z === void 0) z = 0;
  let res = {
    mode: "rec2020",
    r: gamma(
      x * 1.7166511879712683 - y * 0.3556707837763925 - 0.2533662813736599 * z,
    ),
    g: gamma(
      x * -0.6666843518324893 + y * 1.6164812366349395 + 0.0157685458139111 * z,
    ),
    b: gamma(
      x * 0.0176398574453108 - y * 0.0427706132578085 + 0.9421031212354739 * z,
    ),
  };
  if (alpha !== void 0) {
    res.alpha = alpha;
  }
  return res;
};
const α = 1.09929682680944;
const β = 0.018053968510807;
const linearize = (v = 0) => {
  let abs2 = Math.abs(v);
  if (abs2 < β * 4.5) {
    return v / 4.5;
  }
  return (Math.sign(v) || 1) * Math.pow((abs2 + α - 1) / α, 1 / 0.45);
};
const convertRec2020ToXyz65 = (rec2020) => {
  let r = linearize(rec2020.r);
  let g = linearize(rec2020.g);
  let b = linearize(rec2020.b);
  let res = {
    mode: "xyz65",
    x: 0.6369580483012911 * r + 0.1446169035862083 * g + 0.1688809751641721 * b,
    y: 0.262700212011267 * r + 0.6779980715188708 * g + 0.059301716469862 * b,
    z: 0 * r + 0.0280726930490874 * g + 1.0609850577107909 * b,
  };
  if (rec2020.alpha !== void 0) {
    res.alpha = rec2020.alpha;
  }
  return res;
};
const definition$4 = {
  ...definition$r,
  mode: "rec2020",
  fromMode: {
    xyz65: convertXyz65ToRec2020,
    rgb: (color) => convertXyz65ToRec2020(convertRgbToXyz65(color)),
  },
  toMode: {
    xyz65: convertRec2020ToXyz65,
    rgb: (color) => convertXyz65ToRgb(convertRec2020ToXyz65(color)),
  },
  parse: ["rec2020"],
  serialize: "rec2020",
};
const bias = 0.0037930732552754493;
const bias_cbrt = Math.cbrt(bias);
const transfer$1 = (v) => Math.cbrt(v) - bias_cbrt;
const convertRgbToXyb = (color) => {
  const { r, g, b, alpha } = convertRgbToLrgb(color);
  const l = transfer$1(0.3 * r + 0.622 * g + 0.078 * b + bias);
  const m = transfer$1(0.23 * r + 0.692 * g + 0.078 * b + bias);
  const s = transfer$1(
    0.2434226892454782 * r +
      0.2047674442449682 * g +
      0.5518098665095535 * b +
      bias,
  );
  const res = {
    mode: "xyb",
    x: (l - m) / 2,
    y: (l + m) / 2,
    /* Apply default chroma from luma (subtract Y from B) */
    b: s - (l + m) / 2,
  };
  if (alpha !== void 0) res.alpha = alpha;
  return res;
};
const transfer = (v) => Math.pow(v + bias_cbrt, 3);
const convertXybToRgb = ({ x, y, b, alpha }) => {
  if (x === void 0) x = 0;
  if (y === void 0) y = 0;
  if (b === void 0) b = 0;
  const l = transfer(x + y) - bias;
  const m = transfer(y - x) - bias;
  const s = transfer(b + y) - bias;
  const res = convertLrgbToRgb({
    r: 11.031566904639861 * l - 9.866943908131562 * m - 0.16462299650829934 * s,
    g:
      -3.2541473810744237 * l + 4.418770377582723 * m - 0.16462299650829934 * s,
    b:
      -3.6588512867136815 * l + 2.7129230459360922 * m + 1.9459282407775895 * s,
  });
  if (alpha !== void 0) res.alpha = alpha;
  return res;
};
const definition$3 = {
  mode: "xyb",
  channels: ["x", "y", "b", "alpha"],
  parse: ["--xyb"],
  serialize: "--xyb",
  toMode: {
    rgb: convertXybToRgb,
  },
  fromMode: {
    rgb: convertRgbToXyb,
  },
  ranges: {
    x: [-0.0154, 0.0281],
    y: [0, 0.8453],
    b: [-0.2778, 0.388],
  },
  interpolate: {
    x: interpolatorLinear,
    y: interpolatorLinear,
    b: interpolatorLinear,
    alpha: { use: interpolatorLinear, fixup: fixupAlpha },
  },
};
const definition$2 = {
  mode: "xyz50",
  parse: ["xyz-d50"],
  serialize: "xyz-d50",
  toMode: {
    rgb: convertXyz50ToRgb,
    lab: convertXyz50ToLab,
  },
  fromMode: {
    rgb: convertRgbToXyz50,
    lab: convertLabToXyz50,
  },
  channels: ["x", "y", "z", "alpha"],
  ranges: {
    x: [0, 0.964],
    y: [0, 0.999],
    z: [0, 0.825],
  },
  interpolate: {
    x: interpolatorLinear,
    y: interpolatorLinear,
    z: interpolatorLinear,
    alpha: { use: interpolatorLinear, fixup: fixupAlpha },
  },
};
const convertXyz65ToXyz50 = (xyz65) => {
  let { x, y, z, alpha } = xyz65;
  if (x === void 0) x = 0;
  if (y === void 0) y = 0;
  if (z === void 0) z = 0;
  let res = {
    mode: "xyz50",
    x: 1.0479298208405488 * x + 0.0229467933410191 * y - 0.0501922295431356 * z,
    y: 0.0296278156881593 * x + 0.990434484573249 * y - 0.0170738250293851 * z,
    z:
      -0.0092430581525912 * x + 0.0150551448965779 * y + 0.7518742899580008 * z,
  };
  if (alpha !== void 0) {
    res.alpha = alpha;
  }
  return res;
};
const convertXyz50ToXyz65 = (xyz50) => {
  let { x, y, z, alpha } = xyz50;
  if (x === void 0) x = 0;
  if (y === void 0) y = 0;
  if (z === void 0) z = 0;
  let res = {
    mode: "xyz65",
    x: 0.9554734527042182 * x - 0.0230985368742614 * y + 0.0632593086610217 * z,
    y: -0.0283697069632081 * x + 1.0099954580058226 * y + 0.021041398966943 * z,
    z: 0.0123140016883199 * x - 0.0205076964334779 * y + 1.3303659366080753 * z,
  };
  if (alpha !== void 0) {
    res.alpha = alpha;
  }
  return res;
};
const definition$1 = {
  mode: "xyz65",
  toMode: {
    rgb: convertXyz65ToRgb,
    xyz50: convertXyz65ToXyz50,
  },
  fromMode: {
    rgb: convertRgbToXyz65,
    xyz50: convertXyz50ToXyz65,
  },
  ranges: {
    x: [0, 0.95],
    y: [0, 1],
    z: [0, 1.088],
  },
  channels: ["x", "y", "z", "alpha"],
  parse: ["xyz", "xyz-d65"],
  serialize: "xyz-d65",
  interpolate: {
    x: interpolatorLinear,
    y: interpolatorLinear,
    z: interpolatorLinear,
    alpha: { use: interpolatorLinear, fixup: fixupAlpha },
  },
};
const convertRgbToYiq = ({ r, g, b, alpha }) => {
  if (r === void 0) r = 0;
  if (g === void 0) g = 0;
  if (b === void 0) b = 0;
  const res = {
    mode: "yiq",
    y: 0.29889531 * r + 0.58662247 * g + 0.11448223 * b,
    i: 0.59597799 * r - 0.2741761 * g - 0.32180189 * b,
    q: 0.21147017 * r - 0.52261711 * g + 0.31114694 * b,
  };
  if (alpha !== void 0) res.alpha = alpha;
  return res;
};
const convertYiqToRgb = ({ y, i, q, alpha }) => {
  if (y === void 0) y = 0;
  if (i === void 0) i = 0;
  if (q === void 0) q = 0;
  const res = {
    mode: "rgb",
    r: y + 0.95608445 * i + 0.6208885 * q,
    g: y - 0.27137664 * i - 0.6486059 * q,
    b: y - 1.10561724 * i + 1.70250126 * q,
  };
  if (alpha !== void 0) res.alpha = alpha;
  return res;
};
const definition = {
  mode: "yiq",
  toMode: {
    rgb: convertYiqToRgb,
  },
  fromMode: {
    rgb: convertRgbToYiq,
  },
  channels: ["y", "i", "q", "alpha"],
  parse: ["--yiq"],
  serialize: "--yiq",
  ranges: {
    i: [-0.595, 0.595],
    q: [-0.522, 0.522],
  },
  interpolate: {
    y: interpolatorLinear,
    i: interpolatorLinear,
    q: interpolatorLinear,
    alpha: { use: interpolatorLinear, fixup: fixupAlpha },
  },
};
useMode(definition$q);
useMode(definition$p);
useMode(definition$o);
useMode(definition$n);
useMode(definition$m);
useMode(definition$l);
useMode(definition$k);
useMode(definition$j);
useMode(definition$i);
useMode(definition$h);
useMode(definition$g);
useMode(definition$f);
useMode(definition$e);
useMode(definition$d);
useMode(definition$c);
useMode(definition$b);
useMode(definition$a);
useMode(definition$9);
useMode(modeOkhsl);
useMode(modeOkhsv);
useMode(definition$8);
useMode(definition$7);
useMode(definition$6);
useMode(definition$5);
useMode(definition$4);
useMode(definition$r);
useMode(definition$3);
useMode(definition$2);
useMode(definition$1);
useMode(definition);
[50, ...range$1(100, 1e3, 100)];
extendTailwindMerge({
  extend: {
    classGroups: {
      shadow: [
        "shadow-border-l",
        "shadow-border-r",
        "shadow-border-t",
        "shadow-border-b",
        "elevation-none",
        ...range$1(1, 25).map((x) => `elevation-${x}`),
      ],
    },
  },
});
var NOTHING = Symbol.for("immer-nothing");
var DRAFTABLE = Symbol.for("immer-draftable");
var DRAFT_STATE = Symbol.for("immer-state");
var errors =
  process.env.NODE_ENV !== "production"
    ? [
        // All error codes, starting by 0:
        function (plugin) {
          return `The plugin for '${plugin}' has not been loaded into Immer. To enable the plugin, import and call \`enable${plugin}()\` when initializing your application.`;
        },
        function (thing) {
          return `produce can only be called on things that are draftable: plain objects, arrays, Map, Set or classes that are marked with '[immerable]: true'. Got '${thing}'`;
        },
        "This object has been frozen and should not be mutated",
        function (data) {
          return (
            "Cannot use a proxy that has been revoked. Did you pass an object from inside an immer function to an async process? " +
            data
          );
        },
        "An immer producer returned a new value *and* modified its draft. Either return a new value *or* modify the draft.",
        "Immer forbids circular references",
        "The first or second argument to `produce` must be a function",
        "The third argument to `produce` must be a function or undefined",
        "First argument to `createDraft` must be a plain object, an array, or an immerable object",
        "First argument to `finishDraft` must be a draft returned by `createDraft`",
        function (thing) {
          return `'current' expects a draft, got: ${thing}`;
        },
        "Object.defineProperty() cannot be used on an Immer draft",
        "Object.setPrototypeOf() cannot be used on an Immer draft",
        "Immer only supports deleting array indices",
        "Immer only supports setting array indices and the 'length' property",
        function (thing) {
          return `'original' expects a draft, got: ${thing}`;
        },
        // Note: if more errors are added, the errorOffset in Patches.ts should be increased
        // See Patches.ts for additional errors
      ]
    : [];
function die(error, ...args) {
  if (process.env.NODE_ENV !== "production") {
    const e2 = errors[error];
    const msg = typeof e2 === "function" ? e2.apply(null, args) : e2;
    throw new Error(`[Immer] ${msg}`);
  }
  throw new Error(
    `[Immer] minified error nr: ${error}. Full error at: https://bit.ly/3cXEKWf`,
  );
}
var getPrototypeOf = Object.getPrototypeOf;
function isDraft(value) {
  return !!value && !!value[DRAFT_STATE];
}
function isDraftable(value) {
  if (!value) return false;
  return (
    isPlainObject(value) ||
    Array.isArray(value) ||
    !!value[DRAFTABLE] ||
    !!value.constructor?.[DRAFTABLE] ||
    isMap(value) ||
    isSet(value)
  );
}
var objectCtorString = Object.prototype.constructor.toString();
function isPlainObject(value) {
  if (!value || typeof value !== "object") return false;
  const proto = getPrototypeOf(value);
  if (proto === null) {
    return true;
  }
  const Ctor =
    Object.hasOwnProperty.call(proto, "constructor") && proto.constructor;
  if (Ctor === Object) return true;
  return (
    typeof Ctor == "function" &&
    Function.toString.call(Ctor) === objectCtorString
  );
}
function each(obj, iter) {
  if (getArchtype(obj) === 0) {
    Reflect.ownKeys(obj).forEach((key) => {
      iter(key, obj[key], obj);
    });
  } else {
    obj.forEach((entry, index) => iter(index, entry, obj));
  }
}
function getArchtype(thing) {
  const state = thing[DRAFT_STATE];
  return state
    ? state.type_
    : Array.isArray(thing)
      ? 1
      : isMap(thing)
        ? 2
        : isSet(thing)
          ? 3
          : 0;
}
function has(thing, prop) {
  return getArchtype(thing) === 2
    ? thing.has(prop)
    : Object.prototype.hasOwnProperty.call(thing, prop);
}
function get(thing, prop) {
  return getArchtype(thing) === 2 ? thing.get(prop) : thing[prop];
}
function set(thing, propOrOldValue, value) {
  const t = getArchtype(thing);
  if (t === 2) thing.set(propOrOldValue, value);
  else if (t === 3) {
    thing.add(value);
  } else thing[propOrOldValue] = value;
}
function is(x, y) {
  if (x === y) {
    return x !== 0 || 1 / x === 1 / y;
  } else {
    return x !== x && y !== y;
  }
}
function isMap(target) {
  return target instanceof Map;
}
function isSet(target) {
  return target instanceof Set;
}
function latest(state) {
  return state.copy_ || state.base_;
}
function shallowCopy(base, strict) {
  if (isMap(base)) {
    return new Map(base);
  }
  if (isSet(base)) {
    return new Set(base);
  }
  if (Array.isArray(base)) return Array.prototype.slice.call(base);
  const isPlain = isPlainObject(base);
  if (strict === true || (strict === "class_only" && !isPlain)) {
    const descriptors = Object.getOwnPropertyDescriptors(base);
    delete descriptors[DRAFT_STATE];
    let keys = Reflect.ownKeys(descriptors);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const desc = descriptors[key];
      if (desc.writable === false) {
        desc.writable = true;
        desc.configurable = true;
      }
      if (desc.get || desc.set)
        descriptors[key] = {
          configurable: true,
          writable: true,
          // could live with !!desc.set as well here...
          enumerable: desc.enumerable,
          value: base[key],
        };
    }
    return Object.create(getPrototypeOf(base), descriptors);
  } else {
    const proto = getPrototypeOf(base);
    if (proto !== null && isPlain) {
      return { ...base };
    }
    const obj = Object.create(proto);
    return Object.assign(obj, base);
  }
}
function freeze(obj, deep = false) {
  if (isFrozen(obj) || isDraft(obj) || !isDraftable(obj)) return obj;
  if (getArchtype(obj) > 1) {
    obj.set = obj.add = obj.clear = obj.delete = dontMutateFrozenCollections;
  }
  Object.freeze(obj);
  if (deep) Object.entries(obj).forEach(([key, value]) => freeze(value, true));
  return obj;
}
function dontMutateFrozenCollections() {
  die(2);
}
function isFrozen(obj) {
  return Object.isFrozen(obj);
}
var plugins = {};
function getPlugin(pluginKey) {
  const plugin = plugins[pluginKey];
  if (!plugin) {
    die(0, pluginKey);
  }
  return plugin;
}
function loadPlugin(pluginKey, implementation) {
  if (!plugins[pluginKey]) plugins[pluginKey] = implementation;
}
var currentScope;
function getCurrentScope() {
  return currentScope;
}
function createScope(parent_, immer_) {
  return {
    drafts_: [],
    parent_,
    immer_,
    // Whenever the modified draft contains a draft from another scope, we
    // need to prevent auto-freezing so the unowned draft can be finalized.
    canAutoFreeze_: true,
    unfinalizedDrafts_: 0,
  };
}
function usePatchesInScope(scope, patchListener) {
  if (patchListener) {
    getPlugin("Patches");
    scope.patches_ = [];
    scope.inversePatches_ = [];
    scope.patchListener_ = patchListener;
  }
}
function revokeScope(scope) {
  leaveScope(scope);
  scope.drafts_.forEach(revokeDraft);
  scope.drafts_ = null;
}
function leaveScope(scope) {
  if (scope === currentScope) {
    currentScope = scope.parent_;
  }
}
function enterScope(immer2) {
  return (currentScope = createScope(currentScope, immer2));
}
function revokeDraft(draft) {
  const state = draft[DRAFT_STATE];
  if (state.type_ === 0 || state.type_ === 1) state.revoke_();
  else state.revoked_ = true;
}
function processResult(result, scope) {
  scope.unfinalizedDrafts_ = scope.drafts_.length;
  const baseDraft = scope.drafts_[0];
  const isReplaced = result !== void 0 && result !== baseDraft;
  if (isReplaced) {
    if (baseDraft[DRAFT_STATE].modified_) {
      revokeScope(scope);
      die(4);
    }
    if (isDraftable(result)) {
      result = finalize(scope, result);
      if (!scope.parent_) maybeFreeze(scope, result);
    }
    if (scope.patches_) {
      getPlugin("Patches").generateReplacementPatches_(
        baseDraft[DRAFT_STATE].base_,
        result,
        scope.patches_,
        scope.inversePatches_,
      );
    }
  } else {
    result = finalize(scope, baseDraft, []);
  }
  revokeScope(scope);
  if (scope.patches_) {
    scope.patchListener_(scope.patches_, scope.inversePatches_);
  }
  return result !== NOTHING ? result : void 0;
}
function finalize(rootScope, value, path) {
  if (isFrozen(value)) return value;
  const state = value[DRAFT_STATE];
  if (!state) {
    each(value, (key, childValue) =>
      finalizeProperty(rootScope, state, value, key, childValue, path),
    );
    return value;
  }
  if (state.scope_ !== rootScope) return value;
  if (!state.modified_) {
    maybeFreeze(rootScope, state.base_, true);
    return state.base_;
  }
  if (!state.finalized_) {
    state.finalized_ = true;
    state.scope_.unfinalizedDrafts_--;
    const result = state.copy_;
    let resultEach = result;
    let isSet2 = false;
    if (state.type_ === 3) {
      resultEach = new Set(result);
      result.clear();
      isSet2 = true;
    }
    each(resultEach, (key, childValue) =>
      finalizeProperty(rootScope, state, result, key, childValue, path, isSet2),
    );
    maybeFreeze(rootScope, result, false);
    if (path && rootScope.patches_) {
      getPlugin("Patches").generatePatches_(
        state,
        path,
        rootScope.patches_,
        rootScope.inversePatches_,
      );
    }
  }
  return state.copy_;
}
function finalizeProperty(
  rootScope,
  parentState,
  targetObject,
  prop,
  childValue,
  rootPath,
  targetIsSet,
) {
  if (process.env.NODE_ENV !== "production" && childValue === targetObject)
    die(5);
  if (isDraft(childValue)) {
    const path =
      rootPath &&
      parentState &&
      parentState.type_ !== 3 && // Set objects are atomic since they have no keys.
      !has(parentState.assigned_, prop)
        ? rootPath.concat(prop)
        : void 0;
    const res = finalize(rootScope, childValue, path);
    set(targetObject, prop, res);
    if (isDraft(res)) {
      rootScope.canAutoFreeze_ = false;
    } else return;
  } else if (targetIsSet) {
    targetObject.add(childValue);
  }
  if (isDraftable(childValue) && !isFrozen(childValue)) {
    if (!rootScope.immer_.autoFreeze_ && rootScope.unfinalizedDrafts_ < 1) {
      return;
    }
    finalize(rootScope, childValue);
    if (
      (!parentState || !parentState.scope_.parent_) &&
      typeof prop !== "symbol" &&
      Object.prototype.propertyIsEnumerable.call(targetObject, prop)
    )
      maybeFreeze(rootScope, childValue);
  }
}
function maybeFreeze(scope, value, deep = false) {
  if (!scope.parent_ && scope.immer_.autoFreeze_ && scope.canAutoFreeze_) {
    freeze(value, deep);
  }
}
function createProxyProxy(base, parent) {
  const isArray2 = Array.isArray(base);
  const state = {
    type_: isArray2 ? 1 : 0,
    // Track which produce call this is associated with.
    scope_: parent ? parent.scope_ : getCurrentScope(),
    // True for both shallow and deep changes.
    modified_: false,
    // Used during finalization.
    finalized_: false,
    // Track which properties have been assigned (true) or deleted (false).
    assigned_: {},
    // The parent draft state.
    parent_: parent,
    // The base state.
    base_: base,
    // The base proxy.
    draft_: null,
    // set below
    // The base copy with any updated values.
    copy_: null,
    // Called by the `produce` function.
    revoke_: null,
    isManual_: false,
  };
  let target = state;
  let traps = objectTraps;
  if (isArray2) {
    target = [state];
    traps = arrayTraps;
  }
  const { revoke, proxy } = Proxy.revocable(target, traps);
  state.draft_ = proxy;
  state.revoke_ = revoke;
  return proxy;
}
var objectTraps = {
  get(state, prop) {
    if (prop === DRAFT_STATE) return state;
    const source = latest(state);
    if (!has(source, prop)) {
      return readPropFromProto(state, source, prop);
    }
    const value = source[prop];
    if (state.finalized_ || !isDraftable(value)) {
      return value;
    }
    if (value === peek(state.base_, prop)) {
      prepareCopy(state);
      return (state.copy_[prop] = createProxy(value, state));
    }
    return value;
  },
  has(state, prop) {
    return prop in latest(state);
  },
  ownKeys(state) {
    return Reflect.ownKeys(latest(state));
  },
  set(state, prop, value) {
    const desc = getDescriptorFromProto(latest(state), prop);
    if (desc?.set) {
      desc.set.call(state.draft_, value);
      return true;
    }
    if (!state.modified_) {
      const current2 = peek(latest(state), prop);
      const currentState = current2?.[DRAFT_STATE];
      if (currentState && currentState.base_ === value) {
        state.copy_[prop] = value;
        state.assigned_[prop] = false;
        return true;
      }
      if (is(value, current2) && (value !== void 0 || has(state.base_, prop)))
        return true;
      prepareCopy(state);
      markChanged(state);
    }
    if (
      (state.copy_[prop] === value && // special case: handle new props with value 'undefined'
        (value !== void 0 || prop in state.copy_)) || // special case: NaN
      (Number.isNaN(value) && Number.isNaN(state.copy_[prop]))
    )
      return true;
    state.copy_[prop] = value;
    state.assigned_[prop] = true;
    return true;
  },
  deleteProperty(state, prop) {
    if (peek(state.base_, prop) !== void 0 || prop in state.base_) {
      state.assigned_[prop] = false;
      prepareCopy(state);
      markChanged(state);
    } else {
      delete state.assigned_[prop];
    }
    if (state.copy_) {
      delete state.copy_[prop];
    }
    return true;
  },
  // Note: We never coerce `desc.value` into an Immer draft, because we can't make
  // the same guarantee in ES5 mode.
  getOwnPropertyDescriptor(state, prop) {
    const owner = latest(state);
    const desc = Reflect.getOwnPropertyDescriptor(owner, prop);
    if (!desc) return desc;
    return {
      writable: true,
      configurable: state.type_ !== 1 || prop !== "length",
      enumerable: desc.enumerable,
      value: owner[prop],
    };
  },
  defineProperty() {
    die(11);
  },
  getPrototypeOf(state) {
    return getPrototypeOf(state.base_);
  },
  setPrototypeOf() {
    die(12);
  },
};
var arrayTraps = {};
each(objectTraps, (key, fn2) => {
  arrayTraps[key] = function () {
    arguments[0] = arguments[0][0];
    return fn2.apply(this, arguments);
  };
});
arrayTraps.deleteProperty = function (state, prop) {
  if (process.env.NODE_ENV !== "production" && isNaN(parseInt(prop))) die(13);
  return arrayTraps.set.call(this, state, prop, void 0);
};
arrayTraps.set = function (state, prop, value) {
  if (
    process.env.NODE_ENV !== "production" &&
    prop !== "length" &&
    isNaN(parseInt(prop))
  )
    die(14);
  return objectTraps.set.call(this, state[0], prop, value, state[0]);
};
function peek(draft, prop) {
  const state = draft[DRAFT_STATE];
  const source = state ? latest(state) : draft;
  return source[prop];
}
function readPropFromProto(state, source, prop) {
  const desc = getDescriptorFromProto(source, prop);
  return desc
    ? `value` in desc
      ? desc.value
      : // This is a very special case, if the prop is a getter defined by the
        // prototype, we should invoke it with the draft as context!
        desc.get?.call(state.draft_)
    : void 0;
}
function getDescriptorFromProto(source, prop) {
  if (!(prop in source)) return void 0;
  let proto = getPrototypeOf(source);
  while (proto) {
    const desc = Object.getOwnPropertyDescriptor(proto, prop);
    if (desc) return desc;
    proto = getPrototypeOf(proto);
  }
  return void 0;
}
function markChanged(state) {
  if (!state.modified_) {
    state.modified_ = true;
    if (state.parent_) {
      markChanged(state.parent_);
    }
  }
}
function prepareCopy(state) {
  if (!state.copy_) {
    state.copy_ = shallowCopy(
      state.base_,
      state.scope_.immer_.useStrictShallowCopy_,
    );
  }
}
var Immer2 = class {
  constructor(config) {
    this.autoFreeze_ = true;
    this.useStrictShallowCopy_ = false;
    this.produce = (base, recipe, patchListener) => {
      if (typeof base === "function" && typeof recipe !== "function") {
        const defaultBase = recipe;
        recipe = base;
        const self2 = this;
        return function curriedProduce(base2 = defaultBase, ...args) {
          return self2.produce(base2, (draft) =>
            recipe.call(this, draft, ...args),
          );
        };
      }
      if (typeof recipe !== "function") die(6);
      if (patchListener !== void 0 && typeof patchListener !== "function")
        die(7);
      let result;
      if (isDraftable(base)) {
        const scope = enterScope(this);
        const proxy = createProxy(base, void 0);
        let hasError = true;
        try {
          result = recipe(proxy);
          hasError = false;
        } finally {
          if (hasError) revokeScope(scope);
          else leaveScope(scope);
        }
        usePatchesInScope(scope, patchListener);
        return processResult(result, scope);
      } else if (!base || typeof base !== "object") {
        result = recipe(base);
        if (result === void 0) result = base;
        if (result === NOTHING) result = void 0;
        if (this.autoFreeze_) freeze(result, true);
        if (patchListener) {
          const p2 = [];
          const ip = [];
          getPlugin("Patches").generateReplacementPatches_(
            base,
            result,
            p2,
            ip,
          );
          patchListener(p2, ip);
        }
        return result;
      } else die(1, base);
    };
    this.produceWithPatches = (base, recipe) => {
      if (typeof base === "function") {
        return (state, ...args) =>
          this.produceWithPatches(state, (draft) => base(draft, ...args));
      }
      let patches, inversePatches;
      const result = this.produce(base, recipe, (p2, ip) => {
        patches = p2;
        inversePatches = ip;
      });
      return [result, patches, inversePatches];
    };
    if (typeof config?.autoFreeze === "boolean")
      this.setAutoFreeze(config.autoFreeze);
    if (typeof config?.useStrictShallowCopy === "boolean")
      this.setUseStrictShallowCopy(config.useStrictShallowCopy);
  }
  createDraft(base) {
    if (!isDraftable(base)) die(8);
    if (isDraft(base)) base = current(base);
    const scope = enterScope(this);
    const proxy = createProxy(base, void 0);
    proxy[DRAFT_STATE].isManual_ = true;
    leaveScope(scope);
    return proxy;
  }
  finishDraft(draft, patchListener) {
    const state = draft && draft[DRAFT_STATE];
    if (!state || !state.isManual_) die(9);
    const { scope_: scope } = state;
    usePatchesInScope(scope, patchListener);
    return processResult(void 0, scope);
  }
  /**
   * Pass true to automatically freeze all copies created by Immer.
   *
   * By default, auto-freezing is enabled.
   */
  setAutoFreeze(value) {
    this.autoFreeze_ = value;
  }
  /**
   * Pass true to enable strict shallow copy.
   *
   * By default, immer does not copy the object descriptors such as getter, setter and non-enumrable properties.
   */
  setUseStrictShallowCopy(value) {
    this.useStrictShallowCopy_ = value;
  }
  applyPatches(base, patches) {
    let i;
    for (i = patches.length - 1; i >= 0; i--) {
      const patch = patches[i];
      if (patch.path.length === 0 && patch.op === "replace") {
        base = patch.value;
        break;
      }
    }
    if (i > -1) {
      patches = patches.slice(i + 1);
    }
    const applyPatchesImpl = getPlugin("Patches").applyPatches_;
    if (isDraft(base)) {
      return applyPatchesImpl(base, patches);
    }
    return this.produce(base, (draft) => applyPatchesImpl(draft, patches));
  }
};
function createProxy(value, parent) {
  const draft = isMap(value)
    ? getPlugin("MapSet").proxyMap_(value, parent)
    : isSet(value)
      ? getPlugin("MapSet").proxySet_(value, parent)
      : createProxyProxy(value, parent);
  const scope = parent ? parent.scope_ : getCurrentScope();
  scope.drafts_.push(draft);
  return draft;
}
function current(value) {
  if (!isDraft(value)) die(10, value);
  return currentImpl(value);
}
function currentImpl(value) {
  if (!isDraftable(value) || isFrozen(value)) return value;
  const state = value[DRAFT_STATE];
  let copy;
  if (state) {
    if (!state.modified_) return state.base_;
    state.finalized_ = true;
    copy = shallowCopy(value, state.scope_.immer_.useStrictShallowCopy_);
  } else {
    copy = shallowCopy(value, true);
  }
  each(copy, (key, childValue) => {
    set(copy, key, currentImpl(childValue));
  });
  if (state) {
    state.finalized_ = false;
  }
  return copy;
}
function enablePatches() {
  const errorOffset = 16;
  if (process.env.NODE_ENV !== "production") {
    errors.push(
      'Sets cannot have "replace" patches.',
      function (op) {
        return "Unsupported patch operation: " + op;
      },
      function (path) {
        return "Cannot apply patch, path doesn't resolve: " + path;
      },
      "Patching reserved attributes like __proto__, prototype and constructor is not allowed",
    );
  }
  const REPLACE = "replace";
  const ADD = "add";
  const REMOVE = "remove";
  function generatePatches_(state, basePath, patches, inversePatches) {
    switch (state.type_) {
      case 0:
      case 2:
        return generatePatchesFromAssigned(
          state,
          basePath,
          patches,
          inversePatches,
        );
      case 1:
        return generateArrayPatches(state, basePath, patches, inversePatches);
      case 3:
        return generateSetPatches(state, basePath, patches, inversePatches);
    }
  }
  function generateArrayPatches(state, basePath, patches, inversePatches) {
    let { base_, assigned_ } = state;
    let copy_ = state.copy_;
    if (copy_.length < base_.length) {
      [base_, copy_] = [copy_, base_];
      [patches, inversePatches] = [inversePatches, patches];
    }
    for (let i = 0; i < base_.length; i++) {
      if (assigned_[i] && copy_[i] !== base_[i]) {
        const path = basePath.concat([i]);
        patches.push({
          op: REPLACE,
          path,
          // Need to maybe clone it, as it can in fact be the original value
          // due to the base/copy inversion at the start of this function
          value: clonePatchValueIfNeeded(copy_[i]),
        });
        inversePatches.push({
          op: REPLACE,
          path,
          value: clonePatchValueIfNeeded(base_[i]),
        });
      }
    }
    for (let i = base_.length; i < copy_.length; i++) {
      const path = basePath.concat([i]);
      patches.push({
        op: ADD,
        path,
        // Need to maybe clone it, as it can in fact be the original value
        // due to the base/copy inversion at the start of this function
        value: clonePatchValueIfNeeded(copy_[i]),
      });
    }
    for (let i = copy_.length - 1; base_.length <= i; --i) {
      const path = basePath.concat([i]);
      inversePatches.push({
        op: REMOVE,
        path,
      });
    }
  }
  function generatePatchesFromAssigned(
    state,
    basePath,
    patches,
    inversePatches,
  ) {
    const { base_, copy_ } = state;
    each(state.assigned_, (key, assignedValue) => {
      const origValue = get(base_, key);
      const value = get(copy_, key);
      const op = !assignedValue ? REMOVE : has(base_, key) ? REPLACE : ADD;
      if (origValue === value && op === REPLACE) return;
      const path = basePath.concat(key);
      patches.push(op === REMOVE ? { op, path } : { op, path, value });
      inversePatches.push(
        op === ADD
          ? { op: REMOVE, path }
          : op === REMOVE
            ? { op: ADD, path, value: clonePatchValueIfNeeded(origValue) }
            : { op: REPLACE, path, value: clonePatchValueIfNeeded(origValue) },
      );
    });
  }
  function generateSetPatches(state, basePath, patches, inversePatches) {
    let { base_, copy_ } = state;
    let i = 0;
    base_.forEach((value) => {
      if (!copy_.has(value)) {
        const path = basePath.concat([i]);
        patches.push({
          op: REMOVE,
          path,
          value,
        });
        inversePatches.unshift({
          op: ADD,
          path,
          value,
        });
      }
      i++;
    });
    i = 0;
    copy_.forEach((value) => {
      if (!base_.has(value)) {
        const path = basePath.concat([i]);
        patches.push({
          op: ADD,
          path,
          value,
        });
        inversePatches.unshift({
          op: REMOVE,
          path,
          value,
        });
      }
      i++;
    });
  }
  function generateReplacementPatches_(
    baseValue,
    replacement,
    patches,
    inversePatches,
  ) {
    patches.push({
      op: REPLACE,
      path: [],
      value: replacement === NOTHING ? void 0 : replacement,
    });
    inversePatches.push({
      op: REPLACE,
      path: [],
      value: baseValue,
    });
  }
  function applyPatches_(draft, patches) {
    patches.forEach((patch) => {
      const { path, op } = patch;
      let base = draft;
      for (let i = 0; i < path.length - 1; i++) {
        const parentType = getArchtype(base);
        let p2 = path[i];
        if (typeof p2 !== "string" && typeof p2 !== "number") {
          p2 = "" + p2;
        }
        if (
          (parentType === 0 || parentType === 1) &&
          (p2 === "__proto__" || p2 === "constructor")
        )
          die(errorOffset + 3);
        if (typeof base === "function" && p2 === "prototype")
          die(errorOffset + 3);
        base = get(base, p2);
        if (typeof base !== "object") die(errorOffset + 2, path.join("/"));
      }
      const type = getArchtype(base);
      const value = deepClonePatchValue(patch.value);
      const key = path[path.length - 1];
      switch (op) {
        case REPLACE:
          switch (type) {
            case 2:
              return base.set(key, value);
            case 3:
              die(errorOffset);
            default:
              return (base[key] = value);
          }
        case ADD:
          switch (type) {
            case 1:
              return key === "-"
                ? base.push(value)
                : base.splice(key, 0, value);
            case 2:
              return base.set(key, value);
            case 3:
              return base.add(value);
            default:
              return (base[key] = value);
          }
        case REMOVE:
          switch (type) {
            case 1:
              return base.splice(key, 1);
            case 2:
              return base.delete(key);
            case 3:
              return base.delete(patch.value);
            default:
              return delete base[key];
          }
        default:
          die(errorOffset + 1, op);
      }
    });
    return draft;
  }
  function deepClonePatchValue(obj) {
    if (!isDraftable(obj)) return obj;
    if (Array.isArray(obj)) return obj.map(deepClonePatchValue);
    if (isMap(obj))
      return new Map(
        Array.from(obj.entries()).map(([k2, v]) => [
          k2,
          deepClonePatchValue(v),
        ]),
      );
    if (isSet(obj)) return new Set(Array.from(obj).map(deepClonePatchValue));
    const cloned = Object.create(getPrototypeOf(obj));
    for (const key in obj) cloned[key] = deepClonePatchValue(obj[key]);
    if (has(obj, DRAFTABLE)) cloned[DRAFTABLE] = obj[DRAFTABLE];
    return cloned;
  }
  function clonePatchValueIfNeeded(obj) {
    if (isDraft(obj)) {
      return deepClonePatchValue(obj);
    } else return obj;
  }
  loadPlugin("Patches", {
    applyPatches_,
    generatePatches_,
    generateReplacementPatches_,
  });
}
var immer = new Immer2();
immer.produce;
immer.produceWithPatches.bind(immer);
var setAutoFreeze = immer.setAutoFreeze.bind(immer);
immer.setUseStrictShallowCopy.bind(immer);
immer.applyPatches.bind(immer);
immer.createDraft.bind(immer);
immer.finishDraft.bind(immer);
enablePatches();
setAutoFreeze(false);
function matchMedia(queryString) {
  if (browser) {
    const query = window.matchMedia(queryString);
    return readable(query.matches, (set2) => {
      const listener = (e2) => set2(e2.matches);
      query.addEventListener("change", listener);
      return () => query.removeEventListener("change", listener);
    });
  } else {
    return writable(true);
  }
}
const matchMediaWidth = (width) => matchMedia(`(min-width: ${width}px)`);
const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536,
};
matchMediaWidth(breakpoints.sm);
matchMediaWidth(breakpoints.md);
matchMediaWidth(breakpoints.lg);
matchMediaWidth(breakpoints.xl);
matchMediaWidth(breakpoints.xxl);
matchMedia(`screen`);
matchMedia(`print`);
matchMedia(`(prefers-color-scheme: dark)`);
matchMedia(`(prefers-color-scheme: light)`);
matchMedia(`(prefers-reduced-motion: reduce)`);
matchMedia(`(orientation: landscape)`);
matchMedia(`(orientation: portrait)`);
var typeMap = {
  M: ["x", "y"],
  L: ["x", "y"],
  H: ["x"],
  V: ["y"],
  C: ["x1", "y1", "x2", "y2", "x", "y"],
  S: ["x2", "y2", "x", "y"],
  Q: ["x1", "y1", "x", "y"],
  T: ["x", "y"],
  A: ["rx", "ry", "xAxisRotation", "largeArcFlag", "sweepFlag", "x", "y"],
  Z: [],
};
Object.keys(typeMap).forEach(function (key) {
  typeMap[key.toLowerCase()] = typeMap[key];
});
const defaultTranslate = writable({ x: 0, y: 0 });
const defaultScale = writable(1);
({
  setScale: defaultScale.set,
  setTranslate: defaultTranslate.set,
});
function _createLinearGradient(ctx, x0, y0, x1, y1, stops) {
  const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(({ offset, color }) => {
    gradient.addColorStop(offset, color);
  });
  return gradient;
}
memoize(_createLinearGradient, (ctx, x0, y0, x1, y1, stops) => {
  const key = JSON.stringify({ x0, y0, x1, y1, stops });
  return key;
});
const MEASUREMENT_ELEMENT_ID = "__text_measurement_id";
function _getStringWidth(str, style) {
  try {
    let textEl = document.getElementById(MEASUREMENT_ELEMENT_ID);
    if (!textEl) {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.style.width = "0";
      svg.style.height = "0";
      svg.style.position = "absolute";
      svg.style.top = "-100%";
      svg.style.left = "-100%";
      textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
      textEl.setAttribute("id", MEASUREMENT_ELEMENT_ID);
      svg.appendChild(textEl);
      document.body.appendChild(svg);
    }
    Object.assign(textEl.style, style);
    textEl.textContent = str;
    return textEl.getComputedTextLength();
  } catch (e2) {
    return null;
  }
}
memoize(_getStringWidth, (str, style) => `${str}_${JSON.stringify(style)}`);
[
  {
    predicate: (duration) => duration == null,
    // Unknown
    interval: timeYear.every(1),
    // Better than rendering a lot of items
    format: (date) => date.toString(),
  },
  {
    predicate: (duration) => duration.years > 1,
    interval: timeYear.every(1),
    format: (date) =>
      formatDate(date, PeriodType.CalendarYear, { variant: "short" }),
  },
  {
    predicate: (duration) => duration.years,
    interval: timeMonth.every(1),
    format: (date) => formatDate(date, PeriodType.Month, { variant: "short" }),
  },
  {
    predicate: (duration) => duration.days > 30,
    interval: timeMonth.every(1),
    format: (date) => formatDate(date, PeriodType.Month, { variant: "short" }),
  },
  {
    predicate: (duration) => duration.days,
    interval: timeDay.every(1),
    format: (date) => formatDate(date, PeriodType.Day, { variant: "short" }),
  },
  {
    predicate: (duration) => duration.hours,
    interval: timeHour.every(1),
    format: (date) => format(date, "h:mm a"),
  },
  {
    predicate: (duration) => duration.minutes > 10,
    interval: timeMinute.every(10),
    format: (date) => format(date, "h:mm a"),
  },
  {
    predicate: (duration) => duration.minutes,
    interval: timeMinute.every(1),
    format: (date) => format(date, "h:mm a"),
  },
  {
    predicate: (duration) => duration.seconds > 10,
    interval: second.every(10),
    format: (date) => format(date, "h:mm:ss"),
  },
  {
    predicate: (duration) => duration.seconds,
    interval: second.every(1),
    format: (date) => format(date, "h:mm:ss"),
  },
  {
    predicate: (duration) => true,
    // 0 or more milliseconds
    interval: millisecond.every(100),
    format: (date) => format(date, "h:mm:ss.SSS"),
  },
];
[
  {
    predicate: (duration) => duration == null,
    // Unknown
    interval: timeYear.every(1),
    // Better than rendering a lot of items
    format: (date) => date.toString(),
  },
  {
    predicate: (duration) => duration.years,
    interval: timeMonth.every(1),
    format: (date) => formatDate(date, PeriodType.Month, { variant: "short" }),
  },
  {
    predicate: (duration) => duration.days > 90,
    interval: timeMonth.every(1),
    format: (date) => formatDate(date, PeriodType.Month, { variant: "short" }),
  },
  {
    predicate: (duration) => duration.days > 30,
    interval: timeSunday.every(1),
    format: (date) =>
      formatDate(date, PeriodType.WeekSun, { variant: "short" }),
  },
  {
    predicate: (duration) => duration.days > 7,
    interval: timeDay.every(1),
    format: (date) => formatDate(date, PeriodType.Day, { variant: "short" }),
  },
  {
    predicate: (duration) => duration.days > 3,
    interval: timeHour.every(8),
    format: (date) => format(date, "h:mm a"),
  },
  {
    predicate: (duration) => duration.days,
    interval: timeHour.every(1),
    format: (date) => format(date, "h:mm a"),
  },
  {
    predicate: (duration) => duration.hours,
    interval: timeMinute.every(15),
    format: (date) => format(date, "h:mm a"),
  },
  {
    predicate: (duration) => duration.minutes > 10,
    interval: timeMinute.every(10),
    format: (date) => format(date, "h:mm a"),
  },
  {
    predicate: (duration) => duration.minutes > 2,
    interval: timeMinute.every(1),
    format: (date) => format(date, "h:mm a"),
  },
  {
    predicate: (duration) => duration.minutes,
    interval: second.every(10),
    format: (date) => format(date, "h:mm:ss"),
  },
  {
    predicate: (duration) => duration.seconds,
    interval: second.every(1),
    format: (date) => format(date, "h:mm:ss"),
  },
  {
    predicate: (duration) => true,
    // 0 or more milliseconds
    interval: millisecond.every(10),
    format: (date) => format(date, "h:mm:ss.SSS"),
  },
];
function CircularGauge($$payload, $$props) {
  push();
  let { config, value } = $$props;
  const defaults = {
    min: 0,
    max: 100,
    unit: "%",
    colors: ["#10b981", "#f59e0b", "#ef4444"],
    thresholds: [50, 80],
    showValue: true,
    showTitle: true,
    strokeWidth: 12,
    size: 160,
  };
  let gaugeConfig = { ...defaults, ...config.config };
  let displayValue = value ?? 0;
  let percentage = Math.max(
    0,
    Math.min(
      100,
      ((displayValue - gaugeConfig.min) / (gaugeConfig.max - gaugeConfig.min)) *
        100,
    ),
  );
  let currentColor = () => {
    const thresholds = gaugeConfig.thresholds || [];
    const colors = gaugeConfig.colors || defaults.colors;
    for (let i = 0; i < thresholds.length; i++) {
      if (displayValue <= thresholds[i]) {
        return colors[i] || colors[0];
      }
    }
    return colors[colors.length - 1] || colors[0];
  };
  let size = Math.min(config.size.width, config.size.height) - 20;
  let center = size / 2;
  let radius = (size - gaugeConfig.strokeWidth) / 2;
  let circumference = 2 * Math.PI * radius;
  let arcLength = (percentage / 100) * circumference * 0.75;
  let dashArray = `${arcLength} ${circumference}`;
  $$payload.out.push(
    `<div class="gauge-container relative svelte-1d44noz"><svg${attr("width", size)}${attr("height", size)} class="transform -rotate-90"><circle${attr("cx", center)}${attr("cy", center)}${attr("r", radius)} fill="none" stroke="currentColor"${attr("stroke-width", gaugeConfig.strokeWidth)} class="text-gray-200 dark:text-gray-700"></circle><circle${attr("cx", center)}${attr("cy", center)}${attr("r", radius)} fill="none"${attr("stroke", currentColor())}${attr("stroke-width", gaugeConfig.strokeWidth)} stroke-linecap="round"${attr("stroke-dasharray", dashArray)}${attr("stroke-dashoffset", circumference * 0.125)} class="transition-all duration-1000 ease-out"></circle></svg> `,
  );
  if (gaugeConfig.showValue) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(
      `<div class="absolute inset-0 flex flex-col items-center justify-center"><div class="text-2xl font-bold text-gray-900 dark:text-white">${escape_html(displayValue.toFixed(1))}</div> <div class="text-xs text-gray-500 dark:text-gray-400">${escape_html(gaugeConfig.unit)}</div></div>`,
    );
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  if (gaugeConfig.thresholds && gaugeConfig.thresholds.length > 0) {
    $$payload.out.push("<!--[-->");
    const each_array = ensure_array_like(gaugeConfig.thresholds);
    $$payload.out.push(
      `<div class="flex items-center gap-2 mt-2 text-xs"><!--[-->`,
    );
    for (let i = 0, $$length = each_array.length; i < $$length; i++) {
      let threshold = each_array[i];
      $$payload.out.push(
        `<div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full"${attr_style(`background-color: ${stringify(gaugeConfig.colors[i] || "#gray")}`)}></div> <span class="text-gray-600 dark:text-gray-400">${escape_html(threshold)}${escape_html(gaugeConfig.unit)}</span></div>`,
      );
    }
    $$payload.out.push(`<!--]--></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div>`);
  pop();
}
function LinearGauge($$payload, $$props) {
  push();
  let { config, value } = $$props;
  const defaults = {
    min: 0,
    max: 100,
    unit: "%",
    orientation: "horizontal",
    colors: ["#10b981", "#f59e0b", "#ef4444"],
    thresholds: [50, 80],
    showValue: true,
    showTitle: true,
    height: 20,
    showLabels: true,
  };
  let gaugeConfig = { ...defaults, ...config.config };
  let displayValue = value ?? 0;
  let currentColor = () => {
    const thresholds = gaugeConfig.thresholds || [];
    const colors = gaugeConfig.colors || defaults.colors;
    for (let i = 0; i < thresholds.length; i++) {
      if (displayValue <= thresholds[i]) {
        return colors[i] || colors[0];
      }
    }
    return colors[colors.length - 1] || colors[0];
  };
  $$payload.out.push(
    `<div class="linear-gauge flex flex-col h-full p-4 svelte-2sjcr1">`,
  );
  if (gaugeConfig.showTitle) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(
      `<h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">${escape_html(config.title)}</h3>`,
    );
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(
    `<!--]--> <div class="gauge-content flex-1 flex flex-col justify-center">`,
  );
  if (gaugeConfig.orientation === "horizontal") {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="flex items-center gap-3">`);
    if (gaugeConfig.showLabels) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(
        `<span class="text-xs text-gray-500 dark:text-gray-400 min-w-8">${escape_html(gaugeConfig.min)}</span>`,
      );
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(
      `<!--]--> <div class="flex-1 relative"><div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"${attr_style(`height: ${stringify(gaugeConfig.height)}px`)}><div class="h-full rounded-full transition-all duration-1000 ease-out"${attr_style(` width: ${stringify(0)}%; background-color: ${stringify(currentColor)}; `)}></div></div> `,
    );
    if (gaugeConfig.thresholds) {
      $$payload.out.push("<!--[-->");
      const each_array = ensure_array_like(gaugeConfig.thresholds);
      $$payload.out.push(`<!--[-->`);
      for (let i = 0, $$length = each_array.length; i < $$length; i++) {
        let threshold = each_array[i];
        const thresholdPercentage =
          ((threshold - gaugeConfig.min) /
            (gaugeConfig.max - gaugeConfig.min)) *
          100;
        $$payload.out.push(
          `<div class="absolute top-0 w-0.5 bg-gray-400 dark:bg-gray-500"${attr_style(` left: ${stringify(thresholdPercentage)}%; height: ${stringify(gaugeConfig.height)}px; `)}></div>`,
        );
      }
      $$payload.out.push(`<!--]-->`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></div> `);
    if (gaugeConfig.showLabels) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(
        `<span class="text-xs text-gray-500 dark:text-gray-400 min-w-8">${escape_html(gaugeConfig.max)}</span>`,
      );
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<div class="flex flex-col items-center h-full">`);
    if (gaugeConfig.showLabels) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(
        `<span class="text-xs text-gray-500 dark:text-gray-400 mb-2">${escape_html(gaugeConfig.max)}</span>`,
      );
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(
      `<!--]--> <div class="flex-1 relative flex items-end"${attr_style(`width: ${stringify(gaugeConfig.height)}px`)}><div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden h-full"><div class="w-full rounded-full transition-all duration-1000 ease-out"${attr_style(` height: ${stringify(0)}%; background-color: ${stringify(currentColor)}; margin-top: auto; `)}></div></div> `,
    );
    if (gaugeConfig.thresholds) {
      $$payload.out.push("<!--[-->");
      const each_array_1 = ensure_array_like(gaugeConfig.thresholds);
      $$payload.out.push(`<!--[-->`);
      for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
        let threshold = each_array_1[i];
        const thresholdPercentage =
          ((threshold - gaugeConfig.min) /
            (gaugeConfig.max - gaugeConfig.min)) *
          100;
        $$payload.out.push(
          `<div class="absolute left-0 h-0.5 bg-gray-400 dark:bg-gray-500 w-full"${attr_style(`bottom: ${stringify(thresholdPercentage)}%`)}></div>`,
        );
      }
      $$payload.out.push(`<!--]-->`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></div> `);
    if (gaugeConfig.showLabels) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(
        `<span class="text-xs text-gray-500 dark:text-gray-400 mt-2">${escape_html(gaugeConfig.min)}</span>`,
      );
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></div>`);
  }
  $$payload.out.push(`<!--]--> `);
  if (gaugeConfig.showValue) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(
      `<div class="text-center mt-3"><span class="text-lg font-semibold text-gray-900 dark:text-white">${escape_html(displayValue.toFixed(1))}${escape_html(gaugeConfig.unit)}</span></div>`,
    );
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div> `);
  if (gaugeConfig.thresholds && gaugeConfig.thresholds.length > 0) {
    $$payload.out.push("<!--[-->");
    const each_array_2 = ensure_array_like(gaugeConfig.thresholds);
    $$payload.out.push(
      `<div class="flex items-center justify-center gap-3 mt-2 text-xs"><!--[-->`,
    );
    for (let i = 0, $$length = each_array_2.length; i < $$length; i++) {
      let threshold = each_array_2[i];
      $$payload.out.push(
        `<div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full"${attr_style(`background-color: ${stringify(gaugeConfig.colors[i] || "#gray")}`)}></div> <span class="text-gray-600 dark:text-gray-400">${escape_html(threshold)}${escape_html(gaugeConfig.unit)}</span></div>`,
      );
    }
    $$payload.out.push(`<!--]--></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div>`);
  pop();
}
function Speedometer($$payload, $$props) {
  push();
  let { config, value } = $$props;
  const defaults = {
    min: 0,
    max: 100,
    unit: "%",
    dangerZone: 80,
    warningZone: 60,
    colors: {
      safe: "#10b981",
      warning: "#f59e0b",
      danger: "#ef4444",
      background: "#e5e7eb",
    },
    showValue: true,
    showTitle: true,
    showZones: true,
  };
  let speedometerConfig = { ...defaults, ...config.config };
  let displayValue = value ?? 0;
  let currentZoneColor = () => {
    if (displayValue >= speedometerConfig.dangerZone)
      return speedometerConfig.colors.danger;
    if (displayValue >= speedometerConfig.warningZone)
      return speedometerConfig.colors.warning;
    return speedometerConfig.colors.safe;
  };
  let size = Math.min(config.size.width, config.size.height) - 20;
  let center = size / 2;
  let radius = size * 0.35;
  let warningAngle =
    -90 +
    ((speedometerConfig.warningZone - speedometerConfig.min) /
      (speedometerConfig.max - speedometerConfig.min)) *
      180;
  let dangerAngle =
    -90 +
    ((speedometerConfig.dangerZone - speedometerConfig.min) /
      (speedometerConfig.max - speedometerConfig.min)) *
      180;
  const each_array = ensure_array_like(Array(11));
  $$payload.out.push(
    `<div class="speedometer flex flex-col items-center justify-center h-full p-4 svelte-wwfm74">`,
  );
  if (speedometerConfig.showTitle) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(
      `<h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">${escape_html(config.title)}</h3>`,
    );
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(
    `<!--]--> <div class="speedometer-container relative svelte-wwfm74"><svg${attr("width", size)}${attr("height", size * 0.7)} class="overflow-visible"><path${attr("d", `M ${stringify(center - radius)} ${stringify(center)} A ${stringify(radius)} ${stringify(radius)} 0 0 1 ${stringify(center + radius)} ${stringify(center)}`)} fill="none"${attr("stroke", speedometerConfig.colors.background)} stroke-width="20" stroke-linecap="round"></path>`,
  );
  if (speedometerConfig.showZones) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(
      `<path${attr("d", `M ${stringify(center - radius)} ${stringify(center)} A ${stringify(radius)} ${stringify(radius)} 0 0 1 ${stringify(center + radius * Math.cos((warningAngle * Math.PI) / 180))} ${stringify(center + radius * Math.sin((warningAngle * Math.PI) / 180))}`)} fill="none"${attr("stroke", speedometerConfig.colors.safe)} stroke-width="20" stroke-linecap="round"></path><path${attr("d", `M ${stringify(center + radius * Math.cos((warningAngle * Math.PI) / 180))} ${stringify(center + radius * Math.sin((warningAngle * Math.PI) / 180))} A ${stringify(radius)} ${stringify(radius)} 0 0 1 ${stringify(center + radius * Math.cos((dangerAngle * Math.PI) / 180))} ${stringify(center + radius * Math.sin((dangerAngle * Math.PI) / 180))}`)} fill="none"${attr("stroke", speedometerConfig.colors.warning)} stroke-width="20" stroke-linecap="round"></path><path${attr("d", `M ${stringify(center + radius * Math.cos((dangerAngle * Math.PI) / 180))} ${stringify(center + radius * Math.sin((dangerAngle * Math.PI) / 180))} A ${stringify(radius)} ${stringify(radius)} 0 0 1 ${stringify(center + radius)} ${stringify(center)}`)} fill="none"${attr("stroke", speedometerConfig.colors.danger)} stroke-width="20" stroke-linecap="round"></path>`,
    );
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--><!--[-->`);
  for (let i = 0, $$length = each_array.length; i < $$length; i++) {
    each_array[i];
    const angle = -90 + i * 18;
    const angleRad = (angle * Math.PI) / 180;
    const tickLength = i % 5 === 0 ? 15 : 8;
    const x1 = center + (radius - 30) * Math.cos(angleRad);
    const y1 = center + (radius - 30) * Math.sin(angleRad);
    const x2 = center + (radius - 30 + tickLength) * Math.cos(angleRad);
    const y2 = center + (radius - 30 + tickLength) * Math.sin(angleRad);
    $$payload.out.push(
      `<line${attr("x1", x1)}${attr("y1", y1)}${attr("x2", x2)}${attr("y2", y2)} stroke="currentColor"${attr("stroke-width", i % 5 === 0 ? 2 : 1)} class="text-gray-600 dark:text-gray-400"></line>`,
    );
    if (i % 5 === 0) {
      $$payload.out.push("<!--[-->");
      const labelValue =
        speedometerConfig.min +
        (i / 10) * (speedometerConfig.max - speedometerConfig.min);
      const labelX = center + (radius - 45) * Math.cos(angleRad);
      const labelY = center + (radius - 45) * Math.sin(angleRad);
      $$payload.out.push(
        `<text${attr("x", labelX)}${attr("y", labelY)} text-anchor="middle" dominant-baseline="middle" class="text-xs fill-current text-gray-600 dark:text-gray-400">${escape_html(Math.round(labelValue))}</text>`,
      );
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(
    `<!--]--><g${attr("transform", `rotate(${stringify(-90)} ${stringify(center)} ${stringify(center)})`)}><line${attr("x1", center)}${attr("y1", center)}${attr("x2", center + radius - 40)}${attr("y2", center)}${attr("stroke", currentZoneColor())} stroke-width="3" stroke-linecap="round" class="transition-all duration-1000 ease-out"></line><circle${attr("cx", center + radius - 40)}${attr("cy", center)} r="3"${attr("fill", currentZoneColor())}></circle></g><circle${attr("cx", center)}${attr("cy", center)} r="8" fill="currentColor" class="text-gray-400 dark:text-gray-600"></circle><circle${attr("cx", center)}${attr("cy", center)} r="4"${attr("fill", currentZoneColor())}></circle></svg> `,
  );
  if (speedometerConfig.showValue) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(
      `<div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center"><div class="text-2xl font-bold text-gray-900 dark:text-white">${escape_html(displayValue.toFixed(1))}</div> <div class="text-xs text-gray-500 dark:text-gray-400">${escape_html(speedometerConfig.unit)}</div></div>`,
    );
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div> `);
  if (speedometerConfig.showZones) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(
      `<div class="flex items-center gap-3 mt-2 text-xs"><div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full"${attr_style(`background-color: ${stringify(speedometerConfig.colors.safe)}`)}></div> <span class="text-gray-600 dark:text-gray-400">Safe</span></div> <div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full"${attr_style(`background-color: ${stringify(speedometerConfig.colors.warning)}`)}></div> <span class="text-gray-600 dark:text-gray-400">Warning</span></div> <div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full"${attr_style(`background-color: ${stringify(speedometerConfig.colors.danger)}`)}></div> <span class="text-gray-600 dark:text-gray-400">Danger</span></div></div>`,
    );
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div>`);
  pop();
}
function KpiCard($$payload, $$props) {
  push();
  let { config, value } = $$props;
  const defaults = {
    unit: "",
    precision: 1,
    showTrend: true,
    showIcon: true,
    icon: "📊",
    thresholds: [],
    colors: {
      normal: "#6b7280",
      good: "#10b981",
      warning: "#f59e0b",
      critical: "#ef4444",
    },
    showChange: false,
    changeValue: 0,
    changeUnit: "%",
  };
  let kpiConfig = { ...defaults, ...config.config };
  let displayValue = value ?? 0;
  let statusColor = () => {
    if (!kpiConfig.thresholds || kpiConfig.thresholds.length === 0) {
      return kpiConfig.colors.normal;
    }
    const thresholds = kpiConfig.thresholds;
    if (displayValue >= thresholds[2]) return kpiConfig.colors.critical;
    if (displayValue >= thresholds[1]) return kpiConfig.colors.warning;
    if (displayValue >= thresholds[0]) return kpiConfig.colors.good;
    return kpiConfig.colors.normal;
  };
  function formatValue(val) {
    if (Math.abs(val) >= 1e9) {
      return (val / 1e9).toFixed(kpiConfig.precision) + "B";
    }
    if (Math.abs(val) >= 1e6) {
      return (val / 1e6).toFixed(kpiConfig.precision) + "M";
    }
    if (Math.abs(val) >= 1e3) {
      return (val / 1e3).toFixed(kpiConfig.precision) + "K";
    }
    return val.toFixed(kpiConfig.precision);
  }
  let animatedValue = 0;
  $$payload.out.push(
    `<div class="kpi-card h-full p-4 flex flex-col justify-between svelte-2vugh9"><div class="flex items-start justify-between mb-2"><div class="flex items-center gap-2">`,
  );
  if (
    // Update animated value when displayValue changes
    kpiConfig.showIcon
  ) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(
      `<span class="text-lg">${escape_html(kpiConfig.icon)}</span>`,
    );
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(
    `<!--]--> <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">${escape_html(config.title)}</h3></div> `,
  );
  if (kpiConfig.showTrend) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(
      `<div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full"${attr_style(`background-color: ${stringify(statusColor)}`)}></div></div>`,
    );
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(
    `<!--]--></div> <div class="flex-1 flex items-center justify-center"><div class="text-center"><div class="text-3xl font-bold transition-colors duration-300"${attr_style(`color: ${stringify(statusColor)}`)}>${escape_html(formatValue(animatedValue))} <span class="text-lg font-normal text-gray-500 dark:text-gray-400">${escape_html(kpiConfig.unit)}</span></div></div></div> `,
  );
  if (kpiConfig.showChange) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(
      `<div class="flex items-center justify-center mt-2"><div class="flex items-center gap-1 text-sm">`,
    );
    if (kpiConfig.changeValue > 0) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(
        `<svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd"></path></svg> <span class="text-green-600 dark:text-green-400">+${escape_html(kpiConfig.changeValue.toFixed(1))}${escape_html(kpiConfig.changeUnit)}</span>`,
      );
    } else {
      $$payload.out.push("<!--[!-->");
      if (kpiConfig.changeValue < 0) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(
          `<svg class="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg> <span class="text-red-600 dark:text-red-400">${escape_html(kpiConfig.changeValue.toFixed(1))}${escape_html(kpiConfig.changeUnit)}</span>`,
        );
      } else {
        $$payload.out.push("<!--[!-->");
        $$payload.out.push(
          `<svg class="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path></svg> <span class="text-gray-600 dark:text-gray-400">0${escape_html(kpiConfig.changeUnit)}</span>`,
        );
      }
      $$payload.out.push(`<!--]-->`);
    }
    $$payload.out.push(`<!--]--></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  if (kpiConfig.thresholds && kpiConfig.thresholds.length > 0) {
    $$payload.out.push("<!--[-->");
    const each_array = ensure_array_like(kpiConfig.thresholds);
    $$payload.out.push(
      `<div class="mt-2 flex justify-center"><div class="flex items-center gap-1"><!--[-->`,
    );
    for (let i = 0, $$length = each_array.length; i < $$length; i++) {
      let threshold = each_array[i];
      $$payload.out.push(
        `<div${attr_class("w-1 h-1 rounded-full opacity-50", void 0, { "opacity-100": displayValue >= threshold })}${attr_style(`background-color: ${stringify(i === 0 ? kpiConfig.colors.good : i === 1 ? kpiConfig.colors.warning : kpiConfig.colors.critical)}`)}></div>`,
      );
    }
    $$payload.out.push(`<!--]--></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div>`);
  pop();
}
function SimpleWidget($$payload, $$props) {
  push();
  let { config, value } = $$props;
  let sensorValue = () => {
    if (value !== void 0) return value;
    const dataPath = config.dataSource || config.sensorPath;
    return dataPath ? sensorStore.getSensorValue(dataPath) : null;
  };
  let valueColor = () => {
    const val = sensorValue();
    const colors = config.config?.colors ||
      config.appearance?.colors || ["#22c55e", "#f59e0b", "#ef4444"];
    const thresholds = config.thresholds ||
      config.appearance?.thresholds || [70, 90];
    if (val === null || val === void 0) return colors[0];
    if (thresholds.length >= 2) {
      if (val >= thresholds[1]) return colors[2] || "#ef4444";
      if (val >= thresholds[0]) return colors[1] || "#f59e0b";
    }
    return colors[0] || "#22c55e";
  };
  let animatedValue = 0;
  let formattedAnimatedValue = () => {
    return animatedValue.toFixed(1);
  };
  let borderRadius = () => {
    return (
      config.appearance?.borders?.radius || config.styling?.borderRadius || 8
    );
  };
  let fontSize = () => {
    return (
      config.appearance?.typography?.fontSize || config.styling?.fontSize || 16
    );
  };
  let fontWeight = () => {
    return (
      config.appearance?.typography?.fontWeight ||
      config.styling?.fontWeight ||
      "bold"
    );
  };
  $$payload.out.push(
    `<div class="simple-widget relative h-full w-full overflow-hidden group svelte-1jm7o5g"${attr_style(`border-radius: ${stringify(borderRadius)}px;`)}><div class="absolute inset-0 bg-gradient-to-br from-gray-900/60 via-gray-800/40 to-gray-900/60 backdrop-blur-sm svelte-1jm7o5g"></div> <div class="absolute inset-0 opacity-20 transition-opacity duration-1000 svelte-1jm7o5g"${attr_style(`background: radial-gradient(circle at center, ${stringify(valueColor)} 0%, transparent 70%);`)}></div> <div class="absolute inset-0 rounded-lg opacity-60 svelte-1jm7o5g"${attr_style(`border: 1px solid ${stringify(valueColor)}; box-shadow: 0 0 10px ${stringify(valueColor)}40;`)}></div> <div class="relative z-10 h-full flex flex-col items-center justify-center p-4 text-center svelte-1jm7o5g"><div class="text-xs font-medium text-gray-300 mb-1 uppercase tracking-wider font-orbitron svelte-1jm7o5g">${escape_html(config.title)}</div> <div class="text-2xl font-bold transition-all duration-300 font-orbitron svelte-1jm7o5g"${attr_style(`color: ${stringify(valueColor)}; font-size: ${stringify(fontSize)}px; font-weight: ${stringify(fontWeight)};`)}>${escape_html(formattedAnimatedValue)}</div> `,
  );
  if (config.config?.unit || config.unit) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(
      `<div class="text-xs text-gray-400 mt-1 font-mono svelte-1jm7o5g">${escape_html(config.config?.unit || config.unit)}</div>`,
    );
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(
    `<!--]--></div> <div class="absolute inset-0 overflow-hidden rounded-lg svelte-1jm7o5g"><div class="absolute w-full h-px opacity-30 animate-scan svelte-1jm7o5g"${attr_style(`background: linear-gradient(90deg, transparent 0%, ${stringify(valueColor)} 50%, transparent 100%);`)}></div></div> <div class="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 rounded-tl-lg opacity-60 svelte-1jm7o5g"${attr_style(`border-color: ${stringify(valueColor)};`)}></div> <div class="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 rounded-tr-lg opacity-60 svelte-1jm7o5g"${attr_style(`border-color: ${stringify(valueColor)};`)}></div> <div class="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 rounded-bl-lg opacity-60 svelte-1jm7o5g"${attr_style(`border-color: ${stringify(valueColor)};`)}></div> <div class="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 rounded-br-lg opacity-60 svelte-1jm7o5g"${attr_style(`border-color: ${stringify(valueColor)};`)}></div></div>`,
  );
  pop();
}
function ArcMeter($$payload, $$props) {
  push();
  let {
    label = "Sensor",
    config = {
      min: 0,
      max: 100,
      warningThreshold: 70,
      criticalThreshold: 90,
      unit: "%",
    },
    size = 200,
    theme = "dark",
    animated = true,
    showValue = true,
    showLabel = true,
    glowEffect = true,
  } = $$props;
  let displayValue = 0;
  let normalizedValue = () => {
    const clamped = Math.max(config.min, Math.min(config.max, displayValue));
    return (clamped - config.min) / (config.max - config.min);
  };
  let gaugeColors = () => {
    const normalized = normalizedValue();
    const warningNorm =
      (config.warningThreshold - config.min) / (config.max - config.min);
    const criticalNorm =
      (config.criticalThreshold - config.min) / (config.max - config.min);
    if (normalized >= criticalNorm) {
      return theme === "rgb" ? "#ff0066" : "#ff4444";
    } else if (normalized >= warningNorm) {
      return theme === "rgb" ? "#ffaa00" : "#ffa500";
    } else {
      switch (theme) {
        case "gaming":
          return "#00ff88";
        case "rgb":
          return "#00ff66";
        case "dark":
          return "#00ffff";
        default:
          return "#0066cc";
      }
    }
  };
  let backgroundColors = () => {
    switch (theme) {
      case "gaming":
        return "#001d3d20";
      case "rgb":
        return "#16172240";
      case "dark":
        return "#1a1a1a40";
      default:
        return "#f8f9fa40";
    }
  };
  let tickMarks = () => {
    const marks = [];
    const tickCount = 5;
    const startAngle = -225;
    const endAngle = 45;
    const totalAngle = endAngle - startAngle;
    for (let i = 0; i <= tickCount; i++) {
      const progress = i / tickCount;
      const angle = startAngle + totalAngle * progress;
      const tickValue = config.min + (config.max - config.min) * progress;
      marks.push({
        angle: (angle * Math.PI) / 180,
        value: Math.round(tickValue),
        isMain: i % 2 === 0,
      });
    }
    return marks;
  };
  let glowFilter = () => {
    if (!glowEffect) return "";
    const color = gaugeColors();
    return `drop-shadow(0 0 10px ${color}40) drop-shadow(0 0 20px ${color}20)`;
  };
  const each_array = ensure_array_like(tickMarks());
  $$payload.out.push(
    `<div${attr_class("relative flex items-center justify-center svelte-dhtrwf", void 0, { "glow-effect": glowEffect })}${attr_style(`width: ${size}px; height: ${size}px;`)}${attr("data-theme", theme)}><svg${attr("width", size)}${attr("height", size)}${attr("viewBox", `0 0 ${size} ${size}`)} class="w-full h-full svelte-dhtrwf"${attr_style(`filter: ${glowFilter()}`)}><path${attr("d", `M ${size / 4} ${size * 0.75} A ${size * 0.3} ${size * 0.3} 0 1 1 ${size * 0.75} ${size * 0.75}`)} fill="none"${attr("stroke", backgroundColors())}${attr("stroke-width", size * 0.08)} stroke-linecap="round" class="background-arc svelte-dhtrwf"></path><path${attr("d", `M ${size / 4} ${size * 0.75} A ${size * 0.3} ${size * 0.3} 0 ${normalizedValue() > 0.5 ? 1 : 0} 1 ${size * 0.75} ${size * 0.75}`)} fill="none"${attr("stroke", gaugeColors())}${attr("stroke-width", size * 0.08)} stroke-linecap="round"${attr("stroke-dasharray", `${normalizedValue() * 100} 100`)} class="value-arc svelte-dhtrwf"></path><!--[-->`,
  );
  for (
    let $$index = 0, $$length = each_array.length;
    $$index < $$length;
    $$index++
  ) {
    let tick = each_array[$$index];
    $$payload.out.push(
      `<g${attr("transform", `translate(${size / 2}, ${size / 2}) rotate(${(tick.angle * 180) / Math.PI})`)} class="svelte-dhtrwf"><line${attr("x1", size * 0.35)} y1="0"${attr("x2", size * (tick.isMain ? 0.42 : 0.39))} y2="0"${attr("stroke", theme === "dark" ? "#666" : "#999")}${attr("stroke-width", tick.isMain ? 2 : 1)} stroke-linecap="round" class="svelte-dhtrwf"></line>`,
    );
    if (tick.isMain) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(
        `<text${attr("x", size * 0.45)} y="0" text-anchor="middle" dominant-baseline="middle"${attr("fill", theme === "dark" ? "#ccc" : "#666")}${attr("font-size", size * 0.08)} font-family="monospace" class="svelte-dhtrwf">${escape_html(tick.value)}</text>`,
      );
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></g>`);
  }
  $$payload.out.push(`<!--]-->`);
  if (showValue) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(
      `<text${attr("x", size / 2)}${attr("y", size / 2 - 10)} text-anchor="middle" dominant-baseline="middle"${attr("fill", gaugeColors())}${attr("font-size", size * 0.15)} font-weight="bold" font-family="monospace" class="value-text svelte-dhtrwf">${escape_html(Math.round(displayValue))}</text><text${attr("x", size / 2)}${attr("y", size / 2 + 15)} text-anchor="middle" dominant-baseline="middle"${attr("fill", theme === "dark" ? "#999" : "#666")}${attr("font-size", size * 0.08)} font-family="monospace" class="unit-text svelte-dhtrwf">${escape_html(config.unit)}</text>`,
    );
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  if (showLabel) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(
      `<text${attr("x", size / 2)}${attr("y", size * 0.85)} text-anchor="middle" dominant-baseline="middle"${attr("fill", theme === "dark" ? "#ccc" : "#666")}${attr("font-size", size * 0.1)} font-weight="500" class="label-text svelte-dhtrwf">${escape_html(label)}</text>`,
    );
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></svg> `);
  if (theme === "gaming" || theme === "rgb") {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(
      `<div class="corner-brackets svelte-dhtrwf"><div class="bracket top-left svelte-dhtrwf"></div> <div class="bracket top-right svelte-dhtrwf"></div> <div class="bracket bottom-left svelte-dhtrwf"></div> <div class="bracket bottom-right svelte-dhtrwf"></div></div>`,
    );
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  if (normalizedValue() > 0.8 && animated) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(
      `<div class="pulse-overlay svelte-dhtrwf"${attr_style(`background: radial-gradient(circle, ${gaugeColors()}20 0%, transparent 70%);`)}></div>`,
    );
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div>`);
  pop();
}
function WidgetRenderer($$payload, $$props) {
  push();
  let { widget: config, data, isPreview = false } = $$props;
  function getSensorValue(data2, path) {
    if (!data2 || !path) return null;
    try {
      const keys = path.split(".");
      let current2 = data2;
      for (const key of keys) {
        if (current2 && typeof current2 === "object" && key in current2) {
          current2 = current2[key];
        } else {
          return null;
        }
      }
      return typeof current2 === "number" ? current2 : null;
    } catch (error) {
      console.warn("Failed to extract sensor value:", error);
      return null;
    }
  }
  let sensorValue = getSensorValue(data, config.dataSource || "");
  $$payload.out.push(
    `<div class="widget-container w-full h-full svelte-16kr09y">`,
  );
  if (config.type === "circular-gauge") {
    $$payload.out.push("<!--[-->");
    CircularGauge($$payload, { config, value: sensorValue });
  } else {
    $$payload.out.push("<!--[!-->");
    if (config.type === "linear-gauge") {
      $$payload.out.push("<!--[-->");
      LinearGauge($$payload, { config, value: sensorValue });
    } else {
      $$payload.out.push("<!--[!-->");
      if (config.type === "gauge") {
        $$payload.out.push("<!--[-->");
        CircularGauge($$payload, { config, value: sensorValue });
      } else {
        $$payload.out.push("<!--[!-->");
        if (config.type === "meter") {
          $$payload.out.push("<!--[-->");
          LinearGauge($$payload, { config, value: sensorValue });
        } else {
          $$payload.out.push("<!--[!-->");
          if (config.type === "speedometer") {
            $$payload.out.push("<!--[-->");
            Speedometer($$payload, { config, value: sensorValue });
          } else {
            $$payload.out.push("<!--[!-->");
            if (config.type === "kpi-card") {
              $$payload.out.push("<!--[-->");
              KpiCard($$payload, { config, value: sensorValue });
            } else {
              $$payload.out.push("<!--[!-->");
              if (config.type === "simple") {
                $$payload.out.push("<!--[-->");
                SimpleWidget($$payload, { config, value: sensorValue });
              } else {
                $$payload.out.push("<!--[!-->");
                if (config.type === "arc-meter") {
                  $$payload.out.push("<!--[-->");
                  ArcMeter($$payload, { config });
                } else {
                  $$payload.out.push("<!--[!-->");
                  if (config.type === "cosmic-sensor") {
                    $$payload.out.push("<!--[-->");
                    CosmicSensorGauge($$payload, {
                      config,
                      value: sensorValue,
                    });
                  } else {
                    $$payload.out.push("<!--[!-->");
                    $$payload.out.push(
                      `<div class="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600"><div class="text-center text-gray-500 dark:text-gray-400"><div class="text-2xl mb-2">⚠️</div> <div class="font-medium">Unknown Widget Type</div> <div class="text-sm">${escape_html(config.type)}</div></div></div>`,
                    );
                  }
                  $$payload.out.push(`<!--]-->`);
                }
                $$payload.out.push(`<!--]-->`);
              }
              $$payload.out.push(`<!--]-->`);
            }
            $$payload.out.push(`<!--]-->`);
          }
          $$payload.out.push(`<!--]-->`);
        }
        $$payload.out.push(`<!--]-->`);
      }
      $$payload.out.push(`<!--]-->`);
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--></div>`);
  pop();
}
function DraggableWidget($$payload, $$props) {
  push();
  var $$store_subs;
  let { widget } = $$props;
  let isSelected = store_get(
    ($$store_subs ??= {}),
    "$dashboardState",
    dashboardState,
  ).selectedWidgets.includes(widget.id);
  let isEditMode = true;
  $$payload.out.push(
    `<div${attr_class("draggable-widget absolute svelte-150bztk", void 0, { selected: isSelected, "edit-mode": isEditMode })}${attr_style(` left: ${stringify(widget.position.x)}px; top: ${stringify(widget.position.y)}px; width: ${stringify(widget.size.width)}px; height: ${stringify(widget.size.height)}px; z-index: ${stringify(isSelected ? 10 : 1)}; `)} role="button" tabindex="0"><div class="widget-content h-full w-full">`,
  );
  WidgetRenderer($$payload, { widget, data: null });
  $$payload.out.push(`<!----></div> `);
  if (isSelected && isEditMode) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(
      `<div class="selection-outline absolute inset-0 pointer-events-none svelte-150bztk"><div class="selection-border svelte-150bztk"></div> <div class="resize-handles svelte-150bztk"><div class="resize-handle nw svelte-150bztk"></div> <div class="resize-handle ne svelte-150bztk"></div> <div class="resize-handle sw svelte-150bztk"></div> <div class="resize-handle se svelte-150bztk"></div></div></div>`,
    );
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  if (isSelected && isEditMode) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(
      `<div class="widget-actions absolute -top-8 left-0 flex gap-1 bg-surface-100-800-token rounded px-2 py-1 text-xs svelte-150bztk"><button class="p-1 hover:bg-surface-200-700-token rounded" title="Configure widget">⚙️</button> <button class="p-1 hover:bg-surface-200-700-token rounded text-error-500" title="Delete widget">🗑️</button></div>`,
    );
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function GridOverlay($$payload, $$props) {
  let { gridSize, zoom } = $$props;
  let adjustedGridSize = gridSize * zoom;
  $$payload.out.push(
    `<div class="grid-overlay absolute inset-0 pointer-events-none opacity-20 svelte-1gs4wbk"${attr_style(` background-image: linear-gradient(to right, #cbd5e1 1px, transparent 1px), linear-gradient(to bottom, #cbd5e1 1px, transparent 1px); background-size: ${stringify(adjustedGridSize)}px ${stringify(adjustedGridSize)}px; `)}></div>`,
  );
}
class MockDataService {
  static instance;
  baseData = null;
  updateInterval = null;
  subscribers = [];
  static getInstance() {
    if (!MockDataService.instance) {
      MockDataService.instance = new MockDataService();
    }
    return MockDataService.instance;
  }
  constructor() {
    this.generateBaseData();
  }
  generateBaseData() {
    const cpuUsage = Math.random() * 80 + 10;
    const gpuUsage = Math.random() * 70 + 20;
    const memoryUsage = Math.random() * 60 + 30;
    this.baseData = {
      cpu: {
        usage: cpuUsage,
        temperature: 35 + cpuUsage * 0.8 + Math.random() * 15,
        frequency: 3.8 + Math.random() * 0.4,
        voltage: 1.2 + Math.random() * 0.3,
        cores: Array.from({ length: 12 }, (_, i) => ({
          core: i,
          usage: Math.max(
            0,
            Math.min(100, cpuUsage + (Math.random() - 0.5) * 30),
          ),
          temperature: 35 + cpuUsage * 0.8 + Math.random() * 15,
        })),
      },
      gpu: {
        usage: gpuUsage,
        temperature: 50 + gpuUsage * 0.4 + Math.random() * 8,
        memory: Math.max(0, Math.min(100, gpuUsage * 0.8 + Math.random() * 20)),
        fanSpeed: Math.max(
          30,
          Math.min(100, gpuUsage * 0.7 + Math.random() * 20),
        ),
        voltage: 1 + Math.random() * 0.2,
        powerUsage: Math.max(
          50,
          Math.min(320, gpuUsage * 2.5 + Math.random() * 30),
        ),
      },
      memory: {
        usage: memoryUsage,
        available: Math.max(0, (32768 * (100 - memoryUsage)) / 100),
        total: 32768,
        cached: Math.max(0, 32768 * 0.15 + Math.random() * 1e3),
        swapUsage: Math.max(
          0,
          Math.min(50, memoryUsage * 0.3 + Math.random() * 10),
        ),
      },
      storage: {
        usage: Math.random() * 60 + 20,
        temperature: 35 + Math.random() * 15,
        readSpeed: 400 + Math.random() * 100,
        writeSpeed: 300 + Math.random() * 150,
        devices: [
          {
            device: "NVMe SSD",
            usage: Math.random() * 60 + 20,
            readSpeed: 400 + Math.random() * 100,
            writeSpeed: 300 + Math.random() * 150,
            temperature: 35 + Math.random() * 15,
          },
        ],
      },
      network: {
        upload: Math.random() * 50 + 5,
        download: Math.random() * 100 + 10,
        latency: Math.random() * 20 + 5,
        packetLoss: Math.random() * 2,
      },
      sensors: {
        case_temp: 25 + Math.random() * 15,
        ambient_temp: 22 + Math.random() * 5,
        humidity: 40 + Math.random() * 20,
        pressure: 1013 + (Math.random() - 0.5) * 20,
      },
    };
  }
  // Generate realistic hardware data with subtle variations
  generateRealisticData() {
    if (!this.baseData) {
      this.generateBaseData();
    }
    const data = { ...this.baseData };
    const variation = () => 0.95 + Math.random() * 0.1;
    data.cpu.usage = Math.max(0, Math.min(100, data.cpu.usage * variation()));
    data.gpu.usage = Math.max(0, Math.min(100, data.gpu.usage * variation()));
    data.memory.usage = Math.max(
      0,
      Math.min(100, data.memory.usage * variation()),
    );
    data.cpu.temperature = 35 + data.cpu.usage * 0.8 + Math.random() * 5;
    data.gpu.temperature = 50 + data.gpu.usage * 0.4 + Math.random() * 5;
    data.memory.available = Math.max(
      0,
      (data.memory.total * (100 - data.memory.usage)) / 100,
    );
    return data;
  }
  // Get current hardware data
  getCurrentData() {
    return this.generateRealisticData();
  }
  // Subscribe to data updates
  subscribe(callback) {
    this.subscribers.push(callback);
    if (this.subscribers.length === 1) {
      this.startAutoUpdate();
    }
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
      if (this.subscribers.length === 0) {
        this.stopAutoUpdate();
      }
    };
  }
  // Start automatic data updates
  startAutoUpdate() {
    if (this.updateInterval !== null) return;
    this.updateInterval = window.setInterval(() => {
      const data = this.generateRealisticData();
      this.subscribers.forEach((callback) => callback(data));
    }, 1e3);
  }
  // Stop automatic data updates
  stopAutoUpdate() {
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
  // Generate historical data for charts
  generateHistoricalData(hours = 24) {
    const history = [];
    const baseTime = Date.now() - hours * 60 * 60 * 1e3;
    for (let i = 0; i < hours * 60; i++) {
      const baseData = this.generateRealisticData();
      const timestamp = baseTime + i * 60 * 1e3;
      history.push({
        ...baseData,
        timestamp,
      });
    }
    return history;
  }
  // Simulate stress test data
  generateStressTestData() {
    const baseData = this.generateRealisticData();
    baseData.cpu.usage = 85 + Math.random() * 15;
    baseData.gpu.usage = 90 + Math.random() * 10;
    baseData.memory.usage = 80 + Math.random() * 15;
    baseData.cpu.temperature = 75 + Math.random() * 15;
    baseData.gpu.temperature = 80 + Math.random() * 10;
    return baseData;
  }
  // Clean up resources
  destroy() {
    this.stopAutoUpdate();
    this.subscribers = [];
  }
}
function WidgetBuilder($$payload, $$props) {
  push();
  var $$store_subs;
  const mockDataService = MockDataService.getInstance();
  let widgetConfig = {
    title: "",
    size: { width: 200, height: 200 },
    config: {
      min: 0,
      max: 100,
      unit: "%",
      colors: ["#22c55e", "#f59e0b", "#ef4444"],
      thresholds: [70, 90],
    },
    dataSource: "",
    thresholds: [],
    styling: {
      backgroundColor: "#ffffff",
      borderColor: "#e5e7eb",
      borderWidth: 1,
      borderRadius: 8,
    },
  };
  let previewWidget = () => {
    const selectedTemplateId = store_get(
      ($$store_subs ??= {}),
      "$dashboardState",
      dashboardState,
    ).widgetBuilder.selectedWidget;
    if (!selectedTemplateId) return null;
    const selectedTemplate = widgetTemplates.find(
      (t) => t.id === selectedTemplateId,
    );
    if (!selectedTemplate) return null;
    return {
      id: "preview",
      type: selectedTemplate.type,
      title: selectedTemplate.name,
      position: { x: 0, y: 0 },
      size: widgetConfig.size ||
        selectedTemplate.config?.size || { width: 200, height: 200 },
      config: {
        ...selectedTemplate.config?.config,
        ...(widgetConfig.config || {}),
      },
      dataSource: selectedTemplate.config?.dataSource || "",
      thresholds:
        widgetConfig.thresholds || selectedTemplate.config?.thresholds || [],
      styling: {
        ...selectedTemplate.config?.styling,
        ...(widgetConfig.styling || {}),
      },
    };
  };
  let mockData = () => mockDataService.getCurrentData();
  const widgetCategories = {
    system: ["circular-gauge-cpu", "gauge-gpu", "meter-memory", "simple-temp"],
    performance: ["speedometer-perf", "kpi-card-overview"],
  };
  const colorPresets = [
    { name: "Default", colors: ["#22c55e", "#f59e0b", "#ef4444"] },
    { name: "Blue", colors: ["#3b82f6", "#8b5cf6", "#ef4444"] },
    { name: "Purple", colors: ["#8b5cf6", "#ec4899", "#ef4444"] },
    { name: "Cyan", colors: ["#06b6d4", "#3b82f6", "#ef4444"] },
    { name: "Orange", colors: ["#f97316", "#eab308", "#ef4444"] },
  ];
  if (
    store_get(($$store_subs ??= {}), "$dashboardState", dashboardState)
      .widgetBuilder.isOpen
  ) {
    $$payload.out.push("<!--[-->");
    const each_array = ensure_array_like(Object.entries(widgetCategories));
    $$payload.out.push(
      `<div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex overflow-hidden"><div class="flex-none"><div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700"><h2 class="text-2xl font-bold text-gray-900 dark:text-white">Widget Builder</h2> <button class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" aria-label="Close widget builder"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg></button></div></div> <div class="flex flex-1 overflow-hidden"><div class="w-80 border-r border-gray-200 dark:border-gray-700 overflow-y-auto"><div class="p-6"><h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Choose Widget Type</h3> <!--[-->`,
    );
    for (
      let $$index_1 = 0, $$length = each_array.length;
      $$index_1 < $$length;
      $$index_1++
    ) {
      let [category, categoryName] = each_array[$$index_1];
      const categoryTemplates = widgetTemplates.filter(
        (t) => t.category === category,
      );
      if (categoryTemplates.length > 0) {
        $$payload.out.push("<!--[-->");
        const each_array_1 = ensure_array_like(categoryTemplates);
        $$payload.out.push(
          `<div class="mb-6"><h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">${escape_html(categoryName)}</h4> <div class="space-y-2"><!--[-->`,
        );
        for (
          let $$index = 0, $$length2 = each_array_1.length;
          $$index < $$length2;
          $$index++
        ) {
          let template = each_array_1[$$index];
          $$payload.out.push(
            `<button${attr_class(`w-full p-4 text-left border rounded-lg transition-all hover:border-blue-500 dark:hover:border-blue-400 ${stringify(store_get(($$store_subs ??= {}), "$dashboardState", dashboardState).widgetBuilder.selectedWidget === template.id ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50")}`)}><div class="flex items-center gap-3"><div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">${escape_html(template.type.charAt(0).toUpperCase())}</div> <div><div class="font-medium text-gray-900 dark:text-white">${escape_html(template.name)}</div> <div class="text-sm text-gray-500 dark:text-gray-400">${escape_html(template.description)}</div></div></div></button>`,
          );
        }
        $$payload.out.push(`<!--]--></div></div>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]-->`);
    }
    $$payload.out.push(
      `<!--]--></div></div> <div class="flex-1 overflow-y-auto"><div class="p-6">`,
    );
    if (
      store_get(($$store_subs ??= {}), "$dashboardState", dashboardState)
        .widgetBuilder.selectedWidget
    ) {
      $$payload.out.push("<!--[-->");
      const each_array_2 = ensure_array_like(dataSources);
      const each_array_3 = ensure_array_like(colorPresets);
      $$payload.out.push(
        `<div class="space-y-6"><div><h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">General Settings</h3> <div class="grid grid-cols-1 gap-4"><div><label for="widget-title" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label> <input id="widget-title" type="text"${attr("value", widgetConfig.title)} placeholder="Widget title" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"/></div> <div class="grid grid-cols-2 gap-4"><div><label for="widget-width" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Width</label> <input id="widget-width" type="number" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"${attr("value", widgetConfig.size.width)} min="100" step="10"/></div> <div><label for="widget-height" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Height</label> <input id="widget-height" type="number" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"${attr("value", widgetConfig.size.height)} min="80" step="10"/></div></div></div></div> <div><label for="data-source" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Data Source</label> <select id="data-source" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">`,
      );
      $$payload.select_value = widgetConfig.dataSource;
      $$payload.out.push(
        `<option value=""${maybe_selected($$payload, "")}>Select data source</option><!--[-->`,
      );
      for (
        let $$index_2 = 0, $$length = each_array_2.length;
        $$index_2 < $$length;
        $$index_2++
      ) {
        let source = each_array_2[$$index_2];
        $$payload.out.push(
          `<option${attr("value", source.value)}${maybe_selected($$payload, source.value)}>${escape_html(source.label)}</option>`,
        );
      }
      $$payload.out.push(`<!--]-->`);
      $$payload.select_value = void 0;
      $$payload.out.push(
        `</select></div> <div><h4 class="text-md font-medium text-gray-900 dark:text-white mb-3">Thresholds</h4> <div class="grid grid-cols-2 gap-4"><div><label for="min-value" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Min Value</label> <input id="min-value" type="number" placeholder="0" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"/></div> <div><label for="max-value" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max Value</label> <input id="max-value" type="number" placeholder="100" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"/></div></div> <div><label for="unit" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Unit</label> <input id="unit" type="text"${attr("value", widgetConfig.config.unit)} placeholder="%, °C, MB/s, etc." class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"/></div></div> <div><h4 class="text-md font-medium text-gray-900 dark:text-white mb-3">Styling</h4> <div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color Preset</label> <div class="grid grid-cols-1 gap-2"><!--[-->`,
      );
      for (
        let $$index_4 = 0, $$length = each_array_3.length;
        $$index_4 < $$length;
        $$index_4++
      ) {
        let preset = each_array_3[$$index_4];
        const each_array_4 = ensure_array_like(preset.colors);
        $$payload.out.push(
          `<button class="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"><div class="flex gap-1"><!--[-->`,
        );
        for (
          let $$index_3 = 0, $$length2 = each_array_4.length;
          $$index_3 < $$length2;
          $$index_3++
        ) {
          let color = each_array_4[$$index_3];
          $$payload.out.push(
            `<div class="w-4 h-4 rounded-full"${attr_style(`background-color: ${stringify(color)}`)}></div>`,
          );
        }
        $$payload.out.push(
          `<!--]--></div> <span class="text-gray-900 dark:text-white">${escape_html(preset.name)}</span></button>`,
        );
      }
      $$payload.out.push(
        `<!--]--></div></div> <div><label for="bg-color" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Background Color</label> <input id="bg-color" type="color"${attr("value", widgetConfig.styling.backgroundColor)} class="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg"/></div> <div class="grid grid-cols-2 gap-4"><div><label for="border-color" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Border Color</label> <input id="border-color" type="color"${attr("value", widgetConfig.styling.borderColor)} class="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg"/></div> <div><label for="border-width" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Border Width</label> <input id="border-width" type="number"${attr("value", widgetConfig.styling.borderWidth)} min="0" max="10" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"/></div></div> <div><label for="border-radius" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Border Radius</label> <input id="border-radius" type="number"${attr("value", widgetConfig.styling.borderRadius)} min="0" max="50" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"/></div></div></div>`,
      );
    } else {
      $$payload.out.push("<!--[!-->");
      $$payload.out.push(
        `<div class="flex items-center justify-center h-full text-gray-500 dark:text-gray-400"><p class="text-lg">Select a widget template to begin configuration</p></div>`,
      );
    }
    $$payload.out.push(
      `<!--]--></div></div> <div class="w-80 border-l border-gray-200 dark:border-gray-700 overflow-y-auto"><div class="p-6"><h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preview</h3> `,
    );
    if (previewWidget) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(
        `<div class="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/30">`,
      );
      WidgetRenderer($$payload, {
        widget: previewWidget(),
        data: mockData(),
        isPreview: true,
      });
      $$payload.out.push(
        `<!----></div> <div class="mt-6 flex gap-3"><button class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">Add Widget</button> <button class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">Cancel</button></div>`,
      );
    } else {
      $$payload.out.push("<!--[!-->");
      $$payload.out.push(
        `<div class="flex items-center justify-center h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg"><p class="text-gray-500 dark:text-gray-400">No preview available</p></div>`,
      );
    }
    $$payload.out.push(`<!--]--></div></div></div></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function DashboardCanvas($$payload, $$props) {
  push();
  var $$store_subs;
  const demoSensors = [
    {
      label: "CPU Usage",
      value: 65,
      unit: "%",
      icon: "🔥",
      critical: 90,
      warning: 70,
    },
    {
      label: "GPU Usage",
      value: 82,
      unit: "%",
      icon: "⚡",
      critical: 95,
      warning: 80,
    },
    {
      label: "Memory",
      value: 74,
      unit: "%",
      icon: "💾",
      critical: 90,
      warning: 75,
    },
    {
      label: "CPU Temp",
      value: 68,
      unit: "°C",
      icon: "🌡️",
      critical: 85,
      warning: 70,
    },
  ];
  const each_array = ensure_array_like(demoSensors);
  $$payload.out.push(
    `<div class="relative w-full h-full overflow-hidden" style="background: radial-gradient(ellipse at center, rgba(20, 160, 230, 0.05) 0%, transparent 70%)">`,
  );
  if (
    store_get(($$store_subs ??= {}), "$dashboardState", dashboardState)
      .isGridVisible
  ) {
    $$payload.out.push("<!--[-->");
    GridOverlay($$payload, {
      gridSize: store_get(
        ($$store_subs ??= {}),
        "$dashboardState",
        dashboardState,
      ).dragState.gridSize,
      zoom: store_get(($$store_subs ??= {}), "$dashboardState", dashboardState)
        .zoom,
    });
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <div class="absolute inset-0 p-8">`);
  CosmicPanel($$payload, {
    variant: "highlighted",
    title: "SenseCanvas Dashboard",
    subtitle: "Real-time Hardware Monitoring with Cosmic UI",
    className: "w-full max-w-2xl mx-auto mb-8",
    showGlow: true,
    children: ($$payload2) => {
      $$payload2.out.push(
        `<div class="text-center space-y-4"><p class="text-gray-300 font-orbitron">Welcome to the enhanced SenseCanvas dashboard featuring the new Cosmic UI design system.</p> <p class="text-sm text-gray-400">Sci-fi inspired components with SVG-first design and real-time hardware monitoring.</p></div>`,
      );
    },
    $$slots: { default: true },
  });
  $$payload.out.push(
    `<!----> <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto svelte-16wspn5"><!--[-->`,
  );
  for (let index = 0, $$length = each_array.length; index < $$length; index++) {
    let sensor = each_array[index];
    $$payload.out.push(`<div class="flex justify-center svelte-16wspn5">`);
    CosmicSensorGauge($$payload, {
      value: sensor.value,
      label: sensor.label,
      config: {
        min: 0,
        max: 100,
        warningThreshold: sensor.warning,
        criticalThreshold: sensor.critical,
        unit: sensor.unit,
        icon: sensor.icon,
      },
      size: 180,
      showFrame: true,
      glowEffect: true,
    });
    $$payload.out.push(`<!----></div>`);
  }
  $$payload.out.push(`<!--]--></div> `);
  CosmicPanel($$payload, {
    variant: "default",
    className: "w-full max-w-4xl mx-auto mt-8",
    title: "System Status",
    children: ($$payload2) => {
      $$payload2.out.push(
        `<div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-center svelte-16wspn5"><div class="space-y-2 svelte-16wspn5"><div class="text-2xl font-orbitron text-green-400">ONLINE</div> <div class="text-sm text-gray-400">Connection Status</div></div> <div class="space-y-2 svelte-16wspn5"><div class="text-2xl font-orbitron text-blue-400">${escape_html(demoSensors.length)}</div> <div class="text-sm text-gray-400">Active Sensors</div></div> <div class="space-y-2 svelte-16wspn5"><div class="text-2xl font-orbitron text-purple-400">COSMIC UI</div> <div class="text-sm text-gray-400">Design System</div></div></div>`,
      );
    },
    $$slots: { default: true },
  });
  $$payload.out.push(`<!----></div> `);
  if (store_get(($$store_subs ??= {}), "$currentLayout", currentLayout)) {
    $$payload.out.push("<!--[-->");
    const each_array_1 = ensure_array_like(
      store_get(($$store_subs ??= {}), "$currentLayout", currentLayout).widgets,
    );
    $$payload.out.push(`<!--[-->`);
    for (
      let $$index_1 = 0, $$length = each_array_1.length;
      $$index_1 < $$length;
      $$index_1++
    ) {
      let widget = each_array_1[$$index_1];
      DraggableWidget($$payload, { widget });
    }
    $$payload.out.push(`<!--]-->`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->  `);
  if (
    store_get(($$store_subs ??= {}), "$dashboardState", dashboardState)
      .widgetBuilder.isOpen
  ) {
    $$payload.out.push("<!--[-->");
    WidgetBuilder($$payload);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function AILayoutModal($$payload, $$props) {
  push();
  $$payload.out.push(`<div class="modal">`);
  {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div>Loading AI suggestions...</div>`);
  }
  $$payload.out.push(`<!--]--></div>`);
  pop();
}
function Dashboard($$payload, $$props) {
  push();
  var $$store_subs;
  $$payload.out.push(
    `<div class="dashboard h-screen flex flex-col bg-surface-50-900-token svelte-bi9bz2">`,
  );
  {
    let left = function ($$payload2) {
        $$payload2.out.push(
          `<div class="flex items-center gap-4 svelte-bi9bz2"><h1 class="font-orbitron font-bold text-xl text-white svelte-bi9bz2">SenseCanvas</h1> <div class="text-xs text-blue-400/80 font-orbitron svelte-bi9bz2">Real-time Monitoring</div></div>`,
        );
      },
      center = function ($$payload2) {
        $$payload2.out.push(
          `<div class="flex items-center gap-4 svelte-bi9bz2"><button class="cosmic-button px-4 py-2 text-sm font-orbitron text-blue-200 border border-blue-400/30 hover:border-blue-400 transition-colors rounded svelte-bi9bz2">+ Add Widget</button> <button class="cosmic-button px-4 py-2 text-sm font-orbitron text-gray-200 border border-gray-500/30 hover:border-gray-400 transition-colors rounded svelte-bi9bz2">AI Layouts</button></div>`,
        );
      },
      right = function ($$payload2) {
        $$payload2.out.push(
          `<div class="flex items-center gap-4 text-xs text-gray-300 svelte-bi9bz2"><span class="flex items-center gap-1 svelte-bi9bz2"><div class="w-1 h-1 bg-green-400 rounded-full animate-pulse svelte-bi9bz2"></div> <span class="font-orbitron svelte-bi9bz2">Connected</span></span> <span class="flex items-center gap-1 svelte-bi9bz2"><div class="w-1 h-1 bg-blue-400 rounded-full svelte-bi9bz2"></div> <span class="font-orbitron svelte-bi9bz2">Theme: ${escape_html(store_get(($$store_subs ??= {}), "$currentTheme", currentTheme))}</span></span></div>`,
        );
      };
    CosmicToolbar($$payload, {
      left,
      center,
      right,
      $$slots: { left: true, center: true, right: true },
    });
  }
  $$payload.out.push(
    `<!----> <div class="flex-1 relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 svelte-bi9bz2"><div class="absolute inset-0 overflow-hidden pointer-events-none svelte-bi9bz2"><div class="absolute inset-0 opacity-10 svelte-bi9bz2" style="background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0); background-size: 20px 20px;"></div> <div class="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full opacity-30 animate-float-1 svelte-bi9bz2"></div> <div class="absolute top-3/4 right-1/4 w-1 h-1 bg-green-400 rounded-full opacity-40 animate-float-2 svelte-bi9bz2"></div> <div class="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-purple-400 rounded-full opacity-20 animate-float-3 svelte-bi9bz2"></div> <div class="absolute inset-0 svelte-bi9bz2"><div class="absolute w-full h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent animate-scan-horizontal svelte-bi9bz2"></div> <div class="absolute h-full w-px bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent animate-scan-vertical svelte-bi9bz2"></div></div></div> `,
  );
  DashboardCanvas($$payload);
  $$payload.out.push(
    `<!----></div> <div class="status-bar bg-gray-900/80 border-t border-gray-700/50 px-4 py-2 text-xs text-gray-300 backdrop-blur-sm svelte-bi9bz2"><div class="flex items-center justify-between svelte-bi9bz2"><div class="flex items-center gap-4 svelte-bi9bz2"><span class="flex items-center gap-1 svelte-bi9bz2"><div class="w-1 h-1 bg-green-400 rounded-full animate-pulse svelte-bi9bz2"></div> <span class="font-orbitron svelte-bi9bz2">Widgets:</span> <span class="font-mono svelte-bi9bz2">${escape_html(store_get(($$store_subs ??= {}), "$currentLayout", currentLayout)?.widgets?.length || 0)}</span></span> <span class="flex items-center gap-1 svelte-bi9bz2"><div class="w-1 h-1 bg-blue-400 rounded-full svelte-bi9bz2"></div> <span class="font-orbitron svelte-bi9bz2">Layout:</span> <span class="font-orbitron svelte-bi9bz2">${escape_html(store_get(($$store_subs ??= {}), "$currentLayout", currentLayout)?.name || "Default")}</span></span> <span class="flex items-center gap-1 svelte-bi9bz2"><div class="w-1 h-1 bg-purple-400 rounded-full svelte-bi9bz2"></div> <span class="font-orbitron svelte-bi9bz2">Grid:</span> <span class="font-mono svelte-bi9bz2">${escape_html(store_get(($$store_subs ??= {}), "$currentLayout", currentLayout)?.gridSize || 20)}px</span></span></div> <div class="flex items-center gap-4 svelte-bi9bz2"><span class="flex items-center gap-1 svelte-bi9bz2"><div class="w-1 h-1 bg-yellow-400 rounded-full svelte-bi9bz2"></div> <span class="font-orbitron svelte-bi9bz2">Theme:</span> <span class="capitalize font-orbitron svelte-bi9bz2">${escape_html(store_get(($$store_subs ??= {}), "$currentTheme", currentTheme))}</span></span> <span class="flex items-center gap-1 svelte-bi9bz2"><div class="w-1 h-1 bg-red-400 rounded-full animate-pulse svelte-bi9bz2"></div> <span class="font-orbitron svelte-bi9bz2">Alerts:</span> <span class="font-mono svelte-bi9bz2">${escape_html(store_get(($$store_subs ??= {}), "$alertHistory", alertHistory)?.length || 0)}</span></span></div></div></div> `,
  );
  if (
    store_get(($$store_subs ??= {}), "$dashboardState", dashboardState).aiLayout
      .isOpen
  ) {
    $$payload.out.push("<!--[-->");
    AILayoutModal($$payload);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function _page($$payload) {
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>SenseCanvas - PC Sensor Dashboard</title>`;
    $$payload2.out.push(
      `<meta name="description" content="Real-time PC hardware monitoring dashboard with customizable widgets and AI-powered layout suggestions"/>`,
    );
  });
  Dashboard($$payload);
}
export { _page as default };
