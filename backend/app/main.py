import json
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Query, Request
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from .config import settings
from .database import Base, engine, get_db
from .models import Analysis
from .schemas import MatchReport, AnalysisOut, HistoryPage
from .services.llm import analyze_with_fallback
# from .services.documents import extract_pdf, DocumentError
from .services.documents import extract_pdf, extract_docx, DocumentError

import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

Base.metadata.create_all(bind=engine)
app = FastAPI(title="Resume Screener Assistant", version="1.0.0")
origins = [x.strip() for x in settings.cors_origins.split(",") if x.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["GET","POST","DELETE"], allow_headers=["*"])

# Lightweight in-process guard. Use gateway-level rate limiting for multi-worker production.
_hits = {}
@app.middleware("http")
async def basic_rate_limit(request: Request, call_next):
    if request.url.path.startswith("/api/") and request.method == "POST":
        key = request.client.host if request.client else "unknown"
        now = datetime.utcnow().timestamp()
        recent = [t for t in _hits.get(key, []) if now - t < 60]
        if len(recent) >= 10:
            return JSONResponse(status_code=429, content={"detail": "Too many requests. Please wait a minute."})
        recent.append(now); _hits[key] = recent
    return await call_next(request)

@app.get("/health")
def health():
    return {"status": "ok"}

def serialize(row: Analysis):
    return AnalysisOut(
        id=row.id, candidate_name=row.candidate_name, match_score=row.match_score,
        provider=row.provider, created_at=row.created_at,
        report=MatchReport.model_validate(json.loads(row.report_json))
    )

# @app.post("/api/v1/analyses", response_model=AnalysisOut)
# async def create_analysis(
#     job_description: str = Form(...),
#     resume_text: str = Form(""),
#     resume_file: UploadFile | None = File(None),
#     db: Session = Depends(get_db)
# ):
#     jd = job_description.strip()
#     if len(jd) < 30:
#         raise HTTPException(422, "Please provide a job description with at least 30 characters.")
#     resume = resume_text.strip()
#     if resume_file and resume_file.filename:
#         if not resume_file.filename.lower().endswith(".pdf"):
#             raise HTTPException(415, "Only PDF resume uploads are supported.")
#         data = await resume_file.read()
#         if len(data) > settings.max_upload_mb * 1024 * 1024:
#             raise HTTPException(413, f"Resume PDF exceeds {settings.max_upload_mb} MB.")
#         if not data.startswith(b"%PDF"):
#             raise HTTPException(415, "Uploaded file does not appear to be a valid PDF.")
#         try:
#             resume = extract_pdf(data)
#         except DocumentError as exc:
#             raise HTTPException(422, str(exc))
#     if len(resume) < 30:
#         raise HTTPException(422, "Please paste resume text or upload a readable PDF.")
#     # Bound context while retaining the start/end portions where headers and recent experience often appear.
#     cap = settings.max_input_chars
#     if len(jd) > cap: jd = jd[:cap]
#     if len(resume) > cap: resume = resume[:int(cap*.8)] + "\n[Middle content truncated due to length]\n" + resume[-int(cap*.2):]
#     try:
#         report, provider = await run_in_threadpool(analyze_with_fallback, jd, resume)
#     except RuntimeError as exc:
#         raise HTTPException(503, str(exc))
#     except Exception:
#         raise HTTPException(502, "The AI provider returned an invalid response. Please retry.")
#     row = Analysis(candidate_name=report.candidate_name, match_score=report.match_score,
#                    report_json=report.model_dump_json(), provider=provider)
#     db.add(row); db.commit(); db.refresh(row)
#     return serialize(row)


@app.post("/api/v1/analyses", response_model=AnalysisOut)
async def create_analysis(
    job_description: str = Form(""),
    jd_file: UploadFile | None = File(None),
    resume_text: str = Form(""),
    resume_file: UploadFile | None = File(None),
    db: Session = Depends(get_db)
):
    jd = job_description.strip()

    if jd_file and jd_file.filename:
        filename = jd_file.filename.lower()

        if not (filename.endswith(".pdf") or filename.endswith(".docx")):
            raise HTTPException(415, "Only PDF and DOCX job description uploads are supported.")

        data = await jd_file.read()
        if len(data) > settings.max_upload_mb * 1024 * 1024:
            raise HTTPException(413, f"Job description file exceeds {settings.max_upload_mb} MB.")

        try:
            if filename.endswith(".pdf"):
                if not data.startswith(b"%PDF"):
                    raise HTTPException(415, "Uploaded job description does not appear to be a valid PDF.")
                jd = extract_pdf(data)
            else:
                jd = extract_docx(data)
        except DocumentError as exc:
            raise HTTPException(422, str(exc))

    if len(jd) < 30:
        raise HTTPException(422, "Please paste a job description or upload a readable PDF/DOCX with at least 30 characters.")

    resume = resume_text.strip()
    if resume_file and resume_file.filename:
        if not resume_file.filename.lower().endswith(".pdf"):
            raise HTTPException(415, "Only PDF resume uploads are supported.")

        data = await resume_file.read()
        if len(data) > settings.max_upload_mb * 1024 * 1024:
            raise HTTPException(413, f"Resume PDF exceeds {settings.max_upload_mb} MB.")
        if not data.startswith(b"%PDF"):
            raise HTTPException(415, "Uploaded file does not appear to be a valid PDF.")

        try:
            resume = extract_pdf(data)
        except DocumentError as exc:
            raise HTTPException(422, str(exc))

    if len(resume) < 30:
        raise HTTPException(422, "Please paste resume text or upload a readable PDF.")

    cap = settings.max_input_chars
    if len(jd) > cap:
        jd = jd[:cap]
    if len(resume) > cap:
        resume = resume[:int(cap * .8)] + "\n[Middle content truncated due to length]\n" + resume[-int(cap * .2):]

    try:
        report, provider = await run_in_threadpool(analyze_with_fallback, jd, resume)
    except RuntimeError as exc:
        raise HTTPException(503, str(exc))
    except Exception:
        raise HTTPException(502, "The AI provider returned an invalid response. Please retry.")

    row = Analysis(
        candidate_name=report.candidate_name,
        match_score=report.match_score,
        report_json=report.model_dump_json(),
        provider=provider
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return serialize(row)

@app.get("/api/v1/analyses", response_model=HistoryPage)
def list_analyses(
    query: str = Query("", max_length=200),
    min_score: int | None = Query(None, ge=0, le=100),
    max_score: int | None = Query(None, ge=0, le=100),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    if min_score is not None and max_score is not None and min_score > max_score:
        raise HTTPException(422, "min_score cannot exceed max_score.")
    stmt = select(Analysis)
    count_stmt = select(func.count()).select_from(Analysis)
    if query.strip():
        condition = Analysis.candidate_name.ilike(f"%{query.strip()}%")
        stmt = stmt.where(condition); count_stmt = count_stmt.where(condition)
    if min_score is not None:
        stmt = stmt.where(Analysis.match_score >= min_score); count_stmt = count_stmt.where(Analysis.match_score >= min_score)
    if max_score is not None:
        stmt = stmt.where(Analysis.match_score <= max_score); count_stmt = count_stmt.where(Analysis.match_score <= max_score)
    total = db.scalar(count_stmt) or 0
    rows = db.scalars(stmt.order_by(Analysis.created_at.desc()).offset(offset).limit(limit)).all()
    return HistoryPage(items=[serialize(r) for r in rows], total=total, limit=limit, offset=offset)


@app.get("/api/v1/analyses/{analysis_id}", response_model=AnalysisOut)
def get_analysis(analysis_id: int, db: Session = Depends(get_db)):
    row = db.get(Analysis, analysis_id)
    if not row: raise HTTPException(404, "Analysis not found.")
    return serialize(row)

@app.delete("/api/v1/analyses/{analysis_id}")
def delete_analysis(analysis_id: int, db: Session = Depends(get_db)):
    row = db.get(Analysis, analysis_id)
    if not row: raise HTTPException(404, "Analysis not found.")
    db.delete(row); db.commit()
    return {"deleted": True}
