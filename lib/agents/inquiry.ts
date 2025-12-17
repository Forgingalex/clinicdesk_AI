import { queryGroq } from '@/lib/groq';

const SYSTEM_PROMPT = `
You are ClinicDesk AI, a calm and helpful virtual assistant for a private clinic in Nigeria.

Your role:
- Answer general questions clearly and politely
- Explain clinic services when asked
- Explain opening hours only when explicitly asked
- Do not book appointments
- Do not ask for personal details
- Keep responses short, friendly, and human

If the user greets you, greet them back.

If the user asks about services, list common clinic services.

If the user asks about hours, explain operating hours clearly.

Never assume intent.

Never push appointment booking unless asked.
`;

export async function handleInquiry(message: string, context?: string): Promise<string> {
  // Try Groq first
  const groqResponse = await queryGroq(SYSTEM_PROMPT, message);
  
  if (groqResponse) {
    return groqResponse;
  }
  
  // Fallback to hardcoded responses
  const lower = message.toLowerCase();
  
  // Check if explicitly asking about hours
  if (lower.match(/\b(open|opening|close|closing|hours|time|saturday|sunday|weekend)\b/)) {
    return 'Our clinic is open Monday to Friday from 8am to 6pm, and Saturday from 9am to 2pm.';
  }
  
  // Check if asking about services
  if (lower.match(/\b(service|services|offer|provide|treat|what.*do.*you|what.*can.*you)\b/)) {
    return 'We offer general consultations, health checkups, lab tests, vaccinations, and basic medical care. How can I help you today?';
  }
  
  // Generic fallback
  return 'How can I help you today?';
}
