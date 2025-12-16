import db from '../db';

// Feedback and Complaint Agent - Deterministic, non-LLM based
// Fixed response template for all feedback handling

export async function handleFeedback(message: string, patientId: number | null): Promise<{ response: string; feedback?: any }> {
  const lower = message.toLowerCase();
  
  // Simple sentiment classification
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

  // Store feedback
  const result = db.prepare(`
    INSERT INTO Feedback (patientId, sentiment, message, urgent)
    VALUES (?, ?, ?, ?)
  `).run(patientId, sentiment, message, urgent);

  // Fixed deterministic response template - no LLM calls
  // Use same response for negative and neutral feedback
  let response: string;
  
  if (sentiment === 'positive') {
    response = 'Thank you for your feedback. We appreciate your kind words. Your feedback has been recorded and will be reviewed by our team.';
  } else {
    // Fixed response template for negative and neutral feedback
    response = 'Thank you for sharing your feedback. We\'re sorry about your experience, and your concern has been recorded and will be shared with our clinic team to help improve our service.';
  }

  return {
    response,
    feedback: { id: result.lastInsertRowid, sentiment, urgent: urgent === 1 }
  };
}



