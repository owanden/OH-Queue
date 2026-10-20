import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { dataStore, roomStore } from './data';
import { readAuthConfig } from './auth';

export function createApp(environment: NodeJS.ProcessEnv, sendWhatsApp: (phoneNumber: string, message: string) => Promise<boolean>) {
  const auth = readAuthConfig(environment);
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Routes

  // Simple auth: POST /api/login -> returns JWT when ADMIN_USER and ADMIN_PASS match
  app.post('/api/login', (req, res) => {
    try {
      const { username, password } = req.body;
      if (username !== auth.username || password !== auth.password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ username }, auth.secret, { algorithm: 'HS256', expiresIn: '6h' });
      res.json({ token, user: { username } });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  });

  // JWT middleware
  function requireAuth(req: Request, res: Response, next: NextFunction) {
    const authorization = req.headers.authorization;
    if (!authorization || !authorization.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing authorization' });
    const token = authorization.slice(7);
    try {
      const payload = jwt.verify(token, auth.secret, { algorithms: ['HS256'] });
      if (typeof payload !== 'object' || payload.username !== auth.username) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      (req as any).user = payload;
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }

  // Create a room (protected)
  app.post('/api/rooms', requireAuth, (req, res) => {
    try {
      const { name } = req.body;
      if (!name || typeof name !== 'string') return res.status(400).json({ error: 'Room name required' });
      const username = (req as any).user.username || 'unknown';
      const room = roomStore.createRoom(name, username);
      res.status(201).json(room);
    } catch (error) {
      console.error('Error creating room:', error);
      res.status(500).json({ error: 'Failed to create room' });
    }
  });

  // Get room details (public)
  app.get('/api/rooms/:code', (req, res) => {
    try {
      const { code } = req.params;
      const room = roomStore.getRoom(code);
      if (!room) return res.status(404).json({ error: 'Room not found' });
      res.json(room);
    } catch (error) {
      console.error('Error fetching room:', error);
      res.status(500).json({ error: 'Failed to fetch room' });
    }
  });

  // TA Management
  app.post('/api/tas', requireAuth, async (req, res) => {
    try {
      const { name } = req.body;
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Name is required' });
      }

      const ta = dataStore.addTA(name);
      res.json(ta);
    } catch (error) {
      console.error('Error adding TA:', error);
      res.status(500).json({ error: 'Failed to add TA' });
    }
  });

  app.delete('/api/tas/:id', requireAuth, (req, res) => {
    try {
      const { id } = req.params;
      console.log('Backend: Attempting to remove TA with ID:', id);
      console.log('Backend: Current TAs:', dataStore.getActiveTAs().map(ta => ({ id: ta.id, name: ta.name })));

      const success = dataStore.removeTA(id);
      console.log('Backend: Remove result:', success);

      if (success) {
        console.log('Backend: TA removed successfully');
        res.json({ message: 'TA removed successfully' });
      } else {
        console.log('Backend: TA not found');
        res.status(404).json({ error: 'TA not found' });
      }
    } catch (error) {
      console.error('Backend: Error removing TA:', error);
      res.status(500).json({ error: 'Failed to remove TA' });
    }
  });

  app.get('/api/tas', (req, res) => {
    try {
      const tas = dataStore.getActiveTAs();
      res.json(tas);
    } catch (error) {
      console.error('Error getting TAs:', error);
      res.status(500).json({ error: 'Failed to get TAs' });
    }
  });

  // Student Queue Management
  app.post('/api/queue', async (req, res) => {
    try {
      const { phoneNumber, topic, consentToSMS } = req.body;

      if (!phoneNumber || typeof phoneNumber !== 'string') {
        return res.status(400).json({ error: 'Phone number is required' });
      }

      // Check if student is already in queue
      const existingStudent = await dataStore.getStudentByPhone(phoneNumber);
      if (existingStudent) {
        return res.status(409).json({ error: 'Student already in queue' });
      }

      const student = await dataStore.addStudent(phoneNumber, topic, consentToSMS || false);
      const queue = dataStore.getQueue();
      const position = queue.findIndex(entry => entry.student.id === student.id) + 1;

      res.json({
        student,
        position,
        queueLength: queue.length
      });
    } catch (error) {
      console.error('Error adding student to queue:', error);
      res.status(500).json({ error: 'Failed to add student to queue' });
    }
  });

  app.get('/api/queue', (req, res) => {
    try {
      const queue = dataStore.getQueue();
      res.json(queue);
    } catch (error) {
      console.error('Error getting queue:', error);
      res.status(500).json({ error: 'Failed to get queue' });
    }
  });

  app.get('/api/queue/next', (req, res) => {
    try {
      const nextStudent = dataStore.getNextStudent();
      res.json(nextStudent);
    } catch (error) {
      console.error('Error getting next student:', error);
      res.status(500).json({ error: 'Failed to get next student' });
    }
  });

  app.post('/api/queue/serve', requireAuth, async (req, res) => {
    try {
      const nextStudent = dataStore.serveNextStudent();

      if (!nextStudent) {
        return res.status(404).json({ error: 'No students in queue' });
      }

      // Send WhatsApp notification if student consented
      if (nextStudent.student.consentToSMS) {
        try {
          const storedPhone = nextStudent.student.phoneNumber;
          if (!storedPhone) {
            console.log(`Failed to send WhatsApp notification to ${nextStudent.student.displayName}: no phone number stored`);
          } else {
            const message = `🎓 It's your turn! ${nextStudent.student.displayName}, please come to the office hours desk.`;
            const notificationSent = await sendWhatsApp(storedPhone, message);

            if (notificationSent) {
              console.log(`WhatsApp notification sent to ${nextStudent.student.displayName}`);
            } else {
              console.log(`Failed to send WhatsApp notification to ${nextStudent.student.displayName}`);
            }
          }
        } catch (notificationError) {
          console.error('Error sending WhatsApp notification:', notificationError);
          // Don't fail the request if notification fails
        }
      }

      res.json({
        message: 'Student served successfully',
        student: nextStudent.student
      });
    } catch (error) {
      console.error('Error serving student:', error);
      res.status(500).json({ error: 'Failed to serve student' });
    }
  });

  app.delete('/api/queue/:studentId', requireAuth, async (req, res) => {
    try {
      const { studentId } = req.params;
      const queue = dataStore.getQueue();

      // Check if we're removing the top student
      const isTopStudent = queue.length > 0 && queue[0].student.id === studentId;

      const success = dataStore.dropStudent(studentId);

      if (success) {
        // If we removed the top student and there's a next student, notify them
        if (isTopStudent && queue.length > 1) {
          const nextStudent = queue[1]; // The new top student after removal

          if (nextStudent.student.consentToSMS && nextStudent.student.phoneNumber) {
            try {
              console.log("Sending WhatsApp notification to", nextStudent.student.phoneNumber);
              const message = `🎓 You're next in line! ${nextStudent.student.displayName}, please be ready.`;
              const notificationSent = await sendWhatsApp(nextStudent.student.phoneNumber, message);

              if (notificationSent) {
                console.log(`WhatsApp notification sent to ${nextStudent.student.displayName}`);
              } else {
                console.log(`Failed to send WhatsApp notification to ${nextStudent.student.displayName}`);
              }
            } catch (notificationError) {
              console.error('Error sending WhatsApp notification:', notificationError);
              // Don't fail the request if notification fails
            }
          }
        }

        res.json({ message: 'Student dropped from queue' });
      } else {
        res.status(404).json({ error: 'Student not found in queue' });
      }
    } catch (error) {
      console.error('Error dropping student:', error);
      res.status(500).json({ error: 'Failed to drop student' });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Development route to clear all data
  if (environment.NODE_ENV === 'development') {
    app.post('/api/clear', requireAuth, (req, res) => {
      dataStore.clearAll();
      res.json({ message: 'All data cleared' });
    });
  }

  return app;
}
