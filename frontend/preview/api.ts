import type { TA, QueueEntry } from '../src/types';

let tas: TA[];
let queue: QueueEntry[];
let sequence: number;

export function resetPreview() {
  sequence = 2;
  tas = [{ id: 'sample-ta', name: 'Sample TA', isActive: true }];
  queue = ['Blue Llama', 'Green Fox'].map((displayName, i) => ({
    position: i + 1,
    student: { id: `sample-${i + 1}`, displayName, topic: ['Linked lists', 'Recursion'][i], consentToSMS: false, addedAt: '2026-01-01T12:00:00.000Z' },
  }));
}
resetPreview();

export const setAuthToken = (_token: string | null) => {};
export const getTAs = async () => structuredClone(tas);
export const getQueue = async () => structuredClone(queue);
export const getNextStudent = async () => structuredClone(queue[0] ?? null);
export const getRoom = async (_code: string) => ({ code: 'PREVIEW', name: 'Browser preview', queue: [] });
export const login = async (_username: string, _password: string): Promise<{ token: string; user: { username: string } }> => { throw new Error('Sign-in is unavailable in this preview'); };
export const createRoom = async (_name: string) => { throw new Error('Room creation is unavailable in this preview'); };
export const addTA = async (_name: string) => {
  const ta = { id: `sample-ta-${++sequence}`, name: 'Sample TA', isActive: true };
  tas.push(ta);
  return structuredClone(ta);
};
export const removeTA = async (id: string) => { tas = tas.filter(ta => ta.id !== id); };
export const addStudentToQueue = async (_phone: string, _topic?: string, _consent = false) => {
  const student = { id: `sample-${++sequence}`, displayName: `Sample Student ${sequence}`, topic: 'Synthetic queue example', consentToSMS: false, addedAt: new Date().toISOString() };
  const position = queue.length ? queue[queue.length - 1].position + 1 : 1;
  queue.push({ student, position });
  return { student: structuredClone(student), position, queueLength: queue.length };
};
export const serveNextStudent = async () => {
  const entry = queue.shift();
  if (!entry) throw new Error('No sample students in queue');
  return { message: 'Sample student served', student: structuredClone(entry.student) };
};
export const dropStudent = async (id: string) => { queue = queue.filter(entry => entry.student.id !== id); };
export const clearAllData = async () => { queue = []; tas = []; };
