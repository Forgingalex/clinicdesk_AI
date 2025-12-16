import { NextResponse } from 'next/server';
import { generateAdminSummary } from '@/lib/agents/admin';

export async function GET() {
  try {
    const summary = generateAdminSummary();
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Admin summary error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



