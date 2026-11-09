import pytest
from pydantic import ValidationError
from app.schemas import MatchReport

def valid():
    return {
        "candidate_name":"A Candidate", "match_score":78, "score_rationale":"Good overlap in core requirements.",
        "matching_skills":[{"skill":f"Skill {i}","evidence":"Explicitly listed in resume."} for i in range(5)],
        "skill_gaps":[{"skill":f"Gap {i}","evidence":"Not evidenced in resume."} for i in range(3)],
        "interview_questions":[{"question":f"Explain project {i} in detail?","rationale":"Validate depth."} for i in range(3)]
    }

def test_valid_report():
    assert MatchReport.model_validate(valid()).match_score == 78

def test_score_bounds():
    data = valid(); data["match_score"] = 120
    with pytest.raises(ValidationError): MatchReport.model_validate(data)

def test_exact_lists():
    data = valid(); data["skill_gaps"] = []
    with pytest.raises(ValidationError): MatchReport.model_validate(data)
