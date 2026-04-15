from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import alerts, incidents, assistant, autoheal, drive, gemini_features, gems, impact, analytics
from database import init_db

app = FastAPI(title="Aegis AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(incidents.router, prefix="/api/incidents", tags=["Incidents"])
app.include_router(assistant.router, prefix="/api/assistant", tags=["Assistant"])
app.include_router(autoheal.router, prefix="/api/autoheal", tags=["Auto-Heal"])
app.include_router(drive.router, prefix="/api/drive", tags=["Google Drive"])
app.include_router(gemini_features.router, prefix="/api/gemini", tags=["Gemini Features"])
app.include_router(gems.router, prefix="/api/gems", tags=["Gems"])
app.include_router(impact.router, prefix="/api/impact", tags=["Business Impact"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])

@app.on_event("startup")
def startup():
    init_db()

@app.get("/")
def root():
    return {"status": "Aegis AI is running 🛡️"}
