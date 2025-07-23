import type { HardwareData } from '../types/hardware'
import { writable } from 'svelte/store'

export class WebSocketService {
	private ws: WebSocket | null = null
	private url: string
	private dataCallbacks: ((data: HardwareData) => void)[] = []
	private connectionState = writable<'disconnected' | 'connecting' | 'connected'>('disconnected')
	private reconnectTimer: number | null = null
	private reconnectAttempts = 0
	private maxReconnectAttempts = 5
	private reconnectDelay = 1000

	constructor(url: string) {
		this.url = url
	}

	connect(): void {
		if (this.ws?.readyState === WebSocket.OPEN) {
			return
		}

		this.connectionState.set('connecting')
		this.ws = new WebSocket(this.url)

		this.ws.onopen = () => {
			this.connectionState.set('connected')
			this.reconnectAttempts = 0
		}

		this.ws.onmessage = (event) => {
			try {
				const data: HardwareData = JSON.parse(event.data)
				this.dataCallbacks.forEach(callback => callback(data))
			} catch (error) {
				console.error('Failed to parse WebSocket message:', error)
			}
		}

		this.ws.onclose = () => {
			this.connectionState.set('disconnected')
			this.scheduleReconnect()
		}

		this.ws.onerror = (error) => {
			console.error('WebSocket error:', error)
		}
	}

	disconnect(): void {
		if (this.ws) {
			this.ws.close()
			this.ws = null
		}
		
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer)
			this.reconnectTimer = null
		}
		
		this.connectionState.set('disconnected')
	}

	private cleanup(): void {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer)
			this.reconnectTimer = null
		}
	}

	private scheduleReconnect(): void {
		if (this.reconnectAttempts >= this.maxReconnectAttempts) {
			console.error('Max reconnection attempts reached')
			return
		}

		this.reconnectTimer = window.setTimeout(() => {
			this.reconnectAttempts++
			this.connect()
		}, this.reconnectDelay * Math.pow(2, this.reconnectAttempts))
	}

	onData(callback: (data: HardwareData) => void): () => void {
		this.dataCallbacks.push(callback)
		
		return () => {
			const index = this.dataCallbacks.indexOf(callback)
			if (index > -1) {
				this.dataCallbacks.splice(index, 1)
			}
		}
	}

	getConnectionState() {
		return this.connectionState
	}
}