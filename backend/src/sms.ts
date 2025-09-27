import twilio from 'twilio';
import { SMSConfig } from './types';

let twilioClient: twilio.Twilio | null = null;

export const initializeWhatsApp = (config: SMSConfig) => {
  twilioClient = twilio(config.accountSid, config.authToken);
};

export const sendWhatsApp = async (phoneNumber: string, message: string): Promise<boolean> => {
  if (!twilioClient) {
    console.error('WhatsApp not initialized. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.');
    return false;
  }

  try {
    // Format phone number for WhatsApp (ensure it starts with whatsapp:)
    const whatsappNumber = phoneNumber.startsWith('whatsapp:') ? phoneNumber : `whatsapp:${phoneNumber}`;
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Twilio sandbox number

    await twilioClient.messages.create({
      body: message,
      from: fromNumber,
      to: whatsappNumber
    });
    console.log(`WhatsApp message sent to ${phoneNumber}: ${message}`);
    return true;
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
    return false;
  }
};