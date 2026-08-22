import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { listItems, getItem, createItem, updateItem, deleteItem } from '../store.js';

const COLLECTION = 'competencies';

// Exported so tests can exercise validation without going through HTTP —
// same pattern as routes/interviews.js and routes/stories.js.
export function validateCompetency(body, { partial = false } = {}) {
  const errors = [];

  if (!partial) {
    if (!body.name || !body.name.trim()) errors.push('name is required');
    if (body.selfRating === undefined || body.selfRating === null) {
      errors.push('selfRating is required');
    }
  }

  if (body.selfRating !== undefined && body.selfRating !== null) {
    const r = body.selfRating;
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      errors.push('selfRating must be an integer from 1 to 5');
    }
  }

  if (body.notes !== undefined && body.notes !== null && typeof body.notes !== 'string') {
    errors.push('notes must be a string');
  }

  return errors;
}

export default function createCompetenciesRouter() {
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
      if (!item) return res.status(404).json({ error: 'Competency not found' });
      res.json(item);
    } catch (err) {
      next(err);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const errors = validateCompetency(req.body);
      if (errors.length) {
        return res.status(400).json({ error: 'Validation failed', details: errors });
      }
      const now = new Date().toISOString();
      const item = {
        id: randomUUID(),
        name: req.body.name.trim(),
        selfRating: req.body.selfRating,
        lastAssessed: now,
        notes: req.body.notes || '',
        // Every rating starts its own timeline — spec 5.8 wants a
        // timestamped history so growth is visible over time, not just a
        // current snapshot, so the very first rating counts as day one.
        history: [{ date: now, rating: req.body.selfRating, note: req.body.notes || '' }],
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
      const errors = validateCompetency(req.body, { partial: true });
      if (errors.length) {
        return res.status(400).json({ error: 'Validation failed', details: errors });
      }

      const existing = await getItem(COLLECTION, req.params.id);
      if (!existing) return res.status(404).json({ error: 'Competency not found' });

      const now = new Date().toISOString();
      const patch = { ...req.body, updatedAt: now };
      delete patch.id;
      delete patch.createdAt;
      delete patch.history; // history is derived below, never taken from the client directly
      if (patch.name !== undefined) patch.name = patch.name.trim();

      // A rating change (or re-confirmation) is a new dated event — append
      // rather than overwrite, so past ratings stay visible for the
      // growth-over-time view.
      if (req.body.selfRating !== undefined && req.body.selfRating !== null) {
        patch.lastAssessed = now;
        patch.history = [
          ...existing.history,
          { date: now, rating: req.body.selfRating, note: req.body.notes ?? existing.notes ?? '' },
        ];
      }

      const updated = await updateItem(COLLECTION, req.params.id, patch);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      const removed = await deleteItem(COLLECTION, req.params.id);
      if (!removed) return res.status(404).json({ error: 'Competency not found' });
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
