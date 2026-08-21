# Repository Guidelines

## Project Structure & Module Organization

Radya CRM is a Next.js 16 App Router application. Routes live in `src/app`; authenticated pages are grouped under `src/app/(app)`, while `/login` and `/update-password` are public authentication routes. Feature UI belongs in `src/components/{contacts,companies,leads,deals,tasks,wbs}`, reusable components in `src/components/shared`, and Radix/Tailwind primitives in `src/components/ui`. Supabase clients and React Query hooks live in `src/lib/supabase` and `src/lib/queries`. Zustand stores under `src/store` should hold UI state, not authoritative entity data. Static assets are in `public`; database migrations are in `supabase/migrations`.

## Build, Test, and Development Commands

- `npm install` restores dependencies from the committed `package-lock.json`.
- `npm run dev` starts the local Turbopack development server.
- `npm run lint` runs ESLint across the repository.
- `npm run build` performs the production build and TypeScript validation.
- `npm start` serves a completed production build.

There is no configured unit-test runner or standalone `typecheck` script. Treat lint plus a successful production build as the required verification baseline.

## Coding Style & Naming Conventions

Use TypeScript and functional React components. Follow the surrounding file’s formatting and keep imports on the `@/*` alias when referencing `src/*`. Components use PascalCase, hooks use `useCamelCase`, and files generally use kebab-case. Keep database row types and snake_case fields inside query modules; map them to camelCase UI types at feature boundaries. Use `cn()` from `src/lib/utils.ts` for conditional classes and mutate Supabase data through React Query hooks so cache invalidation remains consistent.

## Supabase & Security

Copy `.env.example` to `.env.local` and set the public Supabase URL and anonymous key; never commit secrets. Apply `001_initial_schema.sql`, `002_wbs.sql`, and `003_user_profile_phone.sql` in order. Preserve row-level security policies and ensure profile IDs match `auth.users.id`.

## Commit & Pull Request Guidelines

Use short, imperative commit subjects; Conventional Commit prefixes such as `feat:` are welcome. Keep commits focused. Pull requests should describe behavior changes, migration or environment requirements, verification performed, and linked issues. Include screenshots for visible UI changes and call out any known limitations or follow-up work.
