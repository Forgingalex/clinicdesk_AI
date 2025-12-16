// Simple in-memory database
interface Patient {
  id: number;
  name: string;
  phone: string;
  firstVisit: string | null;
}

interface Appointment {
  id: number;
  patientId: number;
  date: string;
  time: string;
  reason: string | null;
  status: string;
}

interface Conversation {
  id: number;
  patientId: number | null;
  role: 'user' | 'assistant';
  message: string;
  timestamp: string;
}

interface Feedback {
  id: number;
  patientId: number | null;
  sentiment: string | null;
  message: string;
  urgent: number;
  timestamp: string;
}

class InMemoryDB {
  private patients: Patient[] = [];
  private appointments: Appointment[] = [];
  private conversations: Conversation[] = [];
  private feedbacks: Feedback[] = [];
  private patientIdCounter = 1;
  private appointmentIdCounter = 1;
  private conversationIdCounter = 1;
  private feedbackIdCounter = 1;

  prepare(sql: string) {
    return {
      run: (...args: any[]) => {
        if (sql.includes('INSERT INTO Patient')) {
          const id = this.patientIdCounter++;
          const patient: Patient = {
            id,
            name: args[0],
            phone: args[1],
            firstVisit: args[2] || new Date().toISOString()
          };
          this.patients.push(patient);
          return { lastInsertRowid: id };
        }
        if (sql.includes('INSERT INTO Appointment')) {
          const id = this.appointmentIdCounter++;
          const appointment: Appointment = {
            id,
            patientId: args[0],
            date: args[1],
            time: args[2],
            reason: args[3] || null,
            status: args[4] || 'pending'
          };
          this.appointments.push(appointment);
          return { lastInsertRowid: id };
        }
        if (sql.includes('INSERT INTO Conversation')) {
          const id = this.conversationIdCounter++;
          const conversation: Conversation = {
            id,
            patientId: args[0],
            role: args[1] as 'user' | 'assistant',
            message: args[2],
            timestamp: new Date().toISOString()
          };
          this.conversations.push(conversation);
          return { lastInsertRowid: id };
        }
        if (sql.includes('INSERT INTO Feedback')) {
          const id = this.feedbackIdCounter++;
          const feedback: Feedback = {
            id,
            patientId: args[0],
            sentiment: args[1],
            message: args[2],
            urgent: args[3] || 0,
            timestamp: new Date().toISOString()
          };
          this.feedbacks.push(feedback);
          return { lastInsertRowid: id };
        }
        if (sql.includes('UPDATE Conversation SET patientId')) {
          const conv = this.conversations.find(c => c.id === args[1]);
          if (conv) conv.patientId = args[0];
          return { lastInsertRowid: null };
        }
        return { lastInsertRowid: null };
      },
      get: (...args: any[]) => {
        if (sql.includes('SELECT * FROM Patient WHERE phone')) {
          return this.patients.find(p => p.phone === args[0]) || undefined;
        }
        if (sql.includes('SELECT * FROM Patient WHERE id')) {
          return this.patients.find(p => p.id === args[0]) || undefined;
        }
        if (sql.includes('SELECT COUNT(*) as count FROM Conversation') && sql.includes('date(timestamp)')) {
          const today = args[0]?.split('T')[0] || new Date().toISOString().split('T')[0];
          let filtered = this.conversations.filter(c => c.timestamp.startsWith(today));
          if (sql.includes("role = 'assistant'")) {
            filtered = filtered.filter(c => c.role === 'assistant');
          }
          if (sql.includes("message LIKE '%Appointment confirmed%'")) {
            filtered = filtered.filter(c => c.message.includes('Appointment confirmed'));
          }
          return { count: filtered.length };
        }
        if (sql.includes('SELECT COUNT(*) as count FROM Appointment') && sql.includes('WHERE date =')) {
          const date = args[0];
          let filtered = this.appointments.filter(a => a.date === date);
          if (sql.includes("status = 'confirmed'")) {
            filtered = filtered.filter(a => a.status === 'confirmed');
          }
          return { count: filtered.length };
        }
        if (sql.includes('SELECT COUNT(DISTINCT patientId)') && sql.includes('AND date =')) {
          const today = args[0];
          let todayAppointments = this.appointments.filter(a => a.date === today);
          if (sql.includes("status = 'confirmed'")) {
            todayAppointments = todayAppointments.filter(a => a.status === 'confirmed');
          }
          const patientIds = new Set(todayAppointments.map(a => a.patientId));
          const returning = Array.from(patientIds).filter(id => 
            this.appointments.filter(a => a.patientId === id && a.status === 'confirmed').length > 1
          );
          return { count: returning.length };
        }
        if (sql.includes('SELECT COUNT(*) as count FROM Feedback') && sql.includes('date(timestamp)')) {
          const today = args[0]?.split('T')[0] || new Date().toISOString().split('T')[0];
          // Count all feedback entries for today (not just urgent)
          if (sql.includes('urgent = 1')) {
            return { count: this.feedbacks.filter(f => f.urgent === 1 && f.timestamp.startsWith(today)).length };
          } else {
            return { count: this.feedbacks.filter(f => f.timestamp.startsWith(today)).length };
          }
        }
        if (sql.includes('SELECT strftime') && sql.includes('FROM Conversation')) {
          const today = args[0]?.split('T')[0] || new Date().toISOString().split('T')[0];
          // Filter by role = 'user' for peak inquiry time (exclude assistant messages)
          let todayConvs = this.conversations.filter(c => c.timestamp.startsWith(today));
          if (sql.includes("role = 'user'")) {
            todayConvs = todayConvs.filter(c => c.role === 'user');
          }
          const hourCounts: Record<string, number> = {};
          todayConvs.forEach(c => {
            const hour = new Date(c.timestamp).getHours().toString().padStart(2, '0');
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
          });
          const peak = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
          return peak ? { hour: peak[0], count: peak[1] } : undefined;
        }
        if (sql.includes('SELECT * FROM Appointment WHERE patientId') && sql.includes('ORDER BY date DESC LIMIT 3')) {
          return this.appointments
            .filter(a => a.patientId === args[0])
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 3);
        }
        if (sql.includes('SELECT COUNT(*) as count FROM Appointment WHERE patientId')) {
          return { count: this.appointments.filter(a => a.patientId === args[0]).length };
        }
        if (sql.includes('SELECT id FROM Patient')) {
          return this.patients.map(p => ({ id: p.id }));
        }
        return undefined;
      },
      all: (...args: any[]) => {
        if (sql.includes('SELECT a.*, p.name, p.phone FROM Appointment')) {
          if (sql.includes('WHERE a.date =')) {
            return this.appointments
              .filter(a => a.date === args[0])
              .sort((a, b) => a.time.localeCompare(b.time))
              .map(a => ({
                ...a,
                name: this.patients.find(p => p.id === a.patientId)?.name || '',
                phone: this.patients.find(p => p.id === a.patientId)?.phone || ''
              }));
          }
          return this.appointments
            .sort((a, b) => {
              const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
              if (dateCompare !== 0) return dateCompare;
              return b.time.localeCompare(a.time);
            })
            .slice(0, 50)
            .map(a => ({
              ...a,
              name: this.patients.find(p => p.id === a.patientId)?.name || '',
              phone: this.patients.find(p => p.id === a.patientId)?.phone || ''
            }));
        }
        if (sql.includes('SELECT f.*, p.name, p.phone FROM Feedback')) {
          return this.feedbacks
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 50)
            .map(f => ({
              ...f,
              name: f.patientId ? this.patients.find(p => p.id === f.patientId)?.name || '' : '',
              phone: f.patientId ? this.patients.find(p => p.id === f.patientId)?.phone || '' : ''
            }));
        }
        if (sql.includes('SELECT message FROM Conversation') && sql.includes('WHERE role = \'user\'')) {
          return this.conversations
            .filter(c => c.role === 'user' && c.id !== args[args.length - 1])
            .sort((a, b) => b.id - a.id)
            .slice(0, 5)
            .map(c => ({ message: c.message }));
        }
        if (sql.includes('SELECT id FROM Patient')) {
          return this.patients.map(p => ({ id: p.id }));
        }
        return [];
      }
    };
  }

  exec(sql: string) {
    if (sql.includes('DELETE FROM')) {
      if (sql.includes('Feedback')) this.feedbacks = [];
      if (sql.includes('Conversation')) this.conversations = [];
      if (sql.includes('Appointment')) this.appointments = [];
      if (sql.includes('Patient')) {
        this.patients = [];
        this.patientIdCounter = 1;
        this.appointmentIdCounter = 1;
        this.conversationIdCounter = 1;
        this.feedbackIdCounter = 1;
      }
    }
    if (sql.includes('CREATE TABLE')) {
      // Tables already exist in memory, no-op
    }
  }
}

const db = new InMemoryDB();

export default db;