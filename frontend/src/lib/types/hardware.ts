export interface HardwareData {
  cpu: { usage: number; temperature: number; frequency: number; voltage: number };
  gpu: { usage: number; temperature: number; memory: number; fanSpeed: number; voltage: number };
  memory: { usage: number; available: number; total: number };
  storage: { usage: number; temperature: number; readSpeed: number; writeSpeed: number };
  fans: Record<string, number>;
  voltages: Record<string, number>;
  motherboard: { temperature: number; voltage: number };
}

export interface SystemInfo {
  // Add properties as needed
} 