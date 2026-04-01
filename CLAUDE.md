# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Run production build
npm run lint     # Run ESLint
```

No test runner is configured.

## Architecture

**Stack:** Next.js 16 (App Router) + React 19 + TypeScript + Zustand + TailwindCSS 4 + Radix UI

This is a fully client-side CRM with no backend. All data lives in Zustand stores, initialized from `src/lib/mock-data.ts`.

### Data Flow

```
Page (app/) → View component → Zustand store ← mock-data.ts
                   ↓
         Shared components (DataGrid, KanbanBoard, CalendarView)
                   ↓
         EntityDetailPanel (opens via useDetailPanelStore)
```

Pages in `src/app/` are thin shells. The real logic lives in feature view components under `src/components/{contacts,companies,leads,deals,tasks}/`. Each view manages its own UI state (active view type, sort, filters) and reads entity data from its respective Zustand store.

### State Management

Ten Zustand stores in `src/store/`:
- One per entity: contacts, companies, leads, deals, tasks, notes, activities
- UI stores: sidebar, detail panel, AI chat

Stores expose CRUD methods and hold the full in-memory dataset. IDs are generated as `{prefix}${Date.now()}`.

### Core Entities (`src/lib/types.ts`)

`Contact` → `Company` (many-to-one), `Lead`, `Deal`, `Task`, `Note`, `Activity`, `Timeline`

### Shared Components (`src/components/shared/`)

These are the most complex parts of the codebase:

- **`data-grid.tsx`** — Virtualized, sortable, filterable table built on `@tanstack/react-table` + `@tanstack/react-virtual`. Supports inline editing, row selection, column resizing, and Notion-style cell navigation.
- **`kanban-board.tsx`** — Drag-and-drop columns via `@hello-pangea/dnd`. Configurable column grouping with color indicators.
- **`calendar-view.tsx`** — Date-based entity display.
- **`entity-detail-panel.tsx`** — Side panel with tabbed sections (Timeline, Tasks, Notes, Activities, linked entities). Opens globally via `useDetailPanelStore`.
- **`filter-builder.tsx`** — Airtable-style condition-based filter UI.

### UI Components (`src/components/ui/`)

Custom wrappers around Radix UI primitives (Button, Dialog, Dropdown, Select, Tabs, etc.) styled with Tailwind. Use `cn()` from `src/lib/utils.ts` for class merging.

### Path Aliases

`@/*` maps to `src/*` (configured in `tsconfig.json`).
