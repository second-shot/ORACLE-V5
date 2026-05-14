# ORACLE V5

ORACLE V5 is a React + Vite application with an Oracle-themed interface and routing flow for running and reviewing outputs.

## Tech Stack
- React 18
- React Router
- Framer Motion
- Vite

## Local Development
From the repository root:

1. Install dependencies:
   - `npm ci`
2. Start the dev server:
   - `npm run dev`
3. Build for production:
   - `npm run build`
4. Preview the production build:
   - `npm run preview`

## App Routes
- `/` — entry screen
- `/run` — run flow
- `/home` — home view
- `/missions` — missions view
- `/panel` — control panel
- `/output/:id` — output detail page

## Repository Notes
- `src/` contains the React app (pages, components, styles, and libraries).
- `oracle/docs/` contains system-level documentation.
- `oracle/mia/` contains Mia-specific documentation and operating context.
