from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator

class SkillEvidence(BaseModel):
    skill: str = Field(min_length=1, max_length=100)
    evidence: str = Field(min_length=1, max_length=500)

class InterviewQuestion(BaseModel):
    question: str = Field(min_length=5, max_length=500)
    rationale: str = Field(min_length=3, max_length=300)

class MatchReport(BaseModel):
    candidate_name: str = Field(default="Unknown candidate", max_length=200)
    match_score: int = Field(ge=0, le=100)
    score_rationale: str = Field(min_length=10, max_length=1500)
    matching_skills: list[SkillEvidence] = Field(min_length=5, max_length=5)
    skill_gaps: list[SkillEvidence] = Field(min_length=3, max_length=3)
    interview_questions: list[InterviewQuestion] = Field(min_length=3, max_length=3)

    @field_validator("candidate_name")
    @classmethod
    def clean_name(cls, v):
        return v.strip() or "Unknown candidate"

class AnalysisOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    candidate_name: str
    match_score: int
    provider: str
    created_at: datetime
    report: MatchReport

class HistoryPage(BaseModel):
    items: list[AnalysisOut]
    total: int
    limit: int
    offset: int
