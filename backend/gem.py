from google import genai
from app.config import settings

client = genai.Client(api_key=settings.gemini_api_key)

try:
    response = client.models.generate_content(
        model=settings.gemini_model,
        contents="Reply with only the word SUCCESS"
    )
    print(response.text)

except Exception as e:
    print("Error type:", type(e).__name__)
    print("Actual error:", str(e))