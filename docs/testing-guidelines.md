# Testing Guidelines

This document outlines the testing principles for the TODO application.

1. Test Types
   - The app should include unit tests, integration tests, and end-to-end (E2E) tests.

2. Coverage for Changes
   - All new features or bug fixes should include appropriate tests (unit, integration, or E2E as applicable).

Notes
- Keep tests small, deterministic, and fast where possible.
- Use integration tests to validate interactions between modules and components.
- Use E2E tests to validate core user flows (create, edit, complete, delete tasks).
- Run tests as part of CI for pull requests.
