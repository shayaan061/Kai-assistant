# Kai – An Intelligent AI Assistant 🤖

Kai is a full-stack, voice-enabled intelligent AI assistant designed to automate daily tasks such as chatting, scheduling meetings, managing calendars, accessing contacts, and making AI-powered phone calls.  
The system combines conversational AI, real-time voice interaction, and cloud integrations into a single unified platform.

---

## 📌 Project Overview

**Project Title:** Kai – An Intelligent AI Assistant  
**Developer:** Muhammad Shayaan Ali  
**University:** Sharda University  
**Course:** B.Tech – Computer Science  
**Academic Year:** 2025–2026  

Kai acts as a personal AI assistant that understands natural language commands and performs real-world actions such as:
- Scheduling meetings
- Viewing Google Calendar events
- Fetching Google Contacts
- Initiating phone calls using AI voice agents
- Conversational chat using large language models

---

## 🚀 Key Features

- 🔐 Google OAuth Authentication  
- 💬 AI Chat Interface (Gemini)  
- 📅 Google Calendar Integration  
  - Create events  
  - List upcoming events  
  - Delete events  
- 📇 Google Contacts Access  
- 📞 AI-Powered Calling System  
  - Twilio for phone connectivity  
  - ElevenLabs Agent for real-time voice conversation  
- 🧠 Natural Language Understanding  
- 🗂 Conversation History  
- 🌐 Cloudflare Tunnel for secure webhooks  

---

## 🧠 System Architecture
Frontend (Next.js)
|
| REST API
↓
Backend (Django + DRF)
|
| AI / External Services
↓

| Gemini AI        | ElevenLabs Voice Agent     |
| Google Calendar  | Google Contacts            |
| Twilio Calling   | PostgreSQL Database        |

---

## 🛠️ Tech Stack

### Frontend
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- NextAuth (Google OAuth)

### Backend
- Django
- Django REST Framework
- PostgreSQL

### AI & Integrations
- Google Gemini API
- ElevenLabs Conversational AI
- Twilio (Calling)
- Google Calendar API
- Google People API

### Infrastructure
- Cloudflare Tunnel
- REST APIs
- Webhooks

---

## 📂 Project Structure
frontend/aiden-frontend/
│── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── calendar/
│   │   │   ├── contacts/
│   │   ├── components/
│   │   │   ├── ChatBox.tsx
│   │   │   ├── Message.tsx
│   │   │   ├── Sidebar.tsx
│   ├── lib/
│   ├── hooks/
│   ├── types/
│
backend/
│── core/
│   ├── views.py
│   ├── models.py
│   ├── urls.py
│── kai_backend/
│   ├── settings.py
│   ├── urls.py
│── manage.py
---

## ⚙️ Environment Variables

### Frontend (`.env.local`)

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000

GEMINI_API_KEY=your_gemini_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
ELEVENLABS_API_KEY=your_elevenlabs_key
ELEVEN_AGENT_ID=your_agent_id

cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
