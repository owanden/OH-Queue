import twilio from 'twilio';
import { SMSConfig } from './types';

type MessageClient = {
  messages: { create(options: { body: string; from: string; to: string }): Promise<unknown> };
};

export function createWhatsAppSender(client: MessageClient, fromNumber: string) {
  return async (phoneNumber: string, message: string): Promise<boolean> => {
    try {
      const to = phoneNumber.startsWith('whatsapp:') ? phoneNumber : `whatsapp:${phoneNumber}`;
      await client.messages.create({ body: message, from: fromNumber, to });
      console.log('WhatsApp message sent');
      return true;
    } catch {
      console.error('Failed to send WhatsApp message');
      return false;
    }
  };
}

let sender: ReturnType<typeof createWhatsAppSender> | null = null;

export const initializeWhatsApp = (config: SMSConfig) => {
  sender = createWhatsAppSender(twilio(config.accountSid, config.authToken), config.fromNumber);
};

export const sendWhatsApp = async (phoneNumber: string, message: string): Promise<boolean> => {
  if (!sender) {
    console.error('WhatsApp not initialized');
    return false;
  }
  return sender(phoneNumber, message);
};
