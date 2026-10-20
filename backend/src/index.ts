import 'dotenv/config';
import { createApp } from './app';
import { roomStore } from './data';
import { initializeWhatsApp, sendWhatsApp } from './sms';

const app = createApp(process.env, sendWhatsApp);
const PORT = process.env.PORT || 3001;

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  initializeWhatsApp({
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'
  });
}

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  const defaultCode = process.env.DEFAULT_ROOM_CODE || 'DEMO01';
  const room = roomStore.createRoom('Demo Room', process.env.ADMIN_USER!, defaultCode);
  console.log(`Default room available at code: ${room.code}`);
});
