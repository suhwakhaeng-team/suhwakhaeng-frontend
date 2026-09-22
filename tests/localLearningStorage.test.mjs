import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clearAccountLearningData,
  LOCAL_LEARNING_STORAGE_KEYS,
  ONBOARDING_RESULT_STORAGE_KEY,
} from '../src/lib/localLearningStorage.ts';

class MemoryStorage {
  constructor(entries = []) {
    this.values = new Map(entries);
  }

  get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index] ?? null; }
  removeItem(key) { this.values.delete(key); }
  has(key) { return this.values.has(key); }
}

test('account deletion clears local learning state without touching another account', () => {
  const uid = 'google/user@example.com';
  const encodedUid = encodeURIComponent(uid);
  const local = new MemoryStorage([
    ...Object.values(LOCAL_LEARNING_STORAGE_KEYS).map(key => [key, 'saved']),
    [`suhwakhaeng:learning-graph:v1:${encodedUid}:probability`, 'saved'],
    ['suhwakhaeng:learning-graph:v1:other-user:probability', 'saved'],
    ['unrelated-preference', 'saved'],
  ]);
  const session = new MemoryStorage([[ONBOARDING_RESULT_STORAGE_KEY, 'saved']]);

  clearAccountLearningData(uid, local, session);

  for (const key of Object.values(LOCAL_LEARNING_STORAGE_KEYS)) assert.equal(local.has(key), false);
  assert.equal(local.has(`suhwakhaeng:learning-graph:v1:${encodedUid}:probability`), false);
  assert.equal(local.has('suhwakhaeng:learning-graph:v1:other-user:probability'), true);
  assert.equal(local.has('unrelated-preference'), true);
  assert.equal(session.has(ONBOARDING_RESULT_STORAGE_KEY), false);
});
