from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_env: str = "development"
    database_url: str = "sqlite:///./resume_screener.db"
    cors_origins: str = "http://localhost:5173"
    llm_primary: str = "gemini"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    ocr_space_api_key: str = ""
    ocr_local_enabled: bool = False
    max_upload_mb: int = 10
    max_input_chars: int = 50000
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
