export interface Patient {
  id: number;
  name: string;
  phone: string;
  firstVisit: string | null;
}

export interface Appointment {
  id: number;
  patientId: number;
  date: string;
  time: string;
  reason: string | null;
  status: string;
}

export interface Conversation {
  id: number;
  patientId: number | null;
  role: 'user' | 'assistant';
  message: string;
  timestamp: string;
}

export interface Feedback {
  id: number;
  patientId: number | null;
  sentiment: string | null;
  message: string;
  urgent: number;
  timestamp: string;
}

export type Intent = 'inquiry' | 'appointment' | 'test_result' | 'feedback' | 'unknown';



