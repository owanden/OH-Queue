const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { createApp } = require('../dist/app');
const { dataStore, roomStore } = require('../dist/data');
const { createWhatsAppSender } = require('../dist/sms');
const bcrypt = require('bcryptjs');

const config = { ADMIN_USER: 'test-admin', ADMIN_PASS: 'test-password', JWT_SECRET: 'synthetic-test-key-'.repeat(3), NODE_ENV: 'development' };
let server, base, notifications, notificationError;

beforeEach(async () => {
  dataStore.clearAll();
  notifications = [];
  notificationError = null;
  const app = createApp(config, async (...args) => { notifications.push(args); if (notificationError) throw notificationError; return true; });
  server = await new Promise(resolve => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

afterEach(async () => {
  await new Promise(resolve => server.close(resolve));
  dataStore.clearAll();
});

async function request(path, method = 'GET', body, token) {
  return fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
}

async function login() {
  const response = await request('/api/login', 'POST', { username: config.ADMIN_USER, password: config.ADMIN_PASS });
  assert.equal(response.status, 200);
  return (await response.json()).token;
}

test('missing or weak authentication configuration fails before app construction', () => {
  for (const changes of [{ ADMIN_USER: undefined }, { ADMIN_PASS: '' }, { ADMIN_PASS: '   ' }, { JWT_SECRET: undefined }, { JWT_SECRET: '' }, { JWT_SECRET: 'dev-secret' }, { JWT_SECRET: ' '.repeat(64) }]) {
    assert.throws(() => createApp({ ...config, ...changes }, async () => false), /must/);
  }
});

test('login requires valid credentials and issues an expiring HS256 token', async () => {
  assert.equal((await request('/api/login', 'POST', { username: config.ADMIN_USER, password: 'wrong' })).status, 401);
  const token = await login();
  const payload = jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] });
  assert.equal(payload.username, config.ADMIN_USER);
  assert.equal(payload.exp - payload.iat, 6 * 60 * 60);
  assert.equal((await request('/api/rooms', 'POST', { name: 'Authorized room' }, token)).status, 201);
});

test('anonymous management requests cannot mutate state or invoke notifications', async () => {
  const student = await dataStore.addStudent('+15555550101', 'test', true);
  const ta = dataStore.addTA('Test TA');
  for (const [path, method, body] of [
    ['/api/rooms', 'POST', { name: 'Blocked room' }],
    ['/api/tas', 'POST', { name: 'Blocked TA' }],
    [`/api/tas/${ta.id}`, 'DELETE'],
    ['/api/queue/serve', 'POST'],
    [`/api/queue/${student.id}`, 'DELETE'],
    ['/api/clear', 'POST'],
  ]) assert.equal((await request(path, method, body)).status, 401, path);
  assert.equal(dataStore.getQueue().length, 1);
  assert.equal(dataStore.getActiveTAs().length, 1);
  assert.equal(notifications.length, 0);
  assert.equal((await request('/api/health')).status, 200);
  assert.equal((await request('/api/queue')).status, 200);
});

test('forged, expired, wrong-user and wrong-algorithm tokens are rejected', async () => {
  const tokens = [
    'malformed',
    jwt.sign({ username: config.ADMIN_USER }, 'dev-secret'),
    jwt.sign({ username: config.ADMIN_USER }, config.JWT_SECRET, { expiresIn: -1 }),
    jwt.sign({ username: 'someone-else' }, config.JWT_SECRET),
    jwt.sign({ username: config.ADMIN_USER }, config.JWT_SECRET, { algorithm: 'HS384' }),
  ];
  for (const token of tokens) assert.equal((await request('/api/queue/serve', 'POST', undefined, token)).status, 401);
  assert.equal(notifications.length, 0);
});

test('authenticated queue mutations retain notifications and TA management', async () => {
  const token = await login();
  const taResponse = await request('/api/tas', 'POST', { name: 'Test TA' }, token);
  assert.equal(taResponse.status, 200);
  const ta = await taResponse.json();
  assert.equal((await request(`/api/tas/${ta.id}`, 'DELETE', undefined, token)).status, 200);
  for (const phone of ['+15555550101', '+15555550102', '+15555550103']) await dataStore.addStudent(phone, 'test', true);
  assert.equal((await request('/api/queue/serve', 'POST', undefined, token)).status, 200);
  assert.equal(notifications.length, 1);
  const head = dataStore.getNextStudent();
  assert.equal((await request(`/api/queue/${head.student.id}`, 'DELETE', undefined, token)).status, 200);
  assert.equal(notifications.length, 2);
  assert.equal((await request('/api/clear', 'POST', undefined, token)).status, 200);
  assert.equal(dataStore.getQueue().length, 0);
});

test('notification test endpoint is absent for anonymous and authenticated requests', async () => {
  const token = await login();
  for (const authorization of [undefined, token]) {
    assert.equal((await request('/api/test-whatsapp', 'POST', { phoneNumber: '+15555550101', message: 'test' }, authorization)).status, 404);
  }
  assert.equal(notifications.length, 0);
});

test('server startup fails closed when signing configuration is absent', () => {
  const result = spawnSync(process.execPath, [path.resolve(__dirname, '../dist/index.js')], {
    env: { ...process.env, ADMIN_USER: 'test-admin', ADMIN_PASS: 'test-password', JWT_SECRET: '', TWILIO_ACCOUNT_SID: '', TWILIO_AUTH_TOKEN: '' },
    encoding: 'utf8', timeout: 10000,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /JWT_SECRET must contain at least 32 bytes/);
  assert.doesNotMatch(result.stdout, /Backend server running/);
});

function assertPublicStudent(student, internal) {
  assert.deepEqual(Object.keys(student).sort(), ['addedAt', 'consentToSMS', 'displayName', 'id', 'topic']);
  assert.equal(student.id, internal.id);
  const encoded = JSON.stringify(student);
  assert.ok(!encoded.includes(internal.phoneNumber));
  assert.ok(!encoded.includes(internal.phoneHash));
}

test('join, queue, next, room and serve responses omit internal phone fields', async () => {
  const response = await request('/api/queue', 'POST', { phoneNumber: '+15555550111', topic: 'synthetic', consentToSMS: false });
  assert.equal(response.status, 200);
  const joined = await response.json();
  const internal = dataStore.getNextStudent().student;
  assertPublicStudent(joined.student, internal);
  assertPublicStudent((await (await request('/api/queue')).json())[0].student, internal);
  assertPublicStudent((await (await request('/api/queue/next')).json()).student, internal);
  const room = roomStore.createRoom('Privacy room', 'test-admin');
  room.queue.push({ position: 1, student: internal });
  const roomResponse = await (await request(`/api/rooms/${room.code}`)).json();
  assertPublicStudent(roomResponse.queue[0].student, internal);
  const served = await request('/api/queue/serve', 'POST', undefined, await login());
  assert.equal(served.status, 200);
  assertPublicStudent((await served.json()).student, internal);
  assert.equal(await (await request('/api/queue/next')).json(), null);
  assert.equal(notifications.length, 0);
});

test('sequential and simultaneous duplicate joins create exactly one active entry', async () => {
  const body = { phoneNumber: '+15555550112', topic: 'synthetic' };
  assert.equal((await request('/api/queue', 'POST', body)).status, 200);
  assert.equal((await request('/api/queue', 'POST', body)).status, 409);
  dataStore.clearAll();
  const results = await Promise.all(Array.from({ length: 8 }, () => request('/api/queue', 'POST', body)));
  assert.deepEqual(results.map(response => response.status).sort(), [200, 409, 409, 409, 409, 409, 409, 409]);
  assert.equal(dataStore.getQueue().length, 1);
  assert.equal((await dataStore.getStudentByPhone(body.phoneNumber)).id, dataStore.getNextStudent().student.id);
  await request('/api/queue/serve', 'POST', undefined, await login());
  assert.equal((await request('/api/queue', 'POST', body)).status, 200);
});

test('failed admission releases its reservation and does not log the phone', async t => {
  const phone = '+15555550113';
  const errors = [];
  t.mock.method(console, 'error', (...args) => errors.push(args));
  const hash = t.mock.method(bcrypt, 'hash', async () => { throw new Error(phone); });
  assert.equal((await request('/api/queue', 'POST', { phoneNumber: phone })).status, 500);
  assert.equal(dataStore.getQueue().length, 0);
  hash.mock.restore();
  assert.equal((await request('/api/queue', 'POST', { phoneNumber: phone })).status, 200);
  assert.ok(!JSON.stringify(errors).includes(phone));
});

test('notification failures retain internal delivery recipients without logging them', async t => {
  const logs = [];
  t.mock.method(console, 'log', (...args) => logs.push(args));
  t.mock.method(console, 'error', (...args) => logs.push(args));
  const phones = ['+15555550114', '+15555550115', '+15555550116'];
  for (const phone of phones) await dataStore.addStudent(phone, 'synthetic', true);
  notificationError = new Error(phones.join(' '));
  const token = await login();
  assert.equal((await request('/api/queue/serve', 'POST', undefined, token)).status, 200);
  const head = dataStore.getNextStudent();
  assert.equal((await request(`/api/queue/${head.student.id}`, 'DELETE', undefined, token)).status, 200);
  assert.deepEqual(notifications.map(call => call[0]), [phones[0], phones[2]]);
  for (const phone of phones) assert.ok(!JSON.stringify(logs).includes(phone));
});

test('provider boundary formats requests and redacts success and error logs', async t => {
  const logs = [], sent = [];
  t.mock.method(console, 'log', (...args) => logs.push(args));
  t.mock.method(console, 'error', (...args) => logs.push(args));
  const phone = '+15555550117', message = 'synthetic-message';
  const send = createWhatsAppSender({ messages: { create: async value => { sent.push(value); } } }, 'whatsapp:synthetic-sender');
  assert.equal(await send(phone, message), true);
  assert.deepEqual(sent[0], { to: `whatsapp:${phone}`, from: 'whatsapp:synthetic-sender', body: message });
  await send(`whatsapp:${phone}`, message);
  assert.equal(sent[1].to, `whatsapp:${phone}`);
  const failing = createWhatsAppSender({ messages: { create: async () => { throw new Error(phone + message); } } }, 'synthetic-sender');
  assert.equal(await failing(phone, message), false);
  assert.ok(!JSON.stringify(logs).includes(phone));
  assert.ok(!JSON.stringify(logs).includes(message));
});
