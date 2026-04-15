"""
New Gemini-powered features:
1. /api/gemini/analyze-doc   — upload any doc, Gemini reads it natively
2. /api/gemini/deep-analysis — Gemini 2.5 thinking mode for complex incidents
3. /api/gemini/search-web    — Gemini grounding with Google Search
4. /api/gemini/runbook       — auto-generate runbook from incident history
"""
from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel
import google.generativeai as genai
import io
from config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)
router = APIRouter()

# ── 1. Document Analysis (Gemini Files API) ──────────────────────────────────
@router.post("/analyze-doc")
async def analyze_doc(file: UploadFile = File(...)):
    """Upload any file (PDF, doc, image) and ask Gemini to analyze it."""
    content = await file.read()
    buf = io.BytesIO(content)
    buf.name = file.filename

    try:
        uploaded = genai.upload_file(buf, mime_type=file.content_type, display_name=file.filename)
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content([
            uploaded,
            """You are Aegis, an AI SRE. Analyze this document and extract:
1. Key incidents or alerts mentioned
2. Root causes identified
3. Resolutions or action items
4. Any patterns or recurring issues
Be concise and structured."""
        ])
        return {"filename": file.filename, "analysis": response.text, "gemini_file_uri": uploaded.uri}
    except Exception as e:
        return {"error": str(e)}

# ── 2. Deep Incident Analysis (Gemini 2.5 Thinking) ──────────────────────────
class DeepAnalysisRequest(BaseModel):
    incident_title: str
    incident_description: str
    past_incidents: list[dict] = []
    system_context: str = ""

@router.post("/deep-analysis")
def deep_analysis(req: DeepAnalysisRequest):
    """Use Gemini 2.5 Flash thinking mode for complex root cause analysis."""
    past = ""
    if req.past_incidents:
        past = "\n\nPast similar incidents:\n" + "\n".join(
            [f"- {p.get('title')}: {p.get('resolution', 'unresolved')}" for p in req.past_incidents[:5]]
        )

    prompt = f"""You are an expert SRE performing deep root cause analysis.

Incident: {req.incident_title}
Description: {req.incident_description}
{f'System context: {req.system_context}' if req.system_context else ''}
{past}

Perform a thorough analysis:
1. Most likely root cause (with confidence %)
2. Contributing factors
3. Step-by-step remediation plan
4. Prevention measures for the future
5. Estimated time to resolve

Think through this carefully before answering."""

    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        return {"analysis": response.text, "model": "gemini-2.5-flash"}
    except Exception as e:
        return {"error": str(e)}

# ── 3. Web-Grounded Search ────────────────────────────────────────────────────
class SearchRequest(BaseModel):
    query: str

@router.post("/search-web")
def search_web(req: SearchRequest):
    """Ask Gemini a question grounded with real-time Google Search."""
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        # Grounding with Google Search
        response = model.generate_content(
            f"As an SRE expert, answer this question with current information: {req.query}",
            tools=[{"google_search": {}}] if hasattr(genai, 'protos') else None
        )
        return {"answer": response.text, "query": req.query}
    except Exception as e:
        # Fallback without grounding
        try:
            model = genai.GenerativeModel("gemini-2.5-flash")
            response = model.generate_content(
                f"As an SRE expert, answer: {req.query}"
            )
            return {"answer": response.text, "query": req.query, "note": "Search grounding unavailable"}
        except Exception as e2:
            return {"error": str(e2)}

# ── 4. Auto Runbook Generator ─────────────────────────────────────────────────
class RunbookRequest(BaseModel):
    incident_type: str
    affected_service: str
    symptoms: list[str] = []
    past_resolutions: list[str] = []

@router.post("/runbook")
def generate_runbook(req: RunbookRequest):
    """Auto-generate a runbook for a given incident type using Gemini."""
    symptoms_text = "\n".join([f"- {s}" for s in req.symptoms]) if req.symptoms else "Not specified"
    resolutions_text = "\n".join([f"- {r}" for r in req.past_resolutions]) if req.past_resolutions else "None available"

    prompt = f"""Generate a detailed operational runbook for:

Incident Type: {req.incident_type}
Affected Service: {req.affected_service}
Symptoms:
{symptoms_text}

Past successful resolutions:
{resolutions_text}

Create a runbook with:
## Overview
## Detection Criteria
## Immediate Response (first 5 minutes)
## Investigation Steps
## Resolution Steps
## Escalation Path
## Prevention

Format as a clear, actionable runbook an on-call engineer can follow."""

    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        return {
            "runbook": response.text,
            "incident_type": req.incident_type,
            "service": req.affected_service
        }
    except Exception as e:
        return {"error": str(e)}
