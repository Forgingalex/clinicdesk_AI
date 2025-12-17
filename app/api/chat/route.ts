import { NextRequest, NextResponse } from 'next/server';
import { classifyIntent } from '@/lib/intentRouter';
import { handleInquiry } from '@/lib/agents/inquiry';
import { handleAppointment } from '@/lib/agents/appointment';
import { handleTestResult } from '@/lib/agents/results';
import { handleFeedback } from '@/lib/agents/feedback';
import { getPatientContext, getPatientByPhone } from '@/lib/agents/memory';
import { checkGroqHealth } from '@/lib/groq';
import db from '@/lib/db';

// Explicit keyword groups for intent routing
const GREETING_KEYWORDS = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'];
const SERVICE_KEYWORDS = ['service', 'services', 'offer', 'provide', 'treat', 'clinic services'];
const HOURS_KEYWORDS = ['open', 'opening', 'close', 'closing', 'hours', 'time', 'saturday', 'sunday', 'weekend'];

// In-memory state for tracking appointment booking flow
const appointmentState = new Map<number | string, boolean>();
const pendingAppointments = new Map<number | string, {
  name?: string;
  phone?: string;
  reason?: string;
  date?: string;
  time?: string;
}>();
const pendingTestResultLookup = new Map<number | string, boolean>();

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
    }

    // Check Groq health once per request
    const groqAvailable = await checkGroqHealth();

    // Store user message
    const userMsgId = db.prepare(`
      INSERT INTO Conversation (patientId, role, message)
      VALUES (?, 'user', ?)
    `).run(null, message).lastInsertRowid;

    // Extract phone if present (for patient identification)
    const phoneMatch = message.match(/\b(\d{10,11})\b/);
    const phone = phoneMatch ? phoneMatch[1] : null;
    
    let patientId: number | null = null;
    if (phone) {
      const patient = getPatientByPhone(phone);
      if (patient) {
        patientId = patient.id;
        // Update conversation with patientId
        db.prepare('UPDATE Conversation SET patientId = ? WHERE id = ?').run(patientId, userMsgId);
      }
    }

    // Get context
    const context = phone ? getPatientContext(phone) : undefined;

    // Get recent conversation for context
    const recentMessages = db.prepare(`
      SELECT message FROM Conversation 
      WHERE role = 'user' AND id != ? 
      ORDER BY id DESC LIMIT 5
    `).all(userMsgId) as { message: string }[];

    const recentContext = recentMessages.map(m => m.message).join(' ');

    // Check appointment booking state
    const stateKey = patientId || 'anonymous';
    const pendingAppointmentDetails = appointmentState.get(stateKey) || false;
    const pendingTestResult = pendingTestResultLookup.get(stateKey) || false;

    // Check if message contains appointment-related signals
    const lower = message.toLowerCase();
    const hasAppointmentSignals = lower.match(/\b(appointment|book|schedule|tomorrow|today|next\s+week|monday|tuesday|wednesday|thursday|friday|saturday|sunday|come\s+in|see\s+doctor|visit\s+doctor)\b/) ||
      lower.match(/\b\d{1,2}:\d{2}|\b\d{1,2}\s?(am|pm)\b/i) ||
      lower.match(/\b\d{1,2}[-\/]\d{1,2}\b/) ||
      (pendingAppointmentDetails && (lower.match(/\b\d{10,11}\b/) || lower.match(/my name is|i'm|i am|name:?/i)));

    // Check if message contains phone number
    const hasPhoneNumber = lower.match(/\b\d{10,11}\b/);
    
    // Check if message explicitly continues test result flow
    // Message continues test result flow ONLY if it contains:
    // - A phone number pattern, OR
    // - Explicit reference like "my number is", "here is my phone number"
    const continuesTestResultFlow = hasPhoneNumber || 
      lower.match(/\b(my number is|here is my phone|phone number is|my phone|contact number)\b/);

    // Check keyword groups
    const isGreeting = GREETING_KEYWORDS.some(keyword => lower.includes(keyword));
    const isServiceQuestion = SERVICE_KEYWORDS.some(keyword => lower.includes(keyword));
    const isHoursQuestion = HOURS_KEYWORDS.some(keyword => lower.includes(keyword));

    // Route intent - stateless-first: each message is classified independently
    // Flows must be explicitly continued; otherwise they reset to avoid intent leakage.
    let intent: string;
    
    // Step 1: Check if active test result flow should continue
    // Only continue if message explicitly continues the flow (phone number or reference)
    if (pendingTestResult && continuesTestResultFlow) {
      // Message explicitly continues test result flow - route to Test Result Agent
      intent = 'test_result';
    } 
    // Step 2: Hard reset if test result flow is active but message doesn't continue it
    else if (pendingTestResult && !continuesTestResultFlow) {
      // Message does NOT continue test result flow - clear state and re-classify
      pendingTestResultLookup.delete(stateKey);
      // Fall through to intent classification below
      const classifiedIntent = classifyIntent(message);
      
      if (classifiedIntent === 'test_result') {
        intent = 'test_result';
      } else if (classifiedIntent === 'appointment') {
        intent = 'appointment';
      } else if (classifiedIntent === 'feedback') {
        intent = 'feedback';
      } else {
        // Route to Inquiry Agent as safe default
        if (isGreeting || isServiceQuestion) {
          intent = 'inquiry';
        } else if (isHoursQuestion) {
          intent = 'inquiry';
        } else {
          intent = 'inquiry';
        }
      }
    }
    // Step 3: Active appointment flow
    else if (pendingAppointmentDetails && hasAppointmentSignals) {
      intent = 'appointment';
    } 
    // Step 4: Explicit intent detection (normal flow)
    else {
      const classifiedIntent = classifyIntent(message);
      
      if (classifiedIntent === 'test_result') {
        intent = 'test_result';
      } else if (classifiedIntent === 'appointment') {
        intent = 'appointment';
      } else if (classifiedIntent === 'feedback') {
        intent = 'feedback';
      } else {
        // Step 5: Inquiry routing - safe default
        if (isGreeting || isServiceQuestion) {
          intent = 'inquiry';
        } else if (isHoursQuestion) {
          intent = 'inquiry';
        } else {
          // Final fallback - always route to Inquiry Agent
          intent = 'inquiry';
        }
      }
      
      // Clear state if user changes intent (only when not in active flows)
      if (intent !== 'appointment' || !hasAppointmentSignals) {
        appointmentState.delete(stateKey);
        pendingAppointments.delete(stateKey);
      }
    }
    
    let response: string;

    switch (intent) {
      case 'appointment':
        // Retrieve existing pending appointment state
        const existingDetails = pendingAppointments.get(stateKey) || {};
        const appointmentResult = await handleAppointment(message, patientId, existingDetails, recentContext);
        response = appointmentResult.response;
        // Update state based on agent response
        if (appointmentResult.appointment) {
          // Appointment booked - clear all state
          appointmentState.delete(stateKey);
          pendingAppointments.delete(stateKey);
        } else if (appointmentResult.pendingDetails) {
          // Requesting details - update state
          appointmentState.set(stateKey, true);
          if (appointmentResult.updatedDetails) {
            pendingAppointments.set(stateKey, appointmentResult.updatedDetails);
          }
        }
        break;
      
      case 'test_result':
        response = await handleTestResult(message, patientId);
        // Set flag if agent requests phone number (indicates flow is still active)
        // Check for the exact phrases the Test Result Agent uses when asking for phone number
        const responseLower = response.toLowerCase();
        if (responseLower.includes('i need your phone number') || 
            responseLower.includes('please provide it')) {
          pendingTestResultLookup.set(stateKey, true);
        } else {
          // Final response received (result found or not found) - clear state
          pendingTestResultLookup.delete(stateKey);
        }
        break;
      
      case 'feedback':
        const feedbackResult = await handleFeedback(message, patientId, groqAvailable);
        response = feedbackResult.response;
        break;
      
      case 'inquiry':
      default:
        response = await handleInquiry(message, context, groqAvailable);
        break;
    }

    // Store assistant response
    db.prepare(`
      INSERT INTO Conversation (patientId, role, message)
      VALUES (?, 'assistant', ?)
    `).run(patientId, response);

    return NextResponse.json({ response, intent });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
