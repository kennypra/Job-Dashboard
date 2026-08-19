// Local JSON-file-backed persistence.
//
// Design notes (see spec section 6/10 — reliability, no silent failures):
//   - Reads/writes go through a single JSON file (data/db.json).
//   - Writes are serialized through an in-process queue so two overlapping
//     requests can never interleave and corrupt the file.
//   - Writes are atomic: we write to a temp file then rename() over the
//     real file, so a crash mid-write never leaves a half-written db.json.
//   - Every failure throws instead of swallowing — routes turn that into a
//     clear HTTP error rather than pretending the save succeeded.
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { existsSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Overridable so tests can point at a scratch directory instead of the
// real data/ folder.
const DATA_DIR = process.env.JOB_DASHBOARD_DATA_DIR || path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');
const SEED_PATH = path.join(DATA_DIR, 'db.seed.json');

// All four data models from the spec live here from day one, even though
// only `interviews` has routes/UI wired up in Milestone 1. Keeping the
// shape stable now means later milestones only add routes/UI, not a data
// migration.
const EMPTY_DB = {
  interviews: [],
  stories: [],
  competencies: [],
  technicalTopics: [],
};

async function ensureDB() {
  await mkdir(DATA_DIR, { recursive: true });
  if (!existsSync(DB_PATH)) {
    if (existsSync(SEED_PATH)) {
      copyFileSync(SEED_PATH, DB_PATH);
    } else {
      await writeFile(DB_PATH, JSON.stringify(EMPTY_DB, null, 2), 'utf-8');
    }
  }
}

async function readDBRaw() {
  await ensureDB();
  let raw;
  try {
    raw = await readFile(DB_PATH, 'utf-8');
  } catch (err) {
    throw new Error(`Failed to read database file: ${err.message}`);
  }
  try {
    const parsed = JSON.parse(raw);
    return { ...EMPTY_DB, ...parsed };
  } catch (err) {
    throw new Error(`Database file is corrupted (invalid JSON): ${err.message}`);
  }
}

// Plain read, used for GETs — doesn't need to go through the mutation
// queue since it doesn't modify anything.
export async function readDB() {
  return readDBRaw();
}

async function performWrite(db) {
  await mkdir(DATA_DIR, { recursive: true });
  const tmpPath = path.join(DATA_DIR, `.db.json.tmp-${process.pid}-${Date.now()}`);
  try {
    await writeFile(tmpPath, JSON.stringify(db, null, 2), 'utf-8');
    await rename(tmpPath, DB_PATH);
  } catch (err) {
    throw new Error(`Failed to save database: ${err.message}`);
  }
}

export function writeDB(db) {
  return enqueue(() => performWrite(db));
}

// Every mutation (read current state -> modify -> persist) must run as one
// atomic step relative to other mutations, or two concurrent requests can
// each read the same stale snapshot and one's write clobbers the other's.
// `enqueue` chains each mutator onto a single queue so they run one at a
// time, in order, each seeing every previous mutation's result.
let queue = Promise.resolve();

function enqueue(mutator) {
  const result = queue.then(mutator, mutator);
  // Keep the chain alive even if this step rejected, so one failed
  // mutation doesn't permanently jam the queue for later, unrelated ones.
  queue = result.then(
    () => {},
    () => {}
  );
  return result;
}

// --- Generic per-collection helpers -----------------------------------

export async function listItems(collection) {
  const db = await readDBRaw();
  return db[collection];
}

export async function getItem(collection, id) {
  const db = await readDBRaw();
  return db[collection].find((item) => item.id === id) || null;
}

export function createItem(collection, item) {
  return enqueue(async () => {
    const db = await readDBRaw();
    db[collection].push(item);
    await performWrite(db);
    return item;
  });
}

export function updateItem(collection, id, patch) {
  return enqueue(async () => {
    const db = await readDBRaw();
    const idx = db[collection].findIndex((item) => item.id === id);
    if (idx === -1) return null;
    db[collection][idx] = { ...db[collection][idx], ...patch, id };
    await performWrite(db);
    return db[collection][idx];
  });
}

export function deleteItem(collection, id) {
  return enqueue(async () => {
    const db = await readDBRaw();
    const idx = db[collection].findIndex((item) => item.id === id);
    if (idx === -1) return false;
    db[collection].splice(idx, 1);
    await performWrite(db);
    return true;
  });
}
