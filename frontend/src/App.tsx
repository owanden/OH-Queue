import { useState, useEffect } from 'react';
import { TA, QueueEntry } from './types';
import { getTAs, getQueue, addTA, removeTA, addStudentToQueue, dropStudent, serveNextStudent, setAuthToken, getRoom } from './api';
import TAModal from './components/TAModal';
import StudentModal from './components/StudentModal';
import Login from './components/Login';

function App() {
  const [tas, setTAs] = useState<TA[]>([]);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('authToken'));
  const [currentRoom, setCurrentRoom] = useState<{ code: string; asGuest: boolean } | null>(null);
  const [roomDetails, setRoomDetails] = useState<any | null>(null);
  const [showTAModal, setShowTAModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);

  const fetchData = async () => {
    try {
      const [tasData, queueData] = await Promise.all([
        getTAs(),
        getQueue()
      ]);
      setTAs(tasData);
      setQueue(queueData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (token) {
      setAuthToken(token);
      localStorage.setItem('authToken', token);
    } else {
      setAuthToken(null);
      localStorage.removeItem('authToken');
    }
  }, [token]);

  // When a room is entered, fetch its details
  useEffect(() => {
    if (!currentRoom) {
      setRoomDetails(null);
      return;
    }
    (async () => {
      try {
        const r = await getRoom(currentRoom.code);
        setRoomDetails(r);
      } catch (err) {
        console.error('Failed to fetch room details', err);
        setRoomDetails(null);
      }
    })();
  }, [currentRoom]);

  const handleAddTA = async (name: string) => {
    try {
      const newTA = await addTA(name);
      setTAs([...tas, newTA]);
      setShowTAModal(false);
    } catch (error) {
      console.error('Failed to add TA:', error);
      alert('Failed to add TA. Please try again.');
    }
  };

  const handleRemoveTA = async (taId: string) => {
    try {
      console.log('Attempting to remove TA with ID:', taId);
      await removeTA(taId);
      console.log('Successfully removed TA from backend');
      setTAs(tas.filter(ta => ta.id !== taId));
      console.log('Updated frontend state');
    } catch (error: any) {
      console.error('Failed to remove TA:', error);
      console.error('Error details:', error.response?.data || error.message);
      alert(`Failed to remove TA. Error: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleAddStudent = async (phoneNumber: string, topic: string, consentToSMS: boolean) => {
    try {
      const result = await addStudentToQueue(phoneNumber, topic, consentToSMS);
      setQueue([...queue, { student: result.student, position: result.position }]);
      setShowStudentModal(false);
    } catch (error: any) {
      console.error('Failed to add student:', error);
      if (error.response?.status === 409) {
        alert('You are already in the queue!');
      } else {
        alert('Failed to join queue. Please try again.');
      }
    }
  };


  const handleDropStudent = async (studentId: string) => {
    console.log("Dropping student", studentId);

    try {
      await dropStudent(studentId);
      setQueue(queue.filter(entry => entry.student.id !== studentId));
    } catch (error) {
      console.error('Failed to drop student:', error);
      alert('Failed to drop student. Please try again.');
    }
  };

  if (loading && !currentRoom) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-300 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // If not in a room, show login/landing view
  if (!currentRoom) {
    return (
      <Login
        onAuthenticated={(t, _u) => { setToken(t); }}
        onEnterRoom={(code, asGuest) => setCurrentRoom({ code, asGuest })}
      />
    );
  }


  return (
    <div className="min-h-screen bg-gray-100">
      {/* Room header */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">{roomDetails ? `Room: ${roomDetails.name}` : `Room: ${currentRoom.code}`}</h1>
          <p className="text-sm text-gray-500">Code: {currentRoom.code}</p>
        </div>
        <div>
          <button onClick={() => setCurrentRoom(null)} className="px-3 py-1 border rounded">Leave Room</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-screen">
        {/* Left Side - TA Section */}
        <div className="w-1/2 bg-blue-900 flex flex-col p-8">
          {/* Title - Centered between top and TA list */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white">Welcome to TA Office Hours</h1>
          </div>

          {/* TA Cards Grid - Centered with max 8 visible */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative max-w-md w-full">
              {/* TA Header with count and Add button - Positioned at grid corners */}
              <div className="absolute -top-12 left-0 right-0 flex items-center justify-between">
                <h2 className="text-xl text-white">Available TAs ({tas.length})</h2>
                <button
                  onClick={() => setShowTAModal(true)}
                  className="bg-blue-800 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border-2 border-white"
                >
                  Add TA
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 border-2 border-white rounded-lg p-4">
                {tas.slice(0, 8).map(ta => (
                  <div
                    key={ta.id}
                    onClick={() => handleRemoveTA(ta.id)}
                    className="bg-gray-300 rounded-lg p-3 cursor-pointer hover:bg-gray-400 transition-colors group aspect-square"
                  >
                    {/* Placeholder for TA image - Square */}
                    <div className="w-full h-20 bg-gray-200 rounded-lg mb-2 flex items-center justify-center">
                      <span className="text-gray-500 text-xs">TA Photo</span>
                    </div>
                    <p className="text-center text-white font-medium text-sm">{ta.name}</p>
                  </div>
                ))}

                {/* Show gray box only if there are exactly 9+ TAs */}
                {tas.length >= 9 && (
                  <div className="bg-gray-600 rounded-lg p-3 flex items-center justify-center aspect-square">
                    <span className="text-white font-bold text-lg">+{tas.length - 8}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Student Queue */}
        <div className="w-1/2 bg-white p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Student Queue</h2>

          {queue.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No students in queue</p>
            </div>
          ) : (
            <div className="space-y-3">
              {queue.slice(0, 10).map((entry, index) => {
                // Generate animal avatar based on student name
                const animals = ['🦒', '🐵', '🦁', '🦎', '🦌', '🐼', '🐸', '🐧', '🦊', '🐨'];
                const animalIndex = entry.student.id.charCodeAt(0) % animals.length;
                const animalEmoji = animals[animalIndex];

                return (
                  <div
                    key={entry.student.id}
                    onClick={() => handleDropStudent(entry.student.id)}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    {/* Animal Avatar */}
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-xl">
                      {animalEmoji}
                    </div>

                    {/* Student Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500 text-sm font-mono">#{index + 1}</span>
                        <span className="font-medium text-gray-900">{entry.student.displayName}</span>
                      </div>
                      {entry.student.topic && (
                        <p className="text-sm text-gray-600 mt-1">{entry.student.topic}</p>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* More Students Indicator */}
              {queue.length > 10 && (
                <div className="text-center text-gray-500 text-sm py-4">
                  <div className="flex justify-center space-x-1 mb-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  </div>
                  + {queue.length - 10} more
                </div>
              )}
            </div>
          )}

          {/* Add New Student Button */}
          <div className="mt-8">
            <button
              onClick={() => setShowStudentModal(true)}
              className="w-full bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Add New Student
            </button>
          </div>
        </div>
      </div>

      {/* Modal Components */}
      {showTAModal && (
        <TAModal
          onClose={() => setShowTAModal(false)}
          onAdd={handleAddTA}
        />
      )}

      {showStudentModal && (
        <StudentModal
          onClose={() => setShowStudentModal(false)}
          onAdd={handleAddStudent}
        />
      )}
    </div>
  );
}

export default App;
