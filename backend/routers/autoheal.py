from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, Incident
import auto_heal_engine

router = APIRouter()

@router.get("/history")
def heal_history(db: Session = Depends(get_db)):
    return db.query(Incident).filter(Incident.auto_healed == True).all()

@router.post("/{incident_id}/trigger")
async def manual_trigger(incident_id: str, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        return {"error": "Incident not found"}
    result = await auto_heal_engine.execute(incident_id, inc.root_cause or "", db)
    return result
