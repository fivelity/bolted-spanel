"""
Hardware monitoring API routes
"""

import logging
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from database.database import get_db
from database.models import HardwareDataRecord
from models.hardware import HardwareData, SystemInfo
from services.hardware_monitor import HardwareMonitor

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/hardware", tags=["hardware"])

# Global hardware monitor instance (injected from main.py)
hardware_monitor: Optional[HardwareMonitor] = None


def get_hardware_monitor() -> HardwareMonitor:
    """Get hardware monitor instance"""
    from main import hardware_monitor as hm

    if not hm:
        raise HTTPException(status_code=503, detail="Hardware monitor not available")
    return hm


@router.get("/current", response_model=HardwareData)
async def get_current_hardware_data(
    monitor: HardwareMonitor = Depends(get_hardware_monitor),
):
    """Get current hardware monitoring data"""
    try:
        data = await monitor.get_current_data()
        if not data:
            raise HTTPException(status_code=503, detail="Hardware data not available")
        return data
    except Exception as e:
        logger.error(f"Error getting current hardware data: {e}")
        raise HTTPException(status_code=500, detail="Failed to get hardware data")


@router.get("/system-info", response_model=SystemInfo)
async def get_system_info(monitor: HardwareMonitor = Depends(get_hardware_monitor)):
    """Get system information"""
    try:
        info = await monitor.get_system_info()
        if not info:
            raise HTTPException(status_code=503, detail="System info not available")
        return info
    except Exception as e:
        logger.error(f"Error getting system info: {e}")
        raise HTTPException(status_code=500, detail="Failed to get system info")


@router.get("/history", response_model=List[HardwareData])
async def get_hardware_history(
    hours: int = Query(1, ge=1, le=168, description="Hours of history to retrieve"),
    db: AsyncSession = Depends(get_db),
):
    """Get historical hardware data"""
    try:
        start_time = datetime.now() - timedelta(hours=hours)

        stmt = (
            select(HardwareDataRecord)
            .where(HardwareDataRecord.timestamp >= start_time)
            .order_by(desc(HardwareDataRecord.timestamp))
            .limit(1000)
        )

        result = await db.execute(stmt)
        records = result.scalars().all()

        # Convert database records to HardwareData models
        history = []
        for record in records:
            if record.raw_data:
                try:
                    # Reconstruct HardwareData from stored JSON
                    data = HardwareData.model_validate(record.raw_data)
                    history.append(data)
                except Exception as e:
                    logger.warning(
                        f"Failed to parse historical data record {record.id}: {e}"
                    )

        return history
    except Exception as e:
        logger.error(f"Error getting hardware history: {e}")
        raise HTTPException(status_code=500, detail="Failed to get hardware history")


@router.get("/status")
async def get_monitoring_status(
    monitor: HardwareMonitor = Depends(get_hardware_monitor),
):
    """Get hardware monitoring status"""
    return {"running": monitor.is_running(), "last_update": datetime.now().isoformat()}
