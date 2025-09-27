import React, { useState } from 'react';
import { TA, QueueEntry } from '../types';
import { addTA, removeTA, serveNextStudent, dropStudent } from '../api';

interface TAModeProps {
  tas: TA[];
  queue: QueueEntry[];
  onTAsChange: (tas: TA[]) => void;
  onQueueChange: (queue: QueueEntry[]) => void;
}

const TAMode: React.FC<TAModeProps> = ({ tas, queue, onTASChange, onQueueChange }) => {
  const [taName, setTaName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddTA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taName.trim()) return;

    setLoading(true);
    try {
      const newTA = await addTA(taName);
      onTASChange([...tas, newTA]);
      setTaName('');
    } catch (error) {
      console.error('Failed to add TA:', error);
      alert('Failed to add TA. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTA = async (taId: string) => {
    setLoading(true);
    try {
      await removeTA(taId);
      onTASChange(tas.filter(ta => ta.id !== taId));
    } catch (error) {
      console.error('Failed to remove TA:', error);
      alert('Failed to remove TA. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleServeNext = async () => {
    setLoading(true);
    try {
      const result = await serveNextStudent();
      // Refresh queue data
      onQueueChange(queue.filter(entry => entry.student.id !== result.student.id));
      alert(`Served: ${result.student.displayName}`);
    } catch (error) {
      console.error('Failed to serve student:', error);
      alert('Failed to serve student. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDropStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`Drop ${studentName} from the queue?`)) return;

    setLoading(true);
    try {
      await dropStudent(studentId);
      onQueueChange(queue.filter(entry => entry.student.id !== studentId));
    } catch (error) {
      console.error('Failed to drop student:', error);
      alert('Failed to drop student. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* TA Management */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">TA Management</h2>
        
        {/* Add TA Form */}
        <form onSubmit={handleAddTA} className="mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={taName}
              onChange={(e) => setTaName(e.target.value)}
              placeholder="Enter your name"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !taName.trim()}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add TA'}
            </button>
          </div>
        </form>

        {/* Active TAs */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Active TAs</h3>
          {tas.length === 0 ? (
            <p className="text-gray-500">No active TAs</p>
          ) : (
            <div className="space-y-2">
              {tas.map(ta => (
                <div key={ta.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <span className="font-medium">{ta.name}</span>
                  <button
                    onClick={() => handleRemoveTA(ta.id)}
                    disabled={loading}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Queue Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Queue Controls</h2>
        
        {queue.length === 0 ? (
          <p className="text-gray-500">No students in queue</p>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-4">
              <button
                onClick={handleServeNext}
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {loading ? 'Serving...' : 'Serve Next Student'}
              </button>
            </div>

            {/* Next Student Info */}
            <div className="p-4 bg-blue-50 rounded-md">
              <h3 className="font-semibold text-blue-900 mb-2">Next in Queue:</h3>
              <p className="text-blue-800">
                <strong>{queue[0]?.student.displayName}</strong>
                {queue[0]?.student.topic && (
                  <span className="text-blue-600"> - {queue[0].student.topic}</span>
                )}
              </p>
            </div>

            {/* Queue Actions */}
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">Queue Actions:</h3>
              {queue.map((entry, index) => (
                <div key={entry.student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-sm text-gray-500">#{entry.position}</span>
                    <span className="font-medium">{entry.student.displayName}</span>
                    {entry.student.topic && (
                      <span className="text-sm text-gray-600">- {entry.student.topic}</span>
                    )}
                    {entry.student.consentToSMS && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">SMS</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDropStudent(entry.student.id, entry.student.displayName)}
                    disabled={loading}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    Drop
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TAMode;
