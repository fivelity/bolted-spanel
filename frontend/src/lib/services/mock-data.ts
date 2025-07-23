import type { HardwareData, SystemInfo } from '../types/hardware'

// Mock hardware data for design review
export const mockSystemInfo: SystemInfo = {
	cpu: {
		name: 'Intel Core i7-12700K',
		cores: 12,
		threads: 20,
		base_frequency: 3.6,
		max_frequency: 5.0,
		architecture: 'x86_64'
	},
	gpu: {
		name: 'NVIDIA GeForce RTX 4080',
		memory: 16384,
		driver_version: '546.17',
		cuda_version: '12.3'
	},
	memory: {
		total: 32768,
		type: 'DDR4',
		speed: 3200
	},
	storage: [
		{
			device: 'Samsung SSD 980 PRO',
			total: 1000,
			type: 'NVMe SSD',
			interface: 'PCIe 4.0'
		},
		{
			device: 'Seagate Barracuda',
			total: 2000,
			type: 'HDD',
			interface: 'SATA III'
		}
	],
	motherboard: {
		manufacturer: 'ASUS',
		model: 'ROG STRIX Z690-E',
		bios_version: '2103'
	},
	os: {
		name: 'Windows 11 Pro',
		version: '22H2',
		build: '22621.2715'
	}
}

// Generate realistic mock hardware data
export function generateMockHardwareData(): HardwareData {
	const now = Date.now()
	const cpuUsage = 25 + Math.sin(now / 10000) * 15 + Math.random() * 10
	const gpuUsage = 45 + Math.sin(now / 8000) * 20 + Math.random() * 15
	const memoryUsage = 60 + Math.sin(now / 15000) * 10 + Math.random() * 5
	
	return {
		timestamp: now,
		cpu: {
			usage: Math.max(0, Math.min(100, cpuUsage)),
			temperature: 45 + cpuUsage * 0.5 + Math.random() * 5,
			frequency: 3.8 + Math.random() * 0.4,
			cores: Array.from({ length: 12 }, (_, i) => ({
				core: i,
				usage: Math.max(0, Math.min(100, cpuUsage + (Math.random() - 0.5) * 20)),
				temperature: 40 + cpuUsage * 0.6 + Math.random() * 8
			}))
		},
		gpu: {
			usage: Math.max(0, Math.min(100, gpuUsage)),
			temperature: 50 + gpuUsage * 0.4 + Math.random() * 8,
			memory_usage: Math.max(0, Math.min(100, gpuUsage * 0.8 + Math.random() * 20)),
			power_usage: Math.max(50, Math.min(320, gpuUsage * 2.5 + Math.random() * 30)),
			fan_speed: Math.max(30, Math.min(100, gpuUsage * 0.7 + Math.random() * 15))
		},
		memory: {
			usage: Math.max(0, Math.min(100, memoryUsage)),
			available: Math.max(0, 32768 * (100 - memoryUsage) / 100),
			cached: Math.max(0, 32768 * 0.15 + Math.random() * 1000),
			swap_usage: Math.max(0, Math.min(50, memoryUsage * 0.3 + Math.random() * 10))
		},
		storage: [
			{
				device: 'C:',
				usage: 65 + Math.random() * 5,
				read_speed: Math.random() * 500 + 100,
				write_speed: Math.random() * 400 + 80,
				temperature: 35 + Math.random() * 10
			},
			{
				device: 'D:',
				usage: 45 + Math.random() * 5,
				read_speed: Math.random() * 150 + 50,
				write_speed: Math.random() * 120 + 40,
				temperature: 32 + Math.random() * 8
			}
		],
		network: {
			bytes_sent: Math.random() * 1000000,
			bytes_recv: Math.random() * 5000000,
			packets_sent: Math.random() * 1000,
			packets_recv: Math.random() * 2000
		},
		sensors: {
			temperatures: [
				{ name: 'CPU Package', value: 45 + cpuUsage * 0.5 + Math.random() * 5 },
				{ name: 'GPU Core', value: 50 + gpuUsage * 0.4 + Math.random() * 8 },
				{ name: 'Motherboard', value: 35 + Math.random() * 5 },
				{ name: 'SSD', value: 35 + Math.random() * 10 }
			],
			fans: [
				{ name: 'CPU Fan', value: Math.max(800, cpuUsage * 20 + Math.random() * 200) },
				{ name: 'GPU Fan 1', value: Math.max(600, gpuUsage * 15 + Math.random() * 300) },
				{ name: 'GPU Fan 2', value: Math.max(600, gpuUsage * 15 + Math.random() * 300) },
				{ name: 'Case Fan 1', value: Math.max(500, 800 + Math.random() * 200) },
				{ name: 'Case Fan 2', value: Math.max(500, 800 + Math.random() * 200) }
			],
			voltages: [
				{ name: 'CPU Core', value: 1.2 + Math.random() * 0.1 },
				{ name: '12V Rail', value: 11.9 + Math.random() * 0.2 },
				{ name: '5V Rail', value: 4.95 + Math.random() * 0.1 },
				{ name: '3.3V Rail', value: 3.28 + Math.random() * 0.05 }
			]
		}
	}
}

// Historical data for charts
export function generateMockHistoricalData(points: number = 50): HardwareData[] {
	const data: HardwareData[] = []
	const now = Date.now()
	
	for (let i = points - 1; i >= 0; i--) {
		const timestamp = now - (i * 2000) // 2 second intervals
		const baseData = generateMockHardwareData()
		data.push({
			...baseData,
			timestamp
		})
	}
	
	return data
}