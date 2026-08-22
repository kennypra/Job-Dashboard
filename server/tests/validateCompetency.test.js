import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateCompetency } from '../src/routes/competencies.js';

test('validateCompetency accepts a fully-populated valid record', () => {
  assert.deepEqual(validateCompetency({ name: 'Ownership', selfRating: 3, notes: 'x' }), []);
});

test('validateCompetency flags a missing name and selfRating', () => {
  const errors = validateCompetency({});
  assert.ok(errors.some((e) => e.includes('name')));
  assert.ok(errors.some((e) => e.includes('selfRating')));
});

test('validateCompetency rejects ratings outside 1-5', () => {
  assert.ok(validateCompetency({ name: 'x', selfRating: 0 }).length > 0);
  assert.ok(validateCompetency({ name: 'x', selfRating: 6 }).length > 0);
});

test('validateCompetency rejects a non-integer rating', () => {
  assert.ok(validateCompetency({ name: 'x', selfRating: 2.5 }).length > 0);
});

test('validateCompetency allows partial payloads when partial: true', () => {
  assert.deepEqual(validateCompetency({ notes: 'just updating notes' }, { partial: true }), []);
});

test('validateCompetency still validates selfRating range even when partial', () => {
  const errors = validateCompetency({ selfRating: 9 }, { partial: true });
  assert.ok(errors.some((e) => e.includes('selfRating')));
});

test('validateCompetency rejects a non-string notes field', () => {
  const errors = validateCompetency({ name: 'x', selfRating: 3, notes: 42 });
  assert.ok(errors.some((e) => e.includes('notes')));
});
