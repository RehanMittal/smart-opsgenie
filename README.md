# 🛡️ Aegis AI — Universal Incident Intelligence Platform

> An AI-powered platform that monitors alerts across all tools, learns from past incidents, auto-resolves known issues, and provides a human-like avatar assistant for real-time incident support.

## 🏆 Built for Google Gemini AI Hackathon

---

## 🚀 Features

- 🔗 **Universal Alert Ingestion** — Opsgenie, PagerDuty, Datadog, Prometheus, or custom webhooks
- 🧠 **Gemini AI Brain** — understands alerts, finds root causes, suggests fixes
- 🔄 **Auto-Healing Engine** — resolves known/duplicate incidents automatically
- 📚 **Incident Memory** — vector similarity search over past incidents
- 👤 **Avatar AI Assistant** — talk face-to-face with your AI SRE
- 📊 **Smart Dashboard** — alert trends, MTTR, repeat patterns

---

## 🏗️ Architecture

```
Alerts (Opsgenie/PagerDuty/Webhook)
        ↓
  Ingestion Layer (FastAPI)
        ↓
  Dedup + Correlation Engine
        ↓
  Gemini AI + Vector Memory (ChromaDB)
        ↓
  Auto-Heal Engine ←→ Past Incident DB
        ↓
  Avatar UI (React + HeyGen/D-ID)
```

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| AI Brain | Google Gemini 1.5 Pro |
| Backend | Python FastAPI |
| Memory | ChromaDB (vector similarity) |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Frontend | React + TailwindCSS |
| Avatar | HeyGen Streaming API / D-ID |
| Voice | ElevenLabs TTS + Whisper STT |
| Integrations | Opsgenie, PagerDuty, Prometheus webhooks |

---

## ⚡ Quick Start

```bash
# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env   # add your API keys
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

---

## 🎬 Demo Flow

1. Alert fires (CPU spike / DB timeout)
2. Aegis detects it's a duplicate pattern
3. Auto-heal runs (restart service / scale pod)
4. Avatar says: *"I detected a recurring CPU issue and restarted the service. Monitoring now."*
5. You ask: *"Why did this happen?"*
6. Avatar shows past 5 similar incidents + root cause

---

## 📁 Project Structure

```
aegis-ai/
├── backend/          # FastAPI + Gemini + ChromaDB
├── frontend/         # React dashboard + Avatar UI
├── integrations/     # Alert source connectors
├── auto-heal/        # Auto-fix scripts
└── data/             # Sample incidents for demo
```
