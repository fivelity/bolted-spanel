# Project Architecture

## Application Architecture

### Full-Stack Design
- **Frontend**: Modern SvelteKit application with real-time dashboard capabilities for SenseCanvas
- **Backend**: FastAPI-based Python server handling hardware data collection and WebSocket communications
- **Communication**: Real-time bidirectional communication via WebSockets
- **Deployment**: Docker containerization for easy deployment and development

### Data Flow
1. **Hardware Monitoring**: PyHardwareMonitor wrapper interfaces with LibreHardwareMonitorLib.dll (Windows) or falls back to psutil (cross-platform)
2. **Sensor Data Collection**: Raw hardware sensors are polled and normalized
3. **Data Processing**: Structured hardware metrics are validated using Pydantic models and prepared for transmission
4. **Real-time Broadcasting**: Metrics are broadcast to connected clients via WebSocket connections
5. **Reactive State Updates**: Frontend receives data and updates Svelte 5 runes-based state
6. **Component Reactivity**: Dashboard widgets automatically re-render when their dependent state changes

## Core Technologies

### Frontend Technologies
- **SvelteKit 2.x**: Modern full-stack framework
- **Svelte 5**: Reactive component framework with runes-based state management
- **Tailwind CSS 4**: Utility-first CSS framework
- **LayerChart**: Advanced charting library integrated with Cosmic UI adaptations
- **Svelte-UX**: UI component library
- **WebSocket Client**: For real-time communication with the backend
- **TypeScript**: Type-safe development

### Backend Technologies
- **FastAPI**: Modern Python web framework
- **WebSockets**: For real-time bidirectional communication
- **PyHardwareMonitor**: Custom Python wrapper for LibreHardwareMonitor integration
- **LibreHardwareMonitorLib.dll**: Native .NET library for deep Windows hardware access
- **psutil**: Cross-platform system monitoring (fallback for non-Windows platforms)
- **Python.NET**: .NET Common Language Runtime integration for Python
- **Pydantic**: Data validation and settings management
- **Asyncio**: Asynchronous programming for efficient concurrent data collection
