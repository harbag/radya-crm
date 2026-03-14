# CLAUDE.md — Radya CRM

This file provides context for AI assistants (Claude Code and others) working in this repository.

## Project Overview

**Radya CRM** is a Customer Relationship Management application for Radya Group, built with Next.js 16 and React 19. The project is currently in early/boilerplate stage — the foundational stack is configured but feature development has not yet begun.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| UI Library | React | 19.2.3 |
| Language | TypeScript | ^5 |
| Styling | Tailwind CSS | ^4 |
| Linting | ESLint (flat config) | ^9 |
| PostCSS | @tailwindcss/postcss | ^4 |

## Repository Structure

```
radya-crm/
├── public/              # Static assets (SVGs, images)
├── src/
│   └── app/             # Next.js App Router root
│       ├── layout.tsx   # Root layout — metadata, fonts, body wrapper
│       ├── page.tsx     # Home page (currently boilerplate)
│       └── globals.css  # Global Tailwind CSS imports + CSS variables
├── eslint.config.mjs    # ESLint flat config (core-web-vitals + TypeScript)
├── next.config.ts       # Next.js config (minimal, extend as needed)
├── postcss.config.mjs   # PostCSS config (Tailwind v4 plugin)
└── tsconfig.json        # TypeScript config with @/* path alias
```

## Development Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Path Aliases

The `@/*` alias maps to `src/*`:

```ts
import { MyComponent } from "@/components/MyComponent"; // resolves to src/components/MyComponent
```

## Conventions

### File & Component Organization
- All application code lives under `src/`
- Use the Next.js App Router convention: pages go in `src/app/`, each route is a directory with a `page.tsx`
- Shared components should be placed in `src/components/`
- Utility functions in `src/lib/` or `src/utils/`
- Types/interfaces in `src/types/`

### TypeScript
- Strict mode is enabled (`"strict": true` in tsconfig)
- Always use explicit types for function parameters and return values
- Prefer `type` over `interface` for unions/intersections; use `interface` for object shapes that may be extended

### Styling
- Use Tailwind CSS utility classes for all styling
- Dark mode is supported via the `dark:` variant
- Global CSS variables (if needed) go in `globals.css`
- Avoid inline `style` props unless dynamically computed values are required

### Linting
- ESLint uses the flat config format (`eslint.config.mjs`)
- Rules enforced: `eslint-config-next/core-web-vitals` + TypeScript rules
- Fix lint errors before committing: `npm run lint`

### Fonts
- Geist Sans and Geist Mono are loaded via `next/font/google` in `layout.tsx`
- Font CSS variables: `--font-geist-sans`, `--font-geist-mono`

## Adding Features

Since this project is in early stage, common next steps will include:

1. **New pages** — create `src/app/<route>/page.tsx`
2. **Shared components** — create `src/components/<ComponentName>.tsx`
3. **API routes** — create `src/app/api/<route>/route.ts`
4. **Environment variables** — add a `.env.local` file (gitignored); document new vars in `.env.example`
5. **Database** — no ORM/database is configured yet; add as needed (Prisma, Drizzle, etc.)
6. **Testing** — no test framework is configured yet; add Jest/Vitest + React Testing Library as needed

## Environment Variables

No environment variables are required to run the project currently. When adding them:
- Store secrets in `.env.local` (already gitignored)
- Create a `.env.example` documenting all required variables (without values)
- Access in Next.js: prefix with `NEXT_PUBLIC_` for client-side exposure

## Git Workflow

- Default branch: `master`
- Feature branches follow the pattern: `claude/<description>-<id>` for AI-assisted work
- Keep commits focused and use descriptive messages
- Run `npm run lint` and `npm run build` before pushing
