# Repository Guidelines

## Project Structure & Module Organization
- `frontend/` hosts the Next.js 15 TypeScript app: routes in `app/`, reusable UI in `components/`, custom hooks in `hooks/`, Tailwind styling helpers in `styles/`, and static assets in `public/`. Core build and lint settings live in `next.config.mjs`, `tsconfig.json`, and `eslint.config.mjs`.
- `backend/scripts/` contains Python utilities for sourcing anime metadata, generating BERT embeddings, and seeding MongoDB; supporting datasets sit in `backend/data/` and precomputed vectors in `backend/embeddings/`.
- `vercel.json` tracks deployment overrides. Treat all `node_modules/` directories as generated artifacts—never edit or commit changes inside them.

## Build, Test, and Development Commands
- `cd frontend && npm install` installs the Next.js dependencies; rerun after updating `package.json`.
- `npm run dev` launches the local dev server on port 3000 with hot reload.
- `npm run build` produces the production bundle used by Vercel; run this before opening PRs that touch build config.
- `npm run lint` validates TypeScript/React style with the flat ESLint config; use `npm run lint:fix` for safe auto-fixes.
- Backend scripts run ad-hoc: enable a Python 3.10+ virtualenv, install `torch transformers pymongo`, and execute the required job (e.g., `python backend/scripts/generate_multifield_embeddings.py`). Store large outputs in `backend/embeddings/`.

## Coding Style & Naming Conventions
- Follow the ESLint + Next defaults: 2-space indentation, omit semicolons, React components in PascalCase (`TrendingSection.tsx`), hooks in camelCase prefixed with `use`, and route folders in lowercase (`app/anime/[id]/page.tsx`).
- Favor Tailwind utility classes over inline styles, keep service helpers pure and typed with explicit interfaces, and document non-obvious logic with short comments.

## Testing Guidelines
- Automated tests are not yet configured. When adding features, include component or hook tests (e.g., `ComponentName.test.tsx` beside the source) using React Testing Library or Vitest, and document any setup steps in your PR.
- At minimum, run `npm run lint` and manually exercise critical flows (`/anime`, recommendation fetches) before submitting.

## Commit & Pull Request Guidelines
- Recent history mixes free-form and Conventional Commit prefixes (`feat:`, `chore:`). Prefer the conventional format for clarity and changelog generation.
- Keep commits focused and describe user-facing impact in the present tense.
- Pull requests should link related issues, summarize data pipeline changes, include screenshots for UI tweaks, and note required config. Move secrets (e.g., MongoDB URIs) into `.env.local` instead of hardcoding them in scripts.
