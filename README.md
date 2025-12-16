# ClinicDesk AI

An AI-powered patient relations and CRM agent for small private clinics in Nigeria. Built for Meta AI Developer Academy Nigeria 2025 hackathon.

## Why I Built ClinicDesk AI

I've spent time observing how small private clinics in Nigeria operate, and I noticed something that bothered me: clinic staff spend enormous amounts of time answering the same questions over and over. "What are your hours?" "How much does a consultation cost?" "Where are you located?" These questions are important to patients, but they're repetitive and prevent staff from focusing on actual patient care.

I also noticed that appointment scheduling is often chaotic. Patients call, staff write appointments in notebooks or basic spreadsheets, and conflicts happen frequently. When a patient needs to check if their test results are ready, they have to call again, taking more staff time.

I wanted to build something that could handle these routine interactions automatically, freeing up clinic staff to do what they're trained for: providing medical care. But I also knew this had to be done carefully—healthcare is sensitive, and I didn't want to create something that could accidentally give medical advice or mishandle patient data.

So I built ClinicDesk AI: a system that uses specialized AI agents to handle different types of patient interactions, with clear boundaries to ensure safety.

## The Problem I Observed

Small private clinics in Nigeria face several operational challenges that I've seen firsthand:

**Repetitive Inquiries**: Clinic receptionists spend hours each day answering the same questions about operating hours, location, services, and pricing. This is necessary information, but it's time-consuming and prevents staff from handling more complex patient needs.

**Manual Appointment Management**: Most small clinics I've observed use paper notebooks, basic Excel sheets, or simple phone-based scheduling. This leads to double bookings, missed appointments, and no-shows that could have been prevented with reminders.

**Test Result Follow-ups**: Patients frequently call to check if their lab results are ready. Each call requires staff time to look up records and provide status updates. This is important for patient care, but it's repetitive work.

**Feedback Collection**: Clinics rarely have systematic ways to collect and analyze patient feedback. When patients have complaints or suggestions, they often go unrecorded, and clinics miss opportunities to improve their services.

**Limited Administrative Insights**: Clinic administrators have little visibility into patient interaction patterns. They can't easily see peak inquiry times, common questions, or feedback trends that could inform operational decisions.

These problems are important because they directly impact both patient experience and clinic efficiency. When staff are overwhelmed with routine tasks, patient care suffers. When appointments are mismanaged, patients get frustrated. When feedback isn't collected, clinics can't improve.

## What I Decided to Build

I decided to build a web-based chat interface where patients interact with specialized AI agents. Each agent handles a specific type of interaction: one for general inquiries, one for appointments, one for test results, one for feedback, and so on.

I chose this approach for several reasons:

**Specialization**: Instead of one general chatbot trying to handle everything, I built separate agents with clear responsibilities. This makes the system more reliable and easier to improve incrementally.

**Safety Through Constraints**: I intentionally limited AI usage to only general inquiries. For safety-critical operations like appointments and test results, I used deterministic logic (rule-based extraction and validation). This ensures these operations are predictable and reliable, even if the AI system has issues.

**Web Interface Over WhatsApp**: I initially considered WhatsApp integration, but the WhatsApp Business API requires complex setup, verification, and ongoing costs that small clinics can't easily manage. A web interface is simpler to deploy, doesn't require API approvals, and works on any device with a browser. Patients can access it from their phones just as easily as WhatsApp.

**Local AI Deployment**: I used Meta's LLaMA 3.2 1B model running locally via Ollama. This gives me control over the AI behavior, ensures patient data stays local, and doesn't require expensive cloud API calls. For a hackathon project, this also means I can demonstrate the system without external dependencies.

The result is a system that feels conversational for general questions but remains reliable and safe for critical operations.

## How the System Works (High Level)

When a patient sends a message through the web interface, the system first classifies what type of request it is (an inquiry, appointment booking, test result check, or feedback). This classification uses simple keyword matching—not complex machine learning—because it needs to be fast and reliable.

Once classified, the message is routed to the appropriate agent:

- **Inquiry messages** go to the Patient Inquiry Agent, which uses Meta LLaMA to generate natural responses about clinic services, hours, pricing, and location.

- **Appointment messages** go to the Appointment Scheduling Agent, which uses deterministic logic to extract patient details (name, phone, date, time) from the conversation and create appointment records.

- **Test result messages** go to the Test Result Follow Up Agent, which checks status without revealing any medical information.

- **Feedback messages** go to the Feedback and Complaint Agent, which classifies sentiment and flags urgent issues.

All conversations are logged, and patient information is associated with messages when available (via phone number extraction). This allows the system to provide context-aware responses and maintain patient history.

The system also includes an admin dashboard where clinic administrators can see real-time metrics: total conversations, appointments booked, returning patients, flagged complaints, and peak inquiry times.

## AI Agent Design Decisions

I made several intentional decisions about how to use AI in this system:

**Only General Inquiries Use LLM**: I chose to use Meta LLaMA only for the Patient Inquiry Agent, which handles general questions about services, hours, pricing, and location. This is the safest use case because these questions don't involve medical information or critical operations.

**Deterministic Logic for Safety-Critical Operations**: Appointment scheduling and test result queries use rule-based extraction and validation. This means these operations are predictable and reliable. If a patient says "I want to book an appointment tomorrow at 10am, my name is John, phone 08012345678," the system extracts these details using regex patterns and creates the appointment record. It doesn't rely on AI interpretation, which could introduce errors.

**Explicit Safety Constraints**: The Patient Inquiry Agent has a system prompt that explicitly instructs it not to provide medical advice or diagnosis. It's also designed to fall back to a hardcoded response if the AI system is unavailable, ensuring the system always responds even if Ollama isn't running.

**Modular Agent Architecture**: Each agent is independent, which means I can improve or replace individual agents without affecting others. For example, I could enhance the feedback agent's sentiment analysis without touching the appointment system.

**Context-Aware but Not Memory-Dependent**: The system maintains patient context (via the Patient Memory Agent) but doesn't rely on AI to remember conversations. Patient history is stored in the database and retrieved when needed, ensuring reliability.

These decisions reflect my belief that AI should enhance healthcare operations, not replace human judgment in critical areas. By limiting AI to conversational inquiries and using deterministic logic for operations, I've created a system that's both helpful and safe.

## How Meta AI Is Used

I'm using Meta's LLaMA 3.2 1B model, deployed locally via Ollama, for the Patient Inquiry Agent only.

**Why LLaMA 3.2 1B**: This model provides good response quality while being small enough to run locally without GPU requirements. For a hackathon project, this means I can demonstrate the system on a standard laptop without expensive cloud API costs.

**Why Local Deployment**: Running Ollama locally gives me full control over the AI behavior and ensures patient data never leaves the local environment. This is important for privacy and also means the system works offline.

**How It's Used**: When a patient asks a general question (like "What are your hours?" or "How much does a consultation cost?"), the message is sent to the Patient Inquiry Agent. The agent combines a system prompt (which sets the agent's role and constraints) with the patient's message, sends this to LLaMA via Ollama, and returns the response to the patient.

**System Prompt Engineering**: The system prompt explicitly defines the agent's role ("You are the Patient Inquiry Agent for a private clinic in Nigeria"), its constraints ("Do not give medical advice or diagnosis"), and its tone ("Be polite, concise, and professional"). This ensures the AI stays within safe boundaries.

**Fallback Behavior**: If Ollama isn't running or returns an error, the system falls back to a simple hardcoded response about clinic hours. This ensures the system always responds, even if the AI component fails.

I chose to use Meta AI only for general inquiries because this is the safest use case. Medical information, appointment scheduling, and test results all use deterministic logic to ensure reliability and safety.

## Key Features

**Patient Chat Interface**: A WhatsApp-like web interface that works on mobile devices. Patients can type messages naturally, and the system responds in real-time. The interface is simple and familiar, reducing barriers to adoption.

**Appointment Booking**: Patients can book appointments through natural conversation. The system extracts details like name, phone number, preferred date and time, and reason for visit. It maintains context across multiple messages, so patients don't have to repeat information.

**Test Result Status Checks**: Patients can check if their test results are ready without revealing any medical information. The system only confirms status, never interprets or shares results.

**Feedback Collection**: Patients can leave feedback after visits. The system automatically classifies sentiment (positive, negative, or neutral) and flags urgent complaints for immediate admin review.

**Conversation Logging**: All conversations are stored with timestamps and patient associations. This allows clinic administrators to review interactions and provides context for future conversations.

**Patient Identification**: The system automatically identifies patients by phone number when mentioned in conversations, allowing it to provide personalized responses and maintain patient history.

## Admin Dashboard

I built a simple admin dashboard that gives clinic administrators visibility into daily operations without overwhelming them with complex analytics.

The dashboard shows five key metrics:

- **Total Conversations Today**: How many chat interactions occurred today
- **Appointments Booked Today**: How many appointments were confirmed for today
- **Returning Patients Count**: How many patients with multiple appointments are scheduled today
- **Complaints Flagged**: How many urgent feedback items need attention
- **Peak Inquiry Time**: The hour with the highest conversation volume

These metrics update in real-time as patients interact with the system. I kept the dashboard simple with card-based layout because I wanted administrators to quickly understand what's happening without needing to interpret complex charts or graphs.

This gives clinics basic insights into patient interaction patterns, which can inform staffing decisions and operational improvements.

## Design Constraints and Trade-offs

I made several intentional trade-offs in this hackathon implementation:

**In-Memory Database**: I used an in-memory database instead of persistent storage (like SQLite or PostgreSQL) because it's simpler to set up and doesn't require file system management. The trade-off is that data is lost when the server restarts, but for a hackathon demo, this is acceptable. The database interface is abstracted, so switching to persistent storage would require minimal code changes.

**Local AI Only**: I chose local Ollama deployment over cloud AI APIs because it gives me control and doesn't require API keys or costs. The trade-off is that the system requires Ollama to be running locally, which limits deployment options. For production, this would need to be replaced with a cloud solution or containerized deployment.

**Deterministic Logic for Safety**: I used rule-based extraction for appointments and test results instead of AI because these operations are safety-critical. The trade-off is that the system is less flexible—it can't handle unusual appointment request formats as well as an AI might. But I prioritized reliability over flexibility for these operations.

**No Authentication**: I didn't implement user authentication for the hackathon version. The trade-off is that anyone can access the system, but for a demo, this simplifies setup and testing. Production deployment would require authentication.

**Web Interface Over WhatsApp**: I chose a web interface instead of WhatsApp Business API integration. The trade-off is that patients need to visit a website instead of using a familiar messaging app, but the web interface is simpler to deploy, doesn't require API approvals, and works on any device.

**Single LLM Integration**: I only used AI for general inquiries, not for other agents. The trade-off is that appointment booking and feedback collection feel less conversational, but they're more reliable and predictable.

These trade-offs reflect my priorities: safety and reliability over advanced features, simplicity over complexity, and functionality over polish.

## Results and What This Demonstrates

This project demonstrates several important concepts:

**Hybrid AI Approach Works**: By combining LLM-powered conversation for general inquiries with deterministic logic for critical operations, I've shown that AI can enhance healthcare operations without compromising safety. The system feels natural for questions but remains reliable for appointments and test results.

**Specialized Agents Are Effective**: Instead of one general chatbot, specialized agents with clear responsibilities make the system more maintainable and reliable. Each agent can be improved independently without affecting others.

**Safety Through Constraints**: By explicitly limiting AI usage and using deterministic logic for safety-critical operations, I've created a system that's both helpful and safe. The explicit system prompts and fallback behaviors ensure the system never provides medical advice or fails silently.

**Simple Solutions Can Be Effective**: The system uses straightforward technologies (Next.js, in-memory database, local Ollama) rather than complex infrastructure. This proves that useful AI applications don't always require expensive cloud services or complex architectures.

**Web Interfaces Are Viable**: By choosing a web interface over WhatsApp API, I've shown that simple web deployment can work for patient communication, especially for small clinics that can't easily manage API integrations.

The implementation proves the concept: specialized AI agents can handle routine clinic communication effectively while maintaining clear safety boundaries.

## Limitations

I'm aware of several limitations in this hackathon implementation:

**Data Persistence**: The in-memory database loses all data when the server restarts. This is fine for a demo but unacceptable for production use. A real deployment would need SQLite, PostgreSQL, or another persistent storage solution.

**Local AI Dependency**: The system requires Ollama to be running locally, which limits deployment options. For cloud deployment, this would need to be replaced with a cloud AI service or containerized Ollama deployment.

**Limited Appointment Validation**: The system doesn't check actual calendar availability—it accepts any date and time. A real system would need to integrate with a calendar system to prevent double bookings.

**Basic Sentiment Analysis**: The feedback agent uses simple keyword matching for sentiment classification, which may miss nuanced feedback. More sophisticated NLP would improve accuracy.

**No Multi-language Support**: The system only supports English, which limits its usefulness in Nigeria's multilingual context. Support for Yoruba, Igbo, and Hausa would be valuable.

**No Conversation History UI**: Patients can't view their past conversations, though the data is stored. This would improve user experience.

**No Authentication or Security**: The system has no user authentication, rate limiting, or security measures. This is acceptable for a hackathon demo but would need to be addressed for production.

**Limited Error Recovery**: If Ollama fails, the system falls back to hardcoded responses, but there's no retry mechanism or detailed error logging.

I've prioritized functionality and clarity over production-ready features, which is appropriate for a hackathon but means several improvements would be needed for real-world deployment.

## What I Would Improve Next

If I were to continue developing this project, here's what I would prioritize:

**Immediate Improvements**:
- Replace in-memory database with SQLite for data persistence
- Add appointment calendar integration to check real availability
- Implement conversation history view for patients
- Add basic authentication and session management
- Improve sentiment analysis with more sophisticated NLP techniques

**Short-term Enhancements**:
- Support for multiple clinic locations
- Integration with existing clinic management systems
- Multi-language support (Yoruba, Igbo, Hausa)
- Patient portal for accessing test results and appointment history
- SMS notifications for appointment reminders

**Long-term Vision**:
- Integration with electronic health records (EHR) systems
- Predictive analytics for appointment no-shows
- Automated follow-up campaigns based on patient history
- Voice interface support for accessibility
- Mobile app development for better patient experience

I would also consider expanding AI usage to other agents (like appointment scheduling) once I've validated the safety and reliability of such an approach through extensive testing.

The modular architecture I've built makes these improvements feasible—each component can be enhanced independently without requiring a complete system rewrite.

## How to Run the Project

### Prerequisites
- Node.js 18+ installed
- Ollama installed and running locally
- LLaMA 3.2 1B model downloaded in Ollama

### Setup Steps

1. **Install Ollama and Download Model**
   ```bash
   # Download Ollama from https://ollama.ai
   # Then download the model:
   ollama pull llama3.2:1b
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Seed Database (Optional)**
   ```bash
   npx tsx scripts/seed.ts
   ```
   This creates sample patients, appointments, and conversations for testing.

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Access the Application**
   - Patient Chat Interface: http://localhost:3000
   - Admin Dashboard: http://localhost:3000/admin

### Testing the System

Try these sample interactions in the chat interface:

- **Inquiry**: "What are your operating hours?"
- **Appointment**: "I want to book an appointment. My name is John Doe, phone 08012345678, tomorrow at 10am"
- **Test Results**: "Is my test result ready?"
- **Feedback**: "The service was excellent, thank you!"

### Troubleshooting

- **Ollama Connection Error**: Ensure Ollama is running (`ollama serve` or start Ollama application)
- **Model Not Found**: Run `ollama pull llama3.2:1b` to download the model
- **Port Already in Use**: Change the port in `package.json` scripts or kill the process using port 3000
- **Database Issues**: Restart the server to reset in-memory database, or re-run seed script

## Final Thoughts

I built ClinicDesk AI because I believe AI can help small clinics operate more efficiently, but only if it's done carefully. Healthcare is sensitive, and I didn't want to create something that could accidentally cause harm.

By limiting AI to general inquiries and using deterministic logic for critical operations, I've created a system that's both helpful and safe. The modular agent architecture means each component can be improved independently, and the clear separation between AI-powered conversation and rule-based operations provides a foundation for safe deployment.

This is a hackathon project, so I prioritized functionality and clarity over production-ready features. But I've designed it with a path forward: the in-memory database can be replaced with persistent storage, the local AI can be moved to cloud deployment, and additional features can be added incrementally.

I hope this project demonstrates that thoughtful AI application in healthcare-adjacent contexts is possible, and that specialized agents with clear boundaries can provide value while maintaining safety. For small clinics in Nigeria, systems like this could make a real difference in operational efficiency and patient experience.
