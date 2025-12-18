# Coding Guidelines

This document provides general coding standards and best practices for the TODO application.

1. Purpose
   - Promote readable, maintainable, and consistent code across the codebase.

2. Style and Formatting
   - Follow a consistent style guide for each language (e.g., ESLint/Prettier for JavaScript).
   - Format code automatically on save or at commit time.

3. DRY (Don't Repeat Yourself)
   - Avoid duplicating logic; extract shared behavior into reusable functions, modules, or components.
   - Prefer single sources of truth for configuration, strings, and constants.

4. Testing
   - Write tests for important behavior following the testing guidelines.
   - Ensure new code is covered by unit or integration tests as appropriate.

5. Documentation
   - Document public functions, components, and modules with clear descriptions and examples.
   - Keep `docs/` up to date when changes affect architecture or UX.

6. Error Handling and Logging
   - Handle errors gracefully and provide useful logs for debugging.
   - Do not leak sensitive information in logs or error messages.

7. Security and Secrets
   - Never commit secrets or credentials. Use environment variables or secret stores.

8. Performance and Simplicity
   - Optimize only when necessary; prefer clear code over premature micro-optimizations.

9. Dependencies
   - Prefer well-maintained libraries and keep dependencies up to date.

10. Commits and Pull Requests
   - Make small, focused commits with descriptive messages.
   - Include tests and update documentation in the same PR when applicable.
