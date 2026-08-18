// CRUD tests against the JSON-file store, isolated from the real data/
// directory via JOB_DASHBOARD_DATA_DIR pointed at a scratch temp dir.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

let tmpDir;
let store;

before(async () => {
  tmpDir = await mkdtemp(path.join(tmpdir(), 'job-dashboard-store-test-'));
  process.env.JOB_DASHBOARD_DATA_DIR = tmpDir;
  store = await import('../src/store.js');
});

after(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

test('readDB creates an empty db with all four collections on first read', async () => {
  const db = await store.readDB();
  assert.deepEqual(db, {
    interviews: [],
    stories: [],
    competencies: [],
    technicalTopics: [],
  });
});

test('createItem adds a record retrievable via listItems and getItem', async () => {
  const item = { id: 'i1', company: 'Acme', role: 'Data Scientist', status: 'upcoming' };
  const created = await store.createItem('interviews', item);
  assert.equal(created.id, 'i1');

  const items = await store.listItems('interviews');
  assert.equal(items.length, 1);
  assert.equal(items[0].company, 'Acme');

  const found = await store.getItem('interviews', 'i1');
  assert.equal(found.role, 'Data Scientist');
});

test('updateItem patches an existing record and preserves its id', async () => {
  const updated = await store.updateItem('interviews', 'i1', { status: 'completed', id: 'ignored' });
  assert.ok(updated);
  assert.equal(updated.status, 'completed');
  assert.equal(updated.id, 'i1');
  assert.equal(updated.company, 'Acme', 'untouched fields should survive a partial patch');
});

test('updateItem returns null for an id that does not exist', async () => {
  const result = await store.updateItem('interviews', 'does-not-exist', { status: 'completed' });
  assert.equal(result, null);
});

test('getItem returns null for an id that does not exist', async () => {
  const result = await store.getItem('interviews', 'does-not-exist');
  assert.equal(result, null);
});

test('deleteItem removes a record and reports success', async () => {
  const removed = await store.deleteItem('interviews', 'i1');
  assert.equal(removed, true);
  const items = await store.listItems('interviews');
  assert.equal(items.length, 0);
});

test('deleteItem returns false for an id that does not exist', async () => {
  const removed = await store.deleteItem('interviews', 'does-not-exist');
  assert.equal(removed, false);
});

test('concurrent writes are serialized and do not drop records', async () => {
  const writes = Array.from({ length: 10 }, (_, i) =>
    store.createItem('stories', { id: `s${i}`, title: `Story ${i}` })
  );
  await Promise.all(writes);
  const stories = await store.listItems('stories');
  assert.equal(stories.length, 10);
  const ids = new Set(stories.map((s) => s.id));
  assert.equal(ids.size, 10, 'no records should be lost to a write race');
});
