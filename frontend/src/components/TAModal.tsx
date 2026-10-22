import React, { useState } from 'react';
import Modal from './Modal';

interface TAModalProps {
  sampleOnly?: boolean;
  onClose: () => void;
  onAdd: (name: string) => void;
}

const TAModal: React.FC<TAModalProps> = ({ onClose, onAdd, sampleOnly = false }) => {
  const [name, setName] = useState(sampleOnly ? 'Sample TA' : '');
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
    <Modal title="Add New TA" onClose={onClose}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="taName" className="block text-sm font-medium text-gray-300 mb-2">
              TA Name
            </label>
            <input
              type="text"
              id="taName"
              readOnly={sampleOnly}
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
    </Modal>
  );
};

export default TAModal;
