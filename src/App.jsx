// Simple storage shim using localStorage
if (!window.storage) {
  window.storage = {
    get: async (key) => ({ value: localStorage.getItem(key) }),
    set: async (key, value) => { localStorage.setItem(key, value); }
  };
}

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Download, Upload, User, Award, TrendingUp, FileUp, Users, Cloud, HardDrive, Info } from 'lucide-react';

const QuranRecitationTracker = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showCloudInfo, setShowCloudInfo] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [bulkNames, setBulkNames] = useState('');
  const [showScoring, setShowScoring] = useState(false);
  const [teacherName, setTeacherName] = useState('');
  const [showTeacherSetup, setShowTeacherSetup] = useState(false);
  const [currentSession, setCurrentSession] = useState({
    date: new Date().toISOString().split('T')[0],
    surah: '',
    ayahRange: ''
  });

  useEffect(() => {
    loadData();
    loadTeacherName();
  }, []);

  const loadData = async () => {
    try {
      const result = await window.storage.get('quran-tracker-students');
      if (result && result.value) {
        setStudents(JSON.parse(result.value));
      }
    } catch (error) {
      console.log('No existing data found, starting fresh');
    }
  };

  const loadTeacherName = async () => {
    try {
      const result = await window.storage.get('quran-tracker-teacher');
      if (result && result.value) {
        setTeacherName(result.value);
      } else {
        setShowTeacherSetup(true);
      }
    } catch (error) {
      setShowTeacherSetup(true);
    }
  };

  const saveTeacherName = async (name) => {
    if (!name.trim()) return;
    try {
      await window.storage.set('quran-tracker-teacher', name);
      setTeacherName(name);
      setShowTeacherSetup(false);
      setNewStudentName('');
    } catch (error) {
      console.error('Error saving teacher name:', error);
    }
  };

  const saveData = async (updatedStudents) => {
    try {
      await window.storage.set('quran-tracker-students', JSON.stringify(updatedStudents));
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Error saving data. Please try again.');
    }
  };

  const scoringCriteria = {
    makhraj: {
      title: 'Makhraj (Articulation Points)',
      maxPoints: 25,
      subcriteria: [
        { name: 'Throat Letters (أ، ه، ع، ح، غ، خ)', points: 4 },
        { name: 'Tongue Letters (ق، ك، ج، ش، ي، ض، ل، ن، ر)', points: 8 },
        { name: 'Lips & Teeth Letters (ط، د، ت، ظ، ذ، ث، ص، س، ز، ف، ب، م، و)', points: 8 },
        { name: 'Nasal Cavity (Ghunnah)', points: 3 },
        { name: 'Madd Letters (و، ي، ا)', points: 2 }
      ]
    },
    sifatLazimah: {
      title: 'Sifat Lazimah (Permanent Characteristics)',
      maxPoints: 20,
      subcriteria: [
        { name: 'Hams & Jahr (Whisper vs Announcement)', points: 3 },
        { name: 'Shiddah & Rikhwah (Strength vs Softness)', points: 4 },
        { name: "Isti'la & Istifal (Elevation vs Lowering)", points: 4 },
        { name: 'Itbaq & Infitah (Covering vs Opening)', points: 3 },
        { name: 'Safir, Qalqalah, Lin, Inhiraf, Takrir, Tafashi, Istitalah', points: 6 }
      ]
    },
    sifatAridah: {
      title: 'Sifat Aridah (Temporary Characteristics)',
      maxPoints: 25,
      subcriteria: [
        { name: "Ith-har, Idgham, Iqlab, Ikhfa' (Noon & Tanwin rules)", points: 7 },
        { name: 'Meem Sakinah Rules', points: 4 },
        { name: 'Tafkhim & Tarqiq (Thick vs Thin)', points: 5 },
        { name: 'Madd Rules (Asl, Muttasil, Munfasil, Lazim, Arid)', points: 7 },
        { name: 'Waqf & Ibtida (Stopping & Starting)', points: 2 }
      ]
    },
    fluency: {
      title: 'Fluency & Tarteel',
      maxPoints: 15,
      subcriteria: [
        { name: 'Smooth Flow & Rhythm', points: 5 },
        { name: 'Proper Harakaat (Vowels)', points: 4 },
        { name: 'Proper Sukun Application', points: 3 },
        { name: 'Tashdid Recognition', points: 3 }
      ]
    },
    mistakes: {
      title: 'Error Classification',
      maxPoints: 15,
      subcriteria: [
        { name: 'Lahn Jaliy (Clear Errors) - Deduct heavily', points: 8 },
        { name: 'Lahn Khafiy (Hidden Errors) - Deduct moderately', points: 7 }
      ]
    }
  };

  const addStudent = async () => {
    if (newStudentName.trim()) {
      const newStudent = {
        id: Date.now(),
        name: newStudentName.trim(),
        sessions: [],
        totalScore: 0,
        averageScore: 0
      };
      const updatedStudents = [...students, newStudent];
      setStudents(updatedStudents);
      await saveData(updatedStudents);
      setNewStudentName('');
      setShowAddStudent(false);
    }
  };

  const bulkAddStudents = async () => {
    const names = bulkNames.split('\n').filter(name => name.trim());
    if (names.length > 0) {
      const newStudents = names.map((name, index) => ({
        id: Date.now() + index,
        name: name.trim(),
        sessions: [],
        totalScore: 0,
        averageScore: 0
      }));
      const updatedStudents = [...students, ...newStudents];
      setStudents(updatedStudents);
      await saveData(updatedStudents);
      setBulkNames('');
      setShowBulkUpload(false);
      alert(`${names.length} students added successfully!`);
    }
  };

  const deleteStudent = async (id) => {
    const updatedStudents = students.filter(s => s.id !== id);
    setStudents(updatedStudents);
    await saveData(updatedStudents);
    if (selectedStudent?.id === id) setSelectedStudent(null);
  };

  const addSession = async (studentId, sessionData) => {
    const updatedStudents = students.map(s => {
      if (s.id === studentId) {
        const newSessions = [...s.sessions, sessionData];
        const total = newSessions.reduce((acc, sess) => acc + sess.totalScore, 0);
        return {
          ...s,
          sessions: newSessions,
          totalScore: total,
          averageScore: total / newSessions.length
        };
      }
      return s;
    });
    setStudents(updatedStudents);
    await saveData(updatedStudents);
  };

  const exportData = () => {
    const exportPackage = {
      teacher: teacherName,
      exportDate: new Date().toISOString(),
      students: students,
      version: '1.0'
    };
    const dataStr = JSON.stringify(exportPackage, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    const filename = `quran-tracker-${teacherName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
    link.download = filename;
    link.click();
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          const studentsData = imported.students || imported;
          if (Array.isArray(studentsData)) {
            const shouldMerge = students.length > 0 && 
              confirm('You have existing data. Do you want to MERGE with imported data? (Cancel will REPLACE all data)');
            
            if (shouldMerge) {
              const merged = [...students, ...studentsData];
              setStudents(merged);
              await saveData(merged);
            } else {
              setStudents(studentsData);
              await saveData(studentsData);
            }
            alert('Data imported successfully!');
          }
        } catch (error) {
          alert('Error importing data. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const clearAllData = async () => {
    if (confirm('Are you sure you want to delete ALL student data? This cannot be undone.')) {
      setStudents([]);
      await saveData([]);
      setSelectedStudent(null);
    }
  };

  const SessionScoring = ({ student, onClose }) => {
    const [scores, setScores] = useState({});
    const [notes, setNotes] = useState('');

    const updateScore = (category, subIndex, value) => {
      setScores({
        ...scores,
        [category]: {
          ...scores[category],
          [subIndex]: Math.min(Math.max(0, parseInt(value) || 0), 
            scoringCriteria[category].subcriteria[subIndex].points)
        }
      });
    };

    const calculateTotal = () => {
      let total = 0;
      Object.keys(scoringCriteria).forEach(category => {
        if (scores[category]) {
          Object.values(scores[category]).forEach(val => total += val);
        }
      });
      return total;
    };

    const saveSession = async () => {
      const sessionData = {
        ...currentSession,
        scores,
        totalScore: calculateTotal(),
        notes,
        timestamp: new Date().toISOString()
      };
      await addSession(student.id, sessionData);
      setShowScoring(false);
      onClose();
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-blue-900">Score Session: {student.name}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                value={currentSession.date}
                onChange={(e) => setCurrentSession({...currentSession, date: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Surah</label>
              <input
                type="text"
                value={currentSession.surah}
                onChange={(e) => setCurrentSession({...currentSession, surah: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="e.g., Al-Fatiha"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ayah Range</label>
              <input
                type="text"
                value={currentSession.ayahRange}
                onChange={(e) => setCurrentSession({...currentSession, ayahRange: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="e.g., 1-7"
              />
            </div>
          </div>

          <div className="space-y-6">
            {Object.entries(scoringCriteria).map(([key, category]) => (
              <div key={key} className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-bold text-lg mb-3 text-blue-800">
                  {category.title} (Max: {category.maxPoints} points)
                </h3>
                <div className="grid gap-3">
                  {category.subcriteria.map((sub, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white p-3 rounded">
                      <label className="text-sm flex-1">{sub.name}</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max={sub.points}
                          value={scores[key]?.[idx] || 0}
                          onChange={(e) => updateScore(key, idx, e.target.value)}
                          className="w-16 p-2 border rounded text-center"
                        />
                        <span className="text-sm text-gray-600">/ {sub.points}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium mb-2">Session Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 border rounded h-24"
              placeholder="Additional observations, areas for improvement, strengths..."
            />
          </div>

          <div className="mt-6 flex justify-between items-center">
            <div className="text-xl font-bold text-blue-900">
              Total Score: {calculateTotal()} / 100
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={saveSession}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
              >
                <Save size={18} />
                Save Session
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const StudentDetails = ({ student, onBack }) => {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <button onClick={onBack} className="mb-4 text-blue-600 hover:text-blue-800">
          ← Back to Students
        </button>
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {student.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{student.name}</h2>
              <p className="text-gray-600">{student.sessions.length} sessions completed</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">
              {student.averageScore ? student.averageScore.toFixed(1) : 0}%
            </div>
            <div className="text-sm text-gray-600">Average Score</div>
          </div>
        </div>

        <button
          onClick={() => setShowScoring(true)}
          className="w-full mb-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Add New Session Score
        </button>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Session History</h3>
          <div className="space-y-3">
            {student.sessions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No sessions recorded yet</p>
            ) : (
              student.sessions.slice().reverse().map((session, idx) => (
                <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold">{session.surah} ({session.ayahRange})</div>
                      <div className="text-sm text-gray-600">{new Date(session.date).toLocaleDateString()}</div>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {session.totalScore}%
                    </div>
                  </div>
                  {session.notes && (
                    <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                      {session.notes}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">Quran Recitation Class Tracker</h1>
          <p className="text-gray-600">Comprehensive Tajweed & Makhraj Performance Assessment</p>
          {teacherName && (
            <p className="text-sm text-blue-600 mt-2">Teacher: {teacherName}</p>
          )}
          <div className="flex items-center justify-center gap-2 mt-2">
            <p className="text-sm text-green-600">✓ Data saved automatically</p>
            <button
              onClick={() => setShowCloudInfo(true)}
              className="text-blue-500 hover:text-blue-700"
            >
              <Info size={16} />
            </button>
          </div>
        </div>

        {!selectedStudent ? (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
              <h2 className="text-2xl font-bold text-blue-900">Students ({students.length})</h2>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setShowAddStudent(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus size={20} />
                  Add Single
                </button>
                <button
                  onClick={() => setShowBulkUpload(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Users size={20} />
                  Bulk Add
                </button>
                <button
                  onClick={exportData}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  title="Download backup to save to Google Drive or OneDrive"
                >
                  <Download size={20} />
                  Export
                </button>
                <label className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 cursor-pointer"
                  title="Import backup from Google Drive or OneDrive">
                  <Upload size={20} />
                  Import
                  <input
                    type="file"
                    accept=".json"
                    onChange={importData}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {students.length === 0 ? (
              <div className="text-center py-12">
                <User size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">No students added yet.</p>
                <p className="text-sm text-gray-400">Click "Add Single" to add one student, or "Bulk Add" to add multiple students at once.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.map(student => (
                  <div key={student.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{student.name}</h3>
                          <p className="text-sm text-gray-600">{student.sessions.length} sessions</p>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteStudent(student.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Average Score</span>
                        <span className="font-semibold">{student.averageScore ? student.averageScore.toFixed(1) : 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.max(0, Math.min(100, student.averageScore || 0))}%` }}np
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowScoring(true);
                        }}
                        className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                      >
                        Score
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {students.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <button
                  onClick={clearAllData}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Clear All Data
                </button>
              </div>
            )}
          </div>
        ) : (
          <StudentDetails student={selectedStudent} onBack={() => setSelectedStudent(null)} />
        )}

        {showTeacherSetup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Welcome! Setup Your Profile</h3>
              <p className="text-sm text-gray-600 mb-4">Enter your name to personalize your tracker:</p>
              <input
                type="text"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                placeholder="Teacher Name (e.g., Ustadh Ahmed)"
                className="w-full p-3 border rounded mb-4"
                onKeyDown={(e) => e.key === 'Enter' && saveTeacherName(newStudentName)}

              />
              <button
                onClick={() => saveTeacherName(newStudentName)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {showCloudInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Cloud className="text-blue-600" />
                  Cloud Storage Guide
                </h3>
                <button onClick={() => setShowCloudInfo(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
              </div>
              
              <div className="space-y-4 text-sm">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Google Drive:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-gray-700">
                    <li>Click Export to download your data file</li>
                    <li>Upload the JSON file to your Google Drive</li>
                    <li>Share the file with other teachers if needed</li>
                    <li>On another device: Download from Google Drive and click Import</li>
                  </ol>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">OneDrive:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-gray-700">
                    <li>Click Export to download your data file</li>
                    <li>Save the JSON file to your OneDrive folder</li>
                    <li>Access from any device with OneDrive sync</li>
                    <li>On another device: Click Import and select the file from OneDrive</li>
                  </ol>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Best Practices:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Export regularly to create backups</li>
                    <li>Name files with dates: tracker-2024-01-15.json</li>
                    <li>Store in a dedicated folder</li>
                    <li>When importing choose Merge to combine data or Replace to overwrite</li>
                  </ul>
                </div>
              </div>

              <button
                onClick={() => setShowCloudInfo(false)}
                className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Got it!
              </button>
            </div>
          </div>
        )}

        {showAddStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Add New Student</h3>
              <input
                type="text"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                placeholder="Student Name"
                className="w-full p-3 border rounded mb-4"
                onKeyDown={(e) => e.key === 'Enter' && addStudent()}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddStudent(false)}
                  className="flex-1 px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={addStudent}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add Student
                </button>
              </div>
            </div>
          </div>
        )}

        {showBulkUpload && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Bulk Add Students</h3>
              <p className="text-sm text-gray-600 mb-3">Enter student names, one per line:</p>
              <textarea
                value={bulkNames}
                onChange={(e) => setBulkNames(e.target.value)}
                placeholder="Ahmed Ali&#10;Fatima Hassan&#10;Omar Ibrahim&#10;Aisha Mohamed"
                className="w-full p-3 border rounded mb-4 h-48 font-mono"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBulkUpload(false)}
                  className="flex-1 px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={bulkAddStudents}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Add Students
                </button>
              </div>
            </div>
          </div>
        )}

        {showScoring && selectedStudent && (
          <SessionScoring 
            student={selectedStudent} 
            onClose={() => setShowScoring(false)} 
          />
        )}
      </div>
    </div>
  );
};

export default QuranRecitationTracker;
