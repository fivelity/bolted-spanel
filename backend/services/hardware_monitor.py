"""
Hardware monitoring service using psutil, GPUtil, and py-cpuinfo
"""

import asyncio
import logging
import psutil
import platform
from datetime import datetime
from typing import Optional, List, Dict, Any

try:
	import GPUtil
	GPU_AVAILABLE = True
except ImportError:
	GPU_AVAILABLE = False
	logging.warning("GPUtil not available - GPU monitoring disabled")

try:
	import cpuinfo
	CPUINFO_AVAILABLE = True
except ImportError:
	CPUINFO_AVAILABLE = False
	logging.warning("py-cpuinfo not available - detailed CPU info disabled")

import clr
clr.AddReference('LibreHardwareMonitorLib.dll')
from LibreHardwareMonitor import Hardware

from models.hardware import (
	HardwareData, CPUData, GPUData, MemoryData, StorageDevice,
	NetworkData, SensorData, SensorReading, SystemInfo, CPUCore
)
from config.settings import settings

logger = logging.getLogger(__name__)

class HardwareMonitor:
	"""Hardware monitoring service"""
	
	def __init__(self):
		self._running = False
		self._task: Optional[asyncio.Task] = None
		self._current_data: Optional[HardwareData] = None
		self._system_info: Optional[SystemInfo] = None
		
		# Initialize network counters
		self._last_network_io = psutil.net_io_counters()
		self._last_network_time = datetime.now()
	
	async def start(self):
		"""Start hardware monitoring"""
		if self._running:
			return
		
		logger.info("Starting hardware monitoring service")
		self._running = True
		
		# Get system information once
		self._system_info = await self._get_system_info()
		
		# Start monitoring task
		self._task = asyncio.create_task(self._monitor_loop())
	
	async def stop(self):
		"""Stop hardware monitoring"""
		if not self._running:
			return
		
		logger.info("Stopping hardware monitoring service")
		self._running = False
		
		if self._task:
			self._task.cancel()
			try:
				await self._task
			except asyncio.CancelledError:
				pass
	
	def is_running(self) -> bool:
		"""Check if monitoring is running"""
		return self._running
	
	async def get_current_data(self) -> Optional[HardwareData]:
		"""Get current hardware data"""
		return self._current_data
	
	async def get_system_info(self) -> Optional[SystemInfo]:
		"""Get system information"""
		return self._system_info
	
	async def _monitor_loop(self):
		"""Main monitoring loop"""
		while self._running:
			try:
				self._current_data = await self._collect_hardware_data()
				await asyncio.sleep(settings.MONITORING_INTERVAL)
			except asyncio.CancelledError:
				break
			except Exception as e:
				logger.error(f"Error in monitoring loop: {e}")
				await asyncio.sleep(1)
	
	async def _collect_hardware_data(self) -> HardwareData:
		"""Collect current hardware data"""
		# Use PyHardwareMonitor for data collection
		computer = Hardware.Computer()
		computer.IsCpuEnabled = True
		computer.IsGpuEnabled = True
		computer.IsMemoryEnabled = True
		computer.IsStorageEnabled = True
		computer.IsNetworkEnabled = True
		computer.Open()
		computer.Update()
		
		# Parse data from computer.Hardware
		cpu_data = self._parse_cpu_data(computer.Hardware)
		gpu_data = self._parse_gpu_data(computer.Hardware)
		memory_data = self._parse_memory_data(computer.Hardware)
		storage_data = self._parse_storage_data(computer.Hardware)
		network_data = self._parse_network_data(computer.Hardware)
		sensor_data = self._parse_sensor_data(computer.Hardware)
		
		computer.Close()
		return HardwareData(
			timestamp=datetime.now(),
			cpu=cpu_data,
			gpu=gpu_data,
			memory=memory_data,
			storage=storage_data,
			network=network_data,
			sensors=sensor_data
		)
	
	def _parse_cpu_data(self, hardware_list: List[Any]) -> CPUData:
		"""Parses CPU data from the LibreHardwareMonitor hardware list."""
		for hardware_item in hardware_list:
			if hardware_item.HardwareType == Hardware.HardwareType.CPU:
				usage = 0
				temperature = 0
				frequency = 0
				cores = []
				for sensor in hardware_item.Sensors:
					if sensor.SensorType == Hardware.SensorType.Load and "CPU Total" in sensor.Name:
						usage = sensor.Value
					if sensor.SensorType == Hardware.SensorType.Temperature and "CPU Package" in sensor.Name:
						temperature = sensor.Value
					if sensor.SensorType == Hardware.SensorType.Clock and "CPU Core #1" in sensor.Name:
						frequency = sensor.Value
					if sensor.SensorType == Hardware.SensorType.Load and "Core" in sensor.Name:
						cores.append(CPUCore(core=len(cores)+1, usage=sensor.Value, temperature=None))
				return CPUData(usage=usage, temperature=temperature, frequency=frequency, cores=cores)
		return CPUData(usage=0, temperature=0, frequency=0, cores=[])
	
	def _parse_gpu_data(self, hardware_list: List[Any]) -> Optional[GPUData]:
		"""Parses GPU data from the LibreHardwareMonitor hardware list."""
		for hardware_item in hardware_list:
			if hardware_item.HardwareType == Hardware.HardwareType.GPU:
				usage = 0
				temperature = 0
				memory_usage = 0
				power_usage = None
				fan_speed = None
				for sensor in hardware_item.Sensors:
					if sensor.SensorType == Hardware.SensorType.Load and "GPU Total" in sensor.Name:
						usage = sensor.Value
					if sensor.SensorType == Hardware.SensorType.Temperature and "GPU Core" in sensor.Name:
						temperature = sensor.Value
					if sensor.SensorType == Hardware.SensorType.Load and "GPU Memory" in sensor.Name:
						memory_usage = sensor.Value
					if sensor.SensorType == Hardware.SensorType.Power and "GPU Power" in sensor.Name:
						power_usage = sensor.Value
					if sensor.SensorType == Hardware.SensorType.Fan and "GPU Fan" in sensor.Name:
						fan_speed = sensor.Value
				return GPUData(usage=usage, temperature=temperature, memory_usage=memory_usage, power_usage=power_usage, fan_speed=fan_speed)
		return None
	
	def _parse_memory_data(self, hardware_list: List[Any]) -> MemoryData:
		"""Parses memory data from the LibreHardwareMonitor hardware list."""
		for hardware_item in hardware_list:
			if hardware_item.HardwareType == Hardware.HardwareType.Memory:
				usage = 0
				available = 0
				cached = 0
				swap_usage = 0
				for sensor in hardware_item.Sensors:
					if sensor.SensorType == Hardware.SensorType.Load and "Memory" in sensor.Name:
						usage = sensor.Value
					if sensor.SensorType == Hardware.SensorType.Available and "Memory" in sensor.Name:
						available = sensor.Value
					if sensor.SensorType == Hardware.SensorType.Cached and "Memory" in sensor.Name:
						cached = sensor.Value
					if sensor.SensorType == Hardware.SensorType.Load and "Swap" in sensor.Name:
						swap_usage = sensor.Value
				return MemoryData(usage=usage, available=available, cached=cached, swap_usage=swap_usage)
		return MemoryData(usage=0, available=0, cached=0, swap_usage=0)
	
	def _parse_storage_data(self, hardware_list: List[Any]) -> List[StorageDevice]:
		"""Parses storage data from the LibreHardwareMonitor hardware list."""
		storage_devices = []
		for hardware_item in hardware_list:
			if hardware_item.HardwareType == Hardware.HardwareType.Storage:
				device_name = hardware_item.Name
				usage = 0
				read_speed = 0
				write_speed = 0
				temperature = None
				for sensor in hardware_item.Sensors:
					if sensor.SensorType == Hardware.SensorType.Load and "Storage" in sensor.Name:
						usage = sensor.Value
					if sensor.SensorType == Hardware.SensorType.Read and "Storage" in sensor.Name:
						read_speed = sensor.Value
					if sensor.SensorType == Hardware.SensorType.Write and "Storage" in sensor.Name:
						write_speed = sensor.Value
					if sensor.SensorType == Hardware.SensorType.Temperature and "Storage" in sensor.Name:
						temperature = sensor.Value
				storage_devices.append(StorageDevice(device=device_name, usage=usage, read_speed=read_speed, write_speed=write_speed, temperature=temperature))
		return storage_devices
	
	def _parse_network_data(self, hardware_list: List[Any]) -> NetworkData:
		"""Parses network data from the LibreHardwareMonitor hardware list."""
		for hardware_item in hardware_list:
			if hardware_item.HardwareType == Hardware.HardwareType.Network:
				bytes_sent = 0
				bytes_recv = 0
				packets_sent = 0
				packets_recv = 0
				for sensor in hardware_item.Sensors:
					if sensor.SensorType == Hardware.SensorType.BytesSent and "Network" in sensor.Name:
						bytes_sent = sensor.Value
					if sensor.SensorType == Hardware.SensorType.BytesRecv and "Network" in sensor.Name:
						bytes_recv = sensor.Value
					if sensor.SensorType == Hardware.SensorType.PacketsSent and "Network" in sensor.Name:
						packets_sent = sensor.Value
					if sensor.SensorType == Hardware.SensorType.PacketsRecv and "Network" in sensor.Name:
						packets_recv = sensor.Value
				return NetworkData(bytes_sent=bytes_sent, bytes_recv=bytes_recv, packets_sent=packets_sent, packets_recv=packets_recv)
		return NetworkData(bytes_sent=0, bytes_recv=0, packets_sent=0, packets_recv=0)
	
	def _parse_sensor_data(self, hardware_list: List[Any]) -> SensorData:
		"""Parses sensor data from the LibreHardwareMonitor hardware list."""
		temperatures = []
		fans = []
		voltages = []
		for hardware_item in hardware_list:
			if hardware_item.HardwareType == Hardware.HardwareType.Temperature:
				for sensor in hardware_item.Sensors:
					temperatures.append(SensorReading(name=f"{sensor.Name} {sensor.Label or ''}".strip(), value=sensor.Value))
			if hardware_item.HardwareType == Hardware.HardwareType.Fan:
				for sensor in hardware_item.Sensors:
					fans.append(SensorReading(name=f"{sensor.Name} {sensor.Label or ''}".strip(), value=sensor.Value))
			if hardware_item.HardwareType == Hardware.HardwareType.Voltage:
				for sensor in hardware_item.Sensors:
					voltages.append(SensorReading(name=f"{sensor.Name} {sensor.Label or ''}".strip(), value=sensor.Value))
		return SensorData(temperatures=temperatures, fans=fans, voltages=voltages)
	
	async def _get_system_info(self) -> SystemInfo:
		"""Get system information"""
		loop = asyncio.get_event_loop()
		return await loop.run_in_executor(None, self._collect_system_info)
	
	def _collect_system_info(self) -> SystemInfo:
		"""Collect system information"""
		# CPU info
		cpu_info = {}
		if CPUINFO_AVAILABLE:
			try:
				info = cpuinfo.get_cpu_info()
				cpu_info = {
					'name': info.get('brand_raw', 'Unknown'),
					'cores': psutil.cpu_count(logical=False),
					'threads': psutil.cpu_count(logical=True),
					'architecture': info.get('arch', platform.machine()),
					'base_frequency': info.get('hz_advertised_friendly', 'Unknown'),
					'max_frequency': info.get('hz_actual_friendly', 'Unknown')
				}
			except Exception as e:
				logger.debug(f"Could not get detailed CPU info: {e}")
		
		if not cpu_info:
			cpu_info = {
				'name': platform.processor() or 'Unknown',
				'cores': psutil.cpu_count(logical=False),
				'threads': psutil.cpu_count(logical=True),
				'architecture': platform.machine()
			}
		
		# GPU info
		gpu_info = None
		if GPU_AVAILABLE:
			try:
				gpus = GPUtil.getGPUs()
				if gpus:
					gpu = gpus[0]
					gpu_info = {
						'name': gpu.name,
						'memory': gpu.memoryTotal,
						'driver_version': gpu.driver,
						'uuid': gpu.uuid
					}
			except Exception as e:
				logger.debug(f"Could not get GPU info: {e}")
		
		# Memory info
		memory = psutil.virtual_memory()
		memory_info = {
			'total': memory.total // (1024 * 1024),  # Convert to MB
			'type': 'Unknown',  # Not easily available
			'speed': 'Unknown'  # Not easily available
		}
		
		# Storage info
		storage_info = []
		partitions = psutil.disk_partitions()
		for partition in partitions:
			try:
				usage = psutil.disk_usage(partition.mountpoint)
				storage_info.append({
					'device': partition.device,
					'total': usage.total // (1024 * 1024 * 1024),  # Convert to GB
					'type': partition.fstype,
					'mountpoint': partition.mountpoint
				})
			except (PermissionError, FileNotFoundError):
				continue
		
		# OS info
		os_info = {
			'name': platform.system(),
			'version': platform.version(),
			'release': platform.release(),
			'machine': platform.machine()
		}
		
		return SystemInfo(
			cpu=cpu_info,
			gpu=gpu_info,
			memory=memory_info,
			storage=storage_info,
			motherboard={},  # Not easily available
			os=os_info
		)