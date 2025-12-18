# Functional Requirements

This document lists the core functional requirements for the TODO application.

1. Create a task
   - A user can create a task with the following fields:
     - Description (required)
     - Due date (optional)
     - Notes (optional)
   - Acceptance: tasks without a description should be rejected with a helpful error.

2. Add or update a due date after creation
   - A user can add or change the due date of a task after it has been created.
   - Acceptance: updating the due date persists the new date and is reflected in the task view.

3. Add notes after creation
   - A user can add or edit additional notes on a task after it has been created.
   - Acceptance: notes are saved and displayed with the task.

4. Mark a task complete
   - A user can mark a task as complete. Completed tasks should be visually distinguishable.
   - Acceptance: marking complete updates the task status and can be filtered or listed separately.

5. Delete a task
   - A user can delete a task. Deletions should be confirmed or reversible depending on UX choices.
   - Acceptance: deleted tasks are removed from the main task list.

6. Edit a task
   - A user can edit any field of a task after it has been created (description, due date, notes).
   - Acceptance: edits persist and immediately update the displayed task details.

Notes
- Validation: only the `description` field is mandatory; all other fields are optional.
- Persistence: all changes (create, update, complete, delete) must be persisted to the application's data store.
- UX: the UI should provide clear affordances for creating, editing, completing, and deleting tasks.
