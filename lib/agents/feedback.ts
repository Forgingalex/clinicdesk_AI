import db from '../db';
import { queryGroq } from '@/lib/groq';

const SYSTEM_PROMPT = `
You are ClinicDesk AI handling patient feedback and complaints.

Your role:
- Respond with empathy
- Acknowledge frustration or appreciation
- Reassure the patient their feedback is recorded
- Do not give medical advice
- Do not suggest appointments unless asked
- Keep responses calm, respectful, and human

Do not mention internal systems or dashboards.
`;

export async function handleFeedback(message: string, patientId: number | null): Promise<{ response: string; feedback?: any }> {
  const lower = message.toLowerCase();
  
  // Simple sentiment classification (deterministic - unchanged)
  const positiveWords = ['good', 'great', 'excellent', 'satisfied', 'happy', 'love', 'thank', 'appreciate'];
  const negativeWords = ['bad', 'terrible', 'awful', 'worst', 'unhappy', 'disappointed', 'angry', 'complaint'];
  const urgentWords = ['emergency', 'urgent', 'immediate', 'serious', 'critical', 'unsafe'];

  let sentiment = 'neutral';
  let urgent = 0;

  if (positiveWords.some(word => lower.includes(word))) {
    sentiment = 'positive';
  } else if (negativeWords.some(word => lower.includes(word))) {
    sentiment = 'negative';
  }

  if (urgentWords.some(word => lower.includes(word))) {
    urgent = 1;
  }

  // Store feedback (unchanged)
  const result = db.prepare(`
    INSERT INTO Feedback (patientId, sentiment, message, urgent)
    VALUES (?, ?, ?, ?)
  `).run(patientId, sentiment, message, urgent);

  // Use Groq for response generation, fallback to deterministic template
  const aiResponse = await queryGroq(SYSTEM_PROMPT, message);
  
  let response: string;
  
  if (aiResponse) {
    response = aiResponse;
  } else {
    // Fallback to deterministic response template
    if (sentiment === 'positive') {
      response = 'Thank you for your feedback. We appreciate your kind words. Your feedback has been recorded and will be reviewed by our team.';
    } else {
      response = 'Thank you for sharing your feedback. We\'re sorry about your experience, and your concern has been recorded and will be shared with our clinic team to help improve our service.';
    }
  }

  return {
    response,
    feedback: { id: result.lastInsertRowid, sentiment, urgent: urgent === 1 }
  };
}



