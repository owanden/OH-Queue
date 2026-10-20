import { Student, QueueEntry } from './types';

type PublicStudent = Pick<Student, 'id' | 'displayName' | 'topic' | 'consentToSMS' | 'addedAt'>;

export function publicStudent(student: Student): PublicStudent {
  return {
    id: student.id,
    displayName: student.displayName,
    topic: student.topic,
    consentToSMS: student.consentToSMS,
    addedAt: student.addedAt,
  };
}

export function publicQueueEntry(entry: QueueEntry) {
  return { position: entry.position, student: publicStudent(entry.student) };
}

export function publicRoom(room: { code: string; name: string; createdBy: string; createdAt: number; queue: QueueEntry[] }) {
  return {
    code: room.code,
    name: room.name,
    createdBy: room.createdBy,
    createdAt: room.createdAt,
    queue: room.queue.map(publicQueueEntry),
  };
}
