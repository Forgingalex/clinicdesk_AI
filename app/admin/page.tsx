'use client';

import { useEffect, useState } from 'react';
import AdminCard from '@/components/AdminCard';

interface Summary {
  totalConversations: number;
  appointmentsBooked: number;
  returningPatients: number;
  complaintsFlagged: number;
  peakInquiryTime: string;
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await fetch('/api/admin/summary');
      const data = await res.json();
      setSummary(data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
          <p className="text-red-600">Failed to load data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Today's Overview</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AdminCard
            title="Total Conversations"
            value={summary.totalConversations}
            subtitle="Chat interactions today"
          />
          <AdminCard
            title="Appointments Booked"
            value={summary.appointmentsBooked}
            subtitle="Confirmed appointments"
          />
          <AdminCard
            title="Returning Patients"
            value={summary.returningPatients}
            subtitle="Repeat visitors"
          />
          <AdminCard
            title="Complaints Flagged"
            value={summary.complaintsFlagged}
            subtitle="Urgent issues"
          />
          <AdminCard
            title="Peak Inquiry Time"
            value={summary.peakInquiryTime}
            subtitle="Busiest hour"
          />
        </div>

        <div className="mt-8">
          <a
            href="/"
            className="text-green-600 hover:text-green-700 font-medium"
          >
            ← Back to Chat
          </a>
        </div>
      </div>
    </div>
  );
}



