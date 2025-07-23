"""
Application configuration settings
"""

import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
	"""Application settings"""
	
	# Server configuration
	HOST: str = "0.0.0.0"
	PORT: int = 8000
	DEBUG: bool = True
	
	# CORS configuration
	CORS_ORIGINS: List[str] = [
		"http://localhost:3000",
		"http://localhost:5173",
		"http://127.0.0.1:3000",
		"http://127.0.0.1:5173"
	]
	
	# Database configuration
	DATABASE_URL: str = "sqlite+aiosqlite:///./hardware_monitor.db"
	
	# Hardware monitoring configuration
	MONITORING_INTERVAL: float = 1.0  # seconds
	WEBSOCKET_UPDATE_INTERVAL: float = 1.0  # seconds
	HISTORY_RETENTION_DAYS: int = 7
	
	# Alert thresholds
	CPU_TEMP_THRESHOLD: float = 80.0  # Celsius
	GPU_TEMP_THRESHOLD: float = 85.0  # Celsius
	CPU_USAGE_THRESHOLD: float = 90.0  # Percentage
	GPU_USAGE_THRESHOLD: float = 95.0  # Percentage
	MEMORY_USAGE_THRESHOLD: float = 90.0  # Percentage
	DISK_USAGE_THRESHOLD: float = 90.0  # Percentage
	
	class Config:
		env_file = ".env"
		case_sensitive = True

# Global settings instance
settings = Settings()