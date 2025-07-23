export interface SensorReading {
  timestamp: number;
  value: number;
  unit: string;
  name: string;
  sensorType:
    | "Temperature"
    | "Load"
    | "Fan"
    | "Voltage"
    | "Clock"
    | "Data"
    | "Control";
  hardwareType:
    | "Cpu"
    | "GpuNvidia"
    | "GpuAmd"
    | "Memory"
    | "Motherboard"
    | "Storage";
  identifier: string;
}

export interface HardwareComponent {
  name: string;
  hardwareType: string;
  sensors: SensorReading[];
}

export interface SensorData {
  cpu: {
    usage: number;
    temperature: number;
    frequency: number;
    voltage: number;
    cores: Array<{
      id: number;
      usage: number;
      temperature: number;
    }>;
  };
  gpu: {
    usage: number;
    temperature: number;
    memory: number;
    fanSpeed: number;
    voltage: number;
    powerUsage: number;
  };
  memory: {
    usage: number;
    available: number;
    total: number;
    speed: number;
  };
  storage: Array<{
    name: string;
    usage: number;
    temperature: number;
    readSpeed: number;
    writeSpeed: number;
  }>;
  fans: Record<string, number>;
  voltages: Record<string, number>;
  motherboard: {
    temperature: number;
    voltage: number;
  };
  network: {
    bytesReceived: number;
    bytesSent: number;
    packetsReceived: number;
    packetsSent: number;
  };
}

export interface AlertCondition {
  id: string;
  name: string;
  sensorPath: string;
  operator: "greater" | "less" | "equal";
  threshold: number;
  unit: string;
  enabled: boolean;
  triggered: boolean;
}

export interface Alert {
  id: string;
  condition: string;
  value: number;
  timestamp: number;
  acknowledged: boolean;
}
