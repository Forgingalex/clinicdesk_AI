import db from '../db';

const SYSTEM_PROMPT = `You are the Admin Insight Agent for a clinic CRM.
Generate daily summaries and basic insights.
Highlight trends and urgent issues.
Keep output concise and actionable.`;

export function generateAdminSummary() {
  const today = new Date().toISOString().split('T')[0];
  
  const totalConversations = db.prepare(`
    SELECT COUNT(*) as count FROM Conversation 
    WHERE date(timestamp) = date(?)
  `).get(today) as { count: number };

  // Count all appointments created for today (from Appointment table)
  const appointmentsToday = db.prepare(`
    SELECT COUNT(*) as count FROM Appointment 
    WHERE date = ?
  `).get(today) as { count: number };

  const returningPatients = db.prepare(`
    SELECT COUNT(DISTINCT patientId) as count FROM Appointment 
    WHERE patientId IN (
      SELECT patientId FROM Appointment 
      GROUP BY patientId 
      HAVING COUNT(*) > 1
    ) AND date = ? AND status = 'confirmed'
  `).get(today) as { count: number };

  // Count all feedback entries created today (not just urgent)
  const complaints = db.prepare(`
    SELECT COUNT(*) as count FROM Feedback 
    WHERE date(timestamp) = date(?)
  `).get(today) as { count: number };

  // Peak inquiry time (hour with most user messages only, exclude assistant messages)
  const peakHour = db.prepare(`
    SELECT strftime('%H', timestamp) as hour, COUNT(*) as count
    FROM Conversation
    WHERE role = 'user' AND date(timestamp) = date(?)
    GROUP BY hour
    ORDER BY count DESC
    LIMIT 1
  `).get(today) as { hour: string; count: number } | undefined;

  return {
    totalConversations: totalConversations.count,
    appointmentsBooked: appointmentsToday.count,
    returningPatients: returningPatients.count,
    complaintsFlagged: complaints.count,
    peakInquiryTime: peakHour ? `${peakHour.hour}:00` : 'N/A'
  };
}
