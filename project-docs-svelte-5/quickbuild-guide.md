# QuickBuild Guide for Bolted-SPanel Integration

This guide provides a concise, step-by-step process to quickly build and integrate the synergistic technology stack for the Bolted-SPanel project. The stack combines a reactive frontend for themed, draggable dashboards with a real-time backend for hardware monitoring, enhanced by AI and utilities. Benefits include scalability (modular components), performance (Svelte 5 Runes, WebSocket streaming), and aesthetics (sci-fi SVG via Cosmic UI).

**Prerequisites**:
- Node.js 18+ and Python 3.10+ installed.
- SvelteKit project initialized in `frontend/` (run `pnpm create svelte@latest` if needed).
- Use pnpm for all package management (user preference).
- Follow security best practices: No hardcoded secrets; sanitize inputs; use secure contexts (HTTPS for Notifications).
- Do not downgrade dependencies—use latest stable or 'next' for Svelte 5 compatibility.

## 1. Setup Dependencies
Install all required packages using pnpm. Pin to latest versions or 'next' for Svelte 5 Runes support.

### Frontend Dependencies
```bash
pnpm add @layerchart/layerchart@next @svelte-ux/svelte-ux@next cosmic-ui @neodrag/svelte@latest @skeletonlabs/skeleton@latest zod@latest
pnpm add -D tailwindcss@latest postcss@latest autoprefixer@latest
```

### Backend Dependencies
In `backend/requirements.txt`, add:
```
fastapi[all]
HardwareMonitor # 'HardwareMonitor' is the correct package name for "PyHardwareMonitor"
@genkit/core@latest  # For AI integration
```
Then install:
```bash
pnpm exec pip install -r backend/requirements.txt
```

## 2. Configure Frontend (SvelteKit + Tailwind + LayerChart + Svelte-UX + Cosmic UI + NeoDrag)
- **Tailwind Setup**: Follow [SvelteKit Guide](https://tailwindcss.com/docs/installation/framework-guides/sveltekit). Run `pnpm tailwindcss init`. Update `tailwind.config.js`:
  ```js
  content: ['./src/**/*.{svelte,js,ts}'],
  theme: { extend: {} },
  plugins: [require('@skeletonlabs/skeleton')],
  ```
  Add to `svelte.config.js`: Include `vitePreprocess()`.

- **Svelte-UX Theming**: In `src/routes/+layout.svelte`, add `<ThemeInit />` from Svelte-UX. Create `src/lib/stores/themeStore.ts` for centralized theme management.

- **Cosmic UI Integration**: In widget components (e.g., `src/lib/components/CosmicSensorGauge.svelte`), import and use: `import { CosmicFrame } from 'cosmic-ui';` Wrap gauges: `<CosmicFrame> <LayerChartArc ... /> </CosmicFrame>`.

- **LayerChart Gauges**: In gauge components (e.g., `ArcMeter.svelte`), use Runes: `let { value } = $props();` Import from `@layerchart/layerchart@next`.

- **NeoDrag for Draggables**: In `DraggableWidget.svelte`, `import draggable from '@neodrag/svelte';` Apply `use:draggable` to elements. Store positions in `dashboard.svelte.ts`.

## 3. Setup Backend (FastAPI + PyHardwareMonitor + WebSockets)
- In `backend/main.py`, setup FastAPI app with WebSocket:
  ```python
  from fastapi import FastAPI, WebSocket
  from services.hardware_monitor import get_hardware_data
  app = FastAPI()
  @app.websocket('/ws')
  async def websocket_endpoint(websocket: WebSocket):
      await websocket.accept()
      while True:
          data = get_hardware_data()  # From PyHardwareMonitor
          await websocket.send_json(data)
          await asyncio.sleep(1)  # Poll interval
  ```
- Security: Sanitize data; use HTTPS in production.

## 4. Implement Data Flow
- **Backend to Frontend**: In `src/lib/services/websocket.ts`, connect to `/ws`:
  ```ts
  const ws = new WebSocket('ws://localhost:8000/ws');
  ws.onmessage = (event) => sensorStore.set(JSON.parse(event.data));
  ```
- **Frontend Stores to Gauges**: Use `sensorStore.ts` (writable store) to feed data into LayerChart components wrapped in Cosmic frames.

## 5. Theming
- Centralize in `themeStore.ts`: Integrate Svelte-UX (`ThemeSwitch`), Tailwind classes, and Cosmic UI props.
- Apply globally in `+layout.svelte` and per-widget (e.g., bind theme to CosmicFrame).

## 6. AI Integration (Genkit + Zod)
- **Backend AI Route**: In `src/routes/api/ai-layout/+server.ts` (SvelteKit API), setup Genkit:
  ```ts
  import { genkit } from '@genkit/core';
  export async function POST({ request }) {
      const input = await request.json();
      const schema = z.object({ layout: z.array(...) });  // Zod validation
      const validated = schema.parse(input);
      // Use Genkit to generate layout suggestions
      return json({ suggestions: [...] });
  }
  ```
- Call from frontend (e.g., AILayoutModal.svelte) via fetch.

## 7. Utilities (Notifications)
- In `sensorStore.ts`, on threshold breach:
  ```ts
  if (Notification.permission === 'granted') {
      new Notification('Hardware Alert!', { body: 'CPU over 80%' });
  } else {
      Notification.requestPermission();
  }
  ```
- Ensure secure context (HTTPS).

## 8. Best Practices and Testing
- **User Rules**: No dependency downgrades—use latest. Security: Sanitize inputs (e.g., via Zod); no hardcoded secrets (use env vars).
- **Testing**: Run `pnpm dev` for frontend, `uvicorn main:app` for backend. Test with Svelte 5 next branches: Check reactivity, WebSocket streaming, AI responses.
- **Build & Deploy**: `pnpm build` for frontend; deploy backend with Gunicorn/Uvicorn.

This quickbuild should get a basic integrated app running in under an hour. Expand with project-specific customizations from examples/. 