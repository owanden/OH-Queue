import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { TA, Student, QueueEntry } from './types';

// In-memory data storage
let activeTAs: TA[] = [];
let studentQueue: QueueEntry[] = [];
let nextPosition = 1;

// Generate anonymous display names
const adjectives = ['Blue', 'Red', 'Green', 'Purple', 'Orange', 'Yellow', 'Pink', 'Cyan'];
const animals = ['Llama', 'Tiger', 'Dolphin', 'Eagle', 'Fox', 'Bear', 'Wolf', 'Lion'];

function generateDisplayName(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  return `${adjective} ${animal}`;
}

export const dataStore = {
  // TA management
  addTA: (name: string): TA => {
    const ta: TA = {
      id: uuidv4(),
      name: name.trim(),
      isActive: true
    };
    activeTAs.push(ta);
    return ta;
  },

  removeTA: (taId: string): boolean => {
    const index = activeTAs.findIndex(ta => ta.id === taId);
    if (index !== -1) {
      activeTAs.splice(index, 1);
      return true;
    }
    return false;
  },

  getActiveTAs: (): TA[] => {
    return activeTAs.filter(ta => ta.isActive);
  },

  // Student queue management
  addStudent: async (phoneNumber: string, topic?: string, consentToSMS: boolean = false): Promise<Student> => {
    const phoneHash = await bcrypt.hash(phoneNumber, 10);
    const student: Student = {
      id: uuidv4(),
      displayName: generateDisplayName(),
      phoneNumber, // Store actual phone number for SMS
      phoneHash,
      topic,
      consentToSMS,
      addedAt: new Date()
    };

    const queueEntry: QueueEntry = {
      student,
      position: nextPosition++
    };

    studentQueue.push(queueEntry);
    return student;
  },

  getQueue: (): QueueEntry[] => {
    return [...studentQueue].sort((a, b) => a.position - b.position);
  },

  getNextStudent: (): QueueEntry | null => {
    return studentQueue.length > 0 ? studentQueue[0] : null;
  },

  serveNextStudent: (): QueueEntry | null => {
    return studentQueue.shift() || null;
  },

  dropStudent: (studentId: string): boolean => {
    const index = studentQueue.findIndex(entry => entry.student.id === studentId);
    if (index !== -1) {
      studentQueue.splice(index, 1);
      return true;
    }
    return false;
  },

  getStudentByPhone: async (phoneNumber: string): Promise<Student | null> => {
    const phoneHash = await bcrypt.hash(phoneNumber, 10);
    const entry = studentQueue.find(entry => entry.student.phoneHash === phoneHash);
    return entry ? entry.student : null;
  },

  // Utility functions
  clearAll: (): void => {
    activeTAs = [];
    studentQueue = [];
    nextPosition = 1;
  }
};

// Rooms store for simple MVP
interface Room {
  code: string;
  name: string;
  createdBy: string;
  createdAt: number;
  queue: QueueEntry[];
}

const rooms: Record<string, Room> = {};

function generateRoomCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // avoid confusing chars
  let code = '';
  for (let i = 0; i < length; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export const roomStore = {
  createRoom: (name: string, createdBy: string, codeIn?: string) => {
    let code = codeIn && typeof codeIn === 'string' ? codeIn.toUpperCase() : generateRoomCode();
    // ensure uniqueness (unless caller explicitly requested existing code)
    if (!codeIn) {
      while (rooms[code]) code = generateRoomCode();
    } else {
      if (rooms[code]) {
        // if already exists, return existing room
        return rooms[code];
      }
    }
    const room: Room = { code, name, createdBy, createdAt: Date.now(), queue: [] };
    rooms[code] = room;
    return room;
  },

  getRoom: (code: string) => {
    return rooms[code] || null;
  }
};
