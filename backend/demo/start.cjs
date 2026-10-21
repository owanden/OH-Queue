const { randomBytes } = require('node:crypto');
const { createApp } = require('../dist/app');
const { roomStore } = require('../dist/data');

const config = { ADMIN_USER: 'demo-admin', ADMIN_PASS: 'demo-only-password', JWT_SECRET: randomBytes(32).toString('hex'), NODE_ENV: 'demo' };
let notifications = 0;
const app = createApp(config, async () => {
  console.log(JSON.stringify({ type: 'demo_notification', count: ++notifications }));
  return true;
});
roomStore.createRoom('Local demo', config.ADMIN_USER, 'DEMO01');
const port = Number(process.env.DEMO_PORT ?? 3001);
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid demo port');
const server = app.listen(port, '127.0.0.1', () => {
  console.log(JSON.stringify({ type: 'demo_ready', port: server.address().port, room: 'DEMO01', username: config.ADMIN_USER, password: config.ADMIN_PASS, notifications: 'simulated' }));
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
