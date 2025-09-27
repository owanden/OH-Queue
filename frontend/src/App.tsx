import React, { useState, useEffect } from 'react';
import { TA, QueueEntry } from './types';
import { getTAs, getQueue, addTA, addStudentToQueue, serveNextStudent, dropStudent } from './api';
import TAModal from './components/TAModal';
import StudentModal from './components/StudentModal';

function App() {
  const [tas, setTAs] = useState<TA[]>([]);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
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

  const handleServeNext = async () => {
    try {
      const result = await serveNextStudent();
      setQueue(queue.filter(entry => entry.student.id !== result.student.id));
    } catch (error) {
      console.error('Failed to serve student:', error);
      alert('Failed to serve student. Please try again.');
    }
  };

  const handleDropStudent = async (studentId: string) => {
    try {
      await dropStudent(studentId);
      setQueue(queue.filter(entry => entry.student.id !== studentId));
    } catch (error) {
      console.error('Failed to drop student:', error);
      alert('Failed to drop student. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-300 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Styling constants for better readability
  const containerStyles = {
    main: "min-h-screen bg-gray-900 text-gray-300",
    header: "bg-gray-800 border-b border-gray-700",
    headerContent: "max-w-7xl mx-auto px-6 py-4",
    title: "text-2xl font-bold text-gray-300",
    mainContent: "max-w-7xl mx-auto px-6 py-8",
    grid: "grid grid-cols-1 lg:grid-cols-2 gap-8 h-full"
  };

  const panelStyles = {
    container: "bg-gray-800 rounded-lg border border-gray-600 p-6 relative",
    tab: "absolute -top-3 right-4 bg-gray-800 px-3 py-1 rounded-t-lg border-l border-r border-t border-gray-600",
    tabText: "text-sm font-medium text-gray-300",
    content: "space-y-4 pb-20"
  };

  const listItemStyles = {
    taItem: "bg-gray-700 rounded-full px-4 py-3 flex items-center justify-between",
    studentItem: "bg-gray-700 rounded-full px-4 py-3 flex items-center justify-between",
    taName: "text-gray-300 font-medium",
    removeButton: "text-red-400 hover:text-red-300 text-sm"
  };

  const buttonStyles = {
    fixedContainer: "fixed bottom-6 left-6 right-6 lg:right-auto lg:w-1/2 lg:max-w-md",
    fixedContainerRight: "fixed bottom-6 right-6 lg:right-6 lg:w-1/2 lg:max-w-md",
    addButton: "w-full bg-gray-700 hover:bg-gray-600 text-gray-300 py-3 px-4 rounded-full border border-gray-600 transition-colors",
    serveButton: "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors",
    dropButton: "text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded-full hover:bg-red-900/20 transition-colors"
  };

  const studentStyles = {
    avatar: "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg",
    avatarGradient: "bg-gradient-to-br",
    studentInfo: "flex items-center space-x-4",
    studentDetails: "flex items-center space-x-2",
    queueNumber: "text-gray-400 text-sm font-mono",
    studentName: "text-gray-300 font-medium text-lg",
    studentTopic: "text-gray-500 text-sm mt-1"
  };

  const firstStudentStyles = {
    container: "bg-gray-700 rounded-full px-4 py-3 flex items-center justify-between shadow-lg",
    transform: 'translateX(20px)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
  };

  return (
    <div className={containerStyles.main}>
      {/* Header Section */}
      <header className={containerStyles.header}>
        <div className={containerStyles.headerContent}>
          <h1 className={containerStyles.title}>
            Office Hours Queue
          </h1>
        </div>
      </header>

      {/* Main Content Section */}
      <main className={containerStyles.mainContent}>
        <div className={containerStyles.grid}>
          
          {/* TAs Panel */}
          <div className={panelStyles.container}>
            {/* Tab Label */}
            <div className={panelStyles.tab}>
              <span className={panelStyles.tabText}>TAs</span>
            </div>
            
            {/* TAs List */}
            <div className={panelStyles.content}>
              {tas.map(ta => (
                <div key={ta.id} className={listItemStyles.taItem}>
                  <span className={listItemStyles.taName}>{ta.name}</span>
                  <button
                    onClick={() => setTAS(tas.filter(t => t.id !== ta.id))}
                    className={listItemStyles.removeButton}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            
            {/* Fixed Add New TA Button */}
            <div className={buttonStyles.fixedContainer}>
              <button
                onClick={() => setShowTAModal(true)}
                className={buttonStyles.addButton}
              >
                Add New TA
              </button>
            </div>
          </div>

          {/* Student Queue Panel */}
          <div className={panelStyles.container}>
            <div className={panelStyles.content}>
              {queue.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No students in queue</p>
              ) : (
                <>
                  {/* First Student - Special Styling with Right Offset */}
                  {queue.length > 0 && (
                    <div 
                      className={firstStudentStyles.container}
                      style={{
                        transform: firstStudentStyles.transform,
                        boxShadow: firstStudentStyles.boxShadow
                      }}
                    >
                      <div className={studentStyles.studentInfo}>
                        {/* Student Avatar */}
                        <div className={`${studentStyles.avatar} ${studentStyles.avatarGradient} from-orange-400 to-red-500`}>
                          {queue[0].student.displayName.split(' ').map(word => word[0]).join('')}
                        </div>
                        
                        {/* Student Details */}
                        <div>
                          <div className={studentStyles.studentDetails}>
                            <span className={studentStyles.queueNumber}>#{queue[0].position}</span>
                            <span className={studentStyles.studentName}>{queue[0].student.displayName}</span>
                          </div>
                          {queue[0].student.topic && (
                            <p className={studentStyles.studentTopic}>{queue[0].student.topic}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <button
                          onClick={handleServeNext}
                          className={buttonStyles.serveButton}
                        >
                          Serve
                        </button>
                        <button
                          onClick={() => handleDropStudent(queue[0].student.id)}
                          className={buttonStyles.dropButton}
                        >
                          Drop
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Remaining Students */}
                  {queue.slice(1, 6).map((entry, index) => {
                    // Generate consistent avatar colors based on student ID
                    const avatarColors = [
                      'from-yellow-400 to-orange-500', 
                      'from-green-400 to-blue-500',
                      'from-purple-400 to-pink-500',
                      'from-blue-400 to-indigo-500',
                      'from-pink-400 to-purple-500'
                    ];
                    const colorIndex = entry.student.id.charCodeAt(0) % avatarColors.length;
                    const gradientClass = avatarColors[colorIndex];

                    return (
                      <div key={entry.student.id} className={listItemStyles.studentItem}>
                        <div className={studentStyles.studentInfo}>
                          {/* Student Avatar */}
                          <div className={`${studentStyles.avatar} ${studentStyles.avatarGradient} ${gradientClass}`}>
                            {entry.student.displayName.split(' ').map(word => word[0]).join('')}
                          </div>
                          
                          {/* Student Details */}
                          <div>
                            <div className={studentStyles.studentDetails}>
                              <span className={studentStyles.queueNumber}>#{entry.position}</span>
                              <span className={studentStyles.studentName}>{entry.student.displayName}</span>
                            </div>
                            {entry.student.topic && (
                              <p className={studentStyles.studentTopic}>{entry.student.topic}</p>
                            )}
                          </div>
                        </div>
                        
                        {/* Drop Button */}
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleDropStudent(entry.student.id)}
                            className={buttonStyles.dropButton}
                          >
                            Drop
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* More Students Indicator */}
                  {queue.length > 6 && (
                    <div className="text-center text-gray-500 text-sm">
                      <div className="flex justify-center space-x-1 mb-2">
                        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                      </div>
                      + {queue.length - 6} more
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Fixed Add New Student Button */}
            <div className={buttonStyles.fixedContainerRight}>
              <button
                onClick={() => setShowStudentModal(true)}
                className={buttonStyles.addButton}
              >
                Add New Student
              </button>
            </div>
          </div>
        </div>
      </main>

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
