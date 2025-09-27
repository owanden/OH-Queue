import express from 'express';
import cors from 'cors';
import { dataStore } from './data';
import { initializeSMS, sendSMS } from './sms';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SMS if credentials are provided
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  initializeSMS({
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_FROM_NUMBER || '+1234567890'
  });
} else {
  console.log('SMS disabled: Missing Twilio credentials');
}

// Routes

// TA Management
app.post('/api/tas', async (req, res) => {
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

app.delete('/api/tas/:id', (req, res) => {
  try {
    const { id } = req.params;
    const success = dataStore.removeTA(id);
    
    if (success) {
      res.json({ message: 'TA removed successfully' });
    } else {
      res.status(404).json({ error: 'TA not found' });
    }
  } catch (error) {
    console.error('Error removing TA:', error);
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

app.post('/api/queue/serve', async (req, res) => {
  try {
    const nextStudent = dataStore.serveNextStudent();
    
    if (!nextStudent) {
      return res.status(404).json({ error: 'No students in queue' });
    }

    // Send SMS if student consented
    if (nextStudent.student.consentToSMS) {
      // Note: In a real implementation, you'd need to store the original phone number
      // For demo purposes, we'll just log this
      console.log(`Would send SMS to student: ${nextStudent.student.displayName}`);
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

app.delete('/api/queue/:studentId', (req, res) => {
  try {
    const { studentId } = req.params;
    const success = dataStore.dropStudent(studentId);
    
    if (success) {
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
if (process.env.NODE_ENV === 'development') {
  app.post('/api/clear', (req, res) => {
    dataStore.clearAll();
    res.json({ message: 'All data cleared' });
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📱 SMS ${process.env.TWILIO_ACCOUNT_SID ? 'enabled' : 'disabled'}`);
});
