import React from 'react';
import { QueueEntry } from '../types';

interface QueueDisplayProps {
  queue: QueueEntry[];
}

const QueueDisplay: React.FC<QueueDisplayProps> = ({ queue }) => {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          Current Queue ({queue.length} {queue.length === 1 ? 'student' : 'students'})
        </h2>
      </div>
      
      <div className="p-6">
        {queue.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-gray-500 text-lg">No students in queue</p>
          </div>
        ) : (
          <div className="space-y-3">
            {queue.map((entry, index) => (
              <div
                key={entry.student.id}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  index === 0 
                    ? 'bg-green-50 border-2 border-green-200' 
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-400 text-white'
                  }`}>
                    {entry.position}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">
                        {entry.student.displayName}
                      </span>
                      {index === 0 && (
                        <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                          NEXT
                        </span>
                      )}
                      {entry.student.consentToSMS && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          📱 SMS
                        </span>
                      )}
                    </div>
                    {entry.student.topic && (
                      <p className="text-sm text-gray-600 mt-1">
                        Topic: {entry.student.topic}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Joined: {new Date(entry.student.addedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                {index === 0 && (
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-700">
                      Ready to be served
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QueueDisplay;
