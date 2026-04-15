from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db, Incident
from memory import store_incident
from datetime import datetime

router = APIRouter()

class ResolvePayload(BaseModel):
    resolution: str

@router.get("/")
def list_incidents(db: Session = Depends(get_db)):
    return db.query(Incident).order_by(Incident.created_at.desc()).all()

@router.get("/{incident_id}")
def get_incident(incident_id: str, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc

@router.post("/{incident_id}/resolve")
def resolve_incident(incident_id: str, payload: ResolvePayload, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    inc.status = "resolved"
    inc.resolution = payload.resolution
    inc.resolved_at = datetime.utcnow()
    db.commit()

    # Store in vector memory so AI learns from this
    store_incident(inc.id, inc.title, inc.description or "", payload.resolution)

    return {"message": "Incident resolved and stored in memory", "incident_id": incident_id}

@router.get("/stats/summary")
def get_stats(db: Session = Depends(get_db)):
    total = db.query(Incident).count()
    auto_healed = db.query(Incident).filter(Incident.auto_healed == True).count()
    open_count = db.query(Incident).filter(Incident.status == "open").count()
    return {
        "total_incidents": total,
        "auto_healed": auto_healed,
        "open": open_count,
        "resolved": total - open_count,
    }
