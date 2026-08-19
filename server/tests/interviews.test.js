// Route-level CRUD tests, hitting a real (ephemeral-port) instance of the
// app over HTTP so validation, status codes, and the store are all
// exercised together.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

let tmpDir;
let server;
let baseUrl;

const validInterview = {
  company: 'Acme Corp',
  role: 'Data Scientist',
  city: 'Remote',
  remote: true,
  stage: 'Phone Screen',
  format: 'Phone',
  date: '2026-09-01',
  time: '10:00',
  status: 'upcoming',
  interviewers: [{ name: 'Jordan Lee', title: 'Recruiter' }],
  prepNotes: 'Review resume',
  debriefNotes: '',
};

before(async () => {
  tmpDir = await mkdtemp(path.join(tmpdir(), 'job-dashboard-api-test-'));
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

test('GET /api/interviews starts empty', async () => {
  const res = await fetch(`${baseUrl}/api/interviews`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(body, []);
});

test('POST /api/interviews rejects a missing required field', async () => {
  const { company, ...missingCompany } = validInterview;
  const res = await fetch(`${baseUrl}/api/interviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(missingCompany),
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.match(body.details.join(', '), /company is required/);
});

test('POST /api/interviews rejects an invalid enum value', async () => {
  const res = await fetch(`${baseUrl}/api/interviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...validInterview, status: 'not-a-real-status' }),
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.match(body.details.join(', '), /status must be one of/);
});

let createdId;

test('POST /api/interviews creates a record with generated id and timestamps', async () => {
  const res = await fetch(`${baseUrl}/api/interviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validInterview),
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.ok(body.id);
  assert.ok(body.createdAt);
  assert.equal(body.company, 'Acme Corp');
  createdId = body.id;
});

test('GET /api/interviews/:id fetches the created record', async () => {
  const res = await fetch(`${baseUrl}/api/interviews/${createdId}`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.id, createdId);
});

test('GET /api/interviews/:id returns 404 for an unknown id', async () => {
  const res = await fetch(`${baseUrl}/api/interviews/does-not-exist`);
  assert.equal(res.status, 404);
});

test('PUT /api/interviews/:id updates fields and bumps updatedAt', async () => {
  const before = await (await fetch(`${baseUrl}/api/interviews/${createdId}`)).json();
  const res = await fetch(`${baseUrl}/api/interviews/${createdId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'completed', debriefNotes: 'Went well.' }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 'completed');
  assert.equal(body.debriefNotes, 'Went well.');
  assert.equal(body.company, 'Acme Corp', 'unpatched fields survive a partial update');
  assert.notEqual(body.updatedAt, before.updatedAt);
});

test('PUT /api/interviews/:id returns 404 for an unknown id', async () => {
  const res = await fetch(`${baseUrl}/api/interviews/does-not-exist`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'completed' }),
  });
  assert.equal(res.status, 404);
});

test('DELETE /api/interviews/:id removes the record', async () => {
  const res = await fetch(`${baseUrl}/api/interviews/${createdId}`, { method: 'DELETE' });
  assert.equal(res.status, 204);

  const check = await fetch(`${baseUrl}/api/interviews/${createdId}`);
  assert.equal(check.status, 404);
});

test('DELETE /api/interviews/:id returns 404 for an unknown id', async () => {
  const res = await fetch(`${baseUrl}/api/interviews/does-not-exist`, { method: 'DELETE' });
  assert.equal(res.status, 404);
});
