from sqlalchemy import create_engine, Column, String, DateTime, Text, Boolean, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import uuid
from config import settings

engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Incident(Base):
    __tablename__ = "incidents"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    description = Column(Text)
    source = Column(String)
    severity = Column(String)
    status = Column(String, default="open")
    root_cause = Column(Text)
    resolution = Column(Text)
    auto_healed = Column(Boolean, default=False)
    similar_incident_id = Column(String, nullable=True)
    team = Column(String, nullable=True)          # which team owns this
    service = Column(String, nullable=True)        # affected service
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
