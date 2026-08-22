import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateStory } from '../src/routes/stories.js';

const validStory = {
  title: 'Title',
  situation: 'Situation',
  task: 'Task',
  action: 'Action',
  result: 'Result',
};

test('validateStory accepts a fully-populated valid record', () => {
  assert.deepEqual(validateStory(validStory), []);
});

test('validateStory flags every missing required field', () => {
  const errors = validateStory({});
  for (const field of ['title', 'situation', 'task', 'action', 'result']) {
    assert.ok(errors.some((e) => e.includes(field)), `expected an error mentioning ${field}`);
  }
});

test('validateStory allows partial payloads when partial: true', () => {
  assert.deepEqual(validateStory({ title: 'New title' }, { partial: true }), []);
});

test('validateStory rejects non-string tag entries', () => {
  const errors = validateStory({ ...validStory, competencyTags: ['Ownership', 42] });
  assert.ok(errors.some((e) => e.includes('competencyTags')));
});

test('validateStory rejects a non-array usedFor field', () => {
  const errors = validateStory({ ...validStory, usedFor: 'interview-1' });
  assert.ok(errors.some((e) => e.includes('usedFor')));
});
