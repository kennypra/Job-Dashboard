// Route-level CRUD tests for /api/stories, mirroring interviews.test.js.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

let tmpDir;
let server;
let baseUrl;

const validStory = {
  title: 'Led a cross-team migration under a hard deadline',
  situation: 'Our data pipeline was on a deprecated platform being sunset in 6 weeks.',
  task: 'I was asked to lead the migration without slipping any team deliverables.',
  action: 'Broke the migration into parallelizable chunks and negotiated scope with two other teams.',
  result: 'Migrated on time with zero data loss and no missed deliverables.',
  competencyTags: ['Ownership', 'Prioritization'],
  usedFor: [],
};

before(async () => {
  tmpDir = await mkdtemp(path.join(tmpdir(), 'job-dashboard-stories-test-'));
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

test('GET /api/stories starts empty', async () => {
  const res = await fetch(`${baseUrl}/api/stories`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), []);
});

test('POST /api/stories rejects a missing required field', async () => {
  const { situation, ...missingSituation } = validStory;
  const res = await fetch(`${baseUrl}/api/stories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(missingSituation),
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.match(body.details.join(', '), /situation is required/);
});

test('POST /api/stories rejects non-array competencyTags', async () => {
  const res = await fetch(`${baseUrl}/api/stories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...validStory, competencyTags: 'Ownership' }),
  });
  assert.equal(res.status, 400);
});

let createdId;

test('POST /api/stories creates a record and de-dupes tags case-insensitively', async () => {
  const res = await fetch(`${baseUrl}/api/stories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...validStory, competencyTags: ['Ownership', 'ownership', 'Prioritization'] }),
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.ok(body.id);
  assert.deepEqual(body.competencyTags, ['Ownership', 'Prioritization']);
  createdId = body.id;
});

test('GET /api/stories/:id fetches the created record', async () => {
  const res = await fetch(`${baseUrl}/api/stories/${createdId}`);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).id, createdId);
});

test('GET /api/stories/:id returns 404 for an unknown id', async () => {
  const res = await fetch(`${baseUrl}/api/stories/does-not-exist`);
  assert.equal(res.status, 404);
});

test('PUT /api/stories/:id links an interview via usedFor', async () => {
  const res = await fetch(`${baseUrl}/api/stories/${createdId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usedFor: ['interview-123'] }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(body.usedFor, ['interview-123']);
  assert.equal(body.title, validStory.title, 'unpatched fields survive a partial update');
});

test('PUT /api/stories/:id returns 404 for an unknown id', async () => {
  const res = await fetch(`${baseUrl}/api/stories/does-not-exist`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'x' }),
  });
  assert.equal(res.status, 404);
});

test('DELETE /api/stories/:id removes the record', async () => {
  const res = await fetch(`${baseUrl}/api/stories/${createdId}`, { method: 'DELETE' });
  assert.equal(res.status, 204);
  const check = await fetch(`${baseUrl}/api/stories/${createdId}`);
  assert.equal(check.status, 404);
});

test('DELETE /api/stories/:id returns 404 for an unknown id', async () => {
  const res = await fetch(`${baseUrl}/api/stories/does-not-exist`, { method: 'DELETE' });
  assert.equal(res.status, 404);
});
