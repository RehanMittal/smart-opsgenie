"""
Opsgenie → Aegis webhook adapter.
Point your Opsgenie webhook integration to: POST /api/alerts/ingest
This adapter normalizes the Opsgenie payload format.
"""
from fastapi import APIRouter, Request
import httpx

router = APIRouter()
AEGIS_URL = "http://localhost:8000/api/alerts/ingest"

@router.post("/opsgenie")
async def opsgenie_webhook(request: Request):
    body = await request.json()
    alert = body.get("alert", {})

    normalized = {
        "title": alert.get("message", "Opsgenie Alert"),
        "description": alert.get("description", ""),
        "severity": _map_priority(alert.get("priority", "P3")),
        "source": "opsgenie",
    }

    async with httpx.AsyncClient() as client:
        res = await client.post(AEGIS_URL, json=normalized)
    return res.json()

def _map_priority(p: str) -> str:
    return {"P1": "critical", "P2": "high", "P3": "medium", "P4": "low"}.get(p, "medium")
