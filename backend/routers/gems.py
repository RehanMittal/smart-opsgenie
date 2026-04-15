"""
Aegis Gems — custom AI personas with saved system prompts.
Replicates Google Gemini Gems concept via the API.
Each Gem = name + system_prompt + model + tools config
"""
from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import uuid
import google.generativeai as genai
from config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)
router = APIRouter()

# ── Gems DB ───────────────────────────────────────────────────────────────────
engine = create_engine("sqlite:///./aegis.db", connect_args={"check_same_thread": False})
Base = declarative_base()

class Gem(Base):
    __tablename__ = "gems"
    id            = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name          = Column(String, nullable=False)
    description   = Column(String)
    system_prompt = Column(Text, nullable=False)
    model         = Column(String, default="gemini-2.5-flash")
    icon          = Column(String, default="💎")
    gem_url       = Column(String, nullable=True)  # published Gemini Gem URL
    created_at    = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

# Run migration for gem_url column if it doesn't exist
with engine.connect() as conn:
    try:
        conn.execute(__import__('sqlalchemy').text("ALTER TABLE gems ADD COLUMN gem_url VARCHAR"))
        conn.commit()
    except Exception:
        pass  # column already exists
Session = sessionmaker(bind=engine)

# ── Default Gems (pre-loaded) ─────────────────────────────────────────────────
DEFAULT_GEMS = [
    {
        "name": "SRE Expert",
        "description": "Deep incident analysis and root cause detection",
        "icon": "🔥",
        "system_prompt": """You are an expert Site Reliability Engineer with 15 years of experience.
You specialize in incident response, root cause analysis, and system reliability.
When analyzing incidents, always provide: root cause, impact assessment, immediate fix, and long-term prevention.
Be direct, technical, and actionable. Use bullet points for clarity."""
    },
    {
        "name": "Runbook Writer",
        "description": "Auto-generates operational runbooks",
        "icon": "📋",
        "system_prompt": """You are a technical writer specializing in operational runbooks for DevOps teams.
Create clear, step-by-step runbooks that on-call engineers can follow under pressure.
Always include: detection criteria, immediate response, investigation steps, resolution, escalation path, and prevention.
Format with clear headers and numbered steps."""
    },
    {
        "name": "Alert Triage",
        "description": "Quickly triages and prioritizes incoming alerts",
        "icon": "🚨",
        "system_prompt": """You are an alert triage specialist. Your job is to quickly assess incoming alerts and:
1. Determine severity (P1/P2/P3/P4)
2. Identify if it's a duplicate or known issue
3. Suggest immediate action
4. Estimate business impact
Be extremely concise — on-call engineers need fast answers."""
    },
    {
        "name": "Post-Mortem Writer",
        "description": "Writes blameless post-mortems from incident data",
        "icon": "📝",
        "system_prompt": """You write blameless post-mortems following Google SRE best practices.
Structure: Summary → Impact → Timeline → Root Cause → Contributing Factors → Action Items.
Focus on systemic issues, not individual blame. Be factual and constructive.
Action items must be specific, assignable, and time-bound."""
    },
    {
        "name": "Cost Optimizer",
        "description": "Analyzes infrastructure for cost savings",
        "icon": "💰",
        "system_prompt": """You are a cloud cost optimization expert.
Analyze infrastructure descriptions and identify: over-provisioned resources, unused services, 
cheaper alternatives, and reserved instance opportunities.
Always quantify potential savings where possible."""
    },
]

def seed_default_gems():
    db = Session()
    if db.query(Gem).count() == 0:
        for g in DEFAULT_GEMS:
            db.add(Gem(**g))
        db.commit()
    db.close()

seed_default_gems()

# ── API ───────────────────────────────────────────────────────────────────────
class GemCreate(BaseModel):
    name: str
    description: str = ""
    system_prompt: str
    model: str = "gemini-2.5-flash"
    icon: str = "💎"
    gem_url: str = ""

class ChatWithGem(BaseModel):
    message: str
    conversation_history: list[dict] = []

@router.get("/")
def list_gems():
    db = Session()
    gems = db.query(Gem).order_by(Gem.created_at).all()
    db.close()
    return [{"id": g.id, "name": g.name, "description": g.description,
             "icon": g.icon, "model": g.model, "system_prompt": g.system_prompt,
             "gem_url": g.gem_url or "",
             "created_at": g.created_at} for g in gems]

@router.post("/")
def create_gem(data: GemCreate):
    db = Session()
    gem = Gem(**data.model_dump())
    db.add(gem)
    db.commit()
    db.refresh(gem)
    db.close()
    return {"id": gem.id, "name": gem.name, "message": "Gem created"}

@router.delete("/{gem_id}")
def delete_gem(gem_id: str):
    db = Session()
    gem = db.query(Gem).filter(Gem.id == gem_id).first()
    if gem:
        db.delete(gem)
        db.commit()
    db.close()
    return {"message": "Deleted"}

@router.post("/{gem_id}/chat")
def chat_with_gem(gem_id: str, payload: ChatWithGem):
    db = Session()
    gem = db.query(Gem).filter(Gem.id == gem_id).first()
    db.close()
    if not gem:
        return {"error": "Gem not found"}

    history = ""
    for msg in payload.conversation_history[-6:]:
        history += f"{msg['role'].upper()}: {msg['content']}\n"

    prompt = f"""{gem.system_prompt}

{f'Conversation so far:{chr(10)}{history}' if history else ''}
User: {payload.message}"""

    try:
        model = genai.GenerativeModel(gem.model)
        response = model.generate_content(prompt)
        return {
            "response": response.text.strip(),
            "gem_name": gem.name,
            "gem_icon": gem.icon,
        }
    except Exception as e:
        return {"error": str(e)}
