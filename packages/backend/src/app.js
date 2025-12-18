const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const Database = require('better-sqlite3');
const { randomUUID } = require('crypto');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// API Error helper
class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// Validation helpers
const isISODateString = (s) => {
  if (!s) return false;
  const d = new Date(s);
  return !isNaN(d.getTime());
};

function validateCreateTask(req, res, next) {
  const { description, dueDate, notes } = req.body || {};
  if (!description || typeof description !== 'string' || description.trim() === '') {
    return next(new ApiError(400, 'Description is required'));
  }
  if (dueDate && typeof dueDate === 'string') {
    if (!isISODateString(dueDate)) return next(new ApiError(400, 'Invalid dueDate'));
  }
  if (notes && typeof notes !== 'string') return next(new ApiError(400, 'Notes must be a string'));
  next();
}

function validatePatchTask(req, res, next) {
  const { description, dueDate, notes, completed } = req.body || {};
  if (typeof description !== 'undefined') {
    if (!description || typeof description !== 'string' || description.trim() === '') {
      return next(new ApiError(400, 'Description is required'));
    }
  }
  if (typeof dueDate !== 'undefined' && dueDate !== null) {
    const parsed = new Date(dueDate);
    if (isNaN(parsed.getTime())) return next(new ApiError(400, 'Invalid dueDate'));
  }
  if (typeof notes !== 'undefined' && notes !== null && typeof notes !== 'string') return next(new ApiError(400, 'Notes must be a string'));
  if (typeof completed !== 'undefined' && typeof completed !== 'boolean') return next(new ApiError(400, 'Completed must be boolean'));
  next();
}

function validateIdParam(req, res, next) {
  const { id } = req.params || {};
  if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) {
    return next(new ApiError(400, 'Invalid id'));
  }
  next();
}

// Initialize in-memory SQLite database
const db = new Database(':memory:');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// Insert some initial data
const initialItems = ['Item 1', 'Item 2', 'Item 3'];
const insertStmt = db.prepare('INSERT INTO items (name) VALUES (?)');

initialItems.forEach(item => {
  insertStmt.run(item);
});

console.log('In-memory database initialized with sample data');

// Create tasks table (JSON API model)
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    description_raw TEXT,
    dueDate TEXT,
    notes TEXT,
    notes_raw TEXT,
    completed INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )
`);

// Helper: convert DB row to Task object
function rowToTask(row) {
  if (!row) return null;
  return {
    id: row.id,
    description: row.description,
    descriptionRaw: row.description_raw || null,
    dueDate: row.dueDate || null,
    notes: row.notes || null,
    notesRaw: row.notes_raw || null,
    completed: Boolean(row.completed),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

// Sanitization helper - escape HTML special chars to reduce XSS risk
function sanitizeString(s) {
  if (s === null || typeof s === 'undefined') return null;
  if (typeof s !== 'string') s = String(s);
  const trimmed = s.trim();
  return trimmed
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\//g, '&#x2F;');
}

// Tasks: List with simple filtering (completed, q)
app.get('/api/tasks', (req, res) => {
  try {
    const { completed, q, limit = 100, offset = 0 } = req.query;
    let sql = 'SELECT * FROM tasks';
    const clauses = [];
    const params = [];

    if (typeof completed !== 'undefined') {
      clauses.push('completed = ?');
      params.push(completed === 'true' ? 1 : 0);
    }

    if (q) {
      clauses.push('(description LIKE ? OR notes LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }

    if (clauses.length) sql += ' WHERE ' + clauses.join(' AND ');
    sql += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10));
    params.push(parseInt(offset, 10));

    const rows = db.prepare(sql).all(...params);
    res.json(rows.map(rowToTask));
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get task by id
app.get('/api/tasks/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    const task = rowToTask(row);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    next(error);
  }
});

// Create task
app.post('/api/tasks', validateCreateTask, (req, res, next) => {
  try {
    let { description, dueDate = null, notes = null } = req.body;
    description = sanitizeString(description);
    notes = sanitizeString(notes);
    if (!description || description.trim() === '') {
      return next(new ApiError(400, 'Description is required'));
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    const stmt = db.prepare(`INSERT INTO tasks (id, description, description_raw, dueDate, notes, notes_raw, completed, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`);
    stmt.run(id, description.trim(), req.body.description || null, dueDate, notes, req.body.notes || null, now, now);

    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    res.status(201).json(rowToTask(row));
  } catch (error) {
    console.error('Error creating task:', error);
    next(error);
  }
});

// Replace entire task (PUT)
app.put('/api/tasks/:id', validateIdParam, validateCreateTask, (req, res, next) => {
  try {
    const { id } = req.params;
    let { description, dueDate = null, notes = null, completed = false } = req.body;
    description = sanitizeString(description);
    notes = sanitizeString(notes);
    if (!description || description.trim() === '') {
      return next(new ApiError(400, 'Description is required'));
    }

    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    const now = new Date().toISOString();
    const stmt = db.prepare('UPDATE tasks SET description = ?, description_raw = ?, dueDate = ?, notes = ?, notes_raw = ?, completed = ?, updatedAt = ? WHERE id = ?');
    stmt.run(description.trim(), req.body.description || null, dueDate, notes, req.body.notes || null, completed ? 1 : 0, now, id);

    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    res.json(rowToTask(row));
  } catch (error) {
    console.error('Error updating task:', error);
    next(error);
  }
});

// Patch task (partial update)
app.patch('/api/tasks/:id', validateIdParam, validatePatchTask, (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    const updated = {
      description: typeof payload.description !== 'undefined' ? sanitizeString(payload.description) : existing.description,
      dueDate: typeof payload.dueDate !== 'undefined' ? payload.dueDate : existing.dueDate,
      notes: typeof payload.notes !== 'undefined' ? sanitizeString(payload.notes) : existing.notes,
      completed: typeof payload.completed !== 'undefined' ? (payload.completed ? 1 : 0) : existing.completed
    };

    if (!updated.description || updated.description.trim() === '') {
      return res.status(400).json({ error: 'Description is required' });
    }

    const now = new Date().toISOString();
    const stmt = db.prepare('UPDATE tasks SET description = ?, description_raw = ?, dueDate = ?, notes = ?, notes_raw = ?, completed = ?, updatedAt = ? WHERE id = ?');
    stmt.run(updated.description.trim(), typeof payload.description !== 'undefined' ? payload.description : existing.description_raw, updated.dueDate, updated.notes, typeof payload.notes !== 'undefined' ? payload.notes : existing.notes_raw, updated.completed, now, id);

    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    res.json(rowToTask(row));
  } catch (error) {
    console.error('Error patching task:', error);
    next(error);
  }
});

// Delete task
app.delete('/api/tasks/:id', validateIdParam, (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
    const result = stmt.run(id);
    if (result.changes > 0) return res.status(204).end();
    res.status(404).json({ error: 'Task not found' });
  } catch (error) {
    console.error('Error deleting task:', error);
    next(error);
  }
});

// API Routes
app.get('/api/items', (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM items ORDER BY created_at DESC').all();
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

app.post('/api/items', (req, res) => {
  try {
    let { name } = req.body;

    name = sanitizeString(name);

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Item name is required' });
    }

    const result = insertStmt.run(name);
    const id = result.lastInsertRowid;

    const newItem = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

app.delete('/api/items/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Valid item ID is required' });
    }

    const existingItem = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    if (!existingItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const deleteStmt = db.prepare('DELETE FROM items WHERE id = ?');
    const result = deleteStmt.run(id);

    if (result.changes > 0) {
      res.json({ message: 'Item deleted successfully', id: parseInt(id) });
    } else {
      res.status(404).json({ error: 'Item not found' });
    }
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

module.exports = { app, db, insertStmt };

// Centralized error handler (must be added after routes)
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  if (err instanceof ApiError) {
    const payload = { error: err.message };
    if (err.details) payload.details = err.details;
    return res.status(err.status).json(payload);
  }
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});