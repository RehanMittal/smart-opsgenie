"""
PagerDuty → Aegis webhook adapter.
Point your PagerDuty webhook v3 to: POST /integrations/pagerduty
"""
from fastapi import APIRouter, Request
import httpx

router = APIRouter()
AEGIS_URL = "http://localhost:8000/api/alerts/ingest"

@router.post("/pagerduty")
async def pagerduty_webhook(request: Request):
    body = await request.json()
    for event in body.get("messages", []):
        incident = event.get("incident", {})
        normalized = {
            "title": incident.get("title", "PagerDuty Incident"),
            "description": incident.get("description", ""),
            "severity": incident.get("urgency", "high"),
            "source": "pagerduty",
        }
        async with httpx.AsyncClient() as client:
            await client.post(AEGIS_URL, json=normalized)
    return {"status": "received"}
