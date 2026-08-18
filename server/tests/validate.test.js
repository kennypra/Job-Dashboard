import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateInterview } from '../src/routes/interviews.js';

const validInterview = {
  company: 'Acme Corp',
  role: 'Data Scientist',
  stage: 'Phone Screen',
  format: 'Phone',
  date: '2026-09-01',
  status: 'upcoming',
};

test('validateInterview accepts a fully-populated valid record', () => {
  assert.deepEqual(validateInterview(validInterview), []);
});

test('validateInterview flags every missing required field', () => {
  const errors = validateInterview({});
  for (const field of ['company', 'role', 'stage', 'format', 'date', 'status']) {
    assert.ok(errors.some((e) => e.includes(field)), `expected an error mentioning ${field}`);
  }
});

test('validateInterview rejects an unknown stage/format/status', () => {
  const errors = validateInterview({
    ...validInterview,
    stage: 'Coffee Chat',
    format: 'Carrier Pigeon',
    status: 'ghosted',
  });
  assert.equal(errors.length, 3);
});

test('validateInterview allows partial payloads when partial: true', () => {
  assert.deepEqual(validateInterview({ status: 'completed' }, { partial: true }), []);
});

test('validateInterview rejects malformed interviewers', () => {
  const errors = validateInterview({ ...validInterview, interviewers: [{ title: 'no name' }] });
  assert.ok(errors.some((e) => e.includes('interviewer')));
});

test('validateInterview rejects a non-array interviewers field', () => {
  const errors = validateInterview({ ...validInterview, interviewers: 'not-an-array' });
  assert.ok(errors.some((e) => e.includes('interviewers')));
});

test('validateInterview rejects a non-boolean remote flag', () => {
  const errors = validateInterview({ ...validInterview, remote: 'yes' });
  assert.ok(errors.some((e) => e.includes('remote')));
});
