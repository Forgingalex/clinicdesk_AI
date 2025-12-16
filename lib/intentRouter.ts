import { Intent } from './types';

export function classifyIntent(message: string): Intent {
  const lower = message.toLowerCase();
  
  if (lower.match(/\b(book|appointment|schedule|reschedule|cancel|when|available|checkup)\b/) ||
      lower.match(/\bsee\s+(a\s+)?doctor\b/) ||
      lower.match(/\bvisit\s+(a\s+)?doctor\b/) ||
      lower.match(/\bcome\s+in\b/)) {
    return 'appointment';
  }
  
  if (lower.match(/\b(test|result|lab|report|ready|status)\b/)) {
    return 'test_result';
  }
  
  // Feedback intent - check before inquiry to prevent complaints from reaching Inquiry Agent
  if (lower.match(/\b(not\s+happy|unhappy|complaint|bad\s+service|poor\s+service|waiting\s+time|delay|frustrated|angry|dissatisfied)\b/) ||
      lower.match(/\b(feedback|review|rating|unsatisfied|bad|terrible|awful|worst|disappointed)\b/)) {
    return 'feedback';
  }
  
  if (lower.match(/\b(question|what|where|when|how|price|cost|hours|location|service|open|opening|close|closing|time|weekday|weekdays|weekend|weekends|saturday|saturdays|sunday|sundays|today|tomorrow|working\s+hours|office\s+hours|available|availability)\b/)) {
    return 'inquiry';
  }
  
  return 'unknown';
}

