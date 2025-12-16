import db from '../db';
import { getPatientByPhone } from './memory';

const SYSTEM_PROMPT = `You are the Test Result Follow Up Agent for a private clinic.
Only confirm whether a test result is ready or not.
Never reveal or interpret medical results.
Escalate sensitive requests to clinic staff.`;

export async function handleTestResult(message: string, patientId: number | null): Promise<string> {
  // First check current message for phone number pattern
  const phoneMatch = message.match(/\b(\d{10,11})\b/);
  let currentPatientId = patientId;
  let phone: string | null = null;

  if (phoneMatch) {
    phone = phoneMatch[1];
    const patient = getPatientByPhone(phone);
    if (patient) {
      currentPatientId = patient.id;
    }
  }

  // If no phone number detected in message and no patientId, ask for phone number
  if (!phone && !currentPatientId) {
    return 'To check your test results, I need your phone number. Please provide it.';
  }

  // If phone number was provided but patient doesn't exist, return not found response
  if (phone && !currentPatientId) {
    return 'No test results found for this phone number yet. Please check back later or contact the clinic directly. Expected turnaround time is usually 24-48 hours after your visit.';
  }

  // If patientId exists, check for test results
  if (currentPatientId) {
    const appointments = db.prepare('SELECT * FROM Appointment WHERE patientId = ? ORDER BY date DESC LIMIT 1')
      .all(currentPatientId) as any[];
    
    if (appointments.length > 0) {
      return 'Your test results are ready for collection. Please visit the clinic during our operating hours (Monday-Friday 8am-6pm, Saturday 9am-2pm). For any questions about your results, please speak directly with our medical staff.';
    } else {
      return 'No test results found for this phone number yet. Please check back later or contact the clinic directly. Expected turnaround time is usually 24-48 hours after your visit.';
    }
  }

  return 'To check your test results, I need your phone number. Please provide it.';
}



