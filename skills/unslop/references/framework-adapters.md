# Framework Adapters & Safe Hybrid Migration Rules

Run `node <skill-dir>/scripts/detect_stack.mjs <targetDir>` first, then follow the adapter rules matching the detected stack. Never break routing, SSR hydration, or existing business logic while upgrading visual craft and motion.

---

## 1. Next.js App Router (`next` + `next-app-router`)

### Client / Server Boundaries
- Keep `app/layout.*` and `app/**/page.*` as **Server Components** whenever possible so metadata, data fetching, and initial HTML stay fast and SEO-clean.
- Push `'use client'` **down to leaf interactive modules** (`HeroShaderCanvas.tsx`, `CommandPalette.tsx`, `MotionToggle.tsx`, `ScrollFlightGrid.tsx`) rather than marking an entire page tree `'use client'`.
- Never access `window`, `document`, `matchMedia`, `IntersectionObserver`, or `requestAnimationFrame` during render; initialize them exclusively inside `useEffect`.

### Effect Cleanup & WebGL Lifecycle
Every browser listener, animation loop, observer, and WebGL context must return a teardown function:

```tsx
'use client';

import { useEffect, useRef } from 'react';

export function AmbientCanvas({ reducedMotion }: { reducedMotion: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl2', { antialias: true, alpha: true });
    if (!gl) return; // Render fallback CSS background or Canvas2D path

    let rafId = 0;
    let active = true;
    const onContextLost = (e: Event) => {
      e.preventDefault();
      active = false;
      cancelAnimationFrame(rafId);
    };
    canvas.addEventListener('webglcontextlost', onContextLost);

    const renderFrame = (time: number) => {
      if (!active) return;
      // Draw frame using time uniform...
      if (!reducedMotion) rafId = requestAnimationFrame(renderFrame);
    };
    rafId = requestAnimationFrame(renderFrame);

    return () => {
      active = false;
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      // Delete buffers, shaders, and programs here
    };
  }, [reducedMotion]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
}
```

### Typography via `next/font`
- Load display, body, and monospace fonts via `next/font/google` or `next/font/local` in `app/layout.tsx` with explicit `variable` names (`--font-display`, `--font-sans`, `--font-mono`).
- Attach all font variable classes to `<html className={\`${display.variable} ${sans.variable} ${mono.variable}\`}>` and map them in CSS tokens so fonts render with zero layout shift.

---

## 2. Vite + React (`vite-react` / `react`)

- **StrictMode Double-Invocation Safety:** React 18/19 StrictMode mounts, unmounts, and remounts effects in development. Ensure every WebGL initialization, `ResizeObserver`, `Lenis` instance, and `keydown` listener cleans up cleanly in the `useEffect` return function so duplicate RAF loops never stack.
- **Single Motion Gate:** Expose a lightweight `MotionProvider` / `useMotionPreference()` hook combining `window.matchMedia('(prefers-reduced-motion: reduce)')` with an optional user-facing Motion toggle, persisting to `document.documentElement.dataset.motion = 'reduced' | 'full'`.
- **Code-Split Heavy Canvases:** Wrap optional WebGL/3D modules in `React.lazy` with a solid matching background container fallback so initial paint is never blocked.

---

## 3. Tailwind CSS v3, Tailwind CSS v4 & shadcn/ui

### Avoiding Global Reset Clashes
- **Never** write unlayered global resets (`* { margin: 0; padding: 0; }`) alongside Tailwind CSS—unlayered rules override `@layer utilities` and break `p-*`, `m-*`, and `gap-*`.
- Put base resets, typography defaults, and `:focus-visible` outlines inside `@layer base { ... }`.
- Use `overflow-x: clip` on `html, body` (never `overflow: hidden`, which breaks `position: sticky` scroll tracks).

### Tailwind CSS v4 (`@theme inline`)
Define semantic CSS variables in `:root` (and `.dark` / `[data-theme="dark"]`), then expose them to Tailwind utilities using `@theme inline`:

```css
@import "tailwindcss";

:root {
  --bg-canvas: #f7f5f0;
  --bg-surface: #ffffff;
  --text-primary: #171614;
  --text-muted: #57534e;
  --border-subtle: #e2ddd5;
  --accent-primary: #1f4d3a;
  --accent-foreground: #f7f5f0;
  --accent-ring: #1f4d3a;

  /* shadcn/ui semantic alias bridge */
  --background: var(--bg-canvas);
  --foreground: var(--text-primary);
  --card: var(--bg-surface);
  --card-foreground: var(--text-primary);
  --popover: var(--bg-surface);
  --popover-foreground: var(--text-primary);
  --primary: var(--accent-primary);
  --primary-foreground: var(--accent-foreground);
  --muted: #ece8e0;
  --muted-foreground: var(--text-muted);
  --border: var(--border-subtle);
  --input: var(--border-subtle);
  --ring: var(--accent-ring);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-ring: var(--ring);
  --font-display: var(--font-display);
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
}
```

### Tailwind CSS v3 (`tailwind.config.*`)
- Keep semantic custom properties inside `@layer base { :root { ... } .dark { ... } }`.
- Bind `theme.extend.colors`, `theme.extend.fontFamily`, and `theme.extend.borderRadius` in `tailwind.config.*` to `var(--...)` (or `hsl(var(--...) / <alpha-value>)` when matching an existing shadcn/ui v3 HSL setup).
- Do not strip existing shadcn/ui variable names (`--background`, `--foreground`, `--card`, `--primary`, `--secondary`, `--muted`, `--destructive`, `--border`, `--ring`); remap their values so Radix dialogs, popovers, and inputs inherit the upgraded aesthetic automatically.

---

## 4. Vue, Nuxt & Astro

- **Vue / Nuxt:**
  - Initialize WebGL canvases, `IntersectionObserver`, and scroll listeners inside `onMounted` and dispose them in `onBeforeUnmount`.
  - In Nuxt, guard browser globals behind `if (import.meta.client)` or wrap client-only canvases in `<ClientOnly>` with a matching height/background placeholder.
  - Keep component styles scoped (`<style scoped>`) while placing shared semantic tokens in a global `tokens.css` registered in `nuxt.config.*` or `main.ts`.
- **Astro:**
  - Keep static editorial, proof, and footer bands as **zero-JS `.astro` components**.
  - Hydrate interactive surfaces (command palette, filterable catalog, pricing calculator, WebGL stage) as isolated islands using `client:visible` for below-the-fold sections and `client:idle` for global header overlays.
  - Prefer CSS Scroll-Driven Animations (`@supports (animation-timeline: view())`) for progressive scroll choreography before shipping client JS.

---

## 5. Strangler-Fig Hybrid Refactoring Protocol

When upgrading an existing production app (`unslop-existing` or `hybrid` mode), **never rewrite working business logic from scratch**:

1. **Freeze Invariants First:** Document existing route paths, URL query parameters, form submission handlers, auth guards, analytics events, and data-fetching hooks in `PRODUCT_BRIEF.md`.
2. **Capture Baseline Telemetry:** Run `audit_ui.mjs` (or `--routes` for multi-route apps) against the running app before editing UI files.
3. **Layer 1 — Token & Typography Foundation:** Introduce or remap semantic CSS tokens (`tokens.css` / `@theme inline`) and font loading without deleting existing component props or routes.
4. **Layer 2 — App Shell & Shared Chrome:** Upgrade header, navigation, mobile drawer, theme/motion toggles, and footer while keeping every existing `<Link>` / `href` and auth state wired.
5. **Layer 3 — Band-by-Band / Route-by-Route Replacement:** Replace visual presentation one band or route at a time, keeping container components (data fetching, state mutations, form handlers) decoupled from presentational view modules.
6. **Verify Continuity:** Re-run the project's own typecheck/build/test suite alongside `audit_ui.mjs` after each migrated route to guarantee zero regressions in routes, data flows, contrast, or responsiveness.
