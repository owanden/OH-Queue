export interface TA {
  id: string;
  name: string;
  isActive: boolean;
}

export interface Student {
  id: string;
  displayName: string;
  phoneHash: string;
  topic?: string;
  consentToSMS: boolean;
  addedAt: Date;
}

export interface QueueEntry {
  student: Student;
  position: number;
}

export interface SMSConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}
