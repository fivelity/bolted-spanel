import { writable, get } from "svelte/store";
import type { SensorData, HardwareComponent } from "$lib/types/sensor";

// Mock data generator for development with optimized updates
function generateMockSensorData(): SensorData {
  const now = Date.now();
  
  // Base values with slower oscillation
  const baseValues = {
    cpu: 20 + Math.sin(now / 20000) * 15,
    gpu: 30 + Math.sin(now / 16000) * 20,
    memory: 45 + Math.sin(now / 30000) * 10
  };

  // Add small random variations
  const cpuUsage = Math.max(0, Math.min(100, baseValues.cpu + (Math.random() - 0.5) * 5));
  const gpuUsage = Math.max(0, Math.min(100, baseValues.gpu + (Math.random() - 0.5) * 7));
  const memoryUsage = Math.max(0, Math.min(100, baseValues.memory + (Math.random() - 0.5) * 3));

  return {
    cpu: {
      usage: cpuUsage,
      temperature: 35 + cpuUsage * 0.8 + (Math.random() - 0.5) * 5,
      frequency: 3.2 + (Math.random() - 0.5) * 0.4,
      voltage: 1.2 + (Math.random() - 0.5) * 0.05,
      cores: Array.from({ length: 8 }, (_, i) => ({
        id: i,
        usage: Math.max(0, Math.min(100, cpuUsage + (Math.random() - 0.5) * 15)),
        temperature: 35 + cpuUsage * 0.8 + (Math.random() - 0.5) * 7,
      })),
    },
    gpu: {
      usage: gpuUsage,
      temperature: 40 + gpuUsage * 0.6 + (Math.random() - 0.5) * 7,
      memory: Math.max(0, Math.min(100, gpuUsage * 0.7 + (Math.random() - 0.5) * 10)),
      fanSpeed: Math.max(30, Math.min(100, gpuUsage * 0.8 + (Math.random() - 0.5) * 10)),
      voltage: 1.1 + (Math.random() - 0.5) * 0.05,
      powerUsage: Math.max(50, Math.min(300, gpuUsage * 2.5 + (Math.random() - 0.5) * 25)),
    },
    memory: {
      usage: memoryUsage,
      available: Math.max(0, (16384 * (100 - memoryUsage)) / 100),
      total: 16384,
      speed: 3200 + (Math.random() - 0.5) * 200,
    },
    storage: [
      {
        name: "NVMe SSD",
        usage: 65 + (Math.random() - 0.5) * 5,
        temperature: 35 + (Math.random() - 0.5) * 7,
        readSpeed: 500 + (Math.random() - 0.5) * 100,
        writeSpeed: 400 + (Math.random() - 0.5) * 75,
      },
      {
        name: "HDD",
        usage: 45 + (Math.random() - 0.5) * 5,
        temperature: 30 + (Math.random() - 0.5) * 5,
        readSpeed: 120 + (Math.random() - 0.5) * 15,
        writeSpeed: 100 + (Math.random() - 0.5) * 12,
      },
    ],
    fans: {
      "CPU Fan": Math.max(800, 1200 + (Math.random() - 0.5) * 200),
      "GPU Fan 1": Math.max(600, 1000 + (Math.random() - 0.5) * 300),
      "GPU Fan 2": Math.max(600, 1000 + (Math.random() - 0.5) * 300),
      "Case Fan 1": Math.max(500, 800 + (Math.random() - 0.5) * 100),
      "Case Fan 2": Math.max(500, 800 + (Math.random() - 0.5) * 100),
    },
    voltages: {
      "CPU Core": 1.2 + (Math.random() - 0.5) * 0.05,
      "12V Rail": 11.9 + (Math.random() - 0.5) * 0.1,
      "5V Rail": 4.95 + (Math.random() - 0.5) * 0.05,
      "3.3V Rail": 3.28 + (Math.random() - 0.5) * 0.02,
    },
    motherboard: {
      temperature: 32 + (Math.random() - 0.5) * 4,
      voltage: 3.3 + (Math.random() - 0.5) * 0.05,
    },
    network: {
      bytesReceived: Math.random() * 500000,
      bytesSent: Math.random() * 250000,
      packetsReceived: Math.random() * 500,
      packetsSent: Math.random() * 400,
    },
  };
}

// Create writable stores with initial values
const sensorData = writable<SensorData>(generateMockSensorData());
const websocket = writable<WebSocket | null>(null);
const connectionStatus = writable<"disconnected" | "connecting" | "connected" | "error">("disconnected");
const historicalData = writable<SensorData[]>([]);

// Throttle update frequency
let lastUpdate = 0;
const MIN_UPDATE_INTERVAL = 1000; // Minimum time between updates in ms

// WebSocket reconnection settings
const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;
let reconnectDelay = INITIAL_RECONNECT_DELAY;
let reconnectTimeout: NodeJS.Timeout | null = null;
let _mockInterval: NodeJS.Timeout | null = null;

export const sensorStore = {
  data: sensorData,
  status: connectionStatus,
  history: historicalData,

  connect() {
    if (import.meta.env.DEV) {
      this.startMockDataStream();
      return;
    }

    const ws = get(websocket);
    if (ws?.readyState === WebSocket.OPEN) return;

    this.clearReconnectTimeout();
    connectionStatus.set("connecting");

    try {
      const newWebSocket = new WebSocket("ws://localhost:8000/sensors");
      websocket.set(newWebSocket);

      newWebSocket.onopen = () => {
        connectionStatus.set("connected");
        console.log("WebSocket connected to sensor backend");
        reconnectDelay = INITIAL_RECONNECT_DELAY; // Reset delay on successful connection
      };

      newWebSocket.onmessage = (event) => {
        const now = Date.now();
        if (now - lastUpdate < MIN_UPDATE_INTERVAL) return;

        try {
          const rawData: HardwareComponent[] = JSON.parse(event.data);
          const parsedData = this.parseHardwareData(rawData);
          
          // Update stores
          sensorData.set(parsedData);
          historicalData.update((history) => {
            const newHistory = [...history.slice(-99), parsedData];
            // Limit history size
            if (newHistory.length > 100) {
              newHistory.shift();
            }
            return newHistory;
          });
          
          lastUpdate = now;
        } catch (error) {
          console.error("Failed to parse sensor data:", error);
        }
      };

      newWebSocket.onclose = () => {
        connectionStatus.set("disconnected");
        console.log("WebSocket disconnected, attempting to reconnect...");
        this.scheduleReconnect();
      };

      newWebSocket.onerror = (error) => {
        connectionStatus.set("error");
        console.error("WebSocket error:", error);
      };
    } catch (error) {
      connectionStatus.set("error");
      console.error("Failed to create WebSocket connection:", error);
      this.scheduleReconnect();
    }
  },

  disconnect() {
    this.clearReconnectTimeout();
    const ws = get(websocket);
    if (ws) {
      ws.close();
      websocket.set(null);
    }
    connectionStatus.set("disconnected");
  },

  clearReconnectTimeout() {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
  },

  scheduleReconnect() {
    this.clearReconnectTimeout();
    reconnectTimeout = setTimeout(() => {
      this.connect();
      reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
    }, reconnectDelay);
  },

  startMockDataStream() {
    console.log("Starting mock data stream for development");
    connectionStatus.set("connected");

    if (_mockInterval) {
      clearInterval(_mockInterval);
    }

    const updateMockData = () => {
      const now = Date.now();
      if (now - lastUpdate < MIN_UPDATE_INTERVAL) return;

      const mockData = generateMockSensorData();
      sensorData.set(mockData);
      historicalData.update((history) => {
        const newHistory = [...history.slice(-99), mockData];
        if (newHistory.length > 100) {
          newHistory.shift();
        }
        return newHistory;
      });
      
      lastUpdate = now;
    };

    // Update every 2 seconds
    _mockInterval = setInterval(updateMockData, 2000);
    updateMockData(); // Initial update
  },

  parseHardwareData(hardware: HardwareComponent[]): SensorData {
    const parsed: SensorData = {
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
        // Map LibreHardwareMonitorLib sensor types to UI data
        if (component.hardwareType === "Cpu") {
          if (sensor.sensorType === "Load") parsed.cpu.usage = sensor.value;
          if (sensor.sensorType === "Temperature") parsed.cpu.temperature = sensor.value;
          if (sensor.sensorType === "Clock") parsed.cpu.frequency = sensor.value / 1000;
          if (sensor.sensorType === "Voltage") parsed.cpu.voltage = sensor.value;
        }

        if (component.hardwareType.startsWith("Gpu")) {
          if (sensor.sensorType === "Load") parsed.gpu.usage = sensor.value;
          if (sensor.sensorType === "Temperature") parsed.gpu.temperature = sensor.value;
          if (sensor.sensorType === "Fan") parsed.gpu.fanSpeed = sensor.value;
          if (sensor.sensorType === "Voltage") parsed.gpu.voltage = sensor.value;
        }

        if (component.hardwareType === "Memory") {
          if (sensor.sensorType === "Load") parsed.memory.usage = sensor.value;
          if (sensor.sensorType === "Data") {
            if (sensor.name.includes("Available")) parsed.memory.available = sensor.value;
            if (sensor.name.includes("Used")) parsed.memory.total = sensor.value;
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

  getSensorValue(path: string): number {
    const keys = path.split(".");
    let value: any = get(sensorData);

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
