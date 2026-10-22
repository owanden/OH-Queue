const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { createInterface } = require('node:readline');
const { once } = require('node:events');
const path = require('node:path');

test('demo startup supports guest join, admin serve and a simulated notification', { timeout: 15000 }, async t => {
  const child = spawn(process.execPath, [path.resolve(__dirname, '../demo/start.cjs')], {
    env: { ...process.env, DEMO_PORT: '0', TWILIO_ACCOUNT_SID: 'ignored-demo-value', TWILIO_AUTH_TOKEN: 'ignored-demo-value' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const lines = createInterface({ input: child.stdout });
  let notificationResolve;
  const notified = new Promise(resolve => { notificationResolve = resolve; });
  let readyResolve, readyReject;
  const ready = new Promise((resolve, reject) => { readyResolve = resolve; readyReject = reject; });
  child.on('error', readyReject);
  child.on('exit', () => readyReject(new Error('Demo exited before readiness')));
  lines.on('line', line => {
    try {
      const message = JSON.parse(line);
      if (message.type === 'demo_notification') notificationResolve(message);
      if (message.type === 'demo_ready') readyResolve(message);
    } catch {}
  });
  t.after(async () => {
    lines.close();
    if (child.exitCode === null && child.signalCode === null) {
      const exited = once(child, 'exit');
      child.kill();
      await exited;
    }
  });
  const info = await ready;
  const base = `http://127.0.0.1:${info.port}`;
  const request = (route, method = 'GET', body, token) => fetch(base + route, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  assert.equal(info.notifications, 'simulated');
  assert.equal((await request('/api/rooms/DEMO01')).status, 200);
  const join = await request('/api/rooms/DEMO01/queue', 'POST', { phoneNumber: '+15555550122', topic: 'demo', consentToSMS: true });
  assert.equal(join.status, 200);
  const student = (await join.json()).student;
  assert.equal(student.phoneNumber, undefined);
  assert.equal((await request('/api/rooms/DEMO01/queue/serve', 'POST')).status, 401);
  const login = await request('/api/login', 'POST', { username: info.username, password: info.password });
  const { token } = await login.json();
  assert.ok(token);
  assert.equal((await request('/api/rooms/DEMO01/queue/serve', 'POST', undefined, token)).status, 200);
  assert.deepEqual(await (await request('/api/rooms/DEMO01/queue')).json(), []);
  assert.equal((await request('/api/test-whatsapp', 'POST')).status, 404);
  assert.equal((await notified).count, 1);
});
