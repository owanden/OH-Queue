import React, { useState } from 'react';
import Modal from './Modal';

interface StudentModalProps {
  sampleOnly?: boolean;
  onClose: () => void;
  onAdd: (phoneNumber: string, topic: string, consentToSMS: boolean) => void;
}

const StudentModal: React.FC<StudentModalProps> = ({ onClose, onAdd, sampleOnly = false }) => {
  const [phoneNumber, setPhoneNumber] = useState(sampleOnly ? '+15555550121' : '');
  const [topic, setTopic] = useState(sampleOnly ? 'Synthetic queue example' : '');
  const [consentToSMS, setConsentToSMS] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    setLoading(true);
    try {
      await onAdd(phoneNumber.trim(), topic.trim(), consentToSMS);
    } catch (error) {
      console.error('Failed to add student:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Add New Student" onClose={onClose}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-300 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              id="phoneNumber"
              readOnly={sampleOnly}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">
              {sampleOnly ? 'Fixed synthetic value. Nothing is sent or stored outside this tab.' : 'Retained in server memory for notifications; omitted from queue responses.'}
            </p>
          </div>

          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-gray-300 mb-2">
              Reason for Visit
            </label>
            <textarea
              id="topic"
              readOnly={sampleOnly}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Briefly describe what you need help with..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                disabled={loading || sampleOnly}
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="consent" className="font-medium text-gray-300">
                Notify me when I'm up
              </label>
              <p className="text-gray-500">
                {sampleOnly ? 'Notifications are disabled in this browser preview.' : 'The local demo simulates notifications. Other environments require a configured provider.'}
              </p>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !phoneNumber.trim()}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Adding...' : 'Add Student'}
            </button>
          </div>
        </form>
    </Modal>
  );
};

export default StudentModal;
