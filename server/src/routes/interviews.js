import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { listItems, getItem, createItem, updateItem, deleteItem } from '../store.js';

const COLLECTION = 'interviews';

export const STAGES = [
  'Phone Screen',
  'Technical Screen',
  'Behavioral Round',
  'Onsite/Panel',
  'Final Round',
  'Offer Discussion',
  'Other',
];
export const FORMATS = ['Phone', 'Video', 'Onsite'];
export const STATUSES = [
  'upcoming',
  'rescheduled',
  'completed',
  'advanced',
  'offer',
  'rejected',
  'withdrawn',
];

const REQUIRED_FIELDS = ['company', 'role', 'stage', 'format', 'date', 'status'];

// Exported so tests can exercise validation without going through HTTP.
export function validateInterview(body, { partial = false } = {}) {
  const errors = [];

  if (!partial) {
    for (const field of REQUIRED_FIELDS) {
      if (!body[field] || (typeof body[field] === 'string' && !body[field].trim())) {
        errors.push(`${field} is required`);
      }
    }
  }

  if (body.stage !== undefined && !STAGES.includes(body.stage)) {
    errors.push(`stage must be one of: ${STAGES.join(', ')}`);
  }
  if (body.format !== undefined && !FORMATS.includes(body.format)) {
    errors.push(`format must be one of: ${FORMATS.join(', ')}`);
  }
  if (body.status !== undefined && !STATUSES.includes(body.status)) {
    errors.push(`status must be one of: ${STATUSES.join(', ')}`);
  }
  if (body.interviewers !== undefined) {
    if (!Array.isArray(body.interviewers)) {
      errors.push('interviewers must be an array of { name, title }');
    } else if (body.interviewers.some((i) => typeof i.name !== 'string' || !i.name.trim())) {
      errors.push('each interviewer needs a non-empty name');
    }
  }
  if (body.remote !== undefined && typeof body.remote !== 'boolean') {
    errors.push('remote must be a boolean');
  }

  return errors;
}

function sanitizeInterviewer(i) {
  return { name: (i.name || '').trim(), title: (i.title || '').trim() };
}

export default function createInterviewsRouter() {
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
      if (!item) return res.status(404).json({ error: 'Interview not found' });
      res.json(item);
    } catch (err) {
      next(err);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const errors = validateInterview(req.body);
      if (errors.length) {
        return res.status(400).json({ error: 'Validation failed', details: errors });
      }
      const now = new Date().toISOString();
      const item = {
        id: randomUUID(),
        company: req.body.company.trim(),
        role: req.body.role.trim(),
        city: (req.body.city || '').trim(),
        remote: !!req.body.remote,
        stage: req.body.stage,
        format: req.body.format,
        date: req.body.date,
        time: req.body.time || '',
        status: req.body.status,
        interviewers: (req.body.interviewers || []).map(sanitizeInterviewer),
        prepNotes: req.body.prepNotes || '',
        debriefNotes: req.body.debriefNotes || '',
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
      const errors = validateInterview(req.body, { partial: true });
      if (errors.length) {
        return res.status(400).json({ error: 'Validation failed', details: errors });
      }
      const patch = { ...req.body, updatedAt: new Date().toISOString() };
      delete patch.id;
      delete patch.createdAt;
      if (patch.company !== undefined) patch.company = patch.company.trim();
      if (patch.role !== undefined) patch.role = patch.role.trim();
      if (patch.city !== undefined) patch.city = patch.city.trim();
      if (patch.interviewers !== undefined) {
        patch.interviewers = patch.interviewers.map(sanitizeInterviewer);
      }
      const updated = await updateItem(COLLECTION, req.params.id, patch);
      if (!updated) return res.status(404).json({ error: 'Interview not found' });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      const removed = await deleteItem(COLLECTION, req.params.id);
      if (!removed) return res.status(404).json({ error: 'Interview not found' });
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
