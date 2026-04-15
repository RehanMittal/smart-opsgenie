"""
Auto-Heal Engine — executes known fixes for recognized incident patterns.
Extend this with real kubectl, AWS CLI, or custom scripts.
"""
from sqlalchemy.orm import Session
from database import Incident
from datetime import datetime
import asyncio

# Map of known patterns → heal actions
HEAL_PLAYBOOK = {
    "cpu": "restart_service",
    "memory leak": "restart_service",
    "disk": "clear_logs",
    "connection pool": "restart_service",
    "timeout": "scale_up",
    "pod crash": "restart_pod",
    "oom": "restart_pod",
}

async def execute(incident_id: str, action_hint: str, db: Session) -> dict:
    """Execute auto-heal action for an incident."""
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        return {"success": False, "message": "Incident not found"}

    # Determine action from hint or title
    action = _determine_action(action_hint or inc.title or "")
    result = await _run_action(action, inc)

    if result["success"]:
        inc.auto_healed = True
        inc.status = "auto_resolved"
        inc.resolution = result["message"]
        inc.resolved_at = datetime.utcnow()
        db.commit()

    return result

def _determine_action(text: str) -> str:
    text_lower = text.lower()
    for keyword, action in HEAL_PLAYBOOK.items():
        if keyword in text_lower:
            return action
    return "log_and_notify"

async def _run_action(action: str, incident: Incident) -> dict:
    """
    In production: replace these with real commands.
    e.g., subprocess.run(["kubectl", "rollout", "restart", "deployment/myapp"])
    """
    await asyncio.sleep(1)  # simulate async execution

    actions = {
        "restart_service": f"✅ Service restarted successfully for incident: {incident.title}",
        "restart_pod":     f"✅ Pod restarted via kubectl for: {incident.title}",
        "clear_logs":      f"✅ Old logs cleared, disk space freed for: {incident.title}",
        "scale_up":        f"✅ Scaled up replicas to handle load for: {incident.title}",
        "log_and_notify":  f"⚠️ No auto-fix available. Incident logged and team notified.",
    }

    message = actions.get(action, "Unknown action")
    success = action != "log_and_notify"

    return {"success": success, "action": action, "message": message}
