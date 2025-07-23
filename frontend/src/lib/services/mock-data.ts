import type { HardwareData } from '../types/hardware';

// Mock sensor data generation for development
export class MockDataService {
        private static instance: MockDataService;
        private baseData: HardwareData | null = null;
        private updateInterval: number | null = null;
        private subscribers: ((data: HardwareData) => void)[] = [];

        static getInstance(): MockDataService {
                if (!MockDataService.instance) {
                        MockDataService.instance = new MockDataService();
                }
                return MockDataService.instance;
        }

        private constructor() {
                this.generateBaseData();
        }

        private generateBaseData(): void {
                const cpuUsage = Math.random() * 80 + 10; // 10-90%
                const gpuUsage = Math.random() * 70 + 20; // 20-90%
                const memoryUsage = Math.random() * 60 + 30; // 30-90%

                this.baseData = {
                        cpu: {
                                usage: cpuUsage,
                                temperature: 35 + cpuUsage * 0.8 + Math.random() * 15,
                                frequency: 3.8 + Math.random() * 0.4,
                                voltage: 1.2 + Math.random() * 0.3,
                                cores: Array.from({ length: 12 }, (_, i) => ({
                                        core: i,
                                        usage: Math.max(0, Math.min(100, cpuUsage + (Math.random() - 0.5) * 30)),
                                        temperature: 35 + cpuUsage * 0.8 + Math.random() * 15
                                }))
                        },
                        gpu: {
                                usage: gpuUsage,
                                temperature: 50 + gpuUsage * 0.4 + Math.random() * 8,
                                memory: Math.max(0, Math.min(100, gpuUsage * 0.8 + Math.random() * 20)),
                                fanSpeed: Math.max(30, Math.min(100, gpuUsage * 0.7 + Math.random() * 20)),
                                voltage: 1.0 + Math.random() * 0.2,
                                powerUsage: Math.max(50, Math.min(320, gpuUsage * 2.5 + Math.random() * 30))
                        },
                        memory: {
                                usage: memoryUsage,
                                available: Math.max(0, 32768 * (100 - memoryUsage) / 100),
                                total: 32768,
                                cached: Math.max(0, 32768 * 0.15 + Math.random() * 1000),
                                swapUsage: Math.max(0, Math.min(50, memoryUsage * 0.3 + Math.random() * 10))
                        },
                        storage: {
                                usage: Math.random() * 60 + 20,
                                temperature: 35 + Math.random() * 15,
                                readSpeed: 400 + Math.random() * 100,
                                writeSpeed: 300 + Math.random() * 150,
                                devices: [
                                        {
                                                device: 'NVMe SSD',
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
        private generateRealisticData(): HardwareData {
                if (!this.baseData) {
                        this.generateBaseData();
                }

                const data = { ...this.baseData! };

                // Apply small random variations (±5%)
                const variation = () => 0.95 + Math.random() * 0.1;
                
                data.cpu.usage = Math.max(0, Math.min(100, data.cpu.usage * variation()));
                data.gpu.usage = Math.max(0, Math.min(100, data.gpu.usage * variation()));
                data.memory.usage = Math.max(0, Math.min(100, data.memory.usage * variation()));

                // Update temperatures based on usage
                data.cpu.temperature = 35 + data.cpu.usage * 0.8 + Math.random() * 5;
                data.gpu.temperature = 50 + data.gpu.usage * 0.4 + Math.random() * 5;

                // Update memory available based on usage
                data.memory.available = Math.max(0, data.memory.total * (100 - data.memory.usage) / 100);

                return data;
        }

        // Get current hardware data
        getCurrentData(): HardwareData {
                return this.generateRealisticData();
        }

        // Subscribe to data updates
        subscribe(callback: (data: HardwareData) => void): () => void {
                this.subscribers.push(callback);

                // Start auto-updates if this is the first subscriber
                if (this.subscribers.length === 1) {
                        this.startAutoUpdate();
                }

                // Return unsubscribe function
                return () => {
                        const index = this.subscribers.indexOf(callback);
                        if (index > -1) {
                                this.subscribers.splice(index, 1);
                        }

                        // Stop auto-updates if no more subscribers
                        if (this.subscribers.length === 0) {
                                this.stopAutoUpdate();
                        }
                };
        }

        // Start automatic data updates
        private startAutoUpdate(): void {
                if (this.updateInterval !== null) return;

                this.updateInterval = window.setInterval(() => {
                        const data = this.generateRealisticData();
                        this.subscribers.forEach(callback => callback(data));
                }, 1000); // Update every second
        }

        // Stop automatic data updates
        private stopAutoUpdate(): void {
                if (this.updateInterval !== null) {
                        clearInterval(this.updateInterval);
                        this.updateInterval = null;
                }
        }

        // Generate historical data for charts
        generateHistoricalData(hours: number = 24): HardwareData[] {
                const history: HardwareData[] = [];
                const baseTime = Date.now() - (hours * 60 * 60 * 1000);

                for (let i = 0; i < hours * 60; i++) { // One data point per minute
                        const baseData = this.generateRealisticData();
                        const timestamp = baseTime + (i * 60 * 1000);
                        
                        history.push({
                                ...baseData,
                                timestamp
                        });
                }

                return history;
        }

        // Simulate stress test data
        generateStressTestData(): HardwareData {
                const baseData = this.generateRealisticData();
                
                // High usage scenario
                baseData.cpu.usage = 85 + Math.random() * 15;
                baseData.gpu.usage = 90 + Math.random() * 10;
                baseData.memory.usage = 80 + Math.random() * 15;
                
                // Higher temperatures due to stress
                baseData.cpu.temperature = 75 + Math.random() * 15;
                baseData.gpu.temperature = 80 + Math.random() * 10;
                
                return baseData;
        }

        // Clean up resources
        destroy(): void {
                this.stopAutoUpdate();
                this.subscribers = [];
        }
}