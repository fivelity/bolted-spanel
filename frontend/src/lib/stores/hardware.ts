import { writable, derived } from 'svelte/store'
import type { HardwareData, SystemInfo } from '../types/hardware'
 
 // Hardware data store
 export const hardwareData = writable<HardwareData | null>(null)
 export const systemInfo = writable<SystemInfo | null>(null)
 export const historicalData = writable<HardwareData[]>([])
 
 // Derived stores for specific metrics
 export const cpuMetrics = derived(hardwareData, ($data) => $data?.cpu)