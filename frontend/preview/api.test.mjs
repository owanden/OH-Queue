import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as api from './api.ts';

beforeEach(() => api.resetPreview());

test('preview operations use synthetic memory without network or supplied personal fields', async t => {
  t.mock.method(globalThis, 'fetch', () => { throw new Error('Unexpected network request'); });
  const joined = await api.addStudentToQueue('ignored-private-phone', 'ignored-private-topic', true);
  await api.addTA('ignored-private-name');
  assert.equal(joined.student.topic, 'Synthetic queue example');
  assert.equal(joined.student.consentToSMS, false);
  const contents = JSON.stringify([await api.getQueue(), await api.getTAs()]);
  assert.ok(!contents.includes('ignored-private'));
  assert.ok(!contents.includes('phoneNumber'));
  assert.equal((await api.serveNextStudent()).student.displayName, 'Blue Llama');
  await api.dropStudent(joined.student.id);
  await api.removeTA('sample-ta');
  assert.equal(globalThis.fetch.mock.callCount(), 0);
  await assert.rejects(api.login('x', 'y'), /unavailable/);
  await assert.rejects(api.createRoom('x'), /unavailable/);
});

test('snapshots cannot mutate samples and resetting restores the initial queue', async () => {
  const snapshot = await api.getQueue();
  snapshot[0].student.displayName = 'changed';
  assert.equal((await api.getQueue())[0].student.displayName, 'Blue Llama');
  await api.clearAllData();
  assert.equal((await api.getQueue()).length, 0);
  await assert.rejects(api.serveNextStudent(), /No sample students/);
  api.resetPreview();
  assert.equal((await api.getQueue()).length, 2);
  assert.equal((await api.getTAs()).length, 1);
});
