import db from '../lib/db';

// Clear existing data
db.exec(`
  DELETE FROM Feedback;
  DELETE FROM Conversation;
  DELETE FROM Appointment;
  DELETE FROM Patient;
`);

// Seed patients
const patients = [
  { name: 'John Doe', phone: '08012345678', firstVisit: '2024-01-15' },
  { name: 'Jane Smith', phone: '08023456789', firstVisit: '2024-02-10' },
  { name: 'Michael Brown', phone: '08034567890', firstVisit: '2024-03-05' },
];

patients.forEach(p => {
  db.prepare('INSERT INTO Patient (name, phone, firstVisit) VALUES (?, ?, ?)')
    .run(p.name, p.phone, p.firstVisit);
});

// Get patient IDs for appointments
const patientIds = db.prepare('SELECT id FROM Patient').all() as { id: number }[];

// Seed appointments
const today = new Date().toISOString().split('T')[0];
const appointments = [
  { patientId: patientIds[0].id, date: today, time: '10:00', reason: 'General checkup', status: 'confirmed' },
  { patientId: patientIds[1].id, date: today, time: '14:30', reason: 'Follow-up', status: 'confirmed' },
];

appointments.forEach(a => {
  db.prepare(`
    INSERT INTO Appointment (patientId, date, time, reason, status)
    VALUES (?, ?, ?, ?, ?)
  `).run(a.patientId, a.date, a.time, a.reason, a.status);
});

// Seed sample conversations
const sampleConversations = [
  { patientId: null, role: 'assistant', message: 'Hello! Welcome to ClinicDesk AI. How can I help you?' },
  { patientId: null, role: 'user', message: 'What are your operating hours?' },
  { patientId: null, role: 'assistant', message: 'Our clinic is open Monday to Friday from 8am to 6pm, and Saturday from 9am to 2pm.' },
];

sampleConversations.forEach(c => {
  db.prepare('INSERT INTO Conversation (patientId, role, message) VALUES (?, ?, ?)')
    .run(c.patientId, c.role, c.message);
});

// Seed sample feedback
const feedbacks = [
  { patientId: patientIds[0].id, sentiment: 'positive', message: 'Great service, very professional staff!', urgent: 0 },
  { patientId: patientIds[1].id, sentiment: 'negative', message: 'Had to wait too long for my appointment.', urgent: 0 },
];

feedbacks.forEach(f => {
  db.prepare('INSERT INTO Feedback (patientId, sentiment, message, urgent) VALUES (?, ?, ?, ?)')
    .run(f.patientId, f.sentiment, f.message, f.urgent);
});

console.log('Database seeded successfully!');
process.exit(0);




