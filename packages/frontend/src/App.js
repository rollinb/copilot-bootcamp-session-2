import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newItem, setNewItem] = useState('');
  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState(null);
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [taskSearch, setTaskSearch] = useState('');
  const [taskFilterCompleted, setTaskFilterCompleted] = useState('all'); // all, completed, active
  const [taskFilterDue, setTaskFilterDue] = useState('all'); // all, overdue, today, upcoming

  useEffect(() => {
    fetchData();
    fetchTasks();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/items');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError('Failed to fetch data: ' + err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      setTasksLoading(true);
      const res = await fetch('/api/tasks');
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const list = await res.json();
      setTasks(list);
      setTasksError(null);
    } catch (err) {
      setTasksError('Failed to load tasks: ' + err.message);
      console.error('Error fetching tasks:', err);
    } finally {
      setTasksLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;

    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newItem }),
      });

      if (!response.ok) {
        throw new Error('Failed to add item');
      }

      const result = await response.json();
      setData([...data, result]);
      setNewItem('');
    } catch (err) {
      setError('Error adding item: ' + err.message);
      console.error('Error adding item:', err);
    }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!newTaskDesc.trim()) return;

    try {
      const payload = { description: newTaskDesc, dueDate: newTaskDue || null, notes: newTaskNotes || null };
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to create task');
      const created = await response.json();
      setTasks([created, ...tasks]);
      setNewTaskDesc('');
      setNewTaskDue('');
      setNewTaskNotes('');
    } catch (err) {
      setTasksError('Error creating task: ' + err.message);
      console.error(err);
    }
  };

  const toggleTaskComplete = async (task) => {
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed }),
      });
      if (!res.ok) throw new Error('Failed to update task');
      const updated = await res.json();
      setTasks(tasks.map(t => (t.id === updated.id ? updated : t)));
    } catch (err) {
      setTasksError('Error updating task: ' + err.message);
      console.error(err);
    }
  };

  const editTask = async (task) => {
    try {
      const notes = window.prompt('Edit notes', task.notes || '')
      const dueDate = window.prompt('Edit due date (ISO YYYY-MM-DD or leave empty)', task.dueDate || '')
      if (notes === null && dueDate === null) return; // cancelled

      const payload = { notes: notes === null ? task.notes : notes, dueDate: dueDate === '' ? null : dueDate };
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to patch task');
      const updated = await res.json();
      setTasks(tasks.map(t => (t.id === updated.id ? updated : t)));
    } catch (err) {
      setTasksError('Error editing task: ' + err.message);
      console.error(err);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (res.status !== 204) throw new Error('Failed to delete task');
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err) {
      setTasksError('Error deleting task: ' + err.message);
      console.error(err);
    }
  };

  const handleDelete = async (itemId) => {
    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      setData(data.filter(item => item.id !== itemId));
      setError(null);
    } catch (err) {
      setError('Error deleting item: ' + err.message);
      console.error('Error deleting item:', err);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>To Do App</h1>
        <p>Keep track of your tasks</p>
      </header>

      <main>
        <section className="add-item-section">
          <h2>Add New Item</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Enter item name"
            />
            <button type="submit">Add Item</button>
          </form>
        </section>

        <section className="tasks-section">
          <h2>Tasks</h2>
          <form onSubmit={handleTaskSubmit} className="task-form">
            <input
              type="text"
              value={newTaskDesc}
              onChange={(e) => setNewTaskDesc(e.target.value)}
              placeholder="Task description"
            />
            <input
              type="date"
              value={newTaskDue}
              onChange={(e) => setNewTaskDue(e.target.value)}
              placeholder="Due date"
            />
            <input
              type="text"
              value={newTaskNotes}
              onChange={(e) => setNewTaskNotes(e.target.value)}
              placeholder="Notes (optional)"
            />
            <button type="submit">Add Task</button>
          </form>

          <div className="task-filters">
            <input
              type="text"
              placeholder="Search tasks"
              value={taskSearch}
              onChange={(e) => setTaskSearch(e.target.value)}
            />
            <select value={taskFilterCompleted} onChange={(e) => setTaskFilterCompleted(e.target.value)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
            <select value={taskFilterDue} onChange={(e) => setTaskFilterDue(e.target.value)}>
              <option value="all">Any due</option>
              <option value="overdue">Overdue</option>
              <option value="today">Due today</option>
              <option value="upcoming">Upcoming</option>
            </select>
          </div>

          {tasksLoading && <p>Loading tasks...</p>}
          {tasksError && <p className="error">{tasksError}</p>}
          {!tasksLoading && !tasksError && (
            (() => {
              const today = new Date();
              const startOfToday = new Date(today);
              startOfToday.setHours(0,0,0,0);
              const endOfToday = new Date(today);
              endOfToday.setHours(23,59,59,999);

              const parseDate = (s) => {
                if (!s) return null;
                const d = new Date(s);
                return isNaN(d.getTime()) ? null : d;
              };

              const matchesSearch = (task) => {
                if (!taskSearch) return true;
                const q = taskSearch.toLowerCase();
                return (task.description || '').toLowerCase().includes(q) || (task.notes || '').toLowerCase().includes(q);
              };

              const matchesCompleted = (task) => {
                if (taskFilterCompleted === 'all') return true;
                if (taskFilterCompleted === 'completed') return task.completed === true;
                return task.completed === false;
              };

              const matchesDue = (task) => {
                if (taskFilterDue === 'all') return true;
                const d = parseDate(task.dueDate);
                if (!d) return false;
                if (taskFilterDue === 'overdue') return d < startOfToday;
                if (taskFilterDue === 'today') return d >= startOfToday && d <= endOfToday;
                if (taskFilterDue === 'upcoming') return d > endOfToday;
                return true;
              };

              const filteredTasks = tasks.filter(t => matchesSearch(t) && matchesCompleted(t) && matchesDue(t));

              return (
              <ul className="task-list">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => (
                    <li key={task.id} className={task.completed ? 'completed' : ''}>
                      <label>
                        <input type="checkbox" checked={task.completed} onChange={() => toggleTaskComplete(task)} />
                        <span className="desc">{task.description}</span>
                      </label>
                      <div className="meta">
                        <small>{task.dueDate || ''}</small>
                        <small>{task.notes || ''}</small>
                      </div>
                      <div className="actions">
                        <button type="button" onClick={() => editTask(task)}>Edit</button>
                        <button type="button" onClick={() => deleteTask(task.id)}>Delete</button>
                      </div>
                    </li>
                  ))
                ) : (
                  <p>No tasks match the filters.</p>
                )}
              </ul>
              );
            })()
          )}
        </section>

        <section className="items-section">
          <h2>Items from Database</h2>
          {loading && <p>Loading data...</p>}
          {error && <p className="error">{error}</p>}
          {!loading && !error && (
            <ul>
              {data.length > 0 ? (
                data.map((item) => (
                  <li key={item.id}>
                    <span>{item.name}</span>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="delete-btn"
                      type="button"
                    >
                      Delete
                    </button>
                  </li>
                ))
              ) : (
                <p>No items found. Add some!</p>
              )}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;