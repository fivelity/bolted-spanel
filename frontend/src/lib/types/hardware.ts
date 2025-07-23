export interface CoreData {
  core: number;
  usage: number;
  temperature: number;
}

export interface StorageDevice {
  device: string;
  usage: number;
  readSpeed: number;
  writeSpeed: number;
  temperature: number;
}

export interface HardwareData {
  timestamp?: number;
  cpu: { 
    usage: number; 
    temperature: number; 
    frequency: number; 
    voltage: number;
    cores?: CoreData[];
  };
  gpu: { 
    usage: number; 
    temperature: number; 
    memory: number; 
    fanSpeed: number; 
    voltage: number;
    powerUsage?: number;
  };
  memory: { 
    usage: number; 
    available: number; 
    total: number;
    cached?: number;
    swapUsage?: number;
  };
  storage: { 
    usage: number; 
    temperature: number; 
    readSpeed: number; 
    writeSpeed: number;
    devices?: StorageDevice[];
  };
  network?: {
    upload: number;
    download: number;
    latency: number;
    packetLoss: number;
  };
  sensors?: {
    case_temp: number;
    ambient_temp: number;
    humidity: number;
    pressure: number;
  };
  fans?: Record<string, number>;
  voltages?: Record<string, number>;
  motherboard?: { temperature: number; voltage: number };
}

export interface SystemInfo {
  // Add properties as needed
} 