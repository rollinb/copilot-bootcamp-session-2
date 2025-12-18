# Copilot Bootcamp — TODO App (Session 2)

This repository is a small monorepo example used for the Copilot Bootcamp exercises. It contains a React frontend and an Express backend with a simple in-memory SQLite database used for development and tests.

See detailed API and sanitization notes in the `docs/` folder:
- [API spec](docs/api-spec.md)
- [Sanitization policy](docs/sanitization-policy.md)

## Quick start

Prerequisites:
- Node.js 16+ and npm

Install dependencies (root):

```bash
npm install
```

Start frontend and backend concurrently (root):

```bash
npm run start
```

Notes:
- The frontend is proxied to the backend during development via `proxy` in `packages/frontend/package.json` (default: `http://localhost:3030`).
- The backend uses an in-memory SQLite DB for tests and local development; data is not persisted across restarts.

## Running tests

Run all tests (root):

```bash
npm test
```

Run backend tests only:

```bash
npm run test:backend
```

Run frontend tests only:

```bash
npm run test:frontend
```

## API Summary

Base path: `/api`

Primary resource: `Task` — create, read, update, patch, delete. The backend validates input, sanitizes free-text fields, and stores both sanitized and raw versions of text fields (`description` / `descriptionRaw`, `notes` / `notesRaw`).

Full API details are in `docs/api-spec.md`.

## Development notes

- Validation and centralized error handling are implemented in `packages/backend/src/app.js`.
- Frontend simple UI lives in `packages/frontend/src/App.js` and demonstrates listing, creating, editing (notes/due via prompt), completing, and deleting tasks.

## Next steps

- Add end-to-end tests (Cypress/Playwright)
- Migrate to persistent DB and add migrations
- Add CI (lint, tests, coverage)

## End-to-end tests (Playwright)

There is a Playwright E2E test package under `packages/e2e`. To run E2E tests locally:

1. Start the backend (default port 3030) and frontend (default port 3000):

```bash
# from repo root
npm run start
```

2. In another terminal, install E2E deps and run tests:

```bash
cd packages/e2e
npm install
npx playwright install --with-deps
npm test
```

Or from the repo root (assuming workspace support):

```bash
npm run test:e2e
```

The E2E tests exercise the UI (create/complete/delete a task). Ensure servers are running before executing tests.

---

© 2025

