import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const feedbacks = db.prepare(`
      SELECT f.*, p.name, p.phone 
      FROM Feedback f
      LEFT JOIN Patient p ON f.patientId = p.id
      ORDER BY f.timestamp DESC
      LIMIT 50
    `).all();

    return NextResponse.json({ feedbacks });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}




