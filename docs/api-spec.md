# API Specification

## Overview

This document describes the HTTP JSON API for the TODO application (backend).

Base path: `/api`

All endpoints return JSON and use standard HTTP status codes. CORS is enabled for frontend development.

## Resource: Task

- `id`: string (UUID) — server-generated primary id
- `description`: string — sanitized, required (stored escaped)
- `descriptionRaw`: string | null — original raw input (stored to enable editing)
- `dueDate`: string | null — ISO 8601 date/time or null
- `notes`: string | null — sanitized (stored escaped)
- `notesRaw`: string | null — original raw notes
- `completed`: boolean — default false
- `createdAt`: string — ISO 8601 timestamp
- `updatedAt`: string — ISO 8601 timestamp

Notes: the API stores both sanitized and raw versions of free-text fields. Clients should treat `description` and `notes` as safe-to-render values, and can use the raw fields for editing.

## JSON Schema (summary)

- required: `description`
- `description`: non-empty string
- `dueDate`: string (ISO 8601) or null
- `notes`: string or null

## Endpoints

- GET /api/tasks
  - Query params: `completed` (true|false), `q` (text search), `due` (overdue|today|upcoming), `limit`, `offset`
  - Response: 200 [Task]

- GET /api/tasks/:id
  - Response: 200 Task | 404 { error }

- POST /api/tasks
  - Body: { description, dueDate?, notes? }
  - Validation: `description` required and non-empty; `dueDate` ISO date if provided
  - Sanitization: `description` and `notes` are sanitized server-side; raw values stored as `descriptionRaw`/`notesRaw`
  - Response: 201 Task | 400 { error }

- PUT /api/tasks/:id
  - Body: full task fields (server ignores `id`/`createdAt`), same validation as POST
  - Response: 200 Task | 400 | 404

- PATCH /api/tasks/:id
  - Body: partial fields (e.g., { notes }, { completed: true })
  - Response: 200 Task | 400 | 404

- DELETE /api/tasks/:id
  - Response: 204 | 404

## Error format

All errors return JSON: `{ "error": "message", "details"?: ... }`.

Common status codes:
- 400: validation error (returns message)
- 404: not found
- 500: server error

## Validation rules

- `description`: required, non-empty string
- `dueDate`: if present, must parse to a valid date
- `notes`: if present, must be a string
- `completed`: boolean for updates

Validation is enforced via middleware in the backend and returns consistent 400 responses when violated.

## Sanitization

See `docs/sanitization-policy.md` for details. In short:
- Free-text fields are trimmed and escaped server-side to reduce XSS risk.
- Both sanitized and raw versions are stored: `description` and `descriptionRaw`, `notes` and `notesRaw`.

## Storage & Environments

- Development: in-memory SQLite used for tests and local dev. Data resets on restart.
- Next steps: migrate to persistent storage (SQLite file, PostgreSQL) and add migrations.

## Security & Best Practices

- Always validate and sanitize user input server-side.
- Clients should treat server data as untrusted and escape when rendering if needed.
- Use HTTPS in production and secure DB credentials via env vars.

## Acceptance Criteria (mapping)

- Creating a task without `description` responds 400.
- Updating `dueDate` persists and is returned.
- Adding/editing `notes` persists and is returned.
- Marking complete updates `completed` and can be filtered.
- Deleting removes the task.
