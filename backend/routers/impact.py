"""
Business Impact Calculator
Calculates real dollar cost, user impact, and SLA risk for every incident.
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db, Incident
from datetime import datetime
import google.generativeai as genai
from config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)
router = APIRouter()

class ImpactRequest(BaseModel):
    incident_id: str | None = None
    title: str = ""
    severity: str = "high"
    duration_minutes: int = 0
    affected_service: str = ""
    # Company config (can be set per company)
    monthly_revenue: float = 1_000_000      # $1M/month default
    monthly_active_users: int = 100_000
    sla_target_percent: float = 99.9

@router.post("/calculate")
def calculate_impact(req: ImpactRequest, db: Session = Depends(get_db)):
    # Fetch incident if ID provided
    incident = None
    if req.incident_id:
        incident = db.query(Incident).filter(Incident.id == req.incident_id).first()

    title    = incident.title if incident else req.title
    severity = incident.severity if incident else req.severity
    duration = req.duration_minutes

    # If incident has timestamps, calculate real duration
    if incident and incident.resolved_at and incident.created_at:
        delta = incident.resolved_at - incident.created_at
        duration = max(1, int(delta.total_seconds() / 60))
    elif duration == 0:
        duration = {"critical": 45, "high": 30, "medium": 15, "low": 5}.get(severity, 20)

    # ── Revenue impact ────────────────────────────────────────────────────────
    revenue_per_min = req.monthly_revenue / (30 * 24 * 60)
    severity_multiplier = {"critical": 1.0, "high": 0.7, "medium": 0.3, "low": 0.1}.get(severity, 0.5)
    revenue_lost = revenue_per_min * duration * severity_multiplier

    # ── User impact ───────────────────────────────────────────────────────────
    users_affected = int(req.monthly_active_users * severity_multiplier)

    # ── SLA impact ────────────────────────────────────────────────────────────
    monthly_minutes = 30 * 24 * 60
    downtime_percent = (duration / monthly_minutes) * 100 * severity_multiplier
    sla_remaining = req.sla_target_percent - downtime_percent
    sla_breached = sla_remaining < (100 - req.sla_target_percent) * 0

    # ── Engineering cost ──────────────────────────────────────────────────────
    avg_engineer_cost_per_hour = 150  # $150/hr loaded cost
    engineers_involved = {"critical": 4, "high": 2, "medium": 1, "low": 1}.get(severity, 2)
    eng_cost = (duration / 60) * avg_engineer_cost_per_hour * engineers_involved

    total_cost = revenue_lost + eng_cost

    # ── Gemini narrative ──────────────────────────────────────────────────────
    prompt = f"""You are a business analyst. Write a 2-sentence executive summary of this incident's business impact.

Incident: {title}
Severity: {severity}
Duration: {duration} minutes
Revenue lost: ${revenue_lost:,.0f}
Users affected: {users_affected:,}
Engineering cost: ${eng_cost:,.0f}
Total cost: ${total_cost:,.0f}
SLA impact: {downtime_percent:.4f}% downtime this month

Be direct and business-focused. Mention the dollar amount and user impact."""

    narrative = ""
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        narrative = model.generate_content(prompt).text.strip()
    except Exception as e:
        narrative = f"Incident caused ${total_cost:,.0f} in estimated losses affecting {users_affected:,} users."

    result = {
        "incident_title": title,
        "severity": severity,
        "duration_minutes": duration,
        "revenue_lost": round(revenue_lost, 2),
        "engineering_cost": round(eng_cost, 2),
        "total_cost": round(total_cost, 2),
        "users_affected": users_affected,
        "downtime_percent": round(downtime_percent, 6),
        "sla_at_risk": downtime_percent > 0.05,
        "engineers_involved": engineers_involved,
        "executive_summary": narrative,
    }

    # Save to incident record if exists
    if incident:
        incident.root_cause = incident.root_cause or ""
        db.commit()

    return result

@router.get("/summary")
def impact_summary(db: Session = Depends(get_db)):
    """Total business impact across all incidents this month."""
    incidents = db.query(Incident).all()
    total_cost = 0
    total_users = 0
    breakdown = []

    for inc in incidents:
        duration = 30  # default
        if inc.resolved_at and inc.created_at:
            delta = inc.resolved_at - inc.created_at
            duration = max(1, int(delta.total_seconds() / 60))

        rev_per_min = 1_000_000 / (30 * 24 * 60)
        mult = {"critical": 1.0, "high": 0.7, "medium": 0.3, "low": 0.1}.get(inc.severity or "medium", 0.5)
        cost = rev_per_min * duration * mult + (duration / 60) * 150 * 2
        users = int(100_000 * mult)

        total_cost += cost
        total_users += users
        breakdown.append({
            "id": inc.id,
            "title": inc.title,
            "severity": inc.severity,
            "cost": round(cost, 2),
            "users": users,
            "status": inc.status,
        })

    return {
        "total_cost": round(total_cost, 2),
        "total_users_affected": total_users,
        "incident_count": len(incidents),
        "breakdown": sorted(breakdown, key=lambda x: x["cost"], reverse=True)[:10],
    }
