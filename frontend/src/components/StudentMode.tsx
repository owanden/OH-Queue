import React, { useState } from 'react';
import { QueueEntry } from '../types';
import { addStudentToQueue } from '../api';

interface StudentModeProps {
  queue: QueueEntry[];
  onQueueChange: (queue: QueueEntry[]) => void;
}

const StudentMode: React.FC<StudentModeProps> = ({ queue, onQueueChange }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [topic, setTopic] = useState('');
  const [consentToSMS, setConsentToSMS] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [studentInfo, setStudentInfo] = useState<{ displayName: string; position: number } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    setLoading(true);
    try {
      const result = await addStudentToQueue(phoneNumber, topic, consentToSMS);
      setStudentInfo({
        displayName: result.student.displayName,
        position: result.position
      });
      setSubmitted(true);
      // Refresh queue data
      onQueueChange([...queue, { student: result.student, position: result.position }]);
    } catch (error: any) {
      console.error('Failed to add to queue:', error);
      if (error.response?.status === 409) {
        alert('You are already in the queue!');
      } else {
        alert('Failed to join queue. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setStudentInfo(null);
    setPhoneNumber('');
    setTopic('');
    setConsentToSMS(false);
  };

  if (submitted && studentInfo) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            You're in the queue!
          </h2>
          <div className="space-y-4">
            <p className="text-xl text-gray-700">
              Your display name: <strong className="text-primary-600">{studentInfo.displayName}</strong>
            </p>
            <p className="text-lg text-gray-600">
              Position in queue: <strong>#{studentInfo.position}</strong>
            </p>
            {consentToSMS && (
              <p className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                📱 You'll receive a text message when it's your turn!
              </p>
            )}
            <div className="pt-4">
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Join Another Queue
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Join the Queue
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
              required
              disabled={loading}
            />
            <p className="mt-1 text-sm text-gray-500">
              Your phone number will be stored securely and never displayed
            </p>
          </div>

          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
              Topic (Optional)
            </label>
            <input
              type="text"
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Homework 3, Project help, General question"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
              disabled={loading}
            />
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="consent"
                type="checkbox"
                checked={consentToSMS}
                onChange={(e) => setConsentToSMS(e.target.checked)}
                className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                disabled={loading}
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="consent" className="font-medium text-gray-700">
                Text me when I'm up
              </label>
              <p className="text-gray-500">
                Check this box to receive an SMS notification when it's your turn
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !phoneNumber.trim()}
            className="w-full py-4 px-6 bg-primary-600 text-white text-lg font-semibold rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Joining Queue...' : 'Join Queue'}
          </button>
        </form>

        <div className="mt-8 p-4 bg-blue-50 rounded-md">
          <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• You'll get an anonymous display name (like "Blue Llama")</li>
            <li>• Your position in the queue will be shown on the screen</li>
            <li>• When it's your turn, a TA will call your display name</li>
            <li>• You can optionally receive a text message notification</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StudentMode;
