import db from '../db';
import { Patient } from '../types';

const SYSTEM_PROMPT = `You are the Appointment Scheduling Agent for a private clinic in Nigeria.
Help patients book, reschedule, or cancel appointments.
Collect only necessary details: name, phone, reason, date, and time.
Confirm availability before booking.
Never provide medical advice.`;

interface AppointmentDetails {
  name?: string;
  phone?: string;
  reason?: string;
  date?: string;
  time?: string;
}

export async function handleAppointment(
  message: string,
  patientId: number | null,
  details: AppointmentDetails = {},
  context: string = ''
): Promise<{ response: string; appointment?: any; updatedDetails?: AppointmentDetails; pendingDetails?: boolean }> {
  const fullText = (context + ' ' + message).toLowerCase();
  const lower = message.toLowerCase();

  // Extract information from current message and merge into existing state
  if (!details.name && fullText.match(/my name is|i'm|i am|name:? (.+)/i)) {
    const match = (context + ' ' + message).match(/name is (.+?)(?:\.|,|$)/i) || 
                  (context + ' ' + message).match(/i['']?m (.+?)(?:\.|,|$)/i);
    if (match) details.name = match[1].trim();
  }

  if (!details.phone && fullText.match(/\b\d{10,11}\b/)) {
    const match = (context + ' ' + message).match(/\b(\d{10,11})\b/);
    if (match) details.phone = match[1];
  }

  if (!details.date && fullText.match(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}[-\/]\d{1,2})\b/)) {
    if (fullText.includes('today')) {
      details.date = new Date().toISOString().split('T')[0];
    } else if (fullText.includes('tomorrow')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      details.date = tomorrow.toISOString().split('T')[0];
    }
  }

  // Normalize date format to YYYY-MM-DD to match admin dashboard queries
  if (details.date) {
    try {
      const dateObj = new Date(details.date);
      if (!isNaN(dateObj.getTime())) {
        details.date = dateObj.toISOString().split('T')[0];
      }
    } catch {
      // If date parsing fails, keep original format
    }
  }

  if (!details.time && fullText.match(/\b\d{1,2}:\d{2}|\b\d{1,2}\s?(am|pm)\b/i)) {
    const match = (context + ' ' + message).match(/\b(\d{1,2}:?\d{0,2}\s?(am|pm)?)\b/i);
    if (match) details.time = match[1];
  }

  if (!details.reason && (fullText.includes('checkup') || fullText.includes('consultation') || fullText.includes('follow'))) {
    if (fullText.includes('checkup')) details.reason = 'General checkup';
    else if (fullText.includes('follow')) details.reason = 'Follow-up';
    else if (fullText.includes('consultation')) details.reason = 'General consultation';
  }

  // Check if all details collected
  const hasAllDetails = details.name && details.phone && details.date && details.time;

  if (hasAllDetails) {
    // Create or find patient
    let patient: Patient | undefined;
    if (patientId) {
      patient = db.prepare('SELECT * FROM Patient WHERE id = ?').get(patientId) as Patient;
    }

    if (!patient && details.phone) {
      const existing = db.prepare('SELECT * FROM Patient WHERE phone = ?').get(details.phone) as Patient | undefined;
      if (existing) {
        patient = existing;
      } else {
        const result = db.prepare('INSERT INTO Patient (name, phone, firstVisit) VALUES (?, ?, ?)')
          .run(details.name, details.phone, new Date().toISOString());
        patient = db.prepare('SELECT * FROM Patient WHERE id = ?').get(result.lastInsertRowid) as Patient;
      }
    }

    if (patient) {
      // Ensure date is normalized to YYYY-MM-DD format
      const normalizedDate = details.date ? new Date(details.date).toISOString().split('T')[0] : details.date;
      
      // Create appointment with confirmed status
      const result = db.prepare(`
        INSERT INTO Appointment (patientId, date, time, reason, status)
        VALUES (?, ?, ?, ?, 'confirmed')
      `).run(patient.id, normalizedDate, details.time, details.reason || 'General consultation');

      return {
        response: `Appointment confirmed! Your appointment is scheduled for ${details.date} at ${details.time}. We look forward to seeing you, ${details.name}!`,
        appointment: { id: result.lastInsertRowid, ...details },
        pendingDetails: false
      };
    }
  }

  // Determine which required fields are still missing
  const missing: string[] = [];
  if (!details.name) missing.push('name');
  if (!details.phone) missing.push('phone number');
  if (!details.date) missing.push('preferred date');
  if (!details.time) missing.push('preferred time');

  const needsNameOrPhone = !details.name || !details.phone;
  
  // Return updated state and response
  return {
    response: missing.length > 0
      ? `I need a few more details to book your appointment: ${missing.join(', ')}. Please provide these.`
      : 'I can help you book an appointment. Please provide your name, phone number, preferred date, and time.',
    updatedDetails: details,
    pendingDetails: needsNameOrPhone && !hasAllDetails
  };
}
