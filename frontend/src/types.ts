export type Evidence = { skill: string; evidence: string }
export type Question = { question: string; rationale: string }
export type Report = { candidate_name: string; match_score: number; score_rationale: string; matching_skills: Evidence[]; skill_gaps: Evidence[]; interview_questions: Question[] }
export type Analysis = { id: number; candidate_name: string; match_score: number; provider: string; created_at: string; report: Report }
export type History = { items: Analysis[]; total: number; limit: number; offset: number }
