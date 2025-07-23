"""
Pydantic models for hardware data validation and serialization
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class CPUCore(BaseModel):
    """Individual CPU core data"""

    core: int = Field(..., description="Core number")
    usage: float = Field(..., ge=0, le=100, description="CPU usage percentage")
    temperature: Optional[float] = Field(
        None, description="Core temperature in Celsius"
    )


class CPUData(BaseModel):
    """CPU monitoring data"""

    usage: float = Field(..., ge=0, le=100, description="Overall CPU usage percentage")
    temperature: Optional[float] = Field(None, description="CPU temperature in Celsius")
    frequency: float = Field(..., gt=0, description="Current CPU frequency in GHz")
    cores: List[CPUCore] = Field(default_factory=list, description="Per-core data")


class GPUData(BaseModel):
    """GPU monitoring data"""

    usage: float = Field(..., ge=0, le=100, description="GPU usage percentage")
    temperature: Optional[float] = Field(None, description="GPU temperature in Celsius")
    memory_usage: float = Field(
        ..., ge=0, le=100, description="GPU memory usage percentage"
    )
    power_usage: Optional[float] = Field(None, description="GPU power usage in watts")
    fan_speed: Optional[float] = Field(
        None, ge=0, le=100, description="GPU fan speed percentage"
    )


class MemoryData(BaseModel):
    """Memory monitoring data"""

    usage: float = Field(..., ge=0, le=100, description="Memory usage percentage")
    available: float = Field(..., ge=0, description="Available memory in MB")
    cached: float = Field(..., ge=0, description="Cached memory in MB")
    swap_usage: float = Field(..., ge=0, le=100, description="Swap usage percentage")


class StorageDevice(BaseModel):
    """Storage device data"""

    device: str = Field(..., description="Device name")
    usage: float = Field(..., ge=0, le=100, description="Storage usage percentage")
    read_speed: float = Field(..., ge=0, description="Read speed in MB/s")
    write_speed: float = Field(..., ge=0, description="Write speed in MB/s")
    temperature: Optional[float] = Field(
        None, description="Storage temperature in Celsius"
    )


class NetworkData(BaseModel):
    """Network monitoring data"""

    bytes_sent: int = Field(..., ge=0, description="Bytes sent")
    bytes_recv: int = Field(..., ge=0, description="Bytes received")
    packets_sent: int = Field(..., ge=0, description="Packets sent")
    packets_recv: int = Field(..., ge=0, description="Packets received")


class SensorReading(BaseModel):
    """Generic sensor reading"""

    name: str = Field(..., description="Sensor name")
    value: float = Field(..., description="Sensor value")


class SensorData(BaseModel):
    """System sensor data"""

    temperatures: List[SensorReading] = Field(default_factory=list)
    fans: List[SensorReading] = Field(default_factory=list)
    voltages: List[SensorReading] = Field(default_factory=list)


class HardwareData(BaseModel):
    """Complete hardware monitoring data"""

    model_config = ConfigDict(json_encoders={datetime: lambda v: v.isoformat()})

    timestamp: datetime = Field(default_factory=datetime.now)
    cpu: CPUData
    gpu: Optional[GPUData] = None
    memory: MemoryData
    storage: List[StorageDevice] = Field(default_factory=list)
    network: NetworkData
    sensors: SensorData = Field(default_factory=SensorData)


class SystemInfo(BaseModel):
    """System information"""

    cpu: Dict[str, Any] = Field(default_factory=dict)
    gpu: Optional[Dict[str, Any]] = None
    memory: Dict[str, Any] = Field(default_factory=dict)
    storage: List[Dict[str, Any]] = Field(default_factory=list)
    motherboard: Dict[str, Any] = Field(default_factory=dict)
    os: Dict[str, Any] = Field(default_factory=dict)


class AlertThreshold(BaseModel):
    """Alert threshold configuration"""

    metric: str = Field(..., description="Metric name")
    threshold: float = Field(..., description="Threshold value")
    enabled: bool = Field(True, description="Whether alert is enabled")
    comparison: str = Field(
        "greater", description="Comparison operator (greater, less)"
    )


class Alert(BaseModel):
    """System alert"""

    id: str = Field(..., description="Alert ID")
    timestamp: datetime = Field(default_factory=datetime.now)
    metric: str = Field(..., description="Metric that triggered the alert")
    value: float = Field(..., description="Current value")
    threshold: float = Field(..., description="Threshold value")
    severity: str = Field(..., description="Alert severity (info, warning, critical)")
    message: str = Field(..., description="Alert message")
    acknowledged: bool = Field(False, description="Whether alert is acknowledged")
