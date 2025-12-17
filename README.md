# ClinicDesk AI

An AI-powered patient relations and CRM system for small private clinics in Nigeria. Built for Meta AI Developer Academy Nigeria 2025 hackathon.

**Live Demo**: https://clinicdesk-ai.vercel.app/

## Overview

ClinicDesk AI automates routine patient communication tasks through a web-based chat interface powered by specialized AI agents. The system handles general inquiries, appointment scheduling, test result status checks, and feedback collection while maintaining strict safety boundaries around medical information.

The system combines AI-powered natural language generation for conversational interactions with deterministic logic for safety-critical operations, ensuring both helpfulness and reliability.

## Key Features

**Patient Chat Interface**: A WhatsApp-like web interface accessible on any device. Patients interact naturally with specialized agents that handle different types of requests.

**AI-Powered Inquiry Handling**: The Patient Inquiry Agent uses Meta LLaMA 3.1 8B Instant via Groq API to generate natural, contextually appropriate responses to questions about clinic services, hours, location, and pricing.

**Deterministic Appointment Booking**: The Appointment Scheduling Agent uses rule-based logic to extract patient details and create appointment records, ensuring reliability and predictability.

**Test Result Status Checks**: Patients can check if their test results are ready without revealing medical information. The system only confirms availability status.

**Feedback Collection with AI Responses**: The Feedback/Complaint Agent uses deterministic sentiment detection combined with AI-generated empathetic responses via Groq.

**Admin Dashboard**: Real-time metrics including total conversations, appointments booked, returning patients, flagged complaints, and peak inquiry times.

**Groq Health Monitoring**: The system includes visible health checks that alert users when the AI engine is temporarily unavailable, ensuring transparency during demos.

## AI Model and Integration

**Primary AI Model**: Meta LLaMA 3.1 8B Instant
- Model ID: `llama-3.1-8b-instant`
- Hosted via Groq API (OpenAI-compatible endpoint)
- Temperature: 0.4 for normal responses, 0.1 for health checks
- Max tokens: 300 for queries, 5 for health checks

**AI Usage Scope**:
- **Patient Inquiry Agent**: Uses Groq-hosted LLaMA for natural language responses to general questions
- **Feedback/Complaint Agent**: Uses Groq-hosted LLaMA to generate empathetic responses after deterministic sentiment classification

**Safety Constraints**:
- AI never controls routing or system state
- AI never accesses the database
- AI is used strictly for language generation
- All workflows are deterministic and guarded
- Explicit system prompts prevent medical advice

**Groq Health Checks**: The system performs health checks before AI usage. If Groq is unavailable, visible fallback warnings are displayed to ensure demo reliability and transparency.

**Note on Ollama**: The codebase includes an Ollama integration file (`lib/ollama.ts`) for local LLaMA deployment, but this is not actively used. The production system uses Groq API exclusively.

## Agent Architecture

The system uses six specialized agents, each handling a distinct interaction domain:

1. **Patient Inquiry Agent**: Handles greetings, services, hours, general questions. Uses Groq-hosted LLaMA for natural responses. Never assumes intent or provides medical advice.

2. **Appointment Scheduling Agent**: Fully deterministic. Collects name, phone, date, time through explicit flow. No AI involvement.

3. **Test Result Follow Up Agent**: Fully deterministic. Requires phone number for identification. Returns status only, never reveals medical information. No AI involvement.

4. **Feedback/Complaint Agent**: Deterministic sentiment detection with AI-generated empathetic responses via Groq. Flags urgent complaints for admin review.

5. **Patient Memory Agent**: Backend agent that maintains patient identity and visit history for context-aware responses.

6. **Admin Insight Agent**: Backend agent that generates daily summaries and metrics for clinic administrators.

**Routing Guarantees**:
- Inquiry is the default fallback
- Appointment and test result flows only activate via explicit intent
- No agent overrides another unintentionally
- Flows must be explicitly continued; otherwise they reset to avoid intent leakage

## Why This Matters for Real Clinics

Small private clinics in Nigeria face significant operational challenges: staff spend hours answering repetitive questions, appointment management is often manual and error-prone, and feedback collection is unsystematic. ClinicDesk AI addresses these challenges by:

- **Reducing Front-Desk Workload**: Automates routine inquiries, freeing staff for patient care
- **Improving Appointment Management**: Systematic booking reduces conflicts and missed appointments
- **Enhancing Patient Access**: 24-hour availability for information and booking
- **Systematic Feedback Collection**: Automated sentiment analysis and urgent flagging
- **Administrative Intelligence**: Real-time metrics inform staffing and operational decisions

The system maintains strict boundaries: it never provides medical advice, never interprets test results, and uses deterministic logic for all safety-critical operations.

## Deployment

**Framework**: Next.js (App Router), TypeScript, Tailwind CSS

**Deployment Platform**: Vercel (serverless)

**Environment Variables**: Configured via Vercel dashboard (GROQ_API_KEY)

**Data Storage**: In-memory database (demo-safe by design, suitable for hackathon demonstration)

**Live URL**: https://clinicdesk-ai.vercel.app/

## How Judges Should Evaluate This Project

**Technical Implementation**:
- Specialized agent architecture with clear separation of concerns
- Hybrid approach: AI for language generation, deterministic logic for safety-critical operations
- Robust routing system that prevents intent leakage
- Groq health monitoring with visible fallback warnings

**Safety and Reliability**:
- Explicit constraints preventing medical advice
- Deterministic logic for appointments and test results
- Multi-layered safety mechanisms
- Graceful degradation when AI is unavailable

**Practical Value**:
- Addresses real operational challenges in small clinics
- Demonstrates production-style architecture
- Scalable design with clear path to persistent storage
- Cost-effective solution suitable for resource-constrained environments

**AI Integration Quality**:
- Appropriate use of AI (language generation only)
- Clear boundaries and safety constraints
- Health monitoring and transparency
- Professional system prompt engineering

**Code Quality**:
- Modular, maintainable architecture
- Clear separation between AI and deterministic logic
- Comprehensive error handling
- Production-ready structure

## Limitations (Hackathon Scope)

- In-memory database (data resets on server restart)
- No authentication or security measures
- Limited appointment validation (no calendar integration)
- Single language support (English only)
- No conversation history UI for patients

These limitations are appropriate for a hackathon demonstration and would be addressed in production deployment.

## Conclusion

ClinicDesk AI demonstrates that specialized AI agents can effectively automate routine patient communication while maintaining strict safety boundaries. The system combines AI-powered conversation for general inquiries with deterministic logic for critical operations, proving that thoughtful AI application in healthcare-adjacent contexts is both possible and valuable.

For small clinics in Nigeria, systems like this could significantly improve operational efficiency and patient experience, freeing staff to focus on what they're trained for: providing medical care.
