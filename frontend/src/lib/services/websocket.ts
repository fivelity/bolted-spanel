import { writable } from 'svelte/store';
import type { HardwareData } from '../types/hardware';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// Connection status store
export const connectionStatus = writable<ConnectionStatus>('disconnected');

// Hardware data store  
export const hardwareData = writable<HardwareData | null>(null);

// WebSocket connection
let ws: WebSocket | null = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = 3000;

export class WebSocketService {
	private static instance: WebSocketService;
	
	static getInstance(): WebSocketService {
		if (!WebSocketService.instance) {
			WebSocketService.instance = new WebSocketService();
		}
		return WebSocketService.instance;
	}

	connect(url: string = 'ws://localhost:8000/ws'): void {
		if (ws?.readyState === WebSocket.OPEN) {
			return; // Already connected
		}

		connectionStatus.set('connecting');
		
		try {
			ws = new WebSocket(url);
			
			ws.onopen = () => {
				console.log('WebSocket connected');
				connectionStatus.set('connected');
				reconnectAttempts = 0;
			};

			ws.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data) as HardwareData;
					hardwareData.set(data);
				} catch (error) {
					console.error('Failed to parse WebSocket message:', error);
				}
			};

			ws.onclose = () => {
				console.log('WebSocket disconnected');
				connectionStatus.set('disconnected');
				this.handleReconnect(url);
			};

			ws.onerror = (error) => {
				console.error('WebSocket error:', error);
				connectionStatus.set('error');
			};

		} catch (error) {
			console.error('Failed to create WebSocket connection:', error);
			connectionStatus.set('error');
		}
	}

	private handleReconnect(url: string): void {
		if (reconnectAttempts < maxReconnectAttempts) {
			reconnectAttempts++;
			console.log(`Attempting to reconnect... (${reconnectAttempts}/${maxReconnectAttempts})`);
			
			setTimeout(() => {
				this.connect(url);
			}, reconnectDelay);
		} else {
			console.error('Max reconnection attempts reached');
			connectionStatus.set('error');
		}
	}

	disconnect(): void {
		if (ws) {
			ws.close();
			ws = null;
		}
		connectionStatus.set('disconnected');
	}

	send(data: any): void {
		if (ws?.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify(data));
		} else {
			console.warn('WebSocket is not connected');
		}
	}
}

// Auto-connect when in browser
if (typeof window !== 'undefined') {
	const wsService = WebSocketService.getInstance();
	wsService.connect();
}