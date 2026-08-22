import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { listItems, getItem, createItem, updateItem, deleteItem } from '../store.js';

const COLLECTION = 'stories';

const REQUIRED_FIELDS = ['title', 'situation', 'task', 'action', 'result'];

// Exported so tests can exercise validation without going through HTTP —
// same pattern as routes/interviews.js.
export function validateStory(body, { partial = false } = {}) {
  const errors = [];

  if (!partial) {
    for (const field of REQUIRED_FIELDS) {
      if (!body[field] || (typeof body[field] === 'string' && !body[field].trim())) {
        errors.push(`${field} is required`);
      }
    }
  }

  if (body.competencyTags !== undefined) {
    if (!Array.isArray(body.competencyTags)) {
      errors.push('competencyTags must be an array of strings');
    } else if (body.competencyTags.some((t) => typeof t !== 'string' || !t.trim())) {
      errors.push('competencyTags entries must be non-empty strings');
    }
  }

  if (body.usedFor !== undefined) {
    if (!Array.isArray(body.usedFor)) {
      errors.push('usedFor must be an array of interview ids');
    } else if (body.usedFor.some((id) => typeof id !== 'string' || !id.trim())) {
      errors.push('usedFor entries must be non-empty interview id strings');
    }
  }

  return errors;
}

function normalizeTags(tags) {
  // Trim, drop empties/dupes, but preserve the casing the user typed
  // (e.g. "Ownership" vs "ownership" — Milestone 3's rubric will decide
  // canonical casing; we don't want to silently rewrite what they entered).
  const seen = new Set();
  const out = [];
  for (const raw of tags || []) {
    const t = raw.trim();
    const key = t.toLowerCase();
    if (t && !seen.has(key)) {
      seen.add(key);
      out.push(t);
    }
  }
  return out;
}

export default function createStoriesRouter() {
  const router = Router();

  router.get('/', async (req, res, next) => {
    try {
      const items = await listItems(COLLECTION);
      res.json(items);
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const item = await getItem(COLLECTION, req.params.id);
      if (!item) return res.status(404).json({ error: 'Story not found' });
      res.json(item);
    } catch (err) {
      next(err);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const errors = validateStory(req.body);
      if (errors.length) {
        return res.status(400).json({ error: 'Validation failed', details: errors });
      }
      const now = new Date().toISOString();
      const item = {
        id: randomUUID(),
        title: req.body.title.trim(),
        situation: req.body.situation.trim(),
        task: req.body.task.trim(),
        action: req.body.action.trim(),
        result: req.body.result.trim(),
        competencyTags: normalizeTags(req.body.competencyTags),
        usedFor: req.body.usedFor || [],
        createdAt: now,
        updatedAt: now,
      };
      const created = await createItem(COLLECTION, item);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id', async (req, res, next) => {
    try {
      const errors = validateStory(req.body, { partial: true });
      if (errors.length) {
        return res.status(400).json({ error: 'Validation failed', details: errors });
      }
      const patch = { ...req.body, updatedAt: new Date().toISOString() };
      delete patch.id;
      delete patch.createdAt;
      for (const field of ['title', 'situation', 'task', 'action', 'result']) {
        if (patch[field] !== undefined) patch[field] = patch[field].trim();
      }
      if (patch.competencyTags !== undefined) patch.competencyTags = normalizeTags(patch.competencyTags);
      const updated = await updateItem(COLLECTION, req.params.id, patch);
      if (!updated) return res.status(404).json({ error: 'Story not found' });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      const removed = await deleteItem(COLLECTION, req.params.id);
      if (!removed) return res.status(404).json({ error: 'Story not found' });
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
