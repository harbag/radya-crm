# Radya CRM

A fully client-side Customer Relationship Management (CRM) application built for Radya Group. No backend required — all data lives in-memory using Zustand stores.

## Features

- **Contacts** — Manage people with company associations, tags, and communication history
- **Companies** — Track organizations and their linked contacts, deals, and leads
- **Leads** — Pipeline view for prospecting with Kanban and list layouts
- **Deals** — Sales pipeline with stage tracking and revenue forecasting
- **Tasks** — Task management with due dates, priorities, and entity linking
- **Dashboard** — Overview charts and activity summaries
- **AI Chat** — Built-in assistant for CRM queries
- **Detail Panel** — Slide-in panel per entity with Timeline, Notes, Activities, and linked records
- **Multiple Views** — Switch between Table, Kanban, and Calendar views on most entity pages
- **Filtering** — Airtable-style condition builder for advanced filtering

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + TailwindCSS 4 + Radix UI |
| State | Zustand 5 |
| Table | TanStack Table + TanStack Virtual |
| Drag & Drop | @hello-pangea/dnd |
| Charts | Recharts |
| Icons | Lucide React |
| Language | TypeScript |

## Getting Started

**Prerequisites:** Node.js 18+

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

```bash
npm run dev      # Start development server (with hot reload)
npm run build    # Build for production
npm run start    # Serve the production build
npm run lint     # Run ESLint
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages (thin shells)
│   ├── contacts/
│   ├── companies/
│   ├── leads/
│   ├── deals/
│   └── tasks/
├── components/
│   ├── contacts/           # Contacts feature views
│   ├── companies/          # Companies feature views
│   ├── leads/              # Leads feature views
│   ├── deals/              # Deals feature views
│   ├── tasks/              # Tasks feature views
│   ├── dashboard/          # Dashboard widgets
│   ├── layout/             # App shell (sidebar, header)
│   ├── shared/             # Reusable complex components
│   │   ├── data-grid.tsx           # Virtualized sortable table
│   │   ├── kanban-board.tsx        # Drag-and-drop board
│   │   ├── calendar-view.tsx       # Calendar layout
│   │   ├── entity-detail-panel.tsx # Slide-in detail panel
│   │   └── filter-builder.tsx      # Condition-based filter UI
│   └── ui/                 # Radix UI primitive wrappers
├── store/                  # Zustand stores (one per entity + UI)
│   ├── use-contacts-store.ts
│   ├── use-companies-store.ts
│   ├── use-leads-store.ts
│   ├── use-deals-store.ts
│   ├── use-tasks-store.ts
│   ├── use-notes-store.ts
│   ├── use-activities-store.ts
│   ├── use-detail-panel-store.ts
│   ├── use-sidebar-store.ts
│   └── use-chat-store.ts
└── lib/
    ├── types.ts            # Core entity type definitions
    ├── mock-data.ts        # Seed data for all stores
    ├── utils.ts            # Utilities (cn() class merger)
    ├── entity-helpers.ts
    ├── dashboard-helpers.ts
    └── chat-responder.ts
```

## Architecture

### Data Flow

Pages in `src/app/` are thin shells — the real logic lives in feature view components under `src/components/{entity}/`. Each view manages its own UI state (active view type, sort, filters) and reads entity data from its Zustand store.

```
Page (app/) → Feature View Component → Zustand Store ← mock-data.ts
                        |
              Shared Components
          (DataGrid / KanbanBoard / CalendarView)
                        |
              EntityDetailPanel
          (opened globally via useDetailPanelStore)
```

### State Management

All data is held in Zustand stores initialized from `src/lib/mock-data.ts`. Stores expose CRUD methods and generate IDs as `{prefix}${Date.now()}`. There is no persistence — data resets on page refresh.

### Core Entity Relationships

```
Contact → Company (many-to-one)
Contact → Lead, Deal, Task, Note, Activity, Timeline
```

All types are defined in `src/lib/types.ts`.

### Path Aliases

`@/*` resolves to `src/*` (configured in `tsconfig.json`).

## Notes

- This is a demo/prototype application with no backend or database
- All data is ephemeral — changes are lost on refresh
- No authentication is implemented
