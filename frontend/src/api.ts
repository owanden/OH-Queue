import axios from 'axios';
import { TA, QueueEntry } from './types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const setAuthToken = (token: string | null) => {
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete api.defaults.headers.common['Authorization'];
};

const roomPath = (code: string) => {
  if (!code) throw new Error('Room code required');
  return `/rooms/${encodeURIComponent(code)}`;
};

// TA Management
export const addTA = async (name: string, roomCode: string): Promise<TA> => {
  const response = await api.post(`${roomPath(roomCode)}/tas`, { name });
  return response.data;
};

export const removeTA = async (id: string, roomCode: string): Promise<void> => {
  await api.delete(`${roomPath(roomCode)}/tas/${id}`);
};

export const getTAs = async (roomCode: string): Promise<TA[]> => {
  const response = await api.get(`${roomPath(roomCode)}/tas`);
  return response.data;
};

// Student Queue Management
export const addStudentToQueue = async (
  phoneNumber: string,
  topic: string | undefined,
  consentToSMS: boolean,
  roomCode: string
): Promise<{ student: any; position: number; queueLength: number }> => {
  const response = await api.post(`${roomPath(roomCode)}/queue`, {
    phoneNumber,
    topic,
    consentToSMS
  });
  return response.data;
};

export const getQueue = async (roomCode: string): Promise<QueueEntry[]> => {
  const response = await api.get(`${roomPath(roomCode)}/queue`);
  return response.data;
};

export const getNextStudent = async (roomCode: string): Promise<QueueEntry | null> => {
  const response = await api.get(`${roomPath(roomCode)}/queue/next`);
  return response.data;
};

export const serveNextStudent = async (roomCode: string): Promise<{ message: string; student: any }> => {
  const response = await api.post(`${roomPath(roomCode)}/queue/serve`);
  return response.data;
};

export const dropStudent = async (studentId: string, roomCode: string): Promise<void> => {
  await api.delete(`${roomPath(roomCode)}/queue/${studentId}`);
};

export const clearAllData = async (roomCode: string): Promise<void> => {
  await api.post(`${roomPath(roomCode)}/clear`);
};

// Auth & Rooms (MVP)
export const login = async (username: string, password: string): Promise<{ token: string; user: any }> => {
  const response = await api.post('/login', { username, password });
  return response.data;
};

export const createRoom = async (name: string): Promise<any> => {
  const response = await api.post('/rooms', { name });
  return response.data;
};

export const getRoom = async (code: string): Promise<any> => {
  const response = await api.get(`/rooms/${code}`);
  return response.data;
};
