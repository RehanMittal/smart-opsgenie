"""
Admin Dashboard Analytics — team breakdown, risk areas, alert trends
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from database import get_db, Incident, engine
from datetime import datetime, timedelta
from collections import defaultdict

router = APIRouter()

# Run migrations for new columns
with engine.connect() as conn:
    for col in ["team VARCHAR", "service VARCHAR"]:
        try:
            conn.execute(text(f"ALTER TABLE incidents ADD COLUMN {col}"))
            conn.commit()
        except Exception:
            pass

TEAMS = ["Platform", "Backend", "Frontend", "Data", "Security", "Infrastructure", "DevOps"]
SERVICES = ["auth-service", "payment-api", "data-pipeline", "web-app", "db-cluster", "api-gateway", "monitoring"]

def _assign_team(incident: Incident) -> str:
    """Infer team from title/source if not set."""
    if incident.team:
        return incident.team
    title = (incident.title or "").lower()
    if any(x in title for x in ["db", "database", "postgres", "sql"]):
        return "Data"
    if any(x in title for x in ["cpu", "memory", "disk", "node", "pod", "k8s"]):
        return "Infrastructure"
    if any(x in title for x in ["api", "gateway", "timeout", "latency"]):
        return "Backend"
    if any(x in title for x in ["auth", "login", "token", "security"]):
        return "Security"
    if any(x in title for x in ["deploy", "pipeline", "ci", "build"]):
        return "DevOps"
    return "Platform"

def _assign_service(incident: Incident) -> str:
    if incident.service:
        return incident.service
    title = (incident.title or "").lower()
    if "db" in title or "postgres" in title:
        return "db-cluster"
    if "cpu" in title or "memory" in title:
        return "api-gateway"
    if "auth" in title:
        return "auth-service"
    if "payment" in title:
        return "payment-api"
    if "disk" in title:
        return "monitoring"
    return "web-app"

@router.get("/overview")
def get_overview(db: Session = Depends(get_db)):
    incidents = db.query(Incident).all()
    now = datetime.utcnow()
    last_7d = now - timedelta(days=7)
    last_30d = now - timedelta(days=30)

    total = len(incidents)
    open_count = sum(1 for i in incidents if i.status == "open")
    auto_healed = sum(1 for i in incidents if i.auto_healed)
    critical = sum(1 for i in incidents if i.severity == "critical")

    # MTTR
    resolved = [i for i in incidents if i.resolved_at and i.created_at]
    mttr_mins = 0
    if resolved:
        total_mins = sum((i.resolved_at - i.created_at).total_seconds() / 60 for i in resolved)
        mttr_mins = round(total_mins / len(resolved), 1)

    # Trend last 7 days
    recent = [i for i in incidents if i.created_at and i.created_at >= last_7d]

    return {
        "total": total,
        "open": open_count,
        "auto_healed": auto_healed,
        "critical": critical,
        "mttr_minutes": mttr_mins,
        "last_7d_count": len(recent),
        "auto_heal_rate": round(auto_healed / total * 100, 1) if total else 0,
    }

@router.get("/by-team")
def by_team(db: Session = Depends(get_db)):
    incidents = db.query(Incident).all()
    teams = defaultdict(lambda: {"total": 0, "critical": 0, "open": 0, "auto_healed": 0, "mttr": []})

    for inc in incidents:
        team = _assign_team(inc)
        teams[team]["total"] += 1
        if inc.severity == "critical":
            teams[team]["critical"] += 1
        if inc.status == "open":
            teams[team]["open"] += 1
        if inc.auto_healed:
            teams[team]["auto_healed"] += 1
        if inc.resolved_at and inc.created_at:
            mins = (inc.resolved_at - inc.created_at).total_seconds() / 60
            teams[team]["mttr"].append(mins)

    result = []
    for team, data in teams.items():
        mttr = round(sum(data["mttr"]) / len(data["mttr"]), 1) if data["mttr"] else 0
        risk = "high" if data["critical"] > 2 or data["open"] > 3 else "medium" if data["total"] > 2 else "low"
        result.append({
            "team": team,
            "total": data["total"],
            "critical": data["critical"],
            "open": data["open"],
            "auto_healed": data["auto_healed"],
            "mttr_minutes": mttr,
            "risk_level": risk,
        })

    return sorted(result, key=lambda x: x["total"], reverse=True)

@router.get("/by-severity")
def by_severity(db: Session = Depends(get_db)):
    incidents = db.query(Incident).all()
    counts = defaultdict(int)
    for inc in incidents:
        counts[inc.severity or "unknown"] += 1
    return [{"severity": k, "count": v} for k, v in counts.items()]

@router.get("/by-service")
def by_service(db: Session = Depends(get_db)):
    incidents = db.query(Incident).all()
    services = defaultdict(lambda: {"total": 0, "critical": 0, "open": 0})
    for inc in incidents:
        svc = _assign_service(inc)
        services[svc]["total"] += 1
        if inc.severity == "critical":
            services[svc]["critical"] += 1
        if inc.status == "open":
            services[svc]["open"] += 1
    result = [{"service": k, **v} for k, v in services.items()]
    return sorted(result, key=lambda x: x["total"], reverse=True)

@router.get("/trend")
def alert_trend(days: int = 14, db: Session = Depends(get_db)):
    """Daily alert count for the last N days."""
    incidents = db.query(Incident).all()
    now = datetime.utcnow()
    daily = defaultdict(lambda: {"total": 0, "critical": 0, "resolved": 0})

    for inc in incidents:
        if not inc.created_at:
            continue
        delta = (now - inc.created_at).days
        if delta > days:
            continue
        day = inc.created_at.strftime("%m/%d")
        daily[day]["total"] += 1
        if inc.severity == "critical":
            daily[day]["critical"] += 1
        if inc.status in ("resolved", "auto_resolved"):
            daily[day]["resolved"] += 1

    # Fill missing days
    result = []
    for i in range(days - 1, -1, -1):
        day = (now - timedelta(days=i)).strftime("%m/%d")
        result.append({"date": day, **daily.get(day, {"total": 0, "critical": 0, "resolved": 0})})
    return result

@router.get("/risk-areas")
def risk_areas(db: Session = Depends(get_db)):
    """Top risk areas based on incident frequency and severity."""
    incidents = db.query(Incident).all()
    areas = defaultdict(lambda: {"incidents": 0, "critical": 0, "score": 0})

    for inc in incidents:
        team = _assign_team(inc)
        svc = _assign_service(inc)
        key = f"{team} / {svc}"
        areas[key]["incidents"] += 1
        sev_score = {"critical": 4, "high": 3, "medium": 2, "low": 1}.get(inc.severity or "low", 1)
        areas[key]["score"] += sev_score
        if inc.severity == "critical":
            areas[key]["critical"] += 1

    result = [{"area": k, **v} for k, v in areas.items()]
    return sorted(result, key=lambda x: x["score"], reverse=True)[:8]
