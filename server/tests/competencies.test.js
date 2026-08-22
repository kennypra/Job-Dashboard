// Route-level CRUD tests for /api/competencies, mirroring stories.test.js.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

let tmpDir;
let server;
let baseUrl;

before(async () => {
  tmpDir = await mkdtemp(path.join(tmpdir(), 'job-dashboard-competencies-test-'));
  process.env.JOB_DASHBOARD_DATA_DIR = tmpDir;
  const { createApp } = await import('../src/app.js');
  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await rm(tmpDir, { recursive: true, force: true });
});

test('GET /api/competencies starts empty', async () => {
  const res = await fetch(`${baseUrl}/api/competencies`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), []);
});

test('POST /api/competencies rejects a missing name', async () => {
  const res = await fetch(`${baseUrl}/api/competencies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selfRating: 3 }),
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.match(body.details.join(', '), /name is required/);
});

test('POST /api/competencies rejects an out-of-range rating', async () => {
  const res = await fetch(`${baseUrl}/api/competencies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Ownership', selfRating: 7 }),
  });
  assert.equal(res.status, 400);
});

test('POST /api/competencies rejects a non-integer rating', async () => {
  const res = await fetch(`${baseUrl}/api/competencies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Ownership', selfRating: 3.5 }),
  });
  assert.equal(res.status, 400);
});

let createdId;

test('POST /api/competencies creates a record with a seeded history entry', async () => {
  const res = await fetch(`${baseUrl}/api/competencies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Ownership', selfRating: 3, notes: 'Baseline check-in' }),
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.ok(body.id);
  assert.equal(body.history.length, 1);
  assert.equal(body.history[0].rating, 3);
  createdId = body.id;
});

test('GET /api/competencies/:id fetches the created record', async () => {
  const res = await fetch(`${baseUrl}/api/competencies/${createdId}`);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).id, createdId);
});

test('GET /api/competencies/:id returns 404 for an unknown id', async () => {
  const res = await fetch(`${baseUrl}/api/competencies/does-not-exist`);
  assert.equal(res.status, 404);
});

test('PUT with a new selfRating appends to history instead of replacing it', async () => {
  const res = await fetch(`${baseUrl}/api/competencies/${createdId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selfRating: 4, notes: 'Felt stronger this round' }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.selfRating, 4);
  assert.equal(body.history.length, 2, 'history should grow, not overwrite');
  assert.equal(body.history[0].rating, 3, 'earlier entries stay intact');
  assert.equal(body.history[1].rating, 4);
});

test('PUT without selfRating (renaming only) does not touch history', async () => {
  const before = await (await fetch(`${baseUrl}/api/competencies/${createdId}`)).json();
  const res = await fetch(`${baseUrl}/api/competencies/${createdId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Ownership & Accountability' }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.name, 'Ownership & Accountability');
  assert.equal(body.history.length, before.history.length);
  assert.equal(body.selfRating, before.selfRating);
});

test('PUT rejects an out-of-range rating on update', async () => {
  const res = await fetch(`${baseUrl}/api/competencies/${createdId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selfRating: 0 }),
  });
  assert.equal(res.status, 400);
});

test('PUT /api/competencies/:id returns 404 for an unknown id', async () => {
  const res = await fetch(`${baseUrl}/api/competencies/does-not-exist`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selfRating: 3 }),
  });
  assert.equal(res.status, 404);
});

test('DELETE /api/competencies/:id removes the record', async () => {
  const res = await fetch(`${baseUrl}/api/competencies/${createdId}`, { method: 'DELETE' });
  assert.equal(res.status, 204);
  const check = await fetch(`${baseUrl}/api/competencies/${createdId}`);
  assert.equal(check.status, 404);
});

test('DELETE /api/competencies/:id returns 404 for an unknown id', async () => {
  const res = await fetch(`${baseUrl}/api/competencies/does-not-exist`, { method: 'DELETE' });
  assert.equal(res.status, 404);
});
