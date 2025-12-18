# Input Sanitization Policy

Purpose
- Reduce risk of stored XSS and malformed input by normalizing and escaping user-provided strings at the API boundary.

Scope
- Applies to all user-editable string fields persisted by the API: `description`, `notes`, `name` (items), and any future free-text fields.

Strategy
- Trim leading/trailing whitespace.
- Convert non-string inputs to strings before processing.
- Escape HTML-special characters before storing in the DB: `&` → `&amp;`, `<` → `&lt;`, `>` → `&gt;`, `"` → `&quot;`, `'` → `&#39;`, `/` → `&#x2F;`.
- Validation (already implemented): enforce required fields, type checks, and basic date parsing for `dueDate`.

Implementation
- The backend includes a `sanitizeString` helper in `packages/backend/src/app.js` which performs the trimming and escaping.
- Sanitization is applied in create/update handlers for tasks and items prior to database writes.

Notes & Recommendations
- Escaping is done at write-time to reduce the chance of rendering raw unsafe HTML in clients. Clients should still treat all server data as untrusted and escape or use safe rendering patterns.
- Consider switching to parameterized presentation-layer escaping (escape when rendering) if the app needs to preserve original raw input for editing (store raw + escaped view).
- For richer input (markdown/HTML), adopt an allowlist sanitizer (e.g., DOMPurify) and store both raw and sanitized content.
- Add logging/monitoring for sanitization errors and malformed input attempts.

Acceptance
- All string inputs stored through the API will be sanitized by `sanitizeString`.
- Backend unit tests validate behavior for create/update flows.
