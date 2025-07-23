import { J as noop, M as ensure_array_like, N as spread_attributes, O as attr, E as pop, A as push, P as stringify, K as escape_html, Q as attr_class, R as attr_style, S as store_get, T as unsubscribe_stores, U as bind_props, G as head } from "../../chunks/index.js";
import "clsx";
import { w as writable, g as get, d as derived } from "../../chunks/index2.js";
import { nanoid } from "nanoid";
const now = () => Date.now();
const raf = {
  // don't access requestAnimationFrame eagerly outside method
  // this allows basic testing of user code without JSDOM
  // bunder will eval and remove ternary when the user's app is built
  tick: (
    /** @param {any} _ */
    (_) => noop()
  ),
  now: () => now(),
  tasks: /* @__PURE__ */ new Set()
};
function loop(callback) {
  let task;
  if (raf.tasks.size === 0) ;
  return {
    promise: new Promise((fulfill) => {
      raf.tasks.add(task = { c: callback, f: fulfill });
    }),
    abort() {
      raf.tasks.delete(task);
    }
  };
}
function is_date(obj) {
  return Object.prototype.toString.call(obj) === "[object Date]";
}
function linear(t) {
  return t;
}
function cubicOut(t) {
  const f = t - 1;
  return f * f * f + 1;
}
function get_interpolator(a, b) {
  if (a === b || a !== a) return () => a;
  const type = typeof a;
  if (type !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
    throw new Error("Cannot interpolate values of different type");
  }
  if (Array.isArray(a)) {
    const arr = (
      /** @type {Array<any>} */
      b.map((bi, i) => {
        return get_interpolator(
          /** @type {Array<any>} */
          a[i],
          bi
        );
      })
    );
    return (t) => arr.map((fn) => fn(t));
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
    const delta = (
      /** @type {number} */
      b - /** @type {number} */
      a
    );
    return (t) => a + t * delta;
  }
  return () => b;
}
function tweened(value, defaults = {}) {
  const store = writable(value);
  let task;
  let target_value = value;
  function set(new_value, opts) {
    target_value = new_value;
    if (value == null) {
      store.set(value = new_value);
      return Promise.resolve();
    }
    let previous_task = task;
    let started = false;
    let {
      delay = 0,
      duration = 400,
      easing = linear,
      interpolate = get_interpolator
    } = { ...defaults, ...opts };
    if (duration === 0) {
      if (previous_task) {
        previous_task.abort();
        previous_task = null;
      }
      store.set(value = target_value);
      return Promise.resolve();
    }
    const start = raf.now() + delay;
    let fn;
    task = loop((now2) => {
      if (now2 < start) return true;
      if (!started) {
        fn = interpolate(
          /** @type {any} */
          value,
          new_value
        );
        if (typeof duration === "function")
          duration = duration(
            /** @type {any} */
            value,
            new_value
          );
        started = true;
      }
      if (previous_task) {
        previous_task.abort();
        previous_task = null;
      }
      const elapsed = now2 - start;
      if (elapsed > /** @type {number} */
      duration) {
        store.set(value = new_value);
        return false;
      }
      store.set(value = fn(easing(elapsed / duration)));
      return true;
    });
    return task.promise;
  }
  return {
    set,
    update: (fn, opts) => set(fn(
      /** @type {any} */
      target_value,
      /** @type {any} */
      value
    ), opts),
    subscribe: store.subscribe
  };
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
    gridSize: 20
  },
  resizeState: { isResizing: false, resizedWidget: null, resizeHandle: null },
  widgetBuilder: {
    isOpen: false,
    mode: "create",
    selectedWidget: null,
    previewData: null,
    activeTab: "general"
  },
  isGridVisible: true,
  zoom: 1,
  history: [],
  historyIndex: -1,
  aiLayout: { isOpen: false, suggestions: [] }
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
    description: "Circular gauge showing CPU usage with customizable thresholds",
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
        thresholds: [70, 90]
      },
      dataSource: "cpu.usage"
    }
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
        thresholds: [75, 90]
      },
      dataSource: "gpu.usage"
    }
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
        thresholds: [80, 95]
      },
      dataSource: "memory.usage"
    }
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
      dataSource: "cpu.temperature"
    }
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
        colors: ["#10b981", "#f59e0b", "#ef4444"]
      },
      dataSource: "cpu.usage"
    }
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
      config: { metrics: ["cpu.usage", "memory.usage", "gpu.usage"] }
    }
  }
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
      updatedAt: /* @__PURE__ */ new Date()
    };
    dashboardState.update((state) => ({
      ...state,
      layouts: [...state.layouts, newLayout],
      currentLayout: newLayout
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
        updatedAt: /* @__PURE__ */ new Date()
      };
      const layouts = state.layouts.map((layout) => layout.id === updatedLayout.id ? updatedLayout : layout);
      return { ...state, layouts, currentLayout: updatedLayout };
    });
  },
  // Widget management
  addWidget: (template, position) => {
    const widget = {
      id: nanoid(),
      ...template.config,
      position: position || { x: 100, y: 100 },
      size: template.config.size || { width: 200, height: 200 }
    };
    dashboardState.update((state) => {
      if (!state.currentLayout) return state;
      const updatedLayout = {
        ...state.currentLayout,
        widgets: [...state.currentLayout.widgets, widget]
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
        widgets: state.currentLayout.widgets.map((widget) => widget.id === widgetId ? { ...widget, ...updates } : widget)
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
        widgets: state.currentLayout.widgets.filter((widget) => widget.id !== widgetId)
      };
      currentLayout.set(updatedLayout);
      return { ...state, currentLayout: updatedLayout };
    });
  },
  // Selection management
  selectWidget: (widgetId, multiSelect = false) => {
    dashboardState.update((state) => {
      const newSelected = multiSelect ? [...state.selectedWidgets, widgetId] : [widgetId];
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
      gridSize: 20
    };
    dragState.set(newDragState);
    dashboardState.update((state) => ({ ...state, dragState: newDragState }));
  },
  updateDrag: (position) => {
    dashboardState.update((state) => {
      if (!state.dragState.draggedWidget || !state.currentLayout) return state;
      const snappedPosition = state.dragState.snapToGrid ? {
        x: Math.round(position.x / state.dragState.gridSize) * state.dragState.gridSize,
        y: Math.round(position.y / state.dragState.gridSize) * state.dragState.gridSize
      } : position;
      const updatedLayout = {
        ...state.currentLayout,
        widgets: state.currentLayout.widgets.map((widget) => widget.id === state.dragState.draggedWidget ? { ...widget, position: snappedPosition } : widget)
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
      gridSize: 20
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
      activeTab: "general"
    };
    widgetBuilder.set(newBuilderState);
    dashboardState.update((state) => ({ ...state, widgetBuilder: newBuilderState }));
  },
  closeWidgetBuilder: () => {
    const newBuilderState = {
      isOpen: false,
      mode: "create",
      selectedWidget: null,
      previewData: null,
      activeTab: "general"
    };
    widgetBuilder.set(newBuilderState);
    dashboardState.update((state) => ({ ...state, widgetBuilder: newBuilderState }));
  },
  // Grid and zoom
  toggleGrid: () => {
    dashboardState.update((state) => ({ ...state, isGridVisible: !state.isGridVisible }));
  },
  setZoom: (zoom) => {
    dashboardState.update((state) => ({ ...state, zoom: Math.max(0.25, Math.min(2, zoom)) }));
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
        historyIndex: Math.min(newHistory.length - 1, 49)
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
        historyIndex: state.historyIndex - 1
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
        historyIndex: state.historyIndex + 1
      };
    });
  },
  // AI Layout
  openAILayoutModal: () => {
    dashboardState.update((state) => ({ ...state, aiLayout: { ...state.aiLayout, isOpen: true } }));
  },
  closeAILayoutModal: () => {
    dashboardState.update((state) => ({ ...state, aiLayout: { ...state.aiLayout, isOpen: false } }));
  },
  applyLayoutSuggestion: (suggestion) => {
    dashboardState.update((state) => {
      if (!state.currentLayout) return state;
      const updatedLayout = { ...state.currentLayout, widgets: suggestion.widgets };
      currentLayout.set(updatedLayout);
      return { ...state, currentLayout: updatedLayout };
    });
  }
};
dashboardActions.createLayout("Default Dashboard", "Your main hardware monitoring dashboard");
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
          Math.min(100, cpuUsage + (Math.random() - 0.5) * 30)
        ),
        temperature: 35 + cpuUsage * 0.8 + Math.random() * 15
      }))
    },
    gpu: {
      usage: Math.max(0, Math.min(100, gpuUsage)),
      temperature: 40 + gpuUsage * 0.6 + Math.random() * 15,
      memory: Math.max(0, Math.min(100, gpuUsage * 0.7 + Math.random() * 20)),
      fanSpeed: Math.max(
        30,
        Math.min(100, gpuUsage * 0.8 + Math.random() * 20)
      ),
      voltage: 1.1 + Math.random() * 0.1,
      powerUsage: Math.max(
        50,
        Math.min(300, gpuUsage * 2.5 + Math.random() * 50)
      )
    },
    memory: {
      usage: Math.max(0, Math.min(100, memoryUsage)),
      available: Math.max(0, 16384 * (100 - memoryUsage) / 100),
      total: 16384,
      speed: 3200 + Math.random() * 400
    },
    storage: [
      {
        name: "NVMe SSD",
        usage: 65 + Math.random() * 10,
        temperature: 35 + Math.random() * 15,
        readSpeed: 500 + Math.random() * 200,
        writeSpeed: 400 + Math.random() * 150
      },
      {
        name: "HDD",
        usage: 45 + Math.random() * 10,
        temperature: 30 + Math.random() * 10,
        readSpeed: 120 + Math.random() * 30,
        writeSpeed: 100 + Math.random() * 25
      }
    ],
    fans: {
      "CPU Fan": Math.max(800, 1200 + Math.random() * 400),
      "GPU Fan 1": Math.max(600, 1e3 + Math.random() * 600),
      "GPU Fan 2": Math.max(600, 1e3 + Math.random() * 600),
      "Case Fan 1": Math.max(500, 800 + Math.random() * 200),
      "Case Fan 2": Math.max(500, 800 + Math.random() * 200)
    },
    voltages: {
      "CPU Core": 1.2 + Math.random() * 0.1,
      "12V Rail": 11.9 + Math.random() * 0.2,
      "5V Rail": 4.95 + Math.random() * 0.1,
      "3.3V Rail": 3.28 + Math.random() * 0.05
    },
    motherboard: {
      temperature: 32 + Math.random() * 8,
      voltage: 3.3 + Math.random() * 0.1
    },
    network: {
      bytesReceived: Math.random() * 1e6,
      bytesSent: Math.random() * 5e5,
      packetsReceived: Math.random() * 1e3,
      packetsSent: Math.random() * 800
    }
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
    const ws = get(websocket);
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
            parsedData
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
    const ws = get(websocket);
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
        powerUsage: 0
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
        packetsSent: 0
      }
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
    let value = get(sensorData);
    for (const key of keys) {
      if (value && typeof value === "object" && key in value) {
        value = value[key];
      } else {
        return 0;
      }
    }
    return typeof value === "number" ? value : 0;
  }
};
const initialTheme = "dark";
const themeStore = writable(initialTheme);
const currentTheme = derived(themeStore, ($theme) => $theme);
const alertHistory = writable([]);
function createPathData(show, strokeWidth, stroke, fill, path) {
  return {
    show,
    style: {
      strokeWidth,
      stroke,
      fill
    },
    path
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
        ["L", "15", "15"]
      ]
    )
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
        ["L", "10", "10"]
      ]
    )
  ]
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
  function processPath(pathString, width) {
    return pathString.replace(/100%-(\d+)/g, (match, offset) => {
      return `${width - parseFloat(offset)}`;
    }).replace(/(\d+)%-(\d+)/g, (match, percent, offset) => {
      const num = parseFloat(percent);
      return `${num / 100 * width - parseFloat(offset)}`;
    }).replace(/(\d+)%\+(\d+)/g, (match, percent, offset) => {
      const num = parseFloat(percent);
      return `${num / 100 * width + parseFloat(offset)}`;
    }).replace(/(\d+)%/g, (match, percent) => {
      const num = parseFloat(percent);
      return `${num / 100 * width}`;
    });
  }
  let frameWidth = 300;
  let frameHeight = 200;
  const processedPaths = paths.map((pathData) => ({
    ...pathData,
    processedPath: processPath(pathToString(pathData.path), frameWidth)
  }));
  const each_array = ensure_array_like(processedPaths);
  $$payload.out.push(`<svg${spread_attributes(
    {
      class: `absolute inset-0 size-full ${stringify(className)}`,
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: `0 0 ${stringify(frameWidth)} ${stringify(frameHeight)}`,
      style,
      ...restProps
    },
    null,
    void 0,
    void 0,
    3
  )}><!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let pathData = each_array[$$index];
    if (pathData.show) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<path${attr("d", pathData.processedPath)}${attr("stroke-width", pathData.style.strokeWidth)}${attr("stroke", pathData.style.stroke)}${attr("fill", pathData.style.fill)} class="transition-all duration-300"></path>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--></svg>`);
  pop();
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
              fill: "rgba(0, 0, 0, 0.2)"
            },
            path: [
              ["M", "0", "0"],
              ["L", "100%", "0"],
              ["L", "100%", "100%"],
              ["L", "0", "100%"],
              ["L", "0", "0"]
            ]
          }
        ];
      default:
        return defaultFramePaths.standard;
    }
  };
  $$payload.out.push(`<div${spread_attributes({ class: `relative ${stringify(className)}`, ...restProps }, null)}>`);
  CosmicFrame($$payload, {
    paths: currentFrames(),
    className: showGlow ? "drop-shadow-lg" : ""
  });
  $$payload.out.push(`<!----> <div class="relative z-10 flex flex-col h-full">`);
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
        $$payload.out.push(`<h3 class="font-orbitron font-semibold text-white text-lg">${escape_html(title)}</h3>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--> `);
      if (subtitle) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<p class="text-gray-400 text-sm">${escape_html(subtitle)}</p>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--></div>`);
    }
    $$payload.out.push(`<!--]--></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <div${attr_class(`flex-1 p-4 ${stringify(contentClass)} ${stringify(scrollable ? "overflow-auto" : "")}`)}>`);
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
    $$payload.out.push(`<div class="absolute inset-0 opacity-20 pointer-events-none" style="filter: blur(20px); background: radial-gradient(circle at center, var(--color-primary)30 0%, transparent 70%);"></div>`);
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
        fill: "rgba(0, 0, 0, 0.8)"
      },
      path: [
        ["M", "0", "0"],
        ["L", "100%", "0"],
        ["L", "100%", "100%"],
        ["L", "20", "100%"],
        ["L", "0", "80%"],
        ["L", "0", "0"]
      ]
    },
    {
      show: true,
      style: {
        strokeWidth: "1",
        stroke: "rgba(255, 255, 255, 0.3)",
        fill: "transparent"
      },
      path: [
        ["M", "100%-50", "0"],
        ["L", "100%", "0"],
        ["L", "100%", "100%"],
        ["L", "100%-30", "100%"]
      ]
    }
  ];
  $$payload.out.push(`<div${spread_attributes(
    {
      class: `relative h-16 bg-gray-900/90 backdrop-blur-sm border-b border-gray-700/50 ${stringify(className)}`,
      ...restProps
    },
    "svelte-rabmgl"
  )}>`);
  CosmicFrame($$payload, { paths: toolbarFramePaths, className: "opacity-80" });
  $$payload.out.push(`<!----> `);
  if (showScanLines) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="absolute inset-0 overflow-hidden pointer-events-none svelte-rabmgl"><div class="absolute w-full h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent animate-scan-slow svelte-rabmgl"></div> <div class="absolute right-0 top-0 w-px h-full bg-gradient-to-b from-transparent via-blue-400/20 to-transparent animate-scan-vertical-slow svelte-rabmgl"></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <div class="relative z-10 h-full flex items-center justify-between px-6 svelte-rabmgl"><div class="flex items-center gap-4 svelte-rabmgl">`);
  if (left) {
    $$payload.out.push("<!--[-->");
    left($$payload);
    $$payload.out.push(`<!---->`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div> <div class="flex items-center gap-4 svelte-rabmgl">`);
  if (center) {
    $$payload.out.push("<!--[-->");
    center($$payload);
    $$payload.out.push(`<!---->`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div> <div class="flex items-center gap-4 svelte-rabmgl">`);
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
      icon: "🔥"
    },
    size = 200,
    showFrame = true,
    glowEffect = true
  } = $$props;
  const animatedValue = tweened(0, { duration: 800, easing: cubicOut });
  const normalizedValue = Math.max(0, Math.min(100, (value - config.min) / (config.max - config.min) * 100));
  const angle = normalizedValue / 100 * 270 - 135;
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
        fill: "var(--color-frame-1-fill)"
      },
      path: [
        ["M", "15", "15"],
        ["L", "85%", "15"],
        ["L", "100%-15", "30"],
        ["L", "100%-15", "85%"],
        ["L", "85%", "100%-15"],
        ["L", "15", "100%-15"],
        ["L", "15", "15"]
      ]
    },
    {
      show: showFrame,
      style: { strokeWidth: "1", stroke: statusColor(), fill: "transparent" },
      path: [
        ["M", "10", "10"],
        ["L", "90%", "10"],
        ["L", "100%-10", "25"],
        ["L", "100%-10", "90%"],
        ["L", "90%", "100%-10"],
        ["L", "10", "100%-10"],
        ["L", "10", "10"]
      ]
    }
  ];
  function createArcPath(startAngle, endAngle, radius2, cx, cy) {
    const start = {
      x: cx + radius2 * Math.cos(startAngle * Math.PI / 180),
      y: cy + radius2 * Math.sin(startAngle * Math.PI / 180)
    };
    const end = {
      x: cx + radius2 * Math.cos(endAngle * Math.PI / 180),
      y: cy + radius2 * Math.sin(endAngle * Math.PI / 180)
    };
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return `M ${start.x} ${start.y} A ${radius2} ${radius2} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  }
  const backgroundArc = createArcPath(-135, 135, radius, centerX, centerY);
  const valueArc = createArcPath(-135, angle, radius, centerX, centerY);
  $$payload.out.push(`<div class="relative inline-block svelte-1in9g11"${attr_style(`width: ${stringify(size)}px; height: ${stringify(size)}px;`)}>`);
  if (showFrame) {
    $$payload.out.push("<!--[-->");
    CosmicFrame($$payload, {
      paths: gaugeFramePaths,
      className: glowEffect ? "drop-shadow-xl" : "",
      style: `filter: ${stringify(glowEffect ? `drop-shadow(0 0 20px ${statusColor()}40)` : "none")}`
    });
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <div class="absolute inset-4 flex items-center justify-center svelte-1in9g11"><svg${attr("width", size - 32)}${attr("height", size - 32)}${attr("viewBox", `0 0 ${stringify(size)} ${stringify(size)}`)} class="overflow-visible svelte-1in9g11"><path${attr("d", backgroundArc)} stroke="rgba(255, 255, 255, 0.1)" stroke-width="8" fill="none" stroke-linecap="round" class="svelte-1in9g11"></path><path${attr("d", valueArc)}${attr("stroke", statusColor())} stroke-width="8" fill="none" stroke-linecap="round" class="transition-all duration-800 ease-out svelte-1in9g11"${attr_style(`filter: ${stringify(glowEffect ? `drop-shadow(0 0 8px ${statusColor()})` : "none")}`)}></path><circle${attr("cx", centerX)}${attr("cy", centerY)} r="12" fill="var(--color-background)"${attr("stroke", statusColor())} stroke-width="2" class="svelte-1in9g11"></circle><text${attr("x", centerX)}${attr("y", centerY - 10)} text-anchor="middle" fill="var(--color-foreground)" font-size="18" font-weight="bold" font-family="monospace" class="svelte-1in9g11">${escape_html(Math.round(store_get($$store_subs ??= {}, "$animatedValue", animatedValue)))}</text><text${attr("x", centerX)}${attr("y", centerY + 8)} text-anchor="middle" fill="var(--color-foreground)" font-size="10" opacity="0.7" font-family="monospace" class="svelte-1in9g11">${escape_html(config.unit)}</text></svg></div> <div class="absolute bottom-2 left-0 right-0 text-center svelte-1in9g11"><div class="text-xs font-medium text-white/80 flex items-center justify-center gap-1 font-orbitron svelte-1in9g11">`);
  if (config.icon) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<span class="svelte-1in9g11">${escape_html(config.icon)}</span>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> ${escape_html(label)}</div></div> <div class="absolute top-2 right-2 svelte-1in9g11"><div${attr_class(
    `w-2 h-2 rounded-full ${stringify(value >= config.criticalThreshold ? "bg-red-400 critical-glow" : value >= config.warningThreshold ? "bg-yellow-400" : "bg-green-400")}`,
    "svelte-1in9g11"
  )}></div></div></div>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
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
    size: 160
  };
  let gaugeConfig = { ...defaults, ...config.config };
  let displayValue = value ?? 0;
  let percentage = Math.max(0, Math.min(100, (displayValue - gaugeConfig.min) / (gaugeConfig.max - gaugeConfig.min) * 100));
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
  let arcLength = percentage / 100 * circumference * 0.75;
  let dashArray = `${arcLength} ${circumference}`;
  $$payload.out.push(`<div class="gauge-container relative svelte-1d44noz"><svg${attr("width", size)}${attr("height", size)} class="transform -rotate-90"><circle${attr("cx", center)}${attr("cy", center)}${attr("r", radius)} fill="none" stroke="currentColor"${attr("stroke-width", gaugeConfig.strokeWidth)} class="text-gray-200 dark:text-gray-700"></circle><circle${attr("cx", center)}${attr("cy", center)}${attr("r", radius)} fill="none"${attr("stroke", currentColor())}${attr("stroke-width", gaugeConfig.strokeWidth)} stroke-linecap="round"${attr("stroke-dasharray", dashArray)}${attr("stroke-dashoffset", circumference * 0.125)} class="transition-all duration-1000 ease-out"></circle></svg> `);
  if (gaugeConfig.showValue) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="absolute inset-0 flex flex-col items-center justify-center"><div class="text-2xl font-bold text-gray-900 dark:text-white">${escape_html(displayValue.toFixed(1))}</div> <div class="text-xs text-gray-500 dark:text-gray-400">${escape_html(gaugeConfig.unit)}</div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  if (gaugeConfig.thresholds && gaugeConfig.thresholds.length > 0) {
    $$payload.out.push("<!--[-->");
    const each_array = ensure_array_like(gaugeConfig.thresholds);
    $$payload.out.push(`<div class="flex items-center gap-2 mt-2 text-xs"><!--[-->`);
    for (let i = 0, $$length = each_array.length; i < $$length; i++) {
      let threshold = each_array[i];
      $$payload.out.push(`<div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full"${attr_style(`background-color: ${stringify(gaugeConfig.colors[i] || "#gray")}`)}></div> <span class="text-gray-600 dark:text-gray-400">${escape_html(threshold)}${escape_html(gaugeConfig.unit)}</span></div>`);
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
    showLabels: true
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
  $$payload.out.push(`<div class="linear-gauge flex flex-col h-full p-4 svelte-2sjcr1">`);
  if (gaugeConfig.showTitle) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">${escape_html(config.title)}</h3>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <div class="gauge-content flex-1 flex flex-col justify-center">`);
  if (gaugeConfig.orientation === "horizontal") {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="flex items-center gap-3">`);
    if (gaugeConfig.showLabels) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<span class="text-xs text-gray-500 dark:text-gray-400 min-w-8">${escape_html(gaugeConfig.min)}</span>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--> <div class="flex-1 relative"><div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"${attr_style(`height: ${stringify(gaugeConfig.height)}px`)}><div class="h-full rounded-full transition-all duration-1000 ease-out"${attr_style(` width: ${stringify(0)}%; background-color: ${stringify(currentColor)}; `)}></div></div> `);
    if (gaugeConfig.thresholds) {
      $$payload.out.push("<!--[-->");
      const each_array = ensure_array_like(gaugeConfig.thresholds);
      $$payload.out.push(`<!--[-->`);
      for (let i = 0, $$length = each_array.length; i < $$length; i++) {
        let threshold = each_array[i];
        const thresholdPercentage = (threshold - gaugeConfig.min) / (gaugeConfig.max - gaugeConfig.min) * 100;
        $$payload.out.push(`<div class="absolute top-0 w-0.5 bg-gray-400 dark:bg-gray-500"${attr_style(` left: ${stringify(thresholdPercentage)}%; height: ${stringify(gaugeConfig.height)}px; `)}></div>`);
      }
      $$payload.out.push(`<!--]-->`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></div> `);
    if (gaugeConfig.showLabels) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<span class="text-xs text-gray-500 dark:text-gray-400 min-w-8">${escape_html(gaugeConfig.max)}</span>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<div class="flex flex-col items-center h-full">`);
    if (gaugeConfig.showLabels) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<span class="text-xs text-gray-500 dark:text-gray-400 mb-2">${escape_html(gaugeConfig.max)}</span>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--> <div class="flex-1 relative flex items-end"${attr_style(`width: ${stringify(gaugeConfig.height)}px`)}><div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden h-full"><div class="w-full rounded-full transition-all duration-1000 ease-out"${attr_style(` height: ${stringify(0)}%; background-color: ${stringify(currentColor)}; margin-top: auto; `)}></div></div> `);
    if (gaugeConfig.thresholds) {
      $$payload.out.push("<!--[-->");
      const each_array_1 = ensure_array_like(gaugeConfig.thresholds);
      $$payload.out.push(`<!--[-->`);
      for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
        let threshold = each_array_1[i];
        const thresholdPercentage = (threshold - gaugeConfig.min) / (gaugeConfig.max - gaugeConfig.min) * 100;
        $$payload.out.push(`<div class="absolute left-0 h-0.5 bg-gray-400 dark:bg-gray-500 w-full"${attr_style(`bottom: ${stringify(thresholdPercentage)}%`)}></div>`);
      }
      $$payload.out.push(`<!--]-->`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></div> `);
    if (gaugeConfig.showLabels) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<span class="text-xs text-gray-500 dark:text-gray-400 mt-2">${escape_html(gaugeConfig.min)}</span>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></div>`);
  }
  $$payload.out.push(`<!--]--> `);
  if (gaugeConfig.showValue) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="text-center mt-3"><span class="text-lg font-semibold text-gray-900 dark:text-white">${escape_html(displayValue.toFixed(1))}${escape_html(gaugeConfig.unit)}</span></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div> `);
  if (gaugeConfig.thresholds && gaugeConfig.thresholds.length > 0) {
    $$payload.out.push("<!--[-->");
    const each_array_2 = ensure_array_like(gaugeConfig.thresholds);
    $$payload.out.push(`<div class="flex items-center justify-center gap-3 mt-2 text-xs"><!--[-->`);
    for (let i = 0, $$length = each_array_2.length; i < $$length; i++) {
      let threshold = each_array_2[i];
      $$payload.out.push(`<div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full"${attr_style(`background-color: ${stringify(gaugeConfig.colors[i] || "#gray")}`)}></div> <span class="text-gray-600 dark:text-gray-400">${escape_html(threshold)}${escape_html(gaugeConfig.unit)}</span></div>`);
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
      background: "#e5e7eb"
    },
    showValue: true,
    showTitle: true,
    showZones: true
  };
  let speedometerConfig = { ...defaults, ...config.config };
  let displayValue = value ?? 0;
  let zoneColor = () => {
    const currentValue = displayValue;
    if (currentValue >= speedometerConfig.dangerZone) return speedometerConfig.colors.danger;
    if (currentValue >= speedometerConfig.warningZone) return speedometerConfig.colors.warning;
    return speedometerConfig.colors.safe;
  };
  let size = Math.min(config.size.width, config.size.height) - 20;
  let center = size / 2;
  let radius = size * 0.35;
  function calculateTickPosition(angle, radius2) {
    const radian = angle * Math.PI / 180;
    return { x: Math.cos(radian) * radius2, y: Math.sin(radian) * radius2 };
  }
  const tickMarks = () => {
    const marks = [];
    for (let i = 0; i <= 10; i++) {
      const angle = -90 + i / 10 * 180;
      const value2 = speedometerConfig.min + i / 10 * (speedometerConfig.max - speedometerConfig.min);
      const position = calculateTickPosition(angle, radius - 10);
      marks.push({
        angle,
        value: Math.round(value2),
        x: position.x,
        y: position.y,
        isMajor: i % 5 === 0
      });
    }
    return marks;
  };
  const segments = () => {
    if (!speedometerConfig.showZones) return [];
    const segmentData = [];
    const sortedZones = [speedometerConfig.warningZone, speedometerConfig.dangerZone].sort((a, b) => a - b);
    segmentData.push({
      start: -90,
      end: -90 + (sortedZones[0] - speedometerConfig.min) / (speedometerConfig.max - speedometerConfig.min) * 180,
      color: speedometerConfig.colors.safe
    });
    for (let i = 0; i < sortedZones.length - 1; i++) {
      const startVal = sortedZones[i];
      const endVal = sortedZones[i + 1];
      segmentData.push({
        start: -90 + (startVal - speedometerConfig.min) / (speedometerConfig.max - speedometerConfig.min) * 180,
        end: -90 + (endVal - speedometerConfig.min) / (speedometerConfig.max - speedometerConfig.min) * 180,
        color: speedometerConfig.colors.warning
      });
    }
    const lastZone = sortedZones[sortedZones.length - 1];
    segmentData.push({
      start: -90 + (lastZone - speedometerConfig.min) / (speedometerConfig.max - speedometerConfig.min) * 180,
      end: 90,
      color: speedometerConfig.colors.danger
    });
    return segmentData;
  };
  const each_array_1 = ensure_array_like(tickMarks);
  $$payload.out.push(`<div class="speedometer flex flex-col items-center justify-center h-full p-4 svelte-wwfm74">`);
  if (speedometerConfig.showTitle) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">${escape_html(config.title)}</h3>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <div class="speedometer-container relative svelte-wwfm74"><svg${attr("width", size)}${attr("height", size * 0.7)} class="overflow-visible"><path${attr("d", `M ${stringify(center - radius)} ${stringify(center)} A ${stringify(radius)} ${stringify(radius)} 0 0 1 ${stringify(center + radius)} ${stringify(center)}`)} fill="none"${attr("stroke", speedometerConfig.colors.background)} stroke-width="20" stroke-linecap="round"></path>`);
  if (speedometerConfig.showZones) {
    $$payload.out.push("<!--[-->");
    const each_array = ensure_array_like(segments);
    $$payload.out.push(`<!--[-->`);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let segment = each_array[$$index];
      $$payload.out.push(`<path${attr("d", `M ${center + segment.start * Math.PI / 180 * radius} ${center + segment.start * Math.PI / 180 * radius} A ${radius} ${radius} 0 0 1 ${center + segment.end * Math.PI / 180 * radius} ${center + segment.end * Math.PI / 180 * radius}`)} fill="none"${attr("stroke", segment.color)} stroke-width="20" stroke-linecap="round"></path>`);
    }
    $$payload.out.push(`<!--]-->`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--><!--[-->`);
  for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
    let mark = each_array_1[$$index_1];
    const angleRad = mark.angle * Math.PI / 180;
    const tickLength = mark.isMajor ? 15 : 8;
    const x1 = center + (radius - 30) * Math.cos(angleRad);
    const y1 = center + (radius - 30) * Math.sin(angleRad);
    const x2 = center + (radius - 30 + tickLength) * Math.cos(angleRad);
    const y2 = center + (radius - 30 + tickLength) * Math.sin(angleRad);
    $$payload.out.push(`<line${attr("x1", x1)}${attr("y1", y1)}${attr("x2", x2)}${attr("y2", y2)} stroke="currentColor"${attr("stroke-width", mark.isMajor ? 2 : 1)} class="text-gray-600 dark:text-gray-400"></line>`);
    if (mark.isMajor) {
      $$payload.out.push("<!--[-->");
      const labelValue = speedometerConfig.min + mark.value / 10 * (speedometerConfig.max - speedometerConfig.min);
      const labelX = center + (radius - 45) * Math.cos(angleRad);
      const labelY = center + (radius - 45) * Math.sin(angleRad);
      $$payload.out.push(`<text${attr("x", labelX)}${attr("y", labelY)} text-anchor="middle" dominant-baseline="middle" class="text-xs fill-current text-gray-600 dark:text-gray-400">${escape_html(Math.round(labelValue))}</text>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--><g${attr("transform", `rotate(${stringify(-90)} ${stringify(center)} ${stringify(center)})`)}><line${attr("x1", center)}${attr("y1", center)}${attr("x2", center + radius - 40)}${attr("y2", center)}${attr("stroke", zoneColor())} stroke-width="3" stroke-linecap="round" class="transition-all duration-1000 ease-out"></line><circle${attr("cx", center + radius - 40)}${attr("cy", center)} r="3"${attr("fill", zoneColor())}></circle></g><circle${attr("cx", center)}${attr("cy", center)} r="8" fill="currentColor" class="text-gray-400 dark:text-gray-600"></circle><circle${attr("cx", center)}${attr("cy", center)} r="4"${attr("fill", zoneColor())}></circle></svg> `);
  if (speedometerConfig.showValue) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center"><div class="text-2xl font-bold text-gray-900 dark:text-white">${escape_html(displayValue.toFixed(1))}</div> <div class="text-xs text-gray-500 dark:text-gray-400">${escape_html(speedometerConfig.unit)}</div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div> `);
  if (speedometerConfig.showZones) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="flex items-center gap-3 mt-2 text-xs"><div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full"${attr_style(`background-color: ${stringify(speedometerConfig.colors.safe)}`)}></div> <span class="text-gray-600 dark:text-gray-400">Safe</span></div> <div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full"${attr_style(`background-color: ${stringify(speedometerConfig.colors.warning)}`)}></div> <span class="text-gray-600 dark:text-gray-400">Warning</span></div> <div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full"${attr_style(`background-color: ${stringify(speedometerConfig.colors.danger)}`)}></div> <span class="text-gray-600 dark:text-gray-400">Danger</span></div></div>`);
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
      critical: "#ef4444"
    },
    showChange: false,
    changeValue: 0,
    changeUnit: "%"
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
  $$payload.out.push(`<div class="kpi-card h-full p-4 flex flex-col justify-between svelte-2vugh9"><div class="flex items-start justify-between mb-2"><div class="flex items-center gap-2">`);
  if (
    // Update animated value when displayValue changes
    kpiConfig.showIcon
  ) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<span class="text-lg">${escape_html(kpiConfig.icon)}</span>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">${escape_html(config.title)}</h3></div> `);
  if (kpiConfig.showTrend) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full"${attr_style(`background-color: ${stringify(statusColor)}`)}></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div> <div class="flex-1 flex items-center justify-center"><div class="text-center"><div class="text-3xl font-bold transition-colors duration-300"${attr_style(`color: ${stringify(statusColor)}`)}>${escape_html(formatValue(animatedValue))} <span class="text-lg font-normal text-gray-500 dark:text-gray-400">${escape_html(kpiConfig.unit)}</span></div></div></div> `);
  if (kpiConfig.showChange) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="flex items-center justify-center mt-2"><div class="flex items-center gap-1 text-sm">`);
    if (kpiConfig.changeValue > 0) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd"></path></svg> <span class="text-green-600 dark:text-green-400">+${escape_html(kpiConfig.changeValue.toFixed(1))}${escape_html(kpiConfig.changeUnit)}</span>`);
    } else {
      $$payload.out.push("<!--[!-->");
      if (kpiConfig.changeValue < 0) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<svg class="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg> <span class="text-red-600 dark:text-red-400">${escape_html(kpiConfig.changeValue.toFixed(1))}${escape_html(kpiConfig.changeUnit)}</span>`);
      } else {
        $$payload.out.push("<!--[!-->");
        $$payload.out.push(`<svg class="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path></svg> <span class="text-gray-600 dark:text-gray-400">0${escape_html(kpiConfig.changeUnit)}</span>`);
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
    $$payload.out.push(`<div class="mt-2 flex justify-center"><div class="flex items-center gap-1"><!--[-->`);
    for (let i = 0, $$length = each_array.length; i < $$length; i++) {
      let threshold = each_array[i];
      $$payload.out.push(`<div${attr_class("w-1 h-1 rounded-full opacity-50", void 0, { "opacity-100": displayValue >= threshold })}${attr_style(`background-color: ${stringify(i === 0 ? kpiConfig.colors.good : i === 1 ? kpiConfig.colors.warning : kpiConfig.colors.critical)}`)}></div>`);
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
  var $$store_subs;
  let { config, value } = $$props;
  const widgetConfig = {
    min: config.min ?? 0,
    max: config.max ?? 100,
    unit: config.unit ?? "%",
    colors: config.colors ?? ["#22c55e", "#f59e0b", "#ef4444"],
    thresholds: config.thresholds ?? [70, 90],
    ...config
  };
  const sensorValue = () => {
    return value ?? store_get($$store_subs ??= {}, "$sensorStore", sensorStore).data?.cpu?.usage ?? 0;
  };
  const currentColor = () => {
    const val = sensorValue();
    const colors = widgetConfig.colors;
    const thresholds = widgetConfig.thresholds;
    if (val === null || val === void 0) return colors[0];
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (val >= thresholds[i]) {
        return colors[i + 1] || colors[colors.length - 1];
      }
    }
    return colors[0] || "#22c55e";
  };
  const dynamicStyle = () => {
    const baseStyle = widgetConfig;
    return {
      backgroundColor: baseStyle.backgroundColor || "#ffffff",
      borderColor: baseStyle.borderColor || "#e5e7eb",
      borderWidth: baseStyle.borderWidth || 1,
      borderRadius: baseStyle.borderRadius || 8,
      fontSize: baseStyle.fontSize || "14px",
      fontWeight: baseStyle.fontWeight || "normal"
    };
  };
  $$payload.out.push(`<div class="simple-widget relative h-full w-full overflow-hidden group svelte-1jm7o5g"${attr_style(`border-radius: ${stringify(dynamicStyle().borderRadius)}px;`)}><div class="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 svelte-1jm7o5g"></div> <div class="absolute inset-0 opacity-20 transition-opacity duration-1000 svelte-1jm7o5g"${attr_style(`background: radial-gradient(circle at center, ${stringify(currentColor())} 0%, transparent 70%);`)}></div> <div class="absolute inset-0 rounded-lg opacity-60 svelte-1jm7o5g"${attr_style(`border: ${stringify(dynamicStyle().borderWidth)}px solid ${stringify(currentColor())}; box-shadow: 0 0 10px ${stringify(currentColor())}40;`)}></div> <div class="relative z-10 h-full flex flex-col items-center justify-center p-4 text-center svelte-1jm7o5g"><div class="text-2xl font-bold transition-all duration-300 font-orbitron svelte-1jm7o5g"${attr_style(`color: ${stringify(currentColor())}; font-size: ${stringify(dynamicStyle().fontSize)}; font-weight: ${stringify(dynamicStyle().fontWeight)};`)}>${escape_html(sensorValue())}</div> <div class="text-sm text-gray-400 font-medium uppercase tracking-wider mt-1 svelte-1jm7o5g">${escape_html(widgetConfig.unit)}</div> <div class="absolute w-full h-px opacity-30 animate-scan svelte-1jm7o5g"${attr_style(`background: linear-gradient(90deg, transparent 0%, ${stringify(currentColor())} 50%, transparent 100%);`)}></div></div> <div class="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 rounded-tl-lg opacity-60 svelte-1jm7o5g"${attr_style(`border-color: ${stringify(currentColor())};`)}></div> <div class="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 rounded-tr-lg opacity-60 svelte-1jm7o5g"${attr_style(`border-color: ${stringify(currentColor())};`)}></div> <div class="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 rounded-bl-lg opacity-60 svelte-1jm7o5g"${attr_style(`border-color: ${stringify(currentColor())};`)}></div> <div class="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 rounded-br-lg opacity-60 svelte-1jm7o5g"${attr_style(`border-color: ${stringify(currentColor())};`)}></div></div>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
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
      unit: "%"
    },
    size = 200,
    theme = "dark",
    animated = true,
    showValue = true,
    showLabel = true,
    glowEffect = true
  } = $$props;
  let displayValue = 0;
  let normalizedValue = () => {
    const clamped = Math.max(config.min, Math.min(config.max, displayValue));
    return (clamped - config.min) / (config.max - config.min);
  };
  let gaugeColors = () => {
    const normalized = normalizedValue();
    const warningNorm = (config.warningThreshold - config.min) / (config.max - config.min);
    const criticalNorm = (config.criticalThreshold - config.min) / (config.max - config.min);
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
        angle: angle * Math.PI / 180,
        value: Math.round(tickValue),
        isMain: i % 2 === 0
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
  $$payload.out.push(`<div${attr_class("relative flex items-center justify-center svelte-a0rn1a", void 0, { "glow-effect": glowEffect })}${attr_style(`width: ${size}px; height: ${size}px;`)}${attr("data-theme", theme)}><svg${attr("width", size)}${attr("height", size)}${attr("viewBox", `0 0 ${size} ${size}`)} class="w-full h-full svelte-a0rn1a"${attr_style(`filter: ${glowFilter()}`)}><path${attr("d", `M ${size / 4} ${size * 0.75} A ${size * 0.3} ${size * 0.3} 0 1 1 ${size * 0.75} ${size * 0.75}`)} fill="none"${attr("stroke", backgroundColors())}${attr("stroke-width", size * 0.08)} stroke-linecap="round" class="background-arc svelte-a0rn1a"></path><path${attr("d", `M ${size / 4} ${size * 0.75} A ${size * 0.3} ${size * 0.3} 0 ${normalizedValue() > 0.5 ? 1 : 0} 1 ${size * 0.75} ${size * 0.75}`)} fill="none"${attr("stroke", gaugeColors())}${attr("stroke-width", size * 0.08)} stroke-linecap="round"${attr("stroke-dasharray", `${normalizedValue() * 100} 100`)} class="value-arc svelte-a0rn1a"></path><!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let tick = each_array[$$index];
    $$payload.out.push(`<g${attr("transform", `translate(${size / 2}, ${size / 2}) rotate(${tick.angle * 180 / Math.PI})`)} class="svelte-a0rn1a"><line${attr("x1", size * 0.35)} y1="0"${attr("x2", size * (tick.isMain ? 0.42 : 0.39))} y2="0"${attr("stroke", theme === "dark" ? "#666" : "#999")}${attr("stroke-width", tick.isMain ? 2 : 1)} stroke-linecap="round" class="svelte-a0rn1a"></line>`);
    if (tick.isMain) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<text${attr("x", size * 0.45)} y="0" text-anchor="middle" dominant-baseline="middle"${attr("fill", theme === "dark" ? "#ccc" : "#666")}${attr("font-size", size * 0.08)} font-family="monospace" class="svelte-a0rn1a">${escape_html(tick.value)}</text>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></g>`);
  }
  $$payload.out.push(`<!--]-->`);
  if (showValue) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<text${attr("x", size / 2)}${attr("y", size / 2 - 10)} text-anchor="middle" dominant-baseline="middle"${attr("fill", gaugeColors())}${attr("font-size", size * 0.15)} font-weight="bold" font-family="monospace" class="value-text svelte-a0rn1a">${escape_html(Math.round(displayValue))}</text><text${attr("x", size / 2)}${attr("y", size / 2 + 15)} text-anchor="middle" dominant-baseline="middle"${attr("fill", theme === "dark" ? "#999" : "#666")}${attr("font-size", size * 0.08)} font-family="monospace" class="unit-text svelte-a0rn1a">${escape_html(config.unit)}</text>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  if (showLabel) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<text${attr("x", size / 2)}${attr("y", size * 0.85)} text-anchor="middle" dominant-baseline="middle"${attr("fill", theme === "dark" ? "#ccc" : "#666")}${attr("font-size", size * 0.1)} font-weight="500" class="label-text svelte-a0rn1a">${escape_html(label)}</text>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></svg> `);
  if (theme === "gaming" || theme === "rgb") {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="corner-brackets svelte-a0rn1a"><div class="bracket top-left svelte-a0rn1a"></div> <div class="bracket top-right svelte-a0rn1a"></div> <div class="bracket bottom-left svelte-a0rn1a"></div> <div class="bracket bottom-right svelte-a0rn1a"></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  if (normalizedValue() > 0.8 && animated) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="pulse-overlay svelte-a0rn1a"${attr_style(`background: radial-gradient(circle, ${gaugeColors()}20 0%, transparent 70%);`)}></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div>`);
  pop();
}
function WidgetRenderer($$payload, $$props) {
  push();
  let { widget: config, data } = $$props;
  function getSensorValue(data2, path) {
    if (!data2 || !path) return null;
    try {
      const keys = path.split(".");
      let current = data2;
      for (const key of keys) {
        if (current && typeof current === "object" && key in current) {
          current = current[key];
        } else {
          return null;
        }
      }
      return typeof current === "number" ? current : null;
    } catch (error) {
      console.warn("Failed to extract sensor value:", error);
      return null;
    }
  }
  let sensorValue = getSensorValue(data, config.dataSource || "");
  $$payload.out.push(`<div class="widget-container w-full h-full svelte-16kr09y">`);
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
                    CosmicSensorGauge($$payload, { config, value: sensorValue });
                  } else {
                    $$payload.out.push("<!--[!-->");
                    $$payload.out.push(`<div class="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600"><div class="text-center text-gray-500 dark:text-gray-400"><div class="text-2xl mb-2">⚠️</div> <div class="font-medium">Unknown Widget Type</div> <div class="text-sm">${escape_html(config.type)}</div></div></div>`);
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
  let isSelected = store_get($$store_subs ??= {}, "$dashboardState", dashboardState).selectedWidgets.includes(widget.id);
  let isEditMode = true;
  $$payload.out.push(`<div${attr_class("draggable-widget absolute svelte-150bztk", void 0, { "selected": isSelected, "edit-mode": isEditMode })}${attr_style(` left: ${stringify(widget.position.x)}px; top: ${stringify(widget.position.y)}px; width: ${stringify(widget.size.width)}px; height: ${stringify(widget.size.height)}px; z-index: ${stringify(isSelected ? 10 : 1)}; `)} role="button" tabindex="0"><div class="widget-content h-full w-full">`);
  WidgetRenderer($$payload, { widget, data: null });
  $$payload.out.push(`<!----></div> `);
  if (isSelected && isEditMode) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="selection-outline absolute inset-0 pointer-events-none svelte-150bztk"><div class="selection-border svelte-150bztk"></div> <div class="resize-handles svelte-150bztk"><div class="resize-handle nw svelte-150bztk"></div> <div class="resize-handle ne svelte-150bztk"></div> <div class="resize-handle sw svelte-150bztk"></div> <div class="resize-handle se svelte-150bztk"></div></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  if (isSelected && isEditMode) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="widget-actions absolute -top-8 left-0 flex gap-1 bg-surface-100-800-token rounded px-2 py-1 text-xs svelte-150bztk"><button class="p-1 hover:bg-surface-200-700-token rounded" title="Configure widget">⚙️</button> <button class="p-1 hover:bg-surface-200-700-token rounded text-error-500" title="Delete widget">🗑️</button></div>`);
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
  $$payload.out.push(`<div class="grid-overlay absolute inset-0 pointer-events-none opacity-20 svelte-1gs4wbk"${attr_style(` background-image: linear-gradient(to right, #cbd5e1 1px, transparent 1px), linear-gradient(to bottom, #cbd5e1 1px, transparent 1px); background-size: ${stringify(adjustedGridSize)}px ${stringify(adjustedGridSize)}px; `)}></div>`);
}
function WidgetTemplateSelector($$payload, $$props) {
  push();
  var $$store_subs;
  let onselect = $$props["onselect"];
  const widgetCategories = {
    "system": [
      "circular-gauge-cpu",
      "gauge-gpu",
      "meter-memory",
      "simple-temp"
    ],
    "performance": ["speedometer-perf", "kpi-card-overview"]
  };
  const each_array = ensure_array_like(Object.entries(widgetCategories));
  $$payload.out.push(`<!---->// WidgetTemplateSelector.svelte <div class="w-80 border-r border-gray-200 dark:border-gray-700 overflow-y-auto"><div class="p-6"><h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Choose Widget Type</h3> <!--[-->`);
  for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
    let [category, categoryName] = each_array[$$index_1];
    const categoryTemplates = widgetTemplates.filter((t) => t.category === category);
    if (categoryTemplates.length > 0) {
      $$payload.out.push("<!--[-->");
      const each_array_1 = ensure_array_like(categoryTemplates);
      $$payload.out.push(`<div class="mb-6"><h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">${escape_html(categoryName)}</h4> <div class="space-y-2"><!--[-->`);
      for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
        let template = each_array_1[$$index];
        $$payload.out.push(`<button${attr_class(`w-full p-4 text-left border rounded-lg transition-all hover:border-blue-500 dark:hover:border-blue-400 ${stringify(typeof store_get($$store_subs ??= {}, "$dashboardState", dashboardState).widgetBuilder.selectedWidget === "string" && store_get($$store_subs ??= {}, "$dashboardState", dashboardState).widgetBuilder.selectedWidget === template.id ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50")}`)}><div class="flex items-center gap-3"><div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">${escape_html(template.type.charAt(0).toUpperCase())}</div> <div><div class="font-medium text-gray-900 dark:text-white">${escape_html(template.name)}</div> <div class="text-sm text-gray-500 dark:text-gray-400">${escape_html(template.description)}</div></div></div></button>`);
      }
      $$payload.out.push(`<!--]--></div></div>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--></div></div>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  bind_props($$props, { onselect });
  pop();
}
function WidgetConfigForm($$payload, $$props) {
  push();
  var $$store_subs;
  let widgetConfig = {
    title: ""
  };
  $$payload.out.push(`<!---->// WidgetConfigForm.svelte <div class="flex-1 overflow-y-auto"><div class="p-6">`);
  if (store_get($$store_subs ??= {}, "$dashboardState", dashboardState).widgetBuilder.selectedWidget) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="space-y-6"><h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">General Settings</h3> <div class="grid grid-cols-2 gap-4"><input${attr("value", widgetConfig.title)} type="text" placeholder="Widget Title"/></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<div class="flex items-center justify-center h-full text-gray-500 dark:text-gray-400"><p class="text-lg">Select a widget template to begin configuration</p></div>`);
  }
  $$payload.out.push(`<!--]--></div></div>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
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
            Math.min(100, cpuUsage + (Math.random() - 0.5) * 30)
          ),
          temperature: 35 + cpuUsage * 0.8 + Math.random() * 15
        }))
      },
      gpu: {
        usage: gpuUsage,
        temperature: 50 + gpuUsage * 0.4 + Math.random() * 8,
        memory: Math.max(0, Math.min(100, gpuUsage * 0.8 + Math.random() * 20)),
        fanSpeed: Math.max(
          30,
          Math.min(100, gpuUsage * 0.7 + Math.random() * 20)
        ),
        voltage: 1 + Math.random() * 0.2,
        powerUsage: Math.max(
          50,
          Math.min(320, gpuUsage * 2.5 + Math.random() * 30)
        )
      },
      memory: {
        usage: memoryUsage,
        available: Math.max(0, 32768 * (100 - memoryUsage) / 100),
        total: 32768,
        cached: Math.max(0, 32768 * 0.15 + Math.random() * 1e3),
        swapUsage: Math.max(
          0,
          Math.min(50, memoryUsage * 0.3 + Math.random() * 10)
        )
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
            temperature: 35 + Math.random() * 15
          }
        ]
      },
      network: {
        upload: Math.random() * 50 + 5,
        download: Math.random() * 100 + 10,
        latency: Math.random() * 20 + 5,
        packetLoss: Math.random() * 2
      },
      sensors: {
        case_temp: 25 + Math.random() * 15,
        ambient_temp: 22 + Math.random() * 5,
        humidity: 40 + Math.random() * 20,
        pressure: 1013 + (Math.random() - 0.5) * 20
      }
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
      Math.min(100, data.memory.usage * variation())
    );
    data.cpu.temperature = 35 + data.cpu.usage * 0.8 + Math.random() * 5;
    data.gpu.temperature = 50 + data.gpu.usage * 0.4 + Math.random() * 5;
    data.memory.available = Math.max(
      0,
      data.memory.total * (100 - data.memory.usage) / 100
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
        timestamp
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
function WidgetPreview($$payload, $$props) {
  push();
  MockDataService.getInstance();
  $$payload.out.push(`<!---->// WidgetPreview.svelte <div class="w-80 border-l border-gray-200 dark:border-gray-700 overflow-y-auto"><div class="p-6"><h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preview</h3> <div class="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/30">`);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div> <div class="mt-6 flex gap-3"><button class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">Add Widget</button> <button class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">Cancel</button></div></div></div>`);
  pop();
}
function WidgetBuilder($$payload, $$props) {
  push();
  var $$store_subs;
  function selectTemplate(template) {
    dashboardState.update((state) => ({
      ...state,
      widgetBuilder: { ...state.widgetBuilder, selectedWidget: template.id }
    }));
  }
  if (store_get($$store_subs ??= {}, "$dashboardState", dashboardState).widgetBuilder.isOpen) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex overflow-hidden"><div class="flex-none"><div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700"><h2 class="text-2xl font-bold text-gray-900 dark:text-white">Widget Builder</h2> <button class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" aria-label="Close widget builder"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg></button></div></div> <div class="flex flex-1 overflow-hidden">`);
    WidgetTemplateSelector($$payload, { onselect: selectTemplate });
    $$payload.out.push(`<!----> `);
    WidgetConfigForm($$payload);
    $$payload.out.push(`<!----> `);
    WidgetPreview($$payload);
    $$payload.out.push(`<!----></div></div></div>`);
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
      warning: 70
    },
    {
      label: "GPU Usage",
      value: 82,
      unit: "%",
      icon: "⚡",
      critical: 95,
      warning: 80
    },
    {
      label: "Memory",
      value: 74,
      unit: "%",
      icon: "💾",
      critical: 90,
      warning: 75
    },
    {
      label: "CPU Temp",
      value: 68,
      unit: "°C",
      icon: "🌡️",
      critical: 85,
      warning: 70
    }
  ];
  const each_array = ensure_array_like(demoSensors);
  $$payload.out.push(`<div class="relative w-full h-full overflow-hidden" style="background: radial-gradient(ellipse at center, rgba(20, 160, 230, 0.05) 0%, transparent 70%)">`);
  if (store_get($$store_subs ??= {}, "$dashboardState", dashboardState).isGridVisible) {
    $$payload.out.push("<!--[-->");
    GridOverlay($$payload, {
      gridSize: store_get($$store_subs ??= {}, "$dashboardState", dashboardState).dragState.gridSize,
      zoom: store_get($$store_subs ??= {}, "$dashboardState", dashboardState).zoom
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
      $$payload2.out.push(`<div class="text-center space-y-4"><p class="text-gray-300 font-orbitron">Welcome to the enhanced SenseCanvas dashboard featuring the new Cosmic UI design system.</p> <p class="text-sm text-gray-400">Sci-fi inspired components with SVG-first design and real-time hardware monitoring.</p></div>`);
    },
    $$slots: { default: true }
  });
  $$payload.out.push(`<!----> <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto svelte-16wspn5"><!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let sensor = each_array[$$index];
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
        icon: sensor.icon
      },
      size: 180,
      showFrame: true,
      glowEffect: true
    });
    $$payload.out.push(`<!----></div>`);
  }
  $$payload.out.push(`<!--]--></div> `);
  CosmicPanel($$payload, {
    variant: "default",
    className: "w-full max-w-4xl mx-auto mt-8",
    title: "System Status",
    children: ($$payload2) => {
      $$payload2.out.push(`<div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-center svelte-16wspn5"><div class="space-y-2 svelte-16wspn5"><div class="text-2xl font-orbitron text-green-400">ONLINE</div> <div class="text-sm text-gray-400">Connection Status</div></div> <div class="space-y-2 svelte-16wspn5"><div class="text-2xl font-orbitron text-blue-400">${escape_html(demoSensors.length)}</div> <div class="text-sm text-gray-400">Active Sensors</div></div> <div class="space-y-2 svelte-16wspn5"><div class="text-2xl font-orbitron text-purple-400">COSMIC UI</div> <div class="text-sm text-gray-400">Design System</div></div></div>`);
    },
    $$slots: { default: true }
  });
  $$payload.out.push(`<!----></div> `);
  if (store_get($$store_subs ??= {}, "$currentLayout", currentLayout)) {
    $$payload.out.push("<!--[-->");
    const each_array_1 = ensure_array_like(store_get($$store_subs ??= {}, "$currentLayout", currentLayout).widgets);
    $$payload.out.push(`<!--[-->`);
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let widget = each_array_1[$$index_1];
      DraggableWidget($$payload, { widget });
    }
    $$payload.out.push(`<!--]-->`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->  `);
  if (store_get($$store_subs ??= {}, "$dashboardState", dashboardState).widgetBuilder.isOpen) {
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
  $$payload.out.push(`<div class="dashboard h-screen flex flex-col bg-surface-50-900-token svelte-bi9bz2">`);
  {
    let left = function($$payload2) {
      $$payload2.out.push(`<div class="flex items-center gap-4 svelte-bi9bz2"><h1 class="font-orbitron font-bold text-xl text-white svelte-bi9bz2">SenseCanvas</h1> <div class="text-xs text-blue-400/80 font-orbitron svelte-bi9bz2">Real-time Monitoring</div></div>`);
    }, center = function($$payload2) {
      $$payload2.out.push(`<div class="flex items-center gap-4 svelte-bi9bz2"><button class="cosmic-button px-4 py-2 text-sm font-orbitron text-blue-200 border border-blue-400/30 hover:border-blue-400 transition-colors rounded svelte-bi9bz2">+ Add Widget</button> <button class="cosmic-button px-4 py-2 text-sm font-orbitron text-gray-200 border border-gray-500/30 hover:border-gray-400 transition-colors rounded svelte-bi9bz2">AI Layouts</button></div>`);
    }, right = function($$payload2) {
      $$payload2.out.push(`<div class="flex items-center gap-4 text-xs text-gray-300 svelte-bi9bz2"><span class="flex items-center gap-1 svelte-bi9bz2"><div class="w-1 h-1 bg-green-400 rounded-full animate-pulse svelte-bi9bz2"></div> <span class="font-orbitron svelte-bi9bz2">Connected</span></span> <span class="flex items-center gap-1 svelte-bi9bz2"><div class="w-1 h-1 bg-blue-400 rounded-full svelte-bi9bz2"></div> <span class="font-orbitron svelte-bi9bz2">Theme: ${escape_html(store_get($$store_subs ??= {}, "$currentTheme", currentTheme))}</span></span></div>`);
    };
    CosmicToolbar($$payload, {
      left,
      center,
      right,
      $$slots: { left: true, center: true, right: true }
    });
  }
  $$payload.out.push(`<!----> <div class="flex-1 relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 svelte-bi9bz2"><div class="absolute inset-0 overflow-hidden pointer-events-none svelte-bi9bz2"><div class="absolute inset-0 opacity-10 svelte-bi9bz2" style="background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0); background-size: 20px 20px;"></div> <div class="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full opacity-30 animate-float-1 svelte-bi9bz2"></div> <div class="absolute top-3/4 right-1/4 w-1 h-1 bg-green-400 rounded-full opacity-40 animate-float-2 svelte-bi9bz2"></div> <div class="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-purple-400 rounded-full opacity-20 animate-float-3 svelte-bi9bz2"></div> <div class="absolute inset-0 svelte-bi9bz2"><div class="absolute w-full h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent animate-scan-horizontal svelte-bi9bz2"></div> <div class="absolute h-full w-px bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent animate-scan-vertical svelte-bi9bz2"></div></div></div> `);
  DashboardCanvas($$payload);
  $$payload.out.push(`<!----></div> <div class="status-bar bg-gray-900/80 border-t border-gray-700/50 px-4 py-2 text-xs text-gray-300 backdrop-blur-sm svelte-bi9bz2"><div class="flex items-center justify-between svelte-bi9bz2"><div class="flex items-center gap-4 svelte-bi9bz2"><span class="flex items-center gap-1 svelte-bi9bz2"><div class="w-1 h-1 bg-green-400 rounded-full animate-pulse svelte-bi9bz2"></div> <span class="font-orbitron svelte-bi9bz2">Widgets:</span> <span class="font-mono svelte-bi9bz2">${escape_html(store_get($$store_subs ??= {}, "$currentLayout", currentLayout)?.widgets?.length || 0)}</span></span> <span class="flex items-center gap-1 svelte-bi9bz2"><div class="w-1 h-1 bg-blue-400 rounded-full svelte-bi9bz2"></div> <span class="font-orbitron svelte-bi9bz2">Layout:</span> <span class="font-orbitron svelte-bi9bz2">${escape_html(store_get($$store_subs ??= {}, "$currentLayout", currentLayout)?.name || "Default")}</span></span> <span class="flex items-center gap-1 svelte-bi9bz2"><div class="w-1 h-1 bg-purple-400 rounded-full svelte-bi9bz2"></div> <span class="font-orbitron svelte-bi9bz2">Grid:</span> <span class="font-mono svelte-bi9bz2">${escape_html(store_get($$store_subs ??= {}, "$currentLayout", currentLayout)?.gridSize || 20)}px</span></span></div> <div class="flex items-center gap-4 svelte-bi9bz2"><span class="flex items-center gap-1 svelte-bi9bz2"><div class="w-1 h-1 bg-yellow-400 rounded-full svelte-bi9bz2"></div> <span class="font-orbitron svelte-bi9bz2">Theme:</span> <span class="capitalize font-orbitron svelte-bi9bz2">${escape_html(store_get($$store_subs ??= {}, "$currentTheme", currentTheme))}</span></span> <span class="flex items-center gap-1 svelte-bi9bz2"><div class="w-1 h-1 bg-red-400 rounded-full animate-pulse svelte-bi9bz2"></div> <span class="font-orbitron svelte-bi9bz2">Alerts:</span> <span class="font-mono svelte-bi9bz2">${escape_html(store_get($$store_subs ??= {}, "$alertHistory", alertHistory)?.length || 0)}</span></span></div></div></div> `);
  if (store_get($$store_subs ??= {}, "$dashboardState", dashboardState).aiLayout.isOpen) {
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
    $$payload2.out.push(`<meta name="description" content="Real-time PC hardware monitoring dashboard with customizable widgets and AI-powered layout suggestions"/>`);
  });
  Dashboard($$payload);
}
export {
  _page as default
};
