import { writable, get } from "svelte/store";
import type { SensorData, HardwareComponent } from "$lib/types/sensor";

// Mock data generator for development
function generateMockSensorData(): SensorData {
  const now = Date.now();
  const cpuUsage = 20 + Math.sin(now / 10000) * 15 + Math.random() * 10;
  const gpuUsage = 30 + Math.sin(now / 8000) * 20 + Math.random() * 15;
  const memoryUsage = 45 + Math.sin(now / 15000) * 10 + Math.random() * 5;

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
      "GPU Fan 1": Math.max(600, 1000 + Math.random() * 600),
      "GPU Fan 2": Math.max(600, 1000 + Math.random() * 600),
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
      bytesReceived: Math.random() * 1000000,
      bytesSent: Math.random() * 500000,
      packetsReceived: Math.random() * 1000,
      packetsSent: Math.random() * 800,
    },
  };
}

// Create writable stores
const sensorData = writable<SensorData>(generateMockSensorData());
const websocket = writable<WebSocket | null>(null);
const connectionStatus = writable<
  "disconnected" | "connecting" | "connected" | "error"
>("disconnected");
const historicalData = writable<SensorData[]>([]);
let _mockInterval: NodeJS.Timeout | null = null;

export const sensorStore = {
  // Export stores for reactive access
  data: sensorData,
  status: connectionStatus,
  history: historicalData,

  connect() {
    // In development mode, use mock data immediately
    if (import.meta.env.DEV) {
      this.startMockDataStream();
      return;
    }

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
          const rawData: HardwareComponent[] = JSON.parse(event.data);
          const parsedData = this.parseHardwareData(rawData);
          sensorData.set(parsedData);

          // Add to historical data (keep last 100 points)
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

        // Auto-reconnect with exponential backoff
        setTimeout(() => this.connect(), 5000);
      };

      newWebSocket.onerror = (error) => {
        connectionStatus.set("error");
        console.error("WebSocket error:", error);
      };
    } catch (error) {
      connectionStatus.set("error");
      console.error("Failed to create WebSocket connection:", error);

      // Fall back to mock data for development
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

    // Clear any existing mock interval
    if (_mockInterval) {
      clearInterval(_mockInterval);
    }

    const updateMockData = () => {
      const mockData = generateMockSensorData();
      sensorData.set(mockData);
      historicalData.update((history) => [...history.slice(-99), mockData]);
    };

    // Update every 2 seconds
    _mockInterval = setInterval(updateMockData, 2000);

    // Initial data update
    updateMockData();
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
          if (sensor.sensorType === "Temperature")
            parsed.cpu.temperature = sensor.value;
          if (sensor.sensorType === "Clock")
            parsed.cpu.frequency = sensor.value / 1000; // Convert to GHz
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
