import twilio from 'twilio';
import { SMSConfig } from './types';

let twilioClient: twilio.Twilio | null = null;

export const initializeSMS = (config: SMSConfig) => {
  twilioClient = twilio(config.accountSid, config.authToken);
};

export const sendSMS = async (phoneNumber: string, message: string): Promise<boolean> => {
  if (!twilioClient) {
    console.error('SMS not initialized. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.');
    return false;
  }

  try {
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_FROM_NUMBER || '+1234567890',
      to: phoneNumber
    });
    console.log(`SMS sent to ${phoneNumber}: ${message}`);
    return true;
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return false;
  }
};
