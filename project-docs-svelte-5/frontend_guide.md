# Frontend Guide

This guide provides an overview of the frontend application, including its structure, state management, and component architecture.

## Project Structure

The frontend is a SvelteKit application located in the `frontend` directory. The main components are:

- `src/lib/components`: Reusable Svelte components
- `src/lib/stores`: Svelte stores for global state management using Svelte 5 runes
- `src/lib/types`: TypeScript type definitions
- `src/lib/utils`: Utility functions
- `src/routes`: SvelteKit pages and layouts

## State Management

The application uses Svelte 5's runes ($state, $derived, $effect) for state management. This provides a simple and efficient way to manage reactive state.

- **`$state`**: Used for reactive state primitives, such as hardware metrics and UI state.
- **`$derived`**: Used for computed values that automatically update when their dependencies change.
- **`$effect`**: Used for side effects, such as managing the WebSocket connection and data persistence.

## Component Architecture

The frontend is built with a modular component architecture. The main components are:

- **Dashboard**: The main dashboard component, which contains the grid layout and widgets.
- **Widgets**: Individual components that display specific hardware metrics.
- **Layout**: Components that define the overall layout of the application, such as the app bar and drawer.
