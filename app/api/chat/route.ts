import { NextRequest, NextResponse } from 'next/server';
import { classifyIntent } from '@/lib/intentRouter';
import { handleInquiry } from '@/lib/agents/inquiry';
import { handleAppointment } from '@/lib/agents/appointment';
import { handleTestResult } from '@/lib/agents/results';
import { handleFeedback } from '@/lib/agents/feedback';
import { getPatientContext, getPatientByPhone } from '@/lib/agents/memory';
import db from '@/lib/db';

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

    // Route intent - check test result lookup state first, then appointment state
    let intent: string;
    if (pendingTestResult && hasPhoneNumber) {
      intent = 'test_result';
      pendingTestResultLookup.delete(stateKey);
    } else if (pendingAppointmentDetails && hasAppointmentSignals) {
      intent = 'appointment';
    } else {
      intent = classifyIntent(message);
      // Clear state if user changes intent
      if (intent !== 'appointment' || !hasAppointmentSignals) {
        appointmentState.delete(stateKey);
        pendingAppointments.delete(stateKey);
      }
      if (intent !== 'test_result' || !hasPhoneNumber) {
        pendingTestResultLookup.delete(stateKey);
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
        // Set flag if agent requests phone number
        if (response.includes('I need your phone number') || response.includes('Please provide it')) {
          pendingTestResultLookup.set(stateKey, true);
        } else {
          pendingTestResultLookup.delete(stateKey);
        }
        break;
      
      case 'feedback':
        const feedbackResult = await handleFeedback(message, patientId);
        response = feedbackResult.response;
        break;
      
      case 'inquiry':
      default:
        response = await handleInquiry(message, context);
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
