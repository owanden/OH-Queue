export interface TA {
  id: string;
  name: string;
  isActive: boolean;
}

export interface Student {
  id: string;
  displayName: string;
  topic?: string;
  consentToSMS: boolean;
  addedAt: string;
}

export interface QueueEntry {
  student: Student;
  position: number;
}
