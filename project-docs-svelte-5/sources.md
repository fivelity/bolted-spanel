- name: Cosmic UI Documentation
  source: https://www.cosmic-ui.com/docs
  why: SVG-first sci-fi component library adapted for SenseCanvas frontend, providing customizable frames for widgets.
  use: Reference for implementing SVG-based UI elements in Svelte 5 components, integrated with LayerChart for gauges.

- name: Cosmic UI Frame Component
  source: https://www.cosmic-ui.com/docs/frame
  why: Provides base for widget containers in SenseCanvas, used in CosmicFrame.svelte.
  use: Adapt to Svelte 5 with runes for reactive SVG frames around sensor gauges.

- name: Cosmic UI Charts
  source: https://www.cosmic-ui.com/docs/chart
  why: Inspiration for sci-fi chart styling, combined with LayerChart in SenseCanvas.
  use: Reference styling patterns, but primary implementation uses LayerChart for actual charting.

- name: Detecting Classes in Source Files
  source: https://tailwindcss.com/docs/detecting-classes-in-source-files#explicitly-registering-sources
  why: Understanding how Tailwind CSS detects and includes classes from source files.
  use: Reference for configuring Tailwind CSS to correctly scan project files.

- name: SvelteKit Integration Guide
  source: https://tailwindcss.com/docs/installation/framework-guides/sveltekit
  why: Official guide for integrating Tailwind CSS with SvelteKit projects.
  use: Follow this guide for setting up Tailwind CSS in a SvelteKit application.

- name: LayerChart Official Documentation
  source: https://layerchart.com/getting-started
  why: Comprehensive guide to get started with LayerChart, including core concepts and API.
  use: Consult for general usage, API reference, and examples of LayerChart components.

- name: LayerChart GitHub Repository
  source: https://github.com/techniq/layerchart/tree/next
  why: Access to the source code, issues, and community contributions for the next version.
  use: Explore source code, report issues, or contribute to the LayerChart library.

- name: LayerChart Releases
  source: https://github.com/techniq/layerchart/releases
  why: Information on all released versions, including changelogs and assets.
  use: Check for new versions, download assets, and review changes in LayerChart.

- name: Svelte-UX Documentation Home
  source: https://svelte-ux.techniq.dev/
  why: Main entry point for Svelte-UX documentation, covering all components and features.
  use: Consult for general usage, API reference, and examples of Svelte-UX components.

- name: Svelte-UX GitHub Repository
  source: https://github.com/techniq/svelte-ux/tree/next
  why: Source code and development repository for the Svelte-UX library.
  use: Explore source code, report issues, or contribute to the Svelte-UX library.

- name: Svelte-UX Releases
  source: https://github.com/techniq/svelte-ux/releases
  why: Version history and downloadable assets for the Svelte-UX library.
  use: Check for new versions, download assets, and review changes in Svelte-UX.

- name: Svelte-UX Theme Implementation
  source: https://next.svelte-ux.techniq.dev/docs/components/ThemeInit
  why: Details on how to initialize and configure themes within Svelte-UX applications.
  use: Implement and configure themes in Svelte-UX applications.

- name: Svelte-UX Theme Select Component
  source: https://next.svelte-ux.techniq.dev/docs/components/ThemeSelect
  why: Documentation for the `ThemeSelect` component, enabling theme switching in UI.
  use: Integrate a theme selection component into the user interface.

- name: Svelte-UX Theme Switch Component
  source: https://next.svelte-ux.techniq.dev/docs/components/ThemeSwitch
  why: Documentation for the `ThemeSwitch` component, providing a toggle for themes.
  use: Integrate a theme switching toggle into the user interface.

- name: PyHardwareMonitor GitHub Repository
  source: https://github.com/snip3rnick/PyHardwareMonitor
  why: Repository for the Python wrapper, useful for integrating hardware data.
  use: Add "PyHardwareMonitor" to `requirements.txt` for hardware monitoring capabilities.

- name: SvelteKit Routing
  source: https://svelte.dev/docs/kit/routing
  why: Essential for understanding the application's navigation and page structure based on SvelteKit's file-based routing.
  use: Reference for defining and managing application routes in SvelteKit.

- name: Google Genkit Framework
  source: https://genkit.dev/
  why: Provides insights into the AI-powered layout suggestions and generative UI features.
  use: Explore for implementing AI-driven UI generation and layout suggestions.

- name: Genkit Integration
  source: https://firebase.google.com/products/genkit
  why: Specific patterns and best practices for integrating Genkit into Firebase projects.
  use: Follow for integrating Genkit with Firebase and implementing AI features.

- name: LayerChart Components (Arc)
  source: https://www.layerchart.com/docs/components/Arc
  why: Reference for utilizing LayerChart components, particularly for creating gauge, graph, and meter widgets.
  use: Implement gauge, graph, and meter widgets using LayerChart's Arc component.

- name: NeoDrag for Svelte
  source: https://www.neodrag.dev/docs/svelte
  why: Documentation for implementing draggable and resizable elements, crucial for the widget grid.
  use: Integrate draggable and resizable functionality for dashboard widgets.

- name: Skeleton UI Theming
  source: https://www.skeleton.dev/docs/theming
  why: Guide for integrating and customizing the Skeleton UI theming system with Tailwind CSS.
  use: Apply and customize the Skeleton UI theme for consistent styling.

- name: FastAPI Streaming Response
  source: https://apidog.com/blog/fastapi-streaming-response/
  why: Patterns for implementing real-time sensor data streaming using FastAPI.
  use: Implement real-time data streaming from the backend using FastAPI.

- name: WebSocket Implementation
  source: https://stribny.name/blog/2020/07/real-time-data-streaming-using-fastapi-and-websockets/
  why: Details on setting up WebSocket connections for continuous real-time data flow.
  use: Set up WebSocket connections for real-time data communication.

- name: Zod Schema Validation
  source: https://zod.dev/
  why: Using Zod for robust schema validation, especially for widget configuration forms.
  use: Implement schema validation for data structures, particularly for form inputs.

- name: Notification API
  source: https://developer.mozilla.org/en-US/docs/Web/API/Notification
  why: Implementing browser notifications for hardware alerts and system events.
  use: Implement browser notifications for system alerts and user feedback.

- name: ArcMeter.svelte Example
  source: examples/ArcMeter.svelte
  why: An internal example demonstrating the pattern for creating LayerChart gauge widgets with theme integration.
  use: Reference for creating custom LayerChart gauge widgets with theme support.

- name: DashboardGrid.svelte Example
  source: examples/DashboardGrid.svelte
  why: An internal example showcasing the grid layout pattern for organizing widget containers.
  use: Reference for implementing the dashboard's grid layout for widgets.

- name: DraggableWidget.svelte Example
  source: examples/DraggableWidget.svelte
  why: An internal example illustrating NeoDrag integration with position tracking for draggable widgets.
  use: Reference for integrating draggable functionality with position persistence for widgets.

- name: layoutStore.ts Example
  source: examples/layoutStore.ts
  why: An internal example of the Svelte store pattern used for persisting layout configurations.
  use: Reference for implementing Svelte stores for application state persistence.

- name: ThemeConfig.js Example
  source: examples/ThemeConfig.js
  why: An internal example detailing the implementation of theme switching functionality.
  use: Reference for implementing theme switching logic within the application.

## Compatibility Notes
- All Svelte-related libraries (including LayerChart and Svelte-UX) verified for Svelte 5 (Runes) compatibility using 'next' branches where needed.
- Tailwind CSS 4 integrated with SvelteKit 2.x.
- Backend Python libraries are independent and compatible with frontend stack.