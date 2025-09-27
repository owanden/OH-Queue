import React, { useState } from 'react';

interface TAModalProps {
  onClose: () => void;
  onAdd: (name: string) => void;
}

const TAModal: React.FC<TAModalProps> = ({ onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await onAdd(name.trim());
    } catch (error) {
      console.error('Failed to add TA:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 border border-gray-600">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-300">Add New TA</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="taName" className="block text-sm font-medium text-gray-300 mb-2">
              TA Name
            </label>
            <input
              type="text"
              id="taName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter TA name"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={loading}
            />
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
              disabled={loading || !name.trim()}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Adding...' : 'Add TA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TAModal;
