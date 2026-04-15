"""
Avatar AI Assistant — conversational endpoint for the avatar UI.
Supports text chat + returns avatar script for HeyGen/D-ID.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db, Incident
from gemini_client import chat_with_assistant
from memory import find_similar

router = APIRouter()

class ChatMessage(BaseModel):
    message: str
    incident_id: str | None = None
    conversation_history: list[dict] = []

@router.post("/chat")
def chat(payload: ChatMessage, db: Session = Depends(get_db)):
    """Send a message to Aegis avatar assistant."""
    incident_context = ""

    if payload.incident_id:
        inc = db.query(Incident).filter(Incident.id == payload.incident_id).first()
        if inc:
            incident_context = f"Incident: {inc.title}. Status: {inc.status}. Root cause: {inc.root_cause}"

    # Search incident memory
    similar = find_similar(payload.message, n_results=2)
    if similar:
        incident_context += f"\nRelated past incidents: " + "; ".join(
            [f"{s['title']} (fixed by: {s['resolution']})" for s in similar]
        )

    # Search Google Drive docs
    drive_context = ""
    try:
        from drive_sync import search_drive
        drive_results = search_drive(payload.message, n_results=3)
        if drive_results:
            drive_context = "\n\nRelevant documents from Google Drive:\n"
            for r in drive_results:
                drive_context += f"[{r['file_name']} — {r['score']:.0%} match]\n{r['text'][:400]}\n\n"
    except Exception:
        pass  # Drive not configured yet, skip silently

    full_context = incident_context + drive_context

    response = chat_with_assistant(
        payload.message,
        full_context,
        payload.conversation_history
    )

    return {
        "response": response,
        "avatar_script": response,
        "similar_incidents": similar,
        "drive_results": len(drive_results) if 'drive_results' in dir() else 0,
    }
