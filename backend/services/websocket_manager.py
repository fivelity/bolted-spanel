"""
WebSocket connection manager for real-time data broadcasting
"""

import json
import logging
from typing import List, Dict, Any
from fastapi import WebSocket

logger = logging.getLogger(__name__)

class WebSocketManager:
	"""Manages WebSocket connections and broadcasting"""
	
	def __init__(self):
		self.active_connections: List[WebSocket] = []
	
	async def connect(self, websocket: WebSocket):
		"""Accept a new WebSocket connection"""
		await websocket.accept()
		self.active_connections.append(websocket)
		logger.info(f"WebSocket client connected. Total connections: {len(self.active_connections)}")
	
	def disconnect(self, websocket: WebSocket):
		"""Remove a WebSocket connection"""
		if websocket in self.active_connections:
			self.active_connections.remove(websocket)
			logger.info(f"WebSocket client disconnected. Total connections: {len(self.active_connections)}")
	
	async def send_personal_message(self, message: str, websocket: WebSocket):
		"""Send a message to a specific WebSocket connection"""
		try:
			await websocket.send_text(message)
		except Exception as e:
			logger.error(f"Error sending personal message: {e}")
			self.disconnect(websocket)
	
	async def broadcast(self, data: Dict[str, Any]):
		"""Broadcast data to all connected WebSocket clients"""
		if not self.active_connections:
			return
		
		message = json.dumps(data, default=str)
		disconnected = []
		
		for connection in self.active_connections:
			try:
				await connection.send_text(message)
			except Exception as e:
				logger.error(f"Error broadcasting to client: {e}")
				disconnected.append(connection)
		
		# Remove disconnected clients
		for connection in disconnected:
			self.disconnect(connection)
	
	async def broadcast_alert(self, alert: Dict[str, Any]):
		"""Broadcast an alert to all connected clients"""
		alert_message = {
			"type": "alert",
			"data": alert
		}
		await self.broadcast(alert_message)
	
	def get_connection_count(self) -> int:
		"""Get the number of active connections"""
		return len(self.active_connections)