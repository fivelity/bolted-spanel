"""
SQLAlchemy database models
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, JSON
from sqlalchemy.sql import func

from .database import Base

class HardwareDataRecord(Base):
	"""Hardware data record for historical storage"""
	__tablename__ = "hardware_data"
	
	id = Column(Integer, primary_key=True, index=True)
	timestamp = Column(DateTime, default=func.now(), index=True)
	cpu_usage = Column(Float)
	cpu_temperature = Column(Float)
	cpu_frequency = Column(Float)
	gpu_usage = Column(Float)
	gpu_temperature = Column(Float)
	gpu_memory_usage = Column(Float)
	memory_usage = Column(Float)
	memory_available = Column(Float)
	network_bytes_sent = Column(Integer)
	network_bytes_recv = Column(Integer)
	raw_data = Column(JSON)  # Store complete data as JSON

class AlertRecord(Base):
	"""Alert record for storing system alerts"""
	__tablename__ = "alerts"
	
	id = Column(Integer, primary_key=True, index=True)
	alert_id = Column(String, unique=True, index=True)
	timestamp = Column(DateTime, default=func.now(), index=True)
	metric = Column(String, index=True)
	value = Column(Float)
	threshold = Column(Float)
	severity = Column(String, index=True)
	message = Column(Text)
	acknowledged = Column(Boolean, default=False)

class DashboardLayout(Base):
	"""Dashboard layout configuration"""
	__tablename__ = "dashboard_layouts"
	
	id = Column(Integer, primary_key=True, index=True)
	name = Column(String, unique=True, index=True)
	layout_data = Column(JSON)
	is_default = Column(Boolean, default=False)
	created_at = Column(DateTime, default=func.now())
	updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class UserSettings(Base):
	"""User settings and preferences"""
	__tablename__ = "user_settings"
	
	id = Column(Integer, primary_key=True, index=True)
	key = Column(String, unique=True, index=True)
	value = Column(JSON)
	updated_at = Column(DateTime, default=func.now(), onupdate=func.now())