import axios from 'axios';
import { TA, QueueEntry } from './types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// TA Management
export const addTA = async (name: string): Promise<TA> => {
  const response = await api.post('/tas', { name });
  return response.data;
};

export const removeTA = async (id: string): Promise<void> => {
  await api.delete(`/tas/${id}`);
};

export const getTAs = async (): Promise<TA[]> => {
  const response = await api.get('/tas');
  return response.data;
};

// Student Queue Management
export const addStudentToQueue = async (
  phoneNumber: string,
  topic?: string,
  consentToSMS: boolean = false
): Promise<{ student: any; position: number; queueLength: number }> => {
  const response = await api.post('/queue', {
    phoneNumber,
    topic,
    consentToSMS
  });
  return response.data;
};

export const getQueue = async (): Promise<QueueEntry[]> => {
  const response = await api.get('/queue');
  return response.data;
};

export const getNextStudent = async (): Promise<QueueEntry | null> => {
  const response = await api.get('/queue/next');
  return response.data;
};

export const serveNextStudent = async (): Promise<{ message: string; student: any }> => {
  const response = await api.post('/queue/serve');
  return response.data;
};

export const dropStudent = async (studentId: string): Promise<void> => {
  await api.delete(`/queue/${studentId}`);
};

export const clearAllData = async (): Promise<void> => {
  await api.post('/clear');
};
