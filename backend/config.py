from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GEMINI_API_KEY: str
    ELEVENLABS_API_KEY: str = ""
    HEYGEN_API_KEY: str = ""
    DID_API_KEY: str = ""
    OPSGENIE_API_KEY: str = ""
    PAGERDUTY_API_KEY: str = ""
    DATABASE_URL: str = "sqlite:///./aegis.db"
    CHROMA_PERSIST_DIR: str = "./chroma_db"

    class Config:
        env_file = ".env"

settings = Settings()
