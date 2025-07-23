import { json } from "@sveltejs/kit";
async function generateLayoutSuggestions(description, availableWidgets = []) {
  const mockSuggestions = [
    {
      id: "gaming-dashboard",
      name: "Gaming Performance",
      description: "Optimized layout for gaming performance monitoring",
      reasoning:
        "Prioritizes CPU, GPU, and memory usage with large gauges for quick visibility during gaming sessions.",
      confidence: 0.92,
      widgets: [
        {
          id: "cpu-gauge",
          type: "gauge",
          title: "CPU Usage",
          position: { x: 20, y: 20 },
          size: { width: 200, height: 200 },
          config: {
            dataSource: "cpu.usage",
            unit: "%",
            colors: ["#22c55e", "#f59e0b", "#ef4444"],
            thresholds: [70, 90],
          },
        },
        {
          id: "gpu-gauge",
          type: "gauge",
          title: "GPU Usage",
          position: { x: 240, y: 20 },
          size: { width: 200, height: 200 },
          config: {
            dataSource: "gpu.usage",
            unit: "%",
            colors: ["#3b82f6", "#8b5cf6", "#ef4444"],
            thresholds: [75, 90],
          },
        },
        {
          id: "memory-bar",
          type: "meter",
          title: "Memory Usage",
          position: { x: 20, y: 240 },
          size: { width: 420, height: 80 },
          config: {
            dataSource: "memory.usage",
            unit: "%",
            colors: ["#06b6d4", "#f59e0b", "#ef4444"],
            thresholds: [80, 95],
          },
        },
      ],
    },
    {
      id: "minimal-overview",
      name: "Minimal Overview",
      description: "Clean, minimal layout focusing on key metrics",
      reasoning:
        "Simple text-based widgets for users who prefer clean, distraction-free monitoring.",
      confidence: 0.85,
      widgets: [
        {
          id: "cpu-simple",
          type: "simple",
          title: "CPU",
          position: { x: 20, y: 20 },
          size: { width: 150, height: 100 },
          config: {
            dataSource: "cpu.usage",
            unit: "%",
          },
        },
        {
          id: "gpu-simple",
          type: "simple",
          title: "GPU",
          position: { x: 190, y: 20 },
          size: { width: 150, height: 100 },
          config: {
            dataSource: "gpu.usage",
            unit: "%",
          },
        },
        {
          id: "memory-simple",
          type: "simple",
          title: "Memory",
          position: { x: 360, y: 20 },
          size: { width: 150, height: 100 },
          config: {
            dataSource: "memory.usage",
            unit: "%",
          },
        },
      ],
    },
    {
      id: "detailed-monitoring",
      name: "Detailed Monitoring",
      description:
        "Comprehensive layout with detailed metrics and temperatures",
      reasoning:
        "Includes temperature monitoring and detailed system information for power users and system administrators.",
      confidence: 0.88,
      widgets: [
        {
          id: "cpu-detailed",
          type: "gauge",
          title: "CPU Usage",
          position: { x: 20, y: 20 },
          size: { width: 180, height: 180 },
          config: {
            dataSource: "cpu.usage",
            unit: "%",
          },
        },
        {
          id: "cpu-temp",
          type: "simple",
          title: "CPU Temp",
          position: { x: 220, y: 20 },
          size: { width: 140, height: 80 },
          config: {
            dataSource: "cpu.temperature",
            unit: "°C",
          },
        },
        {
          id: "gpu-detailed",
          type: "gauge",
          title: "GPU Usage",
          position: { x: 380, y: 20 },
          size: { width: 180, height: 180 },
          config: {
            dataSource: "gpu.usage",
            unit: "%",
          },
        },
        {
          id: "gpu-temp",
          type: "simple",
          title: "GPU Temp",
          position: { x: 220, y: 120 },
          size: { width: 140, height: 80 },
          config: {
            dataSource: "gpu.temperature",
            unit: "°C",
          },
        },
      ],
    },
  ];
  await new Promise((resolve) => setTimeout(resolve, 1e3));
  if (availableWidgets.length > 0) {
    return mockSuggestions.filter((suggestion) =>
      suggestion.widgets.every((widget) =>
        availableWidgets.includes(widget.type),
      ),
    );
  }
  return mockSuggestions;
}
const POST = async ({ request }) => {
  try {
    const body = await request.json();
    const description = body.description || "Default dashboard layout";
    const availableWidgets = body.availableWidgets || [];
    const suggestions = await generateLayoutSuggestions(
      description,
      availableWidgets,
    );
    return json(suggestions);
  } catch (error) {
    console.error("AI layout generation failed:", error);
    return json(
      { error: "Failed to generate layout suggestions" },
      { status: 500 },
    );
  }
};
export { POST };
