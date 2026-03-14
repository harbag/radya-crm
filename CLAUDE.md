# CLAUDE.md — Radya CRM

Context for AI assistants working in this repository.

## Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| UI | React | 19.2.3 |
| Language | TypeScript | ^5 |
| Styling | Tailwind CSS | ^4 |
| Linting | ESLint (flat config) | ^9 |

## Structure

```
src/app/          # App Router pages (layout.tsx, page.tsx, globals.css)
src/components/   # Shared components
src/lib/          # Utilities
src/types/        # TypeScript types
public/           # Static assets
```

## Commands

```bash
npm run dev    # http://localhost:3000
npm run build
npm run lint
```

## Conventions

- Path alias: `@/*` → `src/*`
- TypeScript strict mode; explicit types on all params/returns
- Tailwind for all styling; avoid inline `style` props
- Run `npm run lint` before committing

## Adding Features

- **Pages**: `src/app/<route>/page.tsx`
- **API routes**: `src/app/api/<route>/route.ts`
- **Env vars**: `.env.local` (gitignored); document in `.env.example`; prefix `NEXT_PUBLIC_` for client exposure

## Git Workflow

- Default branch: `main`
- Feature branches: `claude/<description>-<id>`
- Run `npm run lint && npm run build` before pushing
