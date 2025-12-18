const request = require('supertest');
const { app, db } = require('../src/app');

afterAll(() => {
  if (db) db.close();
});

const createTask = async (overrides = {}) => {
  const body = Object.assign({ description: 'Test task', dueDate: null, notes: null }, overrides);
  const res = await request(app).post('/api/tasks').send(body).set('Accept', 'application/json');
  expect(res.status).toBe(201);
  expect(res.body).toHaveProperty('id');
  return res.body;
};

describe('Tasks API', () => {
  it('creates and retrieves a task', async () => {
    const task = await createTask({ description: 'Create retrieve test', notes: 'note' });

    const getRes = await request(app).get(`/api/tasks/${task.id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body).toHaveProperty('id', task.id);
    expect(getRes.body.description).toBe('Create retrieve test');
    expect(getRes.body.notes).toBe('note');
    expect(getRes.body.completed).toBe(false);
  });

  it('returns 404 for missing task', async () => {
    const res = await request(app).get('/api/tasks/non-existent-id');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Task not found');
  });

  it('validates description on create', async () => {
    const res = await request(app).post('/api/tasks').send({}).set('Accept', 'application/json');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Description is required');
  });

  it('updates a task with PUT', async () => {
    const task = await createTask({ description: 'Put test' });
    const payload = { description: 'Updated via PUT', dueDate: null, notes: 'updated', completed: true };
    const putRes = await request(app).put(`/api/tasks/${task.id}`).send(payload).set('Accept', 'application/json');
    expect(putRes.status).toBe(200);
    expect(putRes.body.description).toBe('Updated via PUT');
    expect(putRes.body.completed).toBe(true);
  });

  it('patches a task partially', async () => {
    const task = await createTask({ description: 'Patch test' });
    const patchRes = await request(app).patch(`/api/tasks/${task.id}`).send({ completed: true }).set('Accept', 'application/json');
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.completed).toBe(true);
  });

  it('deletes a task', async () => {
    const task = await createTask({ description: 'Delete test' });
    const delRes = await request(app).delete(`/api/tasks/${task.id}`);
    expect(delRes.status).toBe(204);

    const getRes = await request(app).get(`/api/tasks/${task.id}`);
    expect(getRes.status).toBe(404);
  });

  it('lists tasks with query filters', async () => {
    // Create a few tasks
    await createTask({ description: 'List one', notes: 'alpha' });
    await createTask({ description: 'List two', notes: 'beta', completed: true });

    const resAll = await request(app).get('/api/tasks');
    expect(resAll.status).toBe(200);
    expect(Array.isArray(resAll.body)).toBe(true);

    const resFiltered = await request(app).get('/api/tasks').query({ q: 'alpha' });
    expect(resFiltered.status).toBe(200);
    expect(resFiltered.body.length).toBeGreaterThanOrEqual(1);
  });
});
