import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const date = searchParams.get('date');

    let appointments;
    if (date) {
      appointments = db.prepare(`
        SELECT a.*, p.name, p.phone 
        FROM Appointment a
        LEFT JOIN Patient p ON a.patientId = p.id
        WHERE a.date = ?
        ORDER BY a.time
      `).all(date);
    } else {
      appointments = db.prepare(`
        SELECT a.*, p.name, p.phone 
        FROM Appointment a
        LEFT JOIN Patient p ON a.patientId = p.id
        ORDER BY a.date DESC, a.time DESC
        LIMIT 50
      `).all();
    }

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error('Appointments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { patientId, date, time, reason } = await req.json();

    if (!patientId || !date || !time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = db.prepare(`
      INSERT INTO Appointment (patientId, date, time, reason, status)
      VALUES (?, ?, ?, ?, 'confirmed')
    `).run(patientId, date, time, reason || null);

    return NextResponse.json({ 
      success: true, 
      appointmentId: result.lastInsertRowid 
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



