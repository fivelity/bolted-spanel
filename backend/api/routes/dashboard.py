"""
Dashboard configuration API routes
"""

import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from database.database import get_db
from database.models import DashboardLayout

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/dashboard", tags=["dashboard"])


class DashboardLayoutCreate(BaseModel):
    """Dashboard layout creation model"""

    name: str
    layout_data: Dict[str, Any]
    is_default: bool = False


class DashboardLayoutResponse(BaseModel):
    """Dashboard layout response model"""

    id: int
    name: str
    layout_data: Dict[str, Any]
    is_default: bool
    created_at: str
    updated_at: str


@router.get("/layouts", response_model=List[DashboardLayoutResponse])
async def get_dashboard_layouts(db: AsyncSession = Depends(get_db)):
    """Get all dashboard layouts"""
    try:
        stmt = select(DashboardLayout)
        result = await db.execute(stmt)
        layouts = result.scalars().all()

        return [
            DashboardLayoutResponse(
                id=layout.id,
                name=layout.name,
                layout_data=layout.layout_data,
                is_default=layout.is_default,
                created_at=layout.created_at.isoformat(),
                updated_at=layout.updated_at.isoformat(),
            )
            for layout in layouts
        ]
    except Exception as e:
        logger.error(f"Error getting dashboard layouts: {e}")
        raise HTTPException(status_code=500, detail="Failed to get dashboard layouts")


@router.post("/layouts", response_model=DashboardLayoutResponse)
async def create_dashboard_layout(
    layout: DashboardLayoutCreate, db: AsyncSession = Depends(get_db)
):
    """Create a new dashboard layout"""
    try:
        # If this is set as default, unset other defaults
        if layout.is_default:
            stmt = select(DashboardLayout).where(DashboardLayout.is_default)
            result = await db.execute(stmt)
            existing_defaults = result.scalars().all()

            for existing in existing_defaults:
                existing.is_default = False

        # Create new layout
        db_layout = DashboardLayout(
            name=layout.name,
            layout_data=layout.layout_data,
            is_default=layout.is_default,
        )

        db.add(db_layout)
        await db.commit()
        await db.refresh(db_layout)

        return DashboardLayoutResponse(
            id=db_layout.id,
            name=db_layout.name,
            layout_data=db_layout.layout_data,
            is_default=db_layout.is_default,
            created_at=db_layout.created_at.isoformat(),
            updated_at=db_layout.updated_at.isoformat(),
        )
    except Exception as e:
        logger.error(f"Error creating dashboard layout: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create dashboard layout")


@router.get("/layouts/{layout_id}", response_model=DashboardLayoutResponse)
async def get_dashboard_layout(layout_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific dashboard layout"""
    try:
        stmt = select(DashboardLayout).where(DashboardLayout.id == layout_id)
        result = await db.execute(stmt)
        layout = result.scalar_one_or_none()

        if not layout:
            raise HTTPException(status_code=404, detail="Dashboard layout not found")

        return DashboardLayoutResponse(
            id=layout.id,
            name=layout.name,
            layout_data=layout.layout_data,
            is_default=layout.is_default,
            created_at=layout.created_at.isoformat(),
            updated_at=layout.updated_at.isoformat(),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting dashboard layout: {e}")
        raise HTTPException(status_code=500, detail="Failed to get dashboard layout")


@router.put("/layouts/{layout_id}", response_model=DashboardLayoutResponse)
async def update_dashboard_layout(
    layout_id: int,
    layout_update: DashboardLayoutCreate,
    db: AsyncSession = Depends(get_db),
):
    """Update a dashboard layout"""
    try:
        stmt = select(DashboardLayout).where(DashboardLayout.id == layout_id)
        result = await db.execute(stmt)
        layout = result.scalar_one_or_none()

        if not layout:
            raise HTTPException(status_code=404, detail="Dashboard layout not found")

        # If this is set as default, unset other defaults
        if layout_update.is_default and not layout.is_default:
            stmt = select(DashboardLayout).where(DashboardLayout.is_default)
            result = await db.execute(stmt)
            existing_defaults = result.scalars().all()

            for existing in existing_defaults:
                existing.is_default = False

        # Update layout
        layout.name = layout_update.name
        layout.layout_data = layout_update.layout_data
        layout.is_default = layout_update.is_default

        await db.commit()
        await db.refresh(layout)

        return DashboardLayoutResponse(
            id=layout.id,
            name=layout.name,
            layout_data=layout.layout_data,
            is_default=layout.is_default,
            created_at=layout.created_at.isoformat(),
            updated_at=layout.updated_at.isoformat(),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating dashboard layout: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update dashboard layout")


@router.delete("/layouts/{layout_id}")
async def delete_dashboard_layout(layout_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a dashboard layout"""
    try:
        stmt = select(DashboardLayout).where(DashboardLayout.id == layout_id)
        result = await db.execute(stmt)
        layout = result.scalar_one_or_none()

        if not layout:
            raise HTTPException(status_code=404, detail="Dashboard layout not found")

        await db.delete(layout)
        await db.commit()

        return {"message": "Dashboard layout deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting dashboard layout: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete dashboard layout")
