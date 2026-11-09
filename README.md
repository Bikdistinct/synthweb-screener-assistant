# Resume Screener Assistant

An internal HR tool that compares a job description with a candidate resume and returns a validated, structured match report.

## Stack
- Frontend: React, Vite, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic v2, SQLAlchemy
- AI: Gemini (primary) / Groq (fallback), provider abstraction
- Storage: SQLite by default; PostgreSQL/Supabase through `DATABASE_URL`
- PDF: PyMuPDF text extraction; OCR fallback via OCR.space (free tier API key) or local Tesseract

## Architecture
1. React submits JD and resume text or a PDF to `POST /api/v1/analyses`.
2. FastAPI validates size/content and extracts PDF text. If extraction is too short, OCR fallback is attempted.
3. `AnalysisService` sends the untrusted JD/resume as delimited data to the configured LLM provider. It asks for JSON only.
4. Pydantic validates and bounds the result (score 0–100, exactly 5 matching skills, 3 gaps, 3 questions).
5. The analysis is persisted using SQLAlchemy and returned to the UI.
6. History endpoint supports candidate-name search and score range filtering.

## Run locally

### Backend
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Set GEMINI_API_KEY or GROQ_API_KEY
uvicorn app.main:app --reload
```
API docs: http://localhost:8000/docs

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Open http://localhost:5173.

## Configuration
See `backend/.env.example`. Set `LLM_PRIMARY=gemini` or `groq`; set both keys to enable fallback. `DATABASE_URL` can point to Supabase PostgreSQL, e.g. `postgresql+psycopg://...`. Use a pooled/direct connection string suitable for your deployment. Never expose database or LLM credentials to Vite.

OCR:
- Optional OCR.space fallback: set `OCR_SPACE_API_KEY`. It sends the PDF to OCR.space only when text extraction is insufficient. Review its terms/data handling before using candidate data.
- Optional local OCR: install Tesseract and set `OCR_LOCAL_ENABLED=true`. This avoids sending scanned candidate PDFs to a third party.
- If neither OCR option is configured, scanned PDFs return a clear extraction error.

## Production checklist
This repository is a strong deployable starting point, not a substitute for environment-specific security review. Before real candidate data:
- Put the API behind HTTPS and an authenticated HR identity provider; restrict access by role.
- Set `CORS_ORIGINS` to the exact deployed frontend origin.
- Add managed secrets, backups, database migrations (Alembic), retention/deletion policy, audit logging, and monitoring.
- Consider private networking and Supabase RLS if using Supabase.
- Do not use the score as an automated hiring decision. Keep human review, explainability, bias testing, and job-related criteria.
- Confirm LLM/OCR vendor retention and data-processing terms; use enterprise/no-training settings where available.
- Configure request rate limits at the reverse proxy/API gateway. The included in-process limiter is only a basic development safeguard.

## Tests
```bash
cd backend
pytest
```

## API
- `GET /health`
- `POST /api/v1/analyses` (multipart form: `job_description`, optional `resume_text`, optional `resume_file`)
- `GET /api/v1/analyses?query=alex&min_score=50&max_score=90&limit=50&offset=0`
- `GET /api/v1/analyses/{analysis_id}`
- `DELETE /api/v1/analyses/{analysis_id}`

## Assumptions
- One resume is assessed against one JD per analysis.
- Candidate name is extracted from the resume by the LLM when possible; otherwise shown as “Unknown candidate”.
- Documents are not persisted. Only the analysis report is stored.
- Score is an evidence-based relevance estimate, not a probability of job success.
