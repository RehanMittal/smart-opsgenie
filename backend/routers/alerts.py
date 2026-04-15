"""
Alert ingestion endpoint — accepts alerts from any source
(Opsgenie webhook, PagerDuty, Prometheus, or manual/mock).
"""
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from database import get_db, Incident
from memory import find_similar, store_incident
from gemini_client import analyze_alert
import auto_heal_engine

router = APIRouter()

class AlertPayload(BaseModel):
    title: str
    description: str
    severity: str = "high"
    source: str = "webhook"

@router.post("/ingest")
async def ingest_alert(payload: AlertPayload, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Main entry point for all incoming alerts."""
    # 1. Find similar past incidents
    similar = find_similar(f"{payload.title} {payload.description}")

    # 2. Analyze with Gemini
    analysis = analyze_alert(payload.title, payload.description, similar)

    # 3. Create incident record
    incident = Incident(
        title=payload.title,
        description=payload.description,
        source=payload.source,
        severity=payload.severity,
        root_cause=analysis.get("root_cause"),
        similar_incident_id=similar[0]["incident_id"] if similar else None,
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    # 4. Trigger auto-heal in background if possible
    if analysis.get("auto_heal_possible"):
        background_tasks.add_task(
            auto_heal_engine.execute,
            incident.id,
            analysis.get("auto_heal_action", ""),
            db
        )

    return {
        "incident_id": incident.id,
        "analysis": analysis,
        "similar_incidents": similar,
        "auto_heal_triggered": analysis.get("auto_heal_possible", False),
    }

@router.get("/")
def list_alerts(db: Session = Depends(get_db)):
    return db.query(Incident).order_by(Incident.created_at.desc()).limit(50).all()
