"""
Settings and configuration API routes
"""

import logging
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from database.database import get_db
from database.models import UserSettings
from models.hardware import AlertThreshold

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/settings", tags=["settings"])

class SettingUpdate(BaseModel):
	"""Setting update model"""
	key: str
	value: Any

class SettingResponse(BaseModel):
	"""Setting response model"""
	key: str
	value: Any
	updated_at: str

@router.get("/", response_model=List[SettingResponse])
async def get_all_settings(db: AsyncSession = Depends(get_db)):
	"""Get all user settings"""
	try:
		stmt = select(UserSettings)
		result = await db.execute(stmt)
		settings = result.scalars().all()
		
		return [
			SettingResponse(
				key=setting.key,
				value=setting.value,
				updated_at=setting.updated_at.isoformat()
			)
			for setting in settings
		]
	except Exception as e:
		logger.error(f"Error getting settings: {e}")
		raise HTTPException(status_code=500, detail="Failed to get settings")

@router.get("/{key}", response_model=SettingResponse)
async def get_setting(key: str, db: AsyncSession = Depends(get_db)):
	"""Get a specific setting"""
	try:
		stmt = select(UserSettings).where(UserSettings.key == key)
		result = await db.execute(stmt)
		setting = result.scalar_one_or_none()
		
		if not setting:
			raise HTTPException(status_code=404, detail="Setting not found")
		
		return SettingResponse(
			key=setting.key,
			value=setting.value,
			updated_at=setting.updated_at.isoformat()
		)
	except HTTPException:
		raise
	except Exception as e:
		logger.error(f"Error getting setting: {e}")
		raise HTTPException(status_code=500, detail="Failed to get setting")

@router.put("/{key}", response_model=SettingResponse)
async def update_setting(
	key: str,
	value: Any,
	db: AsyncSession = Depends(get_db)
):
	"""Update or create a setting"""
	try:
		stmt = select(UserSettings).where(UserSettings.key == key)
		result = await db.execute(stmt)
		setting = result.scalar_one_or_none()
		
		if setting:
			# Update existing setting
			setting.value = value
		else:
			# Create new setting
			setting = UserSettings(key=key, value=value)
			db.add(setting)
		
		await db.commit()
		await db.refresh(setting)
		
		return SettingResponse(
			key=setting.key,
			value=setting.value,
			updated_at=setting.updated_at.isoformat()
		)
	except Exception as e:
		logger.error(f"Error updating setting: {e}")
		await db.rollback()
		raise HTTPException(status_code=500, detail="Failed to update setting")

@router.delete("/{key}")
async def delete_setting(key: str, db: AsyncSession = Depends(get_db)):
	"""Delete a setting"""
	try:
		stmt = select(UserSettings).where(UserSettings.key == key)
		result = await db.execute(stmt)
		setting = result.scalar_one_or_none()
		
		if not setting:
			raise HTTPException(status_code=404, detail="Setting not found")
		
		await db.delete(setting)
		await db.commit()
		
		return {"message": "Setting deleted successfully"}
	except HTTPException:
		raise
	except Exception as e:
		logger.error(f"Error deleting setting: {e}")
		await db.rollback()
		raise HTTPException(status_code=500, detail="Failed to delete setting")

@router.get("/alerts/thresholds", response_model=List[AlertThreshold])
async def get_alert_thresholds(db: AsyncSession = Depends(get_db)):
	"""Get alert threshold configurations"""
	try:
		stmt = select(UserSettings).where(UserSettings.key.like("alert_threshold_%"))
		result = await db.execute(stmt)
		settings = result.scalars().all()
		
		thresholds = []
		for setting in settings:
			metric = setting.key.replace("alert_threshold_", "")
			threshold_data = setting.value
			
			if isinstance(threshold_data, dict):
				thresholds.append(AlertThreshold(
					metric=metric,
					threshold=threshold_data.get("threshold", 0),
					enabled=threshold_data.get("enabled", True),
					comparison=threshold_data.get("comparison", "greater")
				))
		
		return thresholds
	except Exception as e:
		logger.error(f"Error getting alert thresholds: {e}")
		raise HTTPException(status_code=500, detail="Failed to get alert thresholds")

@router.put("/alerts/thresholds/{metric}", response_model=AlertThreshold)
async def update_alert_threshold(
	metric: str,
	threshold: AlertThreshold,
	db: AsyncSession = Depends(get_db)
):
	"""Update alert threshold for a specific metric"""
	try:
		key = f"alert_threshold_{metric}"
		threshold_data = {
			"threshold": threshold.threshold,
			"enabled": threshold.enabled,
			"comparison": threshold.comparison
		}
		
		stmt = select(UserSettings).where(UserSettings.key == key)
		result = await db.execute(stmt)
		setting = result.scalar_one_or_none()
		
		if setting:
			setting.value = threshold_data
		else:
			setting = UserSettings(key=key, value=threshold_data)
			db.add(setting)
		
		await db.commit()
		await db.refresh(setting)
		
		return AlertThreshold(
			metric=metric,
			threshold=threshold_data["threshold"],
			enabled=threshold_data["enabled"],
			comparison=threshold_data["comparison"]
		)
	except Exception as e:
		logger.error(f"Error updating alert threshold: {e}")
		await db.rollback()
		raise HTTPException(status_code=500, detail="Failed to update alert threshold")