import db from '../db';
import { Patient } from '../types';

const SYSTEM_PROMPT = `You are the Patient Memory Agent for a clinic CRM system.
Store and retrieve patient identity and visit history.
You do not speak to patients directly.
You only provide context to other agents.`;

export function getPatientContext(phone: string): string {
  const patient = db.prepare('SELECT * FROM Patient WHERE phone = ?').get(phone) as Patient | undefined;
  
  if (!patient) {
    return 'New patient - no prior history';
  }

  const appointments = db.prepare('SELECT * FROM Appointment WHERE patientId = ? ORDER BY date DESC LIMIT 3')
    .all(patient.id);
  
  const visitCount = db.prepare('SELECT COUNT(*) as count FROM Appointment WHERE patientId = ?')
    .get(patient.id) as { count: number };

  return `Patient: ${patient.name}, Phone: ${patient.phone}, First visit: ${patient.firstVisit}, Total appointments: ${visitCount.count}. Recent appointments: ${JSON.stringify(appointments)}`;
}

export function getPatientByPhone(phone: string): Patient | undefined {
  return db.prepare('SELECT * FROM Patient WHERE phone = ?').get(phone) as Patient | undefined;
}



