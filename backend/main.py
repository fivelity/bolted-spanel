#!/usr/bin/env python3
"""
PC Hardware Monitoring Dashboard - Backend
FastAPI application with WebSocket support for real-time hardware monitoring
"""

import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config.settings import settings
from database.database import init_db
from services.hardware_monitor import HardwareMonitor
from services.websocket_manager import WebSocketManager
from api.routes import hardware, dashboard, settings as settings_routes

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Global instances
hardware_monitor = HardwareMonitor()
websocket_manager = WebSocketManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting PC Hardware Monitoring Dashboard")
    await init_db()
    await hardware_monitor.start()

    # Start background task for WebSocket data broadcasting
    broadcast_task = asyncio.create_task(broadcast_hardware_data())

    yield

    # Shutdown
    logger.info("Shutting down PC Hardware Monitoring Dashboard")
    broadcast_task.cancel()
    await hardware_monitor.stop()


# Create FastAPI application
app = FastAPI(
    title="PC Hardware Monitoring Dashboard API",
    description="Real-time hardware monitoring with WebSocket support",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(hardware.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(settings_routes.router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "PC Hardware Monitoring Dashboard API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "monitoring": hardware_monitor.is_running(),
        "connected_clients": len(websocket_manager.active_connections),
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time hardware data"""
    await websocket.accept()
    while True:
        data = await hardware_monitor.get_current_data()  # From PyHardwareMonitor
        await websocket.send_json(data.model_dump())
        await asyncio.sleep(settings.WEBSOCKET_UPDATE_INTERVAL)  # Poll interval


async def broadcast_hardware_data():
    """Background task to broadcast hardware data to WebSocket clients"""
    while True:
        try:
            if websocket_manager.active_connections:
                hardware_data = await hardware_monitor.get_current_data()
                if hardware_data:
                    await websocket_manager.broadcast(hardware_data.model_dump())

            await asyncio.sleep(settings.WEBSOCKET_UPDATE_INTERVAL)
        except Exception as e:
            logger.error(f"Error broadcasting hardware data: {e}")
            await asyncio.sleep(1)


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Global exception: {exc}")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info",
    )
